require("dotenv").config();
const express = require("express");
const router = express.Router();
const { MessagingResponse } = require("twilio").twiml;
/* COMPONENTS */
const generatePersonalityResponse = require("../../../services/chatgpt");
const Joi = require("joi");
const { VALIDATED_FIELDS, MESSAGE_RESPONSE, MESSAGE_RESPONSE_CODE } = require("../../../lib/constans");
const customerController = require("../../../controller/customer.controller");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

router.post("/", async (req, res) => {
  console.log("req.body --->", req.body);
  const message = await client.messages.create({
    body: req.body.message,
    from: "whatsapp:+14155238886", // From a valid Twilio number
    to: req.body.to, // Text this number
  });
  return res.status(200).json({ message: "Message sent", message });
});

router.post("/message", async (req, res) => {
  try {
    if(req.body.MessageType !== 'text'){
      return res.status(200).json({ message: "Sticker" });
    }
    const validateUser = await customerController.findOneCustom({ whatsAppNumber: req.body.From });
    console.log("validateUser --->", validateUser);
    if (validateUser) {
      console.log("El número ya esta registrado");
    } else {
      const data = {
        name: req.body.ProfileName,
        email: "",
        phone: req.body.WaId,
        whatsAppProfile: req.body.ProfileName,
        whatsAppNumber: req.body.From,
      };
      await customerController.create(data);
    }
    const aiResponse = await generatePersonalityResponse(req.body.Body, req.body.From);
    const twiml = new MessagingResponse();
    twiml.message(aiResponse);
    res.type("text/xml").send(twiml.toString());
  } catch (error) {
    console.log("message: error.message --->", error.message);
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

router.post("/logs-messages", async (req, res) => {
  const messages = await client.messages.list();

  let filteredMessages = messages.map((message) => {
    return {
      sid: message.sid,
      direction: message.direction,
      from: message.from,
      to: message.to,
      body: message.body,
      dateCreated: message.dateCreated,
    };
  });
  let findMessages = filteredMessages.filter((message) => req.body.to === message.to || req.body.to === message.from);
  return res.status(200).json({ findMessages  });
});

router.post("/prueba", async (req, res) => {
  const aiResponse = await generatePersonalityResponse(req.body.Body, req.body.From);
  return res.status(200).json({ aiResponse });
});

router.delete("/delete", async (req, res) => {
  const messages = await client.messages.list();
  let filteredMessages = messages.map((message) => {
    return {
      sid: message.sid,
      direction: message.direction,
      from: message.from,
      to: message.to,
      body: message.body,
      dateCreated: message.dateCreated,
    };
  });
  let findMessages = filteredMessages.filter((message) => req.body.to === message.to || req.body.to === message.from);
  let deleteMessages = findMessages.map((message) => {
    return client.messages(message.sid).remove();
  });
  return res.status(200).json({ deleteMessages });
});

module.exports = router;
