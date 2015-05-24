'use strict';

var Promise = require('bluebird');
var superagent = require('superagent');
var qs = require('qs');

exports = module.exports = promisingagent;
exports.Promise = Promise;
exports.superagent = superagent;
var Request = promisingagent.Request = superagent.Request;
exports.querySerializer = qs.stringify;
exports.bodySerializer = superagent.serialize;

Request.prototype.end = (function(origEnd) {
    return function (fn) {
        var self = this;
        this.promise = this.promise || exports.Promise.fromNode(function (callback) {
            origEnd.call(self, callback);
        });
        if (typeof fn === 'function') {
            this.promise.nodeify(fn);
        }
        return this.promise;
    };
}(Request.prototype.end));

// delegate promise methods so you can do something like promisingagent(url).then(...)
// also delegate some handy utility methods from bluebird
'then spread catch caught finnaly lastly bind tap call get return throw reflect'.split(' ').forEach(function (m) {
    Request.prototype[m] = function () {
        var promise = this.promise || this.end();
        return promise[m].apply(promise, arguments);
    }
});

function promisingagent(methodOrUrl, urlOrOpts, opts) {
    var method, url, query;
    if (typeof urlOrOpts === 'string') {
        method = methodOrUrl;
        url = urlOrOpts;
    } else {
        url = methodOrUrl;
        opts = urlOrOpts;
    }
    opts = opts || {};
    method = (method||opts.method||'').toUpperCase() || 'GET';
    if (opts.query) {
        console.log(opts.query);
        query = exports.querySerializer(opts.query);
        url += ~url.indexOf('?')
            ? '&' + query
            : '?' + query;
    }
    console.log('url', url);
    var request = new Request(method, url);
    if (method !== 'GET' && method !== 'HEAD') {
        request.type(opts.type || 'form');
    }
    if (opts.body) {
        request.send(opts.body);
    }
    return request;
}
