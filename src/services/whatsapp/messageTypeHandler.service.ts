import Chat from "../../models/chat.model";
import { responseIA } from "../../utils/ai";
import { sendTwilioMessage } from "../../utils/twilio";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { customFieldSchema } from "../../models/schema/customFieldSchema";
type CustomField = typeof customFieldSchema;

const transcribeAudio = async (audioUrl: string) => {
  try {
    // Paso 1: Descargar el archivo desde Twilio
    const audioResponse = await axios.get(audioUrl, {
      responseType: "arraybuffer",
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID || (() => { throw new Error("TWILIO_ACCOUNT_SID is not defined"); })(),
        password: process.env.TWILIO_AUTH_TOKEN || (() => { throw new Error("TWILIO_AUTH_TOKEN is not defined"); })(),
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
    const transcriptionResponse = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    fs.unlinkSync(tempFilePath);

    return transcriptionResponse.data;
  } catch (error) {
    console.error("Error al transcribir el audio:", (error as any).response?.data || (error as any).message);
    return "No pude transcribir el audio.";
  }
};

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
    // Procesar mensaje de audio
    const transcription = await transcribeAudio(MediaUrl0);
    systemMsg = `🎙️ Transcripción del audio: ${transcription}`;
  } else if (MessageType === "image" && MediaUrl0) {
    // Procesar mensaje de imagen
    systemMsg = `🖼️ El usuario compartió una imagen: ${MediaUrl0}`;
  } else if (MessageType === "video" && MediaUrl0) {
    // Procesar mensaje de video
    systemMsg = `🎥 El usuario compartió un video: ${MediaUrl0}`;
  } else if (MessageType === "location" && Latitude && Longitude) {
    // Procesar mensaje de ubicación
    const lat = parseFloat(Latitude);
    const lng = parseFloat(Longitude);
    systemMsg = `📍 El usuario compartió su ubicación: https://www.google.com/maps?q=${lat},${lng}`;
  } else {
    // Procesar mensaje de texto u otros tipos no manejados explícitamente
    systemMsg = Body;
  }

  chat.messages.push({
    direction: "inbound",
    body: systemMsg,
    respondedBy: "bot",
  });

  await chat.save();

  // Validar si IA está activa
  if (!customer.customFields.some((field: any) => field.key === "ai" && field.value)) {
    return { message: "El usuario no tiene activado el IA" };
  }

  const aiResponse = await responseIA(systemMsg, WaId);
  await sendTwilioMessage(WaId, aiResponse);

  chat.messages.push({
    direction: "outbound-api",
    body: aiResponse,
    respondedBy: "bot",
  });

  await chat.save();

  return { message: `${MessageType} procesado exitosamente.` };
};