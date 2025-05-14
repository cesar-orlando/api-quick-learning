import mongoose from "mongoose";
import dotenv from "dotenv";
import { Client } from "../models/client.model";
dotenv.config();

const startCleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("✅ Conectado a MongoDB");

    const clientes = await Client.find();

    for (const cliente of clientes) {
      const seenKeys = new Set();
      const cleanedFields = [];

      let duplicatesFound = false;

      for (const field of cliente.customFields) {
        if (!seenKeys.has(field.key)) {
          seenKeys.add(field.key);
          cleanedFields.push(field);
        } else {
          duplicatesFound = true;
          console.log(`⚠️ Duplicado encontrado en cliente ${cliente.name}: ${field.key}`);
        }
      }

      if (duplicatesFound) {
        cliente.set("customFields", cleanedFields);
        await cliente.save();
        console.log(`✅ Cliente ${cliente.name} limpiado y guardado.`);
      } else {
        console.log(`🟢 Cliente ${cliente.name} sin duplicados.`);
      }
    }

    console.log("🧼 Limpieza completada.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    process.exit(1);
  }
};

startCleanup();
