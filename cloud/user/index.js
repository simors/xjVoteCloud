/**
 * Created by yangyang on 2017/11/14.
 */
import AV from 'leanengine'

export async function updateUserInfo(request) {
  let {nickname, gender, avatar, province, city} = request.params
  let currentUser = request.currentUser
  if (!currentUser) {
    throw new AV.Cloud.Error('Permission denied, need to login first', {code: 100});
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
  return await currentUser.save()
}