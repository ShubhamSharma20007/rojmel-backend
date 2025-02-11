const { createDynamicPDF } = require('../services/pdfService');
const fs = require('fs');

const generatePDF = async (req, res) => {
  try {
    // Example data (can be replaced with dynamic data from req.body or database)
    const data = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      address: '123 Main St, Anytown, USA',
      details: ['Item 1 description', 'Item 2 description', 'Item 3 description'],
    };

    const pdfPath = await createDynamicPDF(data);
    // Send the PDF as a downloadable file
    res.download(pdfPath, (err) => {
      if (err) {
        console.error('Error while downloading file:', err);
        res.status(500).send('Error downloading the file.');
      }

      // Delete the file after download
      fs.unlink(pdfPath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('An error occurred while generating the PDF.');
  }
};

module.exports = {
  generatePDF,
};
