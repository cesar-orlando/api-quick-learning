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
    const validateUser = await customerController.findOneCustom({ whatsAppNumber: req.body.From });
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

    
    // Si ya hay un contador para este número, lo cancelamos
    if (messageCounts[req.body.From]) {
      clearTimeout(messageCounts[req.body.From].timeout);
    }

    // Incrementamos el contador de mensajes para este número
    if (!messageCounts[req.body.From]) {
      messageCounts[req.body.From] = { count: 0 };
    }
    messageCounts[req.body.From].count += 1;

    messageCounts[req.body.From].timeout = setTimeout(async () => {
      console.log("messageCounts[req.body.From].count --->", messageCounts[req.body.From].count);
    const aiResponse = await agentOfRealState(req.body.Body, req.body.From, messageCounts[req.body.From].count);
    if (aiResponse === 1) {
      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "http://localhost:3000/api/v2/realstate/send-message",
        headers: {
          "Content-Type": "application/json",
        },
        data: { type: aiResponse, number: req.body.From },
      };
      await axios.request(config);
    } else if (aiResponse === 2) {
      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "http://localhost:3000/api/v2/realstate/send-message",
        headers: {
          "Content-Type": "application/json",
        },
        data: { type: aiResponse, number: req.body.From },
      };
      await axios.request(config);
    }

    let casaToledo = `🏠 Casa en Condominio Toledo – Zona Nueva Galicia
    🛏️ 1 recámara en planta baja con baño completo, amplia cocina, área de lavado y patio trasero.
    🔝 En planta alta: Recámara principal con vestidor y baño, y 2 recámaras secundarias que comparten baño completo.
    
    🌳 Amenidades del Condominio Toledo:
    🌿 Doble área de jardines, 🏊‍♂️ alberca, 🌞 terraza, 🛤️ andador, 🏀 canchas multiusos y 💪 equipos para gimnasio al aire libre.
    
    💲 Venta: $4,200,000
    💲 Renta: $15,500 + mantenimiento.
    
    ¡Vive con comodidad y estilo! 🏡✨`;

    let casaNature = `🏡 Natura Bosque Residencial
    🛏️ 3 recámaras (1 en planta baja)
    💰 $2,890,000
    ✔️ Incluye protecciones, boiler y domo en patio
    🔒 Coto privado con seguridad`;

    let sendMessage = aiResponse === 1 ? casaToledo : aiResponse == 2 ? casaNature : aiResponse;

    const twiml = new MessagingResponse();
    twiml.message(sendMessage);
    res.type("text/xml").send(twiml.toString());
    messageCounts[req.body.From].count = 0;
  }, 30000);
  } catch (error) {
    console.log("message: error.message --->", error.message);
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
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
