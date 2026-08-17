const { Resend } = require("resend");
require("dotenv").config();

if (!process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY not set in environment");
}

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
    }
  }
};

module.exports = transporter;