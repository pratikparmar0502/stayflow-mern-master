const User = require("../models/User");
const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalHotels,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
    ] = await Promise.all([
      User.countDocuments(),
      Hotel.countDocuments(),
      Booking.countDocuments(),

      Booking.countDocuments({
        status: "confirmed",
      }),

      Booking.countDocuments({
        status: "pending",
      }),

      Booking.countDocuments({
        status: "cancelled",
      }),
    ]);

    // Calculate revenue from confirmed bookings
    const revenueResult = await Booking.aggregate([
      {
        $match: {
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalHotels,
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        totalRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};
