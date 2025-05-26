import Call from "../models/call.model";
import { Request, Response } from "express";
import { User } from "../models/user.model";
import { findOrCreateCustomer } from "./record.controller";
import axios from "axios";

// Normaliza el número igual que en el resto del sistema
function normalizePhone(phone: string): string {
  let clean = phone.replace(/[^\d]/g, "");
  if (clean.startsWith("521") && clean.length === 13) return clean;
  if (clean.startsWith("52") && clean.length === 12) return "521" + clean.slice(2);
  if (clean.length === 10) return "521" + clean;
  if (clean.length === 11 && clean.startsWith("1")) return "52" + clean;
  return clean;
}

export const getCallsByPhone = async (req: Request, res: Response) => {
  try {
    const phone = normalizePhone(req.params.phone);
    const calls = await Call.find({ phone }).sort({ startTime: -1 });

    // Traer datos de ElevenLabs para cada llamada
    const callsWithConvo = await Promise.all(
      calls.map(async (call) => {
        let elevenConversation = null;
        let elevenAudioUrl = null;
        try {
          // Trae la conversación
          const convoResp = await axios.get(
            `https://api.elevenlabs.io/v1/convai/conversations/${call.elevenConversationId}`,
            { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY_VV } }
          );
          elevenConversation = convoResp.data;

          // Trae el audio (puedes devolver la URL o el buffer, aquí solo la URL)
          elevenAudioUrl = `https://api.elevenlabs.io/v1/convai/conversations/${call.elevenConversationId}/audio`;
        } catch (err) {
          // Si falla ElevenLabs, solo ignora y sigue
        }
        return {
          ...call.toObject(),
          elevenConversation,
          elevenAudioUrl,
        };
      })
    );

    res.json({ success: true, calls: callsWithConvo });
  } catch (err) {
    res.status(500).json({ success: false, error: "Error al obtener llamadas y conversaciones" });
  }
};

export async function saveCallInternal(
  phone: string,
  twilioConversationId: string,
  elevenConversationId: string
) {
  // Normaliza el número antes de cualquier operación
  const normalizedPhone = normalizePhone(phone);

  // 🔍 Buscar o crear el cliente con el número normalizado
  const record = await findOrCreateCustomer(normalizedPhone, "Llamada");

  // 🔍 Obtener asesor activo
  const activeUsers = await User.find({ status: true, role: "sales" });
  const activeUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];

  // 💾 Guardar llamada
  const newCall = await Call.create({
    phone: normalizedPhone,
    twilioConversationId,
    elevenConversationId,
    linkedTable: {
      refModel: "DynamicRecord",
      refId: record._id,
    },
    advisor: {
      id: activeUser?._id,
      name: activeUser?.name,
    },
  });

  return newCall;
}