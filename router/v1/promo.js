const { Router } = require("express");
const router = Router();
const Joi = require("joi");

const { MESSAGE_RESPONSE_CODE, MESSAGE_RESPONSE, VALIDATED_FIELDS } = require("../../lib/constans");

const promoController = require("../../controller/promo.controller");

router.post("/", async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      status: Joi.number().required(),
    });

    const { name, description, status } = await schema.validateAsync(req.body);

    const data = {
      name,
      description,
      status,
    };

    const promo = await promoController.create(data);

    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, promo });
  } catch (error) {
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const data = await promoController.getAll();
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, data });
  } catch (error) {
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await promoController.findById(id);
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, data });
  } catch (error) {
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      status: Joi.number().required(),
    });

    const { name, description, status } = await schema.validateAsync(req.body);

    const data = {
      name,
      description,
      status,
    };

    const { id } = req.params;
    const promo = await promoController.updateOneCustom({ _id: id }, data);
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, promo });
  } catch (error) {
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

module.exports = router;
