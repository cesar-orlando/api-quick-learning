require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs");
const FormData = require("form-data");
const { quickLearningCourses, student_custom_functions, dataChatGpt } = require("../db/data");
const { default: axios } = require("axios");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const response = await axios.request(config).catch((error) => {
      console.error("Error al obtener el historial de mensajes:", error.message);
      return { data: { findMessages: [] } };
    });
    let mapMessage = response.data.findMessages.reverse().map((msg) => ({
      role: msg.direction === "outbound-api" ? "assistant" : "user",
      content: msg.body,
    }));

    // 4. Agregar el mensaje combinado actual y el contexto de la escuela de inglés
    mapMessage.unshift({
      role: "system",
      content:
        initialContext ||
        "Eres Claudia, una asistente de Quick Learning, una escuela de inglés. Responde preguntas sobre cursos, horarios, modalidades de estudio (presencial, virtual) y cualquier duda sobre el programa de inglés de manera amable y profesional.",
    });
    mapMessage.push({ role: "user", content: processedMessage });

    console.log("mapMessage:", mapMessage); // Depuración del historial de mensajes

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
    return "En un momento te contactara un asesor para ayudarte.";
  }
};
