import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

import { User } from "../models/user.model"; // Asegúrate de que este sea el modelo correcto para los usuarios

async function fetchAndAddUsers() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("✅ Conectado a MongoDB");

    // Hacer la solicitud al endpoint
    const response = await axios.get("https://api.quick-learning.virtualvoices.com.mx/api/v1/user/all");
    const users = response.data.users;

    console.log(`📦 Usuarios obtenidos del API: ${users.length}`);

    for (const user of users) {
      // Verificar si el email ya existe en la base de datos
      const existingUser = await User.findOne({ email: user.email });
      if (existingUser) {
        console.log(`⚠️ Usuario con email ${user.email} ya existe. Saltando...`);
        continue; // Saltar al siguiente usuario
      }
      const newUser = new User({
        name: user.name,
        email: user.email,
        password: "Asesor123", // Contraseña fija
        status: true, // Campo status como true
        role: "sales", // Rol fijo como "sales"
      });

      await newUser.save();
      console.log(`✅ Usuario ${user.email} agregado con éxito`);
    }

    console.log("🏁 Proceso finalizado");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante el proceso:", error);
    process.exit(1);
  }
}

fetchAndAddUsers();
