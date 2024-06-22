const nodemailer = require("nodemailer");
const crypto = require('crypto')
require("dotenv").config();


const sendEmail = (email, token) => {

  
  const resetLink = `http://localhost:${process.env.PORT}/reset-password/${token}`;
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    }
  });
  
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Password Reset',
    text: `Click here to reset your password: ${resetLink}`
  };
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Email sent: ' + info.response);
  });
}

module.exports = {
  sendEmail,
}