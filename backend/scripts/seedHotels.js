const dotenv = require("dotenv");
const connectDB = require("../src/config/db");
const Hotel = require("../src/models/Hotel");
const hotels = require("../data/hotels");

dotenv.config();

const seedHotels = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Remove existing hotels so we don't create duplicates
    await Hotel.deleteMany({});

    // Insert all 30 hotels
    const createdHotels = await Hotel.insertMany(hotels);

    console.log(`✅ ${createdHotels.length} hotels inserted successfully.`);

    // Close the database connection
    process.exit(0);
  } catch (error) {
    console.error("❌ Hotel seeding failed:", error.message);
    process.exit(1);
  }
};

seedHotels();