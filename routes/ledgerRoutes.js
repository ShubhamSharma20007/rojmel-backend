const express = require('express');
const ledgerController = require('../controllers/ledgerController');
const authMiddleware = require('../middleware/authMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');

const router = express.Router();

router.get('/', authMiddleware, subscriptionMiddleware, ledgerController.getLedgers);
router.post('/', authMiddleware, subscriptionMiddleware, ledgerController.addLedger);
router.get('/:id', authMiddleware, subscriptionMiddleware, ledgerController.viewLedger);
router.put('/:id', authMiddleware, subscriptionMiddleware, ledgerController.updateLedger);
router.delete('/:id', authMiddleware, subscriptionMiddleware, ledgerController.deleteLedger);

module.exports = router;