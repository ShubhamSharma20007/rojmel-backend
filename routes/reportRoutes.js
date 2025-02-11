const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');
const router = express.Router();

router.get('/generate', authMiddleware, subscriptionMiddleware, reportController.generateReport);

module.exports = router;