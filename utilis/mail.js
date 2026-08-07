let nodemailer = require("nodemailer");
require("dotenv").config();


let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    family: 4, // force IPv4 — Render's network can't reach Gmail's IPv6 SMTP address
    auth:{
        user:process.env.Email_USER,
        pass:process.env.Email_PASS
    }
})

module.exports = transporter;