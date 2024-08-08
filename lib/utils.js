const jwt = require("jsonwebtoken");

const { MESSAGE_RESPONSE_CODE, MESSAGE_RESPONSE, STATUS } = require("./constans");
const userController = require("../controller/user.controller");

async function TOKEN_MIDDLEWARE_ADMIN(req, res, next) {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '') || null;
    if (!token){
        return res.status(MESSAGE_RESPONSE_CODE.UNAUTHORIZED).json({
            message: MESSAGE_RESPONSE.UNAUTHORIZED,
            status: MESSAGE_RESPONSE_CODE.UNAUTHORIZED
        });
    }

    const KEY = process.env.JWT_KEY;
    let pass = true;
    jwt.verify(token, KEY, async (err) => {
        if (err) {
            // El token no es válido
            console.error('Token inválido:', err.message);
            // const route = (req.originalUrl + '')
            // if (!(route.includes('transaction') || route.includes('payments'))) {
            //     return sendRequestError(MESSAGE_RESPONSE.INVALID_TOKEN, res, true, MESSAGE_RESPONSE_CODE.UNAUTHORIZED)
            // }
            return res.status(MESSAGE_RESPONSE_CODE.UNAUTHORIZED).json({
                message: MESSAGE_RESPONSE.INVALID_TOKEN,
                status: MESSAGE_RESPONSE_CODE.UNAUTHORIZED
            });
        }
        try {
            let user = await getUserFromTokenRequest(req, pass);
            if ((user && user.status == STATUS.ACTIVE) || user) {
                req.user = user;
                !pass ? delete req.user.token : null;
                next();
            }
            else {
                return res.status(MESSAGE_RESPONSE_CODE.UNAUTHORIZED).json({
                    message: MESSAGE_RESPONSE.UNAUTHORIZED,
                    status: MESSAGE_RESPONSE_CODE.UNAUTHORIZED
                });
            }
        } catch (err) {
            return res.status(MESSAGE_RESPONSE_CODE.UNAUTHORIZED).json({
                message: MESSAGE_RESPONSE.UNAUTHORIZED,
                status: MESSAGE_RESPONSE_CODE.UNAUTHORIZED
            });
        }


    });

    async function getUserFromTokenRequest(req, pass = false) {
        const token = (req.headers['authorization'] || '').replace('Bearer ', '');
        const KEY = process.env.JWT_KEY;
    
        try {
            let decoded = !pass ? jwt.verify(token, process.env.JWT_KEY) : jwt.decode(token, process.env.JWT_KEY);
            let user = await userController.findById(decoded._id);
            if (user) {
                const payload = {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                };
                pass == true ? jwt.sign(payload, KEY) : null;
                req.user = user;
                return user;
            }
            return null;
        } catch (err) {
            console.log(err);
            return null;
        }
    }
}
    

function getToken(req) {
    return req?.user?.token ? req.user.token : null
}


module.exports = {
    getToken,
    TOKEN_MIDDLEWARE_ADMIN
}