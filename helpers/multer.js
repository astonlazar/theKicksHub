
const multer = require("multer");
const path = require("path");

// Define the maximum file size (e.g., 5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Define allowed file types
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "public/uploads/");
  },
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    console.log("multer name ", uniqueSuffix);
    callback(null, uniqueSuffix);
  },
});

// File filter function to validate file type and size
const fileFilter = (req, file, callback) => {
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    return callback(new Error("Invalid file type. Only JPEG and PNG are allowed."));
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return callback(new Error("File size exceeds the maximum limit of 5MB."));
  }

  callback(null, true);
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Define the fields for multiple file uploads
const multiupload = upload.fields([
  { name: "product_img1", maxCount: 1 },
  { name: "product_img2", maxCount: 1 },
  { name: "product_img3", maxCount: 1 },
  { name: "product_img4", maxCount: 1 },
]);

module.exports = {
  upload,
  multiupload,
};
