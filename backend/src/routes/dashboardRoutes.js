const express = require("express");

const { getDashboardStats } = require("../controllers/dashboardController");

const protect = require("../middlewares/authMiddleware");
const adminOnly = require("../middlewares/adminMiddleware");

const router = express.Router();

router.get("/stats", protect, adminOnly, getDashboardStats);

module.exports = router;
