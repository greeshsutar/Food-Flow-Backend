const { Resend } = require("resend");
require("dotenv").config();

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

module.exports = transporter;