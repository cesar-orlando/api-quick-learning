import dotenv from "dotenv";
import http from "http";
import app from "./app";
import { connectDB } from "./config/database";
import { setSocketIO } from "./socket";
// import { startWhatsappBot } from "./services/whatsapp";

dotenv.config();

const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/clientesdb";

const server = http.createServer(app);
const io = setSocketIO(server);

async function main() {
  await connectDB(MONGO_URI);
  // 🚀 Iniciar WhatsApp Web Bot
  // startWhatsappBot();

  // Ahora puedes pasar `io` a tus servicios o controladores si lo necesitas

  server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

main();
