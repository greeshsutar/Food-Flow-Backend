let mongoose = require("mongoose");

let loginSchema=  new mongoose.Schema({
   firstname: {
    type: String,
    required: true
  },

  lastname: String,

  gmail: {
    type: String,
    lowercase: true,
    unique: true,
    sparse: true, //  allows null for phone users
    match: /^\S+@\S+\.\S+$/
  },

  mobileno: {
    type: String,
    unique: true,
    sparse: true, //  allows null for email users
    match: /^[0-9]{10}$/
  },

  password: {
    type: String,
    minlength: 8
  },

  //  OTP system
  otp: String,
  otpExpires: Date,

  // verification
  isVerified: {
    type: Boolean,
    default: false
  },

  // timestamps (very useful)
}, { timestamps: true });
    

let loginModel = mongoose.model("loginModel",loginSchema);

module.exports = loginModel;