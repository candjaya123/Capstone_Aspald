const jwt = require('jsonwebtoken');
const { createError } = require('./error');

const verifyToken = (req, res, next) => {
    let token = req.headers.authorization.split(" ")[1];

    if (!token) return next(createError(401, 'Unauthorized'));

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
        if (err) return next(createError(403, 'Token is not valid'))
        req.user = user
        console.log(user);
        next()
    });
}

const verifyUser = (req, res, next) => {
    verifyToken(req, res, () => {
        // console.log(req.user.id);
        if (req.user.id || req.user.isAdmin) {
            next()
        } else {
            return next(createError(403, 'You are not authorized'))
        }
    });
}

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            next()
        } else {
            return next(createError(403, 'You are not authorized!'))
        }
    })
}

module.exports = {
    verifyAdmin, verifyUser, verifyToken
}