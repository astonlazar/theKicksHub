const Coupon = require("../models/couponModel");

const loadCouponPage = async (req, res) => {
  try {
    let couponData = await Coupon.find();
    if (couponData) {
      res.render("coupons", { couponData: couponData });
    } else {
      res.render("coupons", { couponData: "" });
    }
  } catch (error) {
    console.log(`Error in loadCouponPage -- ${error}`);
  }
};

const addCoupon = async (req, res) => {
  try {
    let {
      code,
      description,
      discountPercentage,
      minPurchaseAmount,
      quantity,
      expiryDate,
    } = req.body;
    console.log(
      code,
      description,
      discountPercentage,
      minPurchaseAmount,
      quantity,
      expiryDate
    );
    let couponCheck = await Coupon.findOne({ code: code });
    if (!couponCheck) {
      couponCheck = new Coupon({
        code: code,
        description: description,
        discountPercentage: discountPercentage,
        minPurchaseAmount: minPurchaseAmount,
        limitedQuantity: quantity,
        expiryDate: expiryDate,
      });
      await couponCheck.save();
      let couponData = await Coupon.find();
      res.render("coupons", { couponData: couponData });
    } else {
      res.status(500).json({ message: "Already exists" });
    }
  } catch (error) {
    console.log(`Error in addCoupon -- ${error}`);
  }
};

const applyCoupon = async (req, res) => {
  try {
    let couponCode = req.body.coupon;
    console.log(`couponCode -- ${couponCode}`);
    let couponData = await Coupon.findOne({ code: couponCode });
    let discountPercentage = couponData.discountPercentage;
    console.log(`discountpercentage -- ${discountPercentage}`);
    res.status(200).json({ discountPercentage: discountPercentage });
  } catch (error) {
    console.log(`Error in applyCoupon -- ${error}`)
  }
};

module.exports = {
  loadCouponPage,
  addCoupon,
  applyCoupon,
};
