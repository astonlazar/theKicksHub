const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories",
    },
    offerName: {
      type: String,
      required: true,
    },
    offerDescription: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    offerType: {
      type: String,
      enum: ["Product", "Category", "Referral"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("offers", offerSchema);
