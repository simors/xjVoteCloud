/**
 * Created by wanpeng on 2018/1/5.
 */
var wechat_api = require('../util/wechatUtil').wechat_api

function getMedia(media_id) {
  if(!media_id) {
    return Promise.reject()
  }
  return new Promise(function (resolve, reject) {
    wechat_api.getMedia(media_id, function (err, result) {
      if(err) {
        console.log("getMedia", err)
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

var mpMediaFuncs = {
  getMedia,
}

module.exports = mpMediaFuncs