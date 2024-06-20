const mongoose = require("mongoose");

const addressSchema = {
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  address: [
    {
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
      idDefault: {
        type: Boolean,
        default: false,
      },
    },
  ],
};

module.exports = mongoose.model("addresses", addressSchema);
