let nodemailer = require("nodemailer");
require("dotenv").config();


<<<<<<< HEAD
let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    family: 4, 
    auth:{
        user:process.env.Email_USER,
        pass:process.env.Email_PASS
=======
const resend = new Resend(process.env.RESEND_API_KEY);

const transporter = {
  sendMail: async ({ to, subject, text, html }) => {
    try {
      console.log("Sending email via Resend to:", to);
      const result = await resend.emails.send({
        from: "FoodFlow <onboarding@resend.dev>",
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, "<br>")
      });
      console.log("Resend result:", result);
      if (result.error) {
        throw new Error(JSON.stringify(result.error));
      }
      return { messageId: result.data?.id };
    } catch (err) {
      console.error("Resend sendMail error:", err.message);
      throw err;
>>>>>>> parent of af41dbb (Aug 17, 2026, 6:24 PM)
    }
})

module.exports = transporter;