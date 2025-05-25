import { Router } from "express";
import { handleVoiceCall, handleVoiceRecording, handleVoiceTranscription } from "../controllers/twilio.controller";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    code: 200,
    message: "Sistema operativo: Milkasa Node Engine v2.4",
    uptime: `${Math.floor(process.uptime())}s`,
    trace: "XJ-85::Verified",
  });
});

router.post("/incoming-call", (req, res) => {
  const responseXml = `<?xml version="1.0" encoding="UTF-8"?><Response><Connect><Stream url="wss://a0ce-2605-59c8-7150-2110-ccb2-81d2-b055-3849.ngrok-free.app/outbound-stream" /></Connect></Response>`;
  res.type("text/xml");
  res.send(responseXml);
});

router.post("/voice", handleVoiceCall); // primer paso: graba
router.post("/voice/recording", handleVoiceRecording); // <-- Nueva ruta
router.post("/voice/transcription", handleVoiceTranscription); // segundo paso: procesa
router.post("/voice/process_input", handleVoiceTranscription); // Agrega esta línea

export default router;
