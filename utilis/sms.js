let twilio = require("twilio");

const client = twilio(  
    process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);
module.exports = client;