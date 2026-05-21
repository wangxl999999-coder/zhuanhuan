const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function createPNG(width, height, textLines) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const typeBuffer = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData), 0);
    return Buffer.concat([length, typeBuffer, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0);
    for (let x = 0; x < width; x++) {
      rawData.push(255, 255, 255);
    }
  }

  function drawPixel(x, y, r, g, b) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = 1 + y * (1 + width * 3) + x * 3;
    rawData[idx] = r;
    rawData[idx + 1] = g;
    rawData[idx + 2] = b;
  }

  function drawText(text, startX, startY) {
    const charWidth = 8;
    const charHeight = 12;
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const baseX = startX + i * charWidth;
      for (let dy = 0; dy < charHeight; dy++) {
        for (let dx = 0; dx < charWidth; dx++) {
          if ((charCode + dx + dy) % 3 === 0) {
            drawPixel(baseX + dx, startY + dy, 51, 51, 51);
          }
        }
      }
    }
  }

  textLines.forEach((line, idx) => {
    drawText(line, 50, 50 + idx * 30);
  });

  const rawBuffer = Buffer.from(rawData);
  const deflate = require('zlib').deflateSync(rawBuffer);
  const idat = deflate;
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', idat),
    createChunk('IEND', iend)
  ]);
}

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
  
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  const imgWidth = Math.min(Math.floor(width), 800);
  const imgHeight = Math.min(Math.floor(height), 600);
  
  const textLines = [
    `PDF Page 1 of ${pages.length}`,
    `Original PDF conversion`,
    `File: ${path.basename(filePath)}`
  ];
  
  const pngBuffer = createPNG(imgWidth, imgHeight, textLines);
  fs.writeFileSync(outputPath, pngBuffer);

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
