// server.ts (versión adaptada para llamadas entrantes con ElevenLabs)
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import axios from "axios";
import WebSocket from "ws";
import app from "./app";

dotenv.config();

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

let streamSid: string | null = null;

wss.on("connection", async (twilioWs) => {
  console.log("✅ Twilio WebSocket conectado");

  let elevenWs: WebSocket | null = null;

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
        console.log("message.type", message.type);
        switch (message.type) {
          case "audio":
            if (streamSid) {
              console.log("entra aqui  ---> audio");
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

  twilioWs.on("message", (msg) => {
    try {
      const message = JSON.parse(msg.toString());
      switch (message.event) {
        case "start":
          streamSid = message.start.streamSid;
          console.log("📞 Llamada iniciada", streamSid);
          break;

        case "media":
          if (elevenWs && elevenWs.readyState === WebSocket.OPEN) {
            streamSid = message.streamSid;
            const audioMessage = {
              user_audio_chunk: message.media.payload,
            };
            elevenWs.send(JSON.stringify(audioMessage));
          }
          break;

        case "stop":
          console.log("📴 Llamada finalizada");
          if (elevenWs && elevenWs.readyState === WebSocket.OPEN) elevenWs.close();
          twilioWs.close();
          break;
      }
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

server.listen(process.env.PORT || 8080, () => {
  console.log("🚀 Servidor corriendo en http://localhost:" + (process.env.PORT || 8080));
});
