const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');

const docConverter = require('./converters/docConverter');
const pdfConverter = require('./converters/pdfConverter');
const imageConverter = require('./converters/imageConverter');
const mdConverter = require('./converters/mdConverter');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/files', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      '.doc', '.docx', '.pdf', '.xls', '.xlsx', '.ppt', '.pptx',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
      '.md', '.txt', '.html', '.htm', '.csv'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务器运行正常' });
});

app.post('/api/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: '未找到上传文件' });
    }

    const targetFormat = req.body.targetFormat;
    const sourceFormat = req.body.sourceFormat || path.extname(req.file.originalname).slice(1).toLowerCase();
    const originalName = req.file.originalname;
    const filePath = req.file.path;
    const fileId = path.basename(req.file.filename, path.extname(req.file.filename));

    if (!targetFormat) {
      return res.json({ success: false, message: '缺少目标格式参数' });
    }

    let result;
    const converter = getConverter(sourceFormat, targetFormat);
    
    if (!converter) {
      return res.json({ 
        success: false, 
        message: `不支持 ${sourceFormat} 转 ${targetFormat}` 
      });
    }

    result = await converter(filePath, targetFormat, sourceFormat);

    const convertedFileName = `${path.parse(originalName).name}.${targetFormat}`;
    const convertedPath = result.outputPath;
    const convertedSize = fs.existsSync(convertedPath) ? fs.statSync(convertedPath).size : 0;

    db.insertConvertRecord({
      file_id: fileId,
      original_name: originalName,
      source_format: sourceFormat,
      target_format: targetFormat,
      file_size: req.file.size,
      converted_size: convertedSize,
      status: 'success'
    });

    res.json({
      success: true,
      data: {
        fileId,
        filename: convertedFileName,
        url: `/files/${path.basename(convertedPath)}`,
        size: convertedSize,
        sizeText: formatFileSize(convertedSize)
      }
    });

    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (fs.existsSync(convertedPath) && convertedPath !== filePath) {
          setTimeout(() => {
            try { fs.unlinkSync(convertedPath); } catch (e) {}
          }, 3600000);
        }
      } catch (e) {
        console.error('清理文件失败', e);
      }
    }, 10000);

  } catch (err) {
    console.error('转换失败', err);
    db.insertConvertRecord({
      file_id: uuidv4(),
      original_name: req.file ? req.file.originalname : 'unknown',
      source_format: req.body.sourceFormat || 'unknown',
      target_format: req.body.targetFormat || 'unknown',
      file_size: req.file ? req.file.size : 0,
      converted_size: 0,
      status: 'failed',
      error_message: err.message
    });
    res.json({ 
      success: false, 
      message: err.message || '转换失败' 
    });
  }
});

function getConverter(sourceFormat, targetFormat) {
  if (['doc', 'docx'].includes(sourceFormat) && targetFormat === 'pdf') {
    return docConverter.docToPdf;
  }
  if (['xls', 'xlsx'].includes(sourceFormat) && targetFormat === 'pdf') {
    return docConverter.excelToPdf;
  }
  if (['ppt', 'pptx'].includes(sourceFormat) && targetFormat === 'pdf') {
    return docConverter.pptToPdf;
  }
  if (sourceFormat === 'pdf' && ['doc', 'docx'].includes(targetFormat)) {
    return pdfConverter.pdfToWord;
  }
  if (sourceFormat === 'pdf' && ['jpg', 'png'].includes(targetFormat)) {
    return pdfConverter.pdfToImage;
  }
  if (sourceFormat === 'pdf' && targetFormat === 'split') {
    return pdfConverter.splitPdf;
  }
  if (sourceFormat === 'pdf' && targetFormat === 'merge') {
    return pdfConverter.mergePdf;
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(sourceFormat) && targetFormat === 'pdf') {
    return imageConverter.imageToPdf;
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(sourceFormat) && ['doc', 'docx'].includes(targetFormat)) {
    return imageConverter.imageToWord;
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(sourceFormat) && ['xls', 'xlsx'].includes(targetFormat)) {
    return imageConverter.imageToExcel;
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(sourceFormat) && ['jpg', 'jpeg', 'png', 'bmp', 'webp'].includes(targetFormat)) {
    return imageConverter.convertImageFormat;
  }
  if (sourceFormat === 'md' && targetFormat === 'html') {
    return mdConverter.mdToHtml;
  }
  if (sourceFormat === 'md' && ['doc', 'docx'].includes(targetFormat)) {
    return mdConverter.mdToWord;
  }
  if (sourceFormat === 'md' && targetFormat === 'pdf') {
    return mdConverter.mdToPdf;
  }
  
  return null;
}

app.get('/api/download/:fileId', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadDir);
  const matchedFile = files.find(f => f.startsWith(req.params.fileId));
  
  if (matchedFile) {
    res.download(path.join(uploadDir, matchedFile));
  } else {
    res.status(404).json({ success: false, message: '文件不存在' });
  }
});

app.get('/api/history', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  
  db.getConvertHistory(page, pageSize, (err, records) => {
    if (err) {
      res.json({ success: false, message: '获取历史失败' });
    } else {
      res.json({ success: true, data: records });
    }
  });
});

app.get('/api/admin/statistics', (req, res) => {
  db.getStatistics((err, stats) => {
    if (err) {
      res.json({ success: false, message: '获取统计失败' });
    } else {
      res.json({ success: true, data: stats });
    }
  });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === 'admin123') {
    res.json({ success: true, token: 'admin-token-' + Date.now() });
  } else {
    res.json({ success: false, message: '密码错误' });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.json({ success: false, message: '文件大小超过10MB限制' });
    }
  }
  res.json({ success: false, message: err.message || '服务器错误' });
});

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

db.initDB(() => {
  app.listen(PORT, () => {
    console.log(`文件转换服务运行在 http://localhost:${PORT}`);
  });
});
