const express = require("express");

const {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
} = require("../controllers/hotelController");

const protect = require("../middlewares/authMiddleware");
const adminOnly = require("../middlewares/adminMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Public routes
router.get("/", getHotels);
router.get("/:id", getHotelById);

// Admin-only routes
router.post("/", protect, adminOnly, upload.single("image"), createHotel);
router.patch("/:id", protect, adminOnly, upload.single("image"), updateHotel);
router.delete("/:id", protect, adminOnly, deleteHotel);

module.exports = router;
