import { Router } from "express";
import { handleMessage } from "../controllers/message.controller";
import { getMessagesByPhone } from "../controllers/chat.controller";
import { getProspectRecordsByAsesorId, sendMessage, sendPaymentForm, sendTemplate } from "../controllers/record.controller";

const router = Router();

// Ruta para manejar mensajes entrantes
router.post("/message", handleMessage);

router.get("/chat/:phone", getMessagesByPhone);

router.get("/prospect/:asesorId", getProspectRecordsByAsesorId);

//ruta para enviar un mensaje
router.post("/send-message", sendMessage);

//Ruta para enviar forma de pago a un cliente
router.post("/send-payment-form", sendPaymentForm);

// Ruta para enviar un mensaje de plantilla
router.post("/send-template", sendTemplate);

export default router;