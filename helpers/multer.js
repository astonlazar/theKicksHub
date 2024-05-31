const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "public/uploads/");
  },
  filename: (req, file, callback) => {
    const data = Date.now() + "-" + file.originalname;
    console.log("multer name ", data);
    callback(null, data);
  },
});

const upload = multer({ storage: storage });
// .array("product_img", 4); // Ignore any fields

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
