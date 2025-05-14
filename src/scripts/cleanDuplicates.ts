import mongoose from "mongoose";
import dotenv from "dotenv";
import { DynamicRecord } from "../models/record.model";
dotenv.config();

const STANDARD_FIELDS = [
  { key: "phone", label: "Teléfono", type: "text", options: [], format: "default" },
  { key: "name", label: "Nombre", type: "text", options: [], format: "default" },
  {
    key: "classification",
    label: "Clasificación",
    type: "select",
    options: ["cliente", "alumno", "prospecto", "exalumno"],
    format: "default",
  },
  {
    key: "status",
    label: "Estado",
    type: "select",
    options: ["nuevo", "en negociación", "alumno activo", "alumno inactivo", "sin interés"],
    format: "default",
  },
  { key: "asesor", label: "Asesor", type: "select", options: [], format: "default" },
  { key: "ai", label: "AI", type: "select", options: ["true", "false"], format: "default" },
  { key: "lastMessage", label: "Último mensaje", type: "text", options: [], format: "default" },
  { key: "lastMessageTime", label: "Hora del mensaje", type: "text", options: [], format: "default" },
  { key: "meetings", label: "Juntas", type: "history", options: [], format: "default" },
  {
    key: "modalidad",
    label: "Modalidad",
    type: "select",
    options: ["Presencial", "Virtual", "Online"],
    format: "default",
  },
  { key: "consecutivo", label: "Consecutivo", type: "number", options: [], format: "default" },
];

const startFixingProspectos = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("✅ Conectado a MongoDB");

    const clientes = await DynamicRecord.find({ tableSlug: "prospectos" });

    for (const cliente of clientes) {
      const existingMap = new Map(cliente.customFields.map((f: any) => [f.key, f]));

      const updatedFields = STANDARD_FIELDS.map((std) => {
        const existing = existingMap.get(std.key);
        return {
          key: std.key,
          label: std.label,
          type: std.type,
          options: std.options,
          format: std.format,
          visible: true,
          required: false,
          createdAt: existing?.createdAt || new Date(),
          value:
            existing?.value ??
            (std.type === "history"
              ? []
              : std.type === "number"
              ? 0
              : std.type === "select" && std.options.includes("true")
              ? "true"
              : ""),
        };
      });

      cliente.set("customFields", updatedFields);
      await cliente.save();
      console.log(`✅ Cliente ${cliente._id} actualizado correctamente.`);
    }

    console.log("🎉 Todos los registros de prospectos fueron normalizados.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la actualización:", error);
    process.exit(1);
  }
};

startFixingProspectos();
