const Category = require("../models/categoryModel");

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

const categoryInsert = async (req, res) => {
  try {
    let categoryData = await Category.find({});
    console.log(categoryData);
    let { category_name, category_slug } = req.body;
    category_name = category_name.toUpperCase();
    // category_slug = category_slug.toLowerCase();
    console.log(category_name, category_slug);
    if (category_name == "") {
      res.render("categories", {
        errorName: "Enter the Category Name",
        categoryData,
      });
    }
    if (category_name[0] == " " || category_name == " ") {
      res.render("categories", {
        errorName: "Enter the Category Name properly",
        categoryData,
      });
    }
    let categoryCheck = await Category.find({
      $and: [{ categoryName: category_name }, { slug: category_slug }],
    });
    console.log(`-- categoryCheck --${categoryCheck}--`);
    if (categoryCheck == "") {
      let insertData = await Category.insertMany({
        categoryName: category_name,
      });
      console.log(`-- inserting categoryData`);
      console.log(insertData);
    }
    res.redirect("/admin/categories");
  } catch (err) {
    console.log(`--Error at categoryInsert -- ${err}`);
  }
};

const statusUpdate = async (req, res) => {
  let { id } = req.body;
  console.log(`-- category id- ${id}`);
  let categoryData = await Category.findById({ _id: id });
  if (categoryData.isActive === true) {
    await Category.findByIdAndUpdate(
      { _id: id },
      { $set: { isActive: false } }
    );
  } else {
    await Category.findByIdAndUpdate({ _id: id }, { $set: { isActive: true } });
  }
  res.status(200).redirect("/admin/categories");
};

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
