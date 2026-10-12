import API from "../../api/axios";
import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  IconButton,
  alpha,
  Zoom,
} from "@mui/material";
import { Visibility, VisibilityOff, Email, Lock, Person, ArrowForward } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useHistory, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import { MoodContext } from "../../context/MoodContext";

const Auth = ({ onLogin }) => {
  const { mood } = useContext(MoodContext) || { mood: "default" };
  const history = useHistory();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // 1. Pehle location.state check karein (jo Navbar se aa raha hai)
    const modeFromNavbar = location.state?.mode;

    // 2. Phir actual URL path check karein
    const path = location.pathname;

    if (modeFromNavbar === "signup" || path === "/signup") {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }

    // Form reset karein jab bhi mode badle
    formik.resetForm();
  }, [location.state, location.pathname]);

  const moodColor =
    {
      nature: "#2e7d32",
      urban: "#EF4444",
      ocean: "#00bcd4",
      romantic: "#d81b60",
      royal: "#ffab00",
    }[mood] || "#1976d2";

  // --- FORMIK & YUP CONFIG ---
  const formik = useFormik({
    initialValues: { name: "", email: "", password: "" },
    validationSchema: Yup.object({
      name: !isLogin ? Yup.string().min(3, "Too short").required("Name is required") : Yup.string(),
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string().min(6, "Min 6 characters").required("Password is required"),
    }),
    onSubmit: async (values) => {
      const loadToast = toast.loading(isLogin ? "Signing in..." : "Creating account...");

      try {
        // ==========================================
        // LOGIN
        // ==========================================
        if (isLogin) {
          const response = await API.post("/auth/login", {
            email: values.email,
            password: values.password,
          });

          const { token, user } = response.data;

          // Save JWT token
          localStorage.setItem("token", token);

          // Save logged-in user
          localStorage.setItem("user", JSON.stringify(user));

          // Existing project login flag
          localStorage.setItem("isLoggedIn", "true");

          // Update parent application state
          if (onLogin) {
            onLogin(user);
          }

          toast.success(`Welcome ${user.name}!`, {
            id: loadToast,
          });

          // Navigate based on actual role
          if (user.role === "admin") {
            history.push("/admin");
          } else {
            history.push("/");
          }
        }

        // ==========================================
        // SIGN UP
        // ==========================================
        else {
          await API.post("/auth/register", {
            name: values.name,
            email: values.email,
            password: values.password,
          });

          toast.success("Account created successfully! Please login.", {
            id: loadToast,
          });

          // Switch back to login
          setTimeout(() => {
            setIsLogin(true);
            formik.resetForm();
            history.push("/login");
          }, 1200);
        }
      } catch (error) {
        console.error(isLogin ? "Login error:" : "Registration error:", error);

        const message = error.response?.data?.message || "Something went wrong. Please try again.";

        toast.error(message, {
          id: loadToast,
        });
      }
    },
  });

  // Toggle Function
  const handleToggle = () => {
    formik.resetForm();
    history.push(isLogin ? "/signup" : "/login");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle at 20% 30%, ${alpha(
          moodColor,
          0.15,
        )} 0%, transparent 40%),
                   linear-gradient(135deg, ${moodColor} 0%, #121212 100%)`,
      }}
    >
      <Container maxWidth="xs">
        <Zoom in timeout={500} key={isLogin}>
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: "32px",
              textAlign: "center",
              background: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(25px)",
              boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5)`,
            }}
          >
            <Typography variant="h4" fontWeight="900" mb={1}>
              {isLogin ? "Welcome Back" : "Join StayFlow"}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              {isLogin ? "Enter details to access your account" : "Sign up to start your journey"}
            </Typography>

            <form onSubmit={formik.handleSubmit}>
              <Stack spacing={2.5}>
                {!isLogin && (
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    {...formik.getFieldProps("name")}
                    error={formik.touched.name && !!formik.errors.name}
                    helperText={formik.touched.name && formik.errors.name}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: moodColor }} />,
                    }}
                  />
                )}
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  {...formik.getFieldProps("email")}
                  error={formik.touched.email && !!formik.errors.email}
                  helperText={formik.touched.email && formik.errors.email}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: moodColor }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  {...formik.getFieldProps("password")}
                  error={formik.touched.password && !!formik.errors.password}
                  helperText={formik.touched.password && formik.errors.password}
                  InputProps={{
                    startAdornment: <Lock sx={{ mr: 1, color: moodColor }} />,
                    endAdornment: (
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  endIcon={<ArrowForward />}
                  sx={{
                    py: 1.8,
                    borderRadius: "12px",
                    bgcolor: moodColor,
                    fontWeight: "bold",
                    mt: 2,
                  }}
                >
                  {isLogin ? "Log In" : "Sign Up"}
                </Button>
              </Stack>
            </form>

            <Typography
              onClick={handleToggle}
              sx={{
                mt: 4,
                cursor: "pointer",
                fontWeight: 600,
                color: "text.secondary",
              }}
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Box component="span" sx={{ color: moodColor, fontWeight: "800" }}>
                {isLogin ? "Sign Up" : "Log In"}
              </Box>
            </Typography>
          </Paper>
        </Zoom>
      </Container>
    </Box>
  );
};

export default Auth;
