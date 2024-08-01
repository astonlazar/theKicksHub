const Offer = require("../models/offerModel");
const Products = require("../models/productModel");
const Categories = require("../models/categoryModel");

//To load the offers page
const loadOffersPage = async (req, res) => {
  try {
    let offerData = await Offer.find().populate("product").populate("category");
    let productData = await Products.find({isActive: true})
    let categoryData = await Categories.find({isActive: true})
    console.log(offerData);
    res.render("offers", { offerData, productData, categoryData });
  } catch (error) {
    console.log(`Error in loadOffersPage -- ${error}`);
  }
};

//To add new product offer
const addProductOffer = async (req, res) => {
  try {
    let productData = await Products.find({ isActive: true });
    res.render("add-productoffer", { productData, error: "" });
  } catch (error) {
    console.log(`Error in addProductOffer -- ${error}`);
  }
};

//POST method to add new offer
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
      offerName: offerName,
      offerDescription: description,
      discount: offerPercentage,
      offerType: offerType,
    };

    let offerData = await Offer.findOne({ offerName: offerName });
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

//To add new category offer
const addCategoryOffer = async (req, res) => {
  try {
    let categoryData = await Categories.find({ isActive: true });
    res.render("add-categoryoffer", { categoryData, error: "" });
  } catch (error) {
    console.log(`Error in addCategoryOffer -- ${error}`);
  }
};

//Post method to add new category offer
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
      offerName: offerName,
      offerDescription: description,
      discount: offerPercentage,
      offerType: offerType,
    };

    let offerData = await Offer.findOne({ offerName: offerName });
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

//To edit the product offer
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

//Put method to edit the product offer
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

//To edit category offer
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

//Put method to edit category offer
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

//To change the status of the offer
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

//function to apply the offer to the product
const applyOfferProduct = async (req, res) => {
  let productId = req.body.productId
  let offerId = req.body.offerId
  console.log(`productId -- ${productId}, offerId -- ${offerId}`)
  let productData = await Products.findById(productId)
  productData.offer = offerId
  let update = await productData.save()
  if(update){
    res.status(200).json({message: "Success"})
  }
}

//function nto apply the offer to the category
const applyOfferCategory = async (req, res) => {
  let categoryId = req.body.categoryId
  let offerId = req.body.offerId
  console.log(`categoryId -- ${categoryId}, offerId -- ${offerId}`)
  let categoryData = await Categories.findById(categoryId)
  categoryData.offer = offerId
  let update = await categoryData.save()
  if(update){
    res.status(200).json({message: "Success"})
  }
}

//to remove the offer from the product
const deleteOfferProduct = async (req,res) => {
  let productId = req.body.productId
  let offerId = req.body.offerId
  console.log(`productId -- ${productId}, offerId -- ${offerId}`)
  let productData = await Products.findByIdAndUpdate(productId, {$unset: {offer: 1}})
  if(productData){
    res.status(200).json({message: "Success"})
  }
}

//to remove the offer from the category
const deleteOfferCategory = async (req, res) => {
  let categoryId = req.body.categoryId
  let offerId = req.body.offerId
  console.log(`categoryId -- ${categoryId}, offerId -- ${offerId}`)
  let categoryData = await Categories.findByIdAndUpdate(categoryId, {$unset: {offer: 1}})
  if(categoryData){
    res.status(200).json({message: "Success"})
  }
}

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
  applyOfferProduct,
  applyOfferCategory,
  deleteOfferProduct,
  deleteOfferCategory,
};
