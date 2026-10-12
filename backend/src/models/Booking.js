const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      default: null,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    hotelName: {
      type: String,
      required: true,
      trim: true,
    },

    hotelImage: {
      type: String,
      default: "",
    },

    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    paymentId: {
      type: String,
      default: "",
    },

    razorpayOrderId: {
      type: String,
      default: "",
    },

    // =========================================================
    // ROOM BOOKING SNAPSHOT FIELDS (optional / backward-compatible)
    // Stored at booking time so that later admin price changes
    // do not alter the historical record.
    // =========================================================

    // Room category sub-document ID within the hotel
    roomCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Human-readable snapshot of the room category name
    roomCategoryName: {
      type: String,
      default: "",
      trim: true,
    },

    // Price per night at the time of booking
    roomPricePerNight: {
      type: Number,
      default: null,
    },

    // Number of rooms booked
    roomQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Number of nights (calculated server-side)
    nights: {
      type: Number,
      default: null,
    },

    // Guest count submitted by user
    guestCount: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Room subtotal before service fee
    roomSubtotal: {
      type: Number,
      default: null,
    },

    // Service fee amount
    serviceFee: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Booking", bookingSchema);
