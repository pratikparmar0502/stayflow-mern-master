import React, { useContext, useState } from "react";
import { MoodContext } from "../../context/MoodContext";
import Forest from "@mui/icons-material/Forest";
import Apartment from "@mui/icons-material/Apartment";
import Waves from "@mui/icons-material/Waves";
import Favorite from "@mui/icons-material/Favorite";
import Castle from "@mui/icons-material/Castle";
import AllInclusive from "@mui/icons-material/AllInclusive";
import Home from "@mui/icons-material/Home";
import Bookmark from "@mui/icons-material/Bookmark";
import Person from "@mui/icons-material/Person";
import AccountCircle from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import Avatar from "@mui/material/Avatar";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
  Box,
  Container,
  useScrollTrigger,
  Drawer,
  List,
  ListItemText,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
  ListItemButton,
  ListItemIcon,
  IconButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useHistory, useLocation } from "react-router-dom";
import { ArrowForward } from "@mui/icons-material";
// import Destination from "../../pages/client/Destination";

const navItems = [
  { label: "Home", path: "/", icon: <Home /> },
  // { label: "Destination", path: "/destination", icon: <Destination /> },
  { label: "My Bookings", path: "/bookings", icon: <Bookmark /> },
  { label: "About us", path: "/about", icon: <InfoIcon /> },
];

const Navbar = ({ isLoggedIn, onLogout }) => {
  const { mood, setMood } = useContext(MoodContext);
  const history = useHistory();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const width = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 50 });

  const getMoodIcon = (currentMood) => {
    switch (currentMood) {
      case "nature":
        return <Forest />;
      case "urban":
        return <Apartment />;
      case "ocean":
        return <Waves />;
      case "romantic":
        return <Favorite />;
      case "royal":
        return <Castle />;
      default:
        return <AllInclusive />;
    }
  };

  const getMoodColor = (m) => {
    const colors = {
      nature: "#10b981",
      urban: "#ef4444",
      ocean: "#0ea5e9",
      romantic: "#ec4899",
      royal: "#f59e0b",
      default: "#3b82f6",
    };
    return colors[m] || colors.default;
  };

  const moodColor = getMoodColor(mood);
  const isActivePath = (path) => location.pathname === path;

  const moods = [
    { id: "default", label: "All", icon: <AllInclusive /> },
    { id: "nature", label: "Nature", icon: <Forest /> },
    { id: "urban", label: "Urban", icon: <Apartment /> },
    { id: "ocean", label: "Ocean", icon: <Waves /> },
    { id: "romantic", label: "Romantic", icon: <Favorite /> },
    { id: "royal", label: "Royal", icon: <Castle /> },
  ];

  const handleNavigation = (path) => {
    history.push(path);
    setDrawerOpen(false);
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={trigger ? 4 : 0}
        sx={{
          bgcolor: trigger ? "rgba(255, 255, 255, 0.98)" : "white",
          backdropFilter: trigger ? "blur(20px)" : "none",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          borderBottom: `1px solid ${alpha(moodColor, 0.1)}`,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            sx={{
              justifyContent: "space-between",
              minHeight: { xs: 55, md: 65 },
              px: { xs: 1, sm: 2 },
            }}
          >
            {/* LOGO */}
            <Box
              component={motion.div}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setMood("default");
                handleNavigation("/");
              }}
              sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={mood}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {React.cloneElement(getMoodIcon(mood), {
                    sx: {
                      fontSize: isMobile ? "1.8rem" : "2.2rem",
                      color: moodColor,
                    },
                  })}
                </motion.div>
              </AnimatePresence>
              <Typography
                variant={isMobile ? "h5" : "h4"}
                sx={{
                  ml: 1.5,
                  fontWeight: 900,
                  background: `linear-gradient(45deg, #111827, ${moodColor})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Stayflow
              </Typography>
            </Box>

            {/* DESKTOP NAV */}
            {!isMobile && (
              <Stack
                direction="row"
                spacing={3}
                sx={{ flex: 1, justifyContent: "center" }}
              >
                {navItems
                  .filter((i) => !(i.label === "My Bookings" && !isLoggedIn))
                  .map((item) => (
                    <Button
                      key={item.label}
                      onClick={() => handleNavigation(item.path)}
                      startIcon={item.icon}
                      sx={{
                        color: isActivePath(item.path)
                          ? moodColor
                          : "text.primary",
                        fontWeight: isActivePath(item.path) ? 800 : 700,
                        fontSize: "1rem",
                        textTransform: "none",
                        position: "relative",
                        // "&::after": isActivePath(item.path)
                        //   ? {
                        //       content: '""',
                        //       position: "absolute",
                        //       bottom: 0,
                        //       width: "100%",
                        //       height: "3px",
                        //       bgcolor: moodColor,
                        //       borderRadius: "2px",
                        //     }
                        //   : {},
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
              </Stack>
            )}

            {/* ACTION BUTTONS (Desktop) / MENU ICON (Mobile) */}
            <Stack direction="row" spacing={2} alignItems="center">
              {!isMobile ? (
                !isLoggedIn ? (
                  <>
                    <Button
                      variant="outlined"
                      onClick={() => history.push("/auth", { mode: "login" })}
                      sx={{
                        color: moodColor,
                        borderColor: alpha(moodColor, 0.5),
                        borderRadius: "20px",
                        fontWeight: 700,
                      }}
                    >
                      Log In
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => history.push("/auth", { mode: "signup" })}
                      sx={{
                        bgcolor: moodColor,
                        borderRadius: "20px",
                        fontWeight: 700,
                        "&:hover": {
                          bgcolor: moodColor,
                          filter: "brightness(0.9)",
                        },
                      }}
                    >
                      Sign Up
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      onClick={onLogout}
                      sx={{ bgcolor: moodColor, borderRadius: "20px" }}
                    >
                      Logout
                    </Button>
                    <Avatar
                      sx={{ bgcolor: alpha(moodColor, 0.1), color: moodColor }}
                    >
                      <AccountCircle />
                    </Avatar>
                  </>
                )
              ) : (
                <IconButton
                  onClick={() => setDrawerOpen(true)}
                  sx={{ bgcolor: alpha(moodColor, 0.1), borderRadius: "12px" }}
                >
                  <MenuIcon sx={{ color: moodColor, fontSize: "1.8rem" }} />
                </IconButton>
              )}
            </Stack>
          </Toolbar>

          {/* MOOD SCROLLER (The "Good" One) */}
          <Box
            sx={{
              pb: 1,
              px: { xs: 1, sm: 1.5 },
              borderTop: `1px solid ${alpha(moodColor, 0.05)}`,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                overflowX: "auto",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
                justifyContent: isMobile ? "flex-start" : "center",
                pt: 1.5,
              }}
            >
              {moods.map((m) => {
                const isActive = mood === m.id;
                const mColor = getMoodColor(m.id);
                return (
                  <Box
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                      minWidth: isMobile ? "75px" : "90px",
                      p: "8px 12px",
                      borderRadius: "16px",
                      transition: "all 0.3s ease",
                      color: isActive ? mColor : "#6b7280",
                      bgcolor: isActive ? alpha(mColor, 0.1) : "transparent",
                      transform: isActive ? "scale(1.05)" : "none",
                      "&:hover": {
                        bgcolor: alpha(mColor, 0.05),
                        transform: "translateY(-2px)",
                        color: mColor,
                      },
                    }}
                  >
                    <Box sx={{ fontSize: "1.6rem", mb: 0.5, display: "flex" }}>
                      {m.icon}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: isActive ? 800 : 600,
                        fontSize: "0.7rem",
                      }}
                    >
                      {m.label}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {/* PROGRESS BAR */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "3px",
              bgcolor: alpha(moodColor, 0.1),
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                width,
                height: "100%",
                backgroundColor: moodColor,
                boxShadow: `0 0 10px ${moodColor}`,
              }}
            />
          </Box>
        </Container>
      </AppBar>

      {/* MOBILE DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: "85%", maxWidth: 320, borderRadius: "24px 0 0 24px" },
        }}
      >
        <Box
          p={3}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6" fontWeight="900" color={moodColor}>
            STAYFLOW
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <ArrowForward />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ p: 2, flexGrow: 1 }}>
          {navItems
            .filter((i) => !(i.label === "My Bookings" && !isLoggedIn))
            .map((item) => (
              <ListItemButton
                key={item.label}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: "12px",
                  mb: 1,
                  bgcolor: isActivePath(item.path)
                    ? alpha(moodColor, 0.1)
                    : "transparent",
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActivePath(item.path) ? moodColor : "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActivePath(item.path) ? 700 : 500,
                  }}
                />
              </ListItemButton>
            ))}
        </List>
        <Box p={3} pb={5}>
          {!isLoggedIn ? (
            <Stack spacing={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleNavigation("/auth")}
                sx={{
                  py: 1.5,
                  borderRadius: "12px",
                  color: moodColor,
                  borderColor: moodColor,
                }}
              >
                Log In
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleNavigation("/auth")}
                sx={{ py: 1.5, borderRadius: "12px", bgcolor: moodColor }}
              >
                Sign Up
              </Button>
            </Stack>
          ) : (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Person />}
              onClick={() => {
                onLogout();
                setDrawerOpen(false);
              }}
              sx={{ py: 1.5, borderRadius: "12px", color: moodColor }}
            >
              Logout
            </Button>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;
