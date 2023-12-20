const tf = require('@tensorflow/tfjs-node');
const fs = require('fs')
const path = require('path')
const fileType = require('file-type');
const { Reports, User } = require('../models/index')
const { nanoid } = require("nanoid")
const { Op } = require('sequelize')
const { Storage } = require('@google-cloud/storage')
const { createError } = require('../utils/error');
const sharp = require('sharp');
const dotenv = require('dotenv')
dotenv.config()

// const modelPath = require('../model/model.json')
const modelPath = path.join(__dirname, '..', 'tfModel', 'model.json');

//Google storage
// const storage = new Storage({ keyFilename: path.join(__dirname, '../utils/casptone-aspald-9d87d5a6fc9b.json') });
const storage = new Storage({
    credentials: {
      type: 'service_account',
      project_id: process.env.PROJECT_ID,
      private_key_id: process.env.PRIVATE_KEY_ID,
      private_key:process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.CLIENT_EMAIL,
      client_id: process.env.CLIENT_ID,
      auth_uri: process.env.AUTH_URI,
      token_uri: process.env.TOKEN_URI,
      auth_provider_x509_cert_url: process.env.CERT_URL,
      client_x509_cert_url: process.env.CLIENT_CERT_URL,
      universe_domain: "googleapis.com"
      }
  });
const bucketName = 'artifacts.casptone-aspald.appspot.com';

async function uploadImageToGCS(buffer, destination, mimeType) {
    const blob = storage.bucket(bucketName).file(destination);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: mimeType,
        },
    });

    blobStream.on('error', err => console.error(err));
    blobStream.on('finish', () => console.log(`${destination} uploaded to ${bucketName}`));
    blobStream.end(buffer);

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
    return publicUrl;
}



let model;

console.log(`Loading model from: file:/${modelPath}`);
tf.loadLayersModel(`file://${modelPath}`).then(loadedModel => {
    model = loadedModel
})

const labels = [
    'lubang',
    'pengelupasan_lapisan_permukaan',
    'retak_blok',
    'retak_kulit_buaya',
    'retak_memanjang',
    'retak_pinggir'
];

const createReport = async (req, res, next) => {
    try {
        if (!req.file) return next(createError(400, 'No image upluaded.'));

        const imageBuffer = req.file.buffer

        const type = await fileType.fromBuffer(imageBuffer)
        if (!type || !type.mime.startsWith('image/')) {
            fs.unlinkSync(req.file.path)
            createError(400, 'Uploaded file is not an image.');
        }

        const resizedImage = await sharp(imageBuffer)
            .resize(224, 224)
            .toBuffer();

        const tensor = tf.node.decodeImage(resizedImage, 3).expandDims();

        const prediction = await model.predict(tensor).data();

        //map the prediction index
        const filteredLabels = labels.filter((label, index) => prediction[index] === 1)

        const id = `report-${nanoid(16)}`
        const { description, lat, lon } = req.body;

        const ext = path.extname(req.file.originalname);
        const destination = `images/${req.file.fieldname}-${Date.now()}${ext}`;

        const publicUrl = await uploadImageToGCS(req.file.buffer, destination, req.file.mimetype)

        console.log(publicUrl);

        const report = await Reports.create({
            id,
            userId: req.user.id,
            description,
            damageType: filteredLabels[0],
            photoUrl: publicUrl,
            lat,
            lon,
            isAcc: false
        })

        res.json({ report })

        // fs.unlinkSync(req.file.path);
    } catch (error) {
        next(error)
    }
}

const getReports = async (req, res, next) => {
    try {

        const page = req.query.page ? parseInt(req.query.page) : 1;
        const size = req.query.size ? parseInt(req.query.size) : 10;
        const searchQuery = req.query.search || ''

        const offset = (page - 1) * size;

        let searchCondition = {};
        if (searchQuery) {
            searchCondition = {
                [Op.or]: [
                    { description: { [Op.like]: `%${searchQuery}%` } }
                ]
            }
        }

        const reports = await Reports.findAll({
            where: searchCondition,
            include: [
                {
                    model: User,
                    attributes: ['name']
                }
            ],
            offset,
            limit: size
        });

        const userReports = reports.map((report) => ({
            id: report.id,
            name: report.User.name,
            description: report.description,
            damageType: report.damageType,
            photoUrl: report.photoUrl,
            lat: report.lat,
            lon: report.lon,
            isAcc: report.isAcc,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
        }))

        res.json({
            error: false,
            message: 'Reports fetched successfully',
            listReport: userReports
        })
    } catch (error) {
        next(error)
    }
}

const getUserReports = async (req, res, next) => {
    try {
        const userId = req.params.userId;

        const page = req.query.page ? parseInt(req.query.page) : 1;
        const size = req.query.size ? parseInt(req.query.size) : 10;

        const offset = (page - 1) * size;

        const reports = await Reports.findAll({
            where: { userId },
            include: [
                {
                    model: User,
                    attributes: ['id', 'email', 'name']
                }
            ],
            offset,
            limit: size
        })

        const userReports = reports.map((report) => ({
            id: report.id,
            email: report.User.email,
            name: report.User.name,
            description: report.description,
            photoUrl: report.photoUrl,
            lat: report.lat,
            lon: report.lon,
            isAcc: report.isAcc,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
        }))

        res.json({
            error: false,
            message: 'Reports fetched successfully',
            listReport: userReports
        })

    } catch (error) {
        next(error)
    }
}

const getReportDetail = async (req, res, next) => {
    try {
        const reportId = req.params.reportId;

        const report = await Reports.findByPk(reportId, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'email', 'name'],
                }
            ]
        })

        if (!report) next(createError(404, 'Report not found!'))

        const reportDetails = {
            id: report.id,
            email: report.User.email,
            name: report.User.name,
            description: report.description,
            damageType: report.damageType,
            photoUrl: report.photoUrl,
            lat: report.lat,
            lon: report.lon,
            isAcc: report.isAcc,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
        }

        res.json({
            error: false,
            message: 'Report fetched successfully',
            report: reportDetails,
        });
    } catch (error) {
        next(error)
    }
}

const deleteReport = async (req, res, next) => {
    try {
        const reportId = req.params.reportId;
        const report = await Reports.findByPk(reportId)

        if (!report) next(createError(404, 'Report not found'))
        await report.destroy();

        res.json({
            error: false,
            message: 'Report deleted successfully'
        })
    } catch (error) {
        next(error)
    }
}

const getUserReportCount = async (req, res, next) => {
    try {
        const userId = req.params.userId;

        const reportCount = await Reports.count({
            where: { userId }
        })

        res.json({
            error: false,
            message: 'Report count fetched successfully',
            reportCount,
        });

    } catch (error) {
        next(error)
    }
}

const updateReportAccStatus = async (req, res, next) => {
    try {
        const reportId = req.params.reportId;
        const report = await Reports.findByPk(reportId);

        if (!report) next(createError(404, 'Report not found'))

        report.isAcc = true
        await report.save();

        res.json({
            error: false,
            message: 'Report status updated successfully',
        });
    } catch (error) {
        next(error)
    }
}

module.exports = { getUserReports, createReport, getReports, getReportDetail, deleteReport, getUserReportCount, updateReportAccStatus }