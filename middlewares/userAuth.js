const isLogin = (req, res, next) => {
  try {
    if (req.session.user) {
      console.log("--next middleware from user isLogin");
      next();
    } else {
      console.log("--redirect to user login page");
      res.redirect("/login");
    }
  } catch (err) {
    console.log(err);
  }
};

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
