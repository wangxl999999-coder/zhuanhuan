App({
  globalData: {
    userInfo: null,
    apiBaseUrl: 'http://localhost:3000/api',
    freeConversions: 0,
    maxFileSize: 10 * 1024 * 1024
  },

  onLaunch() {
    this.checkFreeConversions()
    this.initAd()
  },

  checkFreeConversions() {
    const conversions = wx.getStorageSync('freeConversions') || 0
    this.globalData.freeConversions = conversions
  },

  addFreeConversion() {
    const conversions = this.globalData.freeConversions + 1
    this.globalData.freeConversions = conversions
    wx.setStorageSync('freeConversions', conversions)
  },

  useFreeConversion() {
    if (this.globalData.freeConversions > 0) {
      const conversions = this.globalData.freeConversions - 1
      this.globalData.freeConversions = conversions
      wx.setStorageSync('freeConversions', conversions)
      return true
    }
    return false
  },

  hasFreeConversion() {
    return this.globalData.freeConversions > 0
  },

  initAd() {
    if (wx.createRewardedVideoAd) {
      this.rewardedVideoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-a850d1b1b9071b11'
      })
      
      this.rewardedVideoAd.onLoad(() => {
        console.log('激励视频广告加载成功')
      })

      this.rewardedVideoAd.onError((err) => {
        console.error('激励视频广告加载失败', err)
      })

      this.rewardedVideoAd.onClose((res) => {
        if (res && res.isEnded) {
          this.addFreeConversion()
          wx.showToast({
            title: '获得1次免费转换',
            icon: 'success'
          })
        }
      })
    }
  },

  showRewardedAd() {
    return new Promise((resolve, reject) => {
      if (this.rewardedVideoAd) {
        this.rewardedVideoAd.show().catch(() => {
          this.rewardedVideoAd.load().then(() => {
            this.rewardedVideoAd.show()
            resolve()
          }).catch(err => {
            reject(err)
          })
        })
        this.rewardedVideoAd.onClose((res) => {
          if (res && res.isEnded) {
            resolve()
          } else {
            reject(new Error('未完成观看'))
          }
        })
      } else {
        reject(new Error('广告未初始化'))
      }
    })
  }
})
