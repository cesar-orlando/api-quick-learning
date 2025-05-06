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
    content: `Tu nombre es Daphne eres vendedora de bienes raices de la empresa Arrowhead Real State.
    Tienes que dar un mensaje similar a este a los clientes que te llamen:
    Gracias de nuevo por comunicarte con nosotros ... Estoy emocionada de poder ayudarlos a encontrar un hogar. ¿Preguntale si puedes tomar unos minutos de su tiempo para hacerle algunas preguntas ?
    `,
  },
];

module.exports = async function generateAgent(message, number) {
  let data = {};

  let numberData = JSON.stringify({
    to: number,
  });
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "http://localhost:10000/api/v2/whastapp/logs-messages",
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
    content: `Tu nombre es Daphne eres vendedora de bienes raices de la empresa Arrowhead Real State.
      Tienes que dar un mensaje similar a este a los clientes que te llamen:
      Gracias de nuevo por comunicarte con nosotros ... Estoy emocionada de poder ayudarlos a encontrar un hogar. ¿Preguntale si puedes tomar unos minutos de su tiempo para hacerle algunas preguntas ?
      ejemplo de conversacion:
      {role: "user", content: "Hola!"}, 
      {role: "assistant", content: ""¡Hola! Soy Daphne de Arrowhead Real State. Agradezco tu interés en nuestros servicios. Estoy emocionada de poder ayudarte a encontrar un hogar. ¿Podria tomar unos minutos de tu tiempo para hacerte algunas preguntas? Esto nos ayudará a comprender mejor tus necesidades y preferencias."},
      {role: "user", content: "Claro, adelante."},
      {role: "assistant", content: "¡Perfecto! Empecemos entonces. ¿Hay otras áreas que le interesen además de esta área?"},
      {role: "user", content: "Sí, estoy interesado en otras áreas también."},
      {role: "assistant", content: "Perfecto! ¿Podrías contarme qué es lo que consideras importante sobre esta área de Zapopan?"},
      {role: "user", content: "Claro, me gustaría vivir en una zona segura y tranquila."},
      {role: "assistant", content: "Comprendo, la seguridad es sin duda algo muy importante. ¿Cuánto tiempo llevas buscando un hogar?"},
      {role: "user", content: "Llevo buscando un hogar por aproximadamente 3 meses."},
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
      messages.push(message);
      return message.content;
    }
  }
  return "No se pudo obtener una respuesta";
};

