const express = require('express');
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');

const router = express.Router();
router.get('/financial-listing', authMiddleware, subscriptionMiddleware, profileController.getFinancialyearListing);
router.get('/', authMiddleware, subscriptionMiddleware, profileController.getProfile);
router.put('/:id', authMiddleware, subscriptionMiddleware, profileController.updateProfile);
router.put('/financial-year/:id', authMiddleware, subscriptionMiddleware, profileController.updateFinancialYear);

module.exports = router;
