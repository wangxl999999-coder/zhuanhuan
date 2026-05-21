const showdown = require('showdown');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const converter = new showdown.Converter({
  tables: true,
  strikethrough: true,
  tasklists: true,
  emoji: true
});

async function mdToHtml(filePath, targetFormat, sourceFormat) {
  const outputPath = path.join(path.dirname(filePath), `${uuidv4()}.html`);
  
  const mdContent = fs.readFileSync(filePath, 'utf-8');
  const htmlContent = converter.makeHtml(mdContent);
  
  const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Converted Document</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1, h2, h3 { color: #333; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f4f4f4; }
    img { max-width: 100%; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
  
  fs.writeFileSync(outputPath, fullHtml, 'utf-8');

  return { outputPath, format: 'html' };
}

async function mdToWord(filePath, targetFormat, sourceFormat) {
  const outputPath = path.join(path.dirname(filePath), `${uuidv4()}.docx`);
  
  const mdContent = fs.readFileSync(filePath, 'utf-8');
  const htmlContent = converter.makeHtml(mdContent);
  
  const wordContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Document</title>
<style>
  @page { size: 21cm 29.7cm; margin: 2cm; }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; }
  h1 { font-size: 24pt; margin-bottom: 12pt; }
  h2 { font-size: 18pt; margin-bottom: 10pt; }
  h3 { font-size: 14pt; margin-bottom: 8pt; }
  p { margin-bottom: 6pt; }
  ul, ol { margin-left: 24pt; }
  code { font-family: 'Courier New', monospace; background: #f0f0f0; }
  pre { font-family: 'Courier New', monospace; background: #f0f0f0; padding: 6pt; }
  table { border-collapse: collapse; }
  td, th { border: 1pt solid #999; padding: 4pt; }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;
  
  fs.writeFileSync(outputPath, wordContent, 'utf-8');

  return { outputPath, format: 'docx' };
}

async function mdToPdf(filePath, targetFormat, sourceFormat) {
  const outputPath = path.join(path.dirname(filePath), `${uuidv4()}.pdf`);
  
  const mdContent = fs.readFileSync(filePath, 'utf-8');
  const lines = mdContent.split('\n');
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  let yOffset = height - 50;
  const lineHeight = 15;
  
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    if (yOffset < 50) {
      const newPage = pdfDoc.addPage();
      yOffset = newPage.getHeight() - 50;
      page.drawText(lines[i], {
        x: 50,
        y: yOffset,
        size: 12,
        maxWidth: width - 100
      });
    } else {
      page.drawText(lines[i], {
        x: 50,
        y: yOffset,
        size: 12,
        maxWidth: width - 100
      });
    }
    yOffset -= lineHeight;
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  return { outputPath, format: 'pdf' };
}

module.exports = {
  mdToHtml,
  mdToWord,
  mdToPdf
};
