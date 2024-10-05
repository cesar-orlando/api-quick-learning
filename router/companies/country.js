const express = require('express');
const router = express.Router();
const { STATUS } = require("../../lib/constans");
const countryController = require("../../controller/country.controller");
const { dataTijuana, dataMexicali, dataNL, dataJal } = require('../../db/dataCountry');

router.post('/', async (req, res) => {
    console.log("first dataTijuana ===>", dataMexicali.length );
    try {
        dataJal.forEach(async (data) => {
            await countryController.create(data);
        }
        );
        return res.status(200).json({ status: 'success' });

        const countryData = await countryController.create(data);
        return res.status(200).json({ data: countryData });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const countries = await countryController.getAll();
        return res.status(200).json({ data: countries });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

router.post('/state', async (req, res) => {
    try {
        console.log("req.params.state  ===>", req.body.state );
        const countryData = await countryController.findByCountry({ state: req.body.state });
        return res.status(200).json({ data: countryData, total: countryData.length });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
