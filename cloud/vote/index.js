/**
 * Created by yangyang on 2017/11/24.
 */
import AV from 'leanengine'
import * as errno from '../errno'

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
  return await vote.save()
}