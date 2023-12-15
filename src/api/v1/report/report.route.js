const router = require('express').Router()
const upload = require('../middleware/upload');
const { predictImage } = require('./report.controller');

router.post('/predict', upload.single('image'), predictImage)


module.exports = router;