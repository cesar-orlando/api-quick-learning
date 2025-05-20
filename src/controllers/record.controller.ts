import { Request, Response } from "express";
import { DynamicRecord } from "../models/record.model";
import { sendTemplateMessage, sendTwilioMessage } from "../utils/twilio";
import Chat from "../models/chat.model";
import { updateLastMessage } from "./chat.controller";
import { User } from "../models/user.model";
import { getSocketIO } from "../socket";

// 🔹 Agregar un campo dinámico a todos los registros de una tabla
export const addCustomField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { key, label, type, options, format } = req.body;

    if (!key || !label) {
      res.status(400).json({ message: "Faltan datos del campo." });
      return;
    }

    const newField = {
      key,
      label,
      type: type || "text",
      options: options || [],
      visible: true,
      value: "",
      format: format || "default",
    };

    await DynamicRecord.updateMany({ tableSlug: slug }, { $push: { customFields: newField } });

    res.json({ message: "Campo agregado exitosamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al agregar campo." });
  }
};

// 🔹 Actualizar un campo dinámico (nombre, tipo, opciones)
export const updateCustomField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug, key } = req.params;
    const { label, type, options, format } = req.body;

    const records = await DynamicRecord.find({ tableSlug: slug });

    for (const record of records) {
      const field = record.customFields.find((f: any) => f.key === key);
      if (field) {
        if (label) field.label = label;
        if (type) field.type = type;
        if (options) field.options = options;
        if (format) field.format = format;
      }
      await record.save();
    }

    res.json({ message: "Campo actualizado correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar campo." });
  }
};

// 🔹 Eliminar un campo dinámico
export const deleteCustomField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug, key } = req.params;

    const records = await DynamicRecord.find({ tableSlug: slug });

    if (!records.length) {
      res.status(404).json({ message: "No existen registros en esta tabla." });
      return;
    }

    // 🔥 Revisamos en el primer registro si sería el último campo
    const firstRecord = records[0];
    const fieldsLeft = firstRecord.customFields.filter((f: any) => f.key !== key);

    if (fieldsLeft.length === 0) {
      res.status(400).json({ message: "No puedes eliminar el único campo de la tabla." });
      return;
    }

    // 🔥 Si pasa validación, sí eliminamos el campo
    await DynamicRecord.updateMany({ tableSlug: slug }, { $pull: { customFields: { key } } });

    res.json({ message: "Campo eliminado exitosamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar campo." });
  }
};

// 🔹 Crear nuevo registro dinámico
export const createRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableSlug, customFields } = req.body;

    if (!tableSlug || !Array.isArray(customFields)) {
      res.status(400).json({ message: "tableSlug y customFields son requeridos." });
      return;
    }

    const newRecord = new DynamicRecord({
      tableSlug,
      customFields,
    });

    await newRecord.save();

    res.status(201).json(newRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear el registro." });
  }
};

// 🔹 Obtener todos los registros de una tabla específica
export const getRecordsByTable = async (req: Request, res: Response) => {
  try {
    const { tableSlug } = req.params;

    const records = await DynamicRecord.find({ tableSlug }).sort({ createdAt: -1 }); // Más recientes arriba

    res.json({ records: records, total: records.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los registros." });
  }
};

// 🔹 Actualizar registro dinámico
export const updateRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { customFields } = req.body;

    if (!Array.isArray(customFields)) {
      res.status(400).json({ message: "customFields debe ser un arreglo." });
      return;
    }

    const record = await DynamicRecord.findById(id);
    if (!record) {
      res.status(404).json({ message: "Registro no encontrado." });
      return;
    }

    // Buscar campos relevantes
    const classificationField = customFields.find((f: any) => f.key === "classification");
    const statusField = customFields.find((f: any) => f.key === "status");

    const classification = classificationField?.value || null;
    const status = statusField?.value || null;

    // 🔁 Cliente => mover a 'clientes' y status: 'en negociación'
    if (classification === "cliente") {
      if (statusField) {
        statusField.value = "en negociación";
      }

      const newRecord = new DynamicRecord({
        tableSlug: "clientes",
        customFields,
      });

      await newRecord.save();
      await record.deleteOne();
      res.json({ message: `Registro movido a tabla 'clientes'.`, record: newRecord });
      return;
    }

    // 🔁 Alumno => mover a 'alumnos' y status: 'alumno activo'
    if (classification === "alumno") {
      if (statusField) {
        statusField.value = "alumno activo";
      }

      const newRecord = new DynamicRecord({
        tableSlug: "alumnos",
        customFields,
      });

      await newRecord.save();
      await record.deleteOne();
      res.json({ message: `Registro movido a tabla 'alumnos'.`, record: newRecord });
      return;
    }

    // 🔁 Prospecto + sin interés => mover a 'sin-contestar'
    if (classification === "prospecto" && status === "sin interés") {
      if (classificationField) classificationField.value = "prospecto";
      if (statusField) statusField.value = "sin interés";

      const newRecord = new DynamicRecord({
        tableSlug: "sin-contestar",
        customFields,
      });

      await newRecord.save();
      await record.deleteOne();
      res.json({ message: `Registro movido a tabla 'sin-contestar'.`, record: newRecord });
      return;
    }

    // 🔁 Prospecto + nuevo => mover a 'prospectos'
    if (classification === "prospecto" && status === "nuevo" && record.tableSlug === "sin-contestar") {
      if (classificationField) classificationField.value = "prospecto";
      if (statusField) statusField.value = "nuevo";

      const newRecord = new DynamicRecord({
        tableSlug: "prospectos",
        customFields,
      });

      await newRecord.save();
      await record.deleteOne();
      res.json({ message: `Registro movido a tabla 'prospectos'.`, record: newRecord });
      return;
    }

    // ✅ Si no hay movimiento de tabla, solo actualiza campos
    record.set("customFields", customFields);
    await record.save();
    res.json({ message: "Registro actualizado correctamente.", record });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el registro." });
  }
};

// 🔹 Eliminar registro dinámico
export const deleteRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const record = await DynamicRecord.findByIdAndDelete(id);

    if (!record) {
      res.status(404).json({ message: "Registro no encontrado para eliminar." });
      return;
    }

    res.json({ message: "Registro eliminado correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar el registro." });
  }
};

// 🔹 Crear un nuevo registro dinámico para el cliente en WhatsApp
export const createDynamicRecord = async (phone: string, name: string) => {
  console.log("🛠️ Creando un nuevo registro dinámico para el cliente...");
  const io = getSocketIO();

  const activeUsers = await User.find({ status: true, role: "sales" });

  if (!activeUsers.length) {
    throw new Error("❌ No se encontró ningún usuario activo para asignar.");
  }

  const activeUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];

  // 🔍 Obtener campos definidos de la tabla 'prospectos' (usando el primer registro como referencia)
  const referenceRecord = await DynamicRecord.findOne({ tableSlug: "prospectos" });
  const definedFields = referenceRecord?.customFields || [];

  // 🔧 Campos base obligatorios
  const baseFields = [
    { key: "phone", label: "Teléfono", value: phone },
    { key: "name", label: "Nombre", value: name || "Sin nombre" },
    {
      key: "classification",
      label: "Clasificación",
      value: "prospecto",
      options: ["cliente", "alumno", "prospecto", "exalumno"],
      type: "select",
    },
    {
      key: "status",
      label: "Estado",
      value: "nuevo",
      options: ["nuevo", "en negociación", "alumno activo", "alumno inactivo", "sin interés"],
      type: "select",
    },
    {
      key: "asesor",
      label: "Asesor",
      value: JSON.stringify({ name: activeUser.name, _id: activeUser._id }),
      type: "select",
    },
    {
      key: "ai",
      label: "AI",
      value: true,
      options: ["true", "false"],
      type: "select",
    },
    {
      key: "lastMessage",
      label: "Último mensaje",
      value: "",
    },
    {
      key: "lastMessageTime",
      label: "Hora del mensaje",
      value: "",
    },
    {
      key: "meetings",
      label: "Juntas",
      value: [],
      type: "history",
    },
  ];

  // 🧠 Combinar base + extras dinámicos
  const customFieldsMap: { [key: string]: any } = {};
  baseFields.forEach((f) => (customFieldsMap[f.key] = f));

  // Agregar campos faltantes del esquema (si no están ya definidos)
  for (const field of definedFields) {
    if (!customFieldsMap[field.key]) {
      customFieldsMap[field.key] = {
        key: field.key,
        label: field.label,
        value: field.type === "history" ? [] : "",
        visible: true,
        type: field.type || "text",
        options: field.options || [],
        required: field.required || false,
        format: field.format || "default",
        validations: {},
      };
    }
  }

  // Convertir a arreglo
  const finalCustomFields = Object.values(customFieldsMap).map((field: any) => ({
    key: field.key,
    label: field.label,
    value: field.value,
    visible: field.visible ?? true,
    type: field.type ?? "text",
    options: field.options ?? [],
    required: field.required ?? false,
    format: field.format ?? "default",
    validations: {},
  }));

  // 🧾 Crear el registro
  const newRecord = new DynamicRecord({
    tableSlug: "prospectos",
    customFields: finalCustomFields,
  });

  await newRecord.save();
  console.log("✅ Cliente registrado exitosamente:", newRecord);

  // Notificación en tiempo real
  io.emit("nuevo_cliente", {
    message: "Nuevo cliente registrado",
    cliente: {
      phone,
      name,
      record: newRecord,
    },
  });

  return newRecord;
};

export const findOrCreateCustomer = async (phone: string, name: string) => {
  try {
    // Verificar si el cliente ya está registrado
    const customer = await DynamicRecord.findOne({
      customFields: { $elemMatch: { key: "phone", value: phone } }, // Buscar en el array de customFields
    });

    if (!customer) {
      const newCustomer = await createDynamicRecord(phone, name);
      return newCustomer;
    } else {
      return customer;
    }
  } catch (error) {
    console.error("❌ Error al buscar o crear el cliente:", error);
    throw new Error("Error al buscar o crear el cliente.");
  }
};

// 🔹 Obtener registros dinámicos de la tabla "prospectos" filtrados por el ID del asesor
export const getProspectRecordsByAsesorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { asesorId } = req.params; // ID del asesor que llega en la petición

    if (!asesorId) {
      res.status(400).json({ message: "El ID del asesor es requerido." });
      return;
    }

    // Buscar todos los registros de la tabla "prospectos" que coincidan con el ID del asesor
    const records = await DynamicRecord.find({
      tableSlug: "prospectos",
      customFields: {
        $elemMatch: {
          key: "asesor",
          value: { $regex: `"${asesorId}"`, $options: "i" }, // Buscar el ID del asesor dentro del campo "asesor"
        },
      },
    });

    if (!records.length) {
      res.status(404).json({ message: "No se encontraron registros para el asesor especificado." });
      return;
    }

    res.json({ records: records, total: records.length });
  } catch (error) {
    console.error("❌ Error al obtener los registros de prospectos:", error);
    res.status(500).json({ message: "Error al obtener los registros de prospectos." });
  }
};

// 🔹 Envio de un mensaje
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      res.status(400).json({ message: "El teléfono y el mensaje son requeridos." });
      return;
    }

    // Enviar mensaje por Twilio
    const result = await sendTwilioMessage(phone, message);

    // Verifica que Twilio respondió correctamente
    if (!result?.sid) {
      console.error("⚠️ Twilio no retornó SID, algo falló silenciosamente");
      res.status(500).json({ message: "Error al enviar el mensaje." });
      return;
    }

    // Guardar en la base de datos
    let chat = await Chat.findOne({ phone });
    if (!chat) {
      chat = new Chat({
        phone,
        linkedTable: { refModel: "DynamicRecord" },
        conversationStart: new Date(),
      });
    }

    chat.messages.push({
      direction: "outbound-api",
      body: message,
      respondedBy: "asesor",
    });

    await chat.save();
    const dateNow = new Date();
    await updateLastMessage(phone, message, dateNow, "asesor");

    res.json({ message: "Mensaje enviado exitosamente.", sid: result.sid });
  } catch (error) {
    console.error("❌ Error en sendMessage:", error);
    res.status(500).json({ message: "Error al enviar el mensaje." });
  }
};

// 🔹 Envio de forma de pago a un cliente
export const sendPaymentForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, templateId, variables } = req.body;

    if (!phone || !templateId) {
      res.status(400).json({ message: "El teléfono y el ID del template son requeridos." });
      return;
    }

    const result = await sendTemplateMessage(phone, templateId, variables || []);

    if (!result?.sid) {
      res.status(500).json({ message: "Error al enviar el mensaje de plantilla." });
      return;
    }

    res.json({ message: "Template enviado exitosamente.", sid: result.sid });
  } catch (error) {
    console.error("❌ Error en sendPaymentForm:", error);
    res.status(500).json({ message: "Error al enviar el mensaje." });
  }
};

export const sendTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("req.body", req.body);
    const { phone, templateId, variables } = req.body;

    if (!phone || !templateId) {
      res.status(400).json({ message: "El teléfono y el ID del template son requeridos." });
      return;
    }

    const result = await sendTemplateMessage(phone, templateId, variables || []);

    if (!result?.sid) {
      res.status(500).json({ message: "Error al enviar el mensaje de plantilla." });
      return;
    }

    res.json({ message: "Template enviado exitosamente.", sid: result.sid });
  } catch (error) {
    console.error("❌ Error en sendTemplateMessage:", error);
    res.status(500).json({ message: "Error al enviar el mensaje." });
  }
};

// 🔹 Obtener registros de cualquier tabla filtrados por asesorId
export const getRecordsByTableAndAsesor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug, asesorId } = req.params;

    if (!slug || !asesorId) {
      res.status(400).json({ message: "El slug y el ID del asesor son requeridos." });
      return;
    }

    const records = await DynamicRecord.find({
      tableSlug: slug,
      customFields: {
        $elemMatch: {
          key: "asesor",
          value: { $regex: `"${asesorId}"`, $options: "i" },
        },
      },
    });

    res.json({ records, total: records.length });
  } catch (error) {
    console.error("❌ Error al obtener los registros:", error);
    res.status(500).json({ message: "Error al obtener los registros." });
  }
};
