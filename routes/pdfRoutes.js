const express = require('express');
const { generatePDF } = require('../controllers/pdfController');
const router = express.Router();

router.get('/download',  generatePDF);

module.exports = router;
