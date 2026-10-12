import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  Stack,
  Button,
  Avatar,
  Grid,
  Tooltip,
  useTheme,
  useMediaQuery,
  DialogActions,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";

import {
  CheckCircle,
  Cancel,
  Assessment,
  PendingActions,
  VerifiedUser,
  DoDisturbOn,
  DeleteForever,
  ImageNotSupported,
  Visibility,
} from "@mui/icons-material";

import api from "../../api/axios";
import toast from "react-hot-toast";

const AdminBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tabValue, setTabValue] = useState("all");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Backend URL used for uploaded hotel images.
  const BACKEND_URL = "http://localhost:5000";

  /*
   * Convert backend image paths into usable browser URLs.
   *
   * Example:
   *
   * /uploads/hotel.jpg
   *
   * becomes:
   *
   * http://localhost:5000/uploads/hotel.jpg
   */
  const getImageUrl = (image) => {
    if (!image) return "";

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    if (image.startsWith("/uploads/")) {
      return `${BACKEND_URL}${image}`;
    }

    return image;
  };

  /*
   * Fetch all bookings.
   *
   * New backend:
   * GET /api/bookings
   *
   * This route is protected and admin-only.
   * Axios automatically sends the JWT token.
   */
  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await api.get("/bookings");

      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error("Booking fetch error:", error);

      const message = error.response?.data?.message || "Failed to load bookings.";

      toast.error(message);

      /*
       * If the JWT is invalid/expired,
       * clear authentication data and send
       * the user back to login.
       */
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /*
   * Booking statistics
   */
  const stats = {
    total: bookings.length,

    pending: bookings.filter(
      (booking) => (booking.status?.toLowerCase() || "pending") === "pending",
    ).length,

    confirmed: bookings.filter((booking) => booking.status?.toLowerCase() === "confirmed").length,

    completed: bookings.filter((booking) => booking.status?.toLowerCase() === "completed").length,

    cancelled: bookings.filter((booking) => booking.status?.toLowerCase() === "cancelled").length,
  };
  /*
   * Delete booking
   *
   * New backend:
   * DELETE /api/bookings/:id
   */
  const deleteBooking = async (id) => {
    if (!window.confirm("Delete this booking?")) {
      return;
    }

    const toastId = toast.loading("Deleting...");

    try {
      await api.delete(`/bookings/${id}`);

      toast.success("Booking deleted successfully!", {
        id: toastId,
      });

      fetchData();
    } catch (error) {
      console.error("Delete booking error:", error);

      toast.error(error.response?.data?.message || "Delete failed.", {
        id: toastId,
      });
    }
  };
  // ==========================================
  // VIEW BOOKING DETAILS
  // ==========================================
  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
    setSelectedBooking(null);
  };

  // ==========================================
  // UPDATE BOOKING STATUS
  // ==========================================
  // Admin status changes now use dedicated
  // backend endpoints.
  //
  // pending   → confirmed
  // pending   → cancelled
  // confirmed → completed
  const updateStatus = async (id, action) => {
    const endpointMap = {
      confirm: `/bookings/${id}/confirm`,
      cancel: `/bookings/${id}/cancel`,
      complete: `/bookings/${id}/complete`,
    };

    const messageMap = {
      confirm: "Booking confirmed successfully!",
      cancel: "Booking cancelled successfully!",
      complete: "Booking completed successfully!",
    };

    const endpoint = endpointMap[action];

    if (!endpoint) {
      return;
    }

    const toastId = toast.loading(
      `${action.charAt(0).toUpperCase() + action.slice(1)}ing booking...`,
    );

    try {
      await api.patch(endpoint);

      toast.success(messageMap[action], {
        id: toastId,
      });

      fetchData();
    } catch (error) {
      console.error("Update booking error:", error);

      toast.error(error.response?.data?.message || "Booking update failed.", {
        id: toastId,
      });
    }
  };
  /*
   * Filter bookings by:
   *
   * 1. Status tab
   * 2. Check-in date range
   */
  const filteredBookings = bookings.filter((booking) => {
    const bookingStatus = booking.status?.toLowerCase() || "pending";

    // Status filter
    if (tabValue !== "all" && bookingStatus !== tabValue) {
      return false;
    }

    // Date filter
    if (startDate || endDate) {
      const bookingDate = new Date(booking.checkIn).getTime();

      if (startDate) {
        const start = new Date(startDate).getTime();

        if (bookingDate < start) {
          return false;
        }
      }

      if (endDate) {
        /*
         * Add one day so the selected end date
         * is included in the filter.
         */
        const endDateObj = new Date(endDate);

        endDateObj.setHours(23, 59, 59, 999);

        const end = endDateObj.getTime();

        if (bookingDate > end) {
          return false;
        }
      }
    }

    return true;
  });

  /*
   * Format date for display
   */
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const displayAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN");
  };

  /*
   * Loading screen
   */
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: {
          xs: 1,
          sm: 3,
        },
        bgcolor: "#f1f5f9",
        minHeight: "100vh",
      }}
    >
      {/* PAGE TITLE */}
      <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900} mb={4} color="#1e293b">
        Bookings Management
      </Typography>

      {/* STATS CARDS */}
      <Grid container spacing={2} mb={4}>
        {[
          {
            label: "Total",
            val: stats.total,
            col: "#6366f1",
            icon: <Assessment />,
          },
          {
            label: "Pending",
            val: stats.pending,
            col: "#f59e0b",
            icon: <PendingActions />,
          },
          {
            label: "Confirmed",
            val: stats.confirmed,
            col: "#10b981",
            icon: <VerifiedUser />,
          },
          {
            label: "Cancelled",
            val: stats.cancelled,
            col: "#ef4444",
            icon: <DoDisturbOn />,
          },
        ].map((stat, index) => (
          <Grid item xs={6} md={3} key={index}>
            <Paper
              sx={{
                p: 2,
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: `${stat.col}15`,
                  color: stat.col,
                  width: 40,
                  height: 40,
                }}
              >
                {stat.icon}
              </Avatar>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    lineHeight: 1,
                  }}
                >
                  {stat.label}
                </Typography>

                <Typography variant="h6" fontWeight={800}>
                  {stat.val}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* FILTERS & TABS */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            lg: "row",
          }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{
            xs: "stretch",
            lg: "center",
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(event, value) => setTabValue(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: {
                xs: 1,
                lg: 0,
              },
              borderColor: "divider",
            }}
          >
            <Tab label="All" value="all" />

            <Tab label="Pending" value="pending" />

            <Tab label="Confirmed" value="confirmed" />

            <Tab label="Completed" value="completed" />

            <Tab label="Cancelled" value="cancelled" />
          </Tabs>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
          >
            <TextField
              type="date"
              label="From"
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              fullWidth
            />

            <TextField
              type="date"
              label="To"
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              fullWidth
            />

            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              sx={{
                borderRadius: 2,
              }}
            >
              Clear
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* BOOKINGS TABLE */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
          overflowX: "auto",
        }}
      >
        <Table
          sx={{
            minWidth: 900,
          }}
        >
          <TableHead
            sx={{
              bgcolor: "#f8fafc",
            }}
          >
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 700,
                }}
              >
                Hotel
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                }}
              >
                Customer
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                }}
              >
                Dates
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                }}
              >
                Amount
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                }}
              >
                Booking Status
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                }}
              >
                Payment
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{
                    py: 6,
                  }}
                >
                  <Typography color="text.secondary">No bookings found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((row) => (
                <TableRow key={row._id} hover>
                  {/* HOTEL */}
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        variant="rounded"
                        src={getImageUrl(row.hotelImage)}
                        sx={{
                          width: 60,
                          height: 45,
                          bgcolor: "#f1f5f9",
                        }}
                      >
                        <ImageNotSupported />
                      </Avatar>

                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {row.hotelName}
                        </Typography>
                        {row.roomCategoryName && (
                          <Typography variant="caption" color="primary" fontWeight={600} display="block">
                            {row.roomCategoryName} {row.roomQuantity > 1 ? `(${row.roomQuantity} rooms)` : ""}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>

                  {/* CUSTOMER */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {row.customerName || "Guest"}
                    </Typography>

                    {row.user?.email && (
                      <Typography variant="caption" color="text.secondary">
                        {row.user.email}
                      </Typography>
                    )}
                  </TableCell>

                  {/* DATES */}
                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    >
                      {formatDate(row.checkIn)} — {formatDate(row.checkOut)}
                    </Typography>
                  </TableCell>

                  {/* AMOUNT */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={800}>
                      ₹ {displayAmount(row.amount)}
                    </Typography>
                  </TableCell>

                  {/* BOOKING STATUS */}
                  <TableCell>
                    <Chip
                      label={row.status || "pending"}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        fontSize: "10px",
                      }}
                      color={
                        row.status === "confirmed"
                          ? "success"
                          : row.status === "cancelled"
                            ? "error"
                            : row.status === "completed"
                              ? "info"
                              : "warning"
                      }
                    />
                  </TableCell>

                  {/* PAYMENT STATUS */}
                  <TableCell>
                    <Chip
                      label={
                        row.paymentStatus === "paid"
                          ? "PAID"
                          : row.paymentStatus === "failed"
                          ? "FAILED"
                          : "PENDING"
                      }
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "10px",
                      }}
                      color={
                        row.paymentStatus === "paid"
                          ? "success"
                          : row.paymentStatus === "failed"
                          ? "error"
                          : "warning"
                      }
                    />
                  </TableCell>

                  {/* ACTIONS */}
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {/* ======================================
VIEW BOOKING DETAILS
====================================== */}
                      <Tooltip title="View Booking Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(row)}
                          color="primary"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {/* ======================================
        PENDING → CONFIRMED
        ====================================== */}
                      {row.status === "pending" && (
                        <Tooltip title="Confirm Booking">
                          <IconButton
                            size="small"
                            onClick={() => updateStatus(row._id, "confirm")}
                            color="success"
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* ======================================
        PENDING → CANCELLED
        ====================================== */}
                      {row.status === "pending" && (
                        <Tooltip title="Cancel Booking">
                          <IconButton
                            size="small"
                            onClick={() => updateStatus(row._id, "cancel")}
                            color="warning"
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* ======================================
        CONFIRMED → COMPLETED
        ====================================== */}
                      {row.status === "confirmed" && (
                        <Tooltip title="Complete Booking">
                          <IconButton
                            size="small"
                            onClick={() => updateStatus(row._id, "complete")}
                            color="success"
                          >
                            <VerifiedUser fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* ======================================
        DELETE
        ====================================== */}
                      <Tooltip title="Delete Booking">
                        <IconButton
                          size="small"
                          onClick={() => deleteBooking(row._id)}
                          color="error"
                        >
                          <DeleteForever fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* ==========================================
    BOOKING DETAILS DIALOG
========================================== */}
      <Dialog open={openDetails} onClose={handleCloseDetails} fullWidth maxWidth="sm">
        <DialogTitle>Booking Details</DialogTitle>

        <DialogContent dividers>
          {selectedBooking && (
            <Stack spacing={2.5}>
              {/* HOTEL */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  variant="rounded"
                  src={getImageUrl(selectedBooking.hotelImage)}
                  sx={{
                    width: 80,
                    height: 60,
                    bgcolor: "#f1f5f9",
                  }}
                >
                  <ImageNotSupported />
                </Avatar>

                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    {selectedBooking.hotelName}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Hotel Booking
                  </Typography>
                </Box>
              </Stack>

              {/* BOOKING ID */}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Booking ID
                </Typography>

                <Typography variant="body2" fontWeight={700}>
                  {selectedBooking._id}
                </Typography>
              </Box>

              {/* CUSTOMER */}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Customer
                </Typography>

                <Typography variant="body1" fontWeight={700}>
                  {selectedBooking.customerName || "Guest"}
                </Typography>

                {selectedBooking.user?.email && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedBooking.user.email}
                  </Typography>
                )}
              </Box>

              {/* DATES */}
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={3}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Check-in
                  </Typography>

                  <Typography variant="body1" fontWeight={700}>
                    {formatDate(selectedBooking.checkIn)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Check-out
                  </Typography>

                  <Typography variant="body1" fontWeight={700}>
                    {formatDate(selectedBooking.checkOut)}
                  </Typography>
                </Box>
              </Stack>

              {/* ROOM TYPE IF PRESENT */}
              {selectedBooking.roomCategoryName && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Room Type & Quantity
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {selectedBooking.roomCategoryName} ({selectedBooking.roomQuantity || 1} Room{selectedBooking.roomQuantity > 1 ? "s" : ""})
                  </Typography>
                </Box>
              )}

              {/* AMOUNT */}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Amount
                </Typography>

                <Typography variant="h6" fontWeight={900}>
                  ₹ {displayAmount(selectedBooking.amount)}
                </Typography>
              </Box>

              {/* STATUS */}
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={2}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Booking Status
                  </Typography>

                  <Chip
                    label={selectedBooking.status || "pending"}
                    size="small"
                    color={
                      selectedBooking.status === "confirmed"
                        ? "success"
                        : selectedBooking.status === "cancelled"
                          ? "error"
                          : selectedBooking.status === "completed"
                            ? "info"
                            : "warning"
                    }
                    sx={{
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Payment Status
                  </Typography>

                  <Chip
                    label={selectedBooking.paymentStatus || "pending"}
                    size="small"
                    color={
                      selectedBooking.paymentStatus === "paid"
                        ? "success"
                        : selectedBooking.paymentStatus === "failed"
                          ? "error"
                          : "warning"
                    }
                    sx={{
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  />
                </Box>
              </Stack>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDetails} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminBooking;
