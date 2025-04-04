const { Router } = require("express");
const router = Router();
const excel = require("exceljs");
const customerController = require("../../../controller/quicklearning/customer.controller");
const { MESSAGE_RESPONSE_CODE, MESSAGE_RESPONSE } = require("../../../lib/constans");
const { default: axios } = require("axios");
const OpenAI = require("openai");
const moment = require("moment");
const Chat = require("../../../models/quicklearning/chats");
const keywordClassification = require("../../../db/keywords");
const userController = require("../../../controller/quicklearning/user.controller");
const { emitCustomerUpdate } = require("../../../utils/socket-events");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Tu API Key de OpenAI
});

router.get("/list", async (req, res) => {
  try {
    console.time("⏱️ Tiempo de ejecución");
    console.log("🔍 Obteniendo lista paginada de clientes...");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = Math.max((page - 1) * limit, 0);

    // 1️⃣ Obtener TODOS los clientes (porque necesitas orden global)
    const allCustomers = await customerController.getAllCustom(); // ya usa .lean() por dentro idealmente
    const allPhones = allCustomers.map(c => c.phone);

    // 2️⃣ Obtener todos los chats que tengan al menos un mensaje inbound
    const chats = await Chat.find({
      phone: { $in: allPhones },
      "messages.direction": "inbound"
    }).lean();

    const chatsMap = new Map();
    chats.forEach(chat => {
      chatsMap.set(chat.phone, chat.messages || []);
    });

    // 3️⃣ Unir info de chats con cada cliente
    const enriched = allCustomers.map(customer => {
      const messages = chatsMap.get(customer.phone) || [];
      return { ...customer.toObject(), messages };
    });

    // 4️⃣ Filtrar solo los que tengan mensajes inbound
    const withInbound = enriched.filter(c =>
      c.messages.some(m => m.direction === "inbound")
    );

    // 5️⃣ Ordenar por prioridad y fecha del último mensaje inbound
    const priorityMap = {
      "Prospecto_Interesado": 3,
      "Urgente_Queja": 3,
      "No contesta_Sin interacción": 0,
    };

    withInbound.sort((a, b) => {
      const pA = priorityMap[`${a.classification}_${a.status}`] || 1;
      const pB = priorityMap[`${b.classification}_${b.status}`] || 1;
      if (pA !== pB) return pB - pA;

      const lastA = [...a.messages].filter(m => m.direction === "inbound").sort((x, y) =>
        new Date(y.dateCreated) - new Date(x.dateCreated)
      )[0];

      const lastB = [...b.messages].filter(m => m.direction === "inbound").sort((x, y) =>
        new Date(y.dateCreated) - new Date(x.dateCreated)
      )[0];

      return new Date(lastB?.dateCreated || 0) - new Date(lastA?.dateCreated || 0);
    });

    // 6️⃣ Paginar después de ordenar
    const total = withInbound.length;
    const paginated = withInbound.slice(skip, skip + limit);

    console.timeEnd("⏱️ Tiempo de ejecución");

    return res.status(200).json({
      message: "Clientes ordenados y paginados correctamente",
      total,
      page,
      customers: paginated
    });

  } catch (error) {
    console.error("❌ Error en /list:", error);
    return res.status(500).json({ message: "Error al obtener la lista de clientes." });
  }
});

//ayudame a sacar el total de mensajes enviados
router.get("/total-messages", async (req, res) => {
  try {
    console.log("🔍 Obteniendo el total de mensajes enviados...");

    const customers = await customerController.getAllCustom();
    const phones = customers.map(c => c.phone);
    const chats = await Chat.find({ phone: { $in: phones } });

    let totalMessages = 0;
    chats.forEach(chat => {
      totalMessages += chat.messages.length;
    });

    console.log(`✅ Se encontraron ${totalMessages} mensajes enviados.`);

    res.status(200).json({
      message: "Total de mensajes enviados",
      total: totalMessages
    });

  } catch (error) {
    console.error("❌ Error al obtener el total de mensajes enviados:", error);
    res.status(500).json({ message: "Error al obtener el total de mensajes enviados." });
  }
});

/* EP para traer a todos los prospectos interesados. */
router.get("/prospectos-interesados", async (req, res) => {
  try {
    const customers = await customerController.getAllCustom();
    const prospectosInteresados = customers.filter((customer) => {
      return customer.classification === "Prospecto" && customer.status === "Interesado";
    });
    res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, total: prospectosInteresados.length, customers: prospectosInteresados });
  } catch (error) {
    res.json({
      code: MESSAGE_RESPONSE_CODE.ERROR,
      message: MESSAGE_RESPONSE.ERROR,
    });
  }
});



router.get("/responded-to-message", async (req, res) => {
  try {
    console.log("🔍 Obteniendo clientes que respondieron al mensaje específico...");

    const customers = await customerController.getAllCustom();
    const phones = customers.map(c => c.phone);
    const chats = await Chat.find({ phone: { $in: phones } });

    const messageToSearch = `Hola, soy NatalIA 

Notamos que estuviste interesado en nuestros cursos en Quick Learning, pero no hemos podido confirmar tu inscripción. 📚✨

🎯 ¿Sigues interesado en mejorar tu inglés de manera rápida y efectiva?
📅 Tenemos cupos limitados y una oferta especial para ti.`;

    // Filtrar clientes que han respondido al mensaje específico
    const respondedCustomers = customers.filter(customer => {
      const chat = chats.find(c => c.phone === customer.phone);
      if (!chat || chat.messages.length === 0) return false;

      const outboundMessage = chat.messages.find(m => m.direction === "outbound-api" && m.body.includes(messageToSearch));
      if (!outboundMessage) return false;

      const responseMessage = chat.messages.find(m => m.direction === "inbound" && new Date(m.dateCreated) > new Date(outboundMessage.dateCreated));
      return !!responseMessage;
    });

    if (respondedCustomers.length === 0) {
      console.log("⚠️ No hay clientes que hayan respondido al mensaje específico.");
      return res.status(200).json({ message: "No se encontraron clientes que hayan respondido al mensaje específico." });
    }

    console.log(`✅ Se encontraron ${respondedCustomers.length} clientes que respondieron al mensaje.`);

    res.status(200).json({
      message: "Clientes que respondieron al mensaje específico",
      total: respondedCustomers.length,
      customers: respondedCustomers
    });

  } catch (error) {
    console.error("❌ Error al obtener los clientes que respondieron al mensaje:", error);
    res.status(500).json({ message: "Error al obtener los clientes que respondieron al mensaje." });
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
    const io = req.app.get("io");
    emitCustomerUpdate(io, {
      phone,
      name,
      comments,
      classification,
      status,
      visitDetails,
      enrollmentDetails,
      ia,
      user,
    });
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: "Customer updated", customerData });
  } catch (error) {
    res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
    console.log(error.message);
  }
});

/* Eliminar todos los customer repetidos */
router.get("/delete-duplicates", async (req, res) => {
  try {
    console.log("🔍 Eliminando clientes duplicados...")
    const customers = await customerController.getAllCustom();
    const phones = customers.map(c => c.phone);

    let duplicates = [];
    let uniquePhones = new Set();

    for (let i = 0; i < phones.length; i++) {
      let phone = phones[i];
      if (uniquePhones.has(phone)) {
        duplicates.push(phone);
      } else {
        uniquePhones.add(phone);
      }
    }

    console.log(`🔍 Se encontraron ${duplicates.length} clientes duplicados.`);
    console.log("🔍 Teléfonos duplicados:", duplicates);

    // Eliminar los clientes duplicados
    let deletedCustomers = [];
    for (let i = 0; i < duplicates.length; i++) {
      let phone = duplicates[i];
      let customer = await customerController.deleteOneCustom({ phone });
      deletedCustomers.push(customer);
    }

    console.log(`✅ Se eliminaron ${deletedCustomers.length} clientes duplicados.`);
    res.status(200).json({
      message: "Clientes duplicados eliminados",
      total: deletedCustomers.length,
      customers: deletedCustomers
    });

  } catch (error) {
    console.error("❌ Error al eliminar clientes duplicados:", error);
    res.status(500).json({ message: "Error al eliminar clientes duplicados." });
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
      { header: "Phone", key: "phone", width: 30 },
      { header: "comments", key: "comments", width: 30 },
      { header: "Status", key: "status", width: 30 },
      { header: "Clasificación", key: "classification", width: 30 },
      { header: "IA", key: "ia", width: 30 },
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

router.get("/downloadfile/membership-expired", async (req, res) => {
  try {
    console.log("📥 Generando archivo Excel de clientes con mensaje de membresía vencida...");

    const customers = await customerController.getAllCustom();
    const phones = customers.map(c => c.phone);
    const chats = await Chat.find({ phone: { $in: phones } });

    const phraseToSearch = "sabemos que tu membresía de Quick Learning Online ha vencido, y queremos darte una gran noticia";

    // Filtrar clientes que tienen el mensaje en sus conversaciones
    const filteredCustomers = customers.filter(customer => {
      const chat = chats.find(c => c.phone === customer.phone);
      if (!chat || chat.messages.length === 0) return false;

      return chat.messages.some(m => m.direction === "outbound-api" && m.body.includes(phraseToSearch));
    });

    if (filteredCustomers.length === 0) {
      console.log("⚠️ No hay clientes con el mensaje de membresía vencida.");
      return res.status(200).json({ message: "No se encontraron clientes con el mensaje de membresía vencida." });
    }

    console.log(`✅ Se encontraron ${filteredCustomers.length} clientes con el mensaje.`);

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Customers");

    worksheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Phone", key: "phone", width: 30 },
      { header: "Comments", key: "comments", width: 40 },
      { header: "Status", key: "status", width: 30 },
      { header: "Clasificación", key: "classification", width: 30 },
      { header: "IA", key: "ia", width: 15 },
    ];

    // Aplicar estilos a los encabezados
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

    // Agregar los clientes filtrados al Excel
    filteredCustomers.forEach((customer) => {
      worksheet.addRow(customer);
    });

    const fileName = "customers_membership_expired.xlsx";
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);

    return workbook.xlsx.write(res).then(() => {
      res.end();
    });

  } catch (error) {
    console.error("❌ Error al generar el archivo Excel:", error);
    res.status(500).json({ message: "Error al generar el archivo." });
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

// filepath: /Users/orlando/Documents/GitHub/Projects/VirtualVoices/virtualvoices/router/quicklearning/v1/customer.js
router.get("/analyze-undecided-clients", async (req, res) => {
  try {
    // Configurar headers para enviar información en tiempo real (EventStream)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    console.log("🔍 Iniciando análisis de clientes indecisos...");

    // 1️⃣ Obtener todos los clientes con sus chats desde MongoDB (SIN LLAMAR A LA API DE WHATSAPP)
    const customers = await customerController.getAllCustom();
    const phones = customers.map(c => c.phone);
    const chats = await Chat.find({ phone: { $in: phones } });

    let totalCustomers = customers.length;
    let bulkUpdates = [];
    const promoMessage = "sabemos que tu membresía de Quick Learning Online ha vencido"; // Mensaje clave

    console.log(`📊 Analizando ${totalCustomers} clientes...\n`);

    for (let i = 0; i < totalCustomers; i++) {
      let customer = customers[i];
      let number = customer.phone;
      let comments = customer.comments || ""; // Mantener comentarios anteriores
      let chat = chats.find(c => c.phone === number);

      console.log(`📨 Analizando cliente ${i + 1}/${totalCustomers} - Teléfono: ${number}`);

      if (!chat || chat.messages.length === 0) {
        console.log(`⚠️ No hay mensajes para el cliente ${number}`);
        comments += "\n🔍 No se encontraron mensajes para analizar.";
        continue;
      }

      // 2️⃣ Obtener el último mensaje del usuario y el último mensaje del bot
      let lastInboundMessage = chat.messages.reverse().find(m => m.direction === "inbound");
      let lastOutboundMessage = chat.messages.reverse().find(m => m.direction === "outbound-api");

      let lastMessageDate = lastInboundMessage ? new Date(lastInboundMessage.dateCreated) : null;
      let now = new Date();
      let hoursSinceLastMessage = lastMessageDate ? (now - lastMessageDate) / (1000 * 60 * 60) : null;

      let classification = customer.classification;
      let status = customer.status;

      // 3️⃣ Si el cliente recibió la promoción y no respondió en 24 horas, marcar como "No contesta - Sin interacción"
      if (lastOutboundMessage && lastOutboundMessage.body.includes(promoMessage)) {
        let promoMessageDate = new Date(lastOutboundMessage.dateCreated);
        let hoursSincePromoMessage = (now - promoMessageDate) / (1000 * 60 * 60);

        if (hoursSincePromoMessage > 24 && !lastInboundMessage) {
          classification = "No contesta";
          status = "Sin interacción";
          comments += `\n📌 Cliente recibió promoción pero no respondió en 24 horas.`;
        }
      }

      // 4️⃣ Si han pasado más de 24 horas desde la última respuesta del usuario, marcar como "No contesta - Sin interacción"
      if (hoursSinceLastMessage && hoursSinceLastMessage > 24) {
        classification = "No contesta";
        status = "Sin interacción";
        comments += `\n📌 Cliente no ha respondido en más de 24 horas.`;
      }

      // 5️⃣ Analizar el último mensaje con palabras clave si aún no está en "No contesta"
      if (classification !== "No contesta") {
        let messageText = lastInboundMessage ? lastInboundMessage.body.toLowerCase() : "";

        for (let keyword in keywordClassification) {
          if (messageText.includes(keyword)) {
            classification = keywordClassification[keyword].classification;
            status = keywordClassification[keyword].status;
            comments += `\n📌 Clasificación automática: ${classification} - Estado: ${status}`;
            break; // Detener búsqueda después del primer match
          }
        }
      }

      // 6️⃣ No actualizar si la clasificación es "Prospecto", "Interesado" o "Urgente queja"
      if (["Prospecto", "Interesado", "Urgente"].includes(classification)) {
        console.log(`🔍 Cliente ${number} no se actualizará debido a su clasificación actual: ${classification}`);
        continue;
      }

      console.log(`✅ Cliente ${number} clasificado como: ${classification}, Estado: ${status}`);

      // 7️⃣ Agregar la actualización al lote (bulk update)
      bulkUpdates.push({
        updateOne: {
          filter: { _id: customer._id },
          update: { classification, status, comments },
        },
      });

      // 8️⃣ Enviar progreso en tiempo real
      let progress = Math.round(((i + 1) / totalCustomers) * 100);
      res.write(`data: {"progress": ${progress}, "current": ${i + 1}, "total": ${totalCustomers}}\n\n`);
    }

    // 9️⃣ Ejecutar las actualizaciones en la base de datos
    if (bulkUpdates.length > 0) {
      console.log(`💾 Guardando ${bulkUpdates.length} actualizaciones en la base de datos...`);
      await customerController.bulkWrite(bulkUpdates);
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

/* Traer customers por el id del user, excluyendo "No contesta - Sin interacción" */
router.get("/customers/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("userId", userId);

    // 1️⃣ Obtener todos los chats
    const chats = await Chat.find();

    // 2️⃣ Obtener los clientes asociados al usuario específico
    const customers = await customerController.getAllCustom();
    const customersByUser = customers.filter(c => c.user == userId); // Filtrar solo los clientes de ese usuario

    // 3️⃣ Cruzar los clientes con sus conversaciones (todos los mensajes) y excluir "No contesta - Sin interacción"
    let customersWithConversations = customersByUser
      .map(customer => {
        const chat = chats.find(c => c.phone === customer.phone);
        return chat ? { ...customer.toObject(), messages: chat.messages } : null;
      })
      .filter(Boolean) // Filtrar nulos
      .filter(customer => !(customer.classification === "No contesta" && customer.status === "Sin interacción")); // Excluir "No contesta - Sin interacción"

    // 4️⃣ Definir prioridad de clasificación y estado
    const priorityMap = {
      "Prospecto_Interesado": 3,  // 🔝 Máxima prioridad
      "Urgente_Queja": 3,         // 🔝 Máxima prioridad
    };

    // 5️⃣ Ordenar los clientes según prioridad y fecha del último mensaje
    customersWithConversations.sort((a, b) => {
      const priorityA = priorityMap[`${a.classification}_${a.status}`] || 1;
      const priorityB = priorityMap[`${b.classification}_${b.status}`] || 1;

      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Ordenar primero por prioridad
      }

      // Si tienen la misma prioridad, ordenar por la fecha del último mensaje (de más reciente a más antiguo)
      let lastMessageA = a.messages.length > 0 ? new Date(a.messages[a.messages.length - 1].dateCreated) : new Date(0);
      let lastMessageB = b.messages.length > 0 ? new Date(b.messages[b.messages.length - 1].dateCreated) : new Date(0);

      return lastMessageB - lastMessageA; // Orden descendente (más reciente primero)
    });

    console.log(`✅ Se encontraron ${customersWithConversations.length} clientes después de la exclusión.`);

    res.status(200).json({
      message: "Customers with full conversation history, prioritized and filtered",
      total: customersWithConversations.length,
      customers: customersWithConversations
    });

  } catch (error) {
    console.error("❌ Error al obtener conversaciones de los clientes:", error);
    res.status(500).json({ message: "Error al obtener las conversaciones." });
  }
});

/* ep para eliminar un usuario. */
router.delete("/delete/:id", async (req, res) => {
  try {
    const customer = await customerController.deleteOneCustom({ _id: req.params.id });
    if (!customer) {
      return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: "Customer not found" });
    }
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: "Customer deleted", customer });
  } catch (error) {
    console.log(error);
  }
});

router.get("/:phone", async (req, res) => {
  try {
    const { phone } = req.params;

    const chat = await Chat.findOne({ phone });
    if (!chat) {
      return res.status(404).json({ messages: [] });
    }

    res.status(200).json({ messages: chat.messages });
  } catch (err) {
    console.error("❌ Error al obtener chat:", err);
    res.status(500).json({ message: "Error al obtener mensajes" });
  }
});

module.exports = router;
