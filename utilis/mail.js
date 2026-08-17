const { Resend } = require("resend");
require("dotenv").config();

if (!process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY not set in environment");
}

const resend = new Resend(process.env.RESEND_API_KEY);
const VERIFIED_TEST_EMAIL = "girishsutar32@gmail.com";

const transporter = {
  sendMail: async ({ to, subject, text, html }) => {
    try {
      console.log("Sending email via Resend to:", to);
      
      // In testing mode, Resend only allows sending to verified email
      const isTestMode = process.env.NODE_ENV !== "production";
      const actualTo = isTestMode && to !== VERIFIED_TEST_EMAIL 
        ? VERIFIED_TEST_EMAIL 
        : to;
      
      if (isTestMode && to !== VERIFIED_TEST_EMAIL) {
        console.log(`[TEST MODE] Redirecting email from ${to} to ${VERIFIED_TEST_EMAIL}`);
      }
      
      const result = await resend.emails.send({
        from: "FoodFlow <onboarding@resend.dev>",
        to: actualTo,
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
      // Don't throw in test mode to allow signup to proceed
      if (process.env.NODE_ENV !== "production") {
        console.warn("Email failed in test mode, continuing...");
        return { messageId: "test-mode-failed" };
      }
      throw err;
    }
  }
};

module.exports = transporter;