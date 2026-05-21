const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    results: [],
    currentIndex: 0
  },

  onLoad(options) {
    if (options.results) {
      try {
        const results = JSON.parse(options.results)
        this.setData({ results })
      } catch (e) {
        console.error('解析结果失败', e)
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    }
  },

  onPreview(e) {
    const index = e.currentTarget.dataset.index
    const result = this.data.results[index]
    
    if (result.convertedFile && result.convertedFile.url) {
      if (result.toFormat === 'jpg' || result.toFormat === 'png') {
        wx.previewImage({
          urls: [result.convertedFile.url],
          current: result.convertedFile.url
        })
      } else {
        wx.downloadFile({
          url: result.convertedFile.url,
          success: (res) => {
            wx.openDocument({
              filePath: res.tempFilePath,
              showMenu: true,
              success: () => {
                console.log('文档打开成功')
              },
              fail: () => {
                wx.showToast({ title: '无法预览此文件', icon: 'none' })
              }
            })
          },
          fail: () => {
            wx.showToast({ title: '下载失败', icon: 'none' })
          }
        })
      }
    }
  },

  onSave(e) {
    const index = e.currentTarget.dataset.index
    const result = this.data.results[index]
    
    if (result.convertedFile && result.convertedFile.url) {
      wx.showLoading({ title: '保存中...' })
      wx.downloadFile({
        url: result.convertedFile.url,
        success: (res) => {
          wx.saveFile({
            tempFilePath: res.tempFilePath,
            success: (saveRes) => {
              wx.hideLoading()
              wx.showToast({
                title: '保存成功',
                icon: 'success'
              })
              const savedFiles = wx.getStorageSync('savedFiles') || []
              savedFiles.unshift({
                name: result.convertedFile.filename,
                path: saveRes.savedFilePath,
                size: result.convertedFile.size,
                time: new Date().toLocaleString()
              })
              wx.setStorageSync('savedFiles', savedFiles.slice(0, 20))
            },
            fail: () => {
              wx.hideLoading()
              wx.showToast({ title: '保存失败', icon: 'none' })
            }
          })
        },
        fail: () => {
          wx.hideLoading()
          wx.showToast({ title: '下载失败', icon: 'none' })
        }
      })
    }
  },

  onShare(e) {
    const index = e.currentTarget.dataset.index
    const result = this.data.results[index]
    
    if (result.convertedFile && result.convertedFile.url) {
      wx.showLoading({ title: '准备分享...' })
      wx.downloadFile({
        url: result.convertedFile.url,
        success: (res) => {
          wx.hideLoading()
          wx.shareFileMessage({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({ title: '分享成功', icon: 'success' })
            },
            fail: (err) => {
              if (err.errMsg !== 'shareFileMessage:fail cancel') {
                wx.showToast({ title: '分享失败', icon: 'none' })
              }
            }
          })
        },
        fail: () => {
          wx.hideLoading()
          wx.showToast({ title: '下载失败', icon: 'none' })
        }
      })
    }
  },

  onBackHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  onShareAppMessage() {
    const result = this.data.results[0]
    return {
      title: '文件格式转换 - 支持多种格式互转',
      path: '/pages/index/index'
    }
  }
})
