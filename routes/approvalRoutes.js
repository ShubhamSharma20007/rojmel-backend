const express = require('express');
const approvalController = require('../controllers/approvalController');
const authMiddleware = require('../middleware/authMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');

const router = express.Router();

router.get('/', authMiddleware, subscriptionMiddleware, approvalController.getApprovalRequests);
router.post('/:id/approve', authMiddleware, subscriptionMiddleware, approvalController.approveRequest);
router.post('/:id/reject', authMiddleware, subscriptionMiddleware, approvalController.rejectRequest);

module.exports = router;