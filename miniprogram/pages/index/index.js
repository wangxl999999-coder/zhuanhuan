const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    freeConversions: 0,
    recentFiles: [],
    convertTypes: [
      { id: 'doc', name: 'Word转PDF', icon: '📄', from: 'docx', to: 'pdf', color: '#3b82f6' },
      { id: 'xls', name: 'Excel转PDF', icon: '📊', from: 'xlsx', to: 'pdf', color: '#10b981' },
      { id: 'ppt', name: 'PPT转PDF', icon: '📽️', from: 'pptx', to: 'pdf', color: '#f97316' },
      { id: 'img', name: '图片转PDF', icon: '🖼️', from: 'jpg', to: 'pdf', color: '#8b5cf6' },
      { id: 'pdf', name: 'PDF转图片', icon: '📕', from: 'pdf', to: 'jpg', color: '#ef4444' },
      { id: 'md', name: 'Markdown转HTML', icon: '📝', from: 'md', to: 'html', color: '#06b6d4' }
    ]
  },

  onLoad() {
    this.loadFreeConversions()
    this.loadRecentFiles()
    this.rewardedVideoAd = app.createRewardedAd()
  },

  onShow() {
    this.loadFreeConversions()
  },

  loadFreeConversions() {
    this.setData({
      freeConversions: app.globalData.freeConversions
    })
  },

  loadRecentFiles() {
    const history = wx.getStorageSync('convertHistory') || []
    this.setData({
      recentFiles: history.slice(0, 5)
    })
  },

  onTapConvertType(e) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({
      url: `/pages/upload/upload?from=${type.from}&to=${type.to}`
    })
  },

  onTapUpload() {
    wx.navigateTo({
      url: '/pages/upload/upload'
    })
  },

  onTapWatchAd() {
    wx.showModal({
      title: '观看广告',
      content: '观看一次广告可获得1次免费转换机会，是否继续？',
      success: (res) => {
        if (res.confirm) {
          app.showRewardedAd(this.rewardedVideoAd).then(() => {
            this.loadFreeConversions()
          }).catch(() => {
            wx.showToast({
              title: '广告加载失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  onTapHistory() {
    wx.switchTab({
      url: '/pages/history/history'
    })
  },

  onPullDownRefresh() {
    this.loadRecentFiles()
    wx.stopPullDownRefresh()
  }
})
