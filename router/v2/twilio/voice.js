const express = require("express");
const router = express.Router();
const VoiceResponse = require("twilio").twiml.VoiceResponse;
const generatePersonCall = require("../../../services/call_chatgpt")

router.post("/incoming-call", async (req, res) => {
    console.log("res --->", req.cookies)
  // Create a TwiML Voice Response object to build the response
  const twiml = new VoiceResponse();
    twiml.say("Hola");

  // Listen to the user's speech and pass the input to the /respond Function
  twiml.gather({
      input: ["speech"], // Specify speech as the input type
    speechTimeout: "auto", // Automatically determine the end of user speech
    speechModel: "experimental_conversations", // Use the conversation-based speech recognition model
    enhanced: true, // Enable enhanced speech recognition
    action: "/api/v2/voice/respond", // Send the collected input to /respond
    language: "es-MX",
  });

  res.type("text/xml").send(twiml.toString());
});

router.post("/respond", async (req, res) => {
  const aiResponse = await generatePersonCall(req.body.SpeechResult, req.body.Caller);

  const voiceResponse = new VoiceResponse();
  voiceResponse.say(aiResponse);
  voiceResponse.redirect("/api/v2/voice/incoming-call");
  res.type("text/xml").send(voiceResponse.toString());
});

module.exports = router;
