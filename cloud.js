var AV = require('leanengine');
import * as userCloud from './cloud/user'
import * as voteCloud from './cloud/vote'
import * as payCloud from './cloud/pay'
import * as weappCloud from './cloud/weapp'
import mpJsSdkFuncs from './wechat/JSSDK'

/* 用户 */
AV.Cloud.define('userUpdateInfo', userCloud.updateUserInfo);
AV.Cloud.define('userFetchUserInfo', userCloud.reqUserInfo);

/* 投票 */
AV.Cloud.define('voteFetchGifts', voteCloud.fetchGifts);
AV.Cloud.define('votePresentGift', voteCloud.presentGift);
AV.Cloud.define('voteListPlayerGifts', voteCloud.listGiftsUnderPlayer);
AV.Cloud.define('voteCreateVote', voteCloud.createVote);
AV.Cloud.define('voteEnablePlayerApply', voteCloud.enablePlayerApply);
AV.Cloud.define('voteCreateOrUpdateVote', voteCloud.createOrUpdateVote);
AV.Cloud.define('voteCreateOrUpdateVoteMP', voteCloud.createOrUpdateVoteMP);
AV.Cloud.define('voteFetchById', voteCloud.fetchVoteById);
AV.Cloud.define('voteFetchSet', voteCloud.fetchVotes);
AV.Cloud.define('voteIncVotePv', voteCloud.incVotePv);
AV.Cloud.define('voteSetVoteDisable', voteCloud.setVoteDisable);
AV.Cloud.define('voteFetchGiftsByVote', voteCloud.fetchGiftsByVote);
AV.Cloud.define('voteCreatePlayerApply', voteCloud.createPlayerApply);
AV.Cloud.define('voteCreatePlayerApplyMP', voteCloud.createPlayerApplyMP);
AV.Cloud.define('voteFetchVotePlayers', voteCloud.fetchVotePlayers);
AV.Cloud.define('voteFetchPlayerById', voteCloud.getPlayerById);
AV.Cloud.define('voteSetPlayerDisable', voteCloud.setPlayerDisable);
AV.Cloud.define('voteSearchPlayer', voteCloud.searchPlayer);
AV.Cloud.define('voteIncPlayerPv', voteCloud.incPlayerPv);
AV.Cloud.define('voteFetchRank', voteCloud.fetchVoteRank);
AV.Cloud.define('voteVoteForPlayer', voteCloud.voteForPlayer);
AV.Cloud.define('voteIsVoteAllowed', voteCloud.reqIsVoteAllowed);
AV.Cloud.define('voteGetRuleTemplate', voteCloud.getRuleTemplate);
AV.Cloud.define('voteRunProfitAccount', voteCloud.runVoteProfitAccount);
AV.Cloud.define('voteGetCreatePwd', voteCloud.getCreateVotePassword);
AV.Cloud.define('voteTestAddContribution', voteCloud.testAddContribution);


/* 支付 */
AV.Cloud.define('payCreatePaymentRequest', payCloud.createPaymentRequest)
AV.Cloud.define('payCreateWithdrawRequest', payCloud.createWithdrawRequest)
AV.Cloud.define('payHandlePaymentWebhootsEvent', payCloud.handlePaymentWebhootsEvent)
AV.Cloud.define('payHandleWithdrawWebhootsEvent', payCloud.handleWithdrawWebhootsEvent)
AV.Cloud.define('payCreateWithdrawApply', payCloud.createWithdrawApply)
AV.Cloud.define('payFetchUserLastWithdrawApply', payCloud.getUserLastWithdrawApply)
AV.Cloud.define('payFetchWithdrawRecords', payCloud.fetchWithdrawRecords)
AV.Cloud.define('payFuncTest', payCloud.payFuncTest)
AV.Cloud.define('payGetWalletInfo', payCloud.reqWalletInfo)
AV.Cloud.define('payWithWalletBalance', payCloud.payWithWalletBalance)
AV.Cloud.define('payFetchUserDealRecords', payCloud.fetchUserDealRecords)
AV.Cloud.define('payGetAgentPrice', payCloud.getAgentPrice)
AV.Cloud.define('payEnableAgentPay', payCloud.enableAgentPay)

/* 微信小程序 */
AV.Cloud.define('weappGetAuthData', weappCloud.getWeappAuthData)

/* 微信js-sdk */
AV.Cloud.define('wechatGetJsSdkConfig', mpJsSdkFuncs.getJsConfig)
