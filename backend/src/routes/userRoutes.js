const express = require("express");

const {
  getMe,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const protect = require("../middlewares/authMiddleware");
const adminOnly = require("../middlewares/adminMiddleware");

const router = express.Router();

// ==========================================
// CURRENT USER
// ==========================================

router.get("/me", protect, getMe);

// ==========================================
// ADMIN USER MANAGEMENT
// ==========================================

router.get("/", protect, adminOnly, getUsers);

router.get("/:id", protect, adminOnly, getUserById);

router.patch("/:id", protect, adminOnly, updateUser);

router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;
