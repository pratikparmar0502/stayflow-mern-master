const express = require("express");

const { createPaymentOrder, verifyPayment } = require("../controllers/paymentController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Create Razorpay order
router.post("/create-order", protect, createPaymentOrder);

// Verify successful Razorpay payment
router.post("/verify", protect, verifyPayment);

module.exports = router;
