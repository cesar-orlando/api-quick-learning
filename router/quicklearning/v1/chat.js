const express = require("express");
const router = express.Router();
const axios = require("axios");
const Chat = require("../../../models/quicklearning/chats"); // Modelo de chats
const customerController = require("../../../controller/quicklearning/customer.controller"); // Controlador de clientes

router.get("/sync-chats", async (req, res) => {
    try {
        console.log("🔄 Iniciando sincronización de chats...");

        // 1️⃣ Obtener todos los clientes con número de teléfono registrado
        const customers = await customerController.getAllCustom();
        if (!customers.length) {
            console.log("❌ No hay clientes para sincronizar.");
            return res.status(200).json({ message: "No hay clientes en la base de datos." });
        }

        let totalCustomers = customers.length;
        let updatedCount = 0;

        for (let i = 0; i < totalCustomers; i++) {
            let customer = customers[i];
            let number = customer.phone;

            console.log(`📨 Sincronizando chats de cliente ${i + 1}/${totalCustomers} - Teléfono: ${number}`);

            // 2️⃣ Obtener historial de mensajes desde Twilio
            let numberData = JSON.stringify({ to: `whatsapp:+${number}` });
            let config = {
                method: "post",
                maxBodyLength: Infinity,
                url: "http://localhost:3000/api/v2/whastapp/logs-messages",
                headers: { "Content-Type": "application/json" },
                data: numberData,
            };

            const response = await axios.request(config).catch((error) => {
                console.error(`⚠️ Error al obtener mensajes de ${number}:`, error.message);
                return { data: { findMessages: [] } };
            });

            let messages = response.data.findMessages.reverse();
            if (messages.length === 0) {
                console.log(`⚠️ No hay mensajes para el cliente ${number}`);
                continue;
            }

            // 3️⃣ Guardar mensajes en MongoDB
            let chat = await Chat.findOne({ phone: number });
            if (!chat) chat = new Chat({ phone: number, messages: [] });

            let existingMessages = new Set(chat.messages.map(m => m.body + m.dateCreated.toISOString()));

            let newMessages = messages.filter(m => {
                let key = m.body + new Date(m.dateCreated).toISOString();
                return !existingMessages.has(key);
            });

            if (newMessages.length > 0) {
                newMessages.forEach(m => {
                    chat.messages.push({
                        direction: m.direction === "outbound-reply" ? "outbound-api" : m.direction,
                        body: m.body && m.body.trim() !== "" ? m.body.trim() : "Mensaje multimedia recibido",
                        dateCreated: new Date(m.dateCreated),
                    });
                });

                await chat.save(); // Guardar los mensajes en la base de datos
                updatedCount++;
                console.log(`✅ ${newMessages.length} mensajes nuevos guardados para ${number}`);
            } else {
                console.log(`ℹ️ No hay mensajes nuevos para ${number}`);
            }
        }

        console.log(`\n🎯 Sincronización finalizada.`);
        console.log(`📊 Total de clientes analizados: ${totalCustomers}`);
        console.log(`✅ Clientes con mensajes actualizados: ${updatedCount}`);

        res.status(200).json({
            message: "Sincronización completada.",
            totalCustomers,
            updatedCount,
        });

    } catch (error) {
        console.error("❌ Error al sincronizar chats:", error);
        res.status(500).json({ message: "Error en la sincronización de chats." });
    }
});

/* traer lo mensajes por numero */
router.get("/messages/:phone", async (req, res) => {
    try {
        const phone = req.params.phone;
        const chat
            = await Chat.findOne({ phone });
        if (!chat) {
            return res.status(404).json({ message: "No se encontraron mensajes." });
        }

        res.status(200).json(chat);

    } catch (error) {
        console.error("❌ Error al obtener mensajes:", error);
        res.status(500).json({ message: "Error al obtener mensajes." });
    }
});

/* Eliminar mensajes por numero */
router.delete("/messages/:phone", async (req, res) => {
    try {
        const phone = req.params.phone;
        const chat = await Chat.findOne({ phone });
        if (!chat) {
            return res.status(404).json({ message: "No se encontraron mensajes." });
        }
        
        chat.messages = [];
        await chat.save();

        res.status(200).json({ message: "Mensajes eliminados correctamente." });

    } catch (error) {
        console.error("❌ Error al eliminar mensajes:", error);
        res.status(500).json({ message: "Error al eliminar mensajes." });
    }
});


module.exports = router;
