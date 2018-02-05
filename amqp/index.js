/**
 * Created by wanpeng on 2017/8/27.
 */
var Promise = require('bluebird')
var amqp = require('amqplib')
import {RABBITMQ_URL, NODE_ID} from '../config'
import {enterWithdrawQueue, createInnerWithdrawRequest} from '../cloud/pay'

export function amqpWithdrawEvent() {
  return amqp.connect(RABBITMQ_URL).then((conn) => {
    let chName = 'xjVote_withdraw'
    return conn.createChannel().then(function(ch) {
      //抽奖
      ch.assertExchange(chName, 'fanout', {durable: false}).then(() => {
        return ch.assertQueue('', {exclusive: true})
      }).then((qok) => {
        return ch.bindQueue(qok.queue, chName, '').then(function() {
          return qok.queue;
        });
      }).then((queue) => {
        return ch.consume(queue, handleWithdrawMessage, {noAck: false})
      }).then(() => {
        console.log(' [*] Waiting for withdraw message.')
      })
      
      function handleWithdrawMessage(msg) {
        var body = msg.content.toString()
        var message = JSON.parse(body)
        
        let withdrawId = message.withdrawId
        let userId = message.userId
        let openid = message.openid
        let amount = message.amount
        let channel = message.channel
        let dealType = message.dealType
        let nodeId = message.nodeId
        if (nodeId == NODE_ID) {
          console.log('recv withdraw message', message)
          createInnerWithdrawRequest(withdrawId, userId, openid, amount, channel, dealType).then(() => {
            ch.ack(msg)
          }).catch((err) => {
            enterWithdrawQueue(withdrawId, userId, openid, amount, channel)
            console.log("处理提现请求失败", err)
          })
        }
      }
    })
  }).catch(console.warn)
}