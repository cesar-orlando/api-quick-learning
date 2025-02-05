require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs");
const FormData = require("form-data");
const geolib = require("geolib");
const { default: axios } = require("axios");
const { quickLearningCourses, student_custom_functions, dataChatGpt } = require("../db/data");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tools (funciones que OpenAI puede llamar automáticamente)
const tools = [
  {
    type: "function",
    function: {
      name: "get_start_dates",
      description: "Devuelve las fechas de inicio de los cursos de Quick Learning.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_school_locations",
      description: "Proporciona la dirección y ubicación de las sucursales de Quick Learning.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "report_teacher_issue",
      description: "Recibe una queja de algo que le paso en la escuela y proporciona instrucciones para reportarlo.",
      parameters: {
        type: "object",
        properties: {
          issue_details: {
            type: "string",
            description: "Detalles de la queja o problema con el maestro.",
          },
        },
        required: ["issue_details"],
      },
    },
  },
 /*  {
    type: "function",
    function: {
      name: "get_course_prices",
      description: "Devuelve los precios de los cursos disponibles.",
      parameters: {
        type: "object",
        properties: {
          course_type: {
            type: "string",
            enum: ["intensivo", "semi-intensivo", "sabatino"],
            description: "Tipo de curso para obtener su precio.",
          },
        },
        required: ["course_type"],
      },
    },
  }, */
];

// Funciones para cada tool
const get_start_dates = async (requestedDate = null, isGenericRequest = false) => {
  try {
    // Configuración de la petición al API
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "http://localhost:3000/api/v1/datecourses",
      headers: {},
    };

    // Petición al API
    const response = await axios.request(config);

    // Obtener la fecha de hoy
    const today = new Date();

    // Filtrar solo los cursos de "Semana 1" que sean futuros
    let startCourses = response.data.dateCourses
      .filter((course) => course.type === 1 && new Date(course.date) >= today)
      .map((course) => new Date(course.date)) // Convertimos las fechas a objetos Date
      .sort((a, b) => a - b); // Ordenamos las fechas de menor a mayor

    if (startCourses.length === 0) {
      return "No hay semanas de inicio de curso programadas en las próximas fechas.";
    }

    // Agrupar por semanas exactas de inicio
    let weeks = [];
    let currentWeek = [];

    startCourses.forEach((date, index) => {
      if (currentWeek.length === 0) {
        currentWeek.push(date);
      } else {
        let lastDate = currentWeek[currentWeek.length - 1];
        let diffDays = (date - lastDate) / (1000 * 60 * 60 * 24); // Diferencia en días

        if (diffDays === 1) {
          currentWeek.push(date);
        } else {
          weeks.push([...currentWeek]); // Guardamos la semana anterior
          currentWeek = [date]; // Empezamos una nueva semana
        }
      }

      // Agregar la última semana acumulada
      if (index === startCourses.length - 1) {
        weeks.push([...currentWeek]);
      }
    });

    // **1. Si es una consulta genérica (Ej: "¿Qué otras fechas tienes?")**
    if (isGenericRequest) {
      return "📢 ¿Para qué fecha te gustaría empezar? Puedo revisar las semanas disponibles a partir de ese mes o día específico. 😊";
    }

    // **2. Si el cliente NO ha solicitado una fecha específica, mostrar solo la PRÓXIMA semana**
    if (!requestedDate) {
      const firstWeek = weeks[0];
      const start = firstWeek[0].toLocaleDateString("es-ES");
      const end = firstWeek[firstWeek.length - 1].toLocaleDateString("es-ES");

      return `📢 ¡Tenemos cupo disponible para la próxima semana de inicio de curso!\n📅 *${start} - ${end}*\n\n🎯 No pierdas la oportunidad de empezar tu aprendizaje cuanto antes. ¿Te gustaría que te ayude con tu inscripción ahora mismo?`;
    }

    // **3. Si el cliente proporciona una fecha, mostrar semanas después de esa fecha**
    let requestedDateObj = new Date(requestedDate);
    let filteredWeeks = weeks.filter((week) => week[0] >= requestedDateObj);

    if (filteredWeeks.length === 0) {
      return "No hay semanas de inicio disponibles después de la fecha indicada.";
    }

    let message = "Estas son las próximas semanas de inicio de curso disponibles:\n";
    filteredWeeks.forEach((week) => {
      const start = week[0].toLocaleDateString("es-ES");
      const end = week[week.length - 1].toLocaleDateString("es-ES");
      message += `📅 ${start} - ${end}\n`;
    });

    return `${message}\n📢 ¡Aprovecha tu lugar antes de que se agoten los cupos! ¿Te ayudo a asegurar tu inscripción ahora mismo?`;
  } catch (error) {
    console.error("Error al obtener las semanas de inicio de cursos:", error.message);
    return "No pude obtener la información de inicio de cursos en este momento. Inténtalo más tarde.";
  }
};


const get_school_locations = async (userLocation = null) => {
  try {
    // Petición al API de sedes
    let configSedes = {
      method: "get",
      maxBodyLength: Infinity,
      url: "http://localhost:3000/api/v1/sedes",
      headers: {},
    };

    const responseSedes = await axios.request(configSedes);
    const sedes = responseSedes.data; // Lista de sedes

    // **Caso 1: Si el usuario no proporciona ubicación**
    if (!userLocation) {
      return "📍 Para recomendarte la mejor sucursal, por favor dime en qué ciudad te encuentras. 😊";
    }

    // **Caso 2: Si el usuario proporciona ubicación, buscar la sede más cercana**
    let closestSede = null;
    let shortestDistance = Infinity;

    sedes.forEach((sede) => {
      const sedeLocation = geolib.convertAddressToGPS(sede.address); // Convertir dirección a coordenadas GPS
      const distance = geolib.getDistance(userLocation, sedeLocation);

      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestSede = sede;
      }
    });

    if (!closestSede) {
      return "No pude encontrar una sucursal cercana. 😔 Pero dejame preguntar a un asesor para que nos ayude.";
    }

    // **Respuesta con la sede más cercana**
    return `✅ La sucursal más cercana a ti es:\n🏫 *${closestSede.name}*\n📍 Dirección: ${closestSede.address}\n📞 Teléfono: ${closestSede.phone}\n\n¿Te gustaría que te ayude con más información o agendar una visita? 😊`;
  } catch (error) {
    console.error("Error al obtener las sedes:", error.message);
    return "No pude obtener la información de sedes en este momento. Inténtalo más tarde.";
  }
};

const report_teacher_issue = (issueDetails) => {
  return `⚠️ *Lamentamos escuchar esto.* Queremos ayudarte lo más rápido posible. Para dar seguimiento a tu reporte, por favor envíanos la siguiente información:\n\n📝 *Nombre completo*\n🏫 *Sucursal donde estás inscrito*\n📚 *Curso que estás tomando*\n⏰ *Horario en el que asistes*\n📢 *Detalles del problema:* "${issueDetails}"\n🎫 *Número de alumno*\n\nCon esta información, nuestro equipo podrá revisar tu caso y darte una solución lo antes posible. ¡Estamos para ayudarte! 😊`;
};

/* const get_course_prices = (courseType) => {
  const prices = {
    intensivo: "$5,150 MXN",
    "semi-intensivo": "$3,310 MXN",
    sabatino: "$3,310 MXN",
  };

  return `El precio del curso ${courseType} es ${prices[courseType]}. Puedes ver más información en https://quicklearning.com/precios.`;
}; */

const transcribeAudio = async (audioUrl) => {
  try {
    // Paso 1: Descargar el archivo desde Twilio
    const audioResponse = await axios.get(audioUrl, {
      responseType: "arraybuffer",
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID, // SID de Twilio
        password: process.env.TWILIO_AUTH_TOKEN, // Auth Token de Twilio
      },
    });

    console.log("Audio descargado:", audioResponse.data);

    // Paso 2: Crear un archivo temporal con el Buffer descargado
    const audioBuffer = Buffer.from(audioResponse.data, "binary");
    const tempFilePath = `temp_audio_${Date.now()}.ogg`;

    fs.writeFileSync(tempFilePath, audioBuffer);
    console.log(`Archivo temporal creado: ${tempFilePath}`);

    // Paso 3: Crear el formulario multipart
    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempFilePath)); // Leer el archivo temporal
    formData.append("model", "whisper-1");
    formData.append("response_format", "text");

    console.log("Formulario creado, enviando a OpenAI...");

    // Paso 4: Enviar el archivo al modelo Whisper de OpenAI
    const transcriptionResponse = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Clave de OpenAI
      },
    });

    console.log("Respuesta de OpenAI:", transcriptionResponse.data);

    // Paso 5: Eliminar el archivo temporal después de usarlo
    fs.unlinkSync(tempFilePath);
    console.log(`Archivo temporal eliminado: ${tempFilePath}`);

    return transcriptionResponse.data;
  } catch (error) {
    console.error("Error al transcribir el audio:", error.response?.data || error.message);
    return "No pude transcribir el audio.";
  }
};

const analyzeImage = async (imageUrl) => {
  try {
    // Aquí puedes usar un servicio externo (Google Vision, etc.) para analizar imágenes.
    return "Se recibió una imagen. Procesando análisis...";
  } catch (error) {
    console.error("Error al analizar la imagen:", error.message);
    return "No pude analizar la imagen.";
  }
};

module.exports = async function generatePersonalityResponse(message, number, mediaType, mediaUrl) {
  try {
    let processedMessage = message;

    // Si hay contenido multimedia, procesarlo antes de enviar a OpenAI
    if (mediaType && mediaUrl) {
      if (mediaType.startsWith("audio")) {
        console.log("processedMessage Antes:", processedMessage);

        // Transcribir el audio
        const audioTranscription = await transcribeAudio(mediaUrl);

        console.log("audioTranscription:", audioTranscription);

        // Verificar si la transcripción tiene texto válido
        const transcriptionText = audioTranscription || "No se encontró texto en el archivo de audio.";
        processedMessage = transcriptionText;

        console.log("processedMessage Después:", processedMessage);
      } else if (mediaType.startsWith("image")) {
        const imageAnalysis = await analyzeImage(mediaUrl);
        processedMessage += `\n[Análisis de la imagen]: ${imageAnalysis}`;
      } else {
        processedMessage += `\n[Contenido recibido: ${mediaType} en ${mediaUrl}]`;
      }
    }

    // 1. Obtén el contexto inicial desde la base de datos, si es necesario
    const initialContext = await dataChatGpt(); // Contexto de bienvenida o presentación, si aplica

    // 2. Obtener historial de mensajes del usuario
    let numberData = JSON.stringify({ to: number });
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "http://localhost:3000/api/v2/whastapp/logs-messages",
      headers: { "Content-Type": "application/json" },
      data: numberData,
    };

    const response = await axios.request(config).catch((error) => {
      console.error("Error al obtener el historial de mensajes:", error.message);
      return { data: { findMessages: [] } };
    });
    let mapMessage = response.data.findMessages.reverse().map((msg) => ({
      role: msg.direction === "outbound-api" ? "assistant" : "user",
      content: msg.body,
    }));

    // 3. Agregar el contexto y el mensaje actual
    mapMessage.unshift({
      role: "system",
      content:
        initialContext ||
        "Eres Natalia, una asistente de Quick Learning, una escuela de inglés. Responde preguntas sobre cursos, horarios, modalidades de estudio (presencial, virtual) y cualquier duda sobre el programa de inglés de manera amable y profesional.",
    });
    mapMessage.push({ role: "user", content: processedMessage });

    // 4. Llamada a OpenAI con tools y contexto
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: mapMessage,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 2,
      presence_penalty: 0,
      tools: tools,
      tool_choice: "auto",
    });

    const toolCall = completion.choices[0].message.tool_calls?.[0];

    if (toolCall) {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      switch (functionName) {
        case "get_start_dates":
          return get_start_dates();
        case "get_school_locations":
          return get_school_locations();
        case "report_teacher_issue":
          return report_teacher_issue(functionArgs.issue_details);
        case "get_course_prices":
          return get_course_prices(functionArgs.course_type);
        default:
          return "No pude procesar tu solicitud. Inténtalo de nuevo.";
      }
    }

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error en generatePersonalityResponse:", error.message);
    return "En un momento te contactara un asesor para ayudarte.";
  }
};
