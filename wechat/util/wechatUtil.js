/**
 * Created by yangyang on 2017/7/17.
 */
const http = require('http')
const https = require('https')
var WechatAPI = require('wechat-api')
var OAuth = require('wechat-oauth');
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
var oauth_client = new OAuth(GLOBAL_CONFIG.WECHAT_CONFIG.appid, GLOBAL_CONFIG.WECHAT_CONFIG.appSecret, wechatTokenFuncs.getOauthTokenFromMysql, wechatTokenFuncs.setOauthTokenToMysql);

module.exports = {
  wechat_api,
  oauth_client,
}