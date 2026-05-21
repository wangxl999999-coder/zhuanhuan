const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    isAdmin: false,
    password: '',
    statistics: null,
    loading: false,
    todayCount: 0,
    totalCount: 0,
    formatStats: [],
    recentRecords: []
  },

  onLoad() {
    this.loadLocalStats()
  },

  loadLocalStats() {
    const history = wx.getStorageSync('convertHistory') || []
    const today = new Date()
    const todayStr = `${today.getMonth() + 1}/${today.getDate()}`
    
    let todayCount = 0
    const formatCount = {}
    
    history.forEach(item => {
      if (item.time && item.time.includes(todayStr)) {
        todayCount++
      }
      const key = `${item.fromFormat}→${item.toFormat}`
      formatCount[key] = (formatCount[key] || 0) + 1
    })

    const formatStats = Object.entries(formatCount)
      .map(([format, count]) => ({ format, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    this.setData({
      todayCount,
      totalCount: history.length,
      formatStats,
      recentRecords: history.slice(0, 20)
    })
  },

  onInputPassword(e) {
    this.setData({ password: e.detail.value })
  },

  onLogin() {
    if (this.data.password === 'admin123') {
      this.setData({ isAdmin: true })
      this.loadServerStats()
      wx.showToast({ title: '登录成功', icon: 'success' })
    } else {
      wx.showToast({ title: '密码错误', icon: 'none' })
    }
  },

  async loadServerStats() {
    this.setData({ loading: true })
    try {
      const stats = await api.getStatistics()
      if (stats.success) {
        this.setData({ statistics: stats.data })
      }
    } catch (e) {
      console.error('获取统计数据失败', e)
    }
    this.setData({ loading: false })
  },

  onExport() {
    const history = wx.getStorageSync('convertHistory') || []
    const content = JSON.stringify(history, null, 2)
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '数据已复制', icon: 'success' })
      }
    })
  },

  onLogout() {
    this.setData({ isAdmin: false, password: '' })
  }
})
