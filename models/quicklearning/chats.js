const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  phone: { type: String, required: true }, // Número del cliente
  messages: [
    {
      direction: { type: String, enum: ["inbound", "outbound-api"], required: true }, // Mensaje recibido o enviado
      body: { type: String, required: true }, // Contenido del mensaje
      dateCreated: { type: Date, default: Date.now }, // Fecha y hora del mensaje
    }
  ],
});

const Chat = mongoose.model("Chat", ChatSchema);
module.exports = Chat;
