const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");

// ==========================================
// GET ALL BOOKINGS
// ==========================================
// Admin can use this to see all bookings.
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("hotel", "name location price image")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE BOOKING
// ==========================================
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("hotel", "name location price image");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};

// ==========================================
// GET MY BOOKINGS
// ==========================================
// Returns bookings belonging only to the
// currently logged-in user.
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.id,
    })
      .populate("hotel", "name location price image")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch your bookings",
      error: error.message,
    });
  }
};

// ==========================================
// CREATE BOOKING
// ==========================================
// Server-authoritative pricing.
// The client sends hotel ID, room category ID,
// dates, guest count, and room quantity.
// Everything else is calculated here from DB data.
const createBooking = async (req, res) => {
  try {
    const {
      hotel,
      checkIn,
      checkOut,
      customerName,
      roomCategoryId,
      roomQuantity: rawRoomQty,
      guestCount: rawGuestCount,
    } = req.body;

    // Basic validation
    if (!hotel || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Hotel, check-in and check-out are required",
      });
    }

    // Find the actual hotel from MongoDB
    const selectedHotel = await Hotel.findById(hotel);

    if (!selectedHotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // Validate booking dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out date",
      });
    }

    // Check-in must not be in the past (compare date only, not time)
    const todayStr = new Date().toISOString().split("T")[0];
    const checkInStr = checkInDate.toISOString().split("T")[0];
    if (checkInStr < todayStr) {
      return res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past",
      });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date",
      });
    }

    // Calculate number of nights (server-side, authoritative)
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.ceil((checkOutDate - checkInDate) / millisecondsPerDay);

    if (nights < 1) {
      return res.status(400).json({
        success: false,
        message: "Booking must be for at least one night",
      });
    }

    // ======================================================
    // ROOM CATEGORY RESOLUTION
    // ======================================================
    // If a roomCategoryId was provided, validate it against
    // the hotel's embedded categories.
    // If no roomCategoryId, fall back to the hotel base price
    // for backward-compatibility with older bookings.
    // ======================================================

    let pricePerNight;
    let roomCatName = "";
    let roomCatIdToStore = null;
    let resolvedMaxOccupancy = null;

    const roomQty = Math.max(1, parseInt(rawRoomQty, 10) || 1);
    const guestCount = Math.max(1, parseInt(rawGuestCount, 10) || 1);

    if (roomCategoryId) {
      // Find the category within the hotel's embedded array
      const cat = selectedHotel.roomCategories
        ? selectedHotel.roomCategories.find(
            (c) => c._id.toString() === roomCategoryId && c.isActive !== false,
          )
        : null;

      if (!cat) {
        return res.status(400).json({
          success: false,
          message: "Room category not found or not available for this hotel",
        });
      }

      // Validate room quantity
      if (roomQty > cat.totalRooms) {
        return res.status(400).json({
          success: false,
          message: `Only ${cat.totalRooms} room(s) of this category are available`,
        });
      }

      // Validate guest count against occupancy
      // Rule: total guests must not exceed (maxOccupancy × roomQuantity)
      resolvedMaxOccupancy = cat.maxOccupancy;
      const maxAllowedGuests = cat.maxOccupancy * roomQty;
      if (guestCount > maxAllowedGuests) {
        return res.status(400).json({
          success: false,
          message: `Guest count (${guestCount}) exceeds the maximum occupancy for ${roomQty} room(s) of this category (${maxAllowedGuests} guests max)`,
        });
      }

      pricePerNight = cat.pricePerNight;
      roomCatName = cat.name;
      roomCatIdToStore = cat._id;
    } else {
      // No room category: use hotel base price (legacy behavior)
      pricePerNight = selectedHotel.price;
      roomCatName = "";
      roomCatIdToStore = null;
    }

    // ======================================================
    // SERVER-AUTHORITATIVE PRICING
    // Never trust client-submitted price, subtotal, or total.
    // ======================================================

    const roomSubtotal = pricePerNight * roomQty * nights;

    // 5% service fee (consistent with existing implementation)
    const serviceFee = Math.round(roomSubtotal * 0.05);
    const finalAmount = roomSubtotal + serviceFee;

    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      hotel: selectedHotel._id,

      customerName: customerName || req.user.name || req.user.email || "Guest",

      hotelName: selectedHotel.name,
      hotelImage: selectedHotel.image || "",

      checkIn: checkInDate,
      checkOut: checkOutDate,

      // Server-calculated final amount (what Razorpay will charge)
      amount: finalAmount,

      // Every new booking starts as pending.
      status: "pending",

      // Payment is separate from booking status.
      paymentStatus: "pending",

      // Room booking snapshot
      roomCategoryId: roomCatIdToStore,
      roomCategoryName: roomCatName,
      roomPricePerNight: pricePerNight,
      roomQuantity: roomQty,
      nights,
      guestCount,
      roomSubtotal,
      serviceFee,
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
      // Return pricing breakdown for checkout confirmation
      pricingBreakdown: {
        pricePerNight,
        roomQuantity: roomQty,
        nights,
        roomSubtotal,
        serviceFee,
        finalAmount,
        roomCategoryName: roomCatName,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

// ==========================================
// CANCEL MY BOOKING
// ==========================================
// A normal user can cancel only their own
// booking.
const cancelMyBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed bookings cannot be cancelled",
      });
    }

    booking.status = "cancelled";

    await booking.save();

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
};

// ==========================================
// CONFIRM BOOKING
// ==========================================
// Allowed transition:
//
// pending → confirmed
//
// Any other transition is rejected.
const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be confirmed",
      });
    }

    // Payment must be completed before confirmation.
    if (booking.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Booking can be confirmed only after successful payment",
      });
    }

    booking.status = "confirmed";

    await booking.save();

    return res.json({
      success: true,
      message: "Booking confirmed successfully",
      booking,
    });
  } catch (error) {
    console.error("Confirm booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to confirm booking",
    });
  }
};

// ==========================================
// CANCEL BOOKING - ADMIN
// ==========================================
// Allowed transition:
//
// pending → cancelled
//
// A confirmed/completed/cancelled booking
// cannot be cancelled through this admin action.
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Only pending bookings can be cancelled
    // through the admin lifecycle.
    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${booking.status} booking`,
      });
    }

    booking.status = "cancelled";

    await booking.save();

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
};

// ==========================================
// COMPLETE BOOKING
// ==========================================
// Allowed transition:
//
// confirmed → completed
//
// Pending/cancelled/completed bookings
// cannot be completed.
const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Only confirmed bookings can be completed.
    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: `Cannot complete a ${booking.status} booking`,
      });
    }

    booking.status = "completed";

    await booking.save();

    res.json({
      success: true,
      message: "Booking completed successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to complete booking",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE BOOKING
// ==========================================
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete booking",
      error: error.message,
    });
  }
};

module.exports = {
  getBookings,
  getBookingById,
  getMyBookings,
  cancelMyBooking,
  createBooking,

  // Admin lifecycle actions
  confirmBooking,
  cancelBooking,
  completeBooking,

  deleteBooking,
};
