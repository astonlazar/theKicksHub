const express = require("express");
const userRoute = express();
const userController = require("../controllers/userController");
const auth = require("../middlewares/userAuth");
const passport = require("passport");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderController");
const wishlistController = require("../controllers/wishlistController");
const couponController = require("../controllers/couponController");

userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/user");

//routes
userRoute.get("/login", auth.isLogout, userController.loginPage);
userRoute.post("/login", userController.loginEnterPage);

userRoute.put("/resend-otp", userController.sendOtpfromEmail);

userRoute.get("/forgot-password", auth.isLogout, userController.forgotPassword);
userRoute.post("/forgot-password", userController.postForgotPassword);
userRoute.get(
  "/reset-password/:token",
  auth.isLogout,
  userController.resetPassword
);
userRoute.post("/reset-password/:token", userController.postResetPassword);

userRoute.get("/signup", auth.isLogout, userController.signupPage);
userRoute.post("/signup", userController.signupEnterPage);

userRoute.put("/referralverify", userController.referralVerify);

userRoute.get("/verification", auth.isLogout, userController.verificationPage);
userRoute.post("/verification", userController.verifyEnter);

userRoute.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

userRoute.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/success",
    failureRedirect: "/failure",
  })
);

userRoute.get("/success", userController.successGoogle);
userRoute.get("/failure", userController.failureGoogle);
userRoute.get("/", userController.homePage);
userRoute.get("/product-view/:id", userController.productView);
userRoute.get("/shop", userController.shop);

userRoute.post("/addtocart", auth.isLogin, cartController.addToCart);
userRoute.get("/cart", auth.isLogin, cartController.loadCart);
userRoute.delete(
  "/cart/remove-product",
  auth.isLogin,
  cartController.removeFromCart
);
userRoute.put("/cart/quantity", auth.isLogin, cartController.quantityUpdate);
userRoute.post(
  "/cart/apply-coupon",
  auth.isLogin,
  couponController.applyCoupon
);

userRoute.get("/checkout", auth.isLogin, cartController.loadCheckout);
userRoute.post("/checkout", auth.isLogin, cartController.newAddress);

userRoute.post("/place-order", auth.isLogin, cartController.placeOrder);

userRoute.post("/payment/razorpay", auth.isLogin, cartController.razorPayment);
userRoute.post("/verifypayment", auth.isLogin, cartController.verifyPayment);

userRoute.put("/send-referral", auth.isLogin, userController.referralSend)
userRoute.get("/profile", auth.isLogin, userController.userProfile);
userRoute.put("/profile/edit", auth.isLogin, userController.userProfileEdit);
userRoute.put(
  "/profile/changepassword",
  auth.isLogin,
  userController.changePassword
);
userRoute.post("/add-address", auth.isLogin, userController.addNewAddress);
userRoute.put("/edit-address", auth.isLogin, userController.editAddress);
userRoute.delete("/delete-address", auth.isLogin, userController.deleteAddress);

userRoute.put("/order/cancel", auth.isLogin, orderController.cancelOrder);
userRoute.put("/order/return", auth.isLogin, orderController.returnOrder);

userRoute.get("/order/details", auth.isLogin, userController.loadOrderDetails);
userRoute.put(
  "/invoice/download",
  auth.isLogin,
  userController.generateInvoice
);

userRoute.get("/wishlist", auth.isLogin, wishlistController.loadWishlistPage);
userRoute.put("/addtowishlist", auth.isLogin, wishlistController.addToWishlist);
userRoute.delete(
  "/removefromwishlist",
  auth.isLogin,
  wishlistController.removeFromWishlist
);

userRoute.get("/logout", auth.isLogin, userController.userLogout);

module.exports = userRoute;
``;
