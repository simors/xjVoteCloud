var AV = require('leanengine');
import * as userCloud from './cloud/user'
import * as voteCloud from './cloud/vote'

/* 用户 */
AV.Cloud.define('userUpdateInfo', userCloud.updateUserInfo);

/* 投票 */
AV.Cloud.define('voteFetchGifts', voteCloud.fetchGifts);
AV.Cloud.define('voteCreateVote', voteCloud.createVote);
AV.Cloud.define('voteCreateOrUpdateVote', voteCloud.createOrUpdateVote);