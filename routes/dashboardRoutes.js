const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');

const router = express.Router();

// Protected Dashboard Route
router.get('/', authMiddleware, subscriptionMiddleware, dashboardController.getDashboard);

module.exports = router;
