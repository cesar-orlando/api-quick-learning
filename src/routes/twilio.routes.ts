import { Router } from "express";
import { handleVoiceCall, handleVoiceRecording, handleVoiceTranscription } from "../controllers/twilio.controller";

const router = Router();

router.post("/voice", handleVoiceCall); // primer paso: graba
router.post("/voice/recording", handleVoiceRecording); // <-- Nueva ruta
router.post("/voice/transcription", handleVoiceTranscription); // segundo paso: procesa
router.post("/voice/process_input", handleVoiceTranscription); // Agrega esta línea

export default router;