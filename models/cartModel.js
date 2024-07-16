const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  product: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true,
      },
      size: {
        type: String,
        required: true,
      },
      productPrice: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
  totalPrice: {
    type: Number,
    default: 0,
  },
  totalPriceGST: {
    type: Number,
    default: 0,
  }
});

module.exports = mongoose.model("carts", cartSchema);
