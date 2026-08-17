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
    }
})
=======
const resend = new Resend(process.env.RESEND_API_KEY);

const transporter = {
  sendMail: async ({ to, subject, text, html }) => {
    const result = await resend.emails.send({
      from: "FoodFlow <onboarding@resend.dev>",
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>")
    });
    return { messageId: result.data?.id };
  }
};
>>>>>>> parent of 60237b2 (Add Resend error logging)

module.exports = transporter;