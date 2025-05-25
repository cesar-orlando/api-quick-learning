import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";

// Puedes usar un Map para manejar múltiples llamadas activas
const activeCalls = new Map<string, { ws: WebSocket, callSid: string }>();

const wss = new WebSocketServer({
  port: 3001, // Cambia el puerto si lo necesitas
  path: "/ws/twilio-media-stream",
});

wss.on("connection", (ws, req) => {
  let callSid: string | undefined;

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      // Identifica la llamada por CallSid
      if (msg.event === "start") {
        const newCallSid: string = msg.start.callSid || uuidv4();
        callSid = newCallSid;
        activeCalls.set(newCallSid, { ws, callSid: newCallSid });
        console.log(`🔗 Nueva llamada: ${newCallSid}`);
      }

      if (msg.event === "media") {
        // Aquí recibes el audio en base64 (PCM 8kHz mono)
        // TODO: Procesa el audio (ASR, IA, ElevenLabs, etc.)
        // Ejemplo: console.log(`Audio chunk de ${callSid}:`, msg.media.payload.length);
      }

      if (msg.event === "stop") {
        if (callSid) {
          activeCalls.delete(callSid);
          console.log(`❌ Llamada terminada: ${callSid}`);
        }
        ws.close();
      }
    } catch (err) {
      console.error("❌ Error procesando mensaje:", err);
    }
  });

  ws.on("close", () => {
    if (callSid) {
      activeCalls.delete(callSid);
      console.log(`🔌 WebSocket cerrado para llamada: ${callSid}`);
    }
  });
});

console.log("🚀 Twilio Media Stream WebSocket server escuchando en ws://localhost:8080/ws/twilio-media-stream");