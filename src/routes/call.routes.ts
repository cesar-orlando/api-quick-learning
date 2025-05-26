import { Router } from "express";
import { getCallsByPhone } from "../controllers/call.controller";

const router = Router();
// Ruta para obtener llamadas por número de teléfono
router.get("/by-phone/:phone", getCallsByPhone);

export default router;