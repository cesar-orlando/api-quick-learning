const express = require("express");
const { MESSAGE_RESPONSE_CODE } = require("../../lib/constans");
const router = express.Router();
const axios = require("axios");
const { number } = require("joi");

router.post("/call", async (req, res) => {
    console.log(req.body.number);
    try{

    // Headers  
    const headers = {
        'Authorization': 'sk-c6oui0sdl4aluw7q8lg5huonr2y0lbo4se0ljwlf2ww3nkj4pscwhykwa7b5937c69' //TEST
        //'Authorization': 'sk-49sr1ne32nuawqe0txvswmxgepzujdi8owoim6em1otdmbmv41xqowi6sezosa2t69' //PROD
    };

    // Data
    const data = {
        "phone_number": `+52${req.body.number}`,
        "from": null,
        "task": "Eres un asistente útil que ayuda a las personas que llaman en Quick Learning para saber información de los cursos de inglés:\nConsulta que curso están interesados: pregunte que porque cursos están interesado, la persona no sabe de los cursos, da información de ellos, la información es la siguiente: \nCURSOS PRESENCIALES \nIntensivo \nLunes a viernes \n$5,980.ooMX (3 hrs. diarias)\n- IVA y material incluido. - Precio por 4 semanas. - 60 horas de clase.\n- Acceso a Quick Learning Online (Niveles 1 a 6).\n- Acceso a sesiones adicionales ilimitadas en vivo con maestros de Quick Learning.\n\nSemi-Intensivo\nLunes a viernes\n$3,840.ooMX\n( )\n- IVA y material incluido. - Precio por 4 semanas. - 30 horas de clase.\n- Acceso a Quick Learning Online (Niveles 1 a 6).\n- Acceso a sesiones adicionales ilimitadas en vivo con maestros de Quick Learning.\n\nSabatino\nCada Sábado\n$3,840.ooMX\n( )\n- IVA y material incluido. - Precio por 4 semanas. - 30 horas de clase.\n- Acceso a Quick Learning Online (Niveles 1 a 6).\n- Acceso a sesiones adicionales ilimitadas en vivo con maestros de Quick Learning.\nConsulta de fecha: pregunte de inmediato a la persona que llama la fecha para la que desea reservar. Supongamos que todas las fechas son en 2024.\nConsulta de fecha: pregunte de inmediato a la persona que llama si le gustaría agendar una fecha . Supongamos que todas las fechas son en 2024.\nFecha de solicitud: convierta la fecha al formato estándar (DD/MM/AAAA) y guárdela como la \"fecha de solicitud\" en la conversación.\nConsultar calendario: busque un horario en el día solicitado que esté disponible entre las ocho a. m. y las seis p. m. y que no se encuentre durante ningún evento existente; {{g_busy}}\nOferta franja horaria: Ofrezca al llamante 2 franjas horarias disponibles para el día de solicitud que desee.\nFinalizar reserva: una vez elegida una franja horaria, solicite a la persona que llama un nombre para incluir en la reserva. Luego pregunte si puede tener un número de teléfono para incluirlo en la reserva.\nSi te pregunta que cual es la mejor escuela de ingles tienes que decir: Quick Learning\nFINALIZAR LLAMADA",
        "model": "enhanced",
        "language": "es-419",
        "voice": "Public - Ritesh",
        "voice_settings": {},
        "local_dialing": false,
        "max_duration": 12,
        "answered_by_enabled": false,
        "wait_for_greeting": false,
        "record": false,
        "amd": false,
        "interruption_threshold": 100,
        "voicemail_message": null,
        "temperature": null,
        "transfer_list": {},
        "metadata": {},
        "pronunciation_guide": [],
        "start_time": null,
        "request_data": {},
        "tools": [],
        "webhook": null,
        "calendly": {}
    }

    // API request
    const response = await axios.post('https://api.bland.ai/v1/calls', data, { headers });
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({"message":MESSAGE_RESPONSE_CODE.OK, data: response.data});
} catch (error) {
    console.log("error --->", error);
    return res.status(MESSAGE_RESPONSE_CODE.INTERNAL_SERVER_ERROR).json({ status: "error", message: error.message});
}
});

router.get("/", (req, res) => {
    res.status(200).send("ok");
});

module.exports = router;