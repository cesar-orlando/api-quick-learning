require("dotenv").config();
const express = require("express");
const router = express.Router();

const generatePersonalityResponseRealState = require("../../../services/chatgpt_arrowhead");
const customerController = require("../../../controller/customer.controller");
const generateAgent = require("../../../services/bot_functions");
const agentOfRealState = require("../../../services/realstate/bot_prueba");
const { MESSAGE_RESPONSE_CODE } = require("../../../lib/constans");

const { MessagingResponse } = require("twilio").twiml;
const client = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
let messageCounts = {};

router.post("/", async (req, res) => {
  try {
    if (req.body.MessageType !== "text") {
      return res.status(200).json({ message: "Sticker" });
    }

    const userNumber = req.body.From;

    // Responder al webhook de Twilio inmediatamente para evitar duplicados
    res.status(200).json({ message: "Mensaje recibido y en proceso." });

    // Si no existe en messageCounts, inicializamos su registro
    if (!messageCounts[userNumber]) {
      messageCounts[userNumber] = { messages: [], isProcessing: false };
    }

    // Si el mensaje ya está en proceso, salimos para evitar duplicados
    if (messageCounts[userNumber].isProcessing) return;

    // Marcar el mensaje como en proceso
    messageCounts[userNumber].isProcessing = true;

    // Agregar el mensaje actual al registro del usuario
    messageCounts[userNumber].messages.push(req.body.Body);

    // Configurar el temporizador para consolidar los mensajes después de 3 segundos (en lugar de 30 para pruebas)
    setTimeout(async () => {
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

        // Limpiar el registro del usuario después de enviar la respuesta
        delete messageCounts[userNumber];
      }
    }, 3000); // 3 segundos para pruebas (cambiar a 30000 para producción)

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
