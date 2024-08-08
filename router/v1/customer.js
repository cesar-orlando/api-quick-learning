const { Router } = require('express');
const customerController = require('../../controller/customer.controller');
const { MESSAGE_RESPONSE_CODE } = require('../../lib/constans');
const router = Router();

router.get('/allcustomers', async (req, res) => {
    try {
        const customers = await customerController.getAllCustom();
        return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: 'All customers', customers });
    }
    catch (error) {
        console.log(error);
    }
});

router.post('/addcustomer', (req, res) => {
    res.send('Hello World');
});

module.exports = router;