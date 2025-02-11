const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const createDynamicPDF = (data) => {
  const pdfPath = path.resolve(__dirname, '../temp', `${Date.now()}_report.pdf`);
  const pdfDoc = new PDFDocument();

  // Pipe the PDF to a file
  const writeStream = fs.createWriteStream(pdfPath);
  pdfDoc.pipe(writeStream);

  // Add content to the PDF
  pdfDoc
    .fontSize(18)
    .text('Dynamic PDF Report', { align: 'center' })
    .moveDown();

  pdfDoc
    .fontSize(14)
    .text(`Name: ${data.name}`, { align: 'left' })
    .text(`Email: ${data.email}`)
    .text(`Address: ${data.address}`)
    .moveDown();

  pdfDoc
    .text('Details:', { underline: true })
    .moveDown();

  data.details.forEach((detail, index) => {
    pdfDoc.text(`${index + 1}. ${detail}`, { indent: 20 });
  });

  pdfDoc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(pdfPath));
    writeStream.on('error', (err) => reject(err));
  });
};

module.exports = {
  createDynamicPDF,
};
