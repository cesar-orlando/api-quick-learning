import { Request, Response } from "express";
import { DynamicRecord } from "../models/record.model";
import { sendTwilioMessage } from "../utils/twilio";
import Chat from "../models/chat.model";
import { updateLastMessage } from "./chat.controller";
import { User } from "../models/user.model";

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

    // 🔥 Actualizamos TODO customFields reemplazándolo
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

  // Buscar el primer asesor activo
  const activeUser = await User.findOne({ status: true, role: "sales" }).sort({ createdAt: -1 });

  if (!activeUser) {
    throw new Error("❌ No se encontró un usuario activo para asignar.");
  }

  const newRecord = new DynamicRecord({
    tableSlug: "prospectos",
    customFields: [
      {
        key: "phone",
        label: "Teléfono",
        value: phone,
        visible: true,
        type: "text",
        options: [],
        required: true,
        format: "default",
        validations: {},
      },
      {
        key: "name",
        label: "Nombre",
        value: name || "Sin nombre",
        visible: true,
        type: "text",
        options: [],
        required: true,
        format: "default",
        validations: {},
      },
      {
        key: "classification",
        label: "Clasificación",
        value: "prospecto",
        visible: true,
        type: "select",
        options: ["cliente", "alumno", "prospecto", "exalumno"],
        required: true,
        format: "default",
        validations: {},
      },
      {
        key: "status",
        label: "Estado",
        value: "nuevo",
        visible: true,
        type: "select",
        options: ["nuevo", "en negociación", "alumno activo", "alumno inactivo", "sin interés"],
        required: true,
        format: "default",
        validations: {},
      },
      {
        key: "meetings",
        label: "Juntas",
        value: [],
        visible: true,
        type: "history",
        options: [],
        required: false,
        format: "default",
        validations: {},
      },
      {
        key: "ai",
        label: "AI",
        value: true,
        visible: true,
        type: "select",
        options: ["true", "false"],
        required: false,
        format: "default",
        validations: {},
      },
      {
        key: "asesor",
        label: "Asesor",
        value: JSON.stringify({ name: activeUser.name, _id: activeUser._id }),
        visible: true,
        type: "select",
        options: [],
        required: false,
        format: "default",
        validations: {},
      },
      {
        key: "lastMessage",
        label: "Último mensaje",
        value: "",
        visible: true,
        type: "text",
        options: [],
        required: false,
        format: "default",
        validations: {},
      },
      {
        key: "lastMessageTime",
        label: "Hora del mensaje",
        value: "",
        visible: true,
        type: "text",
        options: [],
        required: false,
        format: "default",
        validations: {},
      },
    ],
  });

  await newRecord.save();
  console.log("✅ Cliente registrado exitosamente:", newRecord);

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
