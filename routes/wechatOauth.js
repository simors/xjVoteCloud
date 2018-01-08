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
  var state = req.query.state
  var accessToken = req.query.access_token
  var openid = req.query.openid
  var unionid = req.query.unionid
  var expires_in = req.query.expires_in
  var authData = undefined
  let redirectUrl = ""

  authData = {
    "openid": openid,
    "access_token": accessToken,
    "expires_at": Date.parse(expires_in),
  }

  getUserByUnionid(unionid).then((user) => {
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

