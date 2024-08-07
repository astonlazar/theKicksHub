const Category = require("../models/categoryModel");

//To load the categories page in admin side
const categories = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 5;

    let startIndex = (page - 1) * limit;

    let categoryData = await Category.find().skip(startIndex).limit(limit);
    let totalDocuments = await Category.countDocuments();

    let totalPages = Math.ceil(totalDocuments / limit);

    // let categoryData = await Category.find({});
    // console.log(categoryData);
    res.status(200).render("categories", {
      errorName: "",
      categoryData,
      page,
      totalPages,
    });
  } catch (err) {
    console.log(`-- Error at categories -- ${err}`);
  }
};

//function to add new category
const categoryInsert = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 5;

    let startIndex = (page - 1) * limit;

    let categoryData = await Category.find().skip(startIndex).limit(limit);
    let totalDocuments = await Category.countDocuments();

    let totalPages = Math.ceil(totalDocuments / limit);
    console.log(categoryData);
    let { category_name } = req.body;
    category_name = category_name.toUpperCase();

    console.log(category_name);
    let categoryCheck = await Category.find({
      $and: [{ categoryName: category_name }],
    });
    console.log(`-- categoryCheck --${categoryCheck}--`);
    if (categoryCheck == "") {
      let insertData = await Category.insertMany({
        categoryName: category_name,
      });
      console.log(`-- inserting categoryData`);
      console.log(insertData);
    } else {
      res.status(200).render("categories", {
        errorName: "Category already exists",
        categoryData,
        page,
        totalPages,
      });
    }
    res.redirect("/admin/categories");
  } catch (err) {
    console.log(`--Error at categoryInsert -- ${err}`);
  }
};

//To update the status of the category, to block or unblock
const statusUpdate = async (req, res) => {
  let { categoryId } = req.body;
  console.log(`-- category id- ${categoryId}`);
  let categoryD = await Category.findById({ _id: categoryId });
  let categoryData = await Category.find();
  if (categoryD.isActive === true) {
    await Category.findByIdAndUpdate(
      { _id: categoryId },
      { $set: { isActive: false } }
    );
  } else {
    await Category.findByIdAndUpdate(
      { _id: categoryId },
      { $set: { isActive: true } }
    );
  }
  // res.redirect("/categories");
};

//To edit the category if needed
const editCategory = async (req, res) => {
  try {
    let id = req.params.id;
    console.log(id);
    let categoryData = await Category.findById({ _id: id });
    console.log(categoryData);
    res.render("edit-category", { errorName: "", categoryData });
  } catch (err) {
    console.log(err);
  }
};

//POST method to change the category
const editedCategory = async (req, res) => {
  let id = req.params.id;
  let { category_name, category_slug } = req.body;
  category_name = category_name.toUpperCase();
  console.log(category_name, category_slug, id);

  let tempcategoryData = await Category.findOne({
    categoryName: category_name,
  });
  let categoryData = await Category.findById(id);
  if (tempcategoryData) {
    res.render("edit-category", {
      errorName: "Cannot change to existing Category",
      categoryData,
    });
  } else {
    await Category.findByIdAndUpdate(id, {
      $set: { categoryName: category_name },
    });
    console.log(tempcategoryData);
    res.redirect("/admin/categories");
  }
};

module.exports = {
  categories,
  categoryInsert,
  statusUpdate,
  editCategory,
  editedCategory,
};
