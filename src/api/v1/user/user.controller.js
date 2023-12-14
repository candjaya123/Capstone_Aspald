const { User } = require('../models/index');
const { createError } = require('../utils/error');


const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, password, address, dob, phone } = req.body;

        const user = await User.findByPk(id);

        if (!user) return next(createError(404, 'User not found'));

        //update user's property
        user.name = name;
        user.address = address,
            user.dob = dob,
            user.phone = phone

        if (password) await user.comparePassword(password)

        await user.save();

        res.status(200).json({ 
            error: false, 
            message: 'User updated successfully' 
        })


    } catch (error) {
        next(error)
    }
}

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params.id;
        const user = await User.findByPk(id);

        await user.destroy();
        res.status(200).json({ message: 'user deleted successfully' });
    } catch (error) {
        next(error)
    }
}

const getUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
        });

        if (!users) return next(createError(404, 'There is no User'));

        res.status(200).json({ users });
    } catch (error) {
        next(error)
    }
}

const getUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) return next(createError(404, 'User not found'));
        res.status(200).json(user);
    } catch (error) {
        next(error)
    }
}

module.exports = {
    updateUser,
    deleteUser,
    getUsers,
    getUser
}