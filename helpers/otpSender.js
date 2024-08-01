const nodemailer = require("nodemailer");
const generateOtp = require("generate-otp");
require("dotenv").config();

//function to generate an otp
const generate = () => {
  const otp = generateOtp.generate(4);
  return otp;
};

//To send the otp through mail
const sendEmail = (email, otp) => {
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

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "OTP verification for theKicksHub",
    text: `${otp} is the verification code.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(`Error: ${error}`);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
};

module.exports = {
  generate,
  sendEmail,
};
