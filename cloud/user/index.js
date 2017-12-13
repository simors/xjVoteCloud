/**
 * Created by yangyang on 2017/11/14.
 */
import AV from 'leanengine'
import * as errno from '../errno'

const AGENT_LEVEL = {
  LEVEL_ONE: 1,
  LEVEL_TWO: 2,
  LEVEL_THREE: 3
}

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
  user.agentLevel = leanUserAttr.agentLevel
  user.royalty = leanUserAttr.royalty
  user.inviterId = leanUserAttr.inviter ? leanUserAttr.inviter.id : undefined
  user.friendsNum = leanUserAttr.friendsNum
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

/**
 * 判断用户代理级别是否需要升级
 * @param userId
 * @returns {*}
 */
async function agentLevelUpgrade(userId) {
  let user = undefined
  let userInfo = getUserInfoById(userId)
  if (userInfo.agentLevel < AGENT_LEVEL.LEVEL_THREE && userInfo.friendsNum > 10) {
    user = AV.Object.createWithoutData('_User', userId)
    user.set('agentLevel', AGENT_LEVEL.LEVEL_THREE)
    return await user.save()
  }
  return user
}

/**
 * 增加用户的好友数
 * @param userId
 * @returns {*}
 */
export async function incUserFriends(userId) {
  let user = AV.Object.createWithoutData('_User', userId)
  user.increment('friendsNum')
  await user.save()
  return await agentLevelUpgrade(userId)
}

/**
 * 用户缴费成为代理后，更新用户的邀请者和代理级别
 * @param userId
 * @param inviterId
 * @returns {*|AV.Promise|Promise<T>}
 */
export async function tobeAgentLevelTwo(userId, inviterId) {
  let user = AV.Object.createWithoutData('_User', userId)
  if (inviterId) {
    let inviterInfo = getUserInfoById(inviterId)
    if (inviterInfo) {
      let inviter = AV.Object.createWithoutData('_User', inviterId)
      user.set('inviter', inviter)
    } else {
      throw new AV.Cloud.Error('inviter not exist', {code: errno.EACCES});
    }
  }
  user.set('agentLevel', AGENT_LEVEL.LEVEL_TWO)
  return await user.save()
}