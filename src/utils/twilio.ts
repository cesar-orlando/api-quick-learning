import twilio from "twilio";
import { updateLastMessage } from "../controllers/chat.controller";
import Chat from "../models/chat.model";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export const sendTwilioMessage = async (to: string, body: string) => {
  try {
    const message = await client.messages.create({
      body,
      from: "whatsapp:+5213341610749", // Número de Twilio habilitado para WhatsApp
        // from: "whatsapp:+14155238886", // Número de Twilio habilitado para WhatsApp
      to: `whatsapp:${to}`, // Asegúrate de que el número del destinatario esté en formato WhatsApp
    });
    console.log("✅ Mensaje enviado exitosamente:", message.sid);
    return message;
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error al enviar el mensaje twilio:", error.message);
    } else {
      console.error("❌ Error al enviar el mensaje:", error);
    }
    throw new Error("No se pudo enviar el mensaje al cliente.");
  }
};

/**
 * Envía un mensaje de plantilla de WhatsApp mediante Twilio.
 *
 * @param phone - Número del destinatario en formato internacional (sin +, pero con código país)
 * @param templateId - El contentSid de la plantilla aprobada en Twilio
 * @param variables - Arreglo de variables que se insertarán en el template ({{1}}, {{2}}, etc.)
 * @returns El objeto de respuesta de Twilio o null si falló
 */
export const sendTemplateMessage = async (phone: string, templateId: string, variables: string[]): Promise<any> => {
  try {
    const response = await client.messages.create({
      to: `whatsapp:${phone}`,
      from: `whatsapp:+5213341610749`, // Número de Twilio habilitado para WhatsApp
      contentSid: templateId,
      contentVariables: JSON.stringify(
        variables.reduce((acc, val, i) => {
          acc[(i + 1).toString()] = val;
          return acc;
        }, {} as Record<string, string>)
      ),
    });

    console.log("response", response);
    console.log("response.body", response.body);

    let chat = await Chat.findOne({ phone });
    if (!chat) {
      chat = new Chat({
        phone,
        linkedTable: {
          refModel: "DynamicRecord",
          refId: phone,
        },
        conversationStart: new Date(),
      });
    }
    chat.messages.push({
      direction: "outbound-api",
      body: response.body,
      respondedBy: "asesor",
    });
    await chat.save();
    const dateNow = new Date();
    await updateLastMessage(phone, response.body, dateNow, "asesor");
    console.log("✅ Mensaje de plantilla enviado exitosamente:", response.sid);

    return response;
  } catch (error) {
    console.error("❌ Error al enviar template con Twilio:", error);
    return null;
  }
};

export const sendPayment = async (phone: string): Promise<any> => {
  try {
    const response = await client.messages.create({
      to: `whatsapp:${phone}`,
      from: `whatsapp:+5213341610749`, // Número de Twilio habilitado para WhatsApp
      contentSid: "HX1df87ec38ef585d7051f805dec8a395b",
    });
    return response;
  } catch (error) {
    console.error("❌ Error al enviar template con Twilio:", error);
    return null;
  }
};

export default client;
