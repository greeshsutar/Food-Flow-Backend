const mongoose = require("mongoose");

const loginSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
      trim: true,
    },

    lastname: {
      type: String,
      trim: true,
      default: "",
    },

    gmail: {
      type: String,
      lowercase: true,
      unique: true,
      sparse: true,
      match: /^\S+@\S+\.\S+$/,
    },

    mobileno: {
      type: String,
      unique: true,
      sparse: true,
      match: /^[0-9]{10}$/,
    },

    // For normal email/password users
    password: {
      type: String,
      default: null,
      minlength: 8,
    },

    // For Google users
    googleId: {
      type: String,
      default: null,
    },

    // Which authentication method created this account
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // OTP verification
    otp: {
      type: String,
      default: null,
    },

    otpExpires: {
      type: Date,
      default: null,
    },

    // Account verification status
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Optional profile picture
    profilePicture: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const loginModel = mongoose.model("loginModel", loginSchema);

module.exports = loginModel;