const app = getApp()

const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.apiBaseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

const uploadFile = (filePath, progressCallback) => {
  return new Promise((resolve, reject) => {
    const uploadTask = wx.uploadFile({
      url: app.globalData.apiBaseUrl + '/upload',
      filePath: filePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          resolve(data)
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })

    if (progressCallback) {
      uploadTask.onProgressUpdate((res) => {
        progressCallback(res.progress)
      })
    }
  })
}

const convertFile = (fileId, targetFormat) => {
  return request({
    url: '/convert',
    method: 'POST',
    data: {
      fileId,
      targetFormat
    }
  })
}

const getConvertStatus = (taskId) => {
  return request({
    url: `/convert/status/${taskId}`
  })
}

const downloadFile = (fileId) => {
  return request({
    url: `/download/${fileId}`
  })
}

const getConvertHistory = (page = 1, pageSize = 20) => {
  return request({
    url: '/history',
    data: { page, pageSize }
  })
}

const getStatistics = () => {
  return request({
    url: '/admin/statistics'
  })
}

module.exports = {
  request,
  uploadFile,
  convertFile,
  getConvertStatus,
  downloadFile,
  getConvertHistory,
  getStatistics
}
