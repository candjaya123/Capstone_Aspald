const tf = require('@tensorflow/tfjs-node');
const fs = require('fs')
const path = require('path')
const fileType = require('file-type');

// const modelPath = require('../model/model.json')
const modelPath = path.join(__dirname, '..', 'tfModel', 'model.json');

const { createError } = require('../utils/error');
const sharp = require('sharp');

let model;

console.log(`Loading model from: file:/${modelPath}`);
tf.loadLayersModel(`file://${modelPath}`).then(loadedModel => {
    model = loadedModel
})

const predictImage = async (req, res, next) => {
    try {
        if (!req.file) return next(createError(400, 'No image upluaded.'));

        const imageBuffer = fs.readFileSync(req.file.path);

        const type = await fileType.fromBuffer(imageBuffer)
        if(!type || !type.mime.startsWith('image/')){
            fs.unlinkSync(req.file.path)
            createError(400, 'Uploaded file is not an image.');
        }

        const resizedImage = await sharp(imageBuffer)
            .resize(224,224)
            .toBuffer();

        const tensor = tf.node.decodeImage(resizedImage, 3).expandDims();

        const prediction = await model.predict(tensor).data();

        res.json({ prediction });

        // fs.unlinkSync(req.file.path);
    } catch (error) {
        next(error)
    }
}


module.exports = { predictImage}