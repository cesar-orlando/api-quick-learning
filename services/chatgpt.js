require("dotenv").config();
const OpenAI = require("openai");
const { quickLearningCourses, student_custom_functions, dataChatGpt } = require("../db/data");
const { default: axios } = require("axios");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


module.exports = async function generatePersonalityResponse(message, number) {
  try {
    // 1. Obtener el historial de mensajes recientes del cliente
    let response = await axios.post("http://localhost:3000/api/v2/whastapp/logs-messages", {
      to: number,
    });

    // 2. Crear el arreglo de mensajes para OpenAI con el historial y el mensaje combinado
    let userMessages = response.data.findMessages.reverse().map(msg => ({
      role: msg.direction === "outbound-api" ? "assistant" : "user",
      content: msg.body,
    }));

    // Agrega el mensaje combinado actual al final del historial
    userMessages.push({ role: "user", content: message });

    // 3. Configura el mensaje de sistema para OpenAI para dar contexto
    userMessages.unshift({
      role: "system",
      content: "Eres Daphne, una asistente amable y servicial que responde preguntas de bienes raíces. Ayuda a los usuarios con información clara y profesional.",
    });

    // 4. Llama a OpenAI para generar una respuesta basada en el historial y el mensaje combinado
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: userMessages,
      temperature: 0.7, // Menor aleatoriedad para respuestas más consistentes
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // 5. Obtener el contenido de la respuesta de OpenAI
    const aiResponse = completion.choices[0].message.content;
    console.log("Respuesta de OpenAI:", aiResponse); // Verificar la respuesta obtenida

    // 6. Retornar la respuesta generada por la IA
    return aiResponse;
  } catch (error) {
    console.error("Error en generatePersonalityResponse:", error.message);
    return "Lo siento, no he podido procesar tu mensaje. Un agente se comunicará contigo pronto.";
  }
};
