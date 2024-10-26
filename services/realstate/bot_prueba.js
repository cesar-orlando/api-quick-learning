const axios = require("axios");
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Funciones de información de propiedades
async function getHouseInfo() {
  return "🏠 Casa Toledo: detalles...";
}

async function getQuestionsOfArea() {
  return "🏡 Casa Nature Bosque: detalles...";
}

const tools = {
  getHouseInfo,
  getQuestionsOfArea,
};

module.exports = async function agentOfRealState(message, number, count) {
  try {
    // 1. Obtén el historial de mensajes recientes del cliente
    let response = await axios.post("http://localhost:3000/api/v2/whastapp/logs-messages", {
      to: number,
    });

    // 2. Crear el arreglo de mensajes de OpenAI con el historial y el mensaje combinado
    let userMessages = response.data.findMessages.reverse().slice(-count).map(msg => ({
      role: msg.direction === "outbound-api" ? "assistant" : "user",
      content: msg.body,
    }));

    userMessages.push({ role: "user", content: message }); // Agregar el mensaje combinado al final

    userMessages.unshift({
      role: "system",
      content: "Eres Daphne, una agente de ventas de bienes raíces amigable y servicial.",
    });

    // 3. Enviar el historial y el mensaje a OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: userMessages,
    });

    const aiMessage = aiResponse.choices[0].message.content;
    console.log("AI Response:", aiMessage); // Verificar la respuesta de IA

    // 4. Determinar si es necesario llamar a una función específica
    if (aiMessage.includes("Toledo")) {
      return tools.getHouseInfo();
    } else if (aiMessage.includes("Nature")) {
      return tools.getQuestionsOfArea();
    } else {
      return aiMessage; // Devolver la respuesta directa de OpenAI si no es una función específica
    }
  } catch (error) {
    console.error("Error en agentOfRealState:", error.message);
    return "Lo siento, hubo un problema al procesar tu solicitud. Por favor intenta de nuevo.";
  }
};
