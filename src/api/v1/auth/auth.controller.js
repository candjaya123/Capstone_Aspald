const { nanoid } = require("nanoid")
const { User } = require('../models/index');
const { createError } = require("../utils/error");
const jwt = require('jsonwebtoken')

const register = async (req, res, next) => {
    try {
        const id = `user-${nanoid(16)}`
        const { name, email, password, address, dob, phone } = req.body;

        const existingUser = await User.findOne({ where: { email } })
        if (existingUser) return next(createError(400, 'User already exist!'))

        const user = await User.create({
            id,
            name,
            email,
            password,
            address,
            dob,
            phone
        })

        res.status(200).json('User register successfully')

    } catch (error) {
        next(error)
    }
}

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ where: { email } })

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) return next(createError(400, 'Wrong password or username!'))

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                isAdmin: user.isAdmin
            },
            process.env.ACCESS_TOKEN,
            {
                expiresIn: '1h'
            }
        )

        
        res.status(200).json({
            error: false,
            message: "success",
            loginResult: {
                userId: user.id,
                name: user.name,
                token: token
            }
        })
    } catch (error) {
        next(error)
    }
}


module.exports = {
    login, register
}