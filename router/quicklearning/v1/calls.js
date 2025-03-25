const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { VoiceResponse } = require("twilio").twiml;

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

  console.log("📩 req.body:", req.body);
console.log("🔁 callSid:", callSid);

  // Crea el historial con mensaje de sistema (si no existe aún)
  if (!conversations[callSid]) {
    conversations[callSid] = [
      {
        role: "system",
        content:
          "Eres un asistente telefónico profesional de un call center llamado Virtual Voices. Responde en español mexicano, con un tono amable y útil. No repitas saludos innecesarios. Recuerda el contexto y ayuda al cliente eficientemente."
      }
    ];
  }

  try {
    console.log("🤖 Generando saludo inicial con ChatGPT...");
    const welcomeText ="Hola, gracias por comunicarte a Virtual Voices. ¿En qué puedo ayudarte?";
    console.log("🎤 Saludo generado:", welcomeText);

    conversations[callSid].push({ role: "assistant", content: welcomeText });

    // ElevenLabs: generar audio
    const elevenResponse = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/CaJslL1xziwefCeTNzHv", // Reemplaza por tu voice ID real
      {
        text: welcomeText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer"
      }
    );

    const fileName = `${uuidv4()}.mp3`;
    const filePath = path.join(__dirname, "../../../public/audio", fileName);
    fs.writeFileSync(filePath, elevenResponse.data);
    const publicUrl = `${process.env.PUBLIC_AUDIO_URL}/${fileName}`;
    console.log("🔊 Reproduciendo saludo desde:", publicUrl);

    const response = new VoiceResponse();
    response.play(publicUrl);
    response.pause({ length: 1 }); // Pausa de 1 segundo
    response.gather({
      input: "speech",
      action: "/api/v1/quicklearning/calls/process",
      method: "POST",
      speechTimeout: "auto",
      speechModel: "phone_call",
      language: "es-MX"
    });

    console.log("🧾 TwiML generado:", response.toString());

    setTimeout(() => {
      res.type("text/xml");
      res.send(response.toString());
    }, 1000); // espera 1 segundo antes de responder a Twilio

  } catch (error) {
    console.error("❌ Error en saludo de bienvenida:", error.response?.data || error.message);
    const response = new VoiceResponse();
    response.say("Lo sentimos, hubo un problema con la bienvenida. Puede intentarlo más tarde.");
    res.type("text/xml");
    res.send(response.toString());
  }
});


router.post("/process", async (req, res) => {
  const userSpeech = req.body.SpeechResult || "No entendí nada";
  const callSid = req.body.CallSid;

  console.log("📞 SpeechResult recibido de Twilio:", userSpeech);

  if (!conversations[callSid]) {
    conversations[callSid] = [
      {
        role: "system",
        content:
          "Eres un asistente telefónico profesional de un call center. Habla en español mexicano. Sé claro, amable y no repitas saludos. Ayuda al cliente según el contexto."
      }
    ];
  }

  conversations[callSid].push({ role: "user", content: userSpeech });

  try {
    console.log("🤖 Enviando mensaje a OpenAI...");
    const completion = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: conversations[callSid]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiReply = completion.data.choices[0].message.content;
    console.log("✅ Respuesta de ChatGPT:", aiReply);

    conversations[callSid].push({ role: "assistant", content: aiReply });

    console.log("🎙 Generando audio con ElevenLabs...");
    const elevenResponse = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/CaJslL1xziwefCeTNzHv", // <-- tu voz aquí
      {
        text: aiReply,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer"
      }
    );

    const fileName = `${uuidv4()}.mp3`;
    const filePath = path.join(__dirname, "../../../public/audio", fileName);
    fs.writeFileSync(filePath, elevenResponse.data);
    console.log("💾 Audio guardado en:", filePath);

    const publicUrl = `https://81ed-177-249-168-223.ngrok-free.app/audio/${fileName}`;
    console.log("🔊 Reproduciendo audio desde:", publicUrl);

    const response = new VoiceResponse();
    response.play(publicUrl);

    response.gather({
      input: "speech",
      action: "/api/v1/quicklearning/calls/process",
      method: "POST",
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


module.exports = router;
