import React, { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";

import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Modal,
  TextField,
  MenuItem,
  useTheme,
  Skeleton,
  useMediaQuery,
  OutlinedInput,
  InputLabel,
  FormControl,
  Select,
  Chip,
  Checkbox,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Alert,
  Grid,
} from "@mui/material";

import toast from "react-hot-toast";
import api from "../../api/axios";
import * as Yup from "yup";
import { ALL_AMENITY_OPTIONS, resolveAmenities } from "../../constants/amenities";

const AdminHotel = () => {
  const [list, setList] = useState([]);
  const [editData, setEditData] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Room category management modal state
  const [roomModalHotel, setRoomModalHotel] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({
    name: "",
    description: "",
    pricePerNight: "",
    maxOccupancy: 2,
    bedType: "Double Bed",
    totalRooms: 5,
    amenities: [],
    isActive: true,
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const BACKEND_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

  const getImageUrl = (image) => {
    if (!image) return "";
    if (image.startsWith("http://") || image.startsWith("https://")) return image;
    if (image.startsWith("/uploads/")) return `${BACKEND_URL}${image}`;
    return image;
  };

  // Form validation
  const validationSchema = Yup.object({
    name: Yup.string().required("Hotel name is required"),
    location: Yup.string().required("Location is required"),
    price: Yup.number().positive("Price must be greater than 0").required("Price is required"),
    category: Yup.string().required("Category is required"),
  });

  const initialValues = {
    name: "",
    location: "",
    price: "",
    status: "Available",
    image: null,
    category: "",
    amenities: [],
  };

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/hotels");
      setList(response.data.hotels || []);
    } catch (error) {
      console.error("GET Hotels Error:", error);
      toast.error(error.response?.data?.message || "Failed to load hotels.");
    } finally {
      setLoading(false);
    }
  };

  const displayPrice = (price) => {
    return Number(price || 0).toLocaleString("en-IN");
  };

  // Add / Update hotel
  const handleSubmit = async (values, { resetForm }) => {
    const toastId = toast.loading(editData ? "Updating hotel..." : "Adding hotel...");

    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("location", values.location);
      formData.append("price", values.price);
      formData.append("status", values.status);
      formData.append("category", values.category);
      formData.append("amenities", JSON.stringify(values.amenities || []));

      if (values.image instanceof File) {
        formData.append("image", values.image);
      }

      if (editData) {
        await api.patch(`/hotels/${editData._id}`, formData);
        toast.success("Hotel updated successfully!", { id: toastId });
      } else {
        await api.post("/hotels", formData);
        toast.success("Hotel added successfully!", { id: toastId });
      }

      finalize(resetForm);
    } catch (error) {
      console.error("Hotel action error:", error);
      toast.error(error.response?.data?.message || "Action failed. Please try again.", {
        id: toastId,
      });
    }
  };

  const finalize = (resetForm) => {
    setEditData(null);
    setOpenModal(false);
    if (resetForm) {
      resetForm();
    }
    getData();
  };

  const handleEdit = (item) => {
    setEditData({
      ...item,
      image: item.image || null,
      amenities: Array.isArray(item.amenities) ? item.amenities : [],
    });
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this hotel?")) {
      return;
    }

    try {
      await api.delete(`/hotels/${id}`);
      toast.success("Hotel deleted successfully!");
      getData();
    } catch (error) {
      console.error("Delete hotel error:", error);
      toast.error(error.response?.data?.message || "Failed to delete hotel.");
    }
  };

  // ── ROOM CATEGORY ADMIN HANDLERS ──────────────────────────────
  const openRoomModal = (hotel) => {
    setRoomModalHotel(hotel);
    setEditingRoom(null);
    setRoomForm({
      name: "",
      description: "",
      pricePerNight: hotel.price || "",
      maxOccupancy: 2,
      bedType: "Double Bed",
      totalRooms: 5,
      amenities: [],
      isActive: true,
    });
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      name: room.name || "",
      description: room.description || "",
      pricePerNight: room.pricePerNight || "",
      maxOccupancy: room.maxOccupancy || 2,
      bedType: room.bedType || "Double Bed",
      totalRooms: room.totalRooms || 5,
      amenities: Array.isArray(room.amenities) ? room.amenities : [],
      isActive: room.isActive !== false,
    });
  };

  const handleSaveRoom = async () => {
    if (!roomForm.name.trim()) {
      toast.error("Room category name is required");
      return;
    }
    if (!roomForm.pricePerNight || Number(roomForm.pricePerNight) <= 0) {
      toast.error("Valid price per night is required");
      return;
    }
    if (!roomForm.maxOccupancy || Number(roomForm.maxOccupancy) <= 0) {
      toast.error("Max occupancy must be at least 1");
      return;
    }
    if (!roomForm.totalRooms || Number(roomForm.totalRooms) <= 0) {
      toast.error("Total rooms must be at least 1");
      return;
    }

    const currentRooms = Array.isArray(roomModalHotel.roomCategories)
      ? [...roomModalHotel.roomCategories]
      : [];

    let updatedRooms;
    if (editingRoom) {
      updatedRooms = currentRooms.map((r) =>
        r._id === editingRoom._id
          ? {
              ...r,
              name: roomForm.name.trim(),
              description: roomForm.description.trim(),
              pricePerNight: Number(roomForm.pricePerNight),
              maxOccupancy: Number(roomForm.maxOccupancy),
              bedType: roomForm.bedType.trim(),
              totalRooms: Number(roomForm.totalRooms),
              amenities: roomForm.amenities,
              isActive: roomForm.isActive,
            }
          : r
      );
    } else {
      updatedRooms = [
        ...currentRooms,
        {
          name: roomForm.name.trim(),
          description: roomForm.description.trim(),
          pricePerNight: Number(roomForm.pricePerNight),
          maxOccupancy: Number(roomForm.maxOccupancy),
          bedType: roomForm.bedType.trim(),
          totalRooms: Number(roomForm.totalRooms),
          amenities: roomForm.amenities,
          isActive: roomForm.isActive,
        },
      ];
    }

    const toastId = toast.loading("Saving room category...");
    try {
      const response = await api.patch(`/hotels/${roomModalHotel._id}`, {
        roomCategories: updatedRooms,
      });
      toast.success(editingRoom ? "Room updated!" : "Room added!", { id: toastId });
      setRoomModalHotel(response.data.hotel);
      setEditingRoom(null);
      setRoomForm({
        name: "",
        description: "",
        pricePerNight: response.data.hotel.price || "",
        maxOccupancy: 2,
        bedType: "Double Bed",
        totalRooms: 5,
        amenities: [],
        isActive: true,
      });
      getData();
    } catch (err) {
      console.error("Save room category error:", err);
      toast.error(err.response?.data?.message || "Failed to save room category", { id: toastId });
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Remove this room category?")) return;

    const updatedRooms = (roomModalHotel.roomCategories || []).filter((r) => r._id !== roomId);
    const toastId = toast.loading("Removing room...");
    try {
      const response = await api.patch(`/hotels/${roomModalHotel._id}`, {
        roomCategories: updatedRooms,
      });
      toast.success("Room category removed!", { id: toastId });
      setRoomModalHotel(response.data.hotel);
      getData();
    } catch (err) {
      console.error("Delete room error:", err);
      toast.error(err.response?.data?.message || "Failed to remove room category", { id: toastId });
    }
  };

  return (
    <Box sx={{ width: "100%", overflowX: "hidden" }}>
      {/* PAGE HEADER */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        mb={4}
      >
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight={800}>
          Manage Hotels
        </Typography>

        <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <TextField
            fullWidth={isMobile}
            size="small"
            placeholder="Search Hotels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ bgcolor: "white", borderRadius: "8px" }}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditData(null);
              setOpenModal(true);
            }}
            sx={{ whiteSpace: "nowrap", px: { xs: 2, md: 3 } }}
          >
            Add Hotel
          </Button>
        </Stack>
      </Stack>

      {/* HOTEL TABLE */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          overflowX: "auto",
        }}
      >
        <Table sx={{ minWidth: 750 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Hotel Image</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Hotel Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Base Price (₹)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amenities</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading
              ? [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton variant="rectangular" width={50} height={50} sx={{ borderRadius: "10px" }} />
                    </TableCell>
                    <TableCell><Skeleton variant="text" width="80%" height={25} /></TableCell>
                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                    <TableCell><Skeleton variant="rounded" width={80} height={25} /></TableCell>
                    <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Skeleton variant="circular" width={30} height={30} />
                        <Skeleton variant="circular" width={30} height={30} />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              : list
                  .filter((item) => item.name?.toLowerCase().includes(search.toLowerCase()))
                  .map((row) => (
                    <TableRow key={row._id} hover>
                      <TableCell>
                        <Box
                          component="img"
                          src={getImageUrl(row.image)}
                          alt={row.name}
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: "10px",
                            objectFit: "cover",
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography fontWeight={600} variant="body2">
                          {row.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Array.isArray(row.roomCategories) ? `${row.roomCategories.length} room type(s)` : "0 room types"}
                        </Typography>
                      </TableCell>

                      <TableCell>{row.location}</TableCell>

                      <TableCell sx={{ fontWeight: 700 }}>
                        ₹ {displayPrice(row.price)}
                      </TableCell>

                      <TableCell>
                        <Box
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            bgcolor: "#f1f5f9",
                            borderRadius: "12px",
                            display: "inline-block",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {row.category || "N/A"}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {Array.isArray(row.amenities) && row.amenities.length > 0
                            ? `${row.amenities.length} selected`
                            : "None"}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<MeetingRoomIcon fontSize="small" />}
                            onClick={() => openRoomModal(row)}
                            sx={{
                              borderRadius: "8px",
                              fontSize: "12px",
                              textTransform: "none",
                              py: 0.5,
                              px: 1,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Rooms
                          </Button>

                          <IconButton
                            size="small"
                            onClick={() => handleEdit(row)}
                            sx={{
                              bgcolor: "#e0f2fe",
                              color: "#0284c7",
                              borderRadius: "8px",
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>

                          <IconButton
                            size="small"
                            onClick={() => handleDelete(row._id)}
                            sx={{
                              bgcolor: "#fee2e2",
                              color: "#ef4444",
                              borderRadius: "8px",
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ADD / EDIT HOTEL MODAL */}
      <Modal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditData(null);
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Box
          sx={{
            width: { xs: "100%", sm: 520 },
            maxHeight: "90vh",
            overflowY: "auto",
            bgcolor: "background.paper",
            borderRadius: "24px",
            p: { xs: 3, md: 4 },
            position: "relative",
            outline: "none",
          }}
        >
          <Typography variant="h6" fontWeight={800} mb={3}>
            {editData ? "Edit Hotel Details" : "Register New Hotel"}
          </Typography>

          <Formik
            initialValues={editData || initialValues}
            validationSchema={validationSchema}
            enableReinitialize
            onSubmit={handleSubmit}
          >
            {({ setFieldValue, values, errors, touched, handleChange }) => (
              <Form>
                <Stack spacing={2.5}>
                  {/* HOTEL NAME */}
                  <Field
                    as={TextField}
                    name="name"
                    label="Hotel Name"
                    fullWidth
                    size="small"
                    error={touched.name && !!errors.name}
                    helperText={touched.name && errors.name}
                  />

                  {/* LOCATION */}
                  <Field
                    as={TextField}
                    name="location"
                    label="Location"
                    fullWidth
                    size="small"
                    error={touched.location && !!errors.location}
                    helperText={touched.location && errors.location}
                  />

                  {/* PRICE — Rupee label, dollar helper text removed */}
                  <Field
                    as={TextField}
                    name="price"
                    label="Base Price (₹)"
                    type="number"
                    fullWidth
                    size="small"
                    error={touched.price && !!errors.price}
                    helperText={touched.price && errors.price}
                  />

                  {/* CATEGORY */}
                  <TextField
                    select
                    label="Category (Mood)"
                    name="category"
                    value={values.category}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    error={touched.category && !!errors.category}
                    helperText={touched.category && errors.category}
                  >
                    <MenuItem value="" disabled>
                      Select Mood
                    </MenuItem>
                    {["nature", "urban", "ocean", "romantic", "royal"].map((option) => (
                      <MenuItem key={option} value={option}>
                        {option.toUpperCase()}
                      </MenuItem>
                    ))}
                  </TextField>

                  {/* AMENITIES MULTI-SELECT */}
                  <FormControl fullWidth size="small">
                    <InputLabel id="amenities-label">Amenities</InputLabel>
                    <Select
                      labelId="amenities-label"
                      multiple
                      value={values.amenities || []}
                      onChange={(e) => setFieldValue("amenities", e.target.value)}
                      input={<OutlinedInput label="Amenities" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {resolveAmenities(selected).map((a) => (
                            <Chip key={a.id} label={`${a.emoji} ${a.label}`} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {ALL_AMENITY_OPTIONS.map((opt) => (
                        <MenuItem key={opt.id} value={opt.id}>
                          <Checkbox checked={(values.amenities || []).indexOf(opt.id) > -1} />
                          <ListItemText primary={`${opt.emoji} ${opt.label}`} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* IMAGE UPLOAD */}
                  <Box
                    sx={{
                      border: "2px dashed",
                      borderColor: "#e2e8f0",
                      p: 2,
                      borderRadius: "12px",
                      textAlign: "center",
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      id="hotel-img"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        if (file) {
                          setFieldValue("image", file);
                        }
                      }}
                    />
                    <label htmlFor="hotel-img">
                      <Button component="span" variant="outlined" size="small" sx={{ mb: 1 }}>
                        Upload Image
                      </Button>
                    </label>

                    {values.image && (
                      <Box mt={1}>
                        <img
                          src={
                            typeof values.image === "string"
                              ? getImageUrl(values.image)
                              : URL.createObjectURL(values.image)
                          }
                          alt="preview"
                          style={{
                            width: "100%",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />
                      </Box>
                    )}
                  </Box>

                  {/* SUBMIT */}
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      py: 1.5,
                      borderRadius: "12px",
                      fontWeight: "bold",
                      fontSize: "16px",
                    }}
                  >
                    {editData ? "Update Hotel" : "Add Hotel"}
                  </Button>
                </Stack>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>

      {/* ROOM CATEGORIES MANAGEMENT DIALOG */}
      <Dialog
        open={Boolean(roomModalHotel)}
        onClose={() => setRoomModalHotel(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px" } }}
      >
        {roomModalHotel && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>
              Manage Room Categories — {roomModalHotel.name}
            </DialogTitle>
            <DialogContent dividers>
              {/* Existing room categories list */}
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Current Room Categories ({roomModalHotel.roomCategories?.length || 0})
              </Typography>
              {(!roomModalHotel.roomCategories || roomModalHotel.roomCategories.length === 0) ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                  No room categories configured yet. Add categories below to let customers choose rooms.
                </Alert>
              ) : (
                <Stack spacing={1.5} mb={3}>
                  {roomModalHotel.roomCategories.map((room) => (
                    <Paper
                      key={room._id}
                      variant="outlined"
                      sx={{ p: 2, borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography fontWeight={700}>{room.name}</Typography>
                          {!room.isActive && <Chip label="Inactive" size="small" color="default" />}
                          <Chip label={room.bedType} size="small" variant="outlined" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          ₹{displayPrice(room.pricePerNight)}/night · Max {room.maxOccupancy} guests · {room.totalRooms} rooms total
                        </Typography>
                        {room.description && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {room.description}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" onClick={() => handleEditRoom(room)} sx={{ bgcolor: "#e0f2fe", color: "#0284c7" }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteRoom(room._id)} sx={{ bgcolor: "#fee2e2", color: "#ef4444" }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Add / Edit Room Category Form */}
              <Typography variant="subtitle2" fontWeight={800} mb={2}>
                {editingRoom ? `Edit Category: ${editingRoom.name}` : "Add New Room Category"}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Room Name (e.g. Deluxe Room)"
                    size="small"
                    fullWidth
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Price Per Night (₹)"
                    type="number"
                    size="small"
                    fullWidth
                    value={roomForm.pricePerNight}
                    onChange={(e) => setRoomForm({ ...roomForm, pricePerNight: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Max Occupancy (Guests)"
                    type="number"
                    size="small"
                    fullWidth
                    value={roomForm.maxOccupancy}
                    onChange={(e) => setRoomForm({ ...roomForm, maxOccupancy: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Total Rooms Available"
                    type="number"
                    size="small"
                    fullWidth
                    value={roomForm.totalRooms}
                    onChange={(e) => setRoomForm({ ...roomForm, totalRooms: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Bed Type"
                    size="small"
                    fullWidth
                    value={roomForm.bedType}
                    onChange={(e) => setRoomForm({ ...roomForm, bedType: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Short Description"
                    size="small"
                    fullWidth
                    value={roomForm.description}
                    onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="room-amenities-label">Room-Specific Amenities</InputLabel>
                    <Select
                      labelId="room-amenities-label"
                      multiple
                      value={roomForm.amenities}
                      onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                      input={<OutlinedInput label="Room-Specific Amenities" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {resolveAmenities(selected).map((a) => (
                            <Chip key={a.id} label={`${a.emoji} ${a.label}`} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {ALL_AMENITY_OPTIONS.map((opt) => (
                        <MenuItem key={opt.id} value={opt.id}>
                          <Checkbox checked={roomForm.amenities.indexOf(opt.id) > -1} />
                          <ListItemText primary={`${opt.emoji} ${opt.label}`} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={roomForm.isActive}
                        onChange={(e) => setRoomForm({ ...roomForm, isActive: e.target.checked })}
                      />
                    }
                    label="Active (Available for booking)"
                  />
                </Grid>
              </Grid>

              <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                <Button variant="contained" onClick={handleSaveRoom} sx={{ borderRadius: "8px" }}>
                  {editingRoom ? "Update Category" : "Add Category"}
                </Button>
                {editingRoom && (
                  <Button
                    variant="text"
                    onClick={() => {
                      setEditingRoom(null);
                      setRoomForm({
                        name: "",
                        description: "",
                        pricePerNight: roomModalHotel.price || "",
                        maxOccupancy: 2,
                        bedType: "Double Bed",
                        totalRooms: 5,
                        amenities: [],
                        isActive: true,
                      });
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setRoomModalHotel(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminHotel;
