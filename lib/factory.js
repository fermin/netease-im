/**
 * Created by henryleu on 9/6/16.
 */
var assert = require('assert');
var newApiRequest = require('./impl');

var generateApiFunc = function(api){
    return function(form, callback) {
        var req = newApiRequest(api.endpoint, api.name, this._o);
        return req(form, callback);
    };
};

module.exports = function(sdkConstructor, apiList){
    assert(sdkConstructor instanceof Function, 'sdk constructor should be a function');
    assert(Array.isArray(apiList), 'apiList should be an array ');

    var len = apiList.length;
    var i = 0;
    var api = null;
    for(; i<len; i++){
        api = apiList[i];
        sdkConstructor.prototype[api.name] = generateApiFunc(api);
    }
};