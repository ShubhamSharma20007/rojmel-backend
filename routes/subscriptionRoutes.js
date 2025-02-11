const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();


router.get('/', authMiddleware, subscriptionController.getSubscriptionList);
router.post('/create-order', authMiddleware, subscriptionController.createOrder);
router.post('/webhook', subscriptionController.webhook);

module.exports = router;
