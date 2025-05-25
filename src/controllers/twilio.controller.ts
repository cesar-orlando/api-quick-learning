import { Request, Response } from "express";
import { twiml } from "twilio";
import { getIAResponseAsAudioUrl } from "../services/voice/agent.service";
import { getNatalIAResponse } from "../utils/ai-agent-natalia";

// Utiliza req.session para mantener el historial por llamada
function getSessionHistory(req: any): { role: string; content: string }[] {
  if (!req.session) req.session = {};
  if (!req.session.conversationHistory) {
    // Primer mensaje del asistente (coherente con tu audio de bienvenida)
    req.session.conversationHistory = [
      { role: "assistant", content: "Inglés en Quick Learning, ¡Hablas o Hablas! Soy NatalIA, ¿Cómo te puedo ayudar hoy?" }
    ];
  }
  return req.session.conversationHistory;
}

// Conversational call flow using gather (speech) for natural, immediate speech recognition.
// 1. Saludo y prompt inicial con gather (input: speech)
export const handleVoiceCall = (req: Request, res: Response) => {
  console.log("📞 [handleVoiceCall] body:", req.body);
  const response = new twiml.VoiceResponse();

  // Saludo inicial (puedes dejar el audio de bienvenida)
  response.play("https://9124-2605-59c8-7150-2110-cd2b-5b23-3b4b-2177.ngrok-free.app/audios/welcome-natalia.mp3");

  // Inicia el stream de audio hacia tu WebSocket server
  response.connect().stream({
    url: "wss://9124-2605-59c8-7150-2110-cd2b-5b23-3b4b-2177.ngrok-free.app/ws/twilio-media-stream", // Cambia por tu endpoint real
    track: "inbound_track" // O "inbound_track" si solo quieres el audio del usuario
  });

  res.type("text/xml").send(response.toString());
};

// Ya no se usa grabación/recording, pero se deja para compatibilidad
export const handleVoiceRecording = async (req: Request, res: Response) => {
  console.log("🎤 [handleVoiceRecording] body:", req.body);
  res.type("text/xml").send("<Response></Response>");
};

// 2. Recibe la transcripción del usuario, responde por IA (audio), y repite el ciclo conversacional
export const handleVoiceTranscription = async (req: Request, res: Response): Promise<void> => {
  console.log("📝 [handleVoiceTranscription] body:", req.body);
  const response = new twiml.VoiceResponse();

  // SpeechResult es para gather con input: speech
  const transcription = req.body.SpeechResult || req.body.TranscriptionText;
  console.log("📝 TranscriptionText:", req.body.TranscriptionText);
  console.log("🗣️ SpeechResult:", req.body.SpeechResult);

  // Obtén historial de conversación de la sesión
  const conversationHistory = getSessionHistory(req);

  if (!transcription || transcription.trim() === "") {
    response.say("No entendí lo que dijiste. ¿Podrías repetir?");
    response.gather({
      input: ["speech"],
      action: "/twilio/voice/transcription",
      method: "POST",
      timeout: 10,
      speechTimeout: "auto",
      speechModel: "phone_call",
      language: "es-MX",
    });
    res.type("text/xml").send(response.toString());
    return;
  }

  // Agrega el mensaje del usuario al historial
  conversationHistory.push({ role: "user", content: transcription });

  try {
    // Consulta IA usando TODO el historial y obtiene la respuesta en texto
    const responseText = await getNatalIAResponse(conversationHistory);

    if (!responseText) {
      response.say("No tengo una respuesta en este momento. ¿Puedes repetir o preguntar de otra forma?");
      response.gather({
        input: ["speech"],
        action: "/twilio/voice/transcription",
        method: "POST",
        timeout: 10,
        speechTimeout: "auto",
        speechModel: "phone_call",
        language: "es-MX",
      });
      res.type("text/xml").send(response.toString());
      return;
    }

    // Agrega la respuesta de la IA al historial
    conversationHistory.push({ role: "assistant", content: responseText });

    // Genera el audio de la respuesta
    const audioUrl = await getIAResponseAsAudioUrl(responseText);
    console.log("audioUrl:", audioUrl);

    response.play(audioUrl);
    // Gather para escuchar la siguiente respuesta del usuario (conversación fluida)
    response.gather({
      input: ["speech"],
      action: "/twilio/voice/transcription",
      method: "POST",
      timeout: 10,
      speechTimeout: "auto",
      speechModel: "phone_call",
      language: "es-MX",
    });
  } catch (error) {
    console.error("❌ Error procesando transcripción:", error);
    response.say("Ocurrió un error procesando tu solicitud. Intenta de nuevo.");
    response.gather({
      input: ["speech"],
      action: "/twilio/voice/transcription",
      method: "POST",
      timeout: 10,
      speechTimeout: "auto",
      speechModel: "phone_call",
      language: "es-MX",
    });
  }

  res.type("text/xml").send(response.toString());
};
