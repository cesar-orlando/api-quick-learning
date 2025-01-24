const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
    {
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // IDs de los usuarios
        isGroup: { type: Boolean, default: false }, // Indica si es un grupo o una conversación 1 a 1
        name: { type: String }, // Nombre de la conversación (solo para grupos)
    },
    { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);

