const mongoose = require("mongoose");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");

const loadCart = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user._id);
    const cartData = await Cart.findOne({ userId: userData._id }).populate(
      "product.productId"
    );
    console.log(`---cartData - ${cartData}`);
    // console.log(cartData[0].product)
    res.render("cart", { cart: cartData });
    console.log(`--loading cart page`);
  } catch (error) {
    console.log(`Error in loadCart ${error}`);
  }
};

// const addToCart = async (req, res) => {
//   try {
//     let { productId, selectedSize } = req.body;
//     console.log(
//       `productId -- ${productId} and selectedSize -- ${selectedSize}`
//     );
//     const productData = await Product.findById(productId);
//     const userData = await User.findById(req.session.user._id);
//     console.log(productData);
//     console.log(userData);
//     let cartCheck = await Cart.find();
//     if (!cartCheck) {
//       let cartData = await Cart.insertMany([
//         {
//           userId: userData,
//           product: [
//             {
//               productId: productData,
//               size: selectedSize,
//               productPrice: productData.promo_price
//             },
//           ],
//           // totalPrice: productData.promo_price,
//         },
//       ]);
//       console.log(cartData);
//     } else {
//       let cartData = await Cart.updateOne(
//         { userId: userData },
//         { $push: { product: { productId: productData, size: selectedSize, productPrice: productData.promo_price } } }
//       );
//       console.log(cartData)
//       const pipeline = [
//         {
//           $match: { // Filter for the specific cart
//             _id:  mongoose.Types.ObjectId(cartData._id)
//           }
//         },
//         {
//           $unwind: '$product' // Deconstruct the product array into separate documents
//         },
//         {
//           $project: {
//             _id: 0, // Exclude _id from the result
//             totalPrice: { $sum: { $multiply: ['$productPrice', '$quantity'] } } // Calculate total price
//           }
//         }
//       ];
//       console.log(pipeline)
//       cartData = await Cart.aggregate(pipeline)
//       console.log(`Total Price in cart -- ${cartData}`)
//     }
//     // let cartTotalPrice = await Cart.aggregate([{ $project: { _id: 0, totalPrice: {$sum: "$"}}}])

//   } catch (error) {
//     console.log(`-Error in addToCart - ${error}`);
//   }
// };

const addToCart = async (req, res) => {
  try {
    const { productId, selectedSize } = req.body;
    console.log(
      `productId -- ${productId} and selectedSize -- ${selectedSize}`
    );

    const productData = await Product.findById(productId);
    const userData = await User.findById(req.session.user._id);
    console.log(productData);
    console.log(userData);

    // Find the cart for the specific user
    let cart = await Cart.findOne({ userId: userData._id });

    if (!cart) {
      // If no cart exists, create a new one
      cart = new Cart({
        userId: userData._id,
        product: [
          {
            productId: productData._id,
            size: selectedSize,
            productPrice: productData.promo_price,
            quantity: 1,
          },
        ],
        totalPrice: productData.promo_price,
      });
      await cart.save();
    } else {
      // If cart exists, update it
      const productIndex = cart.product.findIndex(
        (item) =>
          item.productId.toString() === productId && item.size === selectedSize
      );

      if (productIndex > -1) {
        // If product exists in cart, update quantity
        cart.product[productIndex].quantity += 1;
        // cart.product[productIndex].productPrice = productData.promo_price;
      } else {
        // If product doesn't exist in cart, add it
        cart.product.push({
          productId: productData._id,
          size: selectedSize,
          productPrice: productData.promo_price,
          quantity: 1,
        });
      }

      // Calculate total price
      cart.totalPrice = cart.product.reduce(
        (total, item) => total + item.productPrice * item.quantity,
        0
      );

      await cart.save();
    }

    console.log(`Total Price in cart -- ${cart.totalPrice}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(`-Error in addToCart - ${error}`);
    res.status(500).send("Internal Server Error");
  }
};

const removeFromCart = async (req, res) => {
  const { selectedSize, productId, productPrice } = req.body;
  console.log(`cartId -- ${selectedSize}, productId -- ${productId}`);
  let cartData = await Cart.updateOne(
    { userId: req.session.user._id },
    { $pull: { product: { productId: productId, size: selectedSize } } }
  );

  await Cart.updateOne(
    { userId: req.session.user._id },
    { $inc: { totalPrice: -productPrice } }
  );

  if (!cartData) {
    console.log(`Cannot find cartData`);
    return res.status(404).send("Cart not found");
  } else {
    console.log(`updated cart -- ${cartData._id}`);
  }
  res.status(200).json("Successfully removed from cart");
};

const quantityUpdate = async (req, res) => {
  try {
    console.log("cart qty");
    let { selectedSize, productId, status } = req.body;
    console.log(selectedSize, productId, status);
    let productData = await Product.findById(productId);
    let cartData = await Cart.findOne({ userId: req.session.user._id });
    if (status === "UP") {
      console.log(`status is ${status}`);
      const productIndex = cartData.product.findIndex(
        (item) =>
          item.productId.toString() === productId && item.size === selectedSize
      );
      console.log(productIndex);
      if (productIndex > -1) {
        if (
          cartData.product[productIndex].quantity >= 1 &&
          cartData.product[productIndex].quantity < 10
        ) {
          cartData.product[productIndex].quantity += 1;
          // cartData.product[productIndex].productPrice =
          //   productData.promo_price;
        } else {
          console.log("quantity out of range");
          return res.json("quantity out of range");
        }
      }

      cartData.totalPrice = cartData.product.reduce(
        (total, item) => total + item.productPrice * item.quantity,
        0
      );
      let total = cartData.totalPrice;
      await cartData.save();
      res
        .status(200)
        .json({ message: "quantity updated successfully", total: total });
    } else if (status === "DOWN") {
      console.log(`status is ${status}`);
      const productIndex = cartData.product.findIndex(
        (item) =>
          item.productId.toString() === productId && item.size === selectedSize
      );
      console.log(productIndex);
      if (productIndex > -1) {
        if (
          cartData.product[productIndex].quantity > 1 &&
          cartData.product[productIndex].quantity <= 10
        ) {
          cartData.product[productIndex].quantity -= 1;
          // cartData.product[productIndex].productPrice -=
          //   productData.promo_price;
        } else {
          console.log("quantity out of range");
          return res.json("quantity out of range");
        }
      }

      cartData.totalPrice = cartData.product.reduce(
        (total, item) => total + item.productPrice * item.quantity,
        0
      );
      let total = cartData.totalPrice;
      await cartData.save();
      res
        .status(200)
        .json({ message: "quantity updated successfully", total: total });
    }
  } catch (error) {
    console.log(`Error in quantityUpdate -- ${error}`);
  }
};

const loadCheckout = async (req, res) => {
  try {
    const cartData = await Cart.findOne({
      userId: req.session.user._id,
    }).populate("product.productId");
    const addressData = await Address.findOne({
      userId: req.session.user._id,
    });
    res.render("checkout", { cartData, addressData });
  } catch (error) {
    console.log(`Error in loadCheckout -- ${error}`);
  }
};

const newAddress = async (req, res) => {
  try {
    let {
      fullname,
      billing_address,
      billing_address2,
      city,
      state,
      pincode,
      phone,
      email,
    } = req.body;
    console.log(
      fullname,
      billing_address,
      billing_address2,
      city,
      state,
      pincode,
      phone,
      email
    );
    const cartData = await Cart.findOne({
      userId: req.session.user._id,
    }).populate("product.productId");
    let addressData = await Address.findOne({ userId: req.session.user._id });

    if (!addressData) {
      addressData = new Address({
        userId: req.session.user._id,
        address: [
          {
            fullName: fullname,
            addressLine1: billing_address,
            addressLine2: billing_address2,
            city: city,
            state: state,
            pincode: pincode,
            phoneNo: phone,
            email: email,
          },
        ],
      });
      await addressData.save();
    } else {
      addressData.address.push({
        fullName: fullname,
        addressLine1: billing_address,
        addressLine2: billing_address2,
        city: city,
        state: state,
        pincode: pincode,
        phoneNo: phone,
        email: email,
      });
      await addressData.save();
    }

    res.render("checkout", { cartData, addressData });
  } catch (error) {
    console.log(`Error in newAddress -- ${error}`);
  }
};

const placeOrder = async (req, res) => {
  let { selectedAddressIndex, selectedPaymentMethod } = req.body;
  console.log(selectedAddressIndex, selectedPaymentMethod);
  const addressData = await Address.findOne({ userId: req.session.user._id });
  // const productData = await Address.find();
  const cartData = await Cart.findOne({
    userId: req.session.user._id,
  }).populate("product.productId");
  let selectedAddress = addressData.address[selectedAddressIndex];
  let orderedProducts = cartData.product;
  let payableAmount = cartData.totalPrice;
  let order = Order.findOne({ userId: req.session.user._id });

  order = new Order({
    userId: req.session.user._id,
    cartId: cartData._id,
    products: orderedProducts,
    address: selectedAddress,
    payableAmount: cartData.totalPrice,
  });
  await order.save();

  let updateProductData = cartData.product.forEach(async (products) => {
    let update = {};
      update[`stock.${products.size}.quantity`] = -products.quantity;
      let product = await Product.findByIdAndUpdate(
        products.productId,
        { $inc: update },
        { new: true, useFindAndModify: false }
      );
  })

  cartData.product = []
  cartData.totalPrice = 0
  await cartData.save()

  console.log(selectedAddress, orderedProducts);
  console.log(updateProductData)
  res.status(200).json({ data: "Success" });
};

module.exports = {
  loadCart,
  addToCart,
  removeFromCart,
  quantityUpdate,
  loadCheckout,
  newAddress,
  placeOrder,
};
