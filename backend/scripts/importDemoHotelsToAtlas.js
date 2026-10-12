const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load backend/.env before loading database or Cloudinary config.
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const cloudinary = require("cloudinary").v2;
const connectDB = require("../src/config/db");
const Hotel = require("../src/models/Hotel");
const hotels = require("../data/hotels");

// Existing image files are in frontend/src/assets/hotel-image.
const imageDirectory = path.resolve(__dirname, "../../frontend/src/assets/hotel-image");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function importDemoHotels() {
  try {
    // Check credentials before starting.
    const requiredEnv = [
      "MONGO_URI",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ];

    for (const key of requiredEnv) {
      if (!process.env[key]) {
        throw new Error(`Missing ${key} in backend/.env`);
      }
    }

    // Validate all local images before uploading anything.
    for (const hotel of hotels) {
      if (!hotel.name || !hotel.location || !Number.isFinite(Number(hotel.price))) {
        throw new Error(`Invalid hotel data: ${hotel.name || "Unknown"}`);
      }

      const imageName = path.basename(hotel.image);
      const imagePath = path.join(imageDirectory, imageName);

      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image not found for ${hotel.name}: ${imagePath}`);
      }
    }

    await connectDB();

    let inserted = 0;
    let skipped = 0;

    for (const hotel of hotels) {
      // Skip an existing matching hotel; never delete records.
      const existing = await Hotel.findOne({
        name: hotel.name,
        location: hotel.location,
      });

      if (existing) {
        skipped++;
        console.log(`Skipped existing hotel: ${hotel.name}`);
        continue;
      }

      const imageName = path.basename(hotel.image);
      const imagePath = path.join(imageDirectory, imageName);
      const publicId = path.parse(imageName).name;

      console.log(`Uploading image for: ${hotel.name}`);

      // Use a stable Cloudinary public ID to avoid
      // creating a new image asset on every retry.
      const uploaded = await cloudinary.uploader.upload(imagePath, {
        folder: "stayflow/hotels/demo",
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
      });

      // Save the existing hotel fields with the hosted image URL.
      await Hotel.create({
        ...hotel,
        image: uploaded.secure_url,
      });

      inserted++;
      console.log(`Imported: ${hotel.name}`);
    }

    console.log("\nImport completed successfully.");
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Source hotels: ${hotels.length}`);
  } catch (error) {
    console.error("\nImport failed:", error.message);
    process.exitCode = 1;
  } finally {
    await require("mongoose").disconnect();
  }
}

importDemoHotels();
