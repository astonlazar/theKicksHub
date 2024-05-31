const isLogin = (req, res, next) => {
  try {
    if (req.session.admin) {
      console.log("--next middleware from isLogin");
      next();
    } else {
      console.log("--redirect to admin login");
      res.redirect("/admin");
    }
  } catch (err) {
    console.log(err);
  }
};

const isLogout = (req, res, next) => {
  try {
    if (req.session.admin) {
      console.log("--redirect to admin dashboard");
      res.redirect("/admin/dashboard");
    } else {
      console.log("--next middleware form isLogout");
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
