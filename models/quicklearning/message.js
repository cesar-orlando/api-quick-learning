const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ID del remitente
        conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true }, // ID de la conversación
        content: { type: String, required: true }, // Contenido del mensaje
        status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" }, // Estado del mensaje
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
