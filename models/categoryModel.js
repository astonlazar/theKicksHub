const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
  },
  // slug: {
  //   type: String,
  //   required: true,
  // },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("categories", categorySchema);
