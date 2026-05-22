const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    files: [],
    targetFormats: [],
    formatList: [],
    selectedFormat: '',
    presetFrom: '',
    presetTo: '',
    converting: false,
    convertProgress: 0,
    convertedFiles: [],
    currentFileIndex: 0,
    needAd: false,
    freeCount: 0
  },

  onLoad(options) {
    if (options.files) {
      const files = JSON.parse(options.files)
      let targetFormats = []
      
      if (files.length === 1) {
        const ext = files[0].ext
        targetFormats = util.getTargetFormats(ext)
      } else {
        targetFormats = ['pdf', 'docx']
      }

      const formatList = targetFormats.map(f => ({
        format: f,
        name: util.getFormatName(f)
      }))

      this.setData({ 
        files, 
        targetFormats,
        formatList
      })
    }
    
    if (options.from) {
      this.setData({ presetFrom: options.from })
    }
    if (options.to) {
      this.setData({ 
        presetTo: options.to,
        selectedFormat: options.to
      })
    }

    this.setData({
      freeCount: app.globalData.freeConversions,
      needAd: !app.hasFreeConversion()
    })

    this.rewardedVideoAd = app.createRewardedAd()
  },

  onShow() {
    this.setData({
      freeCount: app.globalData.freeConversions,
      needAd: !app.hasFreeConversion()
    })
  },

  onSelectFormat(e) {
    const format = e.currentTarget.dataset.format
    this.setData({ selectedFormat: format })
  },

  onWatchAd() {
    app.showRewardedAd(this.rewardedVideoAd).then(() => {
      this.setData({ 
        needAd: false,
        freeCount: app.globalData.freeConversions
      })
    }).catch(() => {
      wx.showToast({
        title: '广告加载失败',
        icon: 'none'
      })
    })
  },

  async onStartConvert() {
    if (!this.data.selectedFormat) {
      wx.showToast({ title: '请选择目标格式', icon: 'none' })
      return
    }

    if (!app.hasFreeConversion()) {
      wx.showModal({
        title: '需要观看广告',
        content: '请先观看广告获得转换次数',
        confirmText: '观看广告',
        success: (res) => {
          if (res.confirm) {
            this.onWatchAd()
          }
        }
      })
      return
    }

    this.setData({ 
      converting: true, 
      convertProgress: 0,
      convertedFiles: [],
      currentFileIndex: 0
    })

    app.useFreeConversion()

    try {
      for (let i = 0; i < this.data.files.length; i++) {
        this.setData({ currentFileIndex: i })
        const file = this.data.files[i]
        const result = await this.convertSingleFile(file)
        this.data.convertedFiles.push(result)
        const progress = Math.round(((i + 1) / this.data.files.length) * 100)
        this.setData({ convertProgress: progress })
      }

      this.saveHistory()

      wx.redirectTo({
        url: `/pages/preview/preview?results=${JSON.stringify(this.data.convertedFiles)}`
      })
    } catch (err) {
      console.error('转换失败', err)
      wx.showToast({
        title: '转换失败，请重试',
        icon: 'none'
      })
      this.setData({ converting: false })
    }
  },

  async convertSingleFile(file) {
    return new Promise((resolve, reject) => {
      let filePath = file.path

      if (file.isMock && file.mockContent) {
        const fs = wx.getFileSystemManager()
        const mockPath = `${wx.env.USER_DATA_PATH}/${file.name}`
        
        try {
          fs.writeFileSync(mockPath, file.mockContent, 'utf8')
          filePath = mockPath
          console.log('模拟文件已写入:', mockPath)
        } catch (e) {
          console.error('写入模拟文件失败:', e)
          reject(new Error('模拟文件处理失败，请使用真实文件测试'))
          return
        }
      }

      const uploadTask = wx.uploadFile({
        url: app.globalData.apiBaseUrl + '/convert',
        filePath: filePath,
        name: 'file',
        formData: {
          targetFormat: this.data.selectedFormat,
          sourceFormat: file.ext
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.success) {
              resolve({
                ...file,
                convertedFile: data.data,
                toFormat: this.data.selectedFormat
              })
            } else {
              reject(new Error(data.message))
            }
          } catch (e) {
            reject(e)
          }
        },
        fail: (err) => {
          if (file.isMock) {
            reject(new Error('模拟文件上传失败。模拟文件仅用于测试流程，如需完整功能请配置隐私协议后使用真实文件'))
          } else {
            reject(err)
          }
        }
      })

      uploadTask.onProgressUpdate((res) => {
        const baseProgress = (this.data.currentFileIndex / this.data.files.length) * 100
        const fileProgress = (res.progress / this.data.files.length)
        this.setData({
          convertProgress: Math.round(baseProgress + fileProgress)
        })
      })
    })
  },

  saveHistory() {
    const history = wx.getStorageSync('convertHistory') || []
    const now = new Date()
    const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
    
    const records = this.data.convertedFiles.map(file => ({
      id: util.generateId(),
      name: file.name,
      icon: file.icon,
      fromFormat: file.ext,
      toFormat: file.toFormat,
      time: timeStr,
      convertedFile: file.convertedFile
    }))

    wx.setStorageSync('convertHistory', [...records, ...history].slice(0, 50))
  }
})
