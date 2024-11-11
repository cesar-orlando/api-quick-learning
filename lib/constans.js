const Joi = require("joi");

module.exports = {
  STATUSNEW: {
    active: true,
    desactive: false,
  },
  STATUSBANNER: {
    active: true,
    desactive: false,
  },
  STATUS_PLAYER: {
    active: true,
    desactive: false,
  },
  STATUS_HIGHLIGHTS: {
    active: true,
    desactive: false
  },
  STATUS_CUSTOMER: {
    ACTIVO: 1,
    CONCRETADO: 2,
    PENDIENTE: 3,
    SUSPENDED: 4
  },
  STATUS: {
    INACTIVO: 0,
    ACTIVE: 1,
    DELETED: 2,
    BANNED: -1
  },
  PAY_STATUS: {
    IN_TRANSIT: 1,
    COMPLETED: 2,
    CANCEL: -1
  },
  SHIP_STATUS: {
    READY: 1,
    IN_TRANSIT: 2,
    DELIVERED: 3,
    CANCEL: -1
  },
  VALIDATED_FIELDS: {
    NAME: Joi.string().pattern(/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]{3,80}$/).required().messages({
      'string.base': 'El campo name tiene que ser de tipo string',
      'string.empty': 'El campo name no puede ser un campo vacio',
      'string.pattern.base': 'El campo name es invalido',
      // 'string.pattern': 'La cadena debe contener caracteres alfabéticos en mayúsculas y minúsculas, caracteres especiales como la letra "ñ" y vocales acentuadas, además de espacios en blanco. La longitud de la cadena debe estar entre 3 y 80 caracteres.',
      'any.required': 'El campo name es requerido'
    }),
    LAST_NAME: Joi.string().pattern(/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]{3,80}$/).required().messages({
      'string.base': 'El campo lastname tiene que ser de tipo string',
      'string.empty': 'El campo lastname no puede ser un campo vacío',
      'string.pattern.base': 'El campo lastname tiene un formato incorrecto',
      'any.required': 'El campo lastname es requerido'
    }),
    PASSWORD: Joi.string().messages({
      'string.base': 'El campo password debe ser de tipo string',
      'string.pattern.base':
        'El campo password debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial, y tener una longitud mínima de 8 caracteres',
      'any.required': 'El campo password es requerido'
    }),
    COUNTRY: Joi.string().required().messages({
      'string.base': 'El campo country debe ser de tipo string',
      'string.empty': 'El campo country no puede estar vacío',
      'any.required': 'El campo country es requerido'
    }),
    ADDRESS: Joi.string().required().messages({
      'string.base': 'El campo address debe ser de tipo string',
      'string.empty': 'El campo address no puede estar vacío',
      'any.required': 'El campo address es requerido'
    }),
    COMPANY: Joi.string().required().messages({
      'string.base': 'El campo company debe ser de tipo string',
      'string.empty': 'El campo company no puede estar vacío',
      'any.required': 'El campo company es requerido'
    }),
    ROLE: Joi.string().required().messages({
      'string.base': 'El campo role tiene que ser de tipo string',
      'string.empty': 'El campo role no puede ser un campo vacio',
      'any.required': 'El campo role es requerido'
    }),
    IMG: Joi.string().regex(/^(\/|https:).*$/).required().messages({
      'string.base': 'El campo img tiene que ser de tipo string',
      'string.empty': 'Elcampo img no puede ser un campo vacio',
      'string.pattern.base':
        'El campo img debe empezar con "/" o "https:" ',
      'any.required': 'El campo img es requerido'
    }),
    VIDEO: Joi.string().required().messages({
      'string.base': 'El campo video tiene que ser de tipo string',
      'string.empty': 'El campo video no puede ser un campo vacio',
      'any.required': 'El campo video es requerido'
    }),
    TITLE: Joi.string().required().messages({
      'string.base': 'El campo title tiene que ser de tipo string',
      'string.empty': 'El campo title no puede ser un campo vacio',
      'any.required': 'El campo title es requerido'
    }),
    SUBTITLE: Joi.string().required().messages({
      'string.base': 'El campo subtitle tiene que ser de tipo string',
      'string.empty': 'El campo subtitle no puede ser un campo vacio',
      'any.required': 'El campo subtitle es requerido'
    }),
    AUTHOR: Joi.string().required().messages({
      'string.base': 'El campo author tiene que ser de tipo string',
      'string.empty': 'El campo author no puede ser un campo vacio',
      'any.required': 'El campo author es requerido'
    }),
    TEAM: Joi.string().required().messages({
      'string.base': 'El campo team tiene que ser de tipo string',
      'string.empty': 'El campo team no puede ser un campo vacio',
      'any.required': 'El campo team es requerido'
    }),
    OPPONENT: Joi.string().required().messages({
      'string.base': 'El campo opponent tiene que ser de tipo string',
      'string.empty': 'El campo opponent no puede ser un campo vacio',
      'any.required': 'El campo opponent es requerido'
    }),
    SEDE: Joi.string().required().messages({
      'string.base': 'El campo sede tiene que ser de tipo string',
      'string.empty': 'El campo sede no puede ser un campo vacio',
      'any.required': 'El campo sede es requerido'
    }),
    DESC: Joi.string().required().messages({
      'string.base': 'El campo desc tiene que ser de tipo string',
      'string.empty': 'El campo desc no puede ser un campo vacio',
      'any.required': 'El campo desc es requerido'
    }),
    CATEGORY: Joi.string().required().messages({
      'string.base': 'El campo category tiene que ser de tipo string',
      'string.empty': 'El campo category no puede ser un campo vacio',
      'any.required': 'El campo category es requerido'
    }),
    FILE: Joi.string().required().messages({
      'string.base': 'El campo file tiene que ser de tipo string',
      'string.empty': 'El campo file no puede ser un campo vacio',
      'any.required': 'El campo file es requerido'
    }),
    COUNTRY: Joi.string().required().messages({
      'string.base': 'El campo country tiene que ser de tipo string',
      'string.empty': 'El campo country no puede ser un campo vacio',
      'any.required': 'El campo country es requerido'
    }),
    MAIN_PHOTO: Joi.string().required().messages({
      'string.base': 'El campo main_phonto tiene que ser de tipo string',
      'string.empty': 'El campo main_phonto no puede ser un campo vacio',
      'any.required': 'El campo main_phonto es requerido'
    }),
    PLAYER_NUMBER: Joi.string().required().messages({
      'string.base': 'El campo number tiene que ser de tipo string',
      'string.empty': 'El campo number no puede ser un campo vacio',
      'any.required': 'El campo number es requerido'
    }),
    AMOUNT: Joi.number().required().min(0).messages({
      'number.min': 'El campo amount no puede ser menor a 0',
      'number.base': 'El  campo amount tiene que ser number',
      'number.empty': 'El campo amount no puede ser un campo vacio',
      'any.required': 'El campo amount es requerido'
    }),
    BALANCE: Joi.number().required().min(0).messages({
      'number.min': 'El campo total no puede ser menor a 0',
      'number.base': 'El  campo total tiene que ser number',
      'number.empty': 'El campo total no puede ser un campo vacio',
      'any.required': 'El campo total es requerido'
    }),
    HEIGHT: Joi.string().required().messages({
      'string.base': 'El campo height tiene que ser de tipo string',
      'string.empty': 'El campo height no puede ser un campo vacio',
      'any.required': 'El campo height es requerido'
    }),
    WEIGHT: Joi.string().required().messages({
      'string.base': 'El campo weight tiene que ser de tipo string',
      'string.empty': 'El campo weight no puede ser un campo vacio',
      'any.required': 'El campo weight es requerido'
    }),
    GAMES_DATES: Joi.array().required().messages({
      'array.base': 'El campo games_dates, tiene que ser tipo Array',
      'array.empty': 'El campo games_dates no puede ser un campo vacio',
      'any.required': 'El campo games_dates es requerido'
    }),


    PERMISSIONS: Joi.number().required().messages({
      'number.base': 'El campo permissions, tiene que ser tipo Array',
      'number.empty': 'El campo permissions no puede ser un campo vacio',
      'number.required': 'El campo permissions es requerido'
    }),

    DATE: Joi.date().required().messages({
      'date.base': 'El campo date, tiene que ser tipo Date',
      'date.empty': 'El campo date no puede ser un campo vacio',
      'any.required': 'El campo date es requerido'
    }),
    IS_LOCAL: Joi.number().min(1).max(3).required().messages({
      'number.base': 'El campo isLocal, tiene que ser tipo number',
      'number.min': 'El campo isLocal, tiene que ser entre 1 - 3',
      'number.max': 'El campo isLocal, tiene que ser entre 1 - 3',
      'number.empty': 'El campo isLocal no puede ser un campo vacio',
      'number.required': 'El campo isLocal es requerido',
      'any.required': 'El campo isLocal es requerido'
    }),
    STOCK: Joi.number().min(0).required().messages({
      'number.base': 'El campo stock, tiene que ser tipo number',
      'number.min': 'El campo stock, tiene que ser mayor a 0',
      'number.empty': 'El campo stock no puede ser un campo vacio',
      'number.required': 'El campo stock es requerido',
      'any.required': 'El campo stock es requerido'
    }),
    ORDER: Joi.number().min(0).required().messages({
      'number.base': 'El campo order, tiene que ser tipo number',
      'number.min': 'El campo order, tiene que ser mayor a 1',
      'number.empty': 'El campo order no puede ser un campo vacio',
      'number.required': 'El campo order es requerido',
      'any.required': 'El campo order es requerido'
    }),
    GAME_STATUS: Joi.number().min(1).max(4).required().messages({
      'number.base': 'El campo game_status, tiene que ser tipo number',
      'number.min': 'El campo game_status, tiene que ser entre 1 - 4',
      'number.max': 'El campo game_status, tiene que ser entre 1 - 4',
      'number.empty': 'El campo game_status no puede ser un campo vacio',
      'number.required': 'El campo game_status es requerido',
      'any.required': 'El campo game_status es requerido'
    }),
    STATUS: Joi.number().min(0).max(2).required().messages({
      'number.base': 'El campo status, tiene que ser tipo number',
      'number.min': 'El campo status, tiene que ser entre 0 - 2',
      'number.max': 'El campo status, tiene que ser entre 0 - 2',
      'number.empty': 'El campo status no puede ser un campo vacio',
      'number.required': 'El campo status es requerido',
      'any.required': 'El campo status es requerido'
    }),
    TYPE: Joi.number().min(0).required().messages({
      'number.base': 'El campo type, tiene que ser tipo number',
      'number.min': 'El campo type, tiene que ser mayor a 0',
      'number.empty': 'El campo type no puede ser un campo vacio',
      'number.required': 'El campo type es requerido',
      'any.required': 'El campo type es requerido'
    }),
    PRICE: Joi.object().required().messages({
      'object.base': 'El campo price debe ser de tipo Object',
      'any.required': 'El campo price es requerido'
    }),
    PRICE_LIBERPASS: Joi.number().min(1).required().messages({
      'number.base': 'El campo price, tiene que ser tipo number',
      'number.min': 'El campo price, tiene que ser mayor 1',
      'number.empty': 'El campo price no puede ser un campo vacio',
      'number.required': 'El campo price es requerido',
      'any.required': 'El campo price es requerido'
    }),
    BIRTHDATE: Joi.string().pattern(/^(19[0-9]{2}|20[0-9]{2})-(0[1-9]|1[0-2])-([0-2][0-9]|3[01])$/).required().messages({
      'string.base': 'El campo birthday tiene que ser de tipo string',
      'string.empty': 'El campo birthday no puede ser un campo vacio',
      'string.pattern.base': 'El campo birthday tiene un formato invalido',
      'any.required': 'El campo birthday es requerido'
    }),
    OFFICE_HOURS: Joi.string().required().messages({
      'array.base': 'El campo office_hours tiene que ser de tipo string',
      'any.empty': 'El campo office_hours no puede ser un campo vacio',
      'any.required': 'El campo office_hours es requerido'
    }),
    PHONE: Joi.string().pattern(/^([0-9]{2}-?){4}[0-9]{2}$/).required().messages({
      'string.base': 'El campo phone tiene que ser de tipo string',
      'string.empty': 'El campo phone no puede ser un campo vacio',
      'string.pattern.base': 'El campo phone tiene un formato invalido',
      'any.required': 'El campo phone es requerido'
    }),
    EMAIL: Joi.string().email({ minDomainSegments: 2, maxDomainSegments: 3 }).required().messages({
      'string.base': 'El campo email tiene que ser de tipo string',
      'string.empty': 'El campo email no puede ser un campo vacio',
      'string.email': 'El campo email tiene un formato invalido',
      'any.required': 'El campo email es requerido'
    }),
    ID_MONGOOSE: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.base': 'El _id tiene que ser de tipo string',
      'string.pattern.base': 'El _id tiene formato invalido',
      'string.empty': 'El campo _id no puede ser un campo vacio',
      'any.required': 'El campo _id es requerido'
    }),
  },
  MESSAGE_RESPONSE_CODE: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
  },
  MESSAGE_RESPONSE: {
    OK: "OK",
    CREATED: "Creado.",
    BAD_REQUEST: "Solicitud incorrecta.",
    UNAUTHORIZED: "No autorizado.",
    CREATE_SUCCESS: "El elemento se ha creado corrrectamente.",
    CREATE_ERROR: "El elemento no se ha creado.",
    UPDATE_SUCCESS: "El elemento se ha actualizado correctamente.",
    UPDATE_ERROR: "El elemento no se ha actualizado.",
    ELEMENT_EXIST: "El elemento ya esta registrado.",
    DELETE_SUCCESS: "El elemento se ha eliminado correctamente.",
    NUMBER_REGISTRADO: "El número ya esta registrado",
    CUSTOMER_REGISTER: "Cliente registrado",
    CUSTOMER_ALREADY_REGISTERED: "Cliente ya registrado",
    CARD_CREATED: "Tarjeta registrada.",
    CARD_BANK_CREATED: "Tarjeta bancaria registrada.",
    CARD_BANK_DECLINED: "Tarjeta bancaria declinada.",
    CARD_BANK_EXPIRED: "Tarjeta bancaria expirada.",
    SEND_TOKEN_EMAIL_USER_MESSAGE: "Te ha llegado un correo con un código de verificación.",
    NAME_PERMISSION_INVALID: "El nombre del permiso no es valido.",
    CAN_NOT_DELETE: "El elemento no se pudo eliminar",
    USER_NOT_HAVE_PERMISSIONS: "El usuario no tiene permisos.",
    USER_HAS_ENABLE_PERMISSIONS: "El usuario ya cuenta con estos permisos.",
    USER_HAS_DISABLE_PERMISSIONS: "El usuario no cuenta con estos permisos.",
    PERMISSION_CREATE_ERROR: "El permiso no se registró.",
    PERMISSION_CREATE_SUCCESS: "El permiso se registró correctamente.",
    NAME_PERMISSION_INVALID: "El nombre del permiso no es valido.",
    STATUS_INVALID: "El estado es invalido.",
    TARGET_INVALID: "El target es invalido.",
    PERMISSION_NOT_APLICATED: "El permiso no se pudo habilitar.",
    PERMISSION_DELETE_SUCCESS: "El permiso fue eliminado.",
    RECOVER_PASSWORD_SUCCESS: "La contraseña se ha restablecido exitosamente.",
    USER_NOT_FOUND: "Usuario no encontrado.",
    OPERATION_FAILED: "Operación fallida.",
    EMAIL_AVAILABLE: "Correo disponible para registro de nuevo usuario.",
    INVALID_DATE: "Fecha inválida.",
    NEW_CARDS_COLLECTION_EMPTY: "No hay tarjetas libres disponibles.",
    NEW_CARDS_COLLECTION_FREE_EMPTY: "No hay tarjetas asociadas disponibles.",
    COMPANY_NOT_HAVE_PERSONAL: "La empresa no tiene personal.",
    COMPANY_NOT_HAVE_TRANSACTIONS: "La empresa no tiene datos suficientes.",
    RFID_NUMBER_INVALID: "Número de RFID no válido.",
    BILL_SUCCESS: "Compra exitosa.",
    LOGIN_DATA_ERROR: "Correo o contraseña no válidos.",
    AMOUNT_NOT_VALID: "El monto no es válido.",
    FINANCIAL_RECAP_NUMBER_INVALID: "El ID del corte no es válido.",
    REFERENCE_REQUIRED: "Referencia de pago requerida.",
    DEPOSIT_SUCCESS: "Depósito correcto.",
    DEPOSIT_ERROR: "Depósito erróneo.",
    DEPOSIT_IN_TRANSIT: "Depósito en transacción.",
    CARD_IS_NOT_REGISTERED: "La tarjeta no está registrada en el sistema, contacte a servicio al cliente.",
    USER_CREATED: "Usuario creado.",
    NOT_FOUND: "No encontrado.",
    INVALID_TOKEN: "Sesion expirada, por favor ingrese de nuevo.",
    MIN_AMOUNT_ERROR: "El monto no puede ser inferior a $100.00 mxn.",
    NOT_HAVE_COINCIDENCES: "No se encontraron resultados de búsqueda.",
    HAVE_COINCIDENCES: "Resultados de búsqueda encontrados, por favor intente de nuevo.",
    DATA_IS_INCOMPLETE: "Los datos están incompletos.",
    DATA_NOT_REQUIRED: "Existen datos que no son requeridos.",
    COMPANY_IS_ALREADY_REGISTERED: "La empresa ya está registrada.",
    EMAIL_IS_ALREADY_REGISTERED: "El correo electrónico ya está registrado.",
    ACOUNT_IS_ALREADY_REGISTERED: "El correo electrónico o número de teléfono ya está registrado.",
    TEAM_IS_ALREADY_REGISTERED: "El equipo ya está registrado.",
    RECINTO_NOT_EXIST: "Recinto no encontrado.",
    INTERNAL_SERVER_ERROR: "Error interno del servidor.",
    URL_IMAGE_NOT_VALID: "La imagen no es válida.",
    NAME_INVALID: "El nombre no es válido.",
    CATEGORY_INVALID: "La categoría no es válida.",
    USER_NAME_INVALID: "Nombre de usuario inválido.",
    USER_EMAIL_INVALID: "Correo electrónico de usuario inválido.",
    USER_PASSWORD_INVALID: "Contraseña de usuario inválida. Debe contener al menos: 1 carácter especial, 1 número, 1 letra mayúscula y tener 8 o más caracteres.",
    SAME_NEW_OLD_PASSWORD: "La nueva contraseña es igual a la contraseña actual.",
    CARD_IS_REFERENCED: "La tarjeta ya está referenciada.",
    CARD_NUMBER_INVALID: "Número de tarjeta inválido.",
    CARD_IS_REGISTERED: "La tarjeta ya está registrada.",
    USER_ID_INVALID: "ID de usuario inválido.",
    USER_NOT_HAVE_CARDS: "El usuario no tiene tarjetas.",
    USER_NOT_HAVE_TRANSACTION: "El usuario no tiene transacciones.",
    USER_READY_EXIST: "El usuario ya existe.",
    CARD_UPDATED_SUCCESS: "La tarjeta se actualizó exitosamente.",
    CARD_UPDATED_FAILED: "Error en la actualización de la tarjeta.",
    CARD_DELETE_SUCCESS: "Tarjeta eliminada exitosamente.",
    CARD_DELETE_FAILED: "Error al eliminar la tarjeta.",
    OPENPAY_CARD_DELETE_FAILED: "Error al eliminar la tarjeta de Open Pay.",
    OPENPAY_CARD_DELETE_SUCCESS: "Tarjeta de Open Pay eliminada exitosamente.",
    INVALID_CARD_DATA: "Datos de tarjeta inválidos.",
    INVALID_CARD_TYPE: "Tipo de tarjeta inválido.",
    CARD_INSUFFICIENT_FUNDS: "La tarjeta no cuenta con fondos suficientes.",
    PRODUCT_INVALID_DATA: "Datos de producto inválidos.",
    PRODUCT_CREATE_SUCCESS: "Producto creado exitosamente.",
    PRODUCT_CREATE_FAILED: "Error en la creación del producto.",
    PRODUCT_UPDATE_SUCCESS: "Producto actualizado exitosamente.",
    PRODUCT_UPDATE_FAILED: "Error en la actualización del producto.",
    PRODUCT_DELETE_SUCCESS: "Producto eliminado exitosamente.",
    PRODUCT_DELETE_FAILED: "Error al eliminar el producto.",
    TRANSACTION_FAILED: "Transacción fallida.",
    TRANSACTION_INSUFFICIENT_BALANCE: "Transacción fallida debido a fondos insuficientes.",
    INSUFFICIENT_QUANTITY: "Cantidad insuficiente.",
    TRANSACTION_NOT_FOUND: "Transacción no encontrada.",
    CHARGE_FAILED: "Cargo fallido.",
    CHARGE_SUCCESS: "Cargo exitoso.",
    PASSWORD_ERROR: "Error de contraseña.",
    PAYMENT_ACCOUNT_DELETE_SUCCESS: "Cuenta de pago eliminada exitosamente.",
    INVALID_SELLER: "El vendedor no existe.",
    SPORT_TEAM_INVALID_DATA: "Datos de equipo deportivo inválidos.",
    INVALID_ID: "ID inválido."
  },
  SOCIAL: {
    GOOGLE: "Google",
    FACEBOOK: "Facebook",
    TWITTER: "Twitter",
    INSTAGRAM: "Instagram",
    LINKEDIN: "Linkedin",
    YOUTUBE: "Youtube",
    TIKTOK: "Tiktok",
    PINTEREST: "Pinterest",
    SNAPCHAT: "Snapchat",
  }, 
  GALLERIES_TYPE: {
    MEDIA: 1,
    EVENT: 2
  }
};

