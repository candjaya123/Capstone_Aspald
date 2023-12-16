const router = require('express').Router()
const upload = require('../middleware/upload');
const { verifyUser, verifyToken, verifyAdmin } = require('../utils/verifyToken');
const { createReport, getReports, getUserReports, getReportDetail, deleteReport, getUserReportCount, updateReportAccStatus } = require('./report.controller');

router.post('/', verifyToken, verifyUser, upload.single('image'), createReport)
router.get('/', verifyToken, verifyAdmin, getReports)
router.get('/:reportId', verifyToken, verifyUser, getReportDetail)
router.get('/user/:userId', verifyToken, verifyUser, getUserReports)
router.get('/:userId/count',verifyToken, verifyUser, getUserReportCount)
router.delete('/:reportId', verifyToken, verifyUser, deleteReport)
router.post('/acc/:reportId', verifyToken, verifyAdmin, updateReportAccStatus)

module.exports = router;