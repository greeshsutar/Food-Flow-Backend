const twilio = require("twilio");

if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH) {
  throw new Error("Twilio credentials missing");
}

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

module.exports = client;