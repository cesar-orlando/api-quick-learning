import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import clientRoutes from "./routes/client.routes";
import userRoutes from "./routes/user.routes";
import uploadRoutes from "./routes/upload.route";
import tableRoutes from "./routes/tables.routes";
import recordRoutes from "./routes/record.routes";
import iconsRoutes from "./routes/icons.routes";
import iaRoutes from "./routes/ia-config.routes";
import messageRoutes from "./routes/message.routes";
import twilioRoutes from "./routes/twilio.routes";
import callRoutes from "./routes/call.routes";

import path from "path";

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/api/customers", clientRoutes);
app.use("/api/user", userRoutes);
app.use("/api/upload", uploadRoutes);
//Tabla Dinámica
app.use("/api/tables", tableRoutes);
//Registros Dinámicos
app.use("/api/records", recordRoutes);

app.use("/api/icons", iconsRoutes);
//Ruta para configurar IA
app.use("/api/ia-config", iaRoutes);

//Enviar mensaje de WhatsApp
app.use("/api/whatsapp", messageRoutes);

app.use("/api/calls", callRoutes);


app.use("/webhook", twilioRoutes);

app.use("/audios", express.static(path.join(__dirname, "..", "public", "audios")));


app.get("/", (req, res) => {
    res.json({
      status: "ok",
      code: 200,
      message: "Sistema operativo: Milkasa Node Engine v2.4",
      uptime: `${Math.floor(process.uptime())}s`,
      trace: "XJ-85::Verified",
    });
  });
  


export default app;
