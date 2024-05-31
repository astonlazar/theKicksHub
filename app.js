require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const nocache = require("nocache");
const mongoose = require("mongoose");
const passport = require("passport");
require("./helpers/googleAuth");
const ErrorHandling = require("./middlewares/ErrorHandling")

const app = express();
const PORT = process.env.PORT;

//session
app.use(
  session({
    secret: "a-very-random-string-710710",
    resave: false,
    saveUninitialized: true,
  })
);


//parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//set static folder
app.use(express.static("public"));

app.use(passport.initialize())
app.use(passport.session())
//caching
app.use(nocache());


//connect to mongodb
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("connected to mongodb successfully");
  })
  .catch((err) => {
    console.log(err);
  });

//routes
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");

app.use("/", userRoute);
app.use("/admin", adminRoute);

app.use(ErrorHandling)

//view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");





//listening to port
app.listen(PORT, () => {
  console.log(`Running in http://localhost:${PORT}`);
});
