const nodemailer = require("nodemailer");
const User = require("../models/userModel")
require("dotenv").config();

//To sned the referral code
const sendCodeEmail = async (email, emailFrom, referralCode) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates
    }
  });
  let userData = await User.findOne({email: emailFrom})
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Referral Code for theKicksHub from "+ userData.userName,
    text: `${referralCode} is the referral code. Use this while signing up for theKicksHub and get ₹100.\n Happy Shopping.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(`Error: ${error}`);
      return false;
    } else {
      console.log(`Email sent: ${info.response}`);
      return true;
    }
  });
};

module.exports = {
  sendCodeEmail,
};
