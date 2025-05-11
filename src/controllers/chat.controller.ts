import { Request, Response } from "express";
import Chat from "../models/chat.model";
import { DynamicRecord } from "../models/record.model";
import Table from "../models/table.model";

// 🔹 Crear un nuevo chat
export const createChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, linkedTable, advisor } = req.body;

    if (!phone || !linkedTable?.refModel || !linkedTable?.refId) {
      res.status(400).json({ message: "Faltan datos requeridos para crear el chat." });
      return;
    }

    // Verificar si la tabla tiene IA habilitada
    const table = await Table.findOne({ slug: linkedTable.refModel });
    if (!table || !table.isAIEnabled) {
      res.status(400).json({ message: "La tabla no tiene soporte para IA." });
      return;
    }

    const newChat = new Chat({
      phone,
      linkedTable,
      advisor,
      conversationStart: new Date(),
    });

    await newChat.save();

    res.status(201).json({ message: "Chat creado exitosamente.", chat: newChat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear el chat." });
  }
};

// 🔹 Obtener todos los chats
export const getAllChats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const chats = await Chat.find().populate("advisor.id").populate("linkedTable.refId");
    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los chats." });
  }
};

// 🔹 Obtener un chat específico por ID
export const getChatById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const chat = await Chat.findById(id).populate("advisor.id").populate("linkedTable.refId");

    if (!chat) {
      res.status(404).json({ message: "Chat no encontrado." });
      return;
    }

    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener el chat." });
  }
};

// 🔹 Actualizar un chat (asignar asesor o vincular registro)
export const updateChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { advisor, linkedTable } = req.body;

    const chat = await Chat.findById(id);

    if (!chat) {
      res.status(404).json({ message: "Chat no encontrado." });
      return;
    }

    if (advisor) chat.advisor = advisor;
    if (linkedTable) chat.linkedTable = linkedTable;

    await chat.save();

    res.json({ message: "Chat actualizado correctamente.", chat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el chat." });
  }
};

// 🔹 Eliminar un chat
export const deleteChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const chat = await Chat.findByIdAndDelete(id);

    if (!chat) {
      res.status(404).json({ message: "Chat no encontrado para eliminar." });
      return;
    }

    res.json({ message: "Chat eliminado correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar el chat." });
  }
};

// 🔹 Obtener mensajes de un chat con phone
export const getMessagesByPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.params;

    const chat = await Chat.findOne({ phone })
    if (!chat) {
      res.status(404).json({ message: "Chat no encontrado." });
      return;
    }
    res.json(chat.messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los mensajes del chat." });
  }
};