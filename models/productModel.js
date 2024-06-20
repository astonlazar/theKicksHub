const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "categories",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  promo_price: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  productImage: [
    {
      type: String,
    },
  ],
  stock: {
    UK6: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
    UK7: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
    UK8: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
    UK9: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
    UK10: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
    UK11: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
  },
  reviews: {
    ratings: {
      type: Number,
    },
    comments: {
      type: String,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("products", productSchema);
