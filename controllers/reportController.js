const reportService = require('../services/reportService');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const fs = require('fs');

exports.generateReport = async (req, res) => {
  try {
    const { reportType, headId } = req.query;
    const pdfPath = await reportService.generateReport(req.user, reportType, headId);
    res.setHeader('Content-Type', 'application/pdf');
    const fileName = pdfPath.split('\\').pop();
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Length', fs.statSync(pdfPath).size);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.download(pdfPath, (err) => {
      if (err) {
        console.error('Error while downloading file:', err);
        res.status(500).send('Error downloading the file.');
      } else {
        // Delete the file after download
        fs.unlinkSync(pdfPath);
      }
    });
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};