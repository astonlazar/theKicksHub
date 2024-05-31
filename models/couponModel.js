const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
  },
  minPurchaseAmount: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("coupon", couponSchema);
