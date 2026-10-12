import { BrowserRouter as Router, Route, Switch, useLocation, Redirect } from "react-router-dom";

import { CssBaseline, createTheme, ThemeProvider } from "@mui/material";

import { useEffect, useState } from "react";

import Home from "./pages/client/Home";
// import Destination from "./pages/client/Destination";
import Bookings from "./pages/client/Bookings";
import Checkout from "./pages/client/Checkout";
import About from "./pages/client/About";
import Auth from "./pages/client/Auth";

import MoodProvider from "./context/MoodContext";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBooking from "./pages/admin/AdminBooking";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminHotel from "./pages/admin/AdminHotel";
import AdminCustomers from "./pages/admin/AdminCustomers";

import toast, { Toaster } from "react-hot-toast";

// ---------------------------------------------------------
// Global Material UI theme
// ---------------------------------------------------------
const theme = createTheme({
  typography: {
    fontFamily: "'Inter', sans-serif",

    h1: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 800,
    },

    h2: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 800,
    },

    h3: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 800,
    },

    h4: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 800,
    },

    h5: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 800,
    },

    h6: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 800,
    },

    button: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      textTransform: "none",
    },
  },

  shape: {
    borderRadius: 12,
  },
});

// =========================================================
// APP CONTENT
// =========================================================

const AppContent = ({ isLoggedIn, isAdmin, handleLogin, handleLogout }) => {
  const location = useLocation();

  // Used to hide customer Navbar/Footer on admin pages
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      {/* ---------------------------------------------------
          CUSTOMER NAVBAR
      --------------------------------------------------- */}
      {!isAdminPage && <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />}

      <Switch>
        {/* =================================================
            ADMIN ROUTES
        ================================================= */}
        <Route path="/admin">
          {isLoggedIn && isAdmin ? (
            <AdminLayout onLogout={handleLogout}>
              <Switch>
                {/* /admin -> /admin/admin */}
                <Route exact path="/admin">
                  <Redirect to="/admin/admin" />
                </Route>

                {/* Admin Dashboard */}
                <Route exact path="/admin/admin" component={AdminDashboard} />

                {/* Hotel Management */}
                <Route path="/admin/adminhotel" component={AdminHotel} />

                {/* Booking Management */}
                <Route path="/admin/adminbooking" component={AdminBooking} />

                {/* Customer Management */}
                <Route path="/admin/admincustomers" component={AdminCustomers} />
              </Switch>
            </AdminLayout>
          ) : (
            /*
             * If user is not an admin:
             *
             * Logged in user -> Home
             * Logged out user -> Auth
             */
            <Redirect to={isLoggedIn ? "/" : "/auth"} />
          )}
        </Route>

        {/* =================================================
            AUTH ROUTES
        ================================================= */}
        <Route path={["/auth", "/login", "/signup"]}>
          {isLoggedIn ? (
            /*
             * Already logged-in users should not see
             * login/signup again.
             */
            <Redirect to={isAdmin ? "/admin" : "/"} />
          ) : (
            <Auth onLogin={handleLogin} />
          )}
        </Route>

        {/* =================================================
            CUSTOMER BOOKINGS & CHECKOUT
        ================================================= */}
        <Route path="/checkout">{isLoggedIn ? <Checkout /> : <Redirect to="/auth" />}</Route>
        <Route path="/bookings">{isLoggedIn ? <Bookings /> : <Redirect to="/auth" />}</Route>

        {/* =================================================
            PUBLIC PAGES
        ================================================= */}
        <Route path="/about" component={About} />

        {/* <Route path="/destination" component={Destination} /> */}

        <Route exact path="/" component={Home} />
      </Switch>

      {/* ---------------------------------------------------
          CUSTOMER FOOTER
      --------------------------------------------------- */}
      {!isAdminPage && <Footer />}
    </>
  );
};

// =========================================================
// MAIN APP
// =========================================================

function App() {
  // -------------------------------------------------------
  // Login state
  // -------------------------------------------------------
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  // -------------------------------------------------------
  // Admin state
  //
  // IMPORTANT:
  // We now use the backend-provided role.
  //
  // Old:
  // user.email === "admin07@gmail.com"
  //
  // New:
  // user.role === "admin"
  // -------------------------------------------------------
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        return false;
      }

      const user = JSON.parse(storedUser);

      return user?.role === "admin";
    } catch (error) {
      console.error("Failed to read stored user:", error);

      return false;
    }
  });

  // -------------------------------------------------------
  // Called after successful login
  // -------------------------------------------------------
  const handleLogin = (user) => {
    setIsLoggedIn(true);

    localStorage.setItem("isLoggedIn", "true");

    // Backend sends role: "admin" or "user"
    const adminStatus = user?.role === "admin";

    setIsAdmin(adminStatus);
  };

  // -------------------------------------------------------
  // Logout
  // -------------------------------------------------------
  const handleLogout = () => {
    /*
     * IMPORTANT:
     * Do not use localStorage.clear().
     *
     * clear() removes everything stored by the application.
     * It is safer to remove only StayFlow authentication data.
     */

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");

    // Also clear old booking data from the previous system
    localStorage.removeItem("allBookings");

    setIsLoggedIn(false);
    setIsAdmin(false);

    toast.success("Logged out successfully!", {
      duration: 3000,
      position: "top-center",
    });
  };

  // -------------------------------------------------------
  // Fresh browser/tab session handling
  // -------------------------------------------------------
  useEffect(() => {
    /*
     * sessionStorage survives page refresh,
     * but is cleared when the browser tab/session ends.
     *
     * Therefore this logic ensures an old login from a
     * previous browser session is not automatically restored.
     */
    const sessionActive = sessionStorage.getItem("sessionActive");

    if (!sessionActive) {
      // Remove old authentication data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");

      // Old local booking data is no longer used
      localStorage.removeItem("allBookings");

      setIsLoggedIn(false);
      setIsAdmin(false);

      // Mark this browser tab/session as active
      sessionStorage.setItem("sessionActive", "true");
    }
  }, []);

  return (
    <MoodProvider>
      <ThemeProvider theme={theme}>
        <Router>
          <CssBaseline />

          <Toaster position="top-right" reverseOrder={false} />

          <AppContent
            isLoggedIn={isLoggedIn}
            isAdmin={isAdmin}
            handleLogin={handleLogin}
            handleLogout={handleLogout}
          />
        </Router>
      </ThemeProvider>
    </MoodProvider>
  );
}

export default App;
