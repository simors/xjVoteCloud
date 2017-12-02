/**
 * Created by yangyang on 2017/11/14.
 */
import AV from 'leanengine'
import * as errno from '../errno'

export function constructUser(leanUser) {
  let user = {}
  if (!leanUser) {
    return undefined
  }
  let leanUserAttr = leanUser.attributes
  user.id = leanUser.id
  user.createdAt = leanUser.createdAt
  user.updatedAt = leanUser.updatedAt
  user.nickname = leanUserAttr.nickname
  user.username = leanUserAttr.username
  user.avatar = leanUserAttr.avatar
  user.gender = leanUserAttr.gender
  user.province = leanUserAttr.province
  user.city = leanUserAttr.city
  user.openid = leanUserAttr.authData.lc_weapp.openid || undefined
  return user
}

export async function updateUserInfo(request) {
  let {nickname, gender, avatar, province, city} = request.params
  let currentUser = request.currentUser
  if (!currentUser) {
    throw new AV.Cloud.Error('Permission denied, need to login first', {code: errno.EACCES});
  }

  if (nickname) {
    currentUser.set('nickname', nickname)
  }
  if (gender) {
    currentUser.set('gender', gender)
  }
  if (avatar) {
    currentUser.set('avatar', avatar)
  }
  if (province) {
    currentUser.set('province', province)
  }
  if (city) {
    currentUser.set('city', city)
  }
  await currentUser.save()
  let newUser = await currentUser.fetch()
  return constructUser(newUser)
}

/**
 * 根据用户id获取用户详情
 * @param userId
 */
export async function getUserInfoById(userId) {
  let query = new AV.Query('_User')
  let userInfo = await query.get(userId)
  return constructUser(userInfo)
}