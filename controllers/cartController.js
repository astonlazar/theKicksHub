const mongoose = require("mongoose");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModel");
const Wishlist = require("../models/wishlistModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

const RazorPayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const loadCart = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user._id);
    const cartData = await Cart.findOne({ userId: userData._id }).populate(
      "product.productId"
    );
    let wishlistData = await Wishlist.findOne({ userId: req.session.user._id });
    wishlistCount = wishlistData?.products?.length ?? 0;
    cartCount = cartData?.product?.length ?? 0;
    console.log(`---cartData - ${cartData}`);
    // console.log(cartData[0].product)
    res.render("cart", { cart: cartData, wishlistCount, cartCount });
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
    console.log(`productId -- ${productId} and selectedSize -- ${selectedSize}`);

    // Fetch product data
    let productData = await Product.findById(productId).populate("offer");
    
    if (!productData) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const userData = await User.findById(req.session.user._id);
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log(productData);
    console.log(userData);

    // Calculate product price based on offer
    const productPrice = productData.offer 
      ? Math.ceil(productData.price - (productData.offer.discount / 100) * productData.price)
      : productData.promo_price;

    // Find or create the cart for the user
    let cart = await Cart.findOne({ userId: userData._id });
    if (!cart) {
      cart = new Cart({
        userId: userData._id,
        product: [
          {
            productId: productData._id,
            size: selectedSize,
            productPrice: productPrice,
            quantity: 1,
          },
        ],
        totalPrice: productPrice,
        // totalPriceGST: (productPrice + (productPrice * 0.12)).toFixed(2)
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
      } else {
        // If product doesn't exist in cart, add it
        cart.product.push({
          productId: productData._id,
          size: selectedSize,
          productPrice: productPrice,
          quantity: 1,
        });
      }

      // Calculate total price
      cart.totalPrice = cart.product.reduce(
        (total, item) => total + item.productPrice * item.quantity,
        0
      );

      // cart.totalPriceGST = (cart.totalPrice + (cart.totalPrice * 0.12))

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

  // let updateCartData = await Cart.findOne({userId: req.session.user._id})

  // updateCartData.totalPriceGST -= productPrice * 0.12
  // await updateCartData.save()

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
      const findProductStock = productData.stock[selectedSize].quantity;
      console.log(findProductStock);
      console.log(productIndex);
      if (productIndex > -1) {
        if (cartData.product[productIndex].quantity < findProductStock) {
          if (
            cartData.product[productIndex].quantity >= 1 &&
            cartData.product[productIndex].quantity < 10
          ) {
            cartData.product[productIndex].quantity += 1;
            // cartData.product[productIndex].productPrice =
            //   productData.promo_price;
          } else {
            console.log("quantity out of range");
            return res.json({
              message: "Max 10",
              total: cartData.totalPrice,
              // totalGST: cartData.totalPriceGST
            });
          }
        } else {
          return res.json({
            message: "product exceeded",
            total: cartData.totalPrice,
            // totalGST: cartData.totalPriceGST
          });
        }
      }

      cartData.totalPrice = cartData.product.reduce(
        (total, item) => total + item.productPrice * item.quantity,
        0
      );
      // cartData.totalPriceGST = (cartData.totalPrice + (cartData.totalPrice * 0.12))

      let total = cartData.totalPrice;
      // let totalGST= cartData.totalPriceGST
      await cartData.save();
      res.status(200).json({
        message: "quantity updated successfully",
        total: total,
        // totalGST: totalGST,
        products: cartData.product,
      });
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
          return res.json({
            message: "Min 1",
            total: cartData.totalPrice,
            // totalGST: cartData.totalPriceGST
          });
        }
      }

      cartData.totalPrice = cartData.product.reduce(
        (total, item) => total + item.productPrice * item.quantity,
        0
      );

      // cartData.totalPriceGST = (cartData.totalPrice + (cartData.totalPrice * 0.12))
      let total = cartData.totalPrice;
      // let totalGST= cartData.totalPriceGST
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

// const placeOrder = async (req, res) => {
//   let {
//     selectedAddressIndex,
//     selectedPaymentMethod,
//     totalPrice,
//     couponApplied,
//   } = req.body;
//   console.log(
//     selectedAddressIndex,
//     selectedPaymentMethod,
//     totalPrice,
//     couponApplied
//   );
//   const addressData = await Address.findOne({ userId: req.session.user._id });
//   // const productData = await Address.find();
//   const cartData = await Cart.findOne({
//     userId: req.session.user._id,
//   }).populate("product.productId");
//   let selectedAddress = addressData.address[selectedAddressIndex];
//   let orderedProducts = cartData.product;
//   let payableAmount = cartData.totalPrice;
//   let order = Order.findOne({ userId: req.session.user._id });
//   if(couponApplied !== 'x'){
//     let couponData = await Coupon.findOne({code: couponApplied});
//     console.log(couponData)
//     if(new Date(couponData.expiryDate) <= new Date.now){
//       return res.status(500).json({message: "Coupon Expired"})
//     }
//     couponData.limitedQuantity--
//     await couponData.save()
//   }
//   order = new Order({
//     userId: req.session.user._id,
//     cartId: cartData._id,
//     products: orderedProducts,
//     address: selectedAddress,
//     payableAmount: totalPrice,
//   });
//   await order.save();

//   let updateProductData = cartData.product.forEach(async (products) => {
//     let update = {
//       [`stock.${products.size}.quantity`]: -products.quantity,
//       orderCount: products.quantity,
//     };
//     let product = await Product.findByIdAndUpdate(
//       products.productId,
//       { $inc: update },
//       { new: true, useFindAndModify: false }
//     );
//     await product.save();
//   });

//   cartData.product = [];
//   cartData.totalPrice = 0;
//   await cartData.save();

//   console.log(selectedAddress, orderedProducts);
//   console.log(updateProductData);
//   res.status(200).json({ data: "Success" });
// };

const placeOrder = async (req, res) => {
  try {
    let {
      selectedAddressIndex,
      selectedPaymentMethod,
      totalPrice,
      couponApplied,
      freeShipping
    } = req.body;
    console.log(
      selectedAddressIndex,
      selectedPaymentMethod,
      totalPrice,
      couponApplied,
      freeShipping
    );

    const addressData = await Address.findOne({ userId: req.session.user._id });
    const cartData = await Cart.findOne({
      userId: req.session.user._id,
    }).populate("product.productId");

    if (!addressData || !cartData) {
      return res.status(400).json({ message: "Address or Cart not found" });
    }

    let selectedAddress = addressData.address[selectedAddressIndex];
    let orderedProducts = cartData.product;
    let payableAmount = totalPrice;

    if (couponApplied !== "x") {
      let couponData = await Coupon.findOne({ code: couponApplied });
      console.log(couponData);
      if (!couponData) {
        return res.status(400).json({ message: "Invalid Coupon" });
      }
      if (new Date(couponData.expiryDate) <= new Date()) {
        return res.status(400).json({ message: "Coupon Expired" });
      }
      couponData.limitedQuantity--;
      await couponData.save();
    }

    let order = new Order({
      userId: req.session.user._id,
      cartId: cartData._id,
      products: orderedProducts,
      address: selectedAddress,
      coupon: couponApplied,
      freeShipping: freeShipping,
      payableAmount: totalPrice,
      paymentMethod: selectedPaymentMethod,
      paymentStatus: "Pending",
    });
    await order.save();

    let updateProductData = await Promise.all(
      cartData.product.map(async (product) => {
        let update = {
          [`stock.${product.size}.quantity`]: -product.quantity,
          orderCount: product.quantity,
        };
        let updatedProduct = await Product.findByIdAndUpdate(
          product.productId,
          { $inc: update },
          { new: true, useFindAndModify: false }
        );
        return updatedProduct;
      })
    );

    cartData.product = [];
    cartData.totalPrice = 0;
    // cartData.totalPriceGST = 0
    await cartData.save();

    console.log(selectedAddress, orderedProducts);
    console.log(updateProductData);
    res.status(200).json({ data: "Success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const razorPayment = (req, res) => {
  let amount = req.body.amount;
  amount = Math.round(amount)
  console.log(amount);
  let options = {
    amount: amount,
    currency: "INR",
    receipt: "order_rcptid_11",
  };
  RazorPayInstance.orders.create(options, function (err, order) {
    console.log("RazorPayInstance - ", order);
    if (!err) {
      res.status(200).json({ orderId: order.id });
    } else {
      console.log(`Error in razorPayment -- ${err}`);
    }
  });
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body.response;
    let {
      selectedAddressIndex,
      selectedPaymentMethod,
      totalPrice,
      couponApplied,
      orderIdOfOrder,
      freeShipping,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const keySecret = process.env.RAZORPAY_KEY_SECRET; // Razorpay key secret from environment variables

    // Generate the expected signature using HMAC SHA256
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body.toString())
      .digest("hex");

    // Compare the signatures
    if (expectedSignature === razorpay_signature) {
      console.log("Payment verified successfully");

      if(selectedAddressIndex && selectedPaymentMethod && totalPrice && couponApplied){
        const addressData = await Address.findOne({
          userId: req.session.user._id,
        });
        const cartData = await Cart.findOne({
          userId: req.session.user._id,
        }).populate("product.productId");
  
        if (!addressData || !cartData) {
          return res.status(400).json({ message: "Address or Cart not found" });
        }
  
        const selectedAddress = addressData.address[selectedAddressIndex];
        const orderedProducts = cartData.product;
  
        if (couponApplied !== "x") {
          const couponData = await Coupon.findOne({ code: couponApplied });
          if (!couponData) {
            return res.status(400).json({ message: "Invalid Coupon" });
          }
          if (new Date(couponData.expiryDate) <= new Date()) {
            return res.status(400).json({ message: "Coupon Expired" });
          }
          couponData.limitedQuantity--;
          await couponData.save();
        }
  
        const order = new Order({
          userId: req.session.user._id,
          cartId: cartData._id,
          products: orderedProducts,
          address: selectedAddress,
          coupon: couponApplied,
          freeShipping: freeShipping,
          payableAmount: totalPrice,
          paymentMethod: selectedPaymentMethod,
          paymentStatus: "Success",
        });
        await order.save();
  
        const updateProductData = await Promise.all(
          cartData.product.map(async (product) => {
            const update = {
              [`stock.${product.size}.quantity`]: -product.quantity,
              orderCount: product.quantity,
            };
            const updatedProduct = await Product.findByIdAndUpdate(
              product.productId,
              { $inc: update },
              { new: true, useFindAndModify: false }
            );
            return updatedProduct;
          })
        );
  
        cartData.product = [];
        cartData.totalPrice = 0;
        // cartData.totalPriceGST = 0
        await cartData.save();

      } else if(orderIdOfOrder) {
        let orderData = await Order.findOne({orderId: orderIdOfOrder})
        if(orderData){
          orderData.paymentStatus = 'Success'
          await orderData.save()
        }
      }


      res
        .status(200)
        .send({ success: true, message: "Payment verified successfully" });
    } else {
      console.log("Payment verification failed");
      res
        .status(400)
        .send({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    console.error(`Error in verifyPayment -- ${error}`);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  loadCart,
  addToCart,
  removeFromCart,
  quantityUpdate,
  loadCheckout,
  newAddress,
  placeOrder,
  razorPayment,
  verifyPayment,
};
