/**
 * Created by yangyang on 2017/11/24.
 */
import AV from 'leanengine'
import * as errno from '../errno'
import {constructUser} from '../user'

const VOTE_STATUS = {
  EDITING: 1,     // 正在编辑
  PAYING: 2,      // 待支付
  WAITING: 3,     // 未开始
  STARTING: 4,    // 正在进行
  DONE: 5,        // 已结束
}

const VOTE_SEARCH_TYPE = {
  ALL: 'all',
  PERSONAL: 'personal',
}

function constructGift(leanAward) {
  let award = {}
  if (!leanAward) {
    return undefined
  }
  let awardAttr = leanAward.attributes
  award.id = leanAward.id
  award.createdAt = leanAward.createdAt
  award.updatedAt = leanAward.updatedAt
  award.name = awardAttr.name
  award.ballot = awardAttr.ballot
  award.photo = awardAttr.photo
  award.price = awardAttr.price
  return award
}

function constructVote(leanVote, includeUser) {
  let vote = {}
  if (!leanVote) {
    return undefined
  }
  let voteAttr = leanVote.attributes
  vote.id = leanVote.id
  vote.createdAt = leanVote.createdAt
  vote.updatedAt = leanVote.updatedAt
  vote.creatorId = voteAttr.creator.id
  vote.title = voteAttr.title
  vote.cover = voteAttr.cover
  vote.notice = voteAttr.notice
  vote.organizer = voteAttr.organizer
  vote.awards = voteAttr.awards
  vote.gifts = voteAttr.gifts
  vote.startDate = voteAttr.startDate
  vote.expire = voteAttr.expire
  vote.status = voteAttr.status
  vote.applyNum = voteAttr.applyNum
  vote.voteNum = voteAttr.voteNum
  vote.pv = voteAttr.pv
  
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
  player.createdAt = leanPlayer.createdAt
  player.updatedAt = leanPlayer.updatedAt
  player.number = playerAttr.number
  player.name = playerAttr.name
  player.declaration = playerAttr.declaration
  player.album = playerAttr.album
  player.giftNum = playerAttr.giftNum
  player.voteNum = playerAttr.voteNum
  player.pv = playerAttr.pv
  player.creatorId = playerAttr.creator.id
  player.voteId = playerAttr.vote.id
  
  if (includeUser) {
    player.creator = constructUser(playerAttr.creator)
  }
  if (includeVote) {
    player.vote = constructVote(playerAttr.vote, false)
  }
  return player
}

/**
 * 获取所有礼品列表
 * @param request
 * @returns {Array}
 */
export async function fetchGifts(request) {
  let retAwards = []
  let query = new AV.Query('Gifts')
  query.ascending('price')
  let result = await query.find()
  for (let award of result) {
    retAwards.push(constructGift(award))
  }
  return retAwards
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
  let {title, cover, notice, rule, organizer, awards, gifts, startDate, expire} = request.params
  let Votes = AV.Object.extend('Votes')
  let vote = new Votes()
  vote.set('title', title)
  vote.set('cover', cover)
  vote.set('notice', notice)
  vote.set('rule', rule)
  vote.set('organizer', organizer)
  vote.set('awards', awards)
  vote.set('gifts', gifts)
  vote.set('startDate', startDate)
  vote.set('expire', expire)
  vote.set('creator', currentUser)
  vote.set('status', VOTE_STATUS.EDITING)
  return await vote.save()
}

async function newVote(voteObj) {
  let Votes = AV.Object.extend('Votes')
  let vote = new Votes()
  vote.set('title', voteObj.title)
  vote.set('cover', voteObj.cover)
  vote.set('notice', voteObj.notice)
  vote.set('rule', voteObj.rule)
  vote.set('organizer', voteObj.organizer)
  vote.set('awards', voteObj.awards)
  vote.set('gifts', voteObj.gifts)
  vote.set('startDate', voteObj.startDate)
  vote.set('expire', voteObj.expire)
  vote.set('creator', voteObj.user)
  vote.set('status', VOTE_STATUS.EDITING)
  return await vote.save()
}

async function updateVote(voteObj) {
  let vote = AV.Object.createWithoutData('Votes', voteObj.id)
  if (voteObj.title) {
    vote.set('title', voteObj.title)
  }
  if (voteObj.cover) {
    vote.set('cover', voteObj.cover)
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
  return await vote.save()
}

/**
 * 创建或更新投票活动，当判断没有id时，创建一个新的投票，否则更新已有投票
 * @param request
 * @returns {*}
 */
export async function createOrUpdateVote(request) {
  let currentUser = request.currentUser
  if (!currentUser) {
    throw new AV.Cloud.Error('Permission denied, need to login first', {code: errno.EACCES});
  }
  let {id, title, cover, notice, rule, organizer, awards, gifts, startDate, expire, status} = request.params
  let voteObj = undefined
  let result = undefined
  if (!id) {
    voteObj = {
      user: currentUser,
      title,
      cover,
      notice,
      rule,
      organizer,
      awards,
      gifts,
      startDate,
      expire
    }
    result = await newVote(voteObj)
    return result
  }
  voteObj = {
    id,
    title,
    cover,
    notice,
    rule,
    organizer,
    awards,
    gifts,
    startDate,
    expire,
    status
  }
  result = await updateVote(voteObj)
  return result
}

/**
 * 获取投票活动的详情，包括礼品详情列表
 * @param voteId
 */
async function getVoteDetailById(voteId) {
  let query = new AV.Query('Votes')
  let leanVote = await query.get(voteId)
  let vote = constructVote(leanVote)
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
 * 根据id来获取投票的详情信息
 * @param request
 */
export async function fetchVoteById(request) {
  let {voteId} = request.params
  return await getVoteDetailById(voteId)
}

/**
 * 获取创建的投票列表
 * @param request
 * @returns {Array}
 */
export async function fetchVotes(request) {
  let currentUser = request.currentUser
  let {searchType, lastTime, limit} = request.params
  
  let query = new AV.Query('Votes')
  query.descending('createdAt')
  
  if (searchType === VOTE_SEARCH_TYPE.PERSONAL) {
    if (!currentUser) {
      throw new AV.Cloud.Error('Permission denied, need to login first', {code: errno.EACCES});
    }
    query.equalTo('creator', currentUser)
  }
  if (lastTime) {
    query.lessThan('createdAt', new Date(lastTime))
  }
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
  let vote = await getVoteDetailById(voteId)
  if (vote.gifts && Array.isArray(vote.gifts)) {
    return vote.gifts
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
  let vote = AV.Object.createWithoutData('Votes', voteId)
  vote.set('status', status)
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
 * 添加一个新的参赛选手
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