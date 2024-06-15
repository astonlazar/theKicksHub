const hashing = require("../helpers/passwordHash");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");
const otpSender = require("../helpers/otpSender");
const strongPassword = require("../helpers/strongPassword");

const loginPage = (req, res) => {
  res.render("login", { loginError: "" });
};

const signupPage = (req, res) => {
  res.render("signup", {signupError: ""});
};

const successGoogle = async (req, res) => {
  try {
    if (!req.user) {
      res.redirect("/failure");
    } else {
      req.session.user = { _id: req.user._id };
      res.status(200).redirect("/");
    }
  } catch (error) {
    console.log(`-- error in successGoogle - ${error}`);
  }
};

const failureGoogle = async (req, res) => {
  try {
    res.status(404).render("login", { loginError: "User is blocked" });
  } catch (error) {
    console.log(error);
  }
};

const loginEnterPage = async (req, res) => {
  try {
    let { email, password } = req.body;
    const checkUser = await User.findOne({ email: email });
    if (checkUser) {
      console.log("--user exists");
      console.log(checkUser);
      if (checkUser.isActive === true) {
        const checkPassword = await hashing.comparePassword(
          password,
          checkUser.password
        );
        if (checkPassword) {
          console.log("--password matches");
          req.session.user = checkUser;
          res.redirect("/");
        } else {
          console.log("password incorrect");
          res.render("login", { loginError: "Password Incorrect" });
        }
      } else {
        res.render("login", {
          loginError: "You have been blocked from theKicksHub",
        });
      }
    } else if (email === "" || password === "") {
      res.render("login", { loginError: "Enter credentials to login" });
    } else {
      res.render("login", { loginError: "User does not exist. Sign up..." });
    }
  } catch (err) {
    console.log(err);
  }
};

const signupEnterPage = async (req, res) => {
  try {
    let { userName, email, phoneNo, password, confirmPassword } = req.body;
    // phoneNo = phoneNo.toString();
    // if (userName.charAt(0) === " " || userName.charAt(0) === "") {
    //   res.render("signup", {
    //     signupUsernameError: "Enter valid Username",
    //     signupPhoneNoError: "",
    //     signupPasswordError: "",
    //     signupConfirmError: "",
    //     signupError: "",
    //   });
    // } else if (phoneNo === "" || phoneNo.length < 10) {
    //   res.render("signup", {
    //     signupUsernameError: "",
    //     signupPhoneNoError: "Enter 10 digit Phone no.",
    //     signupPasswordError: "",
    //     signupConfirmError: "",
    //     signupError: "",
    //   });
    // } else if (password.charAt(0) === " ") {
    //   res.render("signup", {
    //     signupUsernameError: "",
    //     signupPhoneNoError: "",
    //     signupPasswordError: "Enter strong password",
    //     signupConfirmError: "",
    //     signupError: "",
    //   });
    // } else if (password !== confirmPassword) {
    //   res.render("signup", {
    //     signupUsernameError: "",
    //     signupPhoneNoError: "",
    //     signupPasswordError: "",
    //     signupConfirmError: "Password does not match",
    //     signupError: "",
    //   });
    // } else {
    const checkUser = await User.findOne({
      $or: [{ email: email }, { phoneNo: phoneNo }],
    });
    console.log(checkUser);
    if (checkUser) {
      res.render("signup", {
        signupError: "User already exists!",
      });
    } else {
      const strongpass = await strongPassword.sPassword(password);
      console.log(strongpass);
      const hashedPassword = await hashing.hashPassword(password);
      console.log("--password hashing");
      const userData = {
        userName: userName,
        email: email,
        phoneNo: phoneNo,
        password: hashedPassword,
      };

      req.session.temp = userData;
      console.log(req.session.temp.email);
      console.log(`req.session.temp-- ${req.session.temp}`);
      req.session.otp = await otpSender.generate();
      await otpSender.sendEmail(userData.email, req.session.otp);
      req.session.temp.email = userData.email;
      console.log(req.session.otp);
      console.log("--temporary session loading");
      res.redirect("/verification");
    }
    // }
  } catch (err) {
    console.log(err);
  }
};

const sendOtpfromEmail = async (req, res) => {
  try{
    let {email} = req.body;

    req.session.otp = await otpSender.generate();
    await otpSender.sendEmail(email, req.session.otp)
    console.log(email, req.session.otp)
  } catch(err) {
    console.log(`Error in sendOtpfromEmail in userController -- ${err}`)
  }
}

const verificationPage = (req, res) => {
  res.render("verification", { otpError: "", userEmail: req.session.temp.email });
};

const verifyEnter = async (req, res) => {
  const enteredOtp = req.body.otpCode;
  console.log(`the otp in verifyEnter -- ${req.session.otp}`)
  // const userData = req.session.temp;
  if (enteredOtp == req.session.otp) {
    // const userEnteredData = await User.insertMany(req.session.temp)
    const userEnteredData = new User(req.session.temp);
    await userEnteredData.save();
    // console.log(`req.temp--- ${req.session.temp}`);
    // console.log(`userData--- ${userData}`);
    console.log("--user inserted to db--" + userEnteredData);
    req.session.user = userEnteredData;
    console.log(req.session.user);
    console.log(req.session.user.email);
    res.redirect("/");
  } else {
    res.render("verification", { otpError: "OTP is incorrect",  userEmail: req.session.temp.email });
  }
};

const homePage = async (req, res) => {
  let productData = await Product.find({ isActive: { $eq: true } }).limit(4);
  let categoryData = await Category.find({ isActive: true });

  if (req.session.user) {
    let userData = await User.findById(req.session.user._id);
    console.log(`UserData -- ${userData}`);
    req.session.user = userData;
    res.render("index", { userData, productData, categoryData });
  } else {
    res.render("landing", { productData, categoryData });
  }
};

const productView = async (req, res) => {
  try {
    let id = req.params.id;
    console.log(id);
    let productData = await Product.findById({ _id: id });
    let relatedProductData = await Product.find({
      category: productData.category,
      _id: { $ne: productData._id },
    }).limit(4);

    console.log(`-productData - ${productData}`);
    res.render("product-view", { productData, relatedProductData });
  } catch (err) {
    console.log(`--error in productView - ${err}`);
  }
};

const shop = async (req, res) => {
  try{
    let page = parseInt(req.query.page) || 1;
    let limit = 9;
    let startIndex = (page - 1) * limit;

    const sortOptions = {
      // 'popularity': { popularity: -1 },
      'price-low-high': { promo_price: 1 },
      'price-high-low': { promo_price: -1 },
      // 'average-ratings': { averageRating: -1 },
      // 'featured': { featured: -1 },
      'new-arrivals': { _id: -1 },
      'aA-zZ': { productName: 1 },
      'zZ-aA': { productName: -1 }
    };

    let sortBy = req.query.sort || 'new-arrivals'; // Default to 'popularity' if no sort option is provided
    let sortCriteria = sortOptions[sortBy] || sortOptions['new-arrivals']; // Fallback to 'popularity' if invalid sort option is provided
    console.log("sortCriteria --"+sortCriteria)
    let productData = await Product.find({ isActive: true }).sort(sortCriteria).skip(startIndex).limit(limit);
    let totalDocuments = await Product.countDocuments();
    let totalPages = Math.ceil(totalDocuments / limit)
    let categoryData = await Category.find({ isActive: true });
    res.render("shop", { productData, categoryData, page, totalPages, sortBy });
  } catch(error){
    console.log(`Error in shop -- ${error}`)
  }
};

const userProfile = async (req, res) => {
  const addressData = await Address.findOne({userId: req.session.user._id})
  const userData = await User.findById(req.session.user._id);
  res.render("user-profile", { userData, addressData });
};

const userLogout = (req, res) => {
  req.session.user = false;
  console.log("User logged out");
  res.redirect("/login");
};

module.exports = {
  loginPage,
  loginEnterPage,
  successGoogle,
  failureGoogle,
  signupPage,
  signupEnterPage,
  verificationPage,
  verifyEnter,
  homePage,
  productView,
  shop,
  userProfile,
  userLogout,
  sendOtpfromEmail,
};
