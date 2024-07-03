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
      res.redirect("/admin/coupons")
    } else {
      res.status(500).json({ message: "Already exists" });
    }
  } catch (error) {
    console.log(`Error in addCoupon -- ${error}`);
  }
};

const couponStatus = async (req, res) => {
  try {
    let couponId = req.body.couponId;
    let couponData = await Coupon.findById(couponId)
    let status = couponData.isActive;
    console.log(status, !status)
    couponData.isActive = !status
    let updatedCoupon = await couponData.save()
    if(updatedCoupon){
      res.status(200).json({message: 'Success'})
    }
  } catch (error) {
    console.log(`Error in couponStatus -- ${error}`)
  }
}

const applyCoupon = async (req, res) => {
  try {
    let couponCode = req.body.coupon;
    let amount = req.body.payableAmount;
    
    console.log(`couponCode -- ${couponCode} - Amount - ${amount}`);
    
    let currentDate = new Date();
    let couponData = await Coupon.findOne({ code: couponCode, isActive: true });

    if (!couponData) {
        return res.status(404).json({ message: "Coupon not available" });
    }

    if (couponData.expiryDate < currentDate) {
        return res.status(400).json({ message: "Coupon expired" });
    }
    if(amount < couponData.minPurchaseAmount) {
      return res.status(500).json({message: `Purchase for a minimum of ${couponData.minPurchaseAmount} to avail this coupon`})
    }

    let discountPercentage = couponData.discountPercentage;
    console.log(`discountPercentage -- ${discountPercentage}`);
    res.status(200).json({ discountPercentage: discountPercentage, message: "Success" });

} catch (error) {
    console.error(`Error applying coupon: ${error}`);
    res.status(500).json({ message: "An error occurred while applying the coupon" });
}
};

module.exports = {
  loadCouponPage,
  addCoupon,
  couponStatus,
  applyCoupon,
};
