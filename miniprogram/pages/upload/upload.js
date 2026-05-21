const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const app = getApp()

const ALLOWED_EXTENSIONS = [
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'pdf', 'md', 'txt', 'csv', 'html', 'htm',
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'
]

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']

Page({
  data: {
    files: [],
    uploading: false,
    uploadProgress: 0,
    presetFrom: '',
    presetTo: '',
    maxFileSize: 10 * 1024 * 1024
  },

  onLoad(options) {
    if (options.from) {
      this.setData({ presetFrom: options.from })
    }
    if (options.to) {
      this.setData({ presetTo: options.to })
    }
  },

  onChooseFromChat() {
    this.chooseFile('chat')
  },

  onChooseFromLocal() {
    this.chooseFile('local')
  },

  onChooseImages() {
    this.chooseFile('camera')
  },

  chooseFile(source) {
    const presetFrom = this.data.presetFrom
    let fileType = 'file'
    let mediaType = ['image']

    if (presetFrom) {
      if (IMAGE_EXTENSIONS.includes(presetFrom)) {
        fileType = 'image'
      } else if (ALLOWED_EXTENSIONS.includes(presetFrom)) {
        fileType = 'file'
      }
    }

    if (source === 'camera') {
      this.chooseFromCamera(presetFrom)
    } else {
      this.chooseFromFilePicker(fileType, presetFrom)
    }
  },

  chooseFromFilePicker(fileType, presetFrom) {
    const openPicker = () => {
      wx.chooseMessageFile({
        count: 9,
        type: fileType,
        success: (res) => {
          this.addFiles(res.tempFiles, presetFrom)
        },
        fail: (err) => {
          console.error('选择文件失败', err)
          if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
            if (err.errno === 112 || (err.errMsg && err.errMsg.indexOf('privacy') !== -1)) {
              wx.showModal({
                title: '需要隐私授权',
                content: '请先同意隐私协议后再选择文件',
                showCancel: false,
                success: () => {
                  if (wx.getPrivacySetting) {
                    wx.getPrivacySetting({
                      success: (res) => {
                        if (res.needAuthorization && wx.openPrivacyContract) {
                          wx.openPrivacyContract({})
                        }
                      }
                    })
                  }
                }
              })
            } else {
              wx.showToast({ title: '选择文件失败', icon: 'none' })
            }
          }
        }
      })
    }

    if (wx.requirePrivacyAuthorize) {
      wx.requirePrivacyAuthorize({
        success: () => {
          openPicker()
        },
        fail: () => {
          wx.showToast({ title: '请先同意隐私协议', icon: 'none' })
        }
      })
    } else {
      openPicker()
    }
  },

  chooseFromCamera(presetFrom) {
    if (presetFrom && !IMAGE_EXTENSIONS.includes(presetFrom)) {
      wx.showToast({
        title: `当前转换需要${util.getFormatName(presetFrom)}格式`,
        icon: 'none'
      })
      return
    }

    const openChooseMedia = () => {
      wx.chooseMedia({
        count: 9,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const files = res.tempFiles.map(file => ({
            name: file.tempFilePath.split('/').pop(),
            path: file.tempFilePath,
            size: file.size,
            type: 'image'
          }))
          this.addFiles(files, presetFrom)
        },
        fail: (err) => {
          console.error('选择图片失败', err)
          if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
            if (err.errno === 112 || (err.errMsg && err.errMsg.indexOf('privacy') !== -1)) {
              wx.showModal({
                title: '需要隐私授权',
                content: '请先同意隐私协议后再选择图片，或从"手机本地"选择文件',
                showCancel: false,
                success: () => {
                  if (wx.getPrivacySetting) {
                    wx.getPrivacySetting({
                      success: (res) => {
                        if (res.needAuthorization && wx.openPrivacyContract) {
                          wx.openPrivacyContract({})
                        }
                      }
                    })
                  }
                }
              })
            } else {
              wx.showToast({ title: '选择图片失败，请从"手机本地"选择', icon: 'none' })
            }
          }
        }
      })
    }

    if (wx.requirePrivacyAuthorize) {
      wx.requirePrivacyAuthorize({
        success: () => {
          openChooseMedia()
        },
        fail: () => {
          wx.showToast({ title: '请先同意隐私协议', icon: 'none' })
        }
      })
    } else {
      openChooseMedia()
    }
  },

  addFiles(newFiles, presetFrom) {
    const currentFiles = this.data.files
    const validFiles = []
    let oversizeCount = 0
    let invalidFormatCount = 0
    const sourceFormat = presetFrom || this.data.presetFrom

    for (const file of newFiles) {
      if (file.size > this.data.maxFileSize) {
        oversizeCount++
        continue
      }

      const ext = util.getFileExt(file.name || file.path)

      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        invalidFormatCount++
        continue
      }

      if (sourceFormat) {
        const validFormats = this.getValidFormats(sourceFormat)
        if (!validFormats.includes(ext)) {
          invalidFormatCount++
          continue
        }
      }

      const fileItem = {
        id: util.generateId(),
        name: file.name || file.path.split('/').pop(),
        path: file.path,
        size: file.size,
        sizeText: util.formatFileSize(file.size),
        ext: ext,
        icon: util.getFileIcon(ext),
        formatName: util.getFormatName(ext),
        uploaded: false,
        uploadProgress: 0
      }
      validFiles.push(fileItem)
    }

    if (oversizeCount > 0) {
      wx.showToast({
        title: `${oversizeCount}个文件超过10MB`,
        icon: 'none'
      })
    }

    if (invalidFormatCount > 0) {
      wx.showToast({
        title: `${invalidFormatCount}个文件格式不支持`,
        icon: 'none'
      })
    }

    if (validFiles.length > 0) {
      this.setData({
        files: [...currentFiles, ...validFiles]
      })
    }
  },

  getValidFormats(presetFrom) {
    const formatGroups = {
      doc: ['doc', 'docx'],
      docx: ['doc', 'docx'],
      xls: ['xls', 'xlsx'],
      xlsx: ['xls', 'xlsx'],
      ppt: ['ppt', 'pptx'],
      pptx: ['ppt', 'pptx'],
      jpg: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
      jpeg: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
      png: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
      gif: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
      bmp: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
      webp: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
      pdf: ['pdf'],
      md: ['md'],
      txt: ['txt'],
      csv: ['csv'],
      html: ['html', 'htm'],
      htm: ['html', 'htm']
    }
    return formatGroups[presetFrom] || [presetFrom]
  },

  onRemoveFile(e) {
    const id = e.currentTarget.dataset.id
    const files = this.data.files.filter(f => f.id !== id)
    this.setData({ files })
  },

  async onStartConvert() {
    if (this.data.files.length === 0) {
      wx.showToast({ title: '请先选择文件', icon: 'none' })
      return
    }

    if (this.data.presetFrom && this.data.presetTo) {
      this.goToConvert(this.data.presetFrom, this.data.presetTo)
      return
    }

    wx.navigateTo({
      url: `/pages/convert/convert?files=${JSON.stringify(this.data.files)}`
    })
  },

  goToConvert(from, to) {
    wx.navigateTo({
      url: `/pages/convert/convert?files=${JSON.stringify(this.data.files)}&from=${from}&to=${to}`
    })
  },

  onClearAll() {
    wx.showModal({
      title: '提示',
      content: '确定要清空所有文件吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ files: [] })
        }
      }
    })
  }
})
