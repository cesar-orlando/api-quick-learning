require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs");
const FormData = require("form-data");
const geolib = require("geolib");
const { default: axios } = require("axios");
const { quickLearningCourses, student_custom_functions, dataChatGpt } = require("../db/data");
const { type } = require("os");
const userController = require("../controller/quicklearning/user.controller");
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
      name: "register_user_name",
      description: "Cuando un usuario proporciona su nombre completo, usa esta función para registrarlo y continuar con el proceso de inscripción.",
      parameters: {
        type: "object",
        properties: {
          full_name: {
            type: "string",
            description: "El nombre completo del usuario tal como lo proporcionó.",
          },
        },
        required: ["full_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_student_complaint",
      description: "Si el usuario menciona una queja, problema, inconveniente con un maestro o con la escuela, usa esta función para ayudarle a reportarlo adecuadamente.",
      parameters: {
        type: "object",
        properties: {
          issue_details: {
            type: "string",
            description: "Descripción de la queja del estudiante sobre un maestro o situación en la escuela.",
          },
        },
        required: ["issue_details"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_branches",
      description: "Cuando el usuario pregunta por las sucursales, sedes o ubicaciones de Quick Learning, usa esta función para proporcionar esa información.",
      parameters: {
        type: "object",
        properties: {},
      },
    }
  }
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

const register_user_name = async (fullName, WaId) => {

  const getUsers = await userController.findAll();
  const agentIndex = Math.floor(Math.random() * getUsers.length);
  const agent = getUsers[agentIndex];

  await axios.put(`http://localhost:3000/api/v1/quicklearning/updatecustomer`, {
    phone: WaId,
    name: fullName,
    classification: "Prospecto",
    status: "Interesado",
    user: agent,
    ia: false
  }).then((response) => {
    console.log("response", response);
  }).catch((error) => {
    console.error("Error al obtener el historial de mensajes:", error.message);
    return { data: { findMessages: [] } };
  });

  return `¡Gracias, ${fullName}! Ahora que tengo tu nombre, puedo continuar con el proceso de inscripción. ¿Me puedes proporcionar tu número de contacto?`;
};

const submit_student_complaint = async (issueDetails, WaId) => {
  const getUsers = await userController.findAll();
  const agentIndex = Math.floor(Math.random() * getUsers.length);
  const agent = getUsers[agentIndex];

  await axios.put(`http://localhost:3000/api/v1/quicklearning/updatecustomer`, {
    phone: WaId,
    classification: "Urgente",
    status: "Queja",
    user: agent,
    ia: false
  }).then((response) => {
    console.log("response", response);
  }).catch((error) => {
    console.error("Error al obtener el historial de mensajes:", error.message);
    return { data: { findMessages: [] } };
  });
  return `⚠️ *Lamentamos escuchar esto.* Queremos ayudarte lo más rápido posible. Para dar seguimiento a tu reporte, por favor envíanos la siguiente información:\n\n📝 *Nombre completo*\n🏫 *Sucursal donde estás inscrito*\n📚 *Curso que estás tomando*\n⏰ *Horario en el que asistes*\n📢 *Detalles del problema:* "${issueDetails}"\n🎫 *Número de alumno*\n\nCon esta información, nuestro equipo podrá revisar tu caso y darte una solución lo antes posible. ¡Estamos para ayudarte! 😊`;
};

const get_branches = async (WaId) => {
  const getUsers = await userController.findAll();
  const agentIndex = Math.floor(Math.random() * getUsers.length);
  const agent = getUsers[agentIndex];

  await axios.put(`http://localhost:3000/api/v1/quicklearning/updatecustomer`, {
    phone: WaId,
    classification: "Prospecto",
    status: "Interesado",
    user: agent,
    ia: false
  }).then((response) => {
    console.log("response", response);
  }).catch((error) => {
    console.error("Error al obtener el historial de mensajes:", error.message);
  });
  return `Dime en qué ciudad te encuentras y te diré la sucursal más cercana.`;
};

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

module.exports = async function generatePersonalityResponse(message, number, WaId, mediaType, mediaUrl) {
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
    const response = await axios.get(`http://localhost:3000/api/v1/chat/messages/${WaId}`).catch((error) => {
      console.error("Error al obtener el historial de mensajes:", error.message);
      return { data: { findMessages: [] } };
    });


    let mapMessage = response.data.messages.map((msg) => ({
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

    console.log("Respuesta de OpenAI:", JSON.stringify(completion, null, 2));


    const toolCall = completion.choices[0].message.tool_calls?.[0];

    if (toolCall) {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      switch (functionName) {
        case "get_start_dates":
          return get_start_dates();
        case "register_user_name":
          return register_user_name(functionArgs.full_name, WaId);
        case "submit_student_complaint":
          return submit_student_complaint(functionArgs.issue_details, WaId);
        case "get_branches":
          return get_branches(WaId);
        default:
          return "Un asesor se pondrá en contacto contigo en breve.";
      }
    }

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error en generatePersonalityResponse:", error.message);
    return "En un momento te contactara un asesor para ayudarte.";
  }
};
