const hashing = require("../helpers/passwordHash");
const Admin = require("../models/adminModel");
const Users = require("../models/userModel");
const Orders = require("../models/orderModel");
const Products = require("../models/productModel");
const Categories = require("../models/categoryModel");
const PDFDocument = require("pdfkit");
const ExcelJS = require('exceljs');


//To lead the admin login page
const adminLoginPage = (req, res, next) => {
  try {
    res.render("admin-login", { adminError: "" });
    console.log("--loading admin login");
  } catch (err) {
    next(err);
  }
};

//To check for password and credentials
const adminLoginInsert = async (req, res, next) => {
  try {

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

//To lead the dashboard 
const adminDashboard = async (req, res, next) => {
  try {
    const { start, end } = req.query;

    let orderData;
    let totalOrders = await Orders.countDocuments();
    let categoryData = await Categories.find({ isActive: true });
    let totalCategories = categoryData.length;
    let productData = await Products.find({ isActive: true });
    let totalProducts = productData.length;
    let totalRevenue = await Orders.aggregate([
      {
        $group: {
          _id: null,
          totalPayableAmount: { $sum: "$payableAmount" },
        },
      },
    ]);

    if (start && end) {
      let startDate = new Date(start);
      let endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999); // Ensure the end date includes the whole day

      console.log("Date range -- ", startDate, endDate);
      orderData = await Orders.find({
        orderDate: { $gte: startDate, $lte: endDate }
      })
      .sort({ orderDate: -1 })
      // .populate('products.productId')
      console.log("--loading admin dashboard after filtering");
    } else {
      orderData = await Orders.find()
      .sort({ orderDate: -1 })
      // .populate('products.productId')
      console.log("--loading admin dashboard without filtering");
    }
    let revenue = totalRevenue[0].totalPayableAmount;

    const pipelineCat = [
      // Unwind the products array from the orders
      {
        $unwind: "$products",
      },
      // Lookup the product details to get the category
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      // Unwind the productDetails array
      {
        $unwind: "$productDetails",
      },
      // Group by category and count the number of products sold
      {
        $group: {
          _id: "$productDetails.category",
          totalSold: { $sum: "$products.quantity" },
        },
      },
      // Lookup the category details to get the category name
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      // Unwind the categoryDetails array
      {
        $unwind: "$categoryDetails",
      },
      // Project the desired fields
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          categoryName: "$categoryDetails.categoryName",
          totalSold: 1,
        },
      },
      // Sort by the total number of products sold in descending order
      {
        $sort: { totalSold: -1 },
      },
      // Limit to top 10 categories
      {
        $limit: 10,
      },
    ];
    let topCategories = await Orders.aggregate(pipelineCat).exec();
    console.log(`top categories -- ${topCategories}`);
    const pipelinePro = [
      // Match active products only (optional)
      {
        $match: { isActive: true },
      },
      // Sort by orderCount in descending order
      {
        $sort: { orderCount: -1 },
      },
      // Limit to top 10 products
      {
        $limit: 10,
      },
      // Lookup the category details to get the category name (optional)
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      // Unwind the categoryDetails array
      {
        $unwind: "$categoryDetails",
      },
      // Project the desired fields
      {
        $project: {
          _id: 0,
          productId: "$_id",
          productName: 1,
          description: 1,
          price: 1,
          promo_price: 1,
          isActive: 1,
          productImage: 1,
          stock: 1,
          reviews: 1,
          createdAt: 1,
          orderCount: 1,
          category: "$categoryDetails.categoryName",
        },
      },
    ];
    let topProducts = await Products.aggregate(pipelinePro).exec();
    console.log(`top 10 products -- ${topProducts}`);

    res.render("dashboard", {
      orderData: JSON.stringify(orderData),
      revenue,
      totalOrders,
      totalProducts,
      totalCategories,
      topCategories,
      topProducts,
      errorDownload: "",
    });
  } catch (err) {
    next(err);
  }
};

//Function to show the sales chart
const salesChart = async (req, res) => {
  try {
    let { period } = req.body;
    let groupBy;
    switch (period) {
      case "day":
        groupBy = {
          year: { $year: "$orderDate" },
          month: { $month: "$orderDate" },
          day: { $dayOfMonth: "$orderDate" },
        };
        break;
      case "month":
        groupBy = {
          year: { $year: "$orderDate" },
          month: { $month: "$orderDate" },
        };
        break;
      case "year":
        groupBy = {
          year: { $year: "$orderDate" },
        };
        break;
      default:
        return res.status(400).json({ error: "Invalid period" });
    }

    const pipeline = [
      {
        $match: {
          paymentStatus: "Success",
        },
      },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: "$payableAmount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ];

    const results = await Orders.aggregate(pipeline);
    res.json(results);
  } catch (error) {
    console.log(`Error in salesChart -- ${error}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//To download teh sales report in pdf format
const downloadSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        orderDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    const orders = await Orders.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$products" },
      { $unwind: "$productDetails" },
      {
        $addFields: {
          "products.formattedDate": {
            $function: {
              body: `function(date) {
                const options = { weekday: 'short', year: '2-digit', month: 'short', day: 'numeric' };
                return new Date(date).toLocaleDateString('en-US', options);
              }`,
              args: ["$orderDate"],
              lang: "js",
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          products: {
            $push: {
              productName: "$productDetails.productName",
              productPrice: "$products.productPrice",
              promo_price: "$productDetails.promo_price",
              quantity: "$products.quantity",
              productOrderStatus: "$products.status",
              paymentStatus: "$products.paymentStatus",
              paymentMethod: "$products.paymentMethod",
              date: "$products.formattedDate",
            },
          },
          payableAmount: { $first: "$payableAmount" },
          address: { $first: "$address" },
          orderDate: { $first: "$orderDate" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
    ]);

    if (!orders || orders.length === 0) {
      console.log("Orders not found");
      return res.status(404).send("No orders found");
    }

    // Calculate total revenue and number of orders
    let totalRevenue = 0;
    orders.forEach(order => {
      order.products.forEach(product => {
        totalRevenue += product.promo_price * product.quantity;
      });
    });
    const totalOrders = orders.length;

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    let filename = `orders_report_${new Date().toISOString()}.pdf`;
    filename = encodeURIComponent(filename);

    res.setHeader(
      "Content-disposition",
      'attachment; filename="' + filename + '"'
    );
    res.setHeader("Content-type", "application/pdf");

    doc.on("data", (chunk) => res.write(chunk));
    doc.on("end", () => res.end());

    // Header
    doc.fontSize(25).text("Order Report", { align: "center" }).moveDown(2);

    // Summary
    doc.fontSize(12).font("Helvetica-Bold").fill("#333");
    doc.text(`Total Orders: ${totalOrders}`);
    doc.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`).moveDown(2);

    // Table header
    doc.fontSize(12).font("Helvetica-Bold").fill("#333");
    const headers = [
      "Date",
      "User",
      "Product Name",
      "Product Price",
      "Discount",
      "Quantity",
      "Total",
      "Status",
    ];
    const headerXPositions = [10, 60, 130, 230, 320, 390, 460, 530];
    const headerYPosition = 250; // Moved down to accommodate summary
    const rowHeight = 50;

    headers.forEach((header, i) => {
      doc.text(header, headerXPositions[i], headerYPosition);
    });
    doc
      .moveTo(10, headerYPosition + rowHeight)
      .lineTo(570, headerYPosition + rowHeight)
      .stroke();
    doc
      .moveTo(10, headerYPosition - 10)
      .lineTo(570, headerYPosition - 10)
      .stroke();

    headerXPositions.forEach((xPos) => {
      doc
        .moveTo(xPos, headerYPosition - 10)
        .lineTo(xPos, headerYPosition + rowHeight)
        .stroke();
    });
    doc
      .moveTo(570, headerYPosition - 10)
      .lineTo(570, headerYPosition + rowHeight)
      .stroke();

    let y = headerYPosition + rowHeight + 0;

    orders.forEach((order) => {
      order.products.forEach((product) => {
        const productPrice = parseFloat(product.promo_price * product.quantity);
        const discount = parseFloat(productPrice - product.productPrice);
        const total = product.promo_price * product.quantity;

        if (!product.productName || !product.promo_price || !product.quantity)
          return;

        doc.moveTo(10, y).lineTo(570, y).stroke();
        doc
          .moveTo(10, y + rowHeight)
          .lineTo(570, y + rowHeight)
          .stroke();
        headerXPositions.forEach((xPos) => {
          doc
            .moveTo(xPos, y)
            .lineTo(xPos, y + rowHeight)
            .stroke();
        });
        doc
          .moveTo(570, y)
          .lineTo(570, y + rowHeight)
          .stroke();

        doc.fontSize(9).font("Helvetica").fill("#555");
        doc
          .fontSize(8)
          .text(product.date, 10, y + 0, { width: 50, align: "center" });
        doc.text(order.userDetails.userName, 60, y + 10, {
          width: 70,
          align: "center",
        });
        doc.text(product.productName, 130, y + 10, {
          width: 100,
          align: "left",
        });
        doc.text(product.promo_price.toFixed(0), 230, y + 10, {
          width: 70,
          align: "center",
        });
        doc.text(discount.toFixed(0), 320, y + 10, {
          width: 60,
          align: "center",
        });
        doc.text(product.quantity.toString(), 390, y + 10, {
          width: 60,
          align: "center",
        });
        doc.text(total.toFixed(0), 460, y + 10, { width: 70, align: "center" });
        doc.text(product.productOrderStatus, 530, y + 10, {
          width: 50,
          align: "left",
        });

        y += rowHeight;

        if (y > 750) {
          doc.addPage();
          y = 50;

          headers.forEach((header, i) => {
            doc.text(header, headerXPositions[i], 20);
          });
          doc.moveTo(50, 40).lineTo(550, 40).stroke();

          headerXPositions.forEach((xPos) => {
            doc.moveTo(xPos, 10).lineTo(xPos, 40).stroke();
          });
          doc.moveTo(550, 10).lineTo(550, 40).stroke();

          y = 60;
        }
      });

      y += rowHeight;
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating sales report");
  }
};

//To download the sales report in excel format
const downloadSalesReportExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        orderDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    const orders = await Orders.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$products" },
      { $unwind: "$productDetails" },
      {
        $addFields: {
          "products.formattedDate": {
            $function: {
              body: `function(date) {
                const options = { weekday: 'short', year: '2-digit', month: 'short', day: 'numeric' };
                return new Date(date).toLocaleDateString('en-US', options);
              }`,
              args: ["$orderDate"],
              lang: "js",
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          products: {
            $push: {
              productName: "$productDetails.productName",
              productPrice: "$products.productPrice",
              promo_price: "$productDetails.promo_price",
              quantity: "$products.quantity",
              productOrderStatus: "$products.status",
              paymentStatus: "$products.paymentStatus",
              paymentMethod: "$products.paymentMethod",
              date: "$products.formattedDate",
            },
          },
          payableAmount: { $first: "$payableAmount" },
          address: { $first: "$address" },
          orderDate: { $first: "$orderDate" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
    ]);

    if (!orders || orders.length === 0) {
      console.log("Orders not found");
      return res.status(404).send("No orders found");
    }

    // Calculate total revenue and number of orders
    let totalRevenue = 0;
    orders.forEach(order => {
      order.products.forEach(product => {
        totalRevenue += product.promo_price * product.quantity;
      });
    });
    const totalOrders = orders.length;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Order Report');

    // Add summary
    worksheet.addRow(['Total Orders', totalOrders]);
    worksheet.addRow(['Total Revenue', `₹${totalRevenue.toFixed(2)}`]);
    worksheet.addRow([]); // Empty row for spacing

    // Add headers
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'User', key: 'user', width: 20 },
      { header: 'Product Name', key: 'productName', width: 25 },
      { header: 'Product Price', key: 'productPrice', width: 15 },
      { header: 'Discount', key: 'discount', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    // Add data
    orders.forEach((order) => {
      order.products.forEach((product) => {
        const productPrice = parseFloat(product.promo_price * product.quantity);
        const discount = parseFloat(productPrice - product.productPrice);
        const total = product.promo_price * product.quantity;

        if (!product.productName || !product.promo_price || !product.quantity)
          return;

        worksheet.addRow({
          date: product.date,
          user: order.userDetails.userName,
          productName: product.productName,
          productPrice: product.promo_price.toFixed(2),
          discount: discount.toFixed(2),
          quantity: product.quantity.toString(),
          total: total.toFixed(2),
          status: product.productOrderStatus,
        });
      });
    });

    // Set response headers
    const filename = `orders_report_${new Date().toISOString()}.xlsx`;
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating sales report");
  }
};

//To show the users 
const userManagement = async (req, res, next) => {
  try {
    console.log(`--loading user management`);
    let page = parseInt(req.query.page) || 1;
    let limit = 5;

    let startIndex = (page - 1) * limit;
    let searchQuery;
    let query = {};
    if (req.query.searchUser) {
      searchQuery = req.query.searchUser;
      console.log(searchQuery);
      query = { userName: new RegExp(searchQuery, "i") };
    }
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

//To block the active users
const blockUser = async (req, res, next) => {
  try {
    const id = req.query.id;
    console.log(`_id -- ${id}`);

    const userData = await Users.findByIdAndUpdate(id, {
      $set: { isActive: false },
    });
    res.redirect("/admin/user-management");
  } catch (err) {
    next(err);
  }
};

//To unblock the blocked users
const unblockUser = async (req, res, next) => {
  try {
    const id = req.query.id;
    console.log(`_id -- ${id}`);
    const userData = await Users.findByIdAndUpdate(id, {
      $set: { isActive: true },
    });
    res.redirect("/admin/user-management");
  } catch (err) {
    next(err);
  }
};

//To logout the admin
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
  salesChart,
  downloadSalesReport,
  downloadSalesReportExcel,
  userManagement,
  blockUser,
  unblockUser,
  adminLogout,
};
