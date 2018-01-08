/**
 * Created by yangyang on 2017/11/14.
 */
import AV from 'leanengine'
import * as errno from '../errno'
import mpAuthFuncs from '../../wechat/Auth'

const AGENT_LEVEL = {
  LEVEL_ONE: 1,
  LEVEL_TWO: 2,
  LEVEL_THREE: 3,
  LEVEL_FOUR: 4,
}

const ROYALTY_LEVEL = {
  ROYALTY_ONE: 0.2,
  ROYALTY_TWO: 0.35,
  ROYALTY_THREE: 0.4,
  ROYALTY_FOUR: 0.45
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
  let weappUnion = leanUserAttr.authData.lc_weapp_union
  user.weappOpenid = weappUnion && weappUnion.openid ? weappUnion.openid : undefined
  let wxpubAuthData = leanUserAttr.authData.weixin
  user.wxpubOpenid = wxpubAuthData && wxpubAuthData.openid ? wxpubAuthData.openid : undefined
  user.agentLevel = leanUserAttr.agentLevel
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
 * 更加用户id获取用户信息的外部接口
 * @param request
 */
export async function reqUserInfo(request) {
  let {userId} = request.params
  return getUserInfoById(userId)
}

/**
 * 判断用户代理级别是否需要升级
 * @param userId
 * @returns {*}
 */
async function agentLevelUpgrade(userId) {
  let user = undefined
  let userInfo = getUserInfoById(userId)
  if (userInfo.agentLevel < AGENT_LEVEL.LEVEL_THREE && userInfo.friendsNum > 5) {
    user = AV.Object.createWithoutData('_User', userId)
    user.set('agentLevel', AGENT_LEVEL.LEVEL_THREE)
    return await user.save()
  } else if (userInfo.agentLevel < AGENT_LEVEL.LEVEL_FOUR && userInfo.friendsNum > 10) {
    user = AV.Object.createWithoutData('_User', userId)
    user.set('agentLevel', AGENT_LEVEL.LEVEL_FOUR)
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
  if (!userId) {
    return undefined
  }
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
  let userInfo = getUserInfoById(userId)
  if (userInfo.agentLevel > AGENT_LEVEL.LEVEL_ONE) {
    return undefined
  }
  await incUserFriends(inviterId)
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

/**
 * 根据用户代理级别返回分成比例
 * @param agentLevel
 * @returns {number}
 */
export function getUserRoyalty(agentLevel) {
  switch (agentLevel) {
    case AGENT_LEVEL.LEVEL_ONE:
      return ROYALTY_LEVEL.ROYALTY_ONE
    case AGENT_LEVEL.LEVEL_TWO:
      return ROYALTY_LEVEL.ROYALTY_TWO
    case AGENT_LEVEL.LEVEL_THREE:
      return ROYALTY_LEVEL.ROYALTY_THREE
    case AGENT_LEVEL.LEVEL_FOUR:
      return ROYALTY_LEVEL.ROYALTY_FOUR
    default:
      return 0
  }
}

/**
 * 根据用户的unionid获取用户信息
 * @param unionid
 */
export async function getUserByUnionid(unionid) {
  let query = new AV.Query('_User')
  query.equalTo('unionid', unionid)
  let user = await query.first()
  return constructUser(user)
}

export async function createUserByWeappAuthData(authData) {
  let leanUser = new AV.User()
  leanUser.set('username', authData.uid)
  leanUser.set('unionid', authData.uid)
  return await leanUser.associateWithAuthData(authData, 'lc_weapp_union')
}

export async function associateUserWithWeappAuthData(userId, authData) {
  let user = AV.Object.createWithoutData('_User', userId)
  return await user.associateWithAuthData(authData, 'lc_weapp_union')
}

export async function createUserByWechatAuthData(authData, unionid) {
  let leanUser = new AV.User()
  let wechatUserInfo = await mpAuthFuncs.getUserInfo(authData.openid)
  leanUser.set('username', unionid)
  leanUser.set('unionid', unionid)
  leanUser.set('nickname', wechatUserInfo.nickname)
  leanUser.set('avatar', wechatUserInfo.headimgurl)
  return await leanUser.associateWithAuthData(authData, 'weixin')
}

export async function associateUserWithWechatAuthData(userId, authData) {
  let user = AV.Object.createWithoutData('_User', userId)
  return await user.associateWithAuthData(authData, 'weixin')
}
