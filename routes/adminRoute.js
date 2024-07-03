const express = require("express");
const adminRoute = express();
const adminController = require("../controllers/adminController");
const categoryController = require("../controllers/categoryController");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const couponController = require("../controllers/couponController");
const offerController = require("../controllers/offerController");
const auth = require("../middlewares/adminAuth");
const multer = require("../helpers/multer");

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin");

//routes
adminRoute.get("/", auth.isLogout, adminController.adminLoginPage);

adminRoute.post("/", adminController.adminLoginInsert);

adminRoute.get("/dashboard", auth.isLogin, adminController.adminDashboard);
adminRoute.get("/download-sales-report", adminController.downloadSalesReport)

adminRoute.get(
  "/user-management",
  auth.isLogin,
  adminController.userManagement
);

//routes to block and unblock users from user-management
adminRoute.get("/block", auth.isLogin, adminController.blockUser);
adminRoute.get("/unblock", auth.isLogin, adminController.unblockUser);

adminRoute.get("/categories", auth.isLogin, categoryController.categories);
adminRoute.post("/categories", auth.isLogin, categoryController.categoryInsert);
adminRoute.get(
  "/categories/edit/:id",
  auth.isLogin,
  categoryController.editCategory
);
adminRoute.post(
  "/categories/edit/:id",
  auth.isLogin,
  categoryController.editedCategory
);
adminRoute.put(
  "/categories/status",
  auth.isLogin,
  categoryController.statusUpdate
);

adminRoute.get("/add-product", auth.isLogin, productController.addProduct);
adminRoute.post(
  "/add-product",
  multer.multiupload,
  productController.addedProduct
);

adminRoute.get("/products", auth.isLogin, productController.productsList);
adminRoute.put(
  "/products/status",
  auth.isLogin,
  productController.productStatus
);
adminRoute.get(
  "/products/edit/:id",
  auth.isLogin,
  productController.editProduct
);
adminRoute.post(
  "/products/edit/:id",
  multer.multiupload,
  productController.editedProduct
);

adminRoute.delete(
  "/products/edit/remove-image",
  auth.isLogin,
  productController.removeImage
);

adminRoute.get("/orders", auth.isLogin, orderController.loadOrderPage);
adminRoute.get(
  "/orders/details",
  auth.isLogin,
  orderController.orderDetailsPage
);
adminRoute.put(
  "/orders/update-status",
  auth.isLogin,
  orderController.orderStatusChange
);

adminRoute.get("/transactions", auth.isLogin, adminController.transactions);

adminRoute.get(
  "/transactionDetails",
  auth.isLogin,
  adminController.transactionDetails
);

adminRoute.get("/coupons", auth.isLogin, couponController.loadCouponPage);
adminRoute.post("/coupons", auth.isLogin, couponController.addCoupon);
adminRoute.put("/coupons/status", auth.isLogin, couponController.couponStatus)

adminRoute.get("/offers", auth.isLogin, offerController.loadOffersPage);
adminRoute.get(
  "/offers/product/add",
  auth.isLogin,
  offerController.addProductOffer
);
adminRoute.post(
  "/offers/product/add",
  auth.isLogin,
  offerController.addingProductOffer
);

adminRoute.get(
  "/offers/category/add",
  auth.isLogin,
  offerController.addCategoryOffer
);
adminRoute.post(
  "/offers/category/add",
  auth.isLogin,
  offerController.addingCategoryOffer
);

adminRoute.get(
  "/offers/product/edit/:id",
  auth.isLogin,
  offerController.editProductOffer
);
adminRoute.post(
  "/offers/product/edit/:id",
  auth.isLogin,
  offerController.editedProductOffer
);

adminRoute.get(
  "/offers/category/edit/:id",
  auth.isLogin,
  offerController.editCategoryOffer
);
adminRoute.post(
  "/offers/category/edit/:id",
  auth.isLogin,
  offerController.editedCategoryOffer
);

adminRoute.put("/offers/status", auth.isLogin, offerController.offerStatus);

//route to logout
adminRoute.get("/logout", adminController.adminLogout);

module.exports = adminRoute;
