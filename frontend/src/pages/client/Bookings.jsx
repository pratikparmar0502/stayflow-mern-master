import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
} from "@mui/material";
import {
  ArrowBack,
  CalendarToday,
  Cancel,
  CheckCircle,
  ChevronRight,
  AccessTime,
  Verified,
  Diamond,
} from "@mui/icons-material";
import { useHistory } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { formatPrice } from "../../formatter";
import { MoodContext } from "../../context/MoodContext";
import { useContext } from "react";
import RazorpayCheckout from "@razorpay/razorpay-js/checkout";

const BACKEND_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const Bookings = () => {
  const history = useHistory();
  const { mood } = useContext(MoodContext);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  const moodColor =
    {
      nature: "#10b981",
      urban: "#ef4444",
      ocean: "#0ea5e9",
      romantic: "#ec4899",
      royal: "#f59e0b",
      default: "#3b82f6",
    }[mood] || "#3b82f6";

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

  const fetchMyBookings = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login to view your bookings.");
        history.push("/auth");
        return;
      }

      const response = await api.get("/bookings/my");
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);

      const message = error.response?.data?.message || "Failed to load your bookings.";

      toast.error(message);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");
        history.push("/auth");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return {
          label: "Confirmed",
          color: "success",
          icon: <CheckCircle fontSize="small" />,
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: "error",
          icon: <Cancel fontSize="small" />,
        };
      case "completed":
        return {
          label: "Completed",
          color: "info",
          icon: <Verified fontSize="small" />,
        };
      default:
        return {
          label: "Pending",
          color: "warning",
          icon: <AccessTime fontSize="small" />,
        };
    }
  };

  const filteredBookings = useMemo(() => {
    if (tabValue === 0) {
      return bookings.filter((booking) =>
        ["pending", "confirmed"].includes(booking.status?.toLowerCase()),
      );
    }

    if (tabValue === 1) {
      return bookings.filter((booking) => booking.status?.toLowerCase() === "completed");
    }

    return bookings.filter((booking) => booking.status?.toLowerCase() === "cancelled");
  }, [bookings, tabValue]);

  const handleCancelBooking = async (booking) => {
    if (!booking?._id) {
      toast.error("Booking information is missing.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to cancel this booking?");

    if (!confirmed) return;

    try {
      await api.patch(`/bookings/my/${booking._id}/cancel`);
      toast.success("Booking cancelled successfully.");
      setOpenDetail(false);
      await fetchMyBookings();
    } catch (error) {
      console.error("Cancel booking error:", error);

      toast.error(error.response?.data?.message || "Failed to cancel booking.");
    }
  };

  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setOpenDetail(true);
  };

  const handlePayNow = async (booking) => {
    try {
      if (!booking?._id) {
        toast.error("Booking information is missing.");
        return;
      }

      if (booking.paymentStatus === "paid") {
        toast.error("This booking is already paid.");
        return;
      }

      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : {};

      // ==========================================
      // CREATE PAYMENT ORDER
      // ==========================================

      const orderResponse = await api.post("/payments/create-order", {
        bookingId: booking._id,
      });

      const { order, keyId } = orderResponse.data;

      // ==========================================
      // OPEN RAZORPAY
      // ==========================================

      const checkout = await RazorpayCheckout({
        key: keyId,

        order_id: order.id,

        amount: order.amount,

        currency: order.currency,

        name: "StayFlow Hotels",

        description: `Payment for ${booking.hotelName}`,

        prefill: {
          name: user.name || booking.customerName || "Guest",
          email: user.email || "",
        },

        modal: {
          ondismiss: () => {
            toast("Payment was cancelled. Your booking is still pending payment.", {
              icon: "ℹ️",
              duration: 4000,
            });
            fetchMyBookings();
          },
        },

        handler: async (paymentResponse) => {
          try {
            await api.post("/payments/verify", {
              bookingId: booking._id,

              razorpay_order_id: paymentResponse.razorpay_order_id,

              razorpay_payment_id: paymentResponse.razorpay_payment_id,

              razorpay_signature: paymentResponse.razorpay_signature,
            });

            toast.success("Payment successful! Booking confirmed.");

            await fetchMyBookings();
            if (openDetail) {
              setOpenDetail(false);
            }
          } catch (error) {
            console.error("Payment verification error:", error);

            toast.error(error.response?.data?.message || "Payment verification failed.");
            await fetchMyBookings();
          }
        },
      });

      checkout.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response);
        toast.error(
          response.error?.description ||
            "Payment failed. Your booking remains pending payment."
        );
        fetchMyBookings();
      });

      checkout.open();
    } catch (error) {
      console.error("Pay now error:", error);

      toast.error(error.response?.data?.message || "Unable to start payment.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress sx={{ color: moodColor }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 10 }}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${moodColor} 0%, ${moodColor}cc 100%)`,
          py: 5,
          color: "white",
          borderRadius: "0 0 30px 30px",
          mb: 4,
        }}
      >
        <Container>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => history.push("/")}
            sx={{ color: "white", mb: 2, textTransform: "none" }}
          >
            Back to Home
          </Button>

          <Typography variant="h3" fontWeight={900}>
            My Bookings
          </Typography>

          <Typography sx={{ mt: 1, opacity: 0.9 }}>
            View and manage your StayFlow hotel bookings.
          </Typography>
        </Container>
      </Box>

      <Container>
        <Tabs
          value={tabValue}
          onChange={(event, value) => setTabValue(value)}
          sx={{
            mb: 4,
            bgcolor: "white",
            borderRadius: "15px",
            p: 1,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
          variant="fullWidth"
        >
          <Tab label="Upcoming" />
          <Tab label="Completed" />
          <Tab label="Cancelled" />
        </Tabs>

        {bookings.length === 0 ? (
          <Card sx={{ p: 5, textAlign: "center", borderRadius: "20px" }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              No bookings found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              You haven't made any hotel bookings yet.
            </Typography>
            <Button variant="contained" onClick={() => history.push("/")}>
              Explore Hotels
            </Button>
          </Card>
        ) : filteredBookings.length === 0 ? (
          <Typography sx={{ textAlign: "center", py: 10, color: "text.secondary" }}>
            No bookings found in this section.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {filteredBookings.map((booking) => {
              const status = getStatusConfig(booking.status);
              const canCancel = ["pending", "confirmed"].includes(booking.status?.toLowerCase());

              return (
                <Grid item xs={12} sm={6} md={4} key={booking._id}>
                  <Card
                    sx={{
                      borderRadius: "20px",
                      overflow: "hidden",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                    }}
                  >
                    <Box sx={{ position: "relative" }}>
                      <CardMedia
                        component="img"
                        height="210"
                        image={
                          getImageUrl(booking.hotelImage) ||
                          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800"
                        }
                        alt={booking.hotelName || "Hotel"}
                        sx={{
                          objectFit: "cover",
                          filter:
                            booking.status?.toLowerCase() === "cancelled" ? "grayscale(1)" : "none",
                        }}
                      />

                      <Chip
                        icon={status.icon}
                        label={status.label}
                        color={status.color}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          fontWeight: 700,
                        }}
                      />
                    </Box>

                    <CardContent sx={{ p: 2.5, flex: 1 }}>
                      <Typography variant="h6" fontWeight={800} noWrap>
                        {booking.hotelName || "Hotel"}
                      </Typography>

                      {booking.roomCategoryName && (
                        <Typography variant="caption" sx={{ color: moodColor, fontWeight: 700, display: "block" }}>
                          {booking.roomCategoryName} {booking.roomQuantity > 1 ? `(${booking.roomQuantity} rooms)` : ""}
                        </Typography>
                      )}

                      {booking.hotel?.location && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {booking.hotel.location}
                        </Typography>
                      )}

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 2 }}
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Check-in
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {formatDate(booking.checkIn)}
                          </Typography>
                        </Box>

                        <ChevronRight sx={{ color: "text.secondary" }} />

                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="caption" color="text.secondary">
                            Check-out
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {formatDate(booking.checkOut)}
                          </Typography>
                        </Box>
                      </Stack>

                      <Divider sx={{ mb: 2 }} />

                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Total Amount
                          </Typography>
                          <Typography variant="h5" fontWeight={900} sx={{ color: moodColor }}>
                            {formatPrice(booking.amount)}
                          </Typography>
                        </Box>
                        <Chip
                          label={
                            booking.paymentStatus === "paid"
                              ? "Paid"
                              : booking.paymentStatus === "failed"
                              ? "Payment Failed"
                              : "Payment Pending"
                          }
                          color={
                            booking.paymentStatus === "paid"
                              ? "success"
                              : booking.paymentStatus === "failed"
                              ? "error"
                              : "warning"
                          }
                          size="small"
                          sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                        />
                      </Stack>

                      <Stack spacing={1.2}>
                        <Button
                          variant="contained"
                          onClick={() => openBookingDetails(booking)}
                          sx={{
                            borderRadius: "12px",
                            textTransform: "none",
                            fontWeight: 700,
                            bgcolor: moodColor,
                            "&:hover": {
                              bgcolor: moodColor,
                              filter: "brightness(0.92)",
                            },
                          }}
                        >
                          View Details
                        </Button>

                        {booking.paymentStatus !== "paid" &&
                          ["pending", "confirmed"].includes(booking.status?.toLowerCase()) && (
                            <Button
                              variant="contained"
                              onClick={() => handlePayNow(booking)}
                              sx={{
                                borderRadius: "12px",
                                textTransform: "none",
                                fontWeight: 700,
                                bgcolor: "#16a34a",
                                "&:hover": {
                                  bgcolor: "#15803d",
                                },
                              }}
                            >
                              Pay Now
                            </Button>
                          )}

                        {booking.paymentStatus === "paid" && (
                          <Button
                            variant="outlined"
                            color="success"
                            disabled
                            sx={{
                              borderRadius: "12px",
                              textTransform: "none",
                              fontWeight: 700,
                            }}
                          >
                            Payment Completed
                          </Button>
                        )}

                        {canCancel && (
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleCancelBooking(booking)}
                            sx={{
                              borderRadius: "12px",
                              textTransform: "none",
                              fontWeight: 700,
                            }}
                          >
                            Cancel Booking
                          </Button>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      <Dialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "24px", overflow: "hidden" } }}
      >
        {selectedBooking && (
          <>
            <Box sx={{ position: "relative", height: 210 }}>
              <CardMedia
                component="img"
                image={
                  getImageUrl(selectedBooking.hotelImage) ||
                  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800"
                }
                alt={selectedBooking.hotelName || "Hotel"}
                sx={{ height: "100%", objectFit: "cover" }}
              />

              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.75) 100%)",
                }}
              />

              <Box sx={{ position: "absolute", bottom: 18, left: 20, right: 20 }}>
                <Typography variant="h5" color="white" fontWeight={900}>
                  {selectedBooking.hotelName}
                </Typography>

                <Chip
                  label={selectedBooking.status?.toUpperCase() || "PENDING"}
                  size="small"
                  sx={{ mt: 1, bgcolor: "white", fontWeight: 800 }}
                />
              </Box>
            </Box>

            <DialogContent sx={{ p: 3, bgcolor: "#f8fafc" }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                      <Verified sx={{ color: moodColor }} />
                      <Typography fontWeight={800}>Booking Details</Typography>
                    </Stack>

                    <Stack spacing={1.2}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                        <Typography color="text.secondary">Guest</Typography>
                        <Typography fontWeight={700}>
                          {selectedBooking.customerName || "Guest"}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                        <Typography color="text.secondary">Booking ID</Typography>
                        <Typography fontWeight={700} sx={{ wordBreak: "break-all" }}>
                          #{selectedBooking._id?.slice(-8).toUpperCase()}
                        </Typography>
                      </Box>

                      {selectedBooking.roomCategoryName && (
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                          <Typography color="text.secondary">Room Type</Typography>
                          <Typography fontWeight={700}>
                            {selectedBooking.roomCategoryName}{" "}
                            {selectedBooking.roomQuantity > 1 ? `(${selectedBooking.roomQuantity} Rooms)` : ""}
                          </Typography>
                        </Box>
                      )}

                      {selectedBooking.guestCount && (
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                          <Typography color="text.secondary">Guests</Typography>
                          <Typography fontWeight={700}>
                            {selectedBooking.guestCount}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                        <Typography color="text.secondary">Payment Status</Typography>
                        <Chip
                          label={
                            selectedBooking.paymentStatus === "paid"
                              ? "PAID"
                              : selectedBooking.paymentStatus === "failed"
                              ? "FAILED"
                              : "PENDING PAYMENT"
                          }
                          size="small"
                          color={
                            selectedBooking.paymentStatus === "paid"
                              ? "success"
                              : selectedBooking.paymentStatus === "failed"
                              ? "error"
                              : "warning"
                          }
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                      <CalendarToday sx={{ color: "#3b82f6" }} />
                      <Typography fontWeight={800}>Stay Duration</Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Check-in
                        </Typography>
                        <Typography fontWeight={700}>
                          {formatDate(selectedBooking.checkIn)}
                        </Typography>
                      </Box>

                      <ChevronRight sx={{ color: "#cbd5e1" }} />

                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="caption" color="text.secondary">
                          Check-out
                        </Typography>
                        <Typography fontWeight={700}>
                          {formatDate(selectedBooking.checkOut)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: "16px",
                      background: `linear-gradient(135deg, ${moodColor} 0%, ${moodColor}cc 100%)`,
                      color: "white",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Total Booking Amount
                      </Typography>
                      <Typography variant="h4" fontWeight={900}>
                        {formatPrice(selectedBooking.amount)}
                      </Typography>
                    </Box>
                    <Diamond sx={{ fontSize: 40, opacity: 0.3 }} />
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc", gap: 1 }}>
              {selectedBooking &&
                selectedBooking.paymentStatus !== "paid" &&
                ["pending", "confirmed"].includes(selectedBooking.status?.toLowerCase()) && (
                  <Button
                    variant="contained"
                    onClick={() => handlePayNow(selectedBooking)}
                    sx={{
                      borderRadius: "12px",
                      fontWeight: 700,
                      bgcolor: "#16a34a",
                      "&:hover": {
                        bgcolor: "#15803d",
                      },
                    }}
                  >
                    Pay Now
                  </Button>
                )}

              {selectedBooking &&
                ["pending", "confirmed"].includes(selectedBooking.status?.toLowerCase()) && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleCancelBooking(selectedBooking)}
                    sx={{ borderRadius: "12px", fontWeight: 700 }}
                  >
                    Cancel Booking
                  </Button>
                )}

              <Button
                variant="contained"
                onClick={() => setOpenDetail(false)}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 700,
                  bgcolor: moodColor,
                  "&:hover": {
                    bgcolor: moodColor,
                    filter: "brightness(0.92)",
                  },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Bookings;
