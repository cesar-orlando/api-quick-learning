/* Librery */
const { Router } = require("express");
const router = Router();
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
/* Componentes */
const { MESSAGE_RESPONSE_CODE, MESSAGE_RESPONSE, VALIDATED_FIELDS } = require("../../lib/constans");
const userController = require("../../controller/user.controller");
const { getToken, TOKEN_MIDDLEWARE_ADMIN } = require("../../lib/utils");

/* Ruta para crear usuarios para el administrador. */
router.post("/", TOKEN_MIDDLEWARE_ADMIN, async (req, res) => {
  try {
    const schema = Joi.object({
      email: VALIDATED_FIELDS.EMAIL,
      password: VALIDATED_FIELDS.PASSWORD,
      repassword: VALIDATED_FIELDS.PASSWORD,
      name: VALIDATED_FIELDS.NAME,
      permissions: VALIDATED_FIELDS.PERMISSIONS,
      country: VALIDATED_FIELDS.COUNTRY,
      status: VALIDATED_FIELDS.STATUS,
    });

    const { email, password, name, permissions, country, repassword, status } = await schema.validateAsync(req.body);
    /* Validation to see if there is already a user with the same email. */
    const validateUser = await userController.findOneCustom({ email: email.toLowerCase() });
    if (validateUser) {
      return res.status(MESSAGE_RESPONSE_CODE.UNPROCESSABLE_ENTITY).json({ message: MESSAGE_RESPONSE.EMAIL_IS_ALREADY_REGISTERED });
    }
    /* Validation to see if the password is the same */
    if (repassword != password) {
      return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: MESSAGE_RESPONSE.PASSWORD_ERROR });
    }
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const data = {
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, salt),
      name,
      permissions,
      country,
      status,
    };
    const user = await userController.create(data);
    const token = getToken(req);
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, user, token });
  } catch (error) {
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

/* Login para poder entrar al administrador. */
router.post("/login", async (req, res) => {
  try {
    const schema = Joi.object({
      email: VALIDATED_FIELDS.EMAIL,
      password: VALIDATED_FIELDS.PASSWORD,
    });
    const { email, password } = await schema.validateAsync(req.body);
    const user = await userController.findOneCustom({ email: email.toLowerCase() });
    if (!user) {
      return res.status(MESSAGE_RESPONSE_CODE.UNAUTHORIZED).json({ message: MESSAGE_RESPONSE.USER_NOT_FOUND });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(MESSAGE_RESPONSE_CODE.UNAUTHORIZED).json({ message: MESSAGE_RESPONSE.PASSWORD_ERROR });
    }
    const token = jwt.sign({ _id: user._id, email: user.email, name: user.name }, process.env.JWT_KEY);
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, token });
  } catch (error) {
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

router.get("/", TOKEN_MIDDLEWARE_ADMIN, async (req, res) => {
  try {
    const users = await userController.findAll();
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ users });
  } catch (error) {
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

module.exports = router;
