const express = require('express');
const { MESSAGE_RESPONSE_CODE } = require('../../lib/constans');
const router = express.Router();
const Conversation = require('../../models/quicklearning/conversation');

router.post("/conversations", async (req, res) => {
    const { userId1, userId2 } = req.body;

    if (!userId1 || !userId2) {
        return res.status(400).json({ error: "Se requieren ambos IDs de usuario." });
    }

    try {
        // Verifica si ya existe una conversación entre ambos usuarios
        let conversation = await Conversation.findOne({
            participants: { $all: [userId1, userId2] },
            isGroup: false, // No debe ser un grupo
        });

        if (!conversation) {
            // Crea una nueva conversación si no existe
            conversation = await Conversation.create({
                participants: [userId1, userId2],
            });
        }

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: "Error creando o recuperando la conversación." });
    }
});

router.get("/conversations/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const conversations = await Conversation.find({
            participants: userId,
        }).populate("participants", "name email"); // Devuelve los datos básicos de los participantes

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo las conversaciones." });
    }
});

router.post("/messages", async (req, res) => {
    const { senderId, conversationId, content } = req.body;

    if (!senderId || !conversationId || !content) {
        return res.status(400).json({ error: "Todos los campos son requeridos." });
    }

    try {
        // Crea el mensaje
        const message = await Message.create({
            sender: senderId,
            conversationId,
            content,
        });

        // Actualiza la conversación con el último mensaje
        await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id });

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: "Error enviando el mensaje." });
    }
});

