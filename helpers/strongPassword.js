const { check } = require("express-validator");

const sPassword = async (password) => {
  try {
    // Perform the validation using check()
    console.log(password);
    await check(password)
      .isLength({ min: 8 })
      .withMessage("Password should be at least 8 characters long")
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/)
      .withMessage(
        "Password must contain uppercase, lowercase, numbers, and special symbols"
      );
  } catch (error) {
    return error.message;
  }
};

module.exports = { sPassword };
