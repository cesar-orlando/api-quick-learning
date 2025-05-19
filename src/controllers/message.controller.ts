import { Request, Response } from "express";
import { processMessage } from "../services/whatsapp/message.service";
import { getSocketIO } from "../socket";

export const handleMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = req;
    const io = getSocketIO();

    console.log("📩 Mensaje recibido:", body);

    // Procesar el mensaje usando el servicio
    const result = await processMessage(body, io);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error al procesar el mensaje:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
    res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
};