const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Wallet = require("../models/walletModel");

//To load the order page
const loadOrderPage = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 10;
    let startIndex = (page - 1) * limit;
    const orderData = await Order.find()
      .skip(startIndex)
      .limit(limit)
      .populate("userId")
      .populate("products.productId")
      .sort({ orderDate: -1 });

    let totalDocuments = await Order.countDocuments();

    let totalPages = Math.ceil(totalDocuments / limit);
    res.render("orders", { orderData, totalPages, page });
  } catch (error) {
    console.log(`Error in order page - ${error}`);
  }
};

//To load the order details page
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

//To change the order status
const orderStatusChange = async (req, res) => {
  try {
    let { selectedValue, orderId, productId, index } = req.body;
    console.log(selectedValue, orderId, productId, index);
    let orderData = await Order.findOne({ _id: orderId });

    // Find the specific product within the order's products array
    let product = orderData.products.find(
      (p) => p._id.toString() === productId
    );
    console.log("Product found" + product);
    if (!product) {
      return res.status(404).json({ message: "Product not found in order" });
    }
    if (product.status !== "Cancelled" || product.status !== "Delivered") {
      product.status = selectedValue;
    } else {
      console.log(`Cannot change the status as it is already cancelled`);
    }
    let update;
    if (selectedValue === "Cancelled") {
      let updateProductData = orderData.products.forEach(async (products) => {
        update = {};
        update[`stock.${products.size}.quantity`] = products.quantity;
        let product = await Product.findByIdAndUpdate(
          products.productId,
          { $inc: update },
          { new: true, useFindAndModify: false }
        );
      });
    }
    await orderData.save();
    res.status(200).json({ message: "Successfully Updated" });
    if (update) {
      res.status(200).json({ message: "Successfully updated" });
    }
  } catch (error) {
    console.log(`Error in orderStatusChange -- ${error}`);
  }
};

//To cancel the order
const cancelOrder = async (req, res) => {
  try {
    let orderId = req.body.orderId;
    let productId = req.body.productId;
    console.log(orderId, productId);
    let orderData = await Order.findOne({ _id: orderId });
    if (orderData.paymentMethod === "RazorPay") {
      let walletData = await Wallet.findOne({ userId: req.session.user._id });
      if (!walletData) {
        let newWallet = new Wallet({
          userId: req.session.user._id,
          walletBalance: orderData.payableAmount,
          transactions: [
            {
              type: "credit",
              amount: orderData.payableAmount,
            },
          ],
        });
        await newWallet.save();
      } else {
        walletData.walletBalance += orderData.payableAmount;
        let updateWallet = walletData.transactions.unshift({
          type: "credit",
          amount: orderData.payableAmount,
        });
        await walletData.save();
      }
    }

    // Find the specific product within the order's products array
    let product = orderData.products.find(
      (p) => p._id.toString() === productId
    );
    console.log("Product found" + product);
    if (!product) {
      return res.status(404).json({ message: "Product not found in order" });
    }
    product.status = "Cancelled";

    let updateProductData = orderData.products.forEach(async (products) => {
      let update = {};
      update[`stock.${products.size}.quantity`] = products.quantity;
      let product = await Product.findByIdAndUpdate(
        products.productId,
        { $inc: update },
        { new: true, useFindAndModify: false }
      );
    });
    await orderData.save();

    res.status(200).json({ message: "Successfully Cancelled" });
  } catch (error) {
    console.log(`Error in cancelOrder --${error}`);
  }
};

//To return the delivered order
const returnOrder = async (req, res) => {
  try {
    const { orderId, productId, reason } = req.body;
    console.log(orderId, productId, reason);
    let orderData = await Order.findOne({ _id: orderId });

    let product = orderData.products.find(
      (p) => p._id.toString() === productId
    );
    console.log("Product found" + product);
    if (!product) {
      return res.status(404).json({ message: "Product not found in order" });
    }
    product.status = "Return Pending";
    product.reason = reason;

    await orderData.save();
    res.status(200).json({ message: "Return request send successfully" });
  } catch (error) {
    console.log(`Error in returnOrder -- ${error}`);
  }
};

module.exports = {
  loadOrderPage,
  orderDetailsPage,
  orderStatusChange,
  cancelOrder,
  returnOrder,
};
