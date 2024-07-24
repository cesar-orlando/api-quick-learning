const express = require("express");
const router = express.Router();
const VoiceResponse = require("twilio").twiml.VoiceResponse;

router.post("/", async (req, res) => {
    const twiml = new VoiceResponse();
    twiml.say('Hello from your pals at Twilio! Have fun.2');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
});

module.exports = router;
