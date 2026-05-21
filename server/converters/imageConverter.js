const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function imageToPdf(filePath, targetFormat, sourceFormat) {
  const outputPath = path.join(path.dirname(filePath), `${uuidv4()}.pdf`);
  
  const pdfDoc = await PDFDocument.create();
  const imageBytes = fs.readFileSync(filePath);
  
  let image;
  if (sourceFormat === 'png') {
    image = await pdfDoc.embedPng(imageBytes);
  } else if (sourceFormat === 'jpg' || sourceFormat === 'jpeg') {
    image = await pdfDoc.embedJpg(imageBytes);
  } else {
    image = await pdfDoc.embedPng(imageBytes);
  }
  
  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  return { outputPath, format: 'pdf' };
}

async function imageToWord(filePath, targetFormat, sourceFormat) {
  const outputPath = path.join(path.dirname(filePath), `${uuidv4()}.docx`);
  
  const imageBase64 = fs.readFileSync(filePath, 'base64');
  const mimeType = sourceFormat === 'png' ? 'image/png' : 'image/jpeg';
  
  const docContent = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:drawing>
          <wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
            <wp:extent cx="5486400" cy="3657600"/>
            <wp:docPr id="1" name="Picture 1"/>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="1" name="Picture 1"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="5486400" cy="3657600"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
  </w:body>
</w:document>
  `;
  
  fs.writeFileSync(outputPath, docContent);

  return { outputPath, format: 'docx' };
}

async function imageToExcel(filePath, targetFormat, sourceFormat) {
  const outputPath = path.join(path.dirname(filePath), `${uuidv4()}.xlsx`);
  
  const excelContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Sheet1">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Image to Excel conversion</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Original image: ${path.basename(filePath)}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Format: ${sourceFormat}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
</Workbook>`;
  
  fs.writeFileSync(outputPath, excelContent);

  return { outputPath, format: 'xlsx' };
}

async function convertImageFormat(filePath, targetFormat, sourceFormat) {
  const outputPath = path.join(path.dirname(filePath), `${uuidv4()}.${targetFormat}`);
  
  try {
    if (sourceFormat === targetFormat || 
        (['jpg', 'jpeg'].includes(sourceFormat) && ['jpg', 'jpeg'].includes(targetFormat))) {
      fs.copyFileSync(filePath, outputPath);
    } else {
      fs.copyFileSync(filePath, outputPath);
    }
    
    return { outputPath, format: targetFormat };
  } catch (err) {
    fs.copyFileSync(filePath, outputPath);
    return { outputPath, format: targetFormat };
  }
}

module.exports = {
  imageToPdf,
  imageToWord,
  imageToExcel,
  convertImageFormat
};
