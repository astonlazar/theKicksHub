const hashing = require("../helpers/passwordHash");
const Admin = require("../models/adminModel");
const Users = require("../models/userModel");

const adminLoginPage = (req, res, next) => {
  try {
    res.render("admin-login", { adminError: "" });
    console.log("--loading admin login");
  } catch (err) {
    next(err);
  }
};

const adminLoginInsert = async (req, res, next) => {
  try {
    // const admin = {
    //   username: "admin",
    //   password: "password",
    // };
    // let { adminId, adminPassword } = req.body;
    // console.log(adminId + " -- " + adminPassword);
    // if (admin.username === adminId) {
    //   console.log("usernamatch match  ");
    //   if (admin.password === adminPassword) {
    //     console.log("password match");
    //     const hash = await hashing.hashPassword(adminPassword);
    //     const adminData = await Admin.create({
    //       adminId: adminId,
    //       adminPassword: hash,
    //     });
    //     const adminsave = await adminData.save();
    //     if (adminsave) {
    //       console.log("saved");
    //       res.redirect("/admin/dashboard");
    //     } else {
    //       console.log("not savedd");
    //     }
    //   } else {
    //     console.log("password dosend match");
    //   }
    // } else {
    //   console.log("username doesent match");
    // }

    let { adminId, adminPassword } = req.body;
    adminId = adminId.trim();
    const adminData = await Admin.findOne({ adminId: adminId });
    console.log(adminData);
    if (adminData) {
      const cPassword = await hashing.comparePassword(
        adminPassword,
        adminData.adminPassword
      );
      if (cPassword) {
        req.session.admin = adminData;
        res.redirect("/admin/dashboard");
      } else {
        res.render("admin-login", { adminError: "Enter correct password!" });
      }
    } else {
      console.log("---can not find admin data---");
      res.render("admin-login", { adminError: "Enter correct credentials!" });
    }
  } catch (err) {
    next(err);
  }
};

const adminDashboard = (req, res, next) => {
  try {
    console.log("--loading admin dashboard");
    res.render("dashboard");
  } catch (err) {
    next(err);
  }
};

const userManagement = async (req, res, next) => {
  try {
    console.log(`--loading user management`);
    let page = parseInt(req.query.page) || 1;
    let limit = 5;

    let startIndex = (page - 1) * limit;
    let searchQuery;
    let query = {};
    if(req.query.searchUser){
      searchQuery = req.query.searchUser;
      console.log(searchQuery)
      query = { userName: new RegExp(searchQuery, "i") };
    }
    // const searchQuery = req.body.searchUser;
    // console.log(searchQuery);
    // const query = {};

    // if (searchQuery) {
    //   query = { userName: new RegExp(searchQuery, "i") };
    // }

    let users = await Users.find(query).skip(startIndex).limit(limit);
    let totalDocuments = await Users.countDocuments();

    let totalPages = Math.ceil(totalDocuments / limit);

    // const users = await Users.find(query);
    // console.log(users);
    res.render("user-management", { users, totalPages, page });
  } catch (err) {
    next(err);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const id = req.query.id;
    console.log(`_id -- ${id}`);

    req.session.temp = req.session.user;
    req.session.user.destroy = false;
    const userData = await Users.findByIdAndUpdate(id, {
      $set: { isActive: false },
    });

    res.redirect("/admin/user-management");
  } catch (err) {
    next(err);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const id = req.query.id;
    console.log(`_id -- ${id}`);
    req.session.user = req.session.temp;
    const userData = await Users.findByIdAndUpdate(id, {
      $set: { isActive: true },
    });
    res.redirect("/admin/user-management");
  } catch (err) {
    next(err);
  }
};

const transactions = (req, res) => {
  res.render("transactions");
};

const transactionDetails = (req, res) => {
  res.render("transaction-details");
};

const adminLogout = (req, res, next) => {
  try {
    req.session.admin = false;
    console.log("admin logged out");
    res.redirect("/admin");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  adminLoginPage,
  adminLoginInsert,
  adminDashboard,
  userManagement,
  blockUser,
  unblockUser,
  transactions,
  transactionDetails,
  adminLogout,
};
