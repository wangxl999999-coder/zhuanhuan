const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileExt = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  return ext
}

const getFileIcon = (ext) => {
  const icons = {
    doc: '📄',
    docx: '📄',
    pdf: '📕',
    xls: '📊',
    xlsx: '📊',
    ppt: '📽️',
    pptx: '📽️',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    bmp: '🖼️',
    webp: '🖼️',
    md: '📝',
    html: '🌐',
    htm: '🌐',
    txt: '📃',
    csv: '📊'
  }
  return icons[ext] || '📁'
}

const getFormatName = (format) => {
  const names = {
    doc: 'Word文档',
    docx: 'Word文档',
    pdf: 'PDF文档',
    xls: 'Excel表格',
    xlsx: 'Excel表格',
    ppt: 'PPT演示',
    pptx: 'PPT演示',
    jpg: 'JPG图片',
    jpeg: 'JPEG图片',
    png: 'PNG图片',
    gif: 'GIF图片',
    bmp: 'BMP图片',
    webp: 'WebP图片',
    md: 'Markdown',
    html: 'HTML网页',
    htm: 'HTML网页',
    txt: '文本文件',
    csv: 'CSV表格'
  }
  return names[format] || format.toUpperCase()
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

const getTargetFormats = (sourceFormat) => {
  const formatMap = {
    doc: ['pdf', 'txt'],
    docx: ['pdf', 'txt'],
    pdf: ['doc', 'txt', 'jpg', 'png', 'split', 'merge'],
    xls: ['pdf'],
    xlsx: ['pdf'],
    ppt: ['pdf'],
    pptx: ['pdf'],
    jpg: ['pdf', 'docx', 'xlsx', 'png', 'bmp', 'webp'],
    jpeg: ['pdf', 'docx', 'xlsx', 'png', 'bmp', 'webp'],
    png: ['pdf', 'docx', 'xlsx', 'jpg', 'bmp', 'webp'],
    gif: ['pdf', 'docx', 'xlsx', 'jpg', 'png', 'bmp'],
    bmp: ['pdf', 'docx', 'xlsx', 'jpg', 'png', 'webp'],
    webp: ['pdf', 'docx', 'xlsx', 'jpg', 'png', 'bmp'],
    md: ['html', 'docx', 'pdf'],
    txt: ['pdf', 'docx']
  }
  return formatMap[sourceFormat] || ['pdf']
}

const checkFileSize = (size, maxSize = 10 * 1024 * 1024) => {
  return size <= maxSize
}

module.exports = {
  formatFileSize,
  getFileExt,
  getFileIcon,
  getFormatName,
  generateId,
  getTargetFormats,
  checkFileSize
}
