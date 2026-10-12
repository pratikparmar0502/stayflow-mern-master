const express = require("express");

const {
  getBookings,
  getBookingById,
  createBooking,
  deleteBooking,
  getMyBookings,
  cancelMyBooking,

  // Admin booking lifecycle actions
  confirmBooking,
  cancelBooking,
  completeBooking,
} = require("../controllers/bookingController");

const protect = require("../middlewares/authMiddleware");
const adminOnly = require("../middlewares/adminMiddleware");

const router = express.Router();

// ==========================================
// USER ROUTES
// ==========================================

// Create a booking
router.post("/", protect, createBooking);

// Get logged-in user's bookings
router.get("/my", protect, getMyBookings);

// Cancel logged-in user's own booking
router.patch("/my/:id/cancel", protect, cancelMyBooking);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get all bookings
router.get("/", protect, adminOnly, getBookings);

// Get single booking
router.get("/:id", protect, adminOnly, getBookingById);

// ------------------------------------------
// ADMIN BOOKING LIFECYCLE
// ------------------------------------------

// pending → confirmed
router.patch("/:id/confirm", protect, adminOnly, confirmBooking);

// pending → cancelled
router.patch("/:id/cancel", protect, adminOnly, cancelBooking);

// confirmed → completed
router.patch("/:id/complete", protect, adminOnly, completeBooking);

// ==========================================
// DELETE
// ==========================================

router.delete("/:id", protect, adminOnly, deleteBooking);

module.exports = router;
