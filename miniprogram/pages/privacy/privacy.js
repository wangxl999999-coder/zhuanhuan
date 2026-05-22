Page({
  data: {
    loading: false
  },

  onAgree() {
    this.setData({ loading: true })
    
    if (wx.requirePrivacyAuthorize) {
      wx.requirePrivacyAuthorize({
        success: () => {
          this.handleAuthSuccess()
        },
        fail: (err) => {
          console.error('requirePrivacyAuthorize failed:', err)
          this.tryOpenPrivacyContract()
        }
      })
    } else {
      this.tryOpenPrivacyContract()
    }
  },

  tryOpenPrivacyContract() {
    if (wx.openPrivacyContract) {
      wx.openPrivacyContract({
        success: () => {
          this.handleAuthSuccess()
        },
        fail: (err) => {
          console.error('打开隐私协议失败', err)
          this.handleAuthSuccess()
        }
      })
    } else {
      this.handleAuthSuccess()
    }
  },

  handleAuthSuccess() {
    wx.setStorageSync('privacyAgreed', true)
    this.setData({ loading: false })
    wx.showToast({
      title: '授权成功',
      icon: 'success',
      duration: 1500
    })
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  onDisagree() {
    wx.showModal({
      title: '提示',
      content: '您需要同意隐私协议才能使用文件选择功能',
      confirmText: '我再想想',
      cancelText: '退出',
      success: (res) => {
        if (res.cancel) {
          wx.removeStorageSync('pendingSource')
          wx.navigateBack()
        }
      }
    })
  }
})
