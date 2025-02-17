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

router.get("/sync-create-chats", async (req, res) => {
    try {
        console.log("🔄 Iniciando sincronización y creación de chats...");

        // 1️⃣ Obtener todos los clientes con número de teléfono registrado
        const customers = await customerController.getAllCustom();
        if (!customers.length) {
            console.log("❌ No hay clientes para sincronizar.");
            return res.status(200).json({ message: "No hay clientes en la base de datos." });
        }

        let totalCustomers = customers.length;
        let createdChats = 0;

        for (let i = 0; i < totalCustomers; i++) {
            let customer = customers[i];
            let number = customer.phone;

            console.log(`📨 Procesando cliente ${i + 1}/${totalCustomers} - Teléfono: ${number}`);

            // 2️⃣ Verificar si ya existe el chat en MongoDB
            let chat = await Chat.findOne({ phone: number });
            if (chat) {
                console.log(`✅ Chat ya existe para ${number}, se omite.`);
                continue; // Si ya existe, pasamos al siguiente cliente
            }

            // 3️⃣ Obtener historial de mensajes desde Twilio
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
                console.log(`⚠️ No hay mensajes en Twilio para ${number}, no se creará chat.`);
                continue;
            }

            // 4️⃣ Crear un nuevo chat con los mensajes obtenidos de Twilio
            let newChat = new Chat({
                phone: number,
                messages: messages.map(m => ({
                    direction: m.direction === "outbound-reply" ? "outbound-api" : m.direction,
                    body: m.body && m.body.trim() !== "" ? m.body.trim() : "Mensaje multimedia recibido",
                    dateCreated: new Date(m.dateCreated),
                })),
            });

            await newChat.save();
            createdChats++;
            console.log(`🆕 Chat creado con ${messages.length} mensajes para ${number}`);
        }

        console.log(`\n🎯 Sincronización finalizada.`);
        console.log(`📊 Total de clientes analizados: ${totalCustomers}`);
        console.log(`🆕 Chats creados: ${createdChats}`);

        res.status(200).json({
            message: "Sincronización y creación de chats completada.",
            totalCustomers,
            createdChats,
        });

    } catch (error) {
        console.error("❌ Error al sincronizar y crear chats:", error);
        res.status(500).json({ message: "Error en la sincronización y creación de chats." });
    }
});

/* sincronizar chats individuales */
router.get("/sync-chat/:phone", async (req, res) => {
    try {
        const phone = req.params.phone;
        console.log(`🔄 Sincronizando chat para el número ${phone}...`)
        let chat = await Chat.findOne({ phone });
        if (!chat) {
            console.log(`⚠️ No se encontró chat para el número ${phone}.`);
            return res.status(404).json({ message: "No se encontró chat para el número especificado." });
        }

        // 1️⃣ Obtener historial de mensajes desde Twilio
        let numberData = JSON.stringify({ to: `whatsapp:+${phone}` });
        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: "http://localhost:3000/api/v2/whastapp/logs-messages",
            headers: { "Content-Type": "application/json" },
            data: numberData,
        };

        const response = await axios.request(config).catch((error) => {
            console.error(`⚠️ Error al obtener mensajes de ${phone}:`, error.message);
            return { data: { findMessages: [] } };
        });

        let messages = response.data.findMessages.reverse();
        if (messages.length === 0) {
            console.log(`⚠️ No hay mensajes para el cliente ${phone}`);
            return res.status(200).json({ message: "No hay mensajes para el número especificado." });
        }

        // 2️⃣ Guardar mensajes en MongoDB
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
            console.log(`✅ ${newMessages.length} mensajes nuevos guardados para ${phone}`);
            return res.status(200).json({ message: "Mensajes guardados correctamente." });
        }

        console.log(`ℹ️ No hay mensajes nuevos para ${phone}`);
        return res.status(200).json({ message: "No hay mensajes nuevos para el número especificado." });

    } catch (error) {
        console.error("❌ Error al sincronizar chat:", error);
        res.status(500).json({ message: "Error al sincronizar chat." });
    }
});

/* unificar conversaciones repetidas tomando primero la mas antigua */
router.post("/unify-chat", async (req, res) => {
    try {
        const phone = req.body.phone;
        const chat = await Chat.findOne({ phone });
        if (!chat) {
            return res.status(404).json({ message: "No se encontraron mensajes." });
        }

        let messages = chat.messages;
        let uniqueMessages = [];

        messages.forEach(m => {
            let existing = uniqueMessages.find(um => um.body === m.body);
            if (!existing) {
                uniqueMessages.push(m);
            } else if (m.dateCreated < existing.dateCreated) {
                existing.dateCreated = m.dateCreated;
            }
        });

        chat.messages = uniqueMessages;
        await chat.save();

        res.status(200).json({ message: "Conversaciones unificadas correctamente." });

    } catch (error) {
        console.error("❌ Error al unificar mensajes:", error);
        res.status(500).json({ message: "Error al unificar mensajes." });
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
