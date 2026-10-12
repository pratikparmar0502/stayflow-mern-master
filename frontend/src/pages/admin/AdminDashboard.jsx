import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import HotelIcon from "@mui/icons-material/Hotel";
import MoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";

import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Stack,
  alpha,
  useTheme,
  useMediaQuery,
  MenuItem,
  TextField,
} from "@mui/material";

import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ---------------------------------------------------------
  // Dashboard summary statistics
  // ---------------------------------------------------------
  const [stats, setStats] = useState({
    totalHotels: 0,
    totalRevenue: 0,
    totalCustomer: 0,
  });

  // ---------------------------------------------------------
  // Month and year selection for revenue chart
  // ---------------------------------------------------------
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Stores confirmed bookings used by the revenue chart
  const [allBookings, setAllBookings] = useState([]);

  // Final data passed to Recharts
  const [analyticsData, setAnalyticsData] = useState([]);

  // ---------------------------------------------------------
  // Month names
  // ---------------------------------------------------------
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // ---------------------------------------------------------
  // Available years
  // ---------------------------------------------------------
  const startYear = 2024;
  const currentYear = new Date().getFullYear();

  const years = [];

  for (let year = startYear; year <= currentYear + 1; year++) {
    years.push(year);
  }

  // ---------------------------------------------------------
  // Load dashboard statistics and bookings
  // ---------------------------------------------------------
  const loadStats = async () => {
    try {
      /*
       * We need:
       *
       * 1. Dashboard statistics
       * 2. Confirmed bookings for the daily revenue chart
       *
       * Both requests can run at the same time.
       */
      const [dashboardResponse, bookingsResponse] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/bookings"),
      ]);

      // -------------------------------------------------------
      // Dashboard summary
      // -------------------------------------------------------
      const dashboardStats = dashboardResponse.data.stats || {};

      setStats({
        totalHotels: dashboardStats.totalHotels || 0,
        totalRevenue: dashboardStats.totalRevenue || 0,
        totalCustomer: dashboardStats.totalUsers || 0,
      });

      // -------------------------------------------------------
      // Booking data for chart
      // -------------------------------------------------------
      const bookings = bookingsResponse.data.bookings || [];

      // Only confirmed bookings contribute to revenue
      const confirmedBookings = bookings.filter(
        (booking) => booking.status?.toLowerCase() === "confirmed",
      );

      setAllBookings(confirmedBookings);
    } catch (error) {
      console.error("Dashboard Error:", error);

      const message = error.response?.data?.message || "Failed to load dashboard data";

      toast.error(message);
    }
  };

  // ---------------------------------------------------------
  // Create daily revenue data for selected month/year
  // ---------------------------------------------------------
  useEffect(() => {
    /*
     * Find the number of days in the selected month.
     *
     * Example:
     * February 2026 -> 28
     * March 2026    -> 31
     */
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    // Create one entry for every day with initial revenue = 0
    const dailyData = Array.from({ length: daysInMonth }, (_, index) => ({
      date: index + 1,
      revenue: 0,
    }));

    // -------------------------------------------------------
    // Add confirmed booking revenue to the correct day
    // -------------------------------------------------------
    allBookings.forEach((booking) => {
      const dateObj = new Date(booking.createdAt || booking.checkIn);

      if (dateObj.getMonth() === selectedMonth && dateObj.getFullYear() === selectedYear) {
        const day = dateObj.getDate();

        const price = Number(booking.amount || 0);

        dailyData[day - 1].revenue += price;
      }
    });

    setAnalyticsData(dailyData);
  }, [selectedMonth, selectedYear, allBookings]);

  // ---------------------------------------------------------
  // Load dashboard data when component mounts
  // ---------------------------------------------------------
  useEffect(() => {
    loadStats();
  }, []);

  // ---------------------------------------------------------
  // Dashboard cards
  // ---------------------------------------------------------
  const statCards = [
    {
      label: "Revenue",
      val: `₹ ${Number(stats.totalRevenue || 0).toLocaleString("en-IN")}`,
      color: "#10b981",
      icon: <MoneyIcon />,
    },
    {
      label: "Total Hotels",
      val: stats.totalHotels,
      color: "#3b82f6",
      icon: <HotelIcon />,
    },
    {
      label: "Occupancy",
      val: "88%",
      color: "#f59e0b",
      icon: <CalendarIcon />,
    },
    {
      label: "Active Guests",
      val: stats.totalCustomer,
      color: "#8b5cf6",
      icon: <PeopleIcon />,
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        overflowX: "hidden",
      }}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}
      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "flex-start" : "center"}
        sx={{ mb: 4 }}
        spacing={2}
      >
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900} sx={{ color: "#1e293b" }}>
            Welcome Back!
          </Typography>

          <Typography variant="body2" color="textSecondary">
            Here's what's happening in {months[selectedMonth]}.
          </Typography>
        </Box>

        {/* ===================================================
            MONTH / YEAR FILTER
        ==================================================== */}
        <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
          {/* Month Dropdown */}
          <TextField
            select
            size="small"
            label="Month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(Number(event.target.value))}
            sx={{
              minWidth: 140,
              bgcolor: "white",
              borderRadius: "8px",
            }}
          >
            {months.map((month, index) => (
              <MenuItem key={month} value={index}>
                {month}
              </MenuItem>
            ))}
          </TextField>

          {/* Year Dropdown */}
          <TextField
            select
            size="small"
            label="Year"
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            sx={{
              minWidth: 100,
              bgcolor: "white",
              borderRadius: "8px",
            }}
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>

      {/* =====================================================
          STAT CARDS
      ====================================================== */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: "24px",
                border: "1px solid",
                borderColor: alpha("#cbd5e1", 0.3),
                background: "white",
                transition: "0.2s",

                "&:hover": {
                  transform: "translateY(-5px)",
                },
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="textSecondary"
                    sx={{
                      textTransform: "uppercase",
                    }}
                  >
                    {stat.label}
                  </Typography>

                  <Typography variant={isMobile ? "h5" : "h4"} fontWeight={800} sx={{ mt: 0.5 }}>
                    {stat.val}
                  </Typography>
                </Box>

                <Avatar
                  sx={{
                    bgcolor: alpha(stat.color, 0.1),
                    color: stat.color,
                    width: 56,
                    height: 56,
                  }}
                >
                  {stat.icon}
                </Avatar>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* =====================================================
          REVENUE CHART
      ====================================================== */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: { xs: 2, md: 4 },
              borderRadius: "24px",
              border: "1px solid",
              borderColor: alpha("#cbd5e1", 0.3),
            }}
          >
            <Typography variant="h6" fontWeight={800} mb={3}>
              Daily Revenue - {months[selectedMonth]} {selectedYear}
            </Typography>

            <Box
              sx={{
                width: "100%",
                height: isMobile ? 250 : 350,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analyticsData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />

                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 12,
                      fontWeight: 600,
                      fill: "#64748b",
                    }}
                    label={{
                      value: "Date",
                      position: "insideBottomRight",
                      offset: -5,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 12,
                      fill: "#64748b",
                    }}
                    tickFormatter={(value) => `₹${value}`}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value) => [
                      `₹${Number(value || 0).toLocaleString("en-IN")}`,
                      "REVENUE",
                    ]}
                    labelFormatter={(label) => `Date: ${label} ${months[selectedMonth]}`}
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    activeDot={{
                      r: 8,
                      strokeWidth: 0,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
