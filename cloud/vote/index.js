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

export async function fetchGifts(request) {
  let retAwards = []
  let query = new AV.Query('Awards')
  query.ascending('price')
  let result = await query.find()
  for (let award of result) {
    retAwards.push(constructGift(award))
  }
  return retAwards
}