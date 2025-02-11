const express = require('express');
const headController = require('../controllers/headController');
const authMiddleware = require('../middleware/authMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');

const router = express.Router();

router.post('/', authMiddleware, subscriptionMiddleware, headController.createHead);
router.get('/', authMiddleware, subscriptionMiddleware, headController.getHeads);
router.get('/:id', authMiddleware, subscriptionMiddleware, headController.getHeadById);
router.put('/:id', authMiddleware, subscriptionMiddleware, headController.updateHead);
router.delete('/:id', authMiddleware, subscriptionMiddleware, headController.deleteHead);

module.exports = router;