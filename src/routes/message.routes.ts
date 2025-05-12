import { Router } from "express";
import { handleMessage } from "../controllers/message.controller";
import { getMessagesByPhone } from "../controllers/chat.controller";
import { getProspectRecordsByAsesorId, sendMessage } from "../controllers/record.controller";

const router = Router();

// Ruta para manejar mensajes entrantes
router.post("/message", handleMessage);

router.get("/chat/:phone", getMessagesByPhone);

router.get("/prospect/:asesorId", getProspectRecordsByAsesorId);

//ruta para enviar un mensaje
router.post("/send-message", sendMessage);

export default router;