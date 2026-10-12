/**
 * SAFE IDEMPOTENT MIGRATION — Add amenities + roomCategories to demo hotels
 *
 * Rules:
 * - Does NOT delete any hotels, bookings, users, or payments.
 * - Only updates known demo hotel records identified by their exact name.
 * - Does NOT overwrite existing amenities or roomCategories that are non-empty.
 * - Safe to re-run: will skip hotels that already have the data.
 * - Pass --dry-run flag to preview without writing anything.
 *
 * Usage:
 *   node scripts/migrateAmenities.js          # live update
 *   node scripts/migrateAmenities.js --dry-run # preview only
 */

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const isDryRun = process.argv.includes("--dry-run");

// =========================================================
// AMENITY ASSIGNMENTS PER DEMO HOTEL
// =========================================================
// Only known demo hotel names (must match exactly).
// =========================================================

const DEMO_AMENITIES = {
  // --- NATURE ---
  "Green Valley Retreat": ["wifi", "parking", "restaurant", "breakfast", "airConditioning", "gym"],
  "Forest Haven Resort": ["wifi", "parking", "breakfast", "petFriendly", "restaurant"],
  "Mountain Mist Resort": ["wifi", "parking", "restaurant", "breakfast", "airConditioning", "spa"],
  "Lakeside Nature Resort": ["wifi", "pool", "parking", "restaurant", "airConditioning", "gym"],
  "Pine Forest Lodge": ["wifi", "parking", "breakfast", "petFriendly"],
  "Valley View Escape": ["wifi", "parking", "restaurant", "airConditioning"],

  // --- URBAN ---
  "Metro Grand Hotel": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "gym",
    "roomService",
    "spa",
    "breakfast",
  ],
  "Cityscape Residency": [
    "wifi",
    "parking",
    "restaurant",
    "airConditioning",
    "gym",
    "roomService",
    "breakfast",
  ],
  "Downtown Elite Hotel": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "gym",
    "roomService",
    "spa",
    "breakfast",
  ],
  "Skyline Business Hotel": [
    "wifi",
    "parking",
    "restaurant",
    "airConditioning",
    "gym",
    "roomService",
    "breakfast",
  ],
  "Central Park Residency": ["wifi", "parking", "restaurant", "airConditioning", "gym"],
  "City Lights Premium": [
    "wifi",
    "parking",
    "restaurant",
    "airConditioning",
    "roomService",
    "breakfast",
  ],

  // --- OCEAN ---
  "Azure Beach Resort": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "spa",
    "breakfast",
    "roomService",
    "gym",
  ],
  "Ocean Breeze Resort": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "spa",
    "breakfast",
  ],
  "Coral Bay Retreat": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "spa",
    "breakfast",
    "gym",
    "roomService",
  ],
  "Blue Horizon Hotel": ["wifi", "pool", "parking", "restaurant", "airConditioning", "breakfast"],
  "Seaside Palm Resort": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "spa",
    "breakfast",
  ],
  "Sunset Coast Resort": ["wifi", "parking", "restaurant", "airConditioning", "breakfast"],

  // --- ROMANTIC ---
  "The Romantic Hideaway": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "spa",
    "breakfast",
    "roomService",
  ],
  "Love Valley Resort": [
    "wifi",
    "parking",
    "restaurant",
    "airConditioning",
    "spa",
    "breakfast",
    "roomService",
  ],
  "Moonlight Lake Resort": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "spa",
    "breakfast",
  ],
  "Couples Paradise": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "spa",
    "breakfast",
    "roomService",
    "gym",
  ],
  "Sunset Romance Resort": [
    "wifi",
    "parking",
    "restaurant",
    "airConditioning",
    "spa",
    "breakfast",
  ],
  "Whispering Pines Retreat": [
    "wifi",
    "parking",
    "restaurant",
    "airConditioning",
    "spa",
    "breakfast",
  ],

  // --- ROYAL ---
  "Royal Palace Heritage": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "gym",
    "spa",
    "breakfast",
    "roomService",
  ],
  "Maharaja Grand Palace": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "gym",
    "spa",
    "breakfast",
    "roomService",
  ],
  "Heritage Royal Haveli": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "spa",
    "breakfast",
    "roomService",
  ],
  "The Grand Rajputana": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "gym",
    "spa",
    "breakfast",
    "roomService",
  ],
  "Imperial Heritage Hotel": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "gym",
    "spa",
    "breakfast",
    "roomService",
  ],
  "Royal Courtyard Palace": [
    "wifi",
    "pool",
    "parking",
    "restaurant",
    "airConditioning",
    "spa",
    "breakfast",
    "roomService",
  ],
};

// =========================================================
// ROOM CATEGORY TEMPLATES PER HOTEL CATEGORY
// =========================================================
// pricePerNight is set relative to each hotel's base price.
// =========================================================

const buildRoomCategories = (basePrice, hotelCategory) => {
  const cat = hotelCategory || "nature";

  if (cat === "nature") {
    return [
      {
        name: "Standard Room",
        description: "Cozy room with forest views and natural ambience.",
        pricePerNight: Math.round(basePrice * 0.8),
        maxOccupancy: 2,
        bedType: "Double Bed",
        totalRooms: 10,
        amenities: ["wifi", "airConditioning"],
        isActive: true,
      },
      {
        name: "Deluxe Room",
        description: "Spacious room with balcony overlooking lush greenery.",
        pricePerNight: basePrice,
        maxOccupancy: 2,
        bedType: "King Bed",
        totalRooms: 8,
        amenities: ["wifi", "airConditioning", "breakfast"],
        isActive: true,
      },
      {
        name: "Family Suite",
        description: "Large suite perfect for families exploring nature.",
        pricePerNight: Math.round(basePrice * 1.5),
        maxOccupancy: 4,
        bedType: "Two Double Beds",
        totalRooms: 4,
        amenities: ["wifi", "airConditioning", "breakfast", "parking"],
        isActive: true,
      },
    ];
  }

  if (cat === "urban") {
    return [
      {
        name: "Standard Room",
        description: "Modern room in the heart of the city.",
        pricePerNight: Math.round(basePrice * 0.8),
        maxOccupancy: 2,
        bedType: "Double Bed",
        totalRooms: 12,
        amenities: ["wifi", "airConditioning"],
        isActive: true,
      },
      {
        name: "Deluxe Room",
        description: "City-view room with premium amenities.",
        pricePerNight: basePrice,
        maxOccupancy: 2,
        bedType: "King Bed",
        totalRooms: 10,
        amenities: ["wifi", "airConditioning", "roomService"],
        isActive: true,
      },
      {
        name: "Executive Room",
        description: "Business-class comfort with dedicated workspace.",
        pricePerNight: Math.round(basePrice * 1.3),
        maxOccupancy: 2,
        bedType: "King Bed",
        totalRooms: 6,
        amenities: ["wifi", "airConditioning", "roomService", "gym"],
        isActive: true,
      },
      {
        name: "Suite",
        description: "Luxury suite with panoramic city views.",
        pricePerNight: Math.round(basePrice * 1.8),
        maxOccupancy: 3,
        bedType: "King Bed",
        totalRooms: 3,
        amenities: ["wifi", "airConditioning", "roomService", "spa", "gym"],
        isActive: true,
      },
    ];
  }

  if (cat === "ocean") {
    return [
      {
        name: "Garden View Room",
        description: "Relaxing room with a garden view near the beach.",
        pricePerNight: Math.round(basePrice * 0.8),
        maxOccupancy: 2,
        bedType: "Double Bed",
        totalRooms: 10,
        amenities: ["wifi", "airConditioning"],
        isActive: true,
      },
      {
        name: "Ocean View Room",
        description: "Stunning ocean-facing room with private terrace.",
        pricePerNight: basePrice,
        maxOccupancy: 2,
        bedType: "King Bed",
        totalRooms: 8,
        amenities: ["wifi", "airConditioning", "breakfast"],
        isActive: true,
      },
      {
        name: "Beach Suite",
        description: "Direct beach access with exclusive suite amenities.",
        pricePerNight: Math.round(basePrice * 1.6),
        maxOccupancy: 3,
        bedType: "King Bed",
        totalRooms: 4,
        amenities: ["wifi", "airConditioning", "spa", "breakfast", "roomService"],
        isActive: true,
      },
      {
        name: "Family Suite",
        description: "Spacious family suite steps from the ocean.",
        pricePerNight: Math.round(basePrice * 1.9),
        maxOccupancy: 5,
        bedType: "Two Double Beds",
        totalRooms: 3,
        amenities: ["wifi", "airConditioning", "pool", "breakfast"],
        isActive: true,
      },
    ];
  }

  if (cat === "romantic") {
    return [
      {
        name: "Deluxe Room",
        description: "Beautifully appointed room for couples.",
        pricePerNight: Math.round(basePrice * 0.85),
        maxOccupancy: 2,
        bedType: "King Bed",
        totalRooms: 8,
        amenities: ["wifi", "airConditioning"],
        isActive: true,
      },
      {
        name: "Premium Room",
        description: "Romantic premium room with rose petal décor.",
        pricePerNight: basePrice,
        maxOccupancy: 2,
        bedType: "King Bed",
        totalRooms: 6,
        amenities: ["wifi", "airConditioning", "breakfast", "spa"],
        isActive: true,
      },
      {
        name: "Honeymoon Suite",
        description: "Exclusive suite for a perfect honeymoon experience.",
        pricePerNight: Math.round(basePrice * 1.7),
        maxOccupancy: 2,
        bedType: "King Bed",
        totalRooms: 3,
        amenities: ["wifi", "airConditioning", "spa", "breakfast", "roomService"],
        isActive: true,
      },
    ];
  }

  if (cat === "royal") {
    return [
      {
        name: "Superior Room",
        description: "Regal décor with classic heritage architecture.",
        pricePerNight: Math.round(basePrice * 0.75),
        maxOccupancy: 2,
        bedType: "King Bed",
        totalRooms: 10,
        amenities: ["wifi", "airConditioning", "breakfast"],
        isActive: true,
      },
      {
        name: "Deluxe Heritage Room",
        description: "Antique furnishings in a palace setting.",
        pricePerNight: basePrice,
        maxOccupancy: 2,
        bedType: "King Bed",
        totalRooms: 8,
        amenities: ["wifi", "airConditioning", "breakfast", "spa"],
        isActive: true,
      },
      {
        name: "Royal Suite",
        description: "Magnificent suite fit for royalty.",
        pricePerNight: Math.round(basePrice * 1.5),
        maxOccupancy: 3,
        bedType: "King Bed",
        totalRooms: 4,
        amenities: ["wifi", "airConditioning", "spa", "breakfast", "roomService", "gym"],
        isActive: true,
      },
      {
        name: "Maharaja Suite",
        description: "The pinnacle of luxury — private court and butler service.",
        pricePerNight: Math.round(basePrice * 2.2),
        maxOccupancy: 4,
        bedType: "King Bed",
        totalRooms: 2,
        amenities: ["wifi", "airConditioning", "spa", "breakfast", "roomService", "gym", "pool"],
        isActive: true,
      },
    ];
  }

  // Default fallback
  return [
    {
      name: "Standard Room",
      description: "Comfortable standard room.",
      pricePerNight: Math.round(basePrice * 0.85),
      maxOccupancy: 2,
      bedType: "Double Bed",
      totalRooms: 8,
      amenities: ["wifi", "airConditioning"],
      isActive: true,
    },
    {
      name: "Deluxe Room",
      description: "Spacious deluxe room with premium amenities.",
      pricePerNight: basePrice,
      maxOccupancy: 2,
      bedType: "King Bed",
      totalRooms: 5,
      amenities: ["wifi", "airConditioning", "breakfast"],
      isActive: true,
    },
  ];
};

// =========================================================
// MAIN MIGRATION
// =========================================================

const migrate = async () => {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not set in .env — aborting migration.");
    process.exit(1);
  }

  console.log(isDryRun ? "🔍 DRY-RUN MODE — No data will be written.\n" : "🚀 LIVE MODE\n");
  console.log("Connecting to database...");

  await mongoose.connect(MONGO_URI);

  console.log("✅ Connected.\n");

  // Load Hotel model AFTER connection
  // (model must match the path used in the main app)
  const Hotel = require("../src/models/Hotel");

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const [hotelName, amenityList] of Object.entries(DEMO_AMENITIES)) {
    const hotel = await Hotel.findOne({ name: hotelName });

    if (!hotel) {
      console.warn(`  ⚠️  Not found: "${hotelName}"`);
      notFound++;
      continue;
    }

    const alreadyHasAmenities = Array.isArray(hotel.amenities) && hotel.amenities.length > 0;
    const alreadyHasRooms =
      Array.isArray(hotel.roomCategories) && hotel.roomCategories.length > 0;

    if (alreadyHasAmenities && alreadyHasRooms) {
      console.log(`  ⏭️  Skipping (already migrated): "${hotelName}"`);
      skipped++;
      continue;
    }

    const roomCategories = buildRoomCategories(hotel.price, hotel.category);

    console.log(`  📝 ${isDryRun ? "[DRY-RUN] Would update" : "Updating"}: "${hotelName}"`);
    console.log(`      amenities: ${amenityList.join(", ")}`);
    console.log(`      room categories: ${roomCategories.map((r) => r.name).join(", ")}`);

    if (!isDryRun) {
      const updateFields = {};
      if (!alreadyHasAmenities) updateFields.amenities = amenityList;
      if (!alreadyHasRooms) updateFields.roomCategories = roomCategories;

      await Hotel.findByIdAndUpdate(hotel._id, { $set: updateFields });
      updated++;
    } else {
      updated++;
    }
  }

  console.log("\n─────────────────────────────");
  console.log(
    `${isDryRun ? "[DRY-RUN] Would update" : "Updated"}: ${updated} hotel(s)`,
  );
  console.log(`Skipped (already done): ${skipped}`);
  console.log(`Not found in DB: ${notFound}`);
  console.log(isDryRun ? "\nRun without --dry-run to apply." : "\n✅ Migration complete.");

  await mongoose.disconnect();
  process.exit(0);
};

migrate().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
