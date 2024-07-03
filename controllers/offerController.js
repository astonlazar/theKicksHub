const Offer = require("../models/offerModel");
const Products = require("../models/productModel");
const Categories = require("../models/categoryModel");

const loadOffersPage = async (req, res) => {
  try {
    let offerData = await Offer.find().populate("product").populate("category");
    console.log(offerData);
    res.render("offers", { offerData });
  } catch (error) {
    console.log(`Error in loadOffersPage -- ${error}`);
  }
};

const addProductOffer = async (req, res) => {
  try {
    let productData = await Products.find({ isActive: true });
    res.render("add-productoffer", { productData, error: "" });
  } catch (error) {
    console.log(`Error in addProductOffer -- ${error}`);
  }
};

const addingProductOffer = async (req, res) => {
  try {
    let productData = await Products.find({ isActive: true });
    let { product, offerName, description, offerPercentage, offerType } =
      req.body;
    console.log(
      "Data from -- product --",
      product,
      offerName,
      description,
      offerPercentage,
      offerType
    );
    let data = {
      product: product,
      offerName: offerName,
      offerDescription: description,
      discount: offerPercentage,
      offerType: offerType,
    };

    let offerData = await Offer.findOne({ product: product });
    if (!offerData) {
      let newOffer = new Offer(data);
      await newOffer.save();
      console.log(`--new offer saved to DB`);
      res.redirect("/admin/offers");
    } else {
      res.render("add-productoffer", {
        productData,
        error: "Offer already exists",
      });
    }
  } catch (error) {
    console.log(`Error in addingProductOffer -- ${error}`);
  }
};

const addCategoryOffer = async (req, res) => {
  try {
    let categoryData = await Categories.find({ isActive: true });
    res.render("add-categoryoffer", { categoryData, error: "" });
  } catch (error) {
    console.log(`Error in addCategoryOffer -- ${error}`);
  }
};

const addingCategoryOffer = async (req, res) => {
  try {
    let categoryData = await Categories.find({ isActive: true });
    let { category, offerName, description, offerPercentage, offerType } =
      req.body;
    console.log(
      "Data from -- category --",
      category,
      offerName,
      description,
      offerPercentage,
      offerType
    );
    let data = {
      category: category,
      offerName: offerName,
      offerDescription: description,
      discount: offerPercentage,
      offerType: offerType,
    };

    let offerData = await Offer.findOne({ category: category });
    if (!offerData) {
      let newOffer = new Offer(data);
      await newOffer.save();
      console.log(`--new offer saved to DB`);
      res.redirect("/admin/offers");
    } else {
      res.render("add-categoryoffer", {
        categoryData,
        error: "Offer already exists",
      });
    }
  } catch (error) {
    console.log(`Error in addingCategoryOffer -- ${error}`);
  }
};

const editProductOffer = async (req, res) => {
  try {
    let offerId = req.params.id;
    console.log(`Id -- ${offerId}`);
    let offerData = await Offer.findById(offerId).populate("product");
    let productData = await Products.find({ isActive: true });
    res.render("edit-productoffer", { productData, offerData, error: "" });
  } catch (error) {
    console.log(`Error in editProductOffer - ${error}`);
  }
};

const editedProductOffer = async (req, res) => {
  try {
    let { product, offerName, description, offerPercentage, offerType } =
      req.body;
    let offerId = req.params.id;
    console.log(offerId);
    console.log(
      "Data from -- product --",
      product,
      offerName,
      description,
      offerPercentage,
      offerType
    );
    let newData = {
      product: product,
      offerName: offerName,
      offerDescription: description,
      discount: offerPercentage,
      offerType: offerType,
    };
    let updatedOffer = await Offer.findByIdAndUpdate({ _id: offerId }, newData);
    if (updatedOffer) {
      res.redirect("/admin/offers");
    }
  } catch (error) {
    console.log(`Error in editedProductOffer -- ${error}`);
  }
};

const editCategoryOffer = async (req, res) => {
  try {
    let offerId = req.params.id;
    console.log(`Id -- ${offerId}`);
    let offerData = await Offer.findById(offerId).populate("category");
    let categoryData = await Categories.find({ isActive: true });
    res.render("edit-categoryoffer", { categoryData, offerData, error: "" });
  } catch (error) {
    console.log(`Error in editProductOffer - ${error}`);
  }
};

const editedCategoryOffer = async (req, res) => {
  try {
    let { category, offerName, description, offerPercentage, offerType } =
      req.body;
    let offerId = req.params.id;
    console.log(offerId);
    console.log(
      "Data from -- category --",
      category,
      offerName,
      description,
      offerPercentage,
      offerType
    );
    let newData = {
      category: category,
      offerName: offerName,
      offerDescription: description,
      discount: offerPercentage,
      offerType: offerType,
    };
    let updatedOffer = await Offer.findByIdAndUpdate({ _id: offerId }, newData);
    if (updatedOffer) {
      res.redirect("/admin/offers");
    }
  } catch (error) {
    console.log(`Error in editedCategoryOffer -- ${error}`);
  }
};

const offerStatus = async (req, res) => {
  let { offerId } = req.body;
  let offerData = await Offer.findById(offerId);
  let status = offerData.isActive;
  console.log(status, !status);
  offerData.isActive = !status;
  let update = await offerData.save();
  if (update) {
    res.status(200).json({ message: "Success" });
  }
};

module.exports = {
  loadOffersPage,
  addProductOffer,
  addingProductOffer,
  addCategoryOffer,
  addingCategoryOffer,
  editProductOffer,
  editedProductOffer,
  editCategoryOffer,
  editedCategoryOffer,
  offerStatus,
};
