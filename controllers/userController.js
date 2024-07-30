const hashing = require("../helpers/passwordHash");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");
const otpSender = require("../helpers/otpSender");
const strongPassword = require("../helpers/strongPassword");
// const { newAddress } = require("./cartController");
const fPassword = require("../helpers/forgotPassword");
const crypto = require("crypto");
const Wallet = require("../models/walletModel");
const Offer = require("../models/offerModel");
const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");
const Coupon = require("../models/couponModel");
const PDFDocument = require("pdfkit");
const PdfPrinter = require("pdfmake")
const path = require("path")
const fs = require("fs");
const referralSender = require("../helpers/referralSender")

// Store tokens and expiry times
const resetTokens = {};

const loginPage = (req, res) => {
  res.render("login", { loginError: "" });
};

const forgotPassword = (req, res) => {
  res.render("forgotpassword");
};

const postForgotPassword = async (req, res) => {
  let { email } = req.body;
  console.log(email);
  const userData = await User.findOne({ email: email });
  console.log(`userData in postForgotPassword -- ${userData}`);
  if (!userData) {
    return res.status(400).send("Email not found");
  }

  const token = crypto.randomBytes(20).toString("hex");
  resetTokens[token] = {
    userId: userData._id,
    expires: Date.now() + 3600000, // 1 hour
  };

  await fPassword.sendEmail(email, token);

  res.render("email-sent");
};

const resetPassword = (req, res) => {
  const { token } = req.params;
  const data = resetTokens[token];

  if (!data || data.expires < Date.now()) {
    return res.status(400).send("Token expired or invalid");
  }
  res.render("resetpassword", { token });
};

const postResetPassword = async (req, res) => {
  const { token } = req.params;
  console.log(`token in postResetPassword -- ${token}`);
  const { password } = req.body;
  const data = resetTokens[token];

  if (!data || data.expires < Date.now()) {
    return res.status(400).send("Token expired or invalid");
  }
  const hashedPassword = await hashing.hashPassword(password);
  const userData = await User.findOne({ _id: data.userId });
  userData.password = hashedPassword;
  await userData.save();
  delete resetTokens[token];

  res.redirect("/login");
};

const signupPage = (req, res) => {
  res.render("signup", { signupError: "" });
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
    let { userName, email, phoneNo, password, referredBy } = req.body;
    console.log(`referred by -- ${referredBy}`)
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
      let referredData = await User.findOne({
        referralCode: referredBy,
        isActive: true,
      });
      let userData;
      if (referredData) {
        userData = {
          userName: userName,
          email: email,
          phoneNo: phoneNo,
          password: hashedPassword,
          referredByCode: referredData.referralCode,
          referredBy: referredData.userName,
        };
      } else {
        userData = {
          userName: userName,
          email: email,
          phoneNo: phoneNo,
          password: hashedPassword,
        };
      }

      req.session.temp = userData;
      console.log(req.session.temp.email);
      console.log(`req.session.temp-- ${req.session.temp}`);

      // Generate and send OTP
      let otp = await OtpVerification(userData.email);
      req.session.temp.otp = otp;
      req.session.temp.otpExpire = Date.now() + 60 * 1000;
      console.log("--temporary session loading");
      console.log(`OTP set to session: ${req.session.temp.otp}`);
      res.redirect("/verification");
    }
  } catch (err) {
    console.log(err);
  }
};

const referralVerify = async (req, res) => {
  let referralCode = req.body.referralCode;
  console.log(referralCode)
  let referralUserData = await User.findOne({referralCode: referralCode})
  if(referralUserData){
    return res.status(200).json({message: 'Success'})
  }
  res.status(500).json({message: "Not found"})
}

const OtpVerification = async (email) => {
  let otp = otpSender.generate();
  await otpSender.sendEmail(email, otp);
  console.log("Otp send to mail - " + email, otp);
  return otp;
};

const sendOtpfromEmail = async (req, res) => {
  try {
    let { email } = req.body;
    let otp = await OtpVerification(email);

    if (!req.session.temp) {
      req.session.temp = {};
    }
    req.session.temp.otp = otp;
    req.session.temp.otpExpire = Date.now() + 60 * 1000;
    console.log(`OTP sent and set to session: ${req.session.temp.otp}`);
    res.status(200).json({ message: "OTP sent" });
  } catch (err) {
    console.log(`Error in sendOtpfromEmail in userController -- ${err}`);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

const verificationPage = (req, res) => {
  res.render("verification", {
    otpError: "",
    userEmail: req.session.temp.email,
  });
};

const verifyEnter = async (req, res) => {
  const enteredOtp = req.body.otpCode;
  // enteredOtp = parseInt(enteredOtp)

  console.log(`Entered otp ${enteredOtp}`);
  console.log(`Stored otp in session: ${req.session.temp.otp}`);
  const expOtp = req.session.temp.otpExpire;
  if (enteredOtp === req.session.temp.otp && Date.now() < expOtp) {
    const userEnteredData = new User(req.session.temp);
    userEnteredData.referralCode = await crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase();
    await userEnteredData.save();

    console.log("--user inserted to db--" + userEnteredData);
    req.session.user = userEnteredData;
    console.log(req.session.user);
    let walletData = await Wallet.findOne({ userId: req.session.user._id });
    if (!walletData) {
      if(req.session.user.referredByCode !== 'none'){
        let referredByUser = req.session.user.referredByCode;
        let referredByUserData = await User.findOne({referralCode: referredByUser})
        let walletDetails = await Wallet.findOne({userId: referredByUserData._id})
        walletDetails.walletBalance += 100;
        walletDetails.transactions.unshift({type: "credit", amount: 100})
        await walletDetails.save()
        let newWallet = new Wallet({
          userId: req.session.user._id,
          walletBalance: 100,
          transactions: [{
            type: "credit",
            amount: 100,
          }]
        });
        await newWallet.save();
      } else {
        let newWallet = new Wallet({
          userId: req.session.user._id,
          walletBalance: 0,
        });
        await newWallet.save();
      }
    }
    res.redirect("/");
  } else {
    console.log("Incorrect OTP or Expired OTP");
    res.render("verification", {
      otpError: "Incorrect OTP or Expired OTP",
      userEmail: req.session.temp.email,
    });
  }
};

const homePage = async (req, res) => {
  let productData = await Product.find({ isActive: { $eq: true } })
    .limit(4)
    .populate("offer");
  let categoryData = await Category.find({ isActive: true });

  if (req.session.user) {
    let userData = await User.findById(req.session.user._id);
    let cartData = await Cart.findOne({ userId: req.session.user._id });
    let wishlistData = await Wishlist.findOne({ userId: req.session.user._id });
    wishlistCount = wishlistData?.products?.length ?? 0;
    cartCount = cartData?.product?.length ?? 0;
    console.log(`cart - ${cartCount} -- wishlist - ${wishlistCount}`);
    console.log(`UserData -- ${userData}`);
    req.session.user = userData;
    res.render("index", {
      userData,
      productData,
      categoryData,
      cartCount,
      wishlistCount,
    });
  } else {
    res.render("landing", { productData, categoryData });
  }
};

const productView = async (req, res) => {
  try {
    let id = req.params.id;
    console.log(id);
    let productData = await Product.findById({ _id: id })
    .populate("offer")
    .populate("category")
        .populate({
            path: 'category',
            populate: { path: 'offer' }
        });
    let relatedProductData = await Product.find({
      category: productData.category,
      _id: { $ne: productData._id },
    })
      .limit(4)
      .populate("offer")
      .populate("category")
        .populate({
            path: 'category',
            populate: { path: 'offer' }
        });
    let wishlistCount, cartCount;
    if (req.session?.user?._id) {
      let wishlistData = await Wishlist.findOne({
        userId: req.session.user._id,
      });
      let cartData = await Cart.findOne({ userId: req.session.user._id });
      wishlistCount = wishlistData?.products?.length ?? 0;
      cartCount = cartData?.product?.length ?? 0;
    }

    console.log(`-productData - ${productData}`);
    res.render("product-view", {
      productData,
      relatedProductData,
      wishlistCount,
      cartCount,
    });
  } catch (err) {
    console.log(`--error in productView - ${err}`);
  }
};

const shop = async (req, res) => {
  try {
    let searchQuery = { isActive: true };
    let page = parseInt(req.query.page) || 1;
    let limit = 9;
    let startIndex = (page - 1) * limit;
    let search = "";
    let categoryFilter = req.query.category || "";
    console.log(`categoryFilter -- ${categoryFilter}`);
    if (req.query.search) {
      search = req.query.search.trim();
      console.log(`Searched -- ${search}`);
      searchQuery.productName = new RegExp(search, "i");
    }
    if (req.query.category && req.query.category !== "all-categories") {
      searchQuery.category = categoryFilter;
    }
    console.log("SearchQuery", searchQuery);
    const sortOptions = {
      popularity: { orderCount: -1 },
      "price-low-high": { promo_price: 1 },
      "price-high-low": { promo_price: -1 },
      // 'average-ratings': { averageRating: -1 },
      featured: { orderCount: -1, _id: -1 },
      "new-arrivals": { _id: -1 },
      "aA-zZ": { productName: 1 },
      "zZ-aA": { productName: -1 },
    };

    let sortBy = req.query.sort || "new-arrivals";
    let sortCriteria = sortOptions[sortBy] || sortOptions["new-arrivals"]; // Fallback to 'popularity' if invalid sort option is provided
    console.log("sortCriteria --" + sortCriteria);
    let productData = await Product.find(searchQuery)
        .sort(sortCriteria)
        .skip(startIndex)
        .limit(limit)
        .populate("offer")
        .populate("category")
        .populate({
            path: 'category',
            populate: { path: 'offer' }
        });

    let totalDocuments = await Product.countDocuments(searchQuery);
    let totalPages = Math.ceil(totalDocuments / limit);
    let categoryData = await Category.find({ isActive: true });
    let wishlistCount, cartCount;
    if (req.session?.user?._id) {
      let wishlistData = await Wishlist.findOne({
        userId: req.session.user._id,
      });
      let cartData = await Cart.findOne({ userId: req.session.user._id });
      wishlistCount = wishlistData?.products?.length ?? 0;
      cartCount = cartData?.product?.length ?? 0;
    }
    res.render("shop", {
      productData,
      categoryData,
      page,
      totalPages,
      sortBy,
      search,
      categoryFilter,
      wishlistCount,
      cartCount,
    });
  } catch (error) {
    console.log(`Error in shop -- ${error}`);
  }
};

const userProfile = async (req, res) => {
  const addressData = await Address.findOne({ userId: req.session.user._id });
  const userData = await User.findById(req.session.user._id);
  const walletData = await Wallet.findOne({ userId: req.session.user._id });
  const cartData = await Cart.findOne({ userId: req.session.user._id });
  const wishlistData = await Wishlist.findOne({ userId: req.session.user._id });
  wishlistCount = wishlistData?.products?.length ?? 0;
  cartCount = cartData?.product?.length ?? 0;
  const orderData = await Order.find({ userId: req.session.user._id })
    .populate("products.productId")
    .sort({ orderDate: -1 });
  res.render("user-profile", {
    userData,
    addressData,
    orderData,
    walletData,
    cartCount,
    wishlistCount,
  });
};

const userProfileEdit = async (req, res) => {
  try {
    let { fullName, phoneNo } = req.body;
    const userData = await User.findById(req.session.user._id);
    console.log(fullName, phoneNo);
    if (userData.fullName !== fullName) {
      userData.fullName = fullName;
    }
    if (userData.phoneNo !== phoneNo) {
      userData.phoneNo = phoneNo;
    }
    let updated = await userData.save();
    if (updated) {
      res.status(200).json({ message: "Success" });
    } else {
      res.status(500).json({ message: "Error" });
    }
  } catch (error) {
    console.log(error);
  }
};

const changePassword = async (req, res) => {
  let { oldPassword, newPassword } = req.body;
  console.log(`oldPass - ${oldPassword} - newPass - ${newPassword}`);
  let userData = await User.findById(req.session.user._id);
  console.log(userData.password);
  let checkPassword = await hashing.comparePassword(
    oldPassword,
    userData.password
  );
  if (checkPassword) {
    userData.password = await hashing.hashPassword(newPassword);
  } else {
    return res.status(500).json({ message: "Password does not match" });
  }
  await userData.save();
  res.status(200);
};

const addNewAddress = async (req, res) => {
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

    let addressData = await Address.findOne({ userId: req.session.user._id });
    const userData = await User.findById(req.session.user._id);
    const orderData = await Order.find({ userId: req.session.user._id });

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

    res.redirect("/profile");
  } catch (error) {
    console.log(`Error in addNewAddress - ${error}`);
  }
};

const editAddress = async (req, res) => {
  let { address, addressId } = req.body;
  console.log(`Req.body - ${req.body}`);
  // console.log(address, addressId)
  // console.log(address.fullName)
  const addressData = await Address.findOne({ userId: req.session.user._id });
  if (addressData) {
    let updateAddress = addressData.address.find(
      (addr) => addr._id.toString() === addressId
    );

    console.log(`the selected address is - ${updateAddress}`);
    if (updateAddress) {
      // Update the fields of the found address
      updateAddress.fullName = address.fullname || updateAddress.fullName;
      updateAddress.addressLine1 =
        address.billing_address || updateAddress.addressLine1;
      updateAddress.addressLine2 =
        address.billing_address2 || updateAddress.addressLine2;
      updateAddress.city = address.city || updateAddress.city;
      updateAddress.state = address.state || updateAddress.state;
      updateAddress.pincode = address.pincode || updateAddress.pincode;
      updateAddress.phoneNo = address.phoneNo || updateAddress.phoneNo;
      updateAddress.email = address.email || updateAddress.email;

      let newAddress = await addressData.save();
      // console.log("saved", newAddress);
      console.log(`UpdateAddress - ${updateAddress}`);
    }
    if (newAddress) {
      res.status(200).json({ Message: "Successfully updated address" });
    } else {
      res.status(500);
    }
  }
};

const deleteAddress = async (req, res) => {
  let { addressId } = req.body;
  console.log(`addressId -- ${addressId}`);
  const addressData = await Address.findOne({ userId: req.session.user._id });
  if (addressData) {
    let findAddress = addressData.address.find(
      (addr) => addr._id.toString() === addressId
    );
    let addressIndex = addressData.address.indexOf(findAddress);
    console.log(`index of ${addressIndex}`);
    addressData.address.splice(addressIndex, 1);
    res.status(200).json({ message: "Successfully deleted" });
    addressData.save();
  }
};

const referralSend = async (req, res) => {
  let { email,emailFrom, referralCode } = req.body;
  console.log(`emailFriend - ${email}, emailFrom - ${emailFrom}, referralCode - ${referralCode}`)
  let referralResponse = await referralSender.sendCodeEmail(email, emailFrom, referralCode)
  if(referralResponse){
    res.status(200).json({success: 'true',message: 'Success'})
  } else {
    res.status(500).json({message: 'Not Successfull'})
  }
}

const loadOrderDetails = async (req, res) => {
  try {
    let orderId = req.query.orderId;
    let cartData = await Cart.findOne({ userId: req.session.user._id });
    let wishlistData = await Wishlist.findOne({ userId: req.session.user._id });
    wishlistCount = wishlistData?.products?.length ?? 0;
    cartCount = cartData?.product?.length ?? 0;
    let orderData = await Order.findOne({ orderId: orderId }).populate(
      "products.productId"
    );
    let couponData;
    if (orderData.coupon) {
      couponData = await Coupon.findOne({ code: orderData.coupon });
    }

    res.render("order-details", {
      orderData,
      cartCount,
      wishlistCount,
      couponData,
    });
  } catch (error) {
    console.log(`Error in loadOrderDetails - ${error}`);
  }
};


const generateInvoice = async (req, res) => {
  const { orderId } = req.body; // Extract orderId from request body

  try {
    // Fetch the order from the database
    const order = await Order.findOne({ orderId })
      .populate("products.productId")
      .exec();

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };

       // Format the order date to "Tue Jul 16 2024"
       const formattedOrderDate = new Date(order.orderDate).toDateString();

    const printer = new PdfPrinter(fonts);

    // Define the PDF document structure
    const docDefinition = {
      content: [
        { text: 'Invoice', style: 'header', alignment: 'center' },
        { text: 'Invoice Details', style: 'subheader' },
        {
          text: [
            { text: 'Order ID: ', bold: true }, `${order.orderId}\n`,
            { text: 'Order Date: ', bold: true }, `${formattedOrderDate}\n`,
          ]
        },
        { text: 'Shipping Address', style: 'subheader' },
        {
          text: [
            `${order.address.fullName}\n`,
            `${order.address.addressLine1}\n`,
            order.address.addressLine2 ? `${order.address.addressLine2 ? order.address.addressLine2 + '\n' : ''}`: '',
            `${order.address.city}\n`,
            `${order.address.state}\n`,
            `${order.address.pincode}\n`,
            { text: 'Phone: ', bold: true }, `${order.address.phoneNo}\n`,
            { text: 'Email: ', bold: true }, `${order.address.email}\n`
          ]
        },
        { text: 'Products', style: 'subheader' },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            body: [
              ['Product Name', 'Quantity', 'Size', 'Price'],
              ...order.products.map(product => {
                const productName = product.productId ? product.productId.productName : 'Unknown';
                const quantity = product.quantity;
                const size = product.size || 'N/A';
                const price = product.productPrice ? `₹${product.productPrice}` : 'N/A';
                return [productName, quantity, size, price];
              })
            ]
          }
        },
        { text: 'Payment Details', style: 'subheader' },
        {
          text: [
            { text: 'Payment Method: ', bold: true }, `${order.paymentMethod}\n`,
            { text: 'Payment Status: ', bold: true }, `${order.paymentStatus}\n`,
            order.couponDiscount ? { text: 'Coupon Discount: ', bold: true } : '', `${order.couponDiscount ? `₹${order.couponDiscount}\n` : ''}`,
            { text: 'Shipping: ', bold: true }, `${order.freeShipping ? `Free Shipping\n` : '₹500\n'}`,
            { text: 'GST(12%)(Included): ', bold: true }, `₹${order.payableAmount * 0.12 +'\n'}`,
            { text: 'Payable Amount: ', bold: true }, `₹${order.payableAmount}`
          ]
        }
      ],
      styles: {
        header: {
          fontSize: 25,
          bold: true,
          margin: [0, 20, 0, 10]
        },
        subheader: {
          fontSize: 18,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        tableExample: {
          margin: [0, 5, 0, 15]
        }
      }
    };

    // Create the PDF document
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => {
      const result = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);
      res.send(result);
    });

    pdfDoc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send("Internal Server Error");
  }
};

const userLogout = (req, res) => {
  req.session.user = false;
  console.log("User logged out");
  res.redirect("/login");
};

module.exports = {
  loginPage,
  forgotPassword,
  postForgotPassword,
  resetPassword,
  postResetPassword,
  loginEnterPage,
  successGoogle,
  failureGoogle,
  signupPage,
  signupEnterPage,
  referralVerify,
  verificationPage,
  verifyEnter,
  homePage,
  productView,
  shop,
  userProfile,
  userProfileEdit,
  changePassword,
  addNewAddress,
  editAddress,
  deleteAddress,
  userLogout,
  sendOtpfromEmail,
  loadOrderDetails,
  generateInvoice,
  referralSend,
};
