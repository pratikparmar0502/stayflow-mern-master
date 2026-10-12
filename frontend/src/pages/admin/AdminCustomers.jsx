import React, { useState, useEffect } from "react";
import api from "../../api/axios";

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
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";

import toast from "react-hot-toast";

const AdminCustomers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ---------------------------------------------------------
  // Fetch all registered users from our StayFlow backend
  // ---------------------------------------------------------
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await api.get("/users");

      // Our backend returns:
      // {
      //   success: true,
      //   count: ...,
      //   users: [...]
      // }
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("User fetch error:", error);

      const message = error.response?.data?.message || "Failed to load users";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when admin customers page loads
  useEffect(() => {
    fetchUsers();
  }, []);

  // ---------------------------------------------------------
  // Delete user
  // ---------------------------------------------------------
  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this user?");

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);

      toast.success("User deleted successfully");

      // Refresh the customer list after deletion
      fetchUsers();
    } catch (error) {
      console.error("User delete error:", error);

      const message = error.response?.data?.message || "Failed to delete user";

      toast.error(message);
    }
  };

  // ---------------------------------------------------------
  // Search users by name or email
  // ---------------------------------------------------------
  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();

    return user.name?.toLowerCase().includes(search) || user.email?.toLowerCase().includes(search);
  });

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 3 },
        bgcolor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* HEADER SECTION */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        mb={4}
      >
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight={800} color="#1e293b">
          Registered Customers
        </Typography>

        <TextField
          size="small"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            bgcolor: "white",
            borderRadius: 2,
            width: { xs: "100%", md: 350 },
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {/* TABLE SECTION */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          overflowX: "auto",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 10,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: isMobile ? 600 : "100%" }}>
            <TableHead sx={{ bgcolor: "#f1f5f9" }}>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                  }}
                >
                  User Details
                </TableCell>

                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                  }}
                >
                  Email Address
                </TableCell>

                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                  }}
                >
                  Status
                </TableCell>

                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                  }}
                  align="right"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow
                    key={user._id}
                    hover
                    sx={{
                      "&:last-child td, &:last-child th": {
                        border: 0,
                      },
                    }}
                  >
                    {/* USER DETAILS */}
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 36,
                            height: 36,
                            fontSize: "0.9rem",
                            fontWeight: 700,
                          }}
                        >
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </Avatar>

                        <Typography variant="body2" fontWeight={600} color="#1e293b">
                          {user.name || "Unknown User"}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* EMAIL */}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </TableCell>

                    {/* STATUS */}
                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          bgcolor: "#dcfce7",
                          color: "#15803d",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                        }}
                      >
                        Active
                      </Box>
                    </TableCell>

                    {/* DELETE */}
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleDelete(user._id)}
                        color="error"
                        size="small"
                        sx={{
                          bgcolor: "#fee2e2",
                          "&:hover": {
                            bgcolor: "#fecaca",
                          },
                          transition: "0.2s",
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      No customers found with that name or email.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
};

export default AdminCustomers;
