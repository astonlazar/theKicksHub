const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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
  // walletAmount: {
  //   type: Number,
  //   required: true,
  //   default: 0,
  // },
});

module.exports = mongoose.model("users", userSchema);
