require("dotenv").config();
const express = require("express");
const router = express.Router();
const { MessagingResponse } = require("twilio").twiml;

const generatePersonalityResponseRealState = require("../../../services/chatgpt_arrowhead");
const customerController = require("../../../controller/customer.controller");
const generateAgent = require("../../../services/bot_functions");
const agentOfRealState = require("../../../services/realstate/bot_prueba");
const { MESSAGE_RESPONSE_CODE } = require("../../../lib/constans");
const { default: axios } = require("axios");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

let messageCounts = {};

router.post("/", async (req, res) => {
  try {
    if (req.body.MessageType !== "text") {
      return res.status(200).json({ message: "Sticker" });
    }

    const userNumber = req.body.From;

    // Verifica si messageCounts[userNumber] existe y cancela el timeout si es necesario
    if (!messageCounts[userNumber]) {
      messageCounts[userNumber] = { messages: [] };
    } else {
      clearTimeout(messageCounts[userNumber].timeout);
    }

    // Agrega el mensaje actual al arreglo de mensajes del usuario
    messageCounts[userNumber].messages.push(req.body.Body);

    // Establece el timeout para enviar la respuesta después de 30 segundos
    messageCounts[userNumber].timeout = setTimeout(async () => {
      if (messageCounts[userNumber]) {
        const combinedMessage = messageCounts[userNumber].messages.join(" ");
        const aiResponse = await agentOfRealState(combinedMessage, userNumber, messageCounts[userNumber].messages.length);

        // Enviar el mensaje de respuesta usando la API de Twilio
        await client.messages.create({
          body: aiResponse,
          from: "whatsapp:+5213341610750", // Número de WhatsApp de Twilio
          to: userNumber,
        });

        console.log("WhatsApp message sent successfully.");

        // Envía una respuesta al servidor indicando éxito
        res.status(200).json({ message: "WhatsApp message sent successfully." });

        // Elimina el registro de mensajes del usuario una vez que se envía la respuesta
        delete messageCounts[userNumber];
      }
    }, 3000);

  } catch (error) {
    console.log("Error:", error.message);
    res.status(400).json({ message: error.message });
  }
});



router.post("/send-message", async (req, res) => {
  try {
    console.log("req.body.type --->", req.body.type);
    if (req.body.type === 1) {
      let data = [
        {
          body: "Fachada de Casa",
          url: "https://realstate-virtual-voices.s3.us-east-2.amazonaws.com/realstate/WhatsApp+Image+2024-09-22+at+10.21.04+AM.jpeg",
        },
        {
          body: "Cocina",
          url: "https://realstate-virtual-voices.s3.us-east-2.amazonaws.com/realstate/WhatsApp+Image+2024-09-22+at+10.21.04+AM+(5).jpeg",
        },
        {
          body: "Closets",
          url: "https://realstate-virtual-voices.s3.us-east-2.amazonaws.com/realstate/WhatsApp+Image+2024-09-22+at+10.21.04+AM+(4).jpeg",
        },
        {
          body: "Baños",
          url: "https://realstate-virtual-voices.s3.us-east-2.amazonaws.com/realstate/WhatsApp+Image+2024-09-22+at+10.21.04+AM+(3).jpeg",
        },
        {
          body: "Casa club",
          url: "https://realstate-virtual-voices.s3.us-east-2.amazonaws.com/realstate/WhatsApp+Image+2024-09-22+at+10.21.04+AM+(1).jpeg",
        },
      ];
      for (let i = 0; i < data.length; i++) {
        await client.messages.create({
          body: data[i].body,
          mediaUrl: [data[i].url],
          from: "whatsapp:+5213341610750",
          to: req.body.number,
        });
        console.log("Envio de numero --->", i);
      }

      return res.status(200).json({ message: "Message sent" });
    } else {
      console.log("Entra aqui");
      await client.messages.create({
        body: "🏡 Natura Bosque Residencial",
        mediaUrl: ["https://realstate-virtual-voices.s3.us-east-2.amazonaws.com/realstate/WhatsApp+Video+2024-09-19+at+8.41.54+PM.mp4"],
        from: "whatsapp:+5213341610750",
        to: req.body.number,
      });
      return res.status(200).json({ message: "Message sent" });
    }
  } catch (error) {
    console.log("error.message --->", error);
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
