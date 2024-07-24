require("dotenv").config();
const express = require("express");
const router = express.Router();
const { MessagingResponse } = require('twilio').twiml;

const generatePersonalityResponse =  require("../../../services/chatgpt");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

router.post("/", async (req, res) => {
    console.log("SI ENTRA AQUI")
  const message = await client.messages.create({
        body: 'Primera Prueba',
        from: 'whatsapp:+14155238886',
        to: 'whatsapp:+5213322155070'
    })
    

  console.log(message);
  return res.status(200).json({ message: "Message sent" });
});

router.post('/message', async (req, res) => {
    const aiResponse = await generatePersonalityResponse(req.body.Body, req.body.From)
    const twiml = new MessagingResponse();
    twiml.message(aiResponse);
    res.type('text/xml').send(twiml.toString());
});

module.exports = router;