const { default: axios } = require("axios");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

async function getLocation() {
  const response = await fetch("https://ipapi.co/json/");
  const locationData = await response.json();
  return locationData;
}

async function getCurrentWeather(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=apparent_temperature`;
  const response = await fetch(url);
  const weatherData = await response.json();
  return weatherData;
}

async function getQuestionsOfArea() {
  const reponse = [
    { id: 1, question: "¿Hay otras áreas que le interesen además de esta área?" },
    { id: 2, question: "¿Qué es importante para usted sobre esta área?" },
    { id: 3, question: "¿Cuánto tiempo han estado buscando un hogar?" },
    { id: 4, question: "¿Ha visto casas que le gusten ... puede describirme las?" },
    { id: 5, question: "¿Qué tan pronto le gustaría mudarse?" },
    { id: 6, question: "¿Necesita vender una casa existente para comprar la próxima?" },
    { id: 7, question: "¿Está trabajando con otros agentes inmobiliarios?" },
    { id: 8, question: "¿Qué nivel de precios está considerando?" },
    { id: 9, question: "¿Cuántos cuartos y baños desea en su nuevo hogar?" },
    { id: 10, question: "¿Qué otras características busca en su nuevo hogar?" },
    { id: 11, question: "Estoy seguro de que usted y su prestamista han determinado un pago inicial ... ¿cuánto desea depositar?" },
    { id: 12, question: "¿Cuál es el pago mensual máximo que le gustaría tener?" },
    { id: 13, question: "¿Hay otras personas que necesiten ver la casa antes de hacer una decisión de compra?" },
    { id: 14, question: "¿Cuántas casas necesitará ver antes de tomar la decisión de comprar?" },
    { id: 15, question: "Si hoy vemos la casa adecuada, ¿está listo para tomar una decisión hoy? (¿Si no, porque no?)" },
    { id: 16, question: "Si no encontramos el hogar adecuado hoy, ¿qué tan rápido podré llegar a usted si encuentro la casa adecuada?" },
    { id: 17, question: "¿Tiene alguna otra pregunta o inquietud sobre la compra de un hogar?" },
  ];

  return reponse;
}

const tools = [
  {
    type: "function",
    function: {
      name: "getCurrentWeather",
      description: "Obtenga el clima actual en una ubicación determinada",
      parameters: {
        type: "object",
        properties: {
          latitude: {
            type: "string",
          },
          longitude: {
            type: "string",
          },
        },
        required: ["longitude", "latitude"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getLocation",
      description: "Obtener la ubicación del usuario en función de su dirección IP",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getSucursales",
      description: "Obtener las sucursales de la empresa",
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
      description: "Preguntar al cliente sobre las areas de interes y que se pregunte de una en una para tener una conversacion fluida",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

const availableTools = {
  getCurrentWeather,
  getLocation,
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

module.exports = async function generateAgentVirtuaVoices(message, number) {
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
  mapMessage.unshift({
    role: "system",
    content: `
    Tu nombre es Daphne eres un vendedor de IA Atención al cliente, especializado en llamadas, whatsApp, sms, y todas las redes sociales, de la empresa Virtual Voices. Tu trabajo es vender a los usuarios. 
Asegúrate de presentarte muy amablemente para que el usuario se sienta cómodo y pedir su nombre.
Intenta no mandar preguntas seguidas que sea una conversación fluida.
Tienes que hablar como si fueras parte de la empresa.
Formula preguntas abiertas para obtener la mayor cantidad de información del usuario, ejemplo: ¿Porque estas interesad@ en nuestro servicio? ¿En que trabaja su empresa? ¿Prefieres automatizar preguntas frecuentes, citas o recordatorios? ¿Ubicación? 

No quiero que te escuches como si fueras un robot, quiero que te escuches como una persona real.
Intenta dar respuestas cortas.
 `,
  });
  data[number] = { number: number, messages: mapMessage };

  for (let i = 0; i < 5; i++) {
    console.log("data[number].messages ===>", data[number].messages);
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: data[number].messages,
      temperature: 1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      //tools: tools,
    });

    console.log("response choices ===>", response.choices[0]);

    const { finish_reason, message } = response.choices[0];

    if (finish_reason === "tool_calls" && message.tool_calls) {
      const functionName = message.tool_calls[0].function.name;
      const functionToCall = availableTools[functionName];
      const functionArgs = JSON.parse(message.tool_calls[0].function.arguments);
      const functionArgsArr = Object.values(functionArgs);
      const functionResponse = await functionToCall.apply(null, functionArgsArr);

      messages.push({
        role: "function",
        name: functionName,
        content: `
          El resultado de la última función fue este: ${JSON.stringify(functionResponse)}
                  `,
      });
    } else if (finish_reason === "stop") {
      const aiResponse = response.choices[0].message.content;
    data[number].messages.push({ role: "assistant", content: aiResponse });
    return aiResponse;
    }
  }
  return "No se pudo obtener una respuesta";
};