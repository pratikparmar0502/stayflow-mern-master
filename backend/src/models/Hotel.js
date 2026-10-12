const mongoose = require("mongoose");

// =========================================================
// ROOM CATEGORY SCHEMA (embedded in Hotel)
// =========================================================
const roomCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    maxOccupancy: {
      type: Number,
      required: true,
      min: 1,
      default: 2,
    },
    bedType: {
      type: String,
      default: "Double Bed",
      trim: true,
    },
    totalRooms: {
      type: Number,
      required: true,
      min: 1,
      default: 5,
    },
    // Room-level amenities (subset identifiers from the master list)
    amenities: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true },
);

// =========================================================
// HOTEL SCHEMA
// =========================================================
const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    status: {
      type: String,
      default: "Available",
    },

    image: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "nature",
    },

    // Hotel-level amenity identifiers.
    // Defaults to [] so old documents without this field
    // can be read safely (Mongoose returns [] for missing arrays).
    amenities: {
      type: [String],
      default: [],
    },

    // Embedded room categories.
    // An empty array is fine — the checkout page handles it gracefully.
    roomCategories: {
      type: [roomCategorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Hotel", hotelSchema);
