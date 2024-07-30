function getToken(req) {
    return req?.user?.token ? req.user.token : null
}

module.exports = {
    getToken
}