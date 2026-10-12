const crypto = require("crypto");

const Booking = require("../models/Booking");
const razorpay = require("../config/razorpay");

// ==========================================
// CREATE RAZORPAY ORDER
// ==========================================

const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Cancelled bookings cannot be paid.
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled booking cannot be paid",
      });
    }

    // Completed bookings cannot be paid again.
    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed booking cannot be paid",
      });
    }

    // A paid booking should never create another payment order.
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This booking is already paid",
      });
    }

    // If an unpaid Razorpay order already exists,
    // reuse it instead of creating another order.
    if (booking.razorpayOrderId) {
      return res.status(200).json({
        success: true,
        message: "Existing payment order retrieved",
        order: {
          id: booking.razorpayOrderId,
          amount: Math.round(Number(booking.amount) * 100),
          currency: "INR",
        },
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingId: booking._id,
      });
    }

    const amountInPaise = Math.round(Number(booking.amount) * 100);

    if (!amountInPaise || amountInPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking amount",
      });
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `booking_${booking._id}`,
      notes: {
        bookingId: booking._id.toString(),
        userId: req.user.id.toString(),
      },
    });

    // Store the Razorpay order ID against this booking.
    booking.razorpayOrderId = order.id;
    await booking.save();

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
      bookingId: booking._id,
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

// ==========================================
// VERIFY RAZORPAY PAYMENT
// ==========================================

const verifyPayment = async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification data is incomplete",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Do not verify payment again for an already-paid booking.
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This booking is already paid",
      });
    }

    // Make sure the Razorpay order belongs to this booking.
    if (!booking.razorpayOrderId || booking.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order does not match this booking",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const generatedSignatureBuffer = Buffer.from(generatedSignature);
    const receivedSignatureBuffer = Buffer.from(razorpay_signature);

    // timingSafeEqual throws when buffer lengths are different.
    // Check the lengths first.
    if (generatedSignatureBuffer.length !== receivedSignatureBuffer.length) {
      booking.paymentStatus = "failed";
      await booking.save();

      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    const signaturesMatch = crypto.timingSafeEqual(
      generatedSignatureBuffer,
      receivedSignatureBuffer,
    );

    if (!signaturesMatch) {
      booking.paymentStatus = "failed";
      await booking.save();

      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // Payment is successfully verified.
    booking.paymentStatus = "paid";
    booking.paymentId = razorpay_payment_id;

    // Transition pending booking to confirmed on successful verified payment
    if (booking.status === "pending") {
      booking.status = "confirmed";
    }

    await booking.save();

    return res.json({
      success: true,
      message: "Payment verified successfully",
      booking: {
        id: booking._id,
        paymentStatus: booking.paymentStatus,
        paymentId: booking.paymentId,
        razorpayOrderId: booking.razorpayOrderId,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
};
