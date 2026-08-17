let nodemailer = require("nodemailer");
require("dotenv").config();


let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    family: 4, 
    auth:{
        user:process.env.Email_USER,
        pass:process.env.Email_PASS
    }
})

module.exports = transporter;