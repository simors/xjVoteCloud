/**
 * Created by wanpeng on 2017/7/15.
 */
var GLOBAL_CONFIG = require('../../config')
var wechat_api = require('../util/wechatUtil').wechat_api

function createMenu() {
  var memu = {
    "button":[
      {
        "type": "view",
        "name": "小吉投票",
        "url": GLOBAL_CONFIG.WECHAT_CLIENT_DOMAIN
      },
      {
        "type":"view",
        "name":"我的钱包",
        "url": GLOBAL_CONFIG.WECHAT_CLIENT_DOMAIN + '/wallet'
      },
      {
        "name":"调试",
        "sub_button": [
          {
            "type":"view",
            "name":"android清理缓冲",
            "url": "http://debugx5.qq.com"
          }
        ]
      }
    ]
  }

  wechat_api.createMenu(memu, function (err, result) {
    if(err) {
      console.log(err)
    } else if(result.errcode != 0) {
      console.log("微信公众号菜单创建异常：", result.err)
    } else {
      console.log("微信公众号菜单创建成功")
    }
  })
}


var mpMenuFuncs = {
  createMenu: createMenu
}

module.exports = mpMenuFuncs