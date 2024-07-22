const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const fs = require("fs");
const path = require("path");

const addProduct = async (req, res) => {
  try {
    let categories = await Category.find({ isActive: true });
    // console.log(categories);
    // categories.forEach((categ) => console.log(categ.categoryName));
    res.render("add-product", { categories });
  } catch (err) {
    console.log(err);
  }
};

const addedProduct = async (req, res) => {
  try {
    let categories = await Category.find({ isActive: true });
    let fileNames = [];

    let {
      product_name,
      product_description,
      product_price,
      productPromo_price,
      product_category,
    } = req.body;

    let totalStock = {
      UK6: req.body.productSizeUK6,
      UK7: req.body.productSizeUK7,
      UK8: req.body.productSizeUK8,
      UK9: req.body.productSizeUK9,
      UK10: req.body.productSizeUK10,
      UK11: req.body.productSizeUK11,
    };

    console.log("Reached just before req.files if condition");

    if (req.files) {
      if (req.files.product_img1) fileNames.push(req.files.product_img1[0].filename);
      if (req.files.product_img2) fileNames.push(req.files.product_img2[0].filename);
      if (req.files.product_img3) fileNames.push(req.files.product_img3[0].filename);
      if (req.files.product_img4) fileNames.push(req.files.product_img4[0].filename);
    }

    if (fileNames.length === 0) {
      console.log("Error uploading files");
      return res.status(400).json({ message: "Error uploading files" });
    }

    console.log("Reached just after req.files if condition");

    console.log(
      product_name,
      product_description,
      product_price,
      productPromo_price,
      product_category
    );

    console.log(totalStock);
    let totalStockNew = {};
    for (const size in totalStock) {
      totalStockNew[size] = { quantity: parseInt(totalStock[size], 10) };
    }

    let productCheck = await Product.find({ productName: product_name });

    let productData = {
      productName: product_name,
      description: product_description,
      category: product_category,
      price: product_price,
      productImage: fileNames,
      promo_price: productPromo_price,
      stock: totalStockNew,
    };

    console.log(productCheck);
    console.log(productData);

    if (productCheck.length !== 0) {
      console.log("Product exists");
      return res.status(400).json({ message: "Product already exists" });
    } else {
      await Product.insertMany(productData);
      console.log("Product inserted successfully");
      return res.status(200).json({ message: "Product added successfully" });
    }
  } catch (err) {
    console.log(`Error in addedProduct: ${err}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const productsList = async (req, res) => {
  try {
    let query = {};
    if (req.query.searchProduct) {
      let searchQuery = req.query.searchProduct;
      console.log(searchQuery);
      query = { productName: new RegExp(searchQuery, "i") };
    }
    let page = parseInt(req.query.page) || 1;
    let limit = 5;
    let startIndex = (page - 1) * limit;
    let productData = await Product.find(query).sort({_id: -1}).skip(startIndex).limit(limit);
    console.log();
    let totalDocuments = (await Product.find(query)).length;
    let totalPages = Math.ceil(totalDocuments / limit);
    // console.log(`productData --- ${productData}`);
    res.render("products-list", { productData, page, totalPages });
  } catch (err) {
    console.log(`--err in productList - ${err}`);
  }
};

const productStatus = async (req, res) => {
  try {
    const productId = req.body.productId;
    console.log(`--productId -- ${productId}`);
    // let productData = await Product.find();
    let statusProduct = await Product.findById(productId);
    if (statusProduct.isActive) {
      await Product.updateOne(
        { _id: productId },
        { $set: { isActive: false } }
      );
    } else {
      await Product.updateOne({ _id: productId }, { $set: { isActive: true } });
    }
    res.redirect("/admin/products");
  } catch (err) {
    console.log(err);
  }
};

const editProduct = async (req, res) => {
  try {
    let productId = req.params.id;
    console.log(`--productId - ${productId}`);
    let productData = await Product.findById(productId).populate('category')
    let categoryData = await Category.find({isActive: true});
    res.render("edit-product", { productData, categoryData });
  } catch (err) {
    console.log(`--error in editProduct ${err}`);
  }
};

const editedProduct = async (req, res) => {
  try {
    let productId = req.params.id;
    console.log(`--productId - ${productId}`);
    let fileNames = [];

    let {
      product_name,
      product_description,
      product_price,
      productPromo_price,
      product_category,
    } = req.body;

    console.log(
      product_name,
      product_description,
      product_price,
      productPromo_price,
      product_category
    );

    let totalStock = {
      UK6: req.body.productSizeUK6,
      UK7: req.body.productSizeUK7,
      UK8: req.body.productSizeUK8,
      UK9: req.body.productSizeUK9,
      UK10: req.body.productSizeUK10,
      UK11: req.body.productSizeUK11,
    };

    console.log(totalStock);
    let totalStockNew = {};
    for (const size in totalStock) {
      totalStockNew[size] = { quantity: parseInt(totalStock[size], 10) };
    }

    if (req.files) {
      if (req.files.product_img1) fileNames.push(req.files.product_img1[0].filename);
      if (req.files.product_img2) fileNames.push(req.files.product_img2[0].filename);
      if (req.files.product_img3) fileNames.push(req.files.product_img3[0].filename);
      if (req.files.product_img4) fileNames.push(req.files.product_img4[0].filename);
    }

    if (fileNames.length === 0) {
      // If no new files are uploaded, retain the existing product images
      const product = await Product.findById(productId);
      if (product) {
        fileNames = product.productImage;
      } else {
        console.log("Error: Product not found");
        return res.status(404).json({ message: "Product not found" });
      }
    }

    console.log(fileNames);

    let productData = {
      productName: product_name,
      description: product_description,
      category: product_category,
      price: product_price,
      productImage: fileNames,
      promo_price: productPromo_price,
      stock: totalStockNew,
    };

    console.log(productData);
    let updatedProduct = await Product.findByIdAndUpdate(productId, {
      $set: productData,
    }, { new: true });

    console.log("-- product updated successfully");
    console.log(updatedProduct);
    res.redirect("/admin/products")
  } catch (err) {
    console.log(`--error in editedProduct - ${err}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

const removeImage = async (req, res) => {
  try {
    let { productId, image } = req.body;
    console.log("product from remove image ", productId + " -- " + image);
    const removeproduct = await Product.findById(productId);
    if (!removeproduct) {
      return res.status(404).json({ error: "Product not found" });
    } else {
      console.log("-- product found ");

      // const imageIndex = Product.productImage.indexOf(image);
      // if (imageIndex === -1) {
      //   console.log("image");
      //   return res.status(404).json({ error: "Image not found in product" });
      // }else{

      // console.log("image--index", imageIndex);
      // let removedImage = removeproduct.productImage.splice(image, 1);
      let removedImageArray = removeproduct.productImage.splice(image, 1);
      let removedImage = removedImageArray[0];

      // let removedImageString = removeImage.toString();
      console.log(`removed image ${removedImage}`);
      console.log(`product avastha -- ${removeproduct}`);

      const imagePath = path.join(__dirname, "../public/uploads", removedImage);
      fs.unlink(imagePath, async (err) => {
        if (err) {
          console.error("Error deleting the image file: ", err);
          return res
            .status(500)
            .json({ error: "Error deleting the image file" });
        }
      });
      const saving = await removeproduct.save();
      if (saving) {
        res.status(200).json({ success: true });
      } else {
        res.status(200).json({ success: false });
      }
    }
  } catch (err) {
    console.log("error in productController - removeImage :", err);
    res.status(500).json({ error: "Error occured while removing the image" });
  }
};

module.exports = {
  addProduct,
  addedProduct,
  productsList,
  productStatus,
  editProduct,
  editedProduct,
  removeImage,
};
