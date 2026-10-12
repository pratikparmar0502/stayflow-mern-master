import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Avatar,
  Button,
  Card,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
  Stack,
} from "@mui/material";
import { motion, useInView } from "framer-motion";
import {
  Apartment,
  People,
  Public,
  EmojiEvents,
  ArrowForward,
  LinkedIn,
  Twitter,
  Instagram,
} from "@mui/icons-material";

// Context import
import { MoodContext } from "../../context/MoodContext";

const AnimatedCounter = ({ end, duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const increment = end / (duration * 60);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);
      return () => clearInterval(timer);
    }
  }, [end, duration, isInView]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

const About = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const { mood } = useContext(MoodContext);

  const getMoodColor = (currentMood) => {
    const colors = {
      nature: "#10b981",
      urban: "#ef4444",
      ocean: "#0ea5e9",
      romantic: "#ec4899",
      royal: "#f59e0b",
      default: "#3b82f6",
    };
    return colors[currentMood] || colors.default;
  };

  const accentColor = getMoodColor(mood);
  const themeColor = "#0f172a"; // Richer dark for better contrast

  const stats = [
    { icon: <Apartment />, count: 500, label: "Luxury Hotels", suffix: "+" },
    { icon: <People />, count: 10000, label: "Happy Guests", suffix: "+" },
    { icon: <Public />, count: 50, label: "Destinations", suffix: "+" },
    { icon: <EmojiEvents />, count: 12, label: "Travel Awards", suffix: "" },
  ];

  const teamMembers = [
    {
      name: "Sarah Chen",
      role: "CEO & Founder",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
      bio: "Former hotel executive with 15+ years experience in global luxury hospitality management.",
    },
    {
      name: "James Wilson",
      role: "Head of Operations",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
      bio: "Operations specialist scaling high-growth hospitality businesses across three continents.",
    },
    {
      name: "Maria Garcia",
      role: "Experience Curator",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      bio: "Travel journalist turned experience designer, focused on hyper-local cultural immersion.",
    },
  ];

  const timeline = [
    {
      year: "2024",
      title: "The Beginning",
      description: "StayFlow founded with 3 hotels in Bali",
    },
    {
      year: "2025",
      title: "First Milestone",
      description: "Expanded to 50+ destinations",
    },
    {
      year: "Present",
      title: "Global Presence",
      description: "Operating in 50+ countries",
    },
  ];

  return (
    <Box
      sx={{
        bgcolor: "#fdfdfe",
        overflowX: "hidden",
        transition: "0.5s all ease",
      }}
    >
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: "60vh", md: "80vh" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <motion.div
          animate={{
            background: [
              `linear-gradient(135deg, ${themeColor} 0%, ${accentColor} 100%)`,
              `linear-gradient(135deg, ${accentColor} 0%, ${themeColor} 100%)`,
            ],
          }}
          transition={{ duration: 6, repeat: Infinity, repeatType: "mirror" }}
          style={{ position: "absolute", inset: 0 }}
        />
        <Container
          sx={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            color: "white",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h1"
              fontWeight="900"
              sx={{
                fontSize: { xs: "2.8rem", md: "5rem" },
                mb: 2,
                background: `linear-gradient(90deg, #fff 40%, ${alpha(
                  accentColor,
                  0.5,
                )} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Our Story, Your Mood
            </Typography>
            <Typography
              variant="h6"
              sx={{ mb: 4, opacity: 0.9, fontWeight: 300, letterSpacing: 1 }}
            >
              Tailoring the world to your{" "}
              <span
                style={{
                  color: accentColor,
                  fontWeight: "800",
                  textTransform: "uppercase",
                }}
              >
                {mood}
              </span>{" "}
              vibe.
            </Typography>
            {/* <Button
              variant="contained"
              endIcon={<ArrowForward />}
              sx={{
                bgcolor: "white",
                color: themeColor,
                borderRadius: "50px",
                px: 4,
                py: 1.8,
                fontWeight: "bold",
                "&:hover": { bgcolor: accentColor, color: "white" },
              }}
            >
              Explore Your Vibe
            </Button> */}
          </motion.div>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ mt: -8, position: "relative", zIndex: 3 }}>
        <Grid
          container
          spacing={3}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          {stats.map((stat, idx) => (
            <Grid item xs={6} md={3} key={idx}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: "24px",
                  border: `1px solid ${alpha(accentColor, 0.1)}`,
                  bgcolor: "white",
                  boxShadow: `0 20px 40px ${alpha(themeColor, 0.05)}`,
                  transition: "0.4s",
                  "&:hover": {
                    transform: "translateY(-10px)",
                    border: `1px solid ${accentColor}`,
                  },
                }}
              >
                <Box sx={{ color: accentColor, fontSize: "2.8rem", mb: 1.5 }}>
                  {stat.icon}
                </Box>
                <Typography
                  variant="h4"
                  fontWeight="900"
                  sx={{ color: themeColor }}
                >
                  <AnimatedCounter end={stat.count} />
                  {stat.suffix}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Timeline */}
        <Box sx={{ py: 12 }}>
          <Typography
            variant="h3"
            textAlign="center"
            fontWeight="900"
            sx={{ color: themeColor, mb: 10 }}
          >
            Evolution of <span style={{ color: accentColor }}>StayFlow</span>
          </Typography>
          <Box sx={{ position: "relative" }}>
            <Box
              sx={{
                position: "absolute",
                left: { xs: "20px", md: "50%" },
                transform: "translateX(-50%)",
                width: "2px",
                height: "100%",
                background: `linear-gradient(to bottom, ${accentColor}, ${alpha(
                  accentColor,
                  0.1,
                )})`,
              }}
            />
            {timeline.map((item, index) => (
              <Box
                key={index}
                sx={{
                  mb: 8,
                  display: "flex",
                  justifyContent: index % 2 === 0 ? "flex-start" : "flex-end",
                  pl: { xs: "50px", md: 0 },
                  position: "relative",
                }}
              >
                <Paper
                  sx={{
                    p: 4,
                    width: { xs: "100%", md: "42%" },
                    borderRadius: "24px",
                    border: `1px solid ${alpha(accentColor, 0.1)}`,
                    position: "relative",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: "50%",
                      [index % 2 === 0 ? "right" : "left"]: -10,
                      width: 20,
                      height: 20,
                      bgcolor: "white",
                      border: `3px solid ${accentColor}`,
                      borderRadius: "50%",
                      transform: "translateY(-50%)",
                      display: { xs: "none", md: "block" },
                    },
                  }}
                >
                  <Typography variant="h4" color={accentColor} fontWeight="900">
                    {item.year}
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ mt: 1, color: themeColor }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1, lineHeight: 1.7 }}
                  >
                    {item.description}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Team Section */}
        <Box sx={{ py: 10 }}>
          <Typography
            variant="h3"
            textAlign="center"
            fontWeight="900"
            sx={{ mb: 8, color: themeColor }}
          >
            The <span style={{ color: accentColor }}>Visionaries</span>
          </Typography>
          <Grid container spacing={4} alignItems="stretch">
            {teamMembers.map((member, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={index}
                sx={{ display: "flex" }}
              >
                <Card
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    p: 4,
                    borderRadius: "32px",
                    bgcolor: "white",
                    border: `1px solid ${alpha(accentColor, 0.08)}`,
                    transition: "0.5s",
                    "&:hover": {
                      transform: "translateY(-12px)",
                      boxShadow: `0 30px 60px ${alpha(accentColor, 0.12)}`,
                      borderColor: accentColor,
                    },
                  }}
                >
                  <Avatar
                    src={member.image}
                    sx={{
                      width: 120,
                      height: 120,
                      mb: 3,
                      mx: "auto",
                      border: `4px solid ${accentColor}`,
                    }}
                  />
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    textAlign="center"
                    sx={{ color: themeColor }}
                  >
                    {member.name}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    textAlign="center"
                    sx={{
                      color: accentColor,
                      mb: 3,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {member.role}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ flexGrow: 1, lineHeight: 1.6, px: 1 }}
                  >
                    {member.bio}
                  </Typography>
                  <Stack
                    direction="row"
                    justifyContent="center"
                    spacing={2}
                    sx={{
                      mt: 4,
                      pt: 3,
                      borderTop: `1px solid ${alpha(accentColor, 0.05)}`,
                    }}
                  >
                    {[<LinkedIn />, <Twitter />, <Instagram />].map(
                      (icon, i) => (
                        <IconButton
                          key={i}
                          size="small"
                          sx={{
                            color: alpha(themeColor, 0.6),
                            "&:hover": {
                              color: accentColor,
                              bgcolor: alpha(accentColor, 0.1),
                            },
                          }}
                        >
                          {icon}
                        </IconButton>
                      ),
                    )}
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default About;
