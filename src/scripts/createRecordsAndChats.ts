import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

import { DynamicRecord } from "../models/record.model";
import Chat from "../models/chat.model";

async function createRecordsAndChats() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("✅ Conectado a MongoDB");

    // Hacer la solicitud al endpoint
    const response = await axios.get("https://api.quick-learning.virtualvoices.com.mx/api/v1/quicklearning/list");
    const customers = response.data.customers;

    console.log(`📦 Clientes obtenidos del API: ${customers.length}`);

    for (const customer of customers) {
      // Crear el DynamicRecord
      const dynamicRecord = new DynamicRecord({
        tableSlug: "prospectos",
        customFields: [
          {
            key: "phone",
            label: "Teléfono",
            value: customer.phone,
            visible: true,
            type: "text",
            options: [],
            required: false,
            format: "default",
          },
          {
            key: "name",
            label: "Nombre",
            value: customer.name,
            visible: true,
            type: "text",
            options: [],
            required: false,
            format: "default",
          },
          {
            key: "classification",
            label: "Clasificación",
            value: "prospecto",
            visible: true,
            type: "select",
            options: ["cliente", "alumno", "prospecto", "exalumno"],
            required: false,
            format: "default",
          },
          {
            key: "status",
            label: "Estado",
            value: "nuevo",
            visible: true,
            type: "select",
            options: ["nuevo", "en negociación", "alumno activo", "alumno inactivo", "sin interés"],
            required: false,
            format: "default",
          },
          {
            key: "ai",
            label: "AI",
            value: customer.ia,
            visible: true,
            type: "select",
            options: ["true", "false"],
            required: false,
            format: "default",
          },
          {
            key: "asesor",
            label: "Asesor",
            value: JSON.stringify({ name: "Cesar Orlando Magaña Pasaye", _id: "681d62c1aac067c51fc2ff8a"}),
            visible: true,
            type: "select",
            options: [],
            required: false,
            format: "default",
          },
        ],
      });

      const savedRecord = await dynamicRecord.save();
      console.log(`✅ DynamicRecord creado para ${customer.name}`);

      // Crear el Chat
      const chat = new Chat({
        phone: customer.phone,
        messages: customer.messages.map((message: any) => ({
          direction: message.direction,
          body: message.body,
          dateCreated: message.dateCreated,
          respondedBy: message.direction === "inbound" ? "human" : "bot",
        })),
        linkedTable: {
          refModel: "DynamicRecord",
          refId: savedRecord._id,
        },
        advisor: {
          id: customer.user,
          name: customer.name,
        },
        conversationStart: customer.creationDate,
      });

      await chat.save();
      console.log(`✅ Chat creado para ${customer.name}`);
    }

    console.log("🏁 Proceso finalizado");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante el proceso:", error);
    process.exit(1);
  }
}

createRecordsAndChats();