const Hotel = require("../models/Hotel");
const { uploadImageBuffer } = require("../config/cloudinary");

// GET /api/hotels
// Get all hotels
const getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: hotels.length,
      hotels,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotels",
      error: error.message,
    });
  }
};

// GET /api/hotels/:id
// Get single hotel
const getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    res.json({
      success: true,
      hotel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotel",
      error: error.message,
    });
  }
};

// POST /api/hotels
// Create hotel
const createHotel = async (req, res) => {
  try {
    const { name, location, price, rate, status, category, amenities, roomCategories } = req.body;

    if (!name || !location || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, location and price are required",
      });
    }

    // Upload the image to Cloudinary and store its permanent HTTPS URL.
    const uploadedImage = req.file
      ? await uploadImageBuffer(req.file.buffer)
      : null;
    const image = uploadedImage?.secure_url || "";

    // Parse amenities: accept JSON string or array
    let parsedAmenities = [];
    if (amenities) {
      try {
        parsedAmenities = typeof amenities === "string" ? JSON.parse(amenities) : amenities;
        if (!Array.isArray(parsedAmenities)) parsedAmenities = [];
      } catch {
        parsedAmenities = [];
      }
    }

    // Parse roomCategories: accept JSON string or array
    let parsedRoomCategories = [];
    if (roomCategories) {
      try {
        parsedRoomCategories =
          typeof roomCategories === "string" ? JSON.parse(roomCategories) : roomCategories;
        if (!Array.isArray(parsedRoomCategories)) parsedRoomCategories = [];
      } catch {
        parsedRoomCategories = [];
      }
    }

    const hotel = await Hotel.create({
      name,
      location,
      price,
      rate,
      status,
      image,
      category,
      amenities: parsedAmenities,
      roomCategories: parsedRoomCategories,
    });

    res.status(201).json({
      success: true,
      message: "Hotel created successfully",
      hotel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create hotel",
      error: error.message,
    });
  }
};

// PATCH /api/hotels/:id
// Update hotel
const updateHotel = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
    };

    // Only replace image if a new image was uploaded.
    // Existing images are preserved when the admin edits other hotel fields.
    if (req.file) {
      const uploadedImage = await uploadImageBuffer(req.file.buffer);
      updateData.image = uploadedImage.secure_url;
    }

    // Parse amenities if present
    if (updateData.amenities !== undefined) {
      try {
        if (typeof updateData.amenities === "string") {
          updateData.amenities = JSON.parse(updateData.amenities);
        }
        if (!Array.isArray(updateData.amenities)) {
          updateData.amenities = [];
        }
      } catch {
        updateData.amenities = [];
      }
    }

    // Parse roomCategories if present
    if (updateData.roomCategories !== undefined) {
      try {
        if (typeof updateData.roomCategories === "string") {
          updateData.roomCategories = JSON.parse(updateData.roomCategories);
        }
        if (!Array.isArray(updateData.roomCategories)) {
          updateData.roomCategories = [];
        }
      } catch {
        updateData.roomCategories = [];
      }
    }

    const hotel = await Hotel.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    res.json({
      success: true,
      message: "Hotel updated successfully",
      hotel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update hotel",
      error: error.message,
    });
  }
};

// DELETE /api/hotels/:id
// Delete hotel
const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    res.json({
      success: true,
      message: "Hotel deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete hotel",
      error: error.message,
    });
  }
};

module.exports = {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
};
