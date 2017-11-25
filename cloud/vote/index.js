/**
 * Created by yangyang on 2017/11/24.
 */
import AV from 'leanengine'
import * as errno from '../errno'

const VOTE_STATUS = {
  EDITING: 1,     // 正在编辑
  PAYING: 2,      // 待支付
  WAITING: 3,     // 未开始
  STARTING: 4,    // 正在进行
  DONE: 5,        // 已结束
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