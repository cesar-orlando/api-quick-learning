require("dotenv").config();
const OpenAI = require("openai");
const { default: axios } = require("axios");
const { dataRealStateMxn } = require("../../db/realstate_mxn");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


module.exports = async function agentOfRealState(message, number) {
  try {
    // 1. Obtén el contexto inicial desde la base de datos, si es necesario
    const initialContext = await dataRealStateMxn(); // Contexto de bienvenida o presentación, si aplica

    // 2. Verifica si el número ya está en la base de datos y prepara la configuración para obtener el historial de mensajes
    let numberData = JSON.stringify({ to: number });
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "http://localhost:3000/api/v2/whastapp/logs-messages",
      headers: { "Content-Type": "application/json" },
      data: numberData,
    };

    // 3. Obtener el historial de mensajes del usuario
    const response = await axios.request(config);
    let mapMessage = response.data.findMessages.reverse().map((msg) => ({
      role: msg.direction === "outbound-api" ? "assistant" : "user",
      content: msg.body,
    }));

    // 4. Agregar el mensaje combinado actual y el contexto de la escuela de inglés
    mapMessage.unshift({
      role: "system",
      content: initialContext || "Tu nombre es Daphne eres vendedora de bienes raices de la empresa Arrowhead Real State. Gracia por comunicarte con nosotros y pides el nombre del cliente.",
    });
    mapMessage.push({ role: "user", content: message });

    // 5. Llama a OpenAI para generar una respuesta basada en el historial y el mensaje combinado
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: mapMessage,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // 6. Obtiene y devuelve la respuesta de OpenAI
    const aiResponse = completion.choices[0].message.content;
    console.log("Respuesta de OpenAI:", aiResponse); // Depuración de la respuesta

    return aiResponse;
  } catch (error) {
    console.error("Error en generatePersonalityResponse:", error.message);
    return ;
  }
};
