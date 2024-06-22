const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");

const loadOrderPage = async (req, res) => {
  try {
    const orderData = await Order.find().populate("userId").populate("products.productId").sort({orderDate: -1})
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
    let { selectedValue, orderId, productId , index} = req.body;
    console.log(selectedValue, orderId, productId, index);
    let orderData = await Order.findOne({_id: orderId})


    // Find the specific product within the order's products array
    let product = orderData.products.find(p => p._id.toString() === productId);
    console.log('Product found'+product)
    if (!product) {
      return res.status(404).json({ message: "Product not found in order" });
    }
    if(product.status !== 'Cancelled'){
      product.status = selectedValue;
    } else {
      console.log(`Cannot change the status as it is already cancelled`)
    }
    let update
    if(selectedValue === 'Cancelled'){
      let updateProductData = orderData.products.forEach(async (products) => {
        update = {};
          update[`stock.${products.size}.quantity`] = products.quantity;
          let product = await Product.findByIdAndUpdate(
            products.productId,
            { $inc: update },
            { new: true, useFindAndModify: false }
          );
      })
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

const cancelOrder = async (req, res) => {
  try {
    let orderId = req.body.orderId;
    let productId = req.body.productId;
    console.log(orderId, productId);
    let orderData = await Order.findOne({_id: orderId})


    // Find the specific product within the order's products array
    let product = orderData.products.find(p => p._id.toString() === productId);
    console.log('Product found'+product)
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
    })
    await orderData.save();
    res.status(200).json({ message: "Successfully Cancelled" });
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
