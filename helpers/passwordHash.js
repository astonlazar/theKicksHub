const bcrypt = require("bcrypt");

let saltRounds = 10;

const hashPassword = async (password) => {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  } catch (err) {
    console.log(err.message);
  }
};

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
