/* Librery */
const { Router } = require("express");
const router = Router();
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
/* Componentes */
const {MESSAGE_RESPONSE_CODE, MESSAGE_RESPONSE, VALIDATED_FIELDS,} = require("../../lib/constans");
const userController = require("../../controller/user.controller");
const { getToken } = require("../../lib/utils");

router.post("/", async (req, res) => {
  try {
    const schema = Joi.object({
      email: VALIDATED_FIELDS.EMAIL,
      password: VALIDATED_FIELDS.PASSWORD,
      repassword: VALIDATED_FIELDS.PASSWORD,
      name: VALIDATED_FIELDS.NAME,
      //permissions: VALIDATED_FIELDS.PERMISSIONS,
      status: VALIDATED_FIELDS.STATUS,
    });

    const { email, password, name, permissions, repassword, status } = await schema.validateAsync(req.body);
      /* Validation to see if there is already a user with the same email. */
    const validateUser = await userController.findOneCustom({ email: email.toLowerCase() });
    if (validateUser) {
      return res
        .status(MESSAGE_RESPONSE_CODE.UNPROCESSABLE_ENTITY)
        .json({ message: MESSAGE_RESPONSE.EMAIL_IS_ALREADY_REGISTERED });
    }
    /* Validation to see if the password is the same */
    if (repassword != password) {
      return res
        .status(MESSAGE_RESPONSE_CODE.BAD_REQUEST)
        .json({ message: MESSAGE_RESPONSE.PASSWORD_ERROR });
    }
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const data = {
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, salt),
      name,
      permissions,
      status,
    };
    const user = await userController.create(data);
    const token = getToken(req);
    return res
      .status(MESSAGE_RESPONSE_CODE.OK)
      .json({ message: MESSAGE_RESPONSE.OK, user, token });
  } catch (error) {
    return res
      .status(MESSAGE_RESPONSE_CODE.BAD_REQUEST)
      .json({ message: error.message });
  }
});

module.exports = router;
