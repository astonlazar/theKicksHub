
//To check for the session of the admin, if not will be redirected to login
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

//To check for the session of the admin, if yes, then will be redirected to dashboard
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
