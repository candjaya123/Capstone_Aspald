const { verifyAdmin, verifyUser } = require('../utils/verifyToken');
const { updateUser, getUser, deleteUser, getUsers } = require('./user.controller');

const router = require('express').Router()


router.put('/:id', verifyUser, updateUser)
router.get('/:id', verifyUser, getUser);
router.delete('/:id', verifyAdmin, deleteUser);
router.get('/', verifyAdmin, getUsers);

module.exports = router;