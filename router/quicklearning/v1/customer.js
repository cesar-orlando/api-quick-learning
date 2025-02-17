const { Router } = require("express");
const router = Router();
const excel = require("exceljs");
const customerController = require("../../../controller/quicklearning/customer.controller");
const { MESSAGE_RESPONSE_CODE, MESSAGE_RESPONSE } = require("../../../lib/constans");
const { default: axios } = require("axios");
const OpenAI = require("openai");
const moment = require("moment");
const Chat = require("../../../models/quicklearning/chats");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Tu API Key de OpenAI
});

/* Show all clients */
router.get("/list", async (req, res) => {
  try {
    // Obtener todos los clientes
    const customers = await customerController.getAllCustom();

    // Obtener todos los chats
    const chats = await Chat.find();

    // Cruzar los clientes con sus conversaciones
    const customersWithConversations = customers.map(customer => {
      const chat = chats.find(c => c.phone === customer.phone);
      return { ...customer.toObject(), messages: chat ? chat.messages : [] };
    });

    res.status(200).json({ 
      message: "Full customer list with conversations", 
      total: customersWithConversations.length, 
      customers: customersWithConversations 
    });

  } catch (error) {
    console.error("❌ Error al obtener la lista completa de clientes:", error);
    res.status(500).json({ message: "Error al obtener la lista de clientes." });
  }
});

router.get("/customers/last-message", async (req, res) => {
  try {
      // Obtener todos los chats
      const chats = await Chat.find();

      // Filtrar y obtener el último mensaje INBOUND de cada chat
      const lastMessages = chats.map(chat => {
          const lastInboundMessage = chat.messages
              .filter(msg => msg.direction === "inbound" || "outbound-api") // Solo considerar mensajes entrantes del cliente
              .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))[0]; // Obtener el más reciente

          return lastInboundMessage ? { phone: chat.phone, lastMessage: lastInboundMessage } : null;
      }).filter(Boolean); // Filtrar valores nulos

      // Ordenar los clientes por la fecha del último mensaje inbound (más reciente primero)
      lastMessages.sort((a, b) => new Date(b.lastMessage.dateCreated) - new Date(a.lastMessage.dateCreated));

      // Obtener los clientes asociados a esos números de teléfono
      const customers = await customerController.getAllCustom();
      const customersByLastMessage = lastMessages.map(chat => {
          const customer = customers.find(c => c.phone === chat.phone);
          return customer ? { ...customer.toObject(), lastMessage: chat.lastMessage } : null;
      }).filter(Boolean); // Filtrar nulos

      res.status(200).json({ message: "Customers ordered by last inbound message", customers: customersByLastMessage });

  } catch (error) {
      console.error("❌ Error al obtener clientes por último mensaje:", error);
      res.status(500).json({ message: "Error al obtener clientes." });
  }
});

/* Traer todos los clientes que estan en null y actualizarlos por el id de un usuario */
router.put("/updatecustomers", async (req, res) => {
  try {
    const customers = await customerController.getAllCustom();
    let updatedCount = 0;

    for (let customer of customers) {
      if (customer.user === null) {
        await customerController.updateOneCustom({ _id: customer._id }, { user: "6791798ced7b7e373611976b" });
        updatedCount++;
        console.log(`✅ Cliente actualizado: ${customer.phone}`);
      }
    }

    return res.status(200).json({ message: "Clientes actualizados", updatedCount });
  } catch (error) {
    console.error("❌ Error al actualizar clientes:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }});


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

router.get("/fast-loadconversations", async (req, res) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const customers = await customerController.getAllCustom();
    let totalCustomers = customers.length;
    let abandonedConversations = 0;
    let updatedCount = 0;

    console.log(`\n🚀 Iniciando análisis rápido de ${totalCustomers} clientes...\n`);

    let phones = customers.map(c => c.phone);
    let chats = await Chat.find({ phone: { $in: phones } });
    let chatMap = new Map(chats.map(chat => [chat.phone, chat]));

    let updateOperations = customers.map(async (customer, index) => {
      let number = customer.phone;
      let chat = chatMap.get(number);
      let comments = [];

      console.log(`\n📌 [${index + 1}/${totalCustomers}] Analizando cliente: ${number}`);

      if (!chat || !chat.messages.length) {
        console.log(`⚠️ Cliente ${number} no tiene mensajes.`);
        comments.push("No hubo interacción. El cliente nunca contestó.");
        return {
          updateOne: {
            filter: { _id: customer._id },
            update: { classification: "No contesta", status: "Sin interacción", comments: comments.join(" ") }
          }
        };
      }

      const messages = chat.messages.slice(-5).reverse(); // Últimos 5 mensajes
      let lastMessage = messages.find(m => m.direction === "inbound") || null;
      let lastMessageDate = lastMessage ? new Date(lastMessage.timestamp) : null;
      let now = new Date();
      let hoursSinceLastMessage = lastMessageDate ? (now - lastMessageDate) / (1000 * 60 * 60) : null;

      // 📌 🚀 Si la conversación tiene menos de 3 mensajes, es "Prospecto - En conversación"
      if (messages.length < 3) {
        console.log(`🟡 Cliente ${number} tiene menos de 3 mensajes. Clasificando como 'Prospecto - En conversación'.`);
        comments.push(`Última interacción: "${lastMessage ? lastMessage.body : 'Sin mensajes recientes'}"`);
        return {
          updateOne: {
            filter: { _id: customer._id },
            update: { classification: "Prospecto", status: "En conversación", comments: comments.join(" ") }
          }
        };
      }

      // 📌 🔥 Detectar "Listo para venta"
      const readyForSaleKeywords = [
        "quiero inscribirme", "dónde me registro", "voy a ir", "pasaré a la sede", "estoy interesado en pagar"
      ];
      let isReadyForSale = lastMessage && readyForSaleKeywords.some(p => lastMessage.body.toLowerCase().includes(p));

      if (isReadyForSale) {
        console.log(`🟢 Cliente ${number} mostró intención fuerte de compra. Clasificando como 'Prospecto - Listo para venta'.`);
        comments.push(`Última interacción: "${lastMessage ? lastMessage.body : 'Sin mensajes recientes'}"`);
        return {
          updateOne: {
            filter: { _id: customer._id },
            update: { classification: "Prospecto", status: "Listo para venta", comments: comments.join(" ") }
          }
        };
      }

      // 📌 🔄 Si el cliente hace preguntas sobre costos, promociones, cursos, se clasifica como "Prospecto - En conversación"
      const interestKeywords = ["costo", "precio", "horarios", "modalidad", "curso", "promoción", "duración"];
      let isInterested = lastMessage && interestKeywords.some(p => lastMessage.body.toLowerCase().includes(p));

      if (isInterested) {
        console.log(`🟡 Cliente ${number} está interesado. Clasificando como 'Prospecto - En conversación'.`);
        comments.push(`Última interacción: "${lastMessage ? lastMessage.body : 'Sin mensajes recientes'}"`);
        return {
          updateOne: {
            filter: { _id: customer._id },
            update: { classification: "Prospecto", status: "En conversación", comments: comments.join(" ") }
          }
        };
      }

      // 📌 ⏳ FILTRO ANTES DE "NO CONTESTA"
      if (hoursSinceLastMessage > 24) {
        console.log(`⏳ Cliente ${number} lleva más de 24 horas sin responder.`);

        // 🔵 Si el cliente estaba en "Listo para venta", lo mantenemos ahí
        if (customer.status === "Listo para venta") {
          console.log(`🔵 Cliente ${number} ya estaba en 'Listo para venta', manteniendo el estado.`);
          return {
            updateOne: {
              filter: { _id: customer._id },
              update: { classification: "Prospecto", status: "Listo para venta", comments: "Última interacción antes de pausa: " + (lastMessage ? lastMessage.body : "Sin mensajes recientes") }
            }
          };
        } else {
          console.log(`❌ Cliente ${number} no ha respondido, marcándolo como 'No contesta - Sin interacción'.`);
          abandonedConversations++;
          return {
            updateOne: {
              filter: { _id: customer._id },
              update: { classification: "No contesta", status: "Sin interacción", comments: "Último mensaje sin respuesta: " + (lastMessage ? lastMessage.body : "Sin mensajes recientes") }
            }
          };
        }
      }

      console.log(`✅ Cliente ${number} clasificado como: Prospecto, Estado: En conversación`);
      comments.push(`Última interacción: "${lastMessage ? lastMessage.body : 'Sin mensajes recientes'}"`);

      updatedCount++;

      return {
        updateOne: {
          filter: { _id: customer._id },
          update: { classification: "Prospecto", status: "En conversación", comments: comments.join(" ") }
        }
      };
    });

    let bulkOperations = (await Promise.all(updateOperations)).filter(op => op !== null);
    if (bulkOperations.length > 0) {
      console.log(`💾 Guardando ${bulkOperations.length} actualizaciones en la base de datos...`);
      await customerController.bulkWrite(bulkOperations);
    }

    console.log("\n🎯 Análisis finalizado.\n");
    console.log(`📊 Total de clientes analizados: ${totalCustomers}`);
    console.log(`✅ Clientes actualizados: ${updatedCount}`);
    console.log(`❌ Conversaciones abandonadas: ${abandonedConversations}`);

    res.write(
      `data: {"message": "Análisis completado.", "totalCustomers": ${totalCustomers}, "clientesActualizados": ${updatedCount}, "abandonedConversations": ${abandonedConversations}}\n\n`
    );
    res.end();

  } catch (error) {
    console.error("❌ Error al analizar conversaciones:", error);
    res.write(`data: {"error": "Error en el análisis de conversaciones."}\n\n`);
    res.end();
  }
});

router.get("/count-classifications-status", async (req, res) => {
  try {
    console.log("📊 Iniciando conteo de clasificaciones y estados...");

    // Obtener todos los clientes
    const customers = await customerController.getAllCustom();

    let classificationCounts = {};
    let statusCounts = {};
    let totalCustomers = customers.length;

    // Función para limpiar y unificar nombres de clasificación y estado
    const normalize = (text) => {
      if (!text) return "Sin clasificación específica";
      return text
        .replace(/[\[\]'`"]/g, "") // Quitar corchetes, comillas simples, invertidas y dobles
        .replace(/\*\*?/g, "") // Quitar asteriscos
        .replace(/,$/, "") // Quitar comas al final
        .trim() // Eliminar espacios extra
        .replace(/\s{2,}/g, " ") // Reemplazar múltiples espacios con uno solo
        .replace(/No contesta, Sin interacción/, "Sin interacción"); // Unificar estados combinados
    };

    // Contar clasificaciones y estados normalizados
    customers.forEach(customer => {
      let cleanClassification = normalize(customer.classification);
      let cleanStatus = normalize(customer.status);

      classificationCounts[cleanClassification] = (classificationCounts[cleanClassification] || 0) + 1;
      statusCounts[cleanStatus] = (statusCounts[cleanStatus] || 0) + 1;
    });

    console.log("✅ Conteo completado.");
    console.log("📌 Resumen de clasificaciones:", classificationCounts);
    console.log("📌 Resumen de estados:", statusCounts);

    res.status(200).json({
      message: "Conteo de clientes completado.",
      totalCustomers,
      classificationCounts,
      statusCounts
    });
  } catch (error) {
    console.error("❌ Error al contar clientes:", error);
    res.status(500).json({ message: "Error al contar clientes", error: error.message });
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

router.put("/fix-phone-numbers", async (req, res) => {
  try {
    const customers = await customerController.getAllCustom(); // Obtiene todos los clientes

    let updatedCount = 0;

    for (let customer of customers) {
      if (customer.phone.startsWith("whatsapp:+")) {
        let cleanPhone = customer.phone.replace("whatsapp:+", ""); // Elimina el prefijo

        // Actualizar el número en la base de datos
        await customerController.updateOneCustom({ _id: customer._id }, { phone: cleanPhone });
        updatedCount++;
        console.log(`✅ Número corregido: ${cleanPhone}`);
      }
    }

    return res.status(200).json({
      message: "Corrección de números completada",
      updatedCount: updatedCount,
    });
  } catch (error) {
    console.error("❌ Error al corregir números:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});

/* borrame los repetidos */
router.put("/delete-repeated", async (req, res) => {
  try {
    const customers = await customerController.getAllCustom();
    let updatedCount = 0;

    // Crear un mapa para agrupar clientes por número de teléfono
    const phoneMap = new Map();

    for (let customer of customers) {
      if (phoneMap.has(customer.phone)) {
        // Si el número de teléfono ya existe en el mapa, eliminar el cliente duplicado
        await customerController.deleteOneCustom({ _id: customer._id });
        updatedCount++;
        console.log(`✅ Cliente eliminado: ${customer.phone}`);
      } else {
        // Si el número de teléfono no existe en el mapa, agregarlo
        phoneMap.set(customer.phone, customer);
      }
    }

    return res.status(200).json({
      message: "Clientes eliminados",
      updatedCount: updatedCount,
    });
  } catch (error) {
    console.error("❌ Error al eliminar clientes:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});
/* Todos los que tengan en commets Renovación de membresía activa el ia a true por favor */
router.put("/update-ia", async (req, res) => {
  try {
    const customers = await customerController.getAllCustom();
    let updatedCount = 0;

    for (let customer of customers) {
      if (customer.comments.includes("Renovación de membresía")) {
        await customerController.updateOneCustom({ _id: customer._id }, { ia: true });
        updatedCount++;
        console.log(`✅ Cliente actualizado: ${customer.phone}`);
      }
    }

    return res.status(200).json({
      message: "Clientes actualizados",
      updatedCount: updatedCount,
    });
  } catch (error) {
    console.error("❌ Error al actualizar clientes:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});

/* Traer customers por el id del user */
router.get("/customersbyuser/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const customers = await customerController.getAllCustom();
    const customersByUser = customers.filter((customer) => customer.user == id);
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: "Customers by user", customersByUser });
  } catch (error) {
    console.log(error);
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

router.get("/customers/last-message/:userId", async (req, res) => {
  try {
      const { userId } = req.params;

      console.log("userId", userId);

      // Obtener todos los chats
      const chats = await Chat.find();

      // Filtrar y obtener el último mensaje INBOUND de cada chat
      const lastMessages = chats.map(chat => {
          const lastInboundMessage = chat.messages
              .filter(msg => msg.direction === "inbound" || "outbound-api" ) // Solo considerar mensajes entrantes del cliente
              .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))[0]; // Obtener el más reciente

          return lastInboundMessage ? { phone: chat.phone, lastMessage: lastInboundMessage } : null;
      }).filter(Boolean); // Filtrar valores nulos

      // Ordenar los mensajes de más reciente a más antiguo
      lastMessages.sort((a, b) => new Date(b.lastMessage.dateCreated) - new Date(a.lastMessage.dateCreated));

      // Obtener los clientes asociados al usuario específico
      const customers = await customerController.getAllCustom();
      const customersByUser = customers.filter(c => c.user == userId); // Filtrar solo los clientes de ese usuario

      // Filtrar solo los clientes que tienen un último mensaje inbound
      const customersByLastMessage = lastMessages.map(chat => {
          const customer = customersByUser.find(c => c.phone === chat.phone);
          return customer ? { ...customer.toObject(), lastMessage: chat.lastMessage } : null;
      }).filter(Boolean); // Filtrar nulos

      res.status(200).json({ message: "Customers ordered by last inbound message", total:customersByLastMessage.length , customers: customersByLastMessage });

  } catch (error) {
      console.error("❌ Error al obtener clientes por último mensaje:", error);
      res.status(500).json({ message: "Error al obtener clientes." });
  }
});

router.get("/customers/conversations/:userId", async (req, res) => {
  try {
      const { userId } = req.params;

      console.log("userId", userId);

      // Obtener todos los chats
      const chats = await Chat.find();

      // Obtener los clientes asociados al usuario específico
      const customers = await customerController.getAllCustom();
      const customersByUser = customers.filter(c => c.user == userId); // Filtrar solo los clientes de ese usuario

      // Cruzar los clientes con sus conversaciones (todos los mensajes)
      const customersWithConversations = customersByUser.map(customer => {
          const chat = chats.find(c => c.phone === customer.phone);
          return chat ? { ...customer.toObject(), messages: chat.messages } : null;
      }).filter(Boolean); // Filtrar nulos

      res.status(200).json({ 
          message: "Customers with full conversation history", 
          total: customersWithConversations.length, 
          customers: customersWithConversations 
      });

  } catch (error) {
      console.error("❌ Error al obtener conversaciones de los clientes:", error);
      res.status(500).json({ message: "Error al obtener las conversaciones." });
  }
});



module.exports = router;
