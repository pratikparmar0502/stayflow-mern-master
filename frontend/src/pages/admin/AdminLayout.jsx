import React, { useState } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HotelIcon from "@mui/icons-material/Hotel";
import CalendarIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  alpha,
  AppBar,
  IconButton,
  CssBaseline,
} from "@mui/material";
import { useHistory, useLocation } from "react-router-dom";

const drawerWidth = 280;

const AdminLayout = ({ children, onLogout }) => {
  const history = useHistory();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/admin" },
    { text: "Manage Hotels", icon: <HotelIcon />, path: "/admin/adminhotel" },
    { text: "Bookings", icon: <CalendarIcon />, path: "/admin/adminbooking" },
    { text: "Customers", icon: <PeopleIcon />, path: "/admin/admincustomers" },
  ];

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar
        sx={{
          background: "linear-gradient(45deg, #1e293b 30%, #334155 90%)",
          color: "white",
        }}
      >
        <HotelIcon sx={{ mr: 1.5, color: "#38bdf8" }} />
        <Typography variant="h6" fontWeight={800}>
          STAYFLOW
        </Typography>
      </Toolbar>
      <List sx={{ px: 2, flexGrow: 1, mt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                history.push(item.path);
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: "12px",
                "&.Mui-selected": { bgcolor: alpha("#3b82f6", 0.1) },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.path
                      ? "primary.main"
                      : "inherit",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          onClick={onLogout}
          variant="contained"
          color="error"
          startIcon={<LogoutIcon />}
          sx={{ borderRadius: "12px" }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
      }}
    >
      <CssBaseline /> {/* Ye scroll issues fix karta hai */}
      {/* MOBILE APPBAR */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          display: { sm: "none" },
          bgcolor: "white",
          color: "black",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700}>
            Admin Panel
          </Typography>
        </Toolbar>
      </AppBar>
      {/* SIDEBAR */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "1px solid #e2e8f0",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      {/* MAIN CONTENT - THE REAL FIX */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 4 },
          width: { xs: "100%", sm: `calc(100% - ${drawerWidth}px)` }, // Width calculation fix
          minWidth: 0, // Content ko shrink hone ke liye allow karta hai
          mt: { xs: 8, sm: 0 },
          bgcolor: "#f8fafc",
          overflowX: "auto", // Tables ko layout todne se rokta hai
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
