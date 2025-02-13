const { Router } = require("express");
const router = Router();
const excel = require("exceljs");
const customerController = require("../../../controller/quicklearning/customer.controller");
const { MESSAGE_RESPONSE_CODE, MESSAGE_RESPONSE } = require("../../../lib/constans");
const { default: axios } = require("axios");
const OpenAI = require("openai");
const moment = require("moment");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Tu API Key de OpenAI
});

/* Show all clients */
router.get("/list", async (req, res) => {
  try {
    const result = await customerController.getAllCustom();
    res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, total: result.length, customers: result });
  } catch (error) {
    res.json({
      code: MESSAGE_RESPONSE_CODE.BAD_REQUEST,
      message: MESSAGE_RESPONSE.BAD_REQUEST,
    });
  }
});

/* EP to create a client */
router.post("/add", async (req, res) => {
  try {
    const result = await customerController.create(req.body);
    res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, customer: result });
  } catch (error) {
    res.json({
      code: MESSAGE_RESPONSE_CODE.ERROR,
      message: MESSAGE_RESPONSE.ERROR,
    });
  }
});

/* EP to update a client */
router.put("/updatecustomer", async (req, res) => {
  try {
    const { name, phone, comments, classification, status, visitDetails, enrollmentDetails, ia, user } = req.body;

    const customerData = await customerController.updateOneCustom(
      { phone: phone },
      {
        name: name,
        phone: phone,
        comments: comments,
        classification: classification,
        status: status,
        visitDetails: visitDetails,
        enrollmentDetails: enrollmentDetails,
        ia: ia,
        user: user,
      }
    );
    if (!customerData) {
      return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: "Customer not found" });
    }
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: "Customer updated", customerData });
  } catch (error) {
    res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
    console.log(error.message);
  }
});

/* EP to download excel from clients. */
router.get("/downloadfile", async (req, res) => {
  try {
    const customers = await customerController.getAllCustom();
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Customers");

    worksheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 30 },
      { header: "WhatsApp Profile", key: "whatsAppProfile", width: 30 },
      { header: "WhatsApp Number", key: "whatsAppNumber", width: 30 },
      { header: "IA", key: "ia", width: 30 },
      { header: "Social", key: "social", width: 30 },
      { header: "Country", key: "country", width: 30 },
      { header: "Status", key: "status", width: 30 },
    ];

    // Apply styles to headers
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF008CFF" },
      };
      cell.font = {
        color: { argb: "FFFFFFFF" },
        bold: true,
        size: 12,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF008CFF" } },
        left: { style: "thin", color: { argb: "FF008CFF" } },
        bottom: { style: "thin", color: { argb: "FF008CFF" } },
        right: { style: "thin", color: { argb: "FF008CFF" } },
      };
    });

    customers.forEach((customer) => {
      worksheet.addRow(customer);
    });
    const fileName = "customers.xlsx";
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
    return workbook.xlsx.write(res).then(function () {
      res.end();
    });
  } catch (error) {
    console.log(error);
  }
});

/* EP para agregar muchos clientes */
router.post("/addmany", async (req, res) => {
  console.log("entra aqui");
  try {
    const customers = req.body;
    let data = [];
    customers.forEach((customer) => {
      console.log("customer", customer);
      data.push({
        name: customer.name,
        phone: customer.phone,
        comments: customer.comments ? customer.comments : "",
        classification: "Prospecto",
        status: "Segunda llamada",
        visitDetails: {
          branch: customer.visitDetails?.branch ? customer.visitDetails.branch : "",
          date: customer.visitDetails?.date ? customer.visitDetails.date : "",
          time: customer.visitDetails?.time ? customer.visitDetails.time : "",
        },
        enrollmentDetails: {
          consecutive: customer.enrollmentDetails?.consecutive ? customer.enrollmentDetails.consecutive : "",
          course: customer.enrollmentDetails?.course ? customer.enrollmentDetails.course : "",
          modality: customer.enrollmentDetails?.modality ? customer.enrollmentDetails.modality : "",
          state: customer.enrollmentDetails?.state ? customer.enrollmentDetails.state : "",
          email: customer.enrollmentDetails?.email ? customer.enrollmentDetails.email : "",
          source: customer.enrollmentDetails?.source ? customer.enrollmentDetails.source : "",
          paymentType: customer.enrollmentDetails?.paymentType ? customer.enrollmentDetails.paymentType : "",
        },
        ia: true,
        user: customer.agent ? customer.agent : "676d66af22932ac7c09d787f",
      });
    });

    console.log("data to insert", data); // Verifica los datos antes de insertarlos

    const result = await customerController.createMany(data);
    console.log("result", result);
    res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, customers: result });
  } catch (error) {
    console.log("error", error); // Agrega un log para el error
    res.json({
      code: MESSAGE_RESPONSE_CODE.ERROR,
      message: MESSAGE_RESPONSE.ERROR,
    });
  }
});

// 🚀 EP para cargar conversaciones con análisis más expresivo
router.get("/loadconversations", async (req, res) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const customers = await customerController.getAllCustom();
    let totalCustomers = customers.length;
    let abandonedConversations = 0;

    console.log(`🔍 Iniciando análisis de ${totalCustomers} clientes...\n`);

    for (let i = 0; i < totalCustomers; i++) {
      let customer = customers[i];
      let number = customer.phone;
      let comments = [];

      console.log(`📨 Procesando cliente ${i + 1}/${totalCustomers} - Teléfono: ${number}`);

      // Obtener historial de mensajes
      let numberData = JSON.stringify({ to: `whatsapp:+${number}` });
      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "http://localhost:3000/api/v2/whastapp/logs-messages",
        headers: { "Content-Type": "application/json" },
        data: numberData,
      };

      const response = await axios.request(config).catch((error) => {
        console.error(`⚠️ Error al obtener mensajes de ${number}:`, error.message);
        return { data: { findMessages: [] } };
      });

      const messages = response.data.findMessages.reverse();
      if (messages.length === 0) {
        console.log(`⚠️ No hay mensajes para el cliente ${number}`);
        comments.push("No hubo interacción. El cliente nunca contestó.");
        continue;
      }

      // 🔍 Análisis de la conversación
      let lastAgentMessage = null;
      let lastUserMessage = null;
      let firstMessageDate = new Date(messages[0].dateCreated);
      let lastMessageDate = new Date(messages[messages.length - 1].dateCreated);
      let elapsedTime = (lastMessageDate - firstMessageDate) / 1000 / 60; // en minutos

      let summary = "";
      let stoppedAfterMessage = null;

      for (let j = messages.length - 1; j >= 0; j--) {
        let msg = messages[j];

        if (msg.direction === "inbound" && !lastUserMessage) {
          lastUserMessage = msg;
        } else if (msg.direction === "outbound-api" && lastUserMessage) {
          lastAgentMessage = msg;
          if (new Date(lastUserMessage.dateCreated) < new Date(lastAgentMessage.dateCreated)) {
            stoppedAfterMessage = lastAgentMessage.body;
            abandonedConversations++;
          }
          break;
        }
      }

      // 📌 Generación de respuesta más natural y expresiva
      if (stoppedAfterMessage) {
        if (/(\$|\bprecio\b|\binversión\b)/i.test(stoppedAfterMessage)) {
          summary = "El cliente estaba interesado, pero cuando escuchó el precio, se esfumó.";
        } else if (/(\bdescuento\b|\bpromoción\b)/i.test(stoppedAfterMessage)) {
          summary = "Le interesaban los descuentos, pero nunca volvió para aprovecharlos.";
        } else if (/(\bhorario\b|\bdisponibilidad\b)/i.test(stoppedAfterMessage)) {
          summary = "Preguntó por los horarios, pero luego se perdió en el tiempo.";
        } else {
          summary = `La conversación iba bien, pero después de este mensaje, desapareció: "${stoppedAfterMessage}".`;
        }
      } else if (elapsedTime > 1440) {
        summary = "No hay actividad reciente. Tal vez es momento de un recordatorio amigable.";
      } else if (messages.length > 5) {
        summary = "Hablamos bastante, pero cuando llegó el momento de decidir, dejó de responder.";
      } else {
        summary = "Pidió información, pero después de nuestro primer mensaje, dejó el chat en visto.";
      }

      // 🔥 OpenAI solo si el resumen no es claro
      if (messages.length > 2 && stoppedAfterMessage && !summary.includes("No contestó")) {
        let context = messages.slice(-6).map(m => `${m.direction === "inbound" ? "Cliente" : "Asesor"}: ${m.body}`).join("\n");

        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: "Resuma la conversación en una frase expresiva y natural, indicando qué pasó." },
            { role: "user", content: context },
          ],
        });

        summary = aiResponse.choices[0].message.content.trim();
      }

      comments.push(summary);

      // 📝 Guardar comentario en la base de datos
      customer.comments = comments.join(" ");
      await customerController.updateOneCustom({ _id: customer._id }, { comments: customer.comments });

      console.log(`✅ Resumen generado para ${number}: ${summary}\n`);
      console.log(`📌 Cliente ${number} actualizado en la base de datos con comentario.\n`);

      // 📢 Enviar progreso en tiempo real
      let progress = Math.round(((i + 1) / totalCustomers) * 100);
      res.write(`data: {"progress": ${progress}, "current": ${i + 1}, "total": ${totalCustomers}}\n\n`);
    }

    // 📊 Enviar estadística final
    res.write(`data: {"message": "Análisis completado.", "totalCustomers": ${totalCustomers}, "abandonedConversations": ${abandonedConversations}}\n\n`);
    res.end();

    console.log("\n🎯 Análisis finalizado.\n");
    console.log(`📊 Total de clientes analizados: ${totalCustomers}`);
    console.log(`❌ Conversaciones abandonadas: ${abandonedConversations}`);

  } catch (error) {
    console.error("❌ Error al analizar conversaciones:", error);
    res.write(`data: {"error": "Error en el análisis de conversaciones."}\n\n`);
    res.end();
  }
});

router.get("/analyze-undecided-clients", async (req, res) => {
  try {
    // Configurar headers para enviar información en tiempo real (EventStream)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // 1️⃣ Obtener todos los clientes
    const customers = await customerController.getAllCustom();
    let totalCustomers = customers.length;

    console.log(`🔍 Analizando ${totalCustomers} clientes...\n`);

    for (let i = 0; i < totalCustomers; i++) {
      let customer = customers[i];
      let number = customer.phone;
      let comments = customer.comments || ""; // Mantener comentarios anteriores

      console.log(`📨 Analizando cliente ${i + 1}/${totalCustomers} - Teléfono: ${number}`);

      // 2️⃣ Obtener historial de mensajes del cliente desde la API de WhatsApp
      let numberData = JSON.stringify({ to: `whatsapp:+${number}` });
      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "http://localhost:3000/api/v2/whastapp/logs-messages",
        headers: { "Content-Type": "application/json" },
        data: numberData,
      };

      const response = await axios.request(config).catch((error) => {
        console.error(`⚠️ Error al obtener mensajes de ${number}:`, error.message);
        return { data: { findMessages: [] } };
      });

      const messages = response.data.findMessages.reverse();
      if (messages.length === 0) {
        console.log(`⚠️ No hay mensajes para el cliente ${number}`);
        comments += "\n🔍 No se encontraron mensajes para analizar.";
        continue;
      }

      // 3️⃣ Verificar el tiempo desde el último mensaje
      let lastMessageDate = moment(messages[messages.length - 1].dateCreated);
      console.log("lastMessageDate", lastMessageDate);
      let now = moment();
      let hoursSinceLastMessage = now.diff(lastMessageDate, "hours");
      console.log("hoursSinceLastMessage", hoursSinceLastMessage);

      let classification = "";
      let summary = "";

      // Si el cliente no ha respondido en más de 8 horas, se marca como "Llamada sin respuesta"
      if (hoursSinceLastMessage > 8) {
        classification = "Llamada sin respuesta";
        summary = "El cliente no ha respondido en más de 8 horas.";
      } else {
        // 4️⃣ Generar contexto para OpenAI con los últimos 10 mensajes
        let context = messages
          .slice(-10)
          .map((m) => `${m.direction === "inbound" ? "Cliente" : "Asesor"}: ${m.body}`)
          .join("\n");

        try {
          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content:
                  "Analiza la conversación y asigna una de estas categorías: 'En revisión', 'En seguimiento', 'Llamada sin respuesta' o 'No prospecto'. Luego, da un breve resumen en menos de 20 palabras.",
              },
              { role: "user", content: context },
            ],
          });

          let aiText = aiResponse.choices[0].message.content.trim();

          summary = aiText

        } catch (error) {
          console.error(`⚠️ Error en OpenAI para ${number}:`, error.message);
        }
      }

      // 5️⃣ Formatear comentario correctamente
      let formattedComment = `📌 Clasificación AI: ${classification} - ${summary}`;

      comments += `\n${formattedComment}`; // Agregar comentario sin sobrescribir los anteriores

      // 6️⃣ Guardar el comentario en la base de datos
      await customerController.updateOneCustom({ _id: customer._id }, { comments: formattedComment });

      console.log(`✅ Cliente ${number} clasificado como: ${classification}`);
      console.log(`📌 Resumen: ${summary}\n`);

      // 7️⃣ Enviar progreso en tiempo real
      let progress = Math.round(((i + 1) / totalCustomers) * 100);
      res.write(`data: {"progress": ${progress}, "current": ${i + 1}, "total": ${totalCustomers}}\n\n`);
    }

    // 📊 Enviar estadística final
    res.write(`data: {"message": "Análisis completado.", "totalCustomers": ${totalCustomers}}\n\n`);
    res.end();

    console.log("\n🎯 Análisis finalizado.\n");
    console.log(`📊 Total de clientes analizados: ${totalCustomers}`);

  } catch (error) {
    console.error("❌ Error al analizar conversaciones:", error);
    res.write(`data: {"error": "Error en el análisis de conversaciones."}\n\n`);
    res.end();
  }
});

router.get("/comments-summary", async (req, res) => {
  try {
    // 1️⃣ Obtener todos los clientes
    const customers = await customerController.getAllCustom();

    // 2️⃣ Inicializar contadores de cada categoría
    let summary = {
      "En revisión": 0,
      "En seguimiento": 0,
      "Llamada sin respuesta": 0,
      "No prospecto": 0,
      "Total general": customers.length
    };

    // 3️⃣ Clasificación según los comentarios
    customers.forEach((customer) => {
      let comment = customer.comments ? customer.comments.toLowerCase() : "";

      if (/revisión|pendiente/i.test(comment)) {
        summary["En revisión"]++;
      } else if (/seguimiento|interesado/i.test(comment)) {
        summary["En seguimiento"]++;
      } else if (/no contestó|sin respuesta/i.test(comment)) {
        summary["Llamada sin respuesta"]++;
      } else if (/no prospecto|no interesado/i.test(comment)) {
        summary["No prospecto"]++;
      }
    });

    // 4️⃣ Calcular porcentajes
    let total = summary["Total general"];
    let result = Object.keys(summary).map((key) => ({
      estatus: key,
      cantidad: summary[key],
      porcentaje: key !== "Total general" ? `${Math.round((summary[key] / total) * 100)}%` : ""
    }));

    console.log("📊 Resumen generado:", result);

    // 5️⃣ Enviar respuesta en JSON
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error al generar el resumen:", error);
    res.status(500).json({ error: "Error al generar el resumen de comentarios." });
  }
});


/* EP details client with id */
router.get("/details/:id", async (req, res) => {
  try {
    const customer = await customerController.getByIDCustom({ _id: req.params.id });
    if (!customer) {
      return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: "Customer not found" });
    }
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: "Customer found", customer });
  } catch (error) {
    console.log(error);
  }
});

/* EP Update Customer */
router.put("/update/:id", async (req, res) => {
  try {
    const customer = await customerController.updateOneCustom(
      { _id: req.params.id },
      {
        name: req.body.name,
        phone: req.body.phone,
        comments: req.body.comments,
        classification: req.body.classification,
        status: req.body.status,
        visitDetails: req.body.visitDetails,
        enrollmentDetails: req.body.enrollmentDetails,
        ia: req.body.ia,
        user: req.body.user,
      }
    );
    if (!customer) {
      return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: "Customer not found" });
    }
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: "Customer updated", customer });
  } catch (error) {
    console.log(error);
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

module.exports = router;
