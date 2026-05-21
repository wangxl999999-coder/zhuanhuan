const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    history: [],
    loading: false,
    selectedFiles: []
  },

  onLoad() {
    this.loadHistory()
  },

  onShow() {
    this.loadHistory()
  },

  loadHistory() {
    const history = wx.getStorageSync('convertHistory') || []
    this.setData({ history })
  },

  onPullDownRefresh() {
    this.loadHistory()
    wx.stopPullDownRefresh()
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          const history = this.data.history.filter(h => h.id !== id)
          wx.setStorageSync('convertHistory', history)
          this.setData({ history })
          wx.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    })
  },

  onClearAll() {
    wx.showModal({
      title: '提示',
      content: '确定要清空所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('convertHistory')
          this.setData({ history: [] })
          wx.showToast({ title: '清空成功', icon: 'success' })
        }
      }
    })
  },

  onReconvert(e) {
    const item = e.currentTarget.dataset.item
    wx.navigateTo({
      url: `/pages/upload/upload?from=${item.fromFormat}&to=${item.toFormat}`
    })
  },

  onPreview(e) {
    const item = e.currentTarget.dataset.item
    if (item.convertedFile && item.convertedFile.url) {
      wx.showLoading({ title: '加载中...' })
      wx.downloadFile({
        url: item.convertedFile.url,
        success: (res) => {
          wx.hideLoading()
          if (item.toFormat === 'jpg' || item.toFormat === 'png') {
            wx.previewImage({
              urls: [res.tempFilePath]
            })
          } else {
            wx.openDocument({
              filePath: res.tempFilePath,
              showMenu: true
            })
          }
        },
        fail: () => {
          wx.hideLoading()
          wx.showToast({ title: '下载失败', icon: 'none' })
        }
      })
    }
  }
})
