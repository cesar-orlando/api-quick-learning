import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export const sendTwilioMessage = async (to: string, body: string) => {
  try {
    const message = await client.messages.create({
      body,
        from: "whatsapp:+5213341610749", // Número de Twilio habilitado para WhatsApp
    //   from: "whatsapp:+14155238886", // Número de Twilio habilitado para WhatsApp
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

export default client;
