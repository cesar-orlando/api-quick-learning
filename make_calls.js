require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

client.calls
  .create({
    from: "+13346861135",
    to: "+524521311888",
    url: "http://demo.twilio.com/docs/voice.xml",
  })
  .then(call => console.log(call));