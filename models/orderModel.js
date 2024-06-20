const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "carts",
    required: true,
  },
  orderId: {
    type: String,
    default: () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    },
    unique: true,
  },
  products: [
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
        required: true,
        min: 1,
      },
      status: {
        type: String,
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
        default: "Pending",
      },
    },
  ],
  address: {
    fullName: {
      type: String,
      required: true,
    },
    addressLine1: {
      type: String,
      required: true,
    },
    addressLine2: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    phoneNo: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  payableAmount: {
    type: Number,
    required: true,
  },
  payment: {
    method: {
      type: String,
      enum: ["COD", "RazorPay"],
    },
    status: {
      type: String,
      enum: ["Success", "Failed"],
    },
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("orders", orderSchema);
