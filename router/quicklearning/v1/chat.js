const express = require("express");
const router = express.Router();
const axios = require("axios");
const Chat = require("../../../models/quicklearning/chats"); // Modelo de chats
const customerController = require("../../../controller/quicklearning/customer.controller"); // Controlador de clientes
const userController = require("../../../controller/quicklearning/user.controller");

router.get("/sync-chats", async (req, res) => {
    try {
        console.log("🔄 Iniciando sincronización optimizada de chats...");

        // 1️⃣ Obtener clientes que no han sido actualizados en las últimas 24 horas
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - 24);

        const customers = await customerController.getAllCustom({
            lastUpdated: { $lt: cutoffTime } // Solo clientes con última actualización mayor a 24h
        });

        if (!customers.length) {
            console.log("✅ Todos los clientes están actualizados. No es necesario sincronizar.");
            return res.status(200).json({ message: "No hay clientes para sincronizar." });
        }

        let totalCustomers = customers.length;
        let updatedCount = 0;

        console.log(`📊 Clientes a sincronizar: ${totalCustomers}`);

        // 2️⃣ Agrupar los números en lotes de 20 para hacer menos peticiones al API
        const batchSize = 20;
        let customerBatches = [];
        for (let i = 0; i < totalCustomers; i += batchSize) {
            customerBatches.push(customers.slice(i, i + batchSize));
        }

        // 3️⃣ Procesar cada lote en paralelo
        let chatUpdates = customerBatches.map(async (batch) => {
            let numbers = batch.map(c => `whatsapp:+${c.phone}`);

            console.log(`📨 Obteniendo mensajes para ${numbers.length} clientes...`);

            // 4️⃣ Hacer una sola petición con múltiples números en lugar de una por cada número
            let config = {
                method: "post",
                maxBodyLength: Infinity,
                url: "http://localhost:10000/api/v2/whastapp/logs-messages",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({ numbers })
            };

            const response = await axios.request(config).catch(error => {
                console.error(`⚠️ Error en la petición de mensajes:`, error.message);
                return { data: { messages: {} } }; // Respuesta vacía si falla la petición
            });

            let messagesByNumber = response.data.messages || {};

            // 5️⃣ Guardar los mensajes en MongoDB solo si hay nuevos
            let updateOperations = batch.map(async (customer) => {
                let number = customer.phone;
                let chat = await Chat.findOne({ phone: number });

                if (!messagesByNumber[number] || messagesByNumber[number].length === 0) {
                    console.log(`ℹ️ No hay mensajes nuevos para ${number}`);
                    return null;
                }

                let newMessages = messagesByNumber[number].map(m => ({
                    direction: m.direction === "outbound-reply" ? "outbound-api" : m.direction,
                    body: m.body && m.body.trim() !== "" ? m.body.trim() : "Mensaje multimedia recibido",
                    dateCreated: new Date(m.dateCreated),
                }));

                if (!chat) {
                    chat = new Chat({ phone: number, messages: [] });
                }

                let existingMessages = new Set(chat.messages.map(m => m.body + m.dateCreated.toISOString()));
                let messagesToAdd = newMessages.filter(m => !existingMessages.has(m.body + m.dateCreated.toISOString()));

                if (messagesToAdd.length > 0) {
                    chat.messages.push(...messagesToAdd);
                    await chat.save();
                    console.log(`✅ ${messagesToAdd.length} mensajes nuevos guardados para ${number}`);

                    // 🔄 Actualizamos el timestamp del cliente para evitar futuras consultas innecesarias
                    await customerController.updateOneCustom(
                        { phone: number },
                        { lastUpdated: new Date() }
                    );

                    return number;
                }

                return null;
            });

            let updatedNumbers = (await Promise.all(updateOperations)).filter(Boolean);
            return updatedNumbers.length;
        });

        // 6️⃣ Ejecutar todas las operaciones en paralelo
        let results = await Promise.all(chatUpdates);
        updatedCount = results.reduce((acc, val) => acc + val, 0);

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
            url: "http://localhost:10000/api/v2/whastapp/logs-messages",
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

/* Traer todos los mensajes */
router.get("/messages", async (req, res) => {
    try {
        const chats = await Chat.find();
        res.status(200).json({ chatstotal: chats.length, chats: chats });

    } catch (error) {
        console.error("❌ Error al obtener mensajes:", error);
        res.status(500).json({ message: "Error al obtener mensajes." });
    }
});

/* Traeme todos los chats que tenga Me interesa y asignalos a un usuario */
router.get("/messages/assign", async (req, res) => {
    try {
        const chats = await Chat.find();

        // Filtrar chats que tienen exactamente "Me interesa" en algún mensaje
        let chatsToAssign = chats.filter(c =>
            c.messages.some(m => {
                const messageText = m.body.trim().toLowerCase();
                return messageText === "me interesa" || messageText.includes("costo");
            })
        );

        // Obtener todos los usuarios disponibles
        const getUsers = await userController.findAll();
        if (getUsers.length === 0) {
            return res.status(500).json({ message: "No hay usuarios disponibles para asignar." });
        }

        // Asignar cada chat a un usuario al azar
        for (let chat of chatsToAssign) {
            const agentIndex = Math.floor(Math.random() * getUsers.length);
            const agent = getUsers[agentIndex];

            await axios.put(`http://localhost:10000/api/v1/quicklearning/updatecustomer`, {
                phone: chat.phone,
                //name: chat.name, // Asumiendo que el nombre está en el chat, si no, ajusta según sea necesario
                classification: "Prospecto",
                status: "Interesado",
                user: agent,
                ia: false
            }).then((response) => {
                console.log("response", response.data);
            }).catch((error) => {
                console.error("Error al actualizar el cliente:", error.message);
            });
        }

        res.status(200).json({ chatstotal: chatsToAssign.length, chats: chatsToAssign });

    } catch (error) {
        console.error("❌ Error al obtener mensajes:", error);
        res.status(500).json({ message: "Error al obtener mensajes." });
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
