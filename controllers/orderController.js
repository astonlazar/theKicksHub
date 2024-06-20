const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");

const loadOrderPage = async (req, res) => {
  try {
    const orderData = await Order.find().populate("userId");
    res.render("orders", { orderData });
  } catch (error) {
    console.log(`Error in order page - ${error}`);
  }
};

const orderDetailsPage = async (req, res) => {
  try {
    let orderId = req.query.orderId;
    let orderData = await Order.findOne({ orderId: orderId }).populate(
      "products.productId"
    );
    res.render("order-details", { orderData });
  } catch (error) {
    console.log(`Error in orderDetailsPage -- ${error}`);
  }
};

const orderStatusChange = async (req, res) => {
  try {
    let { selectedValue, orderId } = req.body;
    console.log(selectedValue, orderId);
    // let orderData = await Order.findOne({orderId: orderId})
    let update = await Order.updateOne(
      { orderId: orderId },
      { $set: { status: selectedValue } }
    );
    if (update) {
      res.status(200).json({ message: "Success" });
    }
  } catch (error) {
    console.log(`Error in orderStatusChange -- ${error}`);
  }
};

const cancelOrder = async (req, res) => {
  try {
    let orderId = req.body.orderId;
    console.log(orderId);
    let orderData = await Order.findOne({orderId: orderId})
    let update = await Order.updateOne(
      { orderId: orderId },
      { $set: { status: "Cancelled" } }
    );
    let updateProductData = orderData.products.forEach(async (products) => {
      let update = {};
        update[`stock.${products.size}.quantity`] = products.quantity;
        let product = await Product.findByIdAndUpdate(
          products.productId,
          { $inc: update },
          { new: true, useFindAndModify: false }
        );
    })
    if (update) {
      res.status(200).json({ message: "Successfully Cancelled" });
    }
  } catch (error) {
    console.log(`Error in cancelOrder --${error}`);
  }
};

module.exports = {
  loadOrderPage,
  orderDetailsPage,
  orderStatusChange,
  cancelOrder,
};
