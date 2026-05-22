const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const app = getApp()

const ALLOWED_EXTENSIONS = [
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'pdf', 'md', 'txt', 'csv', 'html', 'htm',
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'
]

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']

const IS_DEV = true

Page({
  data: {
    files: [],
    uploading: false,
    uploadProgress: 0,
    presetFrom: '',
    presetTo: '',
    maxFileSize: 10 * 1024 * 1024,
    privacyNeedAuth: false
  },

  onLoad(options) {
    if (options.from) {
      this.setData({ presetFrom: options.from })
    }
    if (options.to) {
      this.setData({ presetTo: options.to })
    }
    
    this.checkPrivacyStatus()
  },

  checkPrivacyStatus() {
    if (wx.getPrivacySetting) {
      wx.getPrivacySetting({
        success: (res) => {
          this.setData({
            privacyNeedAuth: res.needAuthorization
          })
        },
        fail: () => {
          this.setData({
            privacyNeedAuth: false
          })
        }
      })
    }
  },

  onChooseFromChat() {
    const presetFrom = this.data.presetFrom
    let fileType = 'file'
    if (presetFrom && IMAGE_EXTENSIONS.includes(presetFrom)) {
      fileType = 'image'
    }

    wx.chooseMessageFile({
      count: 9,
      type: fileType,
      success: (res) => {
        this.addFiles(res.tempFiles)
      },
      fail: (err) => {
        console.error('从聊天选择文件失败', err)
        this.handleChooseError(err, '聊天记录')
      }
    })
  },

  onChooseFromLocal() {
    const presetFrom = this.data.presetFrom
    let fileType = 'file'
    if (presetFrom && IMAGE_EXTENSIONS.includes(presetFrom)) {
      fileType = 'image'
    }

    if (wx.chooseFile) {
      wx.chooseFile({
        count: 9,
        type: fileType,
        success: (res) => {
          const files = res.tempFiles.map(file => ({
            name: file.name,
            path: file.path,
            size: file.size,
            type: file.type
          }))
          this.addFiles(files)
        },
        fail: (err) => {
          console.error('从本地选择文件失败', err)
          this.handleChooseError(err, '手机本地')
        }
      })
    } else {
      wx.chooseMessageFile({
        count: 9,
        type: fileType,
        success: (res) => {
          this.addFiles(res.tempFiles)
        },
        fail: (err) => {
          console.error('从本地选择文件失败', err)
          this.handleChooseError(err, '手机本地')
        }
      })
    }
  },

  onChooseImages() {
    const presetFrom = this.data.presetFrom

    if (presetFrom && !IMAGE_EXTENSIONS.includes(presetFrom)) {
      wx.showToast({
        title: `当前转换需要${util.getFormatName(presetFrom)}格式`,
        icon: 'none'
      })
      return
    }

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
      },
      fail: (err) => {
        console.error('选择图片失败', err)
        this.handleChooseError(err, '拍照/相册')
      }
    })
  },

  handleChooseError(err, source) {
    if (err.errMsg && err.errMsg.indexOf('cancel') !== -1) {
      return
    }

    const isPrivacyError = err.errno === 112 || 
      (err.errMsg && err.errMsg.indexOf('privacy') !== -1) ||
      (err.errMsg && err.errMsg.indexOf('scope') !== -1) ||
      (err.errMsg && err.errMsg.indexOf('declared') !== -1)

    if (isPrivacyError) {
      this.showPrivacyErrorDialog(source)
    } else {
      this.showGeneralErrorDialog(source)
    }
  },

  showPrivacyErrorDialog(source) {
    const showMockOption = IS_DEV

    wx.showModal({
      title: '🔒 需要隐私授权',
      content: '根据微信平台规则，使用文件选择功能需要先同意隐私协议。\n\n点击"去授权"按钮，在弹出的协议中点击"同意"即可。',
      confirmText: '去授权',
      cancelText: showMockOption ? '使用模拟文件' : '知道了',
      success: (res) => {
        if (res.confirm) {
          this.goPrivacyAuth(source)
        } else if (showMockOption) {
          this.showMockFilePicker(source)
        }
      }
    })
  },

  showGeneralErrorDialog(source) {
    wx.showModal({
      title: '选择失败',
      content: `从${source}选择文件失败。\n\n💡 建议：优先使用"手机本地"入口选择文件，兼容性更好。`,
      confirmText: '换个入口试试',
      cancelText: IS_DEV ? '使用模拟文件' : '取消',
      success: (res) => {
        if (res.confirm) {
          this.onChooseFromLocal()
        } else if (IS_DEV) {
          this.showMockFilePicker(source)
        }
      }
    })
  },

  showMockFilePicker(source) {
    const presetFrom = this.data.presetFrom
    let extensions = ALLOWED_EXTENSIONS
    
    if (presetFrom) {
      extensions = this.getValidFormats(presetFrom)
    }

    const mockFiles = extensions.slice(0, 6).map((ext, index) => ({
      ext: ext,
      name: `示例文件_${index + 1}.${ext}`,
      icon: util.getFileIcon(ext),
      formatName: util.getFormatName(ext)
    }))

    const itemList = mockFiles.map(f => `${f.icon} ${f.name}`)

    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        const selected = mockFiles[res.tapIndex]
        this.addMockFile(selected.ext, selected.name)
      }
    })
  },

  addMockFile(ext, name) {
    const mockContent = this.generateMockContent(ext)
    const size = mockContent.length
    
    const fileItem = {
      id: util.generateId(),
      name: name,
      path: `mock://${name}`,
      size: size,
      sizeText: util.formatFileSize(size),
      ext: ext,
      icon: util.getFileIcon(ext),
      formatName: util.getFormatName(ext),
      uploaded: false,
      uploadProgress: 0,
      isMock: true,
      mockContent: mockContent
    }

    const currentFiles = this.data.files
    this.setData({
      files: [...currentFiles, fileItem]
    })

    wx.showToast({
      title: '已添加模拟文件',
      icon: 'success'
    })
  },

  generateMockContent(ext) {
    const mockContents = {
      doc: '这是一个模拟的Word文档内容。\n\n用于开发测试。',
      docx: '这是一个模拟的Word文档内容。\n\n用于开发测试。',
      xls: '姓名,年龄,职业\n张三,25,工程师\n李四,30,设计师',
      xlsx: '姓名,年龄,职业\n张三,25,工程师\n李四,30,设计师',
      ppt: '幻灯片1\n标题：测试\n内容：这是测试内容',
      pptx: '幻灯片1\n标题：测试\n内容：这是测试内容',
      pdf: '%PDF-1.4\n模拟PDF内容',
      md: '# 测试文档\n\n这是一个Markdown测试文件。\n\n## 二级标题\n\n- 列表项1\n- 列表项2',
      txt: '这是一个纯文本文件的内容。\n\n用于测试文件转换功能。',
      csv: 'id,name,value\n1,test1,100\n2,test2,200',
      html: '<!DOCTYPE html>\n<html>\n<head><title>Test</title></head>\n<body><h1>Hello</h1></body>\n</html>',
      htm: '<!DOCTYPE html>\n<html>\n<head><title>Test</title></head>\n<body><h1>Hello</h1></body>\n</html>',
      jpg: 'mock_image_data',
      jpeg: 'mock_image_data',
      png: 'mock_image_data',
      gif: 'mock_image_data',
      bmp: 'mock_image_data',
      webp: 'mock_image_data'
    }
    return mockContents[ext] || 'mock file content'
  },

  goPrivacyAuth(source) {
    const self = this
    
    const retryOperation = () => {
      this.checkPrivacyStatus()
      if (source === '聊天记录') {
        this.onChooseFromChat()
      } else if (source === '拍照/相册') {
        this.onChooseImages()
      } else {
        this.onChooseFromLocal()
      }
    }

    if (wx.requirePrivacyAuthorize) {
      wx.requirePrivacyAuthorize({
        success: () => {
          wx.showToast({
            title: '授权成功',
            icon: 'success',
            duration: 1500
          })
          setTimeout(() => {
            retryOperation()
          }, 1500)
        },
        fail: (err) => {
          console.error('requirePrivacyAuthorize failed:', err)
          this.showPrivacyAuthOptions(source)
        }
      })
    } else {
      this.showPrivacyAuthOptions(source)
    }
  },

  showPrivacyAuthOptions(source) {
    const self = this
    const content = '需要您同意隐私协议后才能使用文件选择功能。\n\n请选择以下方式完成授权：\n\n1. 点击"查看隐私协议"，阅读后点击"同意"\n\n2. 点击右上角"..." → 设置 → 找到"隐私协议"并同意\n\n3. 退出小程序后重新进入，在弹出的隐私协议中点击同意'

    wx.showModal({
      title: '🔒 隐私授权',
      content: content,
      confirmText: '查看隐私协议',
      cancelText: '手动设置',
      success: (res) => {
        if (res.confirm) {
          if (wx.openPrivacyContract) {
            wx.openPrivacyContract({
              success: () => {
                wx.showToast({
                  title: '请点击"同意"按钮',
                  icon: 'none',
                  duration: 3000
                })
                setTimeout(() => {
                  self.checkPrivacyStatus()
                }, 3000)
              },
              fail: () => {
                self.navigateToPrivacyPage(source)
              }
            })
          } else {
            self.navigateToPrivacyPage(source)
          }
        } else {
          self.showManualGuide()
        }
      }
    })
  },

  navigateToPrivacyPage(source) {
    wx.navigateTo({
      url: '/pages/privacy/privacy',
      success: () => {
        wx.setStorageSync('pendingSource', source)
      }
    })
  },

  showManualGuide() {
    wx.showModal({
      title: '手动授权步骤',
      content: '请按以下步骤操作：\n\n1. 点击小程序右上角的"..."按钮\n2. 选择"设置"\n3. 找到"隐私协议"并点击\n4. 点击"同意"按钮\n5. 返回后重新选择文件',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  onOpenPrivacy() {
    this.goPrivacyAuth('手机本地')
  },

  onShow() {
    this.checkPrivacyStatus()
    
    const pendingSource = wx.getStorageSync('pendingSource')
    if (pendingSource) {
      wx.removeStorageSync('pendingSource')
      setTimeout(() => {
        if (pendingSource === '聊天记录') {
          this.onChooseFromChat()
        } else if (pendingSource === '拍照/相册') {
          this.onChooseImages()
        } else {
          this.onChooseFromLocal()
        }
      }, 500)
    }
  },

  onChooseMock() {
    this.showMockFilePicker('dev')
  },

  addFiles(newFiles) {
    const currentFiles = this.data.files
    const validFiles = []
    let oversizeCount = 0
    let invalidFormatCount = 0
    const sourceFormat = this.data.presetFrom

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
