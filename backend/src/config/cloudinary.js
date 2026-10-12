const cloudinary = require("cloudinary").v2;

// Credentials stay on the backend. Never expose CLOUDINARY_API_SECRET in React.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImageBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return reject(new Error("Cloudinary credentials are not configured."));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "stayflow/hotels",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) {
          return reject(new Error("Cloudinary did not return an image URL."));
        }
        resolve(result);
      },
    );

    stream.end(buffer);
  });

module.exports = { uploadImageBuffer };
