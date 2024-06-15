const Product = require('../models/productModel')

const loadOrderPage = (req, res) => {
  try {
    res.render('orders')
  } catch (error) {
    console.log(`Error in order page - ${error}`)
  }
}

module.exports = {
  loadOrderPage,
}