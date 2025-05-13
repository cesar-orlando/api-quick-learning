import mongoose, { Schema, Document } from "mongoose";

// Definimos la interfaz para TypeScript
interface IMessage {
  direction: "inbound" | "outbound-api";
  body: string;
  dateCreated?: Date;
  respondedBy: "bot" | "human" | "asesor"; // Identificador de quién respondió
  responseTime?: number; // Tiempo en segundos que tardó en responder un humano
}

export interface IChat extends Document {
  phone: string;
  messages: IMessage[];
  linkedTable: {
    refModel: string; // Nombre del modelo al que está vinculado
    refId: mongoose.Types.ObjectId; // ID del documento vinculado
  };
  advisor?: {
    id: mongoose.Types.ObjectId; // ID del asesor asignado
    name: string; // Nombre del asesor
  };
  conversationStart: Date; // Fecha y hora de inicio de la conversación
}

// Definimos el esquema de Mongoose
const ChatSchema: Schema = new mongoose.Schema({
  phone: { type: String, required: true }, // Número del cliente
  messages: [
    {
      direction: { type: String, enum: ["inbound", "outbound-api"], required: true }, // Mensaje recibido o enviado
      body: { type: String, required: true }, // Contenido del mensaje
      dateCreated: { type: Date, default: Date.now }, // Fecha y hora del mensaje
      respondedBy: { type: String, enum: ["bot", "human", "asesor"], required: true }, // Identificador de quién respondió
      responseTime: { type: Number }, // Tiempo en segundos que tardó en responder un humano
    },
  ],
  linkedTable: {
    refModel: { type: String, required: true }, // Nombre del modelo dinámico
    refId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "linkedTable.refModel" }, // ID del documento dinámico
  },
  advisor: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ID del asesor asignado
    name: { type: String }, // Nombre del asesor
  },
  conversationStart: { type: Date, default: Date.now }, // Fecha y hora de inicio de la conversación
});

// Creamos el modelo
const Chat = mongoose.model<IChat>("Chat", ChatSchema);

export default Chat;