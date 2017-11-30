var AV = require('leanengine');
import * as userCloud from './cloud/user'
import * as voteCloud from './cloud/vote'
import * as payCloud from './cloud/pay'

/* 用户 */
AV.Cloud.define('userUpdateInfo', userCloud.updateUserInfo);

/* 投票 */
AV.Cloud.define('voteFetchGifts', voteCloud.fetchGifts);
AV.Cloud.define('votePresentGift', voteCloud.presentGift);
AV.Cloud.define('voteListPlayerGifts', voteCloud.listGiftsUnderPlayer);
AV.Cloud.define('voteCreateVote', voteCloud.createVote);
AV.Cloud.define('voteCreateOrUpdateVote', voteCloud.createOrUpdateVote);
AV.Cloud.define('voteFetchById', voteCloud.fetchVoteById);
AV.Cloud.define('voteFetchSet', voteCloud.fetchVotes);
AV.Cloud.define('voteIncVotePv', voteCloud.incVotePv);
AV.Cloud.define('voteFetchGiftsByVote', voteCloud.fetchGiftsByVote);
AV.Cloud.define('voteCreatePlayerApply', voteCloud.createPlayerApply);
AV.Cloud.define('voteFetchVotePlayers', voteCloud.fetchVotePlayers);
AV.Cloud.define('voteIncPlayerPv', voteCloud.incPlayerPv);
AV.Cloud.define('voteFetchRank', voteCloud.fetchVoteRank);
AV.Cloud.define('voteVoteForPlayer', voteCloud.voteForPlayer);
AV.Cloud.define('voteGetRuleTemplate', voteCloud.getRuleTemplate);

/* 支付 */
AV.Cloud.define('payCreatePaymentRequest', payCloud.createPaymentRequest)
AV.Cloud.define('payCreateWithdrawRequest', payCloud.createWithdrawRequest)
AV.Cloud.define('payHandlePaymentWebhootsEvent', payCloud.handlePaymentWebhootsEvent)
AV.Cloud.define('payHandleWithdrawWebhootsEvent', payCloud.handleWithdrawWebhootsEvent)