let nodemailer = require("nodemailer");
require("dotenv").config();


let transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.Email_USER,
        pass:process.env.Email_PASS
    }
})

module.exports = transporter;