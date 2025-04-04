require("dotenv").config();
const express = require("express");
const router = express.Router();
/* COMPONENTS */
const generatePersonalityResponse = require("../../../services/chatgpt");
const generateAgentTest = require("../../../services/bot_test");
const customerController = require("../../../controller/customer.controller");
const userController = require("../../../controller/user.controller");
const Chat = require("../../../models/quicklearning/chats");
const { prospects, students2 } = require("../../../db/dataStudents");
const keywordClassification = require("../../../db/keywords");
const schoolAdmissionsAgent = require("../../../services/realstate/bot_prueba");
const { emitNewMessage } = require("../../../utils/socket-events");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

router.post("/", async (req, res) => {
  console.log("req.body --->", req.body);
  const message = await client.messages.create({
    body: req.body.message,
    from: "whatsapp:+5213341610749", // From a valid Twilio number
    to: `whatsapp:+${req.body.to}`, // Text this number
  });

  let chat = await Chat.findOne({ phone: req.body.to });
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

    if (!students2 || !Array.isArray(students2) || students2.length === 0) {
      return res.status(400).json({ message: "No se encontraron alumnos en la petición." });
    }

    // Obtener solo los primeros 300 estudiantes
    const limitedStudents = students2.slice(0, 2000);

    let results = [];
    let messagesSent = 0;


    for (let student of limitedStudents) {
      const { "Teléfono": Telefono, "Alumno": name } = student;
      // Limpiar el número de teléfono
      let cleanedPhone = Telefono.replace(/\s+/g, "").replace(/[()]/g, "").replace(/^\+1/, "");
      let phone = `whatsapp:+521${cleanedPhone}`;
      // let phone = `whatsapp:+5214521311888`
      let email = student["Correo Electrónico"];
      let celphone = `521${cleanedPhone}`
      console.log("name --->", name);
      console.log("phone --->", phone);
      console.log("email --->", email);

      if (!phone || !name) {
        results.push({ phone, name, status: "Falta teléfono o nombre" });
        continue;
      }

      // Verificar si el número de teléfono tiene 13 dígitos
      if (celphone.length !== 13) {
        console.log(`❌ Número de teléfono inválido: ${celphone}`);
        results.push({ phone, name, status: "Número de teléfono inválido" });
        continue;
      }

      // Verificar si el alumno ya existe en la base de datos
      let existingCustomer = await customerController.findOneCustom({ celphone });

      let existingChat = await Chat.findOne({ phone: celphone, "messages.body": /📢✨ ¡Aprender inglés nunca fue tan accesible! ✨📢/ });

      if (existingChat) {
        console.log(`🔍 Cliente ${phone} ya recibió el mensaje. Saltando...`);
        continue;
      }

      if (!existingCustomer) {
        // Crear un nuevo cliente si no existe
        const validateUser = await customerController.findOneCustom({ phone: celphone });
        if (!validateUser) {
          const newCustomer = {
            name,
            phone: celphone,
            comments: "Envio de chats",
            classification: "No contesta",
            status: "Sin interacción",
            visitDetails: { branch: "", date: "", time: "" },
            enrollmentDetails: {
              consecutive: "",
              course: "",
              modality: "",
              state: "",
              email: email,
              source: "",
              paymentType: student.Monto,
            },
            user: "6791778aed7b7e3736119765", // Puedes asignar un usuario si es necesario
            ia: true,
          };
          await customerController.create(newCustomer);
        }
      }

      // Enviar mensaje de WhatsApp
      try {
        const message = await client.messages.create({
          contentSid: "HX60642933d9503ad7fd2f8031f8901beb", // Content SID correcto
          //contentVariables: JSON.stringify({ 1: firstName }), // Reemplaza {{1}} con el nombre del cliente
          from: "whatsapp:+5213341610749",
          to: `${phone}`,
        });

        console.log("✅ Mensaje enviado a", phone, "con nombre:", name);
        console.log("message.sid --->", message.sid);
        results.push({ phone, name, status: "Mensaje enviado", messageSid: message.sid });
        messagesSent++;

        // Crear conversación en la base de datos
        let chat;
        try {
          chat = await Chat.findOne({ phone: celphone });
          if (!chat) {
            chat = new Chat({ phone: celphone });
          }

          chat.messages.push({
            direction: "outbound-api",
            body: `📢✨ ¡Aprender inglés nunca fue tan accesible! ✨📢

Por menos de lo que gastas en un café al día, puedes mejorar tu inglés con Quick Learning. ☕➡📚 ¡Hablas o hablas! 

🔥 Clases dinámicas y efectivas
🔥 Método rápido y comprobado
🔥 Precios accesibles

🚀 No dejes pasar esta oportunidad. ¡Inscríbete hoy y comienza a hablar inglés con confianza!

📩 Escribe "QUIERO APRENDER" y te damos toda la info`,
          });

          await chat.save();
          console.log("✅ Chat guardado para el teléfono:", celphone);
        } catch (error) {
          console.error("❌ Error al guardar el chat para el teléfono:", celphone, error);
        }
      } catch (error) {
        console.error("❌ Error al enviar mensaje a", phone, ":", error.message);
        results.push({ phone, name, status: "Error al enviar mensaje", error: error.message });
      }
    }

    return res.status(200).json({ message: "Proceso completado", total: results.length, messagesSent, results });
  } catch (error) {
    console.error("❌ Error en el endpoint:", error.message);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});

router.post("/send-message-quick-learning", async (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ message: "Falta teléfono o nombre" });
    }

    // Verificar si el número de teléfono tiene 13 dígitos
    if (phone.length !== 13) {
      return res.status(400).json({ message: "Número de teléfono inválido" });
    }

    // Verificar si el alumno ya existe en la base de datos
    let existingCustomer = await customerController.findOneCustom({ phone });
    if (!existingCustomer) {
      return res.status(400).json({ message: "El usuario no existe en la base de datos" });
    }

    // traer el primero nombre
    const firstName = name.split(" ")[0];

    const message = await client.messages.create({
      contentSid: "HXa25e27e01d0a93a41a5871e703787526", // Content SID correcto es para remotar la conversación
      contentVariables: JSON.stringify({ 1: firstName }), // Reemplaza {{1}} con el nombre del cliente
      from: "whatsapp:+5213341610749",
      to: `whatsapp:+${phone}`,
    });

    console.log("✅ Mensaje enviado a", phone, "con nombre:", name);
    console.log("message.sid --->", message.sid);

    // Crear conversación en la base de datos
    let chat;
    try {
      chat = await Chat.findOne({ phone });
      if (!chat) {
        chat = new Chat({ phone });
      }

      chat.messages.push({
        direction: "outbound-api",
        body: `Hola ${name},
Para continuar con tu proceso de inscripción a los cursos de inglés de Quick Learning 🏫, solo necesitamos confirmar algunos datos contigo:
Modalidad preferida (presencial, virtual u online)
Horario que te acomode mejor 📅
Datos de contacto (teléfono o correo) ☎️
Una vez con esa info, te podemos apartar un lugar y enviarte los detalles completos del curso 📚.
¿Te gustaría avanzar con eso esta semana?`
      });

      await chat.save();
      console.log("✅ Chat guardado para el teléfono:", phone);

      return res.status(200).json({ message: "Mensaje enviado", message });
    } catch (error) {
      console.error("❌ Error al guardar el chat para el teléfono:", phone, error);
      return res.status(500).json({ message: "Error al guardar el chat", error: error.message });
    }

  } catch (error) {
    console.log("error.message --->", error);
    return res.status(400).json({ message: error.message });
  }
});

let messageCounts = {};

router.post("/message", async (req, res) => {
  try {
    const { MessageType, MediaContentType0, MediaUrl0, WaId, ProfileName, Body, From } = req.body;
    const io = req.app.get("io");

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
        user: "6791778aed7b7e3736119765",
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
      emitNewMessage(io, { phone: WaId, direction: "inbound", body: Body });

      // Enviar respuesta al usuario
      await client.messages.create({
        body: "¡Hola! Soy NatalIA de Quick Learning. Antes de darte toda la info, dime, ¿cómo te llamas?",
        from: "whatsapp:+5213341610749",
        to: userNumber,
      });

      chat.messages.push({
        direction: "outbound-api",
        body: "¡Hola! Soy NatalIA de Quick Learning. Antes de darte toda la info, dime, ¿cómo te llamas?",
      });

      await chat.save();
      emitNewMessage(io, { phone: WaId, direction: "outbound-api", body: "¡Hola! Soy NatalIA de Quick Learning. Antes de darte toda la info, dime, ¿cómo te llamas?" });

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
    emitNewMessage(io, { phone: WaId, direction: "inbound", body: Body });



    //validación que si el usuario tiene ia en false no haga nada.
    if (!validateUser.ia) {
      console.log("El usuario no tiene activado el IA");
      return res.status(200).json({ message: "El usuario no tiene activado el IA" });
    }

    // **Identificar palabras clave para actualizar clasificación y estado**
    let newClassification = validateUser.classification;
    let newStatus = validateUser.status;

    for (const keyword in keywordClassification) {
      if (Body.toLowerCase().includes(keyword)) {
        newClassification = keywordClassification[keyword].classification;
        newStatus = keywordClassification[keyword].status;
        break; // Detenerse en la primera coincidencia
      }
    }

    // Si hay cambios en clasificación o estado, actualizarlos en la BD
    if (newClassification !== validateUser.classification || newStatus !== validateUser.status) {
      await customerController.updateOneCustom({ phone: WaId }, { classification: newClassification, status: newStatus });
      console.log(`Cliente actualizado: ${WaId} -> ${newClassification}, ${newStatus}`);
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
          WaId,
          MediaContentType0 || null, // Tipo de media, si existe
          MediaUrl0 || null // URL del media, si existe
        );

        // Enviar respuesta al usuario
        await client.messages.create({
          body: aiResponse,
          from: "whatsapp:+5213341610749", //producción
          //from: "whatsapp:+5213341610750", // DEV
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
        emitNewMessage(io, { phone: WaId, direction: "outbound-api", body: aiResponse });

        // Limpiar el registro de mensajes del usuario
        delete messageCounts[userNumber];
      }
    }, 100 /* 30000 */); // 30 segundos de inactividad

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

//Quiero traer los costos de todos los mensajes enviados
router.get("/cost-messages", async (req, res) => {
  try {
    const messages = await client.messages.list();

    let filteredMessages = messages.map((message) => {
      return {
        sid: message.sid,
        direction: message.direction,
        from: message.from,
        to: message.to,
        body: message.body,
        dateCreated: message.dateCreated,
        price: message.price,
      };
    });

    // Filtrar mensajes con precio válido (no null)
    let validMessages = filteredMessages.filter((message) => message.price !== null);

    // Sumar los costos de los mensajes enviados
    let totalCost = validMessages.reduce((acc, message) => {
      return acc + parseFloat(message.price);
    }, 0);

    return res.status(200).json({ total: totalCost, filteredMessagesTotal: filteredMessages.length, filteredMessages: validMessages });
  } catch (error) {
    console.error("Error al obtener los costos de los mensajes:", error.message);
    return res.status(500).json({ message: "Error al obtener los costos de los mensajes." });
  }
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
    const { MessageType, MediaContentType0, MediaUrl0, WaId, ProfileName, Body, From } = req.body;

    console.log("req.body --->", req.body);

    const userNumber = From;

    // Verificar si el usuario ya existe en la base de datos
    const validateUser = await customerController.findOneCustom({ phone: WaId });
    if (!validateUser) {
      /*       const getUsers = await userController.findAll();
            const agentIndex = Math.floor(Math.random() * getUsers.length);
            const agent = getUsers[agentIndex]; */

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
        user: "67b4caab848c32b1ca4ee89b",
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
        body: "¡Hola! Soy ClauIA de Colegio Ker Liber, encantada de ayudarte. ¿Cómo te llamas?",
        from: "whatsapp:+14155238886",
        to: userNumber,
      });

      /* Aqui agregar un manejador de errores. */

      chat.messages.push({
        direction: "outbound-api",
        body: "¡Hola! Soy ClauIA de Colegio Ker Liber, encantada de ayudarte. ¿Cómo te llamas?",
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

    // **Identificar palabras clave para actualizar clasificación y estado**
    let newClassification = validateUser.classification;
    let newStatus = validateUser.status;

    for (const keyword in keywordClassification) {
      if (Body.toLowerCase().includes(keyword)) {
        newClassification = keywordClassification[keyword].classification;
        newStatus = keywordClassification[keyword].status;
        break; // Detenerse en la primera coincidencia
      }
    }

    // Si hay cambios en clasificación o estado, actualizarlos en la BD
    if (newClassification !== validateUser.classification || newStatus !== validateUser.status) {
      await customerController.updateOneCustom({ phone: WaId }, { classification: newClassification, status: newStatus });
      console.log(`Cliente actualizado: ${WaId} -> ${newClassification}, ${newStatus}`);
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
        const aiResponse = await schoolAdmissionsAgent(
          combinedMessage, // Mensaje combinado
          userNumber, // Número del usuario
          MediaContentType0 || null, // Tipo de media, si existe
          MediaUrl0 || null // URL del media, si existe
        );

        // Enviar respuesta al usuario
        await client.messages.create({
          body: aiResponse,
          from: "whatsapp:+14155238886",
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
    }, 100); // 30 segundos de inactividad

    // Responder al webhook de Twilio
    res.status(200).json({ message: "Mensaje recibido y consolidando respuestas." });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(400).json({ message: error.message });
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

router.get("/update-users-classification", async (req, res) => {
  try {
    const users = await customerController.getAllCustom(); // Obtener todos los usuarios
    let updatedCount = 0;
    let noMessagesCount = 0;
    let noMessagesNumbers = [];
    let inactiveCount = 0;
    let inactiveNumbers = [];

    const now = new Date(); // Hora actual

    for (let user of users) {
      let chat = await Chat.findOne({ phone: user.phone });
      if (!chat || !chat.messages.length) {
        noMessagesCount++;
        noMessagesNumbers.push(user.phone);
        continue; // Si no tiene chat o mensajes, omitir
      }

      let lastMessage = chat.messages[chat.messages.length - 1];
      let lastMessageText = lastMessage.body.toLowerCase();
      let lastMessageTime = new Date(lastMessage.dateCreated); // Convertir timestamp

      let newClassification = user.classification;
      let newStatus = user.status;

      // Verificar si el último mensaje tiene más de 8 horas
      const hoursSinceLastMessage = (now - lastMessageTime) / (1000 * 60 * 60);
      if (hoursSinceLastMessage > 8) {
        newClassification = "No contesta";
        newStatus = "Sin interacción";
        inactiveCount++;
        inactiveNumbers.push(user.phone);
      } else {
        // Analizar palabras clave en el último mensaje
        for (const keyword in keywordClassification) {
          if (lastMessageText.includes(keyword)) {
            newClassification = keywordClassification[keyword].classification;
            newStatus = keywordClassification[keyword].status;
            break; // Tomar la primera coincidencia
          }
        }
      }

      // Si hay cambios en la clasificación o el estado, actualizar en la BD
      if (newClassification !== user.classification || newStatus !== user.status) {
        await customerController.updateOneCustom(
          { phone: user.phone },
          { classification: newClassification, status: newStatus }
        );
        console.log(`Actualizado: ${user.phone} -> ${newClassification}, ${newStatus}`);
        updatedCount++;
      }
    }

    res.status(200).json({
      message: "Usuarios actualizados exitosamente",
      totalClientes: users.length,
      clientesActualizados: updatedCount,
      clientesSinMensajes: noMessagesCount,
      numerosSinMensajes: noMessagesNumbers,
      clientesInactivos: inactiveCount,
      numerosInactivos: inactiveNumbers
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Error al actualizar usuarios", error: error.message });
  }
});



module.exports = router;
