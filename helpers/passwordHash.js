const bcrypt = require("bcrypt");

let saltRounds = 10;

//To hash the password
const hashPassword = async (password) => {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  } catch (err) {
    console.log(err.message);
  }
};

//To compare and check the hashed password
const comparePassword = async (password, hashedPassword) => {
  try {
    const compare = await bcrypt.compare(password, hashedPassword);
    return compare;
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};
