import { Router } from "express";
import { handleMessage } from "../controllers/message.controller";
import { getMessagesByPhone } from "../controllers/chat.controller";

const router = Router();

// Ruta para manejar mensajes entrantes
router.post("/message", handleMessage);

router.get("/chat/:phone", getMessagesByPhone);

export default router;