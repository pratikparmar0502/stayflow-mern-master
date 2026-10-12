import React, { useState, useContext, useEffect, useMemo, useCallback } from "react";
import { formatPrice } from "../../formatter.js";
import { resolveAmenities } from "../../constants/amenities";
import {
  EventAvailable,
  Star,
  Close,
  LocationOn,
  ArrowForwardRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  Refresh,
  ErrorOutline,
  SearchOff,
} from "@mui/icons-material";
// import destination1 from "../../assets/destination/destination-1.avif";
// import destination2 from "../../assets/destination/destination-2.avif";
// import destination3 from "../../assets/destination/destination-3.avif";
// import destination4 from "../../assets/destination/destination-4.avif";
// import destination5 from "../../assets/destination/destination-5.avif";
// import destination6 from "../../assets/destination/destination-6.avif";
import natureHero from "../../assets/nature-hero.avif";
import royalHero from "../../assets/royal-hero.avif";
import urbanHero from "../../assets/urban-hero.avif";
import oceanHero from "../../assets/ocean-hero.avif";
import romanticHero from "../../assets/romantic-hero.avif";
import defaultHero from "../../assets/defafult-hero.avif";

import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Stack,
  Divider,
  Box,
  Typography,
  Button,
  Container,
  TextField,
  InputAdornment,
  IconButton,
  Modal,
  Fade,
  Select,
  MenuItem,
  CircularProgress,
  Backdrop,
  Skeleton,
} from "@mui/material";

import { MoodContext } from "../../context/MoodContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { useHistory } from "react-router-dom";
import api from "../../api/axios.js";
import toast from "react-hot-toast";

const Home = () => {
  const BACKEND_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    // External image URL
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    // Image uploaded to our backend
    if (image.startsWith("/uploads/")) {
      return `${BACKEND_URL}${image}`;
    }

    return image;
  };

  const history = useHistory();
  const { mood } = useContext(MoodContext);

  // --- 1. State Declarations ---
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [open, setOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // API Data State
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination / Carousel State (Max 6 cards per view)
  const HOTELS_PER_PAGE = 6;
  const [page, setPage] = useState(1);

  // --- 2. Helper Functions ---
  const calculateNights = (start, end) => {
    if (!start || !end) return 1;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate <= startDate) return 1;
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  const calculatedNights = calculateNights(checkIn, checkOut);
  const totalPrice = (selectedHotel?.price || 0) * calculatedNights;
  const serviceFee = Math.round(totalPrice * 0.05);
  const finalAmount = totalPrice + serviceFee;

  // --- 3. API Fetching Logic ---
  const fetchHotels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/hotels");
      setHotels(response.data.hotels || []);
    } catch (err) {
      console.error("Error fetching hotels:", err);
      setError("Unable to load hotels. Please check your connection and try again.");
      toast.error("Failed to load hotels.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get("/hotels");
        if (isMounted) {
          setHotels(response.data.hotels || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching hotels:", err);
          setError("Unable to load hotels. Please check your connection and try again.");
          toast.error("Failed to load hotels.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // --- 4. Main Logic: Filter Hotels ---
  const displayedHotels = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // 1. Filter by search query (hotel name and location, safely handling nulls)
    const filteredBySearch = hotels.filter((hotel) => {
      if (!query) return true;
      const hotelName = (hotel.name || "").toLowerCase();
      const hotelLoc = (hotel.location || hotel.loc || "").toLowerCase();
      return hotelName.includes(query) || hotelLoc.includes(query);
    });

    const activeMood = (mood || "default").toLowerCase().trim();

    // CASE 1: Default or All — return full matching result set across all categories
    if (activeMood === "default" || activeMood === "all") {
      return filteredBySearch;
    }

    // CASE 2: Specific Mood (Nature, Urban, Ocean, Romantic, Royal)
    return filteredBySearch.filter(
      (hotel) => (hotel.category || "").toLowerCase().trim() === activeMood,
    );
  }, [hotels, searchQuery, mood]);

  // Reset pagination when mood or search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, mood]);

  // Pagination calculation
  const totalPages = Math.ceil(displayedHotels.length / HOTELS_PER_PAGE) || 1;

  const paginatedHotels = useMemo(() => {
    const startIndex = (page - 1) * HOTELS_PER_PAGE;
    return displayedHotels.slice(startIndex, startIndex + HOTELS_PER_PAGE);
  }, [displayedHotels, page]);

  const handlePrevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
    document.getElementById("stays-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
    document.getElementById("stays-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    document.getElementById("stays-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleClose = () => {
    setOpen(false);
  };

  // --- 6. Styles & Themes ---
  const getMoodColor = (currentMood) => {
    switch (currentMood) {
      case "nature":
        return "#2e7d32";
      case "urban":
        return "#d32f2f";
      case "ocean":
        return "#0288d1";
      case "romantic":
        return "#d81b60";
      case "royal":
        return "#ffa000";
      default:
        return "#1976d2";
    }
  };

  const moodImages = {
    nature: natureHero,
    urban: urbanHero,
    ocean: oceanHero,
    romantic: romanticHero,
    royal: royalHero,
    default: defaultHero,
  };

  const themeColor = getMoodColor(mood);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  // const dest = [
  //   {
  //     name: "Goa Beaches",
  //     image: destination1,
  //     stays: "240+",
  //     color: "#0288d1",
  //     description: "Sun beaches & nightlife",
  //   },
  //   {
  //     name: "Himalayas",
  //     image: destination2,
  //     stays: "180+",
  //     color: "#2e7d32",
  //     description: "Majestic peaks & valleys",
  //   },
  //   {
  //     name: "Rajasthan",
  //     image: destination3,
  //     stays: "150+",
  //     color: "#ffa000",
  //     description: "Royal heritage & desert camps",
  //   },
  //   {
  //     name: "Kerala",
  //     image: destination4,
  //     stays: "190+",
  //     color: "#4caf50",
  //     description: "Backwaters & lush greenery",
  //   },
  //   {
  //     name: "Mumbai",
  //     image: destination5,
  //     stays: "320+",
  //     color: "#d32f2f",
  //     description: "The city that never sleeps",
  //   },
  //   {
  //     name: "Andaman",
  //     image: destination6,
  //     stays: "85+",
  //     color: "#0288d1",
  //     description: "Pristine beaches & coral reefs",
  //   },
  // ];

  // Logic for displaying hotels

  // Trending hotels manually pick kiye hue (example)

  // --- 5. Animation Variants ---

  return (
    <>
      <Box sx={{ bgcolor: "#fafafa" }}>
        {/* Hero Section */}
        <Box
          component={motion.div}
          key={mood} // Mood badalte hi image fade hogi
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          sx={{
            height: { xs: "60vh", md: "80vh" },
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${moodImages[mood] || moodImages.default})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            alignItems: "center",
            transition: "0.8s ease",
          }}
        >
          <Container maxWidth="md" sx={{ textAlign: "center", color: "white" }}>
            <AnimatePresence mode="wait">
              <Typography
                variant="h1"
                fontWeight="900"
                component={motion.h1}
                key={mood}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                sx={{
                  fontSize: { xs: "2.6rem", md: "4rem" },
                  textShadow: "2px 2px 10px rgba(0,0,0,0.5)",
                  mb: 2,
                }}
              >
                Find Your Perfect{" "}
                <span style={{ color: getMoodColor(mood) }}>
                  {mood === "default" ? "Dream" : mood.charAt(0).toUpperCase() + mood.slice(1)}
                </span>{" "}
                Stay
              </Typography>
            </AnimatePresence>
            <Box sx={{ height: "60px", mb: 4 }}>
              {" "}
              {/* Height fix rakhi taaki text change pe jump na kare */}
              <AnimatePresence mode="wait">
                <Typography
                  component={motion.p}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  variant="h6"
                  sx={{
                    mb: 4,
                    fontWeight: 400,
                    opacity: 0.9,
                    textShadow: "1px 1px 8px rgba(0,0,0,0.4)",
                    maxWidth: "700px",
                    mx: "auto",
                    lineHeight: 1.4,
                  }}
                >
                  {mood === "default" &&
                    "From hidden gems to iconic landmarks, discover stays that match your vibe."}
                  {mood === "nature" && "Escape the noise and breathe in the fresh mountain air."}
                  {mood === "urban" &&
                    "Stay in the heart of the action, where the city never sleeps."}
                  {mood === "ocean" &&
                    "Wake up to the sound of waves and the touch of golden sand."}
                  {mood === "romantic" &&
                    "Create unforgettable memories in the most enchanting settings."}
                  {mood === "royal" &&
                    "Experience grand hospitality and live like royalty in heritage palaces."}
                </Typography>
              </AnimatePresence>
            </Box>

            {/* Search Box */}
            <Box
              component={motion.form}
              onSubmit={handleSearchSubmit}
              whileHover={{ scale: 1.02 }}
              sx={{
                bgcolor: "white",
                borderRadius: "50px",
                p: 1,
                display: "flex",
                alignItems: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                gap: { xs: 2, md: 0 },
                maxWidth: "800px",
                mx: "auto",
              }}
            >
              <TextField
                fullWidth
                variant="standard"
                placeholder="Where are you going? (e.g. Munnar, Kerala, Goa)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn sx={{ ml: 2, color: getMoodColor(mood) }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery("")}
                        aria-label="Clear destination search"
                        sx={{ mr: 1 }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{ px: 2 }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: getMoodColor(mood),
                  borderRadius: "40px",
                  px: 5,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  "&:hover": {
                    bgcolor: getMoodColor(mood),
                    filter: "brightness(0.9)",
                  },
                }}
              >
                Search
              </Button>
            </Box>
          </Container>
        </Box>

        {/* Main Content Stays */}
        <Container id="stays-section" sx={{ py: 7 }}>
          {/* Section Title */}

          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            sx={{ mb: 10, textAlign: "center", position: "relative" }}
          >
            <Typography
              variant="h2"
              fontWeight="900"
              sx={{
                mb: 2,
                background: `linear-gradient(45deg, #1a1a1a, ${getMoodColor(mood)})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontSize: { xs: "2.5rem", md: "3.5rem" },
              }}
            >
              ✨ Trending Stays
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "text.secondary",
                maxWidth: "600px",
                mx: "auto",
                fontWeight: 400,
                fontSize: { xs: "1.1rem", md: "1.25rem" },
              }}
            >
              Discover the most loved getaways, handpicked for unforgettable experiences
            </Typography>

            {/* Decorative line */}
            <Box
              sx={{
                width: "100px",
                height: "4px",
                background: `linear-gradient(90deg, ${getMoodColor(
                  mood,
                )}, ${getMoodColor(mood)}80, transparent)`,
                borderRadius: "2px",
                mx: "auto",
                mt: 4,
              }}
            />
          </Box>

          {/* 1. Loading State: Skeleton Placeholders (6 responsive cards) */}
          {loading && (
            <Grid container spacing={4} sx={{ justifyContent: "center" }}>
              {[...Array(6)].map((_, idx) => (
                <Grid item xs={12} sm={6} md={4} key={`hotel-skeleton-${idx}`}>
                  <Card
                    sx={{
                      borderRadius: "24px",
                      overflow: "hidden",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
                      border: "1px solid rgba(0,0,0,0.04)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Skeleton variant="rectangular" height={220} animation="wave" />
                    <CardContent sx={{ p: 2.5, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                      <Skeleton variant="text" height={32} width="80%" />
                      <Skeleton variant="text" height={20} width="45%" sx={{ my: 1 }} />
                      <Stack direction="row" spacing={3} sx={{ my: 1.5 }}>
                        <Skeleton variant="text" width={45} />
                        <Skeleton variant="text" width={45} />
                        <Skeleton variant="text" width={45} />
                      </Stack>
                      <Divider sx={{ my: 2, opacity: 0.7 }} />
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "auto" }}>
                        <Skeleton variant="text" height={36} width={90} />
                        <Skeleton variant="rounded" height={42} width={120} sx={{ borderRadius: "12px" }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* 2. Error State with Retry */}
          {!loading && error && (
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{
                textAlign: "center",
                py: 8,
                px: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <ErrorOutline sx={{ fontSize: 70, color: "#ef4444", mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
                Something went wrong
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
                {error}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={fetchHotels}
                sx={{
                  borderRadius: "20px",
                  bgcolor: getMoodColor(mood),
                  px: 4,
                  py: 1.2,
                  fontWeight: "bold",
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: getMoodColor(mood),
                    filter: "brightness(0.9)",
                  },
                }}
              >
                Retry
              </Button>
            </Box>
          )}

          {/* 3. Empty State */}
          {!loading && !error && displayedHotels.length === 0 && (
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{
                textAlign: "center",
                py: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <SearchOff sx={{ fontSize: 80, color: "#ccc", mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" color="text.secondary">
                No stays found matching "{searchQuery}"
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Try checking your spelling or explore other categories.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setSearchQuery("")}
                sx={{
                  borderRadius: "20px",
                  color: getMoodColor(mood),
                  borderColor: getMoodColor(mood),
                  "&:hover": {
                    borderColor: getMoodColor(mood),
                    bgcolor: "rgba(0,0,0,0.04)",
                  },
                }}
              >
                Clear Search
              </Button>
            </Box>
          )}

          {/* 4. Hotel Cards Grid (Max 6 per view, using paginatedHotels) */}
          {!loading && !error && displayedHotels.length > 0 && (
            <>
              <Grid
                container
                spacing={4}
                sx={{ justifyContent: "center" }}
                component={motion.div}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {paginatedHotels.map((hotel) => (
                  <Grid item xs={12} sm={6} md={4} key={hotel._id}>
                    <Box
                      component={motion.div}
                      variants={cardVariants}
                      whileHover={{ y: -12 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card
                        sx={{
                          borderRadius: "24px",
                          overflow: "hidden",
                          boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
                          border: "1px solid rgba(0,0,0,0.04)",
                          borderColor: `${getMoodColor(mood)}20`,
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          transition: "transform 0.3s ease, box-shadow 0.3s ease",
                          "&:hover": {
                            boxShadow: `0 20px 40px ${getMoodColor(mood)}15`,
                          },
                        }}
                      >
                        <Box sx={{ position: "relative", height: "220px" }}>
                          <CardMedia
                            component="img"
                            src={getImageUrl(hotel.image || hotel.img)}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = defaultHero;
                            }}
                            sx={{
                              height: "100%",
                              objectFit: "cover",
                              transition: "opacity 0.5s",
                            }}
                          />
                        </Box>

                        <CardContent
                          sx={{
                            p: 2.5,
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          {/* Hotel Name */}
                          <Typography variant="h6" fontWeight="800" noWrap>
                            {hotel.name}
                          </Typography>

                          {/* Location */}
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                            sx={{ color: "text.secondary", mb: 2, mt: 1 }}
                          >
                            <LocationOn sx={{ fontSize: "0.9rem" }} />
                            <Typography variant="caption" fontWeight="600">
                              {hotel.location || hotel.loc}
                            </Typography>
                          </Stack>

                          {/* ------------- Amenities ------------- */}
                          <Stack direction="row" spacing={1.5} sx={{ my: 1, color: "text.secondary", flexWrap: "wrap", minHeight: "28px", alignItems: "center" }}>
                            {resolveAmenities(hotel.amenities).length > 0 ? (
                              resolveAmenities(hotel.amenities).slice(0, 3).map((item) => (
                                <Box
                                  key={item.id}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  <span>{item.emoji}</span>
                                  <Typography variant="caption" fontWeight="500">
                                    {item.label}
                                  </Typography>
                                </Box>
                              ))
                            ) : (
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                                Standard amenities included
                              </Typography>
                            )}
                          </Stack>

                          <Divider sx={{ my: 2, opacity: 0.7 }} />

                          {/* Price and Book Now */}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mt: "auto",
                            }}
                          >
                            {/* Left Side: Price */}
                            <Box sx={{ display: "flex", alignItems: "baseline" }}>
                              <Typography
                                variant="h5"
                                fontWeight="900"
                                sx={{ color: getMoodColor(mood) }}
                              >
                                {formatPrice(hotel.price)}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  ml: 0.5,
                                  fontWeight: 700,
                                  color: "text.secondary",
                                }}
                              >
                                / night
                              </Typography>
                            </Box>

                            {/* Right Side: Details Button */}
                            <Button
                              variant="contained"
                              size="medium"
                              endIcon={<ArrowForwardRounded />}
                              onClick={() => {
                                setSelectedHotel(hotel);
                                setOpen(true);
                              }}
                              disableElevation
                              sx={{
                                bgcolor: getMoodColor(mood),
                                color: "#fff",
                                textTransform: "none",
                                fontWeight: "bold",
                                borderRadius: "12px",
                                px: 3,
                                py: 1,
                                boxShadow: `0 4px 14px ${getMoodColor(mood)}50`,
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  bgcolor: getMoodColor(mood),
                                  transform: "translateY(-2px)",
                                  boxShadow: `0 8px 20px ${getMoodColor(mood)}70`,
                                },
                                "&:active": {
                                  transform: "translateY(0)",
                                },
                              }}
                            >
                              Book Now
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* 5. Carousel / Pagination Controls */}
              <Box
                sx={{
                  mt: 6,
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  p: 2,
                  borderRadius: "20px",
                  bgcolor: "white",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  Showing{" "}
                  <Box component="span" sx={{ color: getMoodColor(mood), fontWeight: "bold" }}>
                    {(page - 1) * HOTELS_PER_PAGE + 1}–
                    {Math.min(page * HOTELS_PER_PAGE, displayedHotels.length)}
                  </Box>{" "}
                  of {displayedHotels.length} available stays
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button
                    variant="outlined"
                    size="medium"
                    startIcon={<ChevronLeftRounded />}
                    disabled={page <= 1}
                    onClick={handlePrevPage}
                    sx={{
                      borderRadius: "14px",
                      textTransform: "none",
                      fontWeight: "bold",
                      borderColor: page <= 1 ? "inherit" : `${getMoodColor(mood)}60`,
                      color: page <= 1 ? "inherit" : getMoodColor(mood),
                      "&:hover": {
                        borderColor: getMoodColor(mood),
                        bgcolor: `${getMoodColor(mood)}10`,
                      },
                    }}
                  >
                    Previous
                  </Button>

                  <Box
                    sx={{
                      px: 2,
                      py: 0.8,
                      borderRadius: "12px",
                      bgcolor: `${getMoodColor(mood)}15`,
                      color: getMoodColor(mood),
                      fontWeight: "800",
                      fontSize: "0.9rem",
                    }}
                  >
                    {page} / {totalPages}
                  </Box>

                  <Button
                    variant="outlined"
                    size="medium"
                    endIcon={<ChevronRightRounded />}
                    disabled={page >= totalPages}
                    onClick={handleNextPage}
                    sx={{
                      borderRadius: "14px",
                      textTransform: "none",
                      fontWeight: "bold",
                      borderColor: page >= totalPages ? "inherit" : `${getMoodColor(mood)}60`,
                      color: page >= totalPages ? "inherit" : getMoodColor(mood),
                      "&:hover": {
                        borderColor: getMoodColor(mood),
                        bgcolor: `${getMoodColor(mood)}10`,
                      },
                    }}
                  >
                    Next
                  </Button>
                </Stack>
              </Box>
            </>
          )}
        </Container>
        {/* Hotel Details Modal */}
        <Modal
          open={open}
          onClose={handleClose}
          closeAfterTransition
          slots={{ backdrop: Backdrop }}
          slotProps={{
            backdrop: {
              timeout: 500,
              sx: { backdropFilter: "blur(8px)", bgcolor: "rgba(0,0,0,0.6)" }, // Darker, blurrier backdrop
            },
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <Fade in={open}>
            <Box
              sx={{
                bgcolor: "#fff",
                width: { xs: "100%", sm: "90%", md: "850px" },
                borderRadius: { xs: "20px", md: "32px" }, // Super rounded corners
                maxHeight: "90vh",
                position: "relative",
                boxShadow: "0 40px 80px rgba(0,0,0,0.3)", // Deep premium shadow
                overflow: "hidden",
                outline: "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {selectedHotel ? (
                <>
                  {/* --- SCROLLABLE CONTENT AREA --- */}
                  <Box
                    sx={{
                      overflowY: "auto",
                      flex: 1,
                      pb: 12,
                      "&::-webkit-scrollbar": {
                        display: "none",
                      },
                    }}
                  >
                    {" "}
                    {/* pb-12 ensures content isn't hidden behind footer */}
                    {/* 1. HERO IMAGE SECTION */}
                    <Box
                      sx={{
                        position: "relative",
                        height: { xs: 280, md: 400 },
                      }}
                    >
                      {/* Close Button Floating */}
                      <IconButton
                        onClick={handleClose}
                        sx={{
                          position: "absolute",
                          top: 20,
                          right: 20,
                          zIndex: 10,
                          bgcolor: "rgba(255,255,255,0.8)",
                          backdropFilter: "blur(10px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          "&:hover": {
                            bgcolor: "white",
                            transform: "scale(1.1)",
                          },
                          transition: "all 0.2s",
                        }}
                      >
                        <Close />
                      </IconButton>

                      <img
                        src={getImageUrl(selectedHotel.image || selectedHotel.img)}
                        alt={selectedHotel.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = defaultHero;
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />

                      {/* Floating Rating Badge */}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 20,
                          left: 20,
                          bgcolor: "rgba(255,255,255,0.95)",
                          backdropFilter: "blur(4px)",
                          px: 2,
                          py: 1,
                          borderRadius: "100px",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        }}
                      >
                        <Star sx={{ color: "#FFB300", fontSize: "1.2rem" }} />
                        <Typography variant="subtitle1" fontWeight="800" sx={{ color: "#2d3748" }}>
                          {selectedHotel.rate ?? 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (24 reviews)
                        </Typography>
                      </Box>
                    </Box>
                    {/* 2. MAIN CONTENT PADDING */}
                    <Box sx={{ px: { xs: 3, md: 5 }, pt: 4 }}>
                      {/* Title & Location */}
                      <Typography
                        variant="h3"
                        fontWeight="900"
                        letterSpacing="-1px"
                        sx={{ color: "#1a202c", mb: 1 }}
                      >
                        {selectedHotel.name}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 4, color: "text.secondary" }}
                      >
                        <LocationOn sx={{ color: themeColor }} />
                        <Typography variant="body1" fontWeight="500">
                          {selectedHotel.location}
                        </Typography>
                      </Stack>

                      {/* 3. INPUTS SECTION (Modern Gray Box Style) */}
                      <Box
                        sx={{
                          mb: 5,
                          p: 3,
                          borderRadius: "24px",
                          bgcolor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight="800"
                          sx={{
                            mb: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <EventAvailable sx={{ color: themeColor }} /> Your Trip
                        </Typography>

                        <Grid container spacing={2}>
                          {/* Check-In */}
                          <Grid item xs={12} sm={4}>
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: "white",
                                borderRadius: "16px",
                                border: "1px solid #edf2f7",
                                transition: "0.2s",
                                "&:hover": { borderColor: themeColor },
                              }}
                            >
                              <Typography
                                variant="caption"
                                fontWeight="700"
                                color="text.secondary"
                                sx={{ display: "block", mb: 0.5, ml: 1 }}
                              >
                                CHECK-IN
                              </Typography>
                              <TextField
                                inputProps={{
                                  min: checkIn || new Date().toISOString().split("T")[0],
                                }}
                                type="date"
                                fullWidth
                                variant="standard"
                                value={checkIn || ""}
                                onChange={(e) => setCheckIn(e.target.value)}
                                InputProps={{
                                  disableUnderline: true,
                                  sx: {
                                    fontSize: "0.95rem",
                                    fontWeight: 600,
                                    px: 1,
                                  },
                                }}
                              />
                            </Box>
                          </Grid>

                          {/* Check-Out */}
                          <Grid item xs={12} sm={4}>
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: "white",
                                borderRadius: "16px",
                                border: "1px solid #edf2f7",
                                transition: "0.2s",
                                "&:hover": { borderColor: themeColor },
                              }}
                            >
                              <Typography
                                variant="caption"
                                fontWeight="700"
                                color="text.secondary"
                                sx={{ display: "block", mb: 0.5, ml: 1 }}
                              >
                                CHECK-OUT
                              </Typography>
                              <TextField
                                type="date"
                                inputProps={{
                                  min: checkIn || new Date().toISOString().split("T")[0],
                                }} // User purani date select nahi kar payega
                                fullWidth
                                variant="standard"
                                value={checkOut || ""}
                                onChange={(e) => setCheckOut(e.target.value)}
                                InputProps={{
                                  disableUnderline: true,
                                  sx: {
                                    fontSize: "0.95rem",
                                    fontWeight: 600,
                                    px: 1,
                                  },
                                }}
                              />
                            </Box>
                          </Grid>

                          {/* Guests */}
                          <Grid item xs={12} sm={4}>
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: "white",
                                borderRadius: "16px",
                                border: "1px solid #edf2f7",
                                transition: "0.2s",
                                "&:hover": { borderColor: themeColor },
                              }}
                            >
                              <Typography
                                variant="caption"
                                fontWeight="700"
                                color="text.secondary"
                                sx={{ display: "block", mb: 0.5, ml: 1 }}
                              >
                                GUESTS
                              </Typography>
                              <Select
                                fullWidth
                                variant="standard"
                                displayEmpty
                                value={guests}
                                onChange={(e) => setGuests(e.target.value)}
                                disableUnderline
                                sx={{
                                  fontSize: "0.95rem",
                                  fontWeight: 600,
                                  px: 1,
                                }}
                              >
                                {[1, 2, 3, 4, 5, 6].map((num) => (
                                  <MenuItem key={num} value={num}>
                                    {num} Guest{num > 1 ? "s" : ""}
                                  </MenuItem>
                                ))}
                              </Select>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* 4. AMENITIES (Clean Cards) */}
                      <Box sx={{ mb: 5 }}>
                        <Typography variant="h6" fontWeight="800" sx={{ mb: 3 }}>
                          What this place offers
                        </Typography>
                        {resolveAmenities(selectedHotel.amenities).length > 0 ? (
                          <Grid container spacing={2}>
                            {resolveAmenities(selectedHotel.amenities).map((item) => (
                              <Grid item xs={6} sm={3} key={item.id}>
                                <Box
                                  sx={{
                                    p: 2,
                                    borderRadius: "16px",
                                    bgcolor: "white",
                                    border: "1px solid #f1f5f9",
                                    textAlign: "center",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    "&:hover": {
                                      transform: "translateY(-4px)",
                                      boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
                                      borderColor: themeColor,
                                    },
                                  }}
                                >
                                  <Typography variant="h5" sx={{ mb: 1 }}>
                                    {item.emoji}
                                  </Typography>
                                  <Typography variant="body2" fontWeight="600" color="text.secondary">
                                    {item.label}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Box sx={{ p: 3, borderRadius: "16px", bgcolor: "#f8fafc", textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                              No specific amenities listed for this stay. Contact hotel for special requests.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* --- STICKY FOOTER --- */}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      bgcolor: "rgba(255,255,255,0.85)",
                      backdropFilter: "blur(12px)",
                      p: { xs: 2, md: 3 },
                      px: { xs: 3, md: 5 },
                      zIndex: 20,
                      borderTop: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <Grid container alignItems="center" justifyContent="space-between">
                      <Grid item xs={6}>
                        <Stack>
                          <Stack direction="row" alignItems="baseline" spacing={0.5}>
                            <Typography variant="h4" fontWeight="900" sx={{ color: "#1a202c" }}>
                              {formatPrice(finalAmount)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight="600">
                              / {calculatedNights} nights
                            </Typography>
                          </Stack>
                          {/* Is par click karne pe tum ek chhota tooltip ya alert dikha sakte ho fees ka */}
                          <Typography
                            variant="caption"
                            sx={{
                              color: themeColor,
                              fontWeight: "bold",
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            Includes {formatPrice(serviceFee)} service fee
                          </Typography>
                        </Stack>
                      </Grid>

                      <Grid item xs={6}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => {
                            const token = localStorage.getItem("token");
                            if (!token) {
                              toast.error("Please login before booking.");
                              history.push("/login");
                              return;
                            }
                            if (!checkIn || !checkOut) {
                              toast.error("Please select check-in and check-out dates.");
                              return;
                            }
                            const checkInDate = new Date(checkIn);
                            const checkOutDate = new Date(checkOut);
                            if (checkOutDate <= checkInDate) {
                              toast.error("Check-out date must be after check-in date.");
                              return;
                            }

                            // Close modal and navigate to dedicated /checkout page
                            setOpen(false);
                            history.push({
                              pathname: "/checkout",
                              state: {
                                hotel: selectedHotel,
                                checkIn,
                                checkOut,
                                guests,
                              },
                            });
                          }}
                          sx={{
                            bgcolor: themeColor,
                            borderRadius: "14px",
                            py: 1.8,
                            fontWeight: "800",
                            boxShadow: `0 10px 20px -5px ${themeColor}60`,
                            "&:hover": {
                              bgcolor: themeColor,
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          Proceed to Checkout
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              ) : (
                // Loading State
                <Box
                  sx={{
                    height: "400px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress size={50} thickness={4} sx={{ color: themeColor, mb: 3 }} />
                  <Typography variant="h6" fontWeight="600" color="text.secondary">
                    Finding the best rates...
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        </Modal>

        {/* Top Destination
      <Container sx={{ py: { xs: 6, md: 7 } }}>
        Header
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          sx={{ mb: 8, textAlign: "center" }}
        >
          <Typography
            variant="h2"
            fontWeight="900"
            sx={{
              mb: 2,
              background: `linear-gradient(45deg, #1a1a1a, ${getMoodColor(
                mood
              )})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontSize: { xs: "2.5rem", md: "3.5rem" },
            }}
          >
            ✨ Top Destinations
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "text.secondary",
              maxWidth: "600px",
              mx: "auto",
              fontWeight: 400,
              fontSize: { xs: "1.1rem", md: "1.25rem" },
            }}
          >
            Discover the most loved getaways, handpicked for unforgettable
            experiences
          </Typography>
          <Box
            sx={{
              width: "100px",
              height: "4px",
              background: `linear-gradient(90deg, ${getMoodColor(
                mood
              )}, ${getMoodColor(mood)}80, transparent)`,
              borderRadius: "2px",
              mx: "auto",
              mt: 4,
            }}
          />
        </Box>
        Destinations Grid
        <Grid
          container
          spacing={{ xs: 3, md: 4 }}
          sx={{ justifyContent: "center" }}
        >
          {dest.map((item, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={index}
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -12, scale: 1.02 }}
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: { xs: "100%", sm: "340px" },
                  height: "320px",
                  mx: "auto",
                  borderRadius: "28px",
                  overflow: "hidden",
                  cursor: "pointer",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(0,0,0,0.05)",
                  background: "#fff",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    boxShadow: `0 24px 60px ${item.color}30`,
                    borderColor: `${item.color}30`,
                    "& .destination-img": {
                      transform: "scale(1.08)",
                      filter: "brightness(1.1) saturate(1.2)",
                    },
                    "& .explore-btn": {
                      opacity: 1,
                      transform: "translateY(0)",
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Box
                    className="destination-img"
                    component="img"
                    src={item.image}
                    alt={item.name}
                    onError={(e) => {
                      e.target.src = `https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop`;
                    }}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                      transition:
                        "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), filter 0.5s ease",
                      display: "block",
                    }}
                  />

                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(to top, 
                  rgba(0,0,0,0.9) 0%, 
                  rgba(0,0,0,0.5) 40%, 
                  rgba(0,0,0,0.1) 80%)`,
                    }}
                  />

                  <Box
                    sx={{
                      position: "absolute",
                      top: 20,
                      right: 20,
                      bgcolor: item.color,
                      color: "#fff",
                      px: 2.5,
                      py: 1,
                      borderRadius: "50px",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      boxShadow: `0 6px 20px ${item.color}50`,
                      zIndex: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Star sx={{ fontSize: "0.9rem" }} />
                    {item.stays} Stays
                  </Box>

                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      p: { xs: 3, md: 4 },
                      zIndex: 2,
                    }}
                  >
                    <Typography
                      variant="h4"
                      fontWeight="900"
                      sx={{
                        color: "#fff",
                        mb: 1.5,
                        fontSize: { xs: "1.75rem", md: "2rem" },
                        textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                        lineHeight: 1.2,
                      }}
                    >
                      {item.name}
                    </Typography>

                    <Typography
                      variant="body1"
                      sx={{
                        color: "rgba(255,255,255,0.9)",
                        mb: 3,
                        fontSize: { xs: "1rem", md: "1.1rem" },
                        textShadow: "0 1px 6px rgba(0,0,0,0.4)",
                        lineHeight: 1.5,
                      }}
                    >
                      {item.description}
                    </Typography>

                    <Button
                      className="explore-btn"
                      variant="contained"
                      sx={{
                        bgcolor: item.color,
                        color: "#fff",
                        px: 3,
                        py: 1.2,
                        borderRadius: "50px",
                        fontWeight: "bold",
                        textTransform: "none",
                        fontSize: "0.95rem",
                        opacity: 0,
                        transform: "translateY(0)",
                        transition: "all 0.3s ease 0.1s",
                        boxShadow: `0 8px 25px ${item.color}50`,
                        "&:hover": {
                          bgcolor: item.color,
                          filter: "brightness(1.1)",
                          boxShadow: `0 12px 35px ${item.color}70`,
                        },
                      }}
                      endIcon={<ArrowForward sx={{ fontSize: "1rem" }} />}
                    >
                      Explore Stays
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
        View All Button
        <Box sx={{ textAlign: "center", mt: 8 }}>
          <Button
            variant="outlined"
            sx={{
              borderColor: getMoodColor(mood),
              color: getMoodColor(mood),
              px: 5,
              py: 1.8,
              borderRadius: "50px",
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1.1rem",
              borderWidth: "2px",
              "&:hover": {
                borderColor: getMoodColor(mood),
                backgroundColor: `${getMoodColor(mood)}10`,
                transform: "translateY(-3px)",
                boxShadow: `0 12px 30px ${getMoodColor(mood)}20`,
              },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            endIcon={<ArrowForward sx={{ fontSize: "1.2rem" }} />}
          >
            View All Destinations
          </Button>
        </Box>
      </Container> */}

        {/* Why Choose Us Section */}
        <Container sx={{ py: { xs: 8, md: 7 } }}>
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography
              variant="h2"
              fontWeight="900"
              sx={{
                mb: 3,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                background: `linear-gradient(45deg, ${getMoodColor(mood)}, #1a1a1a)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ❓ Why Choose StayFlow?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "text.secondary",
                maxWidth: "700px",
                mx: "auto",
                fontWeight: 400,
                fontSize: { xs: "1.1rem", md: "1.25rem" },
                lineHeight: 1.6,
              }}
            >
              We're not just another booking platform. Here's what makes us different.
            </Typography>
          </Box>
          <Grid container spacing={4} sx={{ alignItems: "stretch", justifyContent: "center" }}>
            {[
              {
                icon: "🏆",
                title: "Best Price Guarantee",
                description: "Find lower price elsewhere? We'll match and give 110% back!",
                color: "#FFB300",
              },
              {
                icon: "💯",
                title: "100% Verified Stays",
                description: "Every property personally verified for quality, safety.",
                color: "#4CAF50",
              },
              {
                icon: "🔒",
                title: "Secure & Safe Bookings",
                description: "Bank-level encryption protects your personal information.",
                color: "#2196F3",
              },
              {
                icon: "⭐",
                title: "4.8+ Traveler Rating",
                description: "Rated excellent by 10,000+ travelers for exceptional service.",
                color: "#FF9800",
              },
              {
                icon: "🎯",
                title: "Perfect Mood Matching",
                description: "AI-powered mood matching finds your ideal based preferences.",
                color: getMoodColor(mood),
              },
              {
                icon: "🛡️",
                title: "24/7 Customer Support",
                description: "Round-the-clock assistance for any queries or emergencies.",
                color: "#9C27B0",
              },
            ].map((feature, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={index}
                component={motion.div}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.03, y: -8 }}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: "20px",
                    background: "#ffffff",
                    border: "1px solid #eee",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                    width: "100%",
                    maxWidth: { xs: "100%", sm: "340px", md: "360px" },
                    height: "100%",
                    display: "flex",
                    mx: "auto",
                    flexDirection: "column",
                    transition:
                      "box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease",
                    "&:hover": {
                      boxShadow: `0 20px 40px ${feature.color}15`,
                      borderColor: `${feature.color}30`,
                      background: `linear-gradient(145deg, #ffffff, ${feature.color}05)`,
                    },
                  }}
                >
                  {/* Icon Container */}
                  <Box
                    component={motion.div}
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }} // Jiggle effect
                    sx={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "20px",
                      background: `${feature.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 3,
                      fontSize: "2.5rem",
                      flexShrink: 0,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  {/* Title */}
                  <Typography
                    variant="h5"
                    fontWeight="800"
                    sx={{
                      mb: 2,
                      color: "#1a1a1a",
                      fontSize: { xs: "1.3rem", md: "1.5rem" },
                      lineHeight: 1.3,
                    }}
                  >
                    {feature.title}
                  </Typography>
                  {/* Description */}
                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.secondary",
                      lineHeight: 1.6,
                      flexGrow: 1,
                      fontSize: { xs: "0.95rem", md: "1rem" },
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Testimonials Section */}
        <Box
          sx={{
            background: "linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%)",
            py: { xs: 8, md: 8 },
          }}
        >
          <Container>
            {/* Header */}
            <Box sx={{ textAlign: "center", mb: 8 }}>
              <Typography
                variant="h2"
                fontWeight="900"
                sx={{
                  mb: 3,
                  fontSize: { xs: "2.5rem", md: "3.5rem" },
                  background: `linear-gradient(45deg, #1a1a1a, ${getMoodColor(mood)})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                ❤️ Loved By Travelers
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "text.secondary",
                  maxWidth: "700px",
                  mx: "auto",
                  fontWeight: 400,
                  fontSize: { xs: "1.1rem", md: "1.25rem" },
                  lineHeight: 1.6,
                }}
              >
                Don't just take our word for it. Here's what our travelers have to say.
              </Typography>
            </Box>

            {/* Testimonials Grid */}
            <Grid container spacing={4}>
              {[
                {
                  name: "Rahul Sharma",
                  role: "Frequent Traveler • Mumbai",
                  review:
                    "The mood-based search is genius! Found the perfect romantic stay for our anniversary in Udaipur. Everything was exactly as shown in pictures.",
                  rating: 5,
                  avatarColor: "#d81b60",
                  stay: "Romantic Stay in Udaipur",
                  date: "March 2024",
                },
                {
                  name: "Priya Patel",
                  role: "Digital Nomad • Bangalore",
                  review:
                    "As a remote worker, I need reliable wifi and good workspace. StayFlow's verified stays never disappoint. Best price guarantee is real!",
                  rating: 4,
                  avatarColor: "#0288d1",
                  stay: "Urban Loft in Bangalore",
                  date: "February 2024",
                },
                {
                  name: "Arjun Mehta",
                  role: "Family Traveler • Delhi",
                  review:
                    "Booking for family trips made so easy. The 24/7 support helped us when we had flight delays. Kids loved the nature retreat in Coorg!",
                  rating: 5,
                  avatarColor: "#2e7d32",
                  stay: "Nature Retreat in Coorg",
                  date: "January 2024",
                },
              ].map((testimonial, index) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={index}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <Box
                    component={motion.div}
                    whileHover={{ y: -8 }}
                    sx={{
                      p: 4,
                      overflow: "hidden",
                      borderRadius: "24px",
                      background: "#ffffff",
                      border: "1px solid #eee",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
                      height: "100%",
                      width: "100%",
                      maxWidth: { md: "300px", lg: "360px" },
                      mx: "auto",
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                        borderColor: getMoodColor(mood),
                      },
                    }}
                  >
                    {/* Stars */}
                    <Box sx={{ display: "flex", mb: 3 }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} sx={{ color: "#FFB300", fontSize: "1.2rem", mr: 0.5 }} />
                      ))}
                    </Box>

                    {/* Review Text */}
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 4,
                        fontStyle: "italic",
                        lineHeight: 1.7,
                        color: "text.primary",
                        flexGrow: 1,
                        fontSize: "1.05rem",
                      }}
                    >
                      "{testimonial.review}"
                    </Typography>

                    {/* Divider */}
                    <Box sx={{ height: "1px", bgcolor: "#f0f0f0", mb: 3 }} />

                    {/* User Info */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {/* Avatar */}
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          bgcolor: testimonial.avatarColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mr: 2,
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: "1.2rem",
                        }}
                      >
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </Box>

                      {/* User Details */}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="800">
                          {testimonial.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          {testimonial.role}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Stay Details */}
                    <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid #f5f5f5" }}>
                      <Typography variant="caption" fontWeight="600" color="text.secondary">
                        Stayed at:{" "}
                        <Box component="span" sx={{ color: getMoodColor(mood) }}>
                          {testimonial.stay}
                        </Box>
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.5 }}
                      >
                        {testimonial.date}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Stats Bar */}
            <Box
              sx={{
                mt: 10,
                p: 4,
                borderRadius: "20px",
                background: `linear-gradient(135deg, ${getMoodColor(
                  mood,
                )}15, ${getMoodColor(mood)}05)`,
                border: `1px solid ${getMoodColor(mood)}20`,
                display: "flex",
                justifyContent: "space-around",
                flexWrap: "wrap",
                gap: 3,
                textAlign: "center",
              }}
            >
              {[
                { value: "4.8/5", label: "Average Rating", icon: "⭐" },
                { value: "10,000+", label: "Happy Travelers", icon: "😊" },
                { value: "98%", label: "Satisfaction Rate", icon: "📈" },
                { value: "24/7", label: "Support Available", icon: "🛡️" },
              ].map((stat, idx) => (
                <Box key={idx}>
                  <Typography variant="h3" fontWeight="900" sx={{ color: getMoodColor(mood) }}>
                    {stat.icon} {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default Home;
