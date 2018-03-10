/**
 * Created by yangyang on 2017/11/24.
 */
import AV from 'leanengine'
import * as errno from '../errno'
import moment from 'moment'
import math from 'mathjs'
import {constructUser, getUserRoyalty} from '../user'
import {saveVoteProfit} from '../pay'
import mpMediaFuncs from '../../wechat/Media'

export const VOTE_STATUS = {
  EDITING: 1,     // 正在编辑
  PAYING: 2,      // 待支付
  WAITING: 3,     // 未开始
  STARTING: 4,    // 正在进行
  DONE: 5,        // 已结束
  ACCOUNTED: 6,   // 已结算
}

export const CONTRIBUTION_TYPE = {
  SHARE: 15,
  CREATE_VOTE: 15,
  VOTE: 10,
}

const VOTE_SEARCH_TYPE = {
  ALL: 'all',
  PERSONAL: 'personal',
}

const VOTE_TYPE = {
  WITH_GIFT: 1,
  NO_GIFT: 2
}

function constructGift(leanAward) {
  let award = {}
  if (!leanAward) {
    return undefined
  }
  let awardAttr = leanAward.attributes
  award.id = leanAward.id
  award.createdAt = moment(new Date(leanAward.createdAt)).format('YYYY-MM-DD HH:mm:ss')
  award.updatedAt = moment(new Date(leanAward.updatedAt)).format('YYYY-MM-DD HH:mm:ss')
  award.name = awardAttr.name
  award.ballot = awardAttr.ballot
  award.photo = awardAttr.photo
  award.price = awardAttr.price
  award.vtag = awardAttr.vtag
  return award
}

function constructVote(leanVote, includeUser) {
  let vote = {}
  if (!leanVote) {
    return undefined
  }
  let voteAttr = leanVote.attributes
  vote.id = leanVote.id
  vote.createdAt = moment(new Date(leanVote.createdAt)).format('YYYY-MM-DD HH:mm:ss')
  vote.updatedAt = moment(new Date(leanVote.updatedAt)).format('YYYY-MM-DD HH:mm:ss')
  vote.type = voteAttr.type ? voteAttr.type : VOTE_TYPE.WITH_GIFT
  vote.creatorId = voteAttr.creator ? voteAttr.creator.id : undefined
  vote.title = voteAttr.title
  vote.cover = voteAttr.cover
  vote.coverSet = voteAttr.coverSet
  vote.minImgMeta = voteAttr.minImgMeta
  vote.notice = voteAttr.notice
  vote.rule = voteAttr.rule
  vote.organizer = voteAttr.organizer
  vote.awards = voteAttr.awards
  vote.gifts = voteAttr.gifts
  vote.startDate = voteAttr.startDate
  vote.endDate = voteAttr.endDate
  vote.expire = voteAttr.expire
  vote.status = voteAttr.status
  vote.applyNum = voteAttr.applyNum
  vote.voteNum = voteAttr.voteNum
  vote.pv = voteAttr.pv
  vote.profit = voteAttr.profit
  vote.enable = voteAttr.enable
  vote.enablePresent = true
  
  if (vote.startDate) {
    let nowDate = moment().format('YYYY-MM-DD HH:mm:ss')
    let hours = 24 * (vote.expire - 1) + 21      // 活动在晚上9点结束
    let endDate = moment(vote.startDate, 'YYYY-MM-DD').add(hours, 'hours').format('YYYY-MM-DD HH:mm:ss')
    vote.counter = parseInt(((new Date(endDate)).getTime() - (new Date(nowDate)).getTime()) / 1000)
  } else if (vote.endDate) {
    let nowDate = moment().format('YYYY-MM-DD HH:mm:ss')
    let hours = 21      // 活动在晚上9点结束
    let endDate = moment(vote.endDate, 'YYYY-MM-DD').add(hours, 'hours').format('YYYY-MM-DD HH:mm:ss')
    vote.counter = parseInt(((new Date(endDate)).getTime() - (new Date(nowDate)).getTime()) / 1000)
  }
  
  if (includeUser) {
    vote.creator = constructUser(voteAttr.creator)
  }
  return vote
}

function constructPlayer(leanPlayer, includeUser, includeVote) {
  let player = {}
  if (!leanPlayer) {
    return undefined
  }
  let playerAttr = leanPlayer.attributes
  player.id = leanPlayer.id
  player.createdAt = moment(new Date(leanPlayer.createdAt)).format('YYYY-MM-DD HH:mm:ss')
  player.updatedAt = moment(new Date(leanPlayer.updatedAt)).format('YYYY-MM-DD HH:mm:ss')
  player.number = playerAttr.number
  player.name = playerAttr.name
  player.declaration = playerAttr.declaration
  player.album = playerAttr.album
  player.giftNum = playerAttr.giftNum
  player.voteNum = playerAttr.voteNum
  player.pv = playerAttr.pv
  player.enable = playerAttr.enable
  player.creatorId = playerAttr.creator ? playerAttr.creator.id : undefined
  player.voteId = playerAttr.vote ? playerAttr.vote.id : undefined
  
  if (includeUser) {
    player.creator = constructUser(playerAttr.creator)
  }
  if (includeVote) {
    player.vote = constructVote(playerAttr.vote, false)
  }
  return player
}

function constructGiftMap(leanGiftMap) {
  let giftMap = {}
  if (!leanGiftMap) {
    return undefined
  }
  let giftMapAttr = leanGiftMap.attributes
  giftMap.id = leanGiftMap.id
  giftMap.createdAt = moment(new Date(leanGiftMap.createdAt)).format('YYYY-MM-DD HH:mm:ss')
  giftMap.updatedAt = moment(new Date(leanGiftMap.updatedAt)).format('YYYY-MM-DD HH:mm:ss')
  giftMap.giftNum = giftMapAttr.giftNum
  giftMap.price = giftMapAttr.price
  giftMap.voteId = giftMapAttr.vote? giftMapAttr.vote.id : undefined
  giftMap.vote = constructVote(giftMapAttr.vote, false)
  giftMap.giftId = giftMapAttr.gift? giftMapAttr.gift.id : undefined
  giftMap.gift = constructGift(giftMapAttr.gift)
  giftMap.userId = giftMapAttr.user? giftMapAttr.user.id : undefined
  giftMap.user = constructUser(giftMapAttr.user)
  giftMap.playerId = giftMapAttr.player? giftMapAttr.player.id : undefined
  giftMap.player = constructPlayer(giftMapAttr.player, false, false)
  return giftMap
}

/**
 * 获取所有礼品列表
 * @param request
 * @returns {Array}
 */
export async function fetchGifts(request) {
  let retAwards = []
  let query = new AV.Query('Gifts')
  query.equalTo('vtag', 'v01')
  query.ascending('price')
  let result = await query.find()
  for (let award of result) {
    retAwards.push(constructGift(award))
  }
  return retAwards
}

/**
 * 赠送某个礼物，在用户成功支付后，由支付接口调用
 * @param userId
 * @param playerId
 * @param giftId
 * @param price
 * @param giftNum
 * @param ballot
 * @returns {*}
 */
export async function presentGift(userId, playerId, giftId, price, giftNum, ballot) {
  let player = AV.Object.createWithoutData('Player', playerId)
  let gift = AV.Object.createWithoutData('Gifts', giftId)
  let user = AV.Object.createWithoutData('_User', userId)
  let vote = await getVoteByPlayer(playerId)
  
  if (vote.attributes.status == VOTE_STATUS.DONE || vote.attributes.status == VOTE_STATUS.ACCOUNTED) {
    throw new AV.Cloud.Error('Vote was done', {code: errno.ERROR_VOTE_WAS_DONE});
  }
  
  await incPlayerGift(playerId, giftNum)
  await incPlayerVoteNum(playerId, ballot)
  await incVoteNum(vote.id, ballot)
  
  let GiftMap = AV.Object.extend('GiftMap')
  let giftMap = new GiftMap()
  giftMap.set('vote', vote)
  giftMap.set('gift', gift)
  giftMap.set('player', player)
  giftMap.set('user', user)
  giftMap.set('giftNum', giftNum)
  giftMap.set('price', price)
  return await giftMap.save()
}

/**
 * 获取某个参赛选手名下收到的礼物
 * @param request
 */
export async function listGiftsUnderPlayer(request) {
  let {playerId, lastTime, limit} = request.params
  
  let player = AV.Object.createWithoutData('Player', playerId)
  let query = new AV.Query('GiftMap')
  query.equalTo('player', player)
  if (lastTime) {
    query.lessThan('createdAt', new Date(lastTime))
  }
  query.include(['user', 'player', 'vote', 'gift'])
  query.descending('createdAt')
  query.limit(limit || 10)
  let giftsList = await query.find()
  let presentGifts = []
  giftsList.forEach((giftMap) => {
    presentGifts.push(constructGiftMap(giftMap))
  })
  return presentGifts
}

/**
 * 创建一个新的投票活动
 * @param request
 */
export async function createVote(request) {
  let currentUser = request.currentUser
  if (!currentUser) {
    throw new AV.Cloud.Error('Permission denied, need to login first', {code: errno.EACCES});
  }
  let {type, title, cover, coverSet, minImgMeta, notice, rule, organizer, awards, gifts, startDate, expire, endDate} = request.params
  let Votes = AV.Object.extend('Votes')
  let vote = new Votes()
  vote.set('type', type)
  vote.set('title', title)
  vote.set('cover', cover)
  vote.set('coverSet', coverSet)
  vote.set('minImgMeta', minImgMeta)
  vote.set('notice', notice)
  vote.set('rule', rule)
  vote.set('organizer', organizer)
  vote.set('awards', awards)
  vote.set('gifts', gifts)
  vote.set('startDate', startDate)
  vote.set('endDate', endDate)
  vote.set('expire', expire)
  vote.set('creator', currentUser)
  vote.set('status', VOTE_STATUS.EDITING)
  try{
    let payload = {
      userId:currentUser.id,
      contributionType: CONTRIBUTION_TYPE.CREATE_VOTE
    }
    await addContribution(payload)
  }catch(e){
    throw new AV.Cloud.Error('贡献添加失败', {code: errno.ERROR_CONTRIBUTION_FAIL});
  }
  return await vote.save()
}

async function newVote(voteObj) {
  let Votes = AV.Object.extend('Votes')
  let vote = new Votes()
  vote.set('type', voteObj.type)
  vote.set('title', voteObj.title)
  vote.set('cover', voteObj.cover)
  vote.set('coverSet', voteObj.coverSet)
  vote.set('minImgMeta', voteObj.minImgMeta)
  vote.set('notice', voteObj.notice)
  vote.set('rule', voteObj.rule)
  vote.set('organizer', voteObj.organizer)
  vote.set('awards', voteObj.awards)
  vote.set('gifts', voteObj.gifts)
  vote.set('startDate', voteObj.startDate)
  vote.set('endDate', voteObj.endDate)
  vote.set('expire', voteObj.expire)
  vote.set('creator', voteObj.user)
  vote.set('status', VOTE_STATUS.EDITING)
  return await vote.save()
}

async function updateVote(voteObj) {
  let vote = AV.Object.createWithoutData('Votes', voteObj.id)
  if (voteObj.type) {
    vote.set('type', voteObj.type)
  }
  if (voteObj.title) {
    vote.set('title', voteObj.title)
  }
  if (voteObj.cover) {
    vote.set('cover', voteObj.cover)
  }
  if (voteObj.coverSet) {
    vote.set('coverSet', voteObj.coverSet)
  }
  if (voteObj.minImgMeta) {
    vote.set('minImgMeta', voteObj.minImgMeta)
  }
  if (voteObj.notice) {
    vote.set('notice', voteObj.notice)
  }
  if (voteObj.rule) {
    vote.set('rule', voteObj.rule)
  }
  if (voteObj.organizer) {
    vote.set('organizer', voteObj.organizer)
  }
  if (voteObj.awards) {
    vote.set('awards', voteObj.awards)
  }
  if (voteObj.gifts) {
    vote.set('gifts', voteObj.gifts)
  }
  if (voteObj.startDate) {
    vote.set('startDate', voteObj.startDate)
  }
  if (voteObj.expire) {
    vote.set('expire', voteObj.expire)
  }
  if (voteObj.status) {
    vote.set('status', voteObj.status)
  }
  if (voteObj.endDate) {
    vote.set('endDate', voteObj.endDate)
  }
  return await vote.save()
}

/**
 * 创建或更新投票活动，当判断没有id时，创建一个新的投票，否则更新已有投票(for微信小程序)
 * @param request
 * @returns {*}
 */
export async function createOrUpdateVote(request) {
  let currentUser = request.currentUser
  if (!currentUser) {
    throw new AV.Cloud.Error('Permission denied, need to login first', {code: errno.EACCES});
  }
  let {id, type, title, cover, coverSet, minImgMeta, notice, rule, organizer, awards, gifts, startDate, expire, status, endDate} = request.params
  let voteObj = undefined
  let result = undefined
  if (!id) {
    voteObj = {
      user: currentUser,
      type,
      title,
      cover,
      coverSet,
      minImgMeta,
      notice,
      rule,
      organizer,
      awards,
      gifts,
      startDate,
      expire,
      endDate
    }
    result = await newVote(voteObj)
    return result
  }
  voteObj = {
    id,
    type,
    title,
    cover,
    coverSet,
    minImgMeta,
    notice,
    rule,
    organizer,
    awards,
    gifts,
    startDate,
    expire,
    status,
    endDate
  }
  result = await updateVote(voteObj)
  return result
}

/**
 * 创建或更新投票活动，当判断没有id时，创建一个新的投票，否则更新已有投票(for微信公众号)
 * @param request
 * @returns {*}
 */
export async function createOrUpdateVoteMP(request) {
  let currentUser = request.currentUser
  if (!currentUser) {
    throw new AV.Cloud.Error('Permission denied, need to login first', {code: errno.EACCES});
  }
  let {id, type, title, cover, coverSet, minImgMeta, notice, rule, organizer, awards, gifts, startDate, expire, status, endDate} = request.params

  if(cover && cover.length > 0) {
    if(cover.indexOf('http') != 0) {
      let buffer = await mpMediaFuncs.getMedia(cover)
      let data = {'base64': buffer.toString('base64')}
      let file = new AV.File('cover' + id, data)
      file = await file.save()
      cover = file.url()
    }
  }
  
  let newCoverSet = []
  if (coverSet && coverSet.length > 0) {
    for (let coverItem of coverSet) {
      if(coverItem.indexOf('http') != 0) {
        let buffer = await mpMediaFuncs.getMedia(coverItem)
        let data = {'base64': buffer.toString('base64')}
        let file = new AV.File('cover' + id, data)
        file = await file.save()
        newCoverSet.push(file.url())
      }
    }
  }

  if(awards && awards.length > 0) {
    for (let award of awards) {
      if(award.awardPhoto && award.awardPhoto.indexOf('http') != 0) {
        let buffer = await mpMediaFuncs.getMedia(award.awardPhoto)
        let data = {'base64': buffer.toString('base64')}
        let file = new AV.File(award.awardName + id, data)
        file = await file.save()
        award.awardPhoto = file.url()
      }
    }
  }

  if(organizer && organizer.length > 0) {
    for (let value of organizer) {
      if(value.type === 'image' && value.url && value.url.indexOf('http') != 0) {
        let buffer = await mpMediaFuncs.getMedia(value.url)
        let data = {'base64': buffer.toString('base64')}
        let file = new AV.File(value.url + id, data)
        file = await file.save()
        value.url = file.url()
      }
    }
  }

  let voteObj = undefined
  let result = undefined
  if (!id) {
    voteObj = {
      user: currentUser,
      type,
      title,
      cover,
      coverSet: newCoverSet,
      minImgMeta,
      notice,
      rule,
      organizer,
      awards,
      gifts,
      startDate,
      expire,
      endDate
    }
    result = await newVote(voteObj)
    return result
  }
  voteObj = {
    id,
    type,
    title,
    cover,
    coverSet: newCoverSet,
    minImgMeta,
    notice,
    rule,
    organizer,
    awards,
    gifts,
    startDate,
    expire,
    status,
    endDate
  }
  result = await updateVote(voteObj)
  return result
}

/**
 * 是否允许用户报名
 * @param request
 * @returns {*|AV.Promise|Promise.<T>}
 */
export async function enablePlayerApply(request) {
  let {voteId, enable} = request.params
  if (enable) {
    return await updateVoteStatus(voteId, VOTE_STATUS.WAITING)
  } else {
    return await updateVoteStatus(voteId, VOTE_STATUS.STARTING)
  }
}

/**
 * 判断投票活动状态，如是否已开始，，是否已经结束，每次状态变化时需要更新状态并返回最新的投票信息
 * @param vote
 */
async function judgeVoteStatus(vote) {
  let nowDate = moment().format('YYYY-MM-DD HH:mm:ss')
  let status = vote.attributes.status
  let startDate = vote.attributes.startDate
  let expire = vote.attributes.expire
  let endDate = vote.attributes.endDate
  let endDateCal = undefined
  
  let query = new AV.Query('Votes')
  
  if (startDate) {
    if (status == VOTE_STATUS.WAITING) {
      endDateCal = moment(startDate, 'YYYY-MM-DD').format('YYYY-MM-DD')
      if (nowDate >= endDateCal) {
        await updateVoteStatus(vote.id, VOTE_STATUS.STARTING)
        return await query.get(vote.id)
      }
    } else if (status == VOTE_STATUS.STARTING) {
      let hours = 24 * (expire - 1) + 21      // 活动在晚上9点结束
      endDateCal = moment(startDate, 'YYYY-MM-DD').add(hours, 'hours').format('YYYY-MM-DD HH:mm:ss')
      if (nowDate >= endDateCal) {
        await updateVoteStatus(vote.id, VOTE_STATUS.DONE)
        return await query.get(vote.id)
      }
    }
  } else if (endDate) {
    let hours = 21      // 活动在晚上9点结束
    endDateCal = moment(endDate, 'YYYY-MM-DD').add(hours, 'hours').format('YYYY-MM-DD HH:mm:ss')
    if (nowDate >= endDateCal && status == VOTE_STATUS.STARTING) {
      await updateVoteStatus(vote.id, VOTE_STATUS.DONE)
      return await query.get(vote.id)
    }
  }
  
  return vote
}

/**
 * 获取投票活动的详情，包括礼品详情列表
 * @param voteId
 * @param updateStatus    是否要更新投票的状态
 */
async function getVoteDetailById(voteId, updateStatus) {
  let query = new AV.Query('Votes')
  let leanVote = await query.get(voteId)
  let stLeanVote = undefined
  if (updateStatus) {
    stLeanVote = await judgeVoteStatus(leanVote)
  } else {
    stLeanVote = leanVote
  }
  let vote = constructVote(stLeanVote)
  let giftIds = vote.gifts
  if (giftIds && Array.isArray(giftIds)) {
    let giftQuery = new AV.Query('Gifts')
    giftQuery.containedIn('objectId', giftIds)
    let leanGifts = await giftQuery.find()
    let gifts = []
    leanGifts.forEach((gift) => {
      gifts.push(constructGift(gift))
    })
    vote.gifts = gifts
  }
  
  return vote
}

/**
 * 根据参与者id获取对应投票活动信息
 * @param playerId
 * @returns {*}
 */
async function getVoteByPlayer(playerId) {
  let query = new AV.Query('Player')
  query.include('vote')
  let leanPlayer = await query.get(playerId)
  return leanPlayer.attributes.vote
}

/**
 * 根据id来获取投票的详情信息
 * @param request
 */
export async function fetchVoteById(request) {
  let {voteId, updateStatus} = request.params
  return await getVoteDetailById(voteId, updateStatus)
}

/**
 * 获取创建的投票列表
 * @param request
 * @returns {Array}
 */
export async function fetchVotes(request) {
  let currentUser = request.currentUser
  let {searchType, status, orderedBy, lastTime, limit} = request.params
  
  let query = new AV.Query('Votes')
  query.descending('createdAt')
  
  if (searchType === VOTE_SEARCH_TYPE.PERSONAL) {
    if (!currentUser) {
      throw new AV.Cloud.Error('Permission denied, need to login first', {code: errno.EACCES});
    }
    query.equalTo('creator', currentUser)
  }

  if (status) {
    if (status.constructor !== Array) {
      status = [status];
    }
    query.containedIn('status', status);
  }
  if (orderedBy) {
    query.descending(orderedBy);
  }
  if (lastTime) {
    query.lessThan('createdAt', new Date(lastTime))
  }
  query.equalTo('enable', 1)
  if (limit) {
    query.limit(limit)
  } else {
    query.limit(10)
  }
  let leanVotes = await query.find()
  let votes = []
  leanVotes.forEach((leanVote) => {
    votes.push(constructVote(leanVote, false))
  })
  return votes
}

/**
 * 获取某个投票活动下的礼品列表
 * @param request
 */
export async function fetchGiftsByVote(request) {
  let {voteId} = request.params
  let vote = await getVoteDetailById(voteId, false)
  if (vote.gifts && Array.isArray(vote.gifts)) {
    return vote.gifts.sort((g1, g2) => g1.price - g2.price)
  }
  return []
}

/**
 * 更新投票的状态，通常需要在完成支付、活动开始或活动结束的时候调用
 * @param voteId
 * @param status
 * @returns {*|AV.Promise|Promise<T>}
 */
export async function updateVoteStatus(voteId, status) {
  if (!voteId) {
    console.error('input error!')
    return undefined
  }
  let vote = AV.Object.createWithoutData('Votes', voteId)
  vote.set('status', status)
  return await vote.save()
}

/**
 * 设置投票的使能
 * @param request
 * @returns {Promise<T>|*|AV.Promise}
 */
export async function setVoteDisable(request) {
  let {voteId, disable} = request.params
  
  let vote = AV.Object.createWithoutData('Votes', voteId)
  vote.set('enable', disable ? 0 : 1)
  return await vote.save()
}

/**
 * 更新投票的热度
 * @param request
 */
export async function incVotePv(request) {
  let {voteId} = request.params
  let vote = AV.Object.createWithoutData('Votes', voteId)
  vote.increment('pv')
  return await vote.save()
}

/**
 * 增加参与投票的票数
 * @param voteId
 * @param voteNum
 * @returns {*|AV.Promise|Promise<T>}
 */
export async function incVoteNum(voteId, voteNum) {
  let vote = AV.Object.createWithoutData('Votes', voteId)
  vote.increment('voteNum', voteNum)
  return await vote.save()
}

/**
 * 增加活动参与者的个数
 * @param voteId
 * @returns {*|AV.Promise|Promise<T>}
 */
export async function incVoteApplyNum(voteId) {
  let vote = AV.Object.createWithoutData('Votes', voteId)
  vote.increment('applyNum')
  return await vote.save()
}

/**
 * 减少活动参与者个数
 * @param voteId
 * @returns {*|AV.Promise|Promise<T>}
 */
async function decVoteApplyNum(voteId) {
  let vote = AV.Object.createWithoutData('Votes', voteId)
  vote.increment('applyNum', -1)
  return await vote.save()
}

/**
 * 根据投票活动获取新报名参与者的参赛编号
 * @param voteId
 */
async function getLastPlayerNumber(voteId) {
  let query = new AV.Query('Player')
  let vote = AV.Object.createWithoutData('Votes', voteId)
  query.equalTo('vote', vote)
  let leanPlayers = await query.find()
  let maxNumber = 0
  leanPlayers.forEach((leanPlayer) => {
    let player = constructPlayer(leanPlayer, false, false)
    maxNumber = maxNumber > player.number ? maxNumber : player.number
  })
  return maxNumber + 1
}

/**
 * 添加一个新的参赛选手(for微信小程序)
 * @param request
 */
export async function createPlayerApply(request) {
  let currentUser = request.currentUser
  if (!currentUser) {
    throw new AV.Cloud.Error('Permission denied, need to login first', {code: errno.EACCES});
  }
  let {voteId, name, declaration, album} = request.params
  
  // 更新参与人数
  await incVoteApplyNum(voteId)
  
  let number = await getLastPlayerNumber(voteId)
  
  let Player = AV.Object.extend('Player')
  let player = new Player()
  let vote = AV.Object.createWithoutData('Votes', voteId)
  player.set('vote', vote)
  player.set('creator', currentUser)
  player.set('number', number)
  player.set('name', name)
  player.set('declaration', declaration)
  player.set('album', album)
  return await player.save()
}

/**
 * 添加一个新的参赛选手(for微信公众号)
 * @param request
 */
export async function createPlayerApplyMP(request) {
  let currentUser = request.currentUser
  if (!currentUser) {
    throw new AV.Cloud.Error('Permission denied, need to login first', {code: errno.EACCES});
  }
  let {voteId, name, declaration, imageServerIds} = request.params

  let imageUrls = []
  for (let i = 0; i < imageServerIds.length; i ++) {
    let buffer = await mpMediaFuncs.getMedia(imageServerIds[i])
    let data = {'base64': buffer.toString('base64')}
    let file = new AV.File(name + i, data)
    file = await file.save()
    imageUrls.push(file.url())
  }
  // 更新参与人数
  await incVoteApplyNum(voteId)
  let number = await getLastPlayerNumber(voteId)

  let Player = AV.Object.extend('Player')
  let player = new Player()
  let vote = AV.Object.createWithoutData('Votes', voteId)
  player.set('vote', vote)
  player.set('creator', currentUser)
  player.set('number', number)
  player.set('name', name)
  player.set('declaration', declaration)
  player.set('album', imageUrls)
  return await player.save()
}

/**
 * 获取某个投票活动的所有参与者
 * @param request
 * @returns {Array}
 */
export async function fetchVotePlayers(request) {
  let {voteId, lastNumber, limit} = request.params
  
  let vote = AV.Object.createWithoutData('Votes', voteId)
  
  let query = new AV.Query('Player')
  query.ascending('number')
  query.equalTo('vote', vote)
  query.equalTo('enable', 1)
  if (lastNumber) {
    query.greaterThan('number', lastNumber)
  }
  query.limit(limit || 10)
  let leanPlayers = await query.find()
  let players = []
  leanPlayers.forEach((player) => {
    players.push(constructPlayer(player, false, false))
  })
  return players
}

/**
 * 根据参赛选手id获取详情
 * @param request
 */
export async function getPlayerById(request) {
  let {playerId} = request.params
  
  let query = new AV.Query('Player')
  let player = await query.get(playerId)
  return constructPlayer(player, false, false)
}

/**
 * 设置参赛选手是否有效
 * @param request
 * @returns {*|AV.Promise|Promise<T>}
 */
export async function setPlayerDisable(request) {
  let {playerId, disable} = request.params
  
  let vote = await getVoteByPlayer(playerId)
  if (disable) {
    await decVoteApplyNum(vote.id)
  } else {
    await incVoteApplyNum(vote.id)
  }
  let player = AV.Object.createWithoutData('Player', playerId)
  player.set('enable', disable ? 0 : 1)
  return await player.save()
}

/**
 * 搜索某个投票活动的参赛者
 * @param request
 */
export async function searchPlayer(request) {
  let {voteId, searchKey} = request.params
  
  let query = new AV.Query('Player')
  
  if (isNaN(searchKey)) {
    query.equalTo('name', searchKey)
  } else {
    query.equalTo('number', Number(searchKey))
  }
  
  let vote = AV.Object.createWithoutData('Votes', voteId)
  query.equalTo('vote', vote)
  query.equalTo('enable', 1)
  let leanPlayers = await query.find()
  let players = []
  leanPlayers.forEach((player) => {
    players.push(constructPlayer(player, false, false))
  })
  return players
}

/**
 * 刷新某个参赛选手的热度
 * @param request
 * @returns {*|AV.Promise|Promise<T>}
 */
export async function incPlayerPv(request) {
  let {playerId} = request.params
  let player = AV.Object.createWithoutData('Player', playerId)
  player.increment('pv')
  return await player.save()
}

/**
 * 更新某个参赛选手获得的投票数
 * @param playerId
 * @param voteNum
 * @returns {*|AV.Promise|Promise<T>}
 */
export async function incPlayerVoteNum(playerId, voteNum) {
  let player = AV.Object.createWithoutData('Player', playerId)
  player.increment('voteNum', voteNum)
  return await player.save()
}

/**
 * 更新某个参赛选手收到的礼品数
 * @param playerId
 * @param giftNum
 * @returns {*|AV.Promise|Promise<T>}
 */
async function incPlayerGift(playerId, giftNum) {
  let player = AV.Object.createWithoutData('Player', playerId)
  player.increment('giftNum', giftNum)
  return await player.save()
}

/**
 * 获取某个投票活动过得排行榜
 * @param request
 * @returns {Array}
 */
export async function fetchVoteRank(request) {
  let {voteId} = request.params
  
  let vote = AV.Object.createWithoutData('Votes', voteId)
  let query = new AV.Query('Player')
  query.equalTo('vote', vote)
  query.equalTo('enable', 1)
  query.descending('voteNum')
  query.limit(500)
  let leanRank = await query.find()
  let rank = []
  leanRank.forEach((player) => {
    rank.push(constructPlayer(player))
  })
  return rank
}

/**
 * 获取某个用户对参赛选手的投票信息
 * @param playerId
 * @param user
 * @returns {*}
 */
async function getVotePlayerByDate(playerId, user) {
  let query = new AV.Query('VoteMap')
  let player = AV.Object.createWithoutData('Player', playerId)
  query.equalTo('voteDate', new Date(moment().format('YYYY-MM-DD')))
  query.equalTo('player', player)
  query.equalTo('user', user)
  let result = await query.first()
  return result
}

/**
 * 判断当天用户是否还可以投票，每个用户每天智能给同一个选手投1票
 * @param playerId
 * @param user
 * @returns {boolean}
 */
async function isVotePlayerAllowed(playerId, user) {
  const maxVotePerDay = 1
  let query = new AV.Query('VoteMap')
  let player = AV.Object.createWithoutData('Player', playerId)
  query.equalTo('voteDate', new Date(moment().format('YYYY-MM-DD')))
  query.equalTo('player', player)
  query.equalTo('user', user)
  let result = await query.find()
  if (result.length > 0) {
    let voteNum = result[0].attributes.voteNum
    if (voteNum == maxVotePerDay) {
      return false
    }
    return true
  }
  return true
}

/**
 * 判断当天用户是否还可以投票，每个用户对每个投票活动只可以投1票
 * @param voteId
 * @param user
 * @returns {boolean}
 */
async function isVoteAllowed(voteId, user) {
  const maxVotePerDay = 1
  let query = new AV.Query('VoteMap')
  let vote = AV.Object.createWithoutData('Votes', voteId)
  query.equalTo('voteDate', new Date(moment().format('YYYY-MM-DD')))
  query.equalTo('vote', vote)
  query.equalTo('user', user)
  let result = await query.find()
  if (result.length > 0) {
    let voteNum = result[0].attributes.voteNum
    if (voteNum == maxVotePerDay) {
      return false
    }
    return true
  }
  return true
}

/**
 * 判断是否还可以投票的网络请求
 * @param request
 */
export async function reqIsVoteAllowed(request) {
  let currentUser = request.currentUser
  if (!currentUser) {
    throw new AV.Cloud.Error('Permission denied, need to login first', {code: errno.EACCES});
  }
  let {voteId} = request.params
  
  return await isVoteAllowed(voteId, currentUser)
}

/**
 * 为某个参赛选手投票
 * @param request
 */
export async function voteForPlayer(request) {
  let currentUser = request.currentUser
  if (!currentUser) {
    throw new AV.Cloud.Error('Permission denied, need to login first', {code: errno.EACCES});
  }
  let {playerId} = request.params
  
  let vote = await getVoteByPlayer(playerId)
  if (vote.attributes.status == VOTE_STATUS.DONE || vote.attributes.status == VOTE_STATUS.ACCOUNTED) {
    throw new AV.Cloud.Error('Vote was done', {code: errno.ERROR_VOTE_WAS_DONE});
  }
  
  let isAllowed = await isVoteAllowed(vote.id, currentUser)
  if (!isAllowed) {
    throw new AV.Cloud.Error('Vote was used up', {code: errno.ERROR_VOTE_USE_UP});
  }
  
  let voteMap = await getVotePlayerByDate(playerId, currentUser)
  if (!voteMap) {
    let VoteMap = AV.Object.extend('VoteMap')
    voteMap = new VoteMap()
  }
  
  let player = AV.Object.createWithoutData('Player', playerId)
  
  voteMap.set('user', currentUser)
  voteMap.set('player', player)
  voteMap.set('vote', vote)
  voteMap.set('voteDate', new Date(moment().format('YYYY-MM-DD')))
  voteMap.increment('voteNum')
  let newVoteMap = await voteMap.save()
  // 增加参赛者票数统计值
  await incPlayerVoteNum(playerId, 1)
  // 增加此投票活动的总票数统计值
  await incVoteNum(vote.id, 1)
  return newVoteMap
}

/**
 * 根据模版名称获取规则模板的内容
 * @param request
 */
export async function getRuleTemplate(request) {
  let {tempName} = request.params
  
  let query = new AV.Query('RuleTemp')
  query.equalTo('tempName', tempName)
  let result = await query.first()
  if (result) {
    return result.attributes.content
  }
  return ''
}

/**
 * 更新投票活动的利润
 * @param voteId
 * @param profit
 * @returns {Promise<T>|*|AV.Promise}
 */
export async function incVoteProfit(voteId, profit) {
  let vote = AV.Object.createWithoutData('Votes', voteId)
  vote.increment('profit', profit)
  return await vote.save()
}

/**
 * 根据日期遍历获取所有已结束的投票活动
 * @param lastDate
 * @returns {*|Promise|Promise<T>}
 */
async function fetchVotesOrderByDate(lastDate) {
  let query = new AV.Query('Votes')
  query.equalTo('status', VOTE_STATUS.DONE)
  query.descending('createdAt')
  if (lastDate) {
    query.lessThan('createdAt', new Date(lastDate))
  }
  query.include('creator')
  query.limit(1000)
  return await query.find()
}

/**
 * 执行收益结算
 */
export async function runVoteProfitAccount(request) {
  console.log('begin to run vote profit account')
  let lastDate = undefined
  let votes = await fetchVotesOrderByDate()
  while (1) {
    if (votes.length === 0) {
      break
    }
    for (let vote of votes) {
      let voteAttr = vote.attributes
      if (voteAttr.profit == undefined || !voteAttr.creator || !voteAttr.creator.id || !voteAttr.creator.attributes) {
        continue
      }
      console.log('begin to account vote id', vote.id, ' with status ', voteAttr.status)
      let profit = voteAttr.profit
      let creator = voteAttr.creator.id
      let royalty = getUserRoyalty(voteAttr.creator.attributes.agentLevel)
      let creatorProfit = math.round(math.chain(profit).multiply(royalty).done(), 2)
      try {
        await saveVoteProfit(creatorProfit, creator)
        await updateVoteStatus(vote.id, VOTE_STATUS.ACCOUNTED)
      } catch (e) {
        console.error('error in statistics vote profit with voteId', vote.id, e)
      }
    }
    if (votes.length > 0) {
      lastDate = votes[votes.length - 1].createdAt
      votes = await fetchVotesOrderByDate(lastDate)
    }
  }
}

/**
 * 创建活动是的口令，目前只有临时代理才需要
 * @param request
 * @returns {string}
 */
export async function getCreateVotePassword(request) {
  return "ewi2j1"
}

/**
 * 增加用户的贡献度
 * @param params
 * @return
 */
export async function addContribution(params){
  let {userId, contibutionType } = params
  try{
    let user = AV.Object.createWithoutData('_User',userId)
    user.increment('contribution',contibutionType)
    await user.save()
    return
  }catch(e){
    console.log('分数记录错误')
  }
}

/**
 * 创建投票以后增加贡献值
 * @param request
 */
export async function createVoteContribution(request){

}