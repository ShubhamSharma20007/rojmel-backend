const express = require('express');
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const headRoutes = require('./headRoutes');
const ledgerRoutes = require('./ledgerRoutes');
const profileRoutes = require('./profileRoutes');
const pdfRoutes = require('./pdfRoutes');
const approvalRoutes = require('./approvalRoutes');
const reportRoutes = require('./reportRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/heads', headRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/profile', profileRoutes);
router.use('/pdf', pdfRoutes);
router.use('/approvals', approvalRoutes);
router.use('/reports', reportRoutes);
router.use('/subscriptions', subscriptionRoutes);

module.exports = router;
