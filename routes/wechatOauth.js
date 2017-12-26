/**
 * Created by wanpeng on 2017/12/23.
 */

'use strict';
var AV = require('leanengine');
var router = require('express').Router();
var wechatAuthFuncs = require('../wechat/Auth')
var GLOBAL_CONFIG = require('../config')
var querystring = require('querystring')
import {getUserByUnionid, createUserByWechatAuthData, associateUserWithWechatAuthData} from '../cloud/user'

router.get('/', function (req, res, next) {
  var code = req.query.code
  var state = req.query.state
  var accessToken = undefined
  var openid = undefined
  var unionid = undefined
  var expires_in = undefined
  var authData = undefined
  let redirectUrl = ""

  wechatAuthFuncs.getAccessToken(code).then((result) => {
    console.log("getAccessToken result:", result)
    accessToken = result.data.access_token;
    openid = result.data.openid
    unionid = result.data.unionid
    expires_in = result.data.expires_in

    authData = {
      "openid": openid,
      "access_token": accessToken,
      "expires_at": Date.parse(expires_in),
    }
    return getUserByUnionid(unionid)

  }).then((user) => {
    if(!user) {
      return createUserByWechatAuthData(authData, unionid)
    } else {
      return associateUserWithWechatAuthData(user.id, authData)
    }
  }).then(() => {
    redirectUrl = GLOBAL_CONFIG.WECHAT_CLIENT_DOMAIN + state + '?' +querystring.stringify(authData)
    res.redirect(redirectUrl)
  }).catch((error) => {
    console.error(error)
    redirectUrl = GLOBAL_CONFIG.WECHAT_CLIENT_DOMAIN + '/error'
    res.redirect(redirectUrl)
  })
})


module.exports = router

