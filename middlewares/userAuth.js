const User = require("../models/userModel");

//To check for the session of the user, if yes, then checks for if the user is blocked.
const isLogin = async (req, res, next) => {
  try {
    if (req.session?.user) {
      // if (req.session?.user) {
      var userData = await User.findById(req.session.user._id);
      // } else {
      //   userData = await User.findById(req.session.passport.user._id);
      // }
      if (!userData.isActive) {
        req.session.destroy();
        res.render("login", { loginError: "You have been blocked from theKicksHub" });
      } else {
        console.log("--next middleware from user isLogin");
        next();
      }
    } else {
      console.log("--redirect to user login page");
      res.redirect("/login");
    }
  } catch (err) {
    console.log(err);
  }
};

//To check for the session of the user
const isLogout = (req, res, next) => {
  try {
    if (req.session.user) {
      console.log("--redirect to homepage");
      res.redirect("/");
    } else {
      console.log("--next middleware from isLogout");
      next();
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  isLogin,
  isLogout,
};
