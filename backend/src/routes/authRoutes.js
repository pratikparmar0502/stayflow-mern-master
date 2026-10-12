const express = require("express");
const { registerUser, loginUser, createFirstAdmin } = require("../controllers/authController");

const router = express.Router();

// Register
router.post("/register", registerUser);

router.post("/create-first-admin", createFirstAdmin);

// Login
router.post("/login", loginUser);

module.exports = router;
