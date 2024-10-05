const { default: axios } = require("axios");
const OpenAI = require("openai");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

async function getHouseInfo() {
  try {
    return 1;
  } catch (error) {
    console.log("error.message --->", error);
    return error;
  }
}

async function getQuestionsOfArea() {
  try {
    return 2;
  } catch (error) {
    console.log("error.message --->", error);
    return error;
  }
}

const tools = [
  {
    type: "function",
    function: {
      name: "getHouseInfo",
      description: "Mandar información de la casa Toledo",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getQuestionsOfArea",
      description: "Mandar información de la casa Nature Bosque Residencial",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

const availableTools = {
  getHouseInfo,
  getQuestionsOfArea,
};

const messages = [
  {
    role: "system",
    content: `Tu nombre es Daphne eres vendedora de IA en el cual se encarga de atención al cliente, al empresa automatiza los mensajes whatsApp, sms, llamadas, etc... La empresa se llama Virtual Voices.
    Tienes que dar mensajes como si fueras una persona real, por ejemplo:
    "¡Qué tal! Soy Daphne de Virtual Voices, y me encantaría saber más sobre cómo podemos ayudarte. Cuéntame, ¿qué te interesa de nuestro servicio?"
    `,
  },
];

module.exports = async function agentOfRealState(message, number, count) {
  let data = {};

  let numberData = JSON.stringify({
    to: number,
  });
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "http://localhost:3000/api/v2/whastapp/logs-messages",
    headers: {
      "Content-Type": "application/json",
    },
    data: numberData,
  };
  const response = await axios.request(config);
  //Acomoda los mensajes en un array que se pueda enviar a OpenAI
  let mapMessage = response.data.findMessages.toReversed().map((message) => {
    return {
      role: message.direction === "outbound-api" ? "assistant" : "user",
      content: message.body,
    };
  });
  console.log("count --->", count);
  // Obtiene los últimos 'count' mensajes
  mapMessage = mapMessage.slice(-count);

  // Combina los mensajes en una sola cadena
  let combinedMessage = mapMessage.map((message) => message.content).join(" ");

  console.log("combinedMessage --->", combinedMessage);

  mapMessage.unshift({
    role: "system",
    content: `
    Tu nombre es Daphne eres un vendedor de Bienes y Raices. Tu trabajo es vender a los usuarios. 
    Asegúrate de presentarte muy amablemente para que el usuario se sienta cómodo y pedir su nombre.
    Intenta no mandar preguntas seguidas que sea una conversación fluida.
    Formula preguntas abiertas para obtener la mayor cantidad de información del usuario.

    No quiero que te escuches como si fueras un robot, quiero que te escuches como una persona real.
    Intenta dar respuestas cortas.
 `,
  });
  data[number] = { number: number, messages: mapMessage };

  for (let i = 0; i < 5; i++) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: data[number].messages,
      temperature: 1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      tools: tools,
    });

    const { finish_reason, message } = response.choices[0];

    if (finish_reason === "tool_calls" && message.tool_calls) {
      const functionName = message.tool_calls[0].function.name;
      const functionToCall = availableTools[functionName];
      const functionArgs = JSON.parse(message.tool_calls[0].function.arguments);
      const functionArgsArr = Object.values(functionArgs);
      const functionResponse = await functionToCall.apply(null, functionArgsArr);

      const iaResponse = functionResponse;

      data[number].messages.push({
        role: "function",
        name: functionName,
        content: iaResponse,
      });
      return iaResponse;
    } else if (finish_reason === "stop") {
      const aiResponse = response.choices[0].message.content;
      data[number].messages.push({ role: "assistant", content: aiResponse });
      return aiResponse;
    }
  }
  return "No se pudo obtener una respuesta";
};
