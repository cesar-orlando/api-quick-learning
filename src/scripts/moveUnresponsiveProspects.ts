import dotenv from "dotenv";
import mongoose from "mongoose";
import { DynamicRecord } from "../models/record.model";

dotenv.config();


const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || "");
  console.log("✅ Conectado a MongoDB");

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const allProspects = await DynamicRecord.find({ tableSlug: "prospectos" });

  let moved = 0;

  for (const record of allProspects) {
    const lastMessageField = record.customFields.find((f: any) => f.key === "lastMessageTime");
    const lastTime = lastMessageField?.value ? new Date(lastMessageField.value) : null;

    if (lastTime && lastTime < twentyFourHoursAgo) {
      const newFields = record.customFields.map((f: any) => {
        if (f.key === "classification") f.value = "prospecto";
        if (f.key === "status") f.value = "sin interés";
        return f;
      });

      const newRecord = new DynamicRecord({
        tableSlug: "sin-contestar",
        customFields: newFields,
      });

      await newRecord.save();
      await record.deleteOne();
      moved++;
    }
  }

  console.log(`✅ ${moved} prospectos sin respuesta movidos a 'sin-contestar'.`);
  process.exit();
};

run().catch((err) => {
  console.error("❌ Error al mover registros:", err);
  process.exit(1);
});
