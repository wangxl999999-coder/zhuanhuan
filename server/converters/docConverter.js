const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function docToPdf(filePath, targetFormat, sourceFormat) {
  const outputPath = path.join(path.dirname(filePath), `${uuidv4()}.pdf`);
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  const content = fs.readFileSync(filePath, 'utf-8');
  page.drawText(content.substring(0, 1000), {
    x: 50,
    y: height - 50,
    size: 12,
    maxWidth: width - 100
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  return { outputPath, format: 'pdf' };
}

async function excelToPdf(filePath, targetFormat, sourceFormat) {
  const outputPath = path.join(path.dirname(filePath), `${uuidv4()}.pdf`);
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  page.drawText('Excel to PDF conversion', {
    x: 50,
    y: height - 50,
    size: 14
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  return { outputPath, format: 'pdf' };
}

async function pptToPdf(filePath, targetFormat, sourceFormat) {
  const outputPath = path.join(path.dirname(filePath), `${uuidv4()}.pdf`);
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  page.drawText('PPT to PDF conversion', {
    x: 50,
    y: height - 50,
    size: 14
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  return { outputPath, format: 'pdf' };
}

module.exports = {
  docToPdf,
  excelToPdf,
  pptToPdf
};
