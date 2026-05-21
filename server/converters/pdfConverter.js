const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function pdfToWord(filePath, targetFormat, sourceFormat) {
  const outputPath = path.join(path.dirname(filePath), `${uuidv4()}.${targetFormat}`);
  
  const pdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  
  let content = '';
  for (const page of pages) {
    content += `[Page ${pages.indexOf(page) + 1}]\n`;
  }

  const docContent = `
<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>PDF to Word conversion result</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Original pages: ${pages.length}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>
  `;
  
  fs.writeFileSync(outputPath, docContent);

  return { outputPath, format: targetFormat };
}

async function pdfToImage(filePath, targetFormat, sourceFormat) {
  const outputPath = path.join(path.dirname(filePath), `${uuidv4()}.${targetFormat}`);
  
  const pdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  
  const { PNG } = require('pngjs');
  const { createCanvas } = require('canvas');
  
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  
  const canvas = createCanvas(Math.floor(width), Math.floor(height));
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  ctx.fillStyle = '#333333';
  ctx.font = '20px Arial';
  ctx.fillText(`PDF Page 1 of ${pages.length}`, 50, 50);
  ctx.fillText(`Original PDF conversion`, 50, 80);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  return { outputPath, format: targetFormat };
}

async function splitPdf(filePath, targetFormat, sourceFormat) {
  const outputDir = path.join(path.dirname(filePath), uuidv4());
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const pdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  
  const outputPaths = [];
  
  for (let i = 0; i < pages.length; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
    newPdf.addPage(copiedPage);
    
    const outputPath = path.join(outputDir, `page_${i + 1}.pdf`);
    const newPdfBytes = await newPdf.save();
    fs.writeFileSync(outputPath, newPdfBytes);
    outputPaths.push(outputPath);
  }

  return { outputPath: outputPaths[0], outputPaths, format: 'pdf', multiFile: true };
}

async function mergePdf(filePaths, targetFormat, sourceFormat) {
  const outputPath = path.join(path.dirname(filePaths[0]), `${uuidv4()}.pdf`);
  
  const mergedPdf = await PDFDocument.create();
  
  for (const filePath of filePaths) {
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }
  
  const mergedBytes = await mergedPdf.save();
  fs.writeFileSync(outputPath, mergedBytes);

  return { outputPath, format: 'pdf' };
}

module.exports = {
  pdfToWord,
  pdfToImage,
  splitPdf,
  mergePdf
};
