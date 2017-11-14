var AV = require('leanengine');
import * as userCloud from './cloud/user'

/**
 * 一个简单的云代码方法
 */
AV.Cloud.define('userUpdateInfo', userCloud.updateUserInfo);
