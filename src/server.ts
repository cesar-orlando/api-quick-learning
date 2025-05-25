import dotenv from "dotenv";
import http from "http";
import app from "./app";
import { connectDB } from "./config/database";
import { setSocketIO } from "./socket";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
// import { startWhatsappBot } from "./services/whatsapp";
import VAD from "node-vad";
import { fft, util as fftUtil } from "fft-js";
import { pcmToWav, transcribeWithDeepgram } from "./utils/transcribe";

dotenv.config();

const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/clientesdb";

const server = http.createServer(app);
const io = setSocketIO(server);

// --- INICIA TU WEBSOCKET DE TWILIO MEDIA STREAMS EN EL MISMO SERVER ---
const activeCalls = new Map<string, { ws: WebSocket, callSid: string }>();
const wss = new WebSocketServer({ server, path: "/ws/twilio-media-stream" });

const vad = new VAD(VAD.Mode.VERY_AGGRESSIVE);

const CHUNK_DURATION_MS = 20; // Twilio envía ~20ms por chunk
const MIN_PHRASE_MS = 400;   // 400 ms mínimo
const SILENCE_LIMIT = 5;     // menos chunks de silencio para cortar frase

wss.on("connection", (ws, req) => {
  let callSid: string | undefined;
  let audioBuffer: Buffer[] = [];
  let silenceChunks = 0;

  // Variables para umbral dinámico
  let ambientRmsSum = 0;
  let ambientRmsCount = 0;
  let dynamicThreshold = 0;
  const AMBIENT_CHUNKS = 100; // ≈2 segundos si cada chunk es 20ms
  const THRESHOLD_MARGIN = 1000; // o 1000

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.event === "start") {
        const newCallSid: string = msg.start.callSid || uuidv4();
        callSid = newCallSid;
        activeCalls.set(newCallSid, { ws, callSid: newCallSid });
        console.log(`🔗 Nueva llamada: ${newCallSid}`);
      }
      if (msg.event === "media") {
        const chunk = Buffer.from(msg.media.payload, "base64");
        const rms = getRms(chunk);

        // Calcula el RMS ambiente los primeros 2 segundos
        if (ambientRmsCount < AMBIENT_CHUNKS) {
          ambientRmsSum += rms;
          ambientRmsCount++;
          dynamicThreshold = 0; // aún no usar
        } else if (ambientRmsCount === AMBIENT_CHUNKS) {
          dynamicThreshold = (ambientRmsSum / ambientRmsCount) + THRESHOLD_MARGIN;
          ambientRmsCount++; // solo calcula una vez
          console.log(`🔧 Umbral dinámico calculado: ${dynamicThreshold}`);
        }

        // Usa el umbral dinámico si ya está calculado, si no, usa uno alto para no aceptar nada
        const MIN_THRESHOLD = 8000;
        const threshold = Math.max(dynamicThreshold > 0 ? dynamicThreshold : 999999, MIN_THRESHOLD);

        // LOG para ver el RMS y el umbral
        // console.log(`🔊 RMS: ${rms} | Umbral: ${threshold} | callSid: ${callSid}`);

        vad.processAudio(chunk, 8000).then(async (res: any) => {
          if (
            res === VAD.Event.VOICE &&
            rms > threshold &&
            isVoiceDominant(chunk, 8000) // <-- filtro por frecuencia
          ) {
            console.log(`✅ Chunk aceptado (VOZ dominante en frecuencia): RMS ${rms}`);
            audioBuffer.push(chunk);
            silenceChunks = 0;
          } else {
            silenceChunks++;
            if (audioBuffer.length * CHUNK_DURATION_MS > MIN_PHRASE_MS && silenceChunks >= SILENCE_LIMIT) {
              const phraseBuffer = Buffer.concat(audioBuffer);
              if (phraseBuffer.length < 2000) { // filtra frases muy cortas
                audioBuffer = [];
                return;
              }
              console.log(
                `📝 Frase detectada para llamada ${callSid}: ${audioBuffer.length} chunks, ${(audioBuffer.length * CHUNK_DURATION_MS) / 1000}s, tamaño ${phraseBuffer.length} bytes`
              );
              try {
                const wavBuffer = pcmToWav(phraseBuffer, 8000, 1); // 8000 Hz, mono
                const text = await transcribeWithDeepgram(wavBuffer);
                console.log(`📝 Transcripción Deepgram: ${text}`);
              } catch (err) {
                console.error("❌ Error transcribiendo con Deepgram:", err);
              }
              audioBuffer = [];
            }
          }
        });
      }
      if (msg.event === "stop") {
        // Procesa el buffer final si quieres
        if (audioBuffer.length > 0) {
          const phraseBuffer = Buffer.concat(audioBuffer);
          console.log(
            `📝 Frase final detectada para llamada ${callSid}: ${audioBuffer.length} chunks, ${(audioBuffer.length * CHUNK_DURATION_MS) / 1000}s, tamaño ${phraseBuffer.length} bytes`
          );
          if (phraseBuffer.length < 2000) { // ~0.25s de audio PCM 8kHz mono
            audioBuffer = [];
            return;
          }
          // transcribeWithASR(phraseBuffer, callSid);
        }
        audioBuffer = [];
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

function getRms(buffer: Buffer): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i += 2) {
    const sample = buffer.readInt16LE(i);
    sum += sample * sample;
  }
  return Math.sqrt(sum / (buffer.length / 2));
}

function isVoiceDominant(chunk: Buffer, sampleRate = 8000): boolean {
  // Convierte el buffer PCM a un arreglo de números
  const samples = [];
  for (let i = 0; i < chunk.length; i += 2) {
    samples.push(chunk.readInt16LE(i));
  }
  // FFT requiere longitud potencia de 2, recorta si es necesario
  const N = Math.pow(2, Math.floor(Math.log2(samples.length)));
  const input = samples.slice(0, N);

  const phasors = fft(input);
  const mags = fftUtil.fftMag(phasors);

  // Calcula la frecuencia de cada bin
  const freqs = mags.map((_: any, i: any) => i * sampleRate / N);

  // Suma la energía en el rango de voz humana (80–500 Hz)
  let voiceEnergy = 0;
  let totalEnergy = 0;
  for (let i = 0; i < mags.length; i++) {
    totalEnergy += mags[i];
    if (freqs[i] >= 80 && freqs[i] <= 500) {
      voiceEnergy += mags[i];
    }
  }
  // Si la energía de voz es al menos el 20% del total, lo consideramos voz dominante
  return (voiceEnergy / totalEnergy) > 0.15;
}

async function main() {
  await connectDB(MONGO_URI);
  // 🚀 Iniciar WhatsApp Web Bot
  // startWhatsappBot();

  server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🟢 WebSocket Twilio Media Streams en ws://localhost:${PORT}/ws/twilio-media-stream`);
  });
}

main();
