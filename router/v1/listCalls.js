const { default: axios } = require('axios');
const express = require('express');
const { MESSAGE_RESPONSE_CODE } = require('../../lib/constans');
const router = express.Router();

router.get('/', async (req, res) => {
    try {

        // Headers  
        const headers = {
            'Authorization': 'sk-c6oui0sdl4aluw7q8lg5huonr2y0lbo4se0ljwlf2ww3nkj4pscwhykwa7b5937c69' //TEST
            //'Authorization': 'sk-49sr1ne32nuawqe0txvswmxgepzujdi8owoim6em1otdmbmv41xqowi6sezosa2t69' //PROD
        };

        const response = await axios.get('https://api.bland.ai/v1/calls', { headers });
        console.log(response.data)
        return res.status(MESSAGE_RESPONSE_CODE.OK).json({ data: response.data });
    } catch (error) {


        return res.status(MESSAGE_RESPONSE_CODE.INTERNAL_SERVER_ERROR).json({ status: "error", message: error.message });
    }
});

module.exports = router;
