import Chat from "../../models/chat.model";
import { responseIA } from "../../utils/ai";
import { sendTwilioMessage } from "../../utils/twilio";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { customFieldSchema } from "../../models/schema/customFieldSchema";
import { updateLastMessage } from "../../controllers/chat.controller";
type CustomField = typeof customFieldSchema;

const transcribeAudio = async (audioUrl: string) => {
  try {
    // Paso 1: Descargar el archivo desde Twilio
    const audioResponse = await axios.get(audioUrl, {
      responseType: "arraybuffer",
      auth: {
        username:
          process.env.TWILIO_ACCOUNT_SID ||
          (() => {
            throw new Error("TWILIO_ACCOUNT_SID is not defined");
          })(),
        password:
          process.env.TWILIO_AUTH_TOKEN ||
          (() => {
            throw new Error("TWILIO_AUTH_TOKEN is not defined");
          })(),
      },
    });

    const audioBuffer = Buffer.from(audioResponse.data, "binary");
    const tempFilePath = `temp_audio_${Date.now()}.ogg`;

    fs.writeFileSync(tempFilePath, audioBuffer);

    // Paso 3: Crear el formulario multipart
    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempFilePath));
    formData.append("model", "whisper-1");
    formData.append("response_format", "text");

    // Paso 4: Enviar el archivo al modelo Whisper de OpenAI
    const transcriptionResponse = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    fs.unlinkSync(tempFilePath);

    return transcriptionResponse.data;
  } catch (error) {
    console.error("Error al transcribir el audio:", (error as any).response?.data || (error as any).message);
    return "No pude transcribir el audio.";
  }
};

// Buffer y temporizadores por usuario
const messageBuffers = new Map<string, { messages: string[]; timeout: NodeJS.Timeout }>();

export const handleMessageType = async (body: any, customer: any) => {
  const { WaId, MessageType, Latitude, Longitude, MediaUrl0, MediaContentType0, Body } = body;

  let chat = await Chat.findOne({ phone: WaId });
  if (!chat) {
    chat = new Chat({
      phone: WaId,
      linkedTable: {
        refModel: "DynamicRecord",
        refId: customer._id,
      },
      conversationStart: new Date(),
    });
  }

  let systemMsg = "";

  if (MessageType === "audio" && MediaUrl0) {
    const transcription = await transcribeAudio(MediaUrl0);
    systemMsg = `🎙️ Transcripción del audio: ${transcription}`;
  } else if (MessageType === "image" && MediaUrl0) {
    systemMsg = `🖼️ El usuario compartió una imagen: ${MediaUrl0}`;
  } else if (MessageType === "video" && MediaUrl0) {
    systemMsg = `🎥 El usuario compartió un video: ${MediaUrl0}`;
  } else if (MessageType === "location" && Latitude && Longitude) {
    const lat = parseFloat(Latitude);
    const lng = parseFloat(Longitude);
    systemMsg = `📍 El usuario compartió su ubicación: https://www.google.com/maps?q=${lat},${lng}`;
  } else {
    systemMsg = Body;
  }

  chat.messages.push({
    direction: "inbound",
    body: systemMsg,
    respondedBy: "human",
  });

  await chat.save();
  const dateNow = new Date();
  await updateLastMessage(WaId, Body, dateNow, "human");

  // Validar si IA está activa
  if (!customer.customFields.some((field: any) => field.key === "ai" && field.value)) {
    return { message: "El usuario no tiene activado el IA" };
  }

  // --- BUFFER DE MENSAJES ---
  if (!messageBuffers.has(WaId)) {
    messageBuffers.set(WaId, { messages: [], timeout: null as any });
  }
  const buffer = messageBuffers.get(WaId)!;
  buffer.messages.push(systemMsg);

  if (buffer.timeout) {
    clearTimeout(buffer.timeout);
  }

  buffer.timeout = setTimeout(async () => {
    const allMsgs = buffer.messages.join("\n");
    const aiResponse = await responseIA(allMsgs, WaId);
    await sendTwilioMessage(WaId, aiResponse);

    chat.messages.push({
      direction: "outbound-api",
      body: aiResponse,
      respondedBy: "bot",
    });

    await chat.save();
    await updateLastMessage(WaId, Body, new Date(), "bot");

    // Limpiar buffer
    messageBuffers.delete(WaId);
  }, 15000);

  return { message: `${MessageType} recibido y encolado para respuesta IA.` };
};
