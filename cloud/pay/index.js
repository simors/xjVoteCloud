/**
 * Created by wanpeng on 2017/11/30.
 */
import AV from 'leancloud-storage'
import * as errno from '../errno'
import mathjs from 'mathjs'
import Pingpp from 'pingpp'
import uuidv4 from 'uuid'
import Promise from 'bluebird'

var pingpp = Pingpp(process.env.PINGPP_API_KEY)

export async function createPaymentRequest(request) {
  const {currentUser, meta} = request
  if (!currentUser) {
    throw new AV.Cloud.Error('Permission denied, need to login first', {code: errno.EACCES})
  }
  const remoteAddress = meta.remoteAddress
  const {amount, channel, metadata, openid, subject} = request.params
  pingpp.setPrivateKeyPath(__dirname + "/rsa_private_key.pem")

  try {
    const charges = await new Promise((resolve, reject) => {
      const order_no = uuidv4().replace(/-/g, '').substr(0, 16)
      pingpp.charges.create({
        order_no: order_no,
        app: {id: process.env.PINGPP_APP_ID},
        channel: channel,
        amount: amount,
        client_ip: remoteAddress,
        currency: "cny",
        subject: subject,
        body: "商品的描述信息",
        extra: {
          open_id: openid
        },
        description: "",
        metadata: metadata,
      }, function (err, charge) {
        if (err != null) {
          reject(new AV.Cloud.Error('request charges error' + err.message, {code: errno.ERROR_CREATE_CHARGES}))
        }
        resolve(charge)
      })
    })
    return charges
  } catch (e) {
    throw e
  }
}

export async function createWithdrawRequest(request) {
  const {currentUser} = request
  if (!currentUser) {
    throw new AV.Cloud.Error('Permission denied, need to login first', {code: errno.EACCES})
  }

  const {amount, channel, metadata, openid} = request.params
  pingpp.setPrivateKeyPath(__dirname + "/rsa_private_key.pem")

  try {
    let transfer = await new Promise((resolve, reject) => {
      const order_no = uuidv4().replace(/-/g, '').substr(0, 16)
      pingpp.transfers.create({
        order_no: order_no,
        app: {id: process.env.PINGPP_APP_ID},
        channel: channel,
        amount: amount,
        currency: "cny",
        type: "b2c",
        recipient: openid, //微信openId
        extra: {
          // user_name: username,
          // force_check: true,
        },
        description: "测试" ,
        metadata: metadata,
      }, function (err, transfer) {
        if (err != null ) {
          console.error(err)
          reject(new AV.Cloud.Error('request transfer error' + err.message, {code: errno.ERROR_CREATE_TRANSFER}))
        }
        resolve(transfer)
      })
    })
    return transfer
  } catch (e) {
    throw e
  }
}

export async function handlePaymentWebhootsEvent(request) {
  const {} = request.params

}

export async function handleWithdrawWebhootsEvent(request) {
  const {} = request.params

}