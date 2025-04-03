const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { VoiceResponse } = require("twilio").twiml;
const OpenAI = require("openai");
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

// Función para ajustar el formato de la hora
function formatTimeForSpeech(text) {
    return text.replace(/(\d+):00\s?(AM|PM)/gi, "$1 $2"); // Reemplaza "11:00 AM" por "11 AM"
}

// Entrada de llamada
router.post("/entry", async (req, res) => {
    const callSid = req.body.CallSid || req.query.CallSid || "default-entry";

    // console.log("📩 req.body:", req.body);
    console.log("🔁 callSid:", callSid);

    // Crear historial si es primera vez

    if (!conversations[callSid]) {
        conversations[callSid] = [
            {
                role: "system",
                content: `Eres un asistente virtual de una inmobiliaria llamada "Inmobiliaria Jesús".
Tu tarea es agendar citas para mostrar propiedades a los clientes.
Responde de manera amigable y profesional.

Simulación de interacción:

1️⃣ **Asistente:** ¡Hola! Gracias por comunicarte con Inmobiliaria Jesús. ¿En qué puedo ayudarte?
2️⃣ **Cliente:** Estoy interesado en una casa.
3️⃣ **Asistente:** ¡Perfecto! ¿Qué tipo de casa estás buscando? Por ejemplo, ¿cuántas habitaciones necesitas o en qué zona te gustaría?
4️⃣ **Cliente:** Me gustaría una casa con 3 habitaciones en el centro de la ciudad.
5️⃣ **Asistente:** Entendido. Tenemos varias opciones disponibles en el centro de la ciudad con 3 habitaciones. ¿Qué día y hora te gustaría agendar una cita para visitar una de estas propiedades?
6️⃣ **Cliente:** ¿Podría ser el próximo viernes por la tarde?
7️⃣ **Asistente:** Claro, el próximo viernes por la tarde está disponible. ¿Te parece bien a las 4:00 PM?
8️⃣ **Cliente:** Sí, está perfecto.
9️⃣ **Asistente:** Excelente. He agendado tu cita para el próximo viernes a las 4:00 PM. Te enviaremos un recordatorio antes de la cita. ¿Hay algo más en lo que pueda ayudarte?
10️⃣ **Cliente:** No, eso sería todo. Gracias.
11️⃣ **Asistente:** ¡De nada! Que tengas un excelente día. 😊

Este es un ejemplo de cómo el asistente virtual puede interactuar con los clientes para agendar citas de manera eficiente y profesional.`
            }
        ];
    }


    // También agregamos el saludo al historial para continuidad
    const welcomeText = "¡Hola! Gracias por marcar a Inmobiliaria Jesús. ¿En qué le puedo asistir?";
    conversations[callSid].push({ role: "assistant", content: welcomeText });

    console.log("conversations[callSid]:", conversations[callSid]);

    try {
        const response = new VoiceResponse();
        const saludoUrl = `${process.env.PUBLIC_AUDIO_URL}/audio/realstate/saludo.mp3`;
        console.log("🔊 Reproduciendo saludo grabado desde:", saludoUrl);

        response.play(saludoUrl);
        response.pause({ length: 1 });

        response.gather({
            input: "speech",
            action: "/api/v1/realstate/calls/process",
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

    if (!conversations[callSid]) {
        conversations[callSid] = [
            {
                role: "system",
                content: `Eres un asistente virtual de una inmobiliaria llamada "Inmobiliaria Jesús".
Tu tarea es agendar citas para mostrar propiedades a los clientes.
Responde de manera amigable y profesional.

Simulación de interacción:

1️⃣ **Asistente:** ¡Hola! Gracias por comunicarte con Inmobiliaria Jesús. ¿En qué puedo ayudarte?
2️⃣ **Cliente:** Estoy interesado en una casa.
3️⃣ **Asistente:** ¡Perfecto! ¿Qué tipo de casa estás buscando? Por ejemplo, ¿cuántas habitaciones necesitas o en qué zona te gustaría?
4️⃣ **Cliente:** Me gustaría una casa con 3 habitaciones en el centro de la ciudad.
5️⃣ **Asistente:** Entendido. Tenemos varias opciones disponibles en el centro de la ciudad con 3 habitaciones. ¿Qué día y hora te gustaría agendar una cita para visitar una de estas propiedades?
6️⃣ **Cliente:** ¿Podría ser el próximo viernes por la tarde?
7️⃣ **Asistente:** Claro, el próximo viernes por la tarde está disponible. ¿Te parece bien a las 4:00 PM?
8️⃣ **Cliente:** Sí, está perfecto.
9️⃣ **Asistente:** Excelente. He agendado tu cita para el próximo viernes a las 4:00 PM. Te enviaremos un recordatorio antes de la cita. ¿Hay algo más en lo que pueda ayudarte?
10️⃣ **Cliente:** No, eso sería todo. Gracias.
11️⃣ **Asistente:** ¡De nada! Que tengas un excelente día. 😊

Este es un ejemplo de cómo el asistente virtual puede interactuar con los clientes para agendar citas de manera eficiente y profesional.`

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
                action: "/api/v1/realstate/calls",
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

        // Ajustar el texto para que suene más natural
        const replyToSpeak = formatTimeForSpeech(
            aiReply.length > 400 ? aiReply.slice(0, 397) + "..." : aiReply
        );

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
        const filePath = path.join(__dirname, "../../public/audio", fileName);
        fs.writeFileSync(filePath, elevenResponse.data);
        const publicUrl = `${process.env.PUBLIC_AUDIO_URL}/audio/${fileName}`;
        console.log("🔊 Reproduciendo audio desde:", publicUrl);

        const response = new VoiceResponse();
        response.play(publicUrl);

        response.gather({
            input: "speech",
            action: "/api/v1/realstate/calls/process",
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
