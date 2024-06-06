const express = require("express");
const userRoute = express();
const userController = require("../controllers/userController");
const auth = require("../middlewares/userAuth");
const passport = require("passport");

userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/user");

//routes
userRoute.get("/login", auth.isLogout, userController.loginPage);
userRoute.post("/login", userController.loginEnterPage);

userRoute.get("/signup", auth.isLogout, userController.signupPage);
userRoute.post("/signup", userController.signupEnterPage);

userRoute.get("/verification", userController.verificationPage);
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
userRoute.get("/product-view/:id", auth.isLogin, userController.productView);
userRoute.get("/shop", auth.isLogin, userController.shop);
userRoute.get("/user/profile", userController.userProfile);
userRoute.get("/logout", auth.isLogin, userController.userLogout);

module.exports = userRoute;
