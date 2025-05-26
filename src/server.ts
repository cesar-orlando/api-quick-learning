// server.ts (versión adaptada para llamadas entrantes con ElevenLabs)
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import axios from "axios";
import WebSocket from "ws";
import app from "./app";
import mongoose from "mongoose";
import { setSocketIO } from "./socket";
import { saveCallInternal } from "./controllers/call.controller";

dotenv.config();

const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/clientesdb";

const server = http.createServer(app);
setSocketIO(server);

let streamSid: string | null = null;

const wss = new WebSocketServer({ noServer: true });

// Exportado para que lo use el controller
export const tempCalls: { [callSid: string]: { phone: string } } = {};

wss.on("connection", async (twilioWs, req) => {
  let elevenWs: WebSocket | null = null;
  let elevenConversationId: string | null = null;
  let twilioConversationId: string | null = null;
  let callSaved = false;

  // Busca el número en tempCalls usando el CallSid
  const trySaveCall = () => {
    if (!callSaved && elevenConversationId && twilioConversationId && tempCalls[twilioConversationId]) {
      callSaved = true;
      const phone = tempCalls[twilioConversationId].phone;
      saveCallInternal(phone, twilioConversationId, elevenConversationId);
      delete tempCalls[twilioConversationId];
      console.log("✅ Llamada guardada:", phone, twilioConversationId, elevenConversationId);
    }
  };

  const setupElevenLabs = async () => {
    try {
      const { data } = await axios.get(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=agent_01jw2vkb3pf9w8jx85daq02mae`,
        { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY_VV } }
      );

      elevenWs = new WebSocket(data.signed_url);

      elevenWs.on("open", () => console.log("🎤 ElevenLabs conectado"));

      elevenWs.on("message", (data) => {
        const message = JSON.parse(data.toString());
        switch (message.type) {
          case "audio":
            if (streamSid) {
              const audioPayload = message.audio?.chunk || message.audio_event?.audio_base_64;
              if (audioPayload) {
                const audioData = {
                  event: "media",
                  streamSid,
                  media: {
                    payload: audioPayload,
                  },
                };
                twilioWs.send(JSON.stringify(audioData));
              }
            }
            break;
          case "interruption":
            twilioWs.send(JSON.stringify({ event: "clear", streamSid }));
            break;
          case "ping":
            if (message.ping_event?.event_id && elevenWs) {
              elevenWs.send(
                JSON.stringify({
                  type: "pong",
                  event_id: message.ping_event.event_id,
                })
              );
            }
            break;
          case "agent_response":
            console.log("🧠 Respuesta del agente:", message);
            break;
          case "agent_response_correction":
            console.log("📝 Corrección de respuesta del agente:", message.agent_response_correction?.text);
            break;
          case "user_transcript":
            console.log(`[Twilio] User transcript: ${message.user_transcription_event?.user_transcript}`);
            break;
          case "conversation_initiation_metadata":
            elevenConversationId = message.conversation_initiation_metadata_event?.conversation_id;
            console.log("ElevenLabs conversationId:", elevenConversationId);
            trySaveCall();
            break;
          default:
            console.log(`Unhandled message type from Eleven Labs: ${message.type}`);
        }
      });

      elevenWs.on("error", (error) => console.error("❌ Error con Eleven Labs:", error));
      elevenWs.on("close", () => console.log("🔌 Eleven Labs desconectado"));
    } catch (error) {
      console.error("❌ No se pudo conectar a ElevenLabs:", error);
    }
  };

  await setupElevenLabs();

  // Cuando recibas el mensaje "media" de Twilio, extrae el CallSid si puedes
  twilioWs.on("message", (msg) => {
    try {
      const message = JSON.parse(msg.toString());
      // console.log("msg Twilio:", message);

      // Intenta asignar el callSid si llega en "stop"
      if (!twilioConversationId && message.stop?.callSid) {
        twilioConversationId = message.stop.callSid;
        console.log("📞 callSid asignado desde 'stop':", twilioConversationId);
      }

      switch (message.event) {
        case "media":
          streamSid = message.streamSid;
          if (elevenWs && elevenWs.readyState === WebSocket.OPEN) {
            const audioMessage = {
              user_audio_chunk: message.media.payload,
            };
            elevenWs.send(JSON.stringify(audioMessage));
          }
          break;
        case "stop":
          if (!twilioConversationId && message.stop?.callSid) {
            twilioConversationId = message.stop.callSid;
            console.log("📞 callSid asignado desde 'stop':", twilioConversationId);
          }
          trySaveCall(); // <-- Intenta guardar aquí también
          console.log("📴 Llamada finalizada");
          if (elevenWs && elevenWs.readyState === WebSocket.OPEN) elevenWs.close();
          twilioWs.close();
          break;
      }
      trySaveCall();
    } catch (e) {
      console.error("⚠️ Error procesando mensaje Twilio:", e);
    }
  });

  twilioWs.on("close", () => {
    console.log("🔌 WebSocket Twilio cerrado");
    if (elevenWs && elevenWs.readyState === WebSocket.OPEN) elevenWs.close();
  });
});

server.on("upgrade", (req, socket, head) => {
  const { pathname } = new URL(req.url!, "http://localhost");
  console.log("🔁 Upgrade request a:", pathname);
  if (pathname === "/outbound-stream") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      console.log("🔁 Upgrade match: conexión WebSocket a /outbound-stream");
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

// Conexión a MongoDB
mongoose
  .connect(MONGO_URI, {})
  .then(() => {
    console.log("✅ Conectado a MongoDB");
    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error conectando a MongoDB:", err);
    process.exit(1);
  });
