/**
 * Created by yangyang on 2017/7/17.
 */
const http = require('http')
const https = require('https')
var WechatAPI = require('wechat-api')
import axios from 'axios'
var GLOBAL_CONFIG = require('../../config')
var wechatTokenFuncs = require('../Token')

var maxSockets = 100

var wechat_api = new WechatAPI(GLOBAL_CONFIG.WECHAT_CONFIG.appid, GLOBAL_CONFIG.WECHAT_CONFIG.appSecret, wechatTokenFuncs.getApiTokenFromRedis, wechatTokenFuncs.setApiTokenToRedis)
wechat_api.setOpts({
  timeout: 150000,
  httpAgent: new http.Agent({
    keepAlive: true,
    maxSockets
  }),
  httpsAgent: new https.Agent({
    keepAlive: true,
    maxSockets
  })
})

async function getWechatUserInfo(openid) {
  if(!openid){
    return undefined
  }
  return await axios.get( GLOBAL_CONFIG.WECHAT_OAUTH_DOMAIN + '/1/wechat/userinfo?openid=' + openid).then((result) => {
    return result.data
  })
}

module.exports = {
  getWechatUserInfo,
  wechat_api,
}