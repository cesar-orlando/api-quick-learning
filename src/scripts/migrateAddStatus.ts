// src/scripts/migrateAddStatus.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { DynamicRecord } from "../models/record.model";
import { User } from "../models/user.model"; // Asegúrate de que este sea el modelo correcto para los usuarios

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("✅ Conectado a MongoDB");

    // Obtener todos los usuarios
    const usuarios = await User.find();
    console.log(`📦 Usuarios encontrados: ${usuarios.length}`);

    for (const usuario of usuarios) {
      // Verificar si el campo "status" ya existe
      if (!usuario.status) {
        usuario.status = true; // Agregar el campo "status" con el valor "activo"
        await usuario.save();
        console.log(`✅ Usuario ${usuario._id} actualizado a "activo"`);
      }
    }

    console.log("🏁 Migración finalizada");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    process.exit(1);
  }
}

main();
