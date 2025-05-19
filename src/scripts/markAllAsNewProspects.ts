import dotenv from "dotenv";
import mongoose from "mongoose";
import { DynamicRecord } from "../models/record.model";

dotenv.config(); // 👈 esto es clave

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || "");
  console.log("✅ Conectado a MongoDB");

  const records = await DynamicRecord.find({ tableSlug: "prospectos" });

  for (const record of records) {
    const updatedFields = record.customFields.map((field: any) => {
      if (field.key === "classification") field.value = "prospecto";
      if (field.key === "status") field.value = "nuevo";
      return field;
    });

    (record.customFields as any) = updatedFields;
    await record.save();
  }

  console.log(`✅ ${records.length} registros actualizados como 'prospecto nuevo'.`);
  process.exit();
};

run().catch((err) => {
  console.error("❌ Error al actualizar:", err);
  process.exit(1);
});
