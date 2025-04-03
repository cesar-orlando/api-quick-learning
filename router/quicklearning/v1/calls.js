const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { VoiceResponse } = require("twilio").twiml;
const OpenAI = require("openai");
const { dataChatGpt } = require("../../../db/data");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

require("dotenv").config();

// Verificación sencilla
router.get("/entry", (req, res) => {
  res.send("entry");
});

// Memoria temporal por llamada
const conversations = {};

// Entrada de llamada
router.post("/entry", async (req, res) => {
  const callSid = req.body.CallSid || req.query.CallSid || "default-entry";

  // console.log("📩 req.body:", req.body);
  console.log("🔁 callSid:", callSid);

  // Crear historial si es primera vez
  const systemContext = await dataChatGpt();

  if (!conversations[callSid]) {
    conversations[callSid] = [
      {
        role: "system",
        content: systemContext

      }
    ];
  }


  // También agregamos el saludo al historial para continuidad
  const welcomeText = "Hola, gracias por comunicarte a inmobiliaria Virtual Voices. ¿En qué puedo ayudarte?";
  conversations[callSid].push({ role: "assistant", content: welcomeText });

  console.log("conversations[callSid]:", conversations[callSid]);

  try {
    const response = new VoiceResponse();
    const saludoUrl = `${process.env.PUBLIC_AUDIO_URL}/audio/saludo-girl.mp3`;
    console.log("🔊 Reproduciendo saludo grabado desde:", saludoUrl);

    response.play(saludoUrl);
    response.pause({ length: 1 });

    response.gather({
      input: "speech",
      action: "/api/v1/quicklearning/calls/process",
      method: "POST",
      timeout: 20,
      speechTimeout: "auto",
      speechModel: "phone_call",
      language: "es-MX"
    });

    console.log("🧾 TwiML generado:", response.toString());

    setTimeout(() => {
      res.type("text/xml");
      res.send(response.toString());
    }, 500); // Pausa pequeña para que el archivo esté disponib

  } catch (error) {
    console.error("❌ Error en entrada:", error.response?.data || error.message);
    const response = new VoiceResponse();
    response.say("Lo sentimos, hubo un problema inicial. Intenta más tarde.");
    res.type("text/xml");
    res.send(response.toString());
  }
});

router.post("/process", async (req, res) => {
  const userSpeech = req.body.SpeechResult || "No entendí nada";
  const callSid = req.body.CallSid;

  console.log("📞 SpeechResult recibido de Twilio:", userSpeech);
  const systemContext = await dataChatGpt();

  if (!conversations[callSid]) {
    conversations[callSid] = [
      {
        role: "system",
        content: systemContext

      }
    ];
  }

  conversations[callSid].push({ role: "user", content: userSpeech });

  try {
    // Detectar si el usuario quiere hacer una pausa
    const esperaKeywords = [
      "espérame",
      "espera",
      "aguántame",
      "dame un segundo",
      "dame un momento",
      "un momento",
      "ahorita",
      "aguanta"
    ];

    const userText = userSpeech.toLowerCase();

    if (esperaKeywords.some(k => userText.includes(k))) {
      console.log("🕒 El usuario pidió esperar, activando modo pausa...");

      const response = new VoiceResponse();

      // Tu audio pregrabado, por ejemplo: /audio/espera.mp3
      const esperaUrl = `${process.env.PUBLIC_AUDIO_URL}/audio/espera.mp3`;
      response.play(esperaUrl);

      // Pausa larga para que pueda hablar después
      response.pause({ length: 20 });

      // Volver a escuchar con Gather
      response.gather({
        input: "speech",
        action: "/api/v1/quicklearning/calls/process",
        method: "POST",
        timeout: 20,
        speechTimeout: "auto",
        speechModel: "phone_call",
        language: "es-MX"
      });

      return res.type("text/xml").send(response.toString());
    }

    console.log("🤖 Enviando mensaje a OpenAI...");
    const shortContext = conversations[callSid];
    let openaiRespondio = false;
    let aiReply = null;

    const openaiPromise = openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: shortContext,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 2,
      presence_penalty: 0,
    }).then(completion => {
      openaiRespondio = true;
      aiReply = completion.choices[0].message.content;
    });

    // Temporizador de 2 segundos
    const wait = new Promise(resolve => setTimeout(resolve, 2000));
    await Promise.race([openaiPromise, wait]);

    if (!openaiRespondio) {
      console.log("⏱️ OpenAI se tarda, mandando audio de espera...");

      const response = new VoiceResponse();
      response.play(`${process.env.PUBLIC_AUDIO_URL}/audio/dame-un-momento.mp3`);
      response.pause({ length: 2 });

      res.type("text/xml");
      return res.send(response.toString());
    }

    // Si OpenAI ya respondió, continuamos
    console.log("✅ Respuesta de ChatGPT:", aiReply);
    conversations[callSid].push({ role: "assistant", content: aiReply });

    const replyToSpeak = aiReply.length > 400
      ? aiReply.slice(0, 397) + "..."
      : aiReply;

    console.log("🎙 Generando audio con ElevenLabs...");
    const elevenResponse = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/CaJslL1xziwefCeTNzHv",
      {
        text: replyToSpeak,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.9
        }
      },
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer",
        timeout: 12000
      }
    );

    const fileName = `${uuidv4()}.mp3`;
    const filePath = path.join(__dirname, "../../../public/audio", fileName);
    fs.writeFileSync(filePath, elevenResponse.data);
    const publicUrl = `${process.env.PUBLIC_AUDIO_URL}/audio/${fileName}`;
    console.log("🔊 Reproduciendo audio desde:", publicUrl);

    const response = new VoiceResponse();
    response.play(publicUrl);

    response.gather({
      input: "speech",
      action: "/api/v1/quicklearning/calls/process",
      method: "POST",
      timeout: 20,
      speechTimeout: "auto",
      speechModel: "phone_call",
      language: "es-MX"
    });

    res.type("text/xml");
    res.send(response.toString());


  } catch (error) {
    console.error("❌ Error general:", error.response?.data?.toString('utf8') || error.message);
    const response = new VoiceResponse();
    response.say("Lo siento, hubo un error procesando tu solicitud.");
    res.type("text/xml");
    res.send(response.toString());
  }
});

router.post('/recording', async (req, res) => {
  const recordingUrl = req.body.RecordingUrl;
  const callSid = req.body.CallSid;

  console.log("📼 Grabación lista:", recordingUrl);

  // Opcional: Guardar en archivo o base de datos
  fs.appendFileSync('recordings.txt', `${callSid}: ${recordingUrl}.mp3\n`);

  res.status(200).send('Recording received');
});




module.exports = router;
