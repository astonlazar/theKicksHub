const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
require("dotenv").config();
const User = require("../models/userModel");
const hashing = require("../helpers/passwordHash");

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  if (!user) {
    return done(new Error("User not found!"));
  }
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      try {
        console.log(profile);
        let user = await User.findOne({ googleId: profile.id }).exec();
        const newGenPassword = await hashing.hashPassword(
          Math.random().toString()
        );
        console.log(newGenPassword);
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value, // Assuming email is provided from Google profile
            userName: profile.displayName, // Assuming username is provided from Google profile
            isActive: true, // Assuming isBlocked is optional and default value is false
            password: newGenPassword,
            phoneNo: "", // Assuming mobile is optional and empty string
          });
        } 

        if(!user.isActive){
          return done(null, false, { message: "User is blocked"})
        }
        return done(null, user);
      } catch (error) {
        console.log(error);
      }
    }
  )
);
