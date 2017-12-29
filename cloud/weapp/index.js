/**
 * Created by yangyang on 2017/12/25.
 */
import AV from 'leancloud-storage'
import * as errno from '../errno'
import {getUserByUnionid, createUserByWeappAuthData, associateUserWithWeappAuthData} from '../user'
var urllib = require('urllib')

async function getWeappAccessToken(appid, secret, code) {
  var url = 'https://api.weixin.qq.com/sns/jscode2session';
  let result = await urllib.request(url, {
    method: 'GET',
    data: {
      appid: appid,
      secret: secret,
      js_code: code,
      grant_type: 'authorization_code'
    }
  })
  return JSON.parse(result.data.toString())
}

export async function getWeappAuthData(request) {
  let {appid, secret, code} = request.params
  let authData = await getWeappAccessToken(appid, secret, code)
  authData = {
    openid: authData.openid,
    uid: authData.unionid,
    session_key: authData.session_key
  }
  let user = await getUserByUnionid(authData.uid)
  if (!user) {
    await createUserByWeappAuthData(authData)
  } else {
    await associateUserWithWeappAuthData(user.id, authData)
  }
  return authData
}