const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/weebhook/clauia", async (req, res) => {
    try{
        const { MessageType, MediaContentType0, MediaUrl0, WaId, ProfileName, Body, From } = req.body;

        const userNumber = From;

        //Verificar si el usuario ya existe en la base de datos
        }catch(err){
            console.log(err);
            res.status(500).send("Error");
        }
});