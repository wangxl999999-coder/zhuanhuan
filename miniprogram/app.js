App({
  globalData: {
    userInfo: null,
    apiBaseUrl: 'http://localhost:3000/api',
    freeConversions: 0,
    maxFileSize: 10 * 1024 * 1024,
    adUnitId: 'adunit-a850d1b1b9071b11'
  },

  onLaunch() {
    this.checkFreeConversions()
    this.initPrivacy()
  },

  initPrivacy() {
    if (wx.getPrivacySetting) {
      wx.getPrivacySetting({
        success: (res) => {
          if (res.needAuthorization) {
            this.showPrivacyAuthorization()
          }
        },
        fail: () => {
          console.log('获取隐私设置失败')
        }
      })
    }
  },

  showPrivacyAuthorization() {
    if (wx.requirePrivacyAuthorize) {
      wx.requirePrivacyAuthorize({
        success: () => {
          console.log('隐私协议已同意')
        },
        fail: () => {
          wx.showModal({
            title: '隐私授权提示',
            content: '您需要同意隐私协议才能使用文件选择功能，请在设置中开启',
            showCancel: false
          })
        }
      })
    } else {
      wx.navigateTo({
        url: '/pages/privacy/privacy'
      })
    }
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

  createRewardedAd() {
    if (!wx.createRewardedVideoAd) {
      return null
    }

    const rewardedVideoAd = wx.createRewardedVideoAd({
      adUnitId: this.globalData.adUnitId
    })

    rewardedVideoAd.onLoad(() => {
      console.log('激励视频广告加载成功')
    })

    rewardedVideoAd.onError((err) => {
      console.error('激励视频广告加载失败', err)
    })

    return rewardedVideoAd
  },

  showRewardedAd(rewardedVideoAd) {
    return new Promise((resolve, reject) => {
      if (!rewardedVideoAd) {
        reject(new Error('广告未初始化'))
        return
      }

      const handleClose = (res) => {
        rewardedVideoAd.offClose(handleClose)
        if (res && res.isEnded) {
          this.addFreeConversion()
          wx.showToast({
            title: '获得1次免费转换',
            icon: 'success'
          })
          resolve()
        } else {
          reject(new Error('未完成观看'))
        }
      }

      rewardedVideoAd.onClose(handleClose)

      rewardedVideoAd.show().catch((err) => {
        rewardedVideoAd.load().then(() => {
          rewardedVideoAd.show().catch((loadErr) => {
            rewardedVideoAd.offClose(handleClose)
            reject(loadErr)
          })
        }).catch((loadErr) => {
          rewardedVideoAd.offClose(handleClose)
          reject(loadErr)
        })
      })
    })
  }
})
