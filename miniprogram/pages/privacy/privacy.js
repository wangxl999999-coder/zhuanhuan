Page({
  data: {},

  onAgree() {
    wx.setStorageSync('privacyAgreed', true)
    if (wx.openPrivacyContract) {
      wx.openPrivacyContract({
        success: () => {
          wx.navigateBack()
        },
        fail: () => {
          wx.navigateBack()
        }
      })
    } else {
      wx.navigateBack()
    }
  },

  onDisagree() {
    wx.showModal({
      title: '提示',
      content: '您需要同意隐私协议才能使用本应用',
      showCancel: false,
      success: () => {
        wx.navigateBack()
      }
    })
  }
})
