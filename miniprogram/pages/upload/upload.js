const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const app = getApp()

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
    wx.chooseMessageFile({
      count: 9,
      type: 'file',
      success: (res) => {
        this.addFiles(res.tempFiles)
      },
      fail: (err) => {
        if (err.errMsg !== 'chooseMessageFile:fail cancel') {
          wx.showToast({ title: '选择文件失败', icon: 'none' })
        }
      }
    })
  },

  onChooseFromLocal() {
    wx.chooseMessageFile({
      count: 9,
      type: 'file',
      success: (res) => {
        this.addFiles(res.tempFiles)
      },
      fail: (err) => {
        if (err.errMsg !== 'chooseMessageFile:fail cancel') {
          wx.showToast({ title: '选择文件失败', icon: 'none' })
        }
      }
    })
  },

  onChooseImages() {
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
        this.addFiles(files)
      }
    })
  },

  addFiles(newFiles) {
    const currentFiles = this.data.files
    const validFiles = []
    let oversizeCount = 0

    for (const file of newFiles) {
      if (file.size > this.data.maxFileSize) {
        oversizeCount++
        continue
      }
      const ext = util.getFileExt(file.name || file.path)
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

    this.setData({
      files: [...currentFiles, ...validFiles]
    })
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
