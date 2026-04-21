let Razorpay = require("razorpay");
require("dotenv").config();

//structuure to  take authorize 
let razorpay = new Razorpay.create({
    key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
})

module.exports = razorpay;