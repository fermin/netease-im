/**
 * Created by henryleu on 9/6/16.
 */
var request = require('request');
var nimCodes = require('./codes');
var utils = require('./utils');

var rq = require('request-promise-native');

var INFRASTRUCTURE_ERROR = {
    code: 190, desc: '[云信API基础设施错误] - '
};

var PARSE_ERROR = {
    code: 191, desc: '[云信API响应解析错误] - '
};

var getHeaders = function(appsecret, appkey){
    var nonce = utils.genNonce(64);
    var curtime = Math.floor(new Date().getTime()/1000);
    var checksum = utils.genChecksum(appsecret + nonce + curtime);
    return {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'AppKey': appkey,
        Nonce: nonce,
        CurTime: curtime,
        CheckSum: checksum
    };
};

var postProcessResponse = function(err, body){
    var result = null;

    if(err){
        result = { code: INFRASTRUCTURE_ERROR.code,  desc: INFRASTRUCTURE_ERROR.desc + err };
    }
    else{
        try{
            result = JSON.parse(body);
            if(result.code!=200){
                var errmsg = nimCodes[''+result.code];
                errmsg && (result.desc = '[' + errmsg + '] - ' + result.desc);
            }
        }
        catch(e){
            result = { code: PARSE_ERROR.code, desc: PARSE_ERROR.desc + e };
        }
    }

    return result;
};

module.exports = function(url, name, options){
    var logger      = options.logger;
    var appsecret   = options.appsecret;
    var appkey      = options.appkey;

    return function (form, callback) {
        var headers = getHeaders(appsecret, appkey);

        var logForm = Object.assign({}, form);
        if (/upload|Upload/.test(url)) logForm.content = '<data>';
        logger.debug(name + ' -  input - ' + JSON.stringify(logForm));

        var options = {
            method: 'POST',
            url: url,
            form: form,
            headers: headers
        }

        var result = null;
        return new Promise((resolve, reject) => {
            rq(options).then((body) => {
                try {
                    result = JSON.parse(body);
                    if(result.code!=200){
                        var errmsg = nimCodes[''+result.code];
                        errmsg && (result.desc = '[' + errmsg + '] - ' + result.desc);
                    }
                } catch(err) {
                    result = { code: PARSE_ERROR.code, desc: PARSE_ERROR.desc + err };
                }
            }).catch((err) => {
                result = { code: INFRASTRUCTURE_ERROR.code,  desc: INFRASTRUCTURE_ERROR.desc + err };
            }).finally(() => {
                if(result.code == INFRASTRUCTURE_ERROR.code || result.code == PARSE_ERROR.code){
                    logger.error(name + ' - output - ' + JSON.stringify(result));
                } else {
                    logger.debug(name + ' - output - ' + JSON.stringify(result));
                }

                if (callback) callback(null, result);

                resolve(result);
            })
        });
    }
};
