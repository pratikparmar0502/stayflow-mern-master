import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Divider,
  CircularProgress,
  Chip,
  Alert,
  Paper,
  IconButton,
} from "@mui/material";
import {
  ArrowBack,
  LocationOn,
  CalendarToday,
  People,
  Hotel as HotelIcon,
  CheckCircleOutline,
  ErrorOutline,
  Add,
  Remove,
  Star,
} from "@mui/icons-material";
import { MoodContext } from "../../context/MoodContext";
import { resolveAmenities } from "../../constants/amenities";
import { formatPrice } from "../../formatter";
import api from "../../api/axios";
import toast from "react-hot-toast";

const BACKEND_URL = "http://localhost:5000";

const getImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/uploads/")) return `${BACKEND_URL}${image}`;
  return image;
};

const getMoodColor = (mood) => {
  const colors = {
    nature: "#2e7d32",
    urban: "#d32f2f",
    ocean: "#0288d1",
    romantic: "#d81b60",
    royal: "#ffa000",
    default: "#1976d2",
  };
  return colors[mood] || colors.default;
};

const Checkout = () => {
  const history = useHistory();
  const location = useLocation();
  const { mood } = useContext(MoodContext);
  const themeColor = getMoodColor(mood);

  // ── Context from navigation ──────────────────────────────────────
  const { hotel: hotelFromState, checkIn, checkOut, guests } = location.state || {};

  // ── Hotel detail state ────────────────────────────────────────────
  const [hotel, setHotel] = useState(hotelFromState || null);
  const [hotelLoading, setHotelLoading] = useState(!hotelFromState);
  const [hotelError, setHotelError] = useState(null);

  // ── Room selection state ─────────────────────────────────────────
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [roomQuantity, setRoomQuantity] = useState(1);

  // ── Booking submit state ─────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  // ── Derived values ────────────────────────────────────────────────
  const checkInDate = React.useMemo(() => (checkIn ? new Date(checkIn) : null), [checkIn]);
  const checkOutDate = React.useMemo(() => (checkOut ? new Date(checkOut) : null), [checkOut]);
  const nights = React.useMemo(() => {
    return checkInDate && checkOutDate
      ? Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)))
      : 0;
  }, [checkInDate, checkOutDate]);

  const activeRooms = hotel
    ? (hotel.roomCategories || []).filter((c) => c.isActive !== false)
    : [];

  const selectedCategory = activeRooms.find((c) => c._id === selectedCategoryId) || null;

  // Set default category when hotel loads
  useEffect(() => {
    if (activeRooms.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(activeRooms[0]._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotel]);

  // ── Pricing ───────────────────────────────────────────────────────
  const pricePerNight = selectedCategory
    ? selectedCategory.pricePerNight
    : hotel
    ? hotel.price
    : 0;
  const roomSubtotal = pricePerNight * roomQuantity * nights;
  const serviceFee = Math.round(roomSubtotal * 0.05);
  const finalAmount = roomSubtotal + serviceFee;

  // ── Load hotel if not passed via state ───────────────────────────
  useEffect(() => {
    if (hotelFromState) {
      setHotel(hotelFromState);
      setHotelLoading(false);
      return;
    }
    // No hotel in state — try sessionStorage
    const saved = sessionStorage.getItem("checkoutHotel");
    if (saved) {
      try {
        setHotel(JSON.parse(saved));
        setHotelLoading(false);
      } catch {
        setHotelError("Could not restore hotel data.");
        setHotelLoading(false);
      }
    } else {
      setHotelError("No hotel selected. Please go back and choose a hotel.");
      setHotelLoading(false);
    }
  }, [hotelFromState]);

  // ── Persist hotel to sessionStorage so refresh works ─────────────
  useEffect(() => {
    if (hotel) {
      sessionStorage.setItem("checkoutHotel", JSON.stringify(hotel));
    }
  }, [hotel]);

  // ── Date validation ───────────────────────────────────────────────
  const dateError = useCallback(() => {
    if (!checkIn || !checkOut) return "Please select check-in and check-out dates.";
    if (!checkInDate || !checkOutDate) return "Invalid dates.";
    const todayStr = new Date().toISOString().split("T")[0];
    if (checkIn < todayStr) return "Check-in date cannot be in the past.";
    if (checkOutDate <= checkInDate) return "Check-out must be after check-in.";
    if (nights < 1) return "Booking must be at least one night.";
    return null;
  }, [checkIn, checkOut, checkInDate, checkOutDate, nights]);

  const dateErrMsg = dateError();

  // ── Guest validation ──────────────────────────────────────────────
  const guestCount = guests || 1;
  const maxAllowedGuests = selectedCategory
    ? selectedCategory.maxOccupancy * roomQuantity
    : Infinity;
  const guestOverflow = selectedCategory && guestCount > maxAllowedGuests;

  // ── Proceed to Payment ────────────────────────────────────────────
  const handleProceed = async () => {
    if (submitLockRef.current || submitting) return;
    submitLockRef.current = true;
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to continue.");
        history.push("/auth");
        return;
      }

      if (dateErrMsg) {
        toast.error(dateErrMsg);
        return;
      }

      if (guestOverflow) {
        toast.error(
          `Guest count (${guestCount}) exceeds the maximum occupancy for ${roomQuantity} room(s) (${maxAllowedGuests} guests max).`,
        );
        return;
      }

      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : {};

      // ── 1. CREATE BOOKING (server calculates price) ──────────────
      const bookingPayload = {
        hotel: hotel._id,
        checkIn,
        checkOut,
        customerName: user.name || user.email || "Guest",
        guestCount,
        roomQuantity,
      };
      if (selectedCategory) {
        bookingPayload.roomCategoryId = selectedCategory._id;
      }

      const bookingResponse = await api.post("/bookings", bookingPayload);
      const booking = bookingResponse.data.booking;

      if (!booking?._id) {
        throw new Error("Booking created but ID is missing.");
      }

      // Booking created successfully in Pending Payment status!
      toast.success("Booking created successfully! Please proceed to pay.");
      sessionStorage.removeItem("checkoutHotel");
      history.push("/bookings");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.response?.data?.message || error.message || "Checkout failed.");
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────
  if (hotelLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: themeColor }} />
      </Box>
    );
  }

  // ── No hotel / error state ────────────────────────────────────────
  if (hotelError || !hotel) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <ErrorOutline sx={{ fontSize: 80, color: "#ef4444", mb: 2 }} />
        <Typography variant="h5" fontWeight={800} gutterBottom>
          No hotel selected
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {hotelError || "Please go back and choose a hotel first."}
        </Typography>
        <Button
          variant="contained"
          onClick={() => history.push("/")}
          sx={{ borderRadius: "14px", bgcolor: themeColor }}
        >
          Browse Hotels
        </Button>
      </Container>
    );
  }

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const hotelAmenities = resolveAmenities(hotel.amenities || []);

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 10 }}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}cc 100%)`,
          py: 4,
          color: "white",
          borderRadius: "0 0 30px 30px",
          mb: 4,
        }}
      >
        <Container>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => history.goBack()}
            sx={{ color: "white", mb: 2, textTransform: "none" }}
          >
            Back
          </Button>
          <Typography variant="h4" fontWeight={900}>
            Review & Book
          </Typography>
          <Typography sx={{ mt: 0.5, opacity: 0.9, fontSize: "0.95rem" }}>
            Confirm your stay details before payment
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* ── LEFT: Hotel info + Room selection ──────────────────── */}
          <Grid item xs={12} md={8}>
            {/* Hotel summary card */}
            <Card sx={{ borderRadius: "20px", mb: 3, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              <Box sx={{ position: "relative", height: 220 }}>
                <Box
                  component="img"
                  src={getImageUrl(hotel.image)}
                  alt={hotel.name}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ""; }}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
                  }}
                />
                <Box sx={{ position: "absolute", bottom: 16, left: 20, right: 20 }}>
                  <Typography variant="h5" color="white" fontWeight={900}>
                    {hotel.name}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                    <LocationOn sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }} />
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                      {hotel.location}
                    </Typography>
                  </Stack>
                </Box>
                {hotel.rate > 0 && (
                  <Chip
                    icon={<Star sx={{ fontSize: "0.9rem !important", color: "#FFB300 !important" }} />}
                    label={hotel.rate}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 14,
                      right: 14,
                      bgcolor: "rgba(255,255,255,0.92)",
                      fontWeight: 800,
                    }}
                  />
                )}
              </Box>

              {/* Hotel amenities */}
              {hotelAmenities.length > 0 && (
                <CardContent sx={{ pt: 2.5 }}>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
                    What this place offers
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {hotelAmenities.map((a) => (
                      <Chip
                        key={a.id}
                        label={`${a.emoji} ${a.label}`}
                        size="small"
                        sx={{
                          bgcolor: `${themeColor}12`,
                          color: themeColor,
                          fontWeight: 600,
                          fontSize: "0.78rem",
                          border: `1px solid ${themeColor}30`,
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>
              )}
            </Card>

            {/* Trip summary */}
            <Paper
              elevation={0}
              sx={{ borderRadius: "20px", border: "1px solid #e2e8f0", p: 3, mb: 3 }}
            >
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarToday sx={{ color: themeColor, fontSize: "1.1rem" }} />
                Your Trip
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Check-In
                  </Typography>
                  <Typography fontWeight={700} fontSize="0.9rem">{formatDate(checkIn)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Check-Out
                  </Typography>
                  <Typography fontWeight={700} fontSize="0.9rem">{formatDate(checkOut)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Guests
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <People sx={{ fontSize: "1rem", color: themeColor }} />
                    <Typography fontWeight={700}>{guestCount} Guest{guestCount !== 1 ? "s" : ""}</Typography>
                  </Stack>
                </Grid>
              </Grid>

              {dateErrMsg && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: "12px" }}>
                  {dateErrMsg}
                </Alert>
              )}

              {nights > 0 && (
                <Chip
                  label={`${nights} night${nights !== 1 ? "s" : ""}`}
                  sx={{ mt: 2, bgcolor: `${themeColor}15`, color: themeColor, fontWeight: 700 }}
                />
              )}
            </Paper>

            {/* Room selection */}
            <Paper
              elevation={0}
              sx={{ borderRadius: "20px", border: "1px solid #e2e8f0", p: 3, mb: 3 }}
            >
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <HotelIcon sx={{ color: themeColor, fontSize: "1.1rem" }} />
                Select Room Category
              </Typography>

              {activeRooms.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: "12px" }}>
                  No room categories are configured for this hotel yet. The hotel's base price will be used.
                </Alert>
              ) : (
                <Stack spacing={1.5}>
                  {activeRooms.map((cat) => {
                    const isSelected = selectedCategoryId === cat._id;
                    const catAmenities = resolveAmenities(cat.amenities || []);
                    return (
                      <Box
                        key={cat._id}
                        onClick={() => { setSelectedCategoryId(cat._id); setRoomQuantity(1); }}
                        sx={{
                          p: 2.5,
                          borderRadius: "16px",
                          border: `2px solid ${isSelected ? themeColor : "#e2e8f0"}`,
                          bgcolor: isSelected ? `${themeColor}08` : "white",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: themeColor,
                            bgcolor: `${themeColor}06`,
                          },
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ flex: 1, mr: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                              {isSelected && (
                                <CheckCircleOutline sx={{ color: themeColor, fontSize: "1.1rem" }} />
                              )}
                              <Typography fontWeight={800} sx={{ color: isSelected ? themeColor : "#1a202c" }}>
                                {cat.name}
                              </Typography>
                              <Chip
                                label={cat.bedType}
                                size="small"
                                sx={{ fontSize: "0.7rem", bgcolor: "#f1f5f9", fontWeight: 600 }}
                              />
                            </Stack>
                            {cat.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {cat.description}
                              </Typography>
                            )}
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Chip
                                icon={<People sx={{ fontSize: "0.75rem !important" }} />}
                                label={`Up to ${cat.maxOccupancy} guests`}
                                size="small"
                                sx={{ fontSize: "0.7rem", bgcolor: "#f8fafc" }}
                              />
                              {catAmenities.slice(0, 3).map((a) => (
                                <Chip
                                  key={a.id}
                                  label={`${a.emoji} ${a.label}`}
                                  size="small"
                                  sx={{ fontSize: "0.7rem", bgcolor: "#f8fafc" }}
                                />
                              ))}
                            </Stack>
                          </Box>
                          <Box sx={{ textAlign: "right", minWidth: 90 }}>
                            <Typography variant="h6" fontWeight={900} sx={{ color: themeColor }}>
                              {formatPrice(cat.pricePerNight)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">/ night</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              {cat.totalRooms} avail.
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Paper>

            {/* Room quantity */}
            {selectedCategory && (
              <Paper
                elevation={0}
                sx={{ borderRadius: "20px", border: "1px solid #e2e8f0", p: 3, mb: 3 }}
              >
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                  Number of Rooms
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <IconButton
                    onClick={() => setRoomQuantity((q) => Math.max(1, q - 1))}
                    disabled={roomQuantity <= 1}
                    sx={{ bgcolor: "#f1f5f9", borderRadius: "12px" }}
                  >
                    <Remove />
                  </IconButton>
                  <Typography variant="h5" fontWeight={800} sx={{ minWidth: 32, textAlign: "center" }}>
                    {roomQuantity}
                  </Typography>
                  <IconButton
                    onClick={() =>
                      setRoomQuantity((q) => Math.min(selectedCategory.totalRooms, q + 1))
                    }
                    disabled={roomQuantity >= selectedCategory.totalRooms}
                    sx={{ bgcolor: "#f1f5f9", borderRadius: "12px" }}
                  >
                    <Add />
                  </IconButton>
                  <Typography variant="body2" color="text.secondary">
                    (max {selectedCategory.totalRooms})
                  </Typography>
                </Stack>

                {guestOverflow && (
                  <Alert severity="warning" sx={{ mt: 2, borderRadius: "12px" }}>
                    {guestCount} guests exceed the maximum occupancy of {maxAllowedGuests} for{" "}
                    {roomQuantity} room(s). Please increase the number of rooms or reduce guests.
                  </Alert>
                )}
              </Paper>
            )}
          </Grid>

          {/* ── RIGHT: Price summary + CTA ──────────────────────────── */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: { md: "sticky" }, top: { md: 24 } }}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: "20px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
                }}
              >
                {/* Price breakdown header */}
                <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9" }}>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                    Price Breakdown
                  </Typography>

                  <Stack spacing={1.2}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary" fontSize="0.9rem">
                        {formatPrice(pricePerNight)} × {roomQuantity} room{roomQuantity > 1 ? "s" : ""} × {nights} night{nights !== 1 ? "s" : ""}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Room Subtotal</Typography>
                      <Typography fontWeight={700}>{formatPrice(roomSubtotal)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Service Fee (5%)</Typography>
                      <Typography fontWeight={700}>{formatPrice(serviceFee)}</Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography fontWeight={800} fontSize="1rem">
                        Total
                      </Typography>
                      <Typography fontWeight={900} fontSize="1.2rem" sx={{ color: themeColor }}>
                        {formatPrice(finalAmount)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>

                {/* Booking summary */}
                <Box sx={{ p: 3, bgcolor: "#f8fafc" }}>
                  {selectedCategory && (
                    <Stack spacing={0.8} sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        ROOM CATEGORY
                      </Typography>
                      <Typography fontWeight={700}>{selectedCategory.name}</Typography>
                    </Stack>
                  )}

                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Check-in</Typography>
                    <Typography variant="caption" fontWeight={700}>{formatDate(checkIn)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Check-out</Typography>
                    <Typography variant="caption" fontWeight={700}>{formatDate(checkOut)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Guests</Typography>
                    <Typography variant="caption" fontWeight={700}>{guestCount}</Typography>
                  </Stack>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={
                      submitting ||
                      !!dateErrMsg ||
                      guestOverflow ||
                      nights < 1
                    }
                    onClick={handleProceed}
                    sx={{
                      bgcolor: themeColor,
                      borderRadius: "14px",
                      py: 1.8,
                      fontWeight: 800,
                      fontSize: "1rem",
                      boxShadow: `0 8px 20px -4px ${themeColor}60`,
                      "&:hover": { bgcolor: themeColor, filter: "brightness(0.92)" },
                      "&:disabled": { opacity: 0.6 },
                    }}
                  >
                    {submitting ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CircularProgress size={18} thickness={4} sx={{ color: "white" }} />
                        <span>Creating Booking…</span>
                      </Stack>
                    ) : (
                      "Book Now"
                    )}
                  </Button>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", textAlign: "center", mt: 1.5 }}
                  >
                    Pay securely later via Razorpay · Free cancellation
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Checkout;
