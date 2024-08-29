const { Router } = require("express");
const router = Router();
const Joi = require("joi");
const sedesController = require("../../controller/sedes.controller");

router.post("/", async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      address: Joi.string().required(),
      phone: Joi.string().required(),
      status: Joi.number().required(),
    });
    const { name, address, phone, status } = await schema.validateAsync(req.body);
    const sedes = await sedesController.create({
      name,
      address,
      phone,
      status,
    });
    return res.status(200).json({ message: "Sedes created", sedes });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const sedes = await sedesController.getAll();
    return res.status(200).json({ sedes });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
