const tf = require('@tensorflow/tfjs-node');
const fs = require('fs')
const path = require('path')
const fileType = require('file-type');
const { Reports, User } = require('../models/index')
const { nanoid } = require("nanoid")

// const modelPath = require('../model/model.json')
const modelPath = path.join(__dirname, '..', 'tfModel', 'model.json');

const { createError } = require('../utils/error');
const sharp = require('sharp');

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

        const imageBuffer = fs.readFileSync(req.file.path);

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

        const report = await Reports.create({
            id,
            userId: req.user.id,
            description,
            damageType: filteredLabels[0],
            photoUrl: req.file.path,
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

        const offset = (page - 1) * size;

        const reports = await Reports.findAll({
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

        if(!report) next(createError(404, 'Report not found'))
        
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

module.exports = { getUserReports, createReport, getReports, getReportDetail, deleteReport, getUserReportCount, updateReportAccStatus}