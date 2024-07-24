const express = require('express');
const router = express.Router();
const { default: axios } = require('axios');
const { MESSAGE_RESPONSE_CODE } = require('../../../lib/constans');

router.get('/', async (req, res) => {
    try {

        const options = {
            method: 'GET',
            url: 'https://api.followupboss.com/v1/people?sort=created&limit=10&offset=0&includeTrash=false&includeUnclaimed=false',
            headers: {
                accept: 'application/json',
                authorization: 'Basic ZmthXzBxZHdUU1E3Smg4b3lmNzlrNHBYeElOZ2hGbDNtS1BaYWM6'
            }
        };

        const response = await axios.request(options)
        console.log(response)


        return res.status(MESSAGE_RESPONSE_CODE.OK).json({ data: response.data });


    } catch (error) {
        return res.status(MESSAGE_RESPONSE_CODE.INTERNAL_SERVER_ERROR).json({ status: "error", message: error.message });
    }
});

router.get('/events', async (req, res) => {
    try {
        const options = {
            method: 'GET',
            url: 'https://api.followupboss.com/v1/events?limit=10&offset=0',
            headers: {
                accept: 'application/json',
                authorization: 'Basic ZmthXzBxZHdUU1E3Smg4b3lmNzlrNHBYeElOZ2hGbDNtS1BaYWM6'
            }
        };

        const response = await axios.request(options)
        console.log(response)

        return res.status(MESSAGE_RESPONSE_CODE.OK).json({ data: response.data });
    } catch (error) {
        return res.status(MESSAGE_RESPONSE_CODE.INTERNAL_SERVER_ERROR).json({ status: "error", message: error.message });
    }
});

router.get('/people', async (req, res) => {
    try {
        const options = {
            method: 'GET',
            url: 'https://api.followupboss.com/v1/people/1126',
            headers: {
                accept: 'application/json',
                authorization: 'Basic ZmthXzBxZHdUU1E3Smg4b3lmNzlrNHBYeElOZ2hGbDNtS1BaYWM6'
            }
        };

        const response = await axios.request(options)
        console.log(response)

        return res.status(MESSAGE_RESPONSE_CODE.OK).json({ data: response.data });
    } catch (error) {
        return res.status(MESSAGE_RESPONSE_CODE.INTERNAL_SERVER_ERROR).json({ status: "error", message: error.message });
    }
});

module.exports = router;