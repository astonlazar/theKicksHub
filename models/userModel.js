const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: String,
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phoneNo: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    referralCode: {
      type: String,
      unique: true,
    },
    referredByCode: {
      type: String,
      default: "none",
    },
    referredBy: {
      type: String,
      default: "none",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("users", userSchema);
