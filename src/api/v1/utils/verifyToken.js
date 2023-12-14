const jwt = require('jsonwebtoken');
const { creeateError } = require('./error');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) return next(creeateError(401, 'Unauthorized'));

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
        if (err) return next(creeateError(403, 'Token is not valid'))
        req.user = user
        next()
    });
}

const verifyUser = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.id == req.params.id || req.user.isAdmin) {
            next()
        } else {
            return next(creeateError(403, 'You are not authorized'))
        }
    });
}

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            next()
        } else {
            return next(creeateError(403, 'You are not authorized!'))
        }
    })
}

module.exports = {
    verifyAdmin, verifyUser, verifyToken
}