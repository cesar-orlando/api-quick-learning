require("dotenv").config();
const express = require("express");
const router = express.Router();
const { MessagingResponse } = require("twilio").twiml;
/* COMPONENTS */
const generatePersonalityResponse = require("../../../services/chatgpt");
const generatePersonalityResponseRealState = require("../../../services/chatgpt_arrowhead");
const generateAgent = require("../../../services/bot_functions");
const generateAgentVirtuaVoices = require("../../../services/bot_virtual_voices");
const agentOfRealState = require("../../../services/realstate/bot_prueba");
const generateAgentTest = require("../../../services/bot_test");
const Joi = require("joi");
const { VALIDATED_FIELDS, MESSAGE_RESPONSE, MESSAGE_RESPONSE_CODE } = require("../../../lib/constans");
const customerController = require("../../../controller/customer.controller");
const { dataChatGpt } = require("../../../db/data");
const { default: axios } = require("axios");
const userController = require("../../../controller/user.controller");
const Chat = require("../../../models/quicklearning/chats");
const { students } = require("../../../db/dataStudents");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

router.post("/", async (req, res) => {
  console.log("req.body --->", req.body);
  const message = await client.messages.create({
    body: req.body.message,
    from: "whatsapp:+5213341610749", // From a valid Twilio number
    to: req.body.to, // Text this number
  });

  console.log("message --->", message);

  let chat = await Chat.findOne({ phone: req.body.to });
  console.log("chat --->", chat);
  if (!chat) {
    chat = new Chat({ phone: req.body.phone });
  }

  chat.messages.push({
    direction: "outbound-api",
    body: req.body.message,
  });

  await chat.save();

  return res.status(200).json({ message: "Message sent", message });
});

router.post("/send", async (req, res) => {
  try {
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "No se encontraron alumnos en la petición." });
    }

    // Obtener solo los primeros 300 estudiantes
    const limitedStudents = students.slice(400, 1000);

    let results = [];

    for (let student of limitedStudents) {
      const { Teléfono, Alumno } = student;
      let name = Alumno;
      let phone = `whatsapp:+521${Teléfono}`;
      let email = student["Correo Electrónico"];
      let celphone = `521${Teléfono}`
      console.log("name --->", name);
      console.log("phone --->", phone);
      console.log("email --->", email);

      if (!phone || !name) {
        results.push({ phone, name, status: "Falta teléfono o nombre" });
        continue;
      }

      // Verificar si el alumno ya existe en la base de datos
      let existingCustomer = await customerController.findOneCustom({ celphone });

      if (!existingCustomer) {
        // Crear un nuevo cliente si no existe
        const newCustomer = {
          name,
          phone: celphone,
          comments: "Renovación de membresía",
          classification: "Alumno",
          status: "Renovación",
          visitDetails: { branch: "", date: "", time: "" },
          enrollmentDetails: {
            consecutive: student.Clave,
            course: student.Membresía,
            modality: "Online",
            state: "",
            email: email,
            source: "",
            paymentType: student.Monto,
          },
          user: "6791797aed7b7e3736119768", // Puedes asignar un usuario si es necesario
          ia: true,
        };
        await customerController.create(newCustomer);
      }

      // Enviar mensaje de WhatsApp
      try {
        let firstName = name.split(" ")[0]; // Tomar solo el primer nombre
        const message = await client.messages.create({
          contentSid: "HX7b7de5af5e0e7967bb6461d3cad3b998", // Content SID correcto
          contentVariables: JSON.stringify({ 1: firstName }), // Reemplaza {{1}} con el nombre del cliente
          from: "whatsapp:+5213341610749",
          to: `${phone}`,
        });

        console.log("✅ Mensaje enviado a", phone, "con nombre:", name);
        console.log("message.sid --->", message.sid);
        results.push({ phone, name, status: "Mensaje enviado", messageSid: message.sid });

        // Crear conversación en la base de datos
        let chat;
        try {
          chat = await Chat.findOne({ phone });
          if (!chat) {
            chat = new Chat({ phone });
          }
        
          chat.messages.push({
            direction: "outbound-api",
            body: `Hola ${firstName}, sabemos que tu membresía de Quick Learning Online ha vencido, y queremos darte una gran noticia:
        
        🎁 Este 14 de febrero te regalamos el doble de tiempo en membresías de 3 y 6 meses + 15% de descuento adicional.
        
        Esto significa que si adquieres una membresía de 3 meses, recibirás 6 meses en total. Y si eliges 6 meses, ¡tendrás acceso por todo un año! 📅✨
        
        Es la oportunidad perfecta para seguir aprendiendo inglés con total flexibilidad y acceso a asesorías en vivo con maestros Quick Learning.
        
        💬 Escríbeme si necesitas más información o si quieres aprovechar esta promoción exclusiva.
        
        📌 Solo válida el 14 de febrero. ¡No la dejes pasar`,
          });
        
          await chat.save();
          console.log("✅ Chat guardado para el teléfono:", phone);
        } catch (error) {
          console.error("❌ Error al guardar el chat para el teléfono:", phone, error);
        }
      } catch (error) {
        console.error("❌ Error al enviar mensaje a", phone, ":", error.message);
        results.push({ phone, name, status: "Error al enviar mensaje", error: error.message });
      }
    }

    return res.status(200).json({ message: "Proceso completado", total:results.length, results });
  } catch (error) {
    console.error("❌ Error en el endpoint:", error.message);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});


let messageCounts = {};

router.post("/message", async (req, res) => {
  try {
    const { MessageType, MediaContentType0, MediaUrl0, WaId, ProfileName, Body, From } = req.body;

    console.log("req.body --->", req.body);

    const userNumber = From;

    // Verificar si el usuario ya existe en la base de datos
    const validateUser = await customerController.findOneCustom({ phone: WaId });
    if (!validateUser) {
      const getUsers = await userController.findAll();
      const agentIndex = Math.floor(Math.random() * getUsers.length);
      const agent = getUsers[agentIndex];

      const data = {
        name: ProfileName,
        phone: WaId,
        comments: "",
        classification: "Prospecto",
        status: "En conversación",
        visitDetails: { branch: "", date: "", time: "" },
        enrollmentDetails: {
          consecutive: "",
          course: "",
          modality: "",
          state: "",
          email: "",
          source: "",
          paymentType: "",
        },
        user: agent._id,
        ia: true,
      };
      await customerController.create(data);

      let chat = await Chat.findOne({ phone: WaId });
      if (!chat) {
        chat = new Chat({ phone: WaId });
      }

      chat.messages.push({
        direction: "inbound",
        body: Body,
      });

      await chat.save();

      // Enviar respuesta al usuario
      await client.messages.create({
        body: "¡Hola! Soy NatalIA de Quick Learning, encantada de ayudarte. ¿Cómo te llamas?",
        from: "whatsapp:+5213341610749",
        to: userNumber,
      });

      chat.messages.push({
        direction: "outbound-api",
        body: "¡Hola! Soy NatalIA de Quick Learning, encantada de ayudarte. ¿Cómo te llamas?",
      });

      await chat.save();

      return res.status(200).json({ message: "El usuario no existe en la base de datos" });
    }

    let chat = await Chat.findOne({ phone: WaId });
    if (!chat) {
      chat = new Chat({ phone: WaId });
    }

    chat.messages.push({
      direction: "inbound",
      body: Body,
    });

    await chat.save();

    //validación que si el usuario tiene ia en false no haga nada.
    if (!validateUser.ia) {
      console.log("El usuario no tiene activado el IA");
      return res.status(200).json({ message: "El usuario no tiene activado el IA" });
    }

    // Manejo de mensajes en `messageCounts`
    if (!messageCounts[userNumber]) {
      messageCounts[userNumber] = { messages: [] };
    }

    // Agregar mensajes multimedia o de texto al historial
    if (MessageType !== "text" && MediaUrl0) {
      messageCounts[userNumber].messages.push({
        type: "media",
        mediaType: MediaContentType0,
        mediaUrl: MediaUrl0,
        text: Body || "",
      });
    } else {
      messageCounts[userNumber].messages.push({
        type: "text",
        content: Body,
      });
    }

    // Cancelar un timeout previo, si existe
    if (messageCounts[userNumber].timeout) {
      clearTimeout(messageCounts[userNumber].timeout);
    }

    // Configurar timeout para enviar respuesta después de 30 segundos de inactividad
    messageCounts[userNumber].timeout = setTimeout(async () => {
      if (messageCounts[userNumber]) {
        const userMessages = messageCounts[userNumber].messages;

        // Combinar mensajes para enviarlos a OpenAI
        const combinedMessage = userMessages
          .map((msg) => {
            if (msg.type === "text") {
              return msg.content;
            } else if (msg.type === "media") {
              return `Se recibió un archivo (${msg.mediaType}): ${msg.text || "Sin texto adicional"}`;
            }
          })
          .join("\n");

        // Generar respuesta usando OpenAI
        const aiResponse = await generatePersonalityResponse(
          combinedMessage, // Mensaje combinado
          userNumber, // Número del usuario
          MediaContentType0 || null, // Tipo de media, si existe
          MediaUrl0 || null // URL del media, si existe
        );

        // Enviar respuesta al usuario
        await client.messages.create({
          body: aiResponse,
          from: "whatsapp:+5213341610749",
          to: userNumber,
        });

        console.log("Respuesta enviada exitosamente:", aiResponse);

        let chat = await Chat.findOne({ phone: WaId });
        if (!chat) {
          chat = new Chat({ phone: WaId });
        }

        chat.messages.push({
          direction: "outbound-api",
          body: aiResponse,
        });

        await chat.save();

        // Limpiar el registro de mensajes del usuario
        delete messageCounts[userNumber];
      }
    }, 30000); // 30 segundos de inactividad

    // Responder al webhook de Twilio
    res.status(200).json({ message: "Mensaje recibido y consolidando respuestas." });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(400).json({ message: error.message });
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
  return res.status(200).json({ findMessages });
});

router.post("/prueba", async (req, res) => {
  const aiResponse = await generateAgentTest(req.body.message, req.body.to);
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

router.post("/message-virtual-voices", async (req, res) => {
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
    const aiResponse = await agentOfRealState(req.body.Body, req.body.From);
    if (aiResponse === 1) {
      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "http://localhost:3000/api/v2/whastapp/send",
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios.request(config);
    }
    const twiml = new MessagingResponse();
    twiml.message(aiResponse);
    res.type("text/xml").send(twiml.toString());
  } catch (error) {
    console.log("message: error.message --->", error.message);
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

router.post("/send-message", async (req, res) => {
  try {
    const message = await client.messages.create({
      //contentSid: "HXd5c4612076eea96ec7c7b9a28095b460", Es de prueba
      contentSid: "HX253992d2b3a97cea05b4809360c6f467",
      contentVariables: JSON.stringify({ 1: "Name" }),
      from: "whatsapp:+5213341610750",
      to: "whatsapp:+5214521311888",
    });
    return res.status(200).json({ message: "Message sent", message });
  } catch (error) {
    console.log("error.message --->", error);
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
