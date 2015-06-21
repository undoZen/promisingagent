'use strict';

var Promise = require('bluebird');
var superagent = require('superagent');
var qs = require('qs');
var extend = require('extend');
var methods = [
    "checkout",
    "connect",
    "copy",
    "delete",
    "get",
    "head",
    "lock",
    "m-search",
    "merge",
    "mkactivity",
    "mkcol",
    "move",
    "notify",
    "options",
    "patch",
    "post",
    "propfind",
    "proppatch",
    "purge",
    "put",
    "report",
    "search",
    "subscribe",
    "trace",
    "unlock",
    "unsubscribe"
];

exports = module.exports = promisingagent;
exports.Promise = Promise;
exports.superagent = superagent;
var Request = promisingagent.Request = superagent.Request;
exports.querySerializer = qs.stringify;
var serialize = exports.bodySerializer = superagent.serialize;
serialize['application/x-www-form-urlencoded'] = qs.stringify;

Request.prototype.end = (function(origEnd) {
    return function (fn) {
        var self = this;
        this.promise = this.promise || new Promise(function (resolve, reject) {
            origEnd.call(self, function (err, response) {
                if (err && !err.status) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
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

function promisingagent() {
    var method, url, query;
    var args = Array.prototype.slice.call(arguments);
    var strs = [];
    for (var i = args.length - 1; i >= 0; i--) {
        if (typeof args[i] === 'string') {
            strs = strs.concat(args.splice(i, 1));
        }
    }
    strs.reverse();
    if (strs.length >= 2) {
        method = strs[0];
        url = strs[1];
    } else if (strs[0]) {
        if (methods.indexOf(strs[0].toLowerCase()) > -1) {
            method = strs[0];
        } else {
            url = strs[0];
        }
    }
    var opts = extend.apply(null, [true, {}].concat(args));
    method = (method||opts.method||'').toUpperCase() || 'GET';
    url = url || opts.url;
    if (opts.query) {
        query = exports.querySerializer(opts.query);
        url += ~url.indexOf('?')
            ? '&' + query
            : '?' + query;
    }
    var request = new Request(method, url);
    if (method !== 'GET' && method !== 'HEAD') {
        request.type(opts.type || 'form');
    }
    if (opts.body) {
        request.send(opts.body);
    }
    if (opts.headers) {
        Object.keys(opts.headers).forEach(function (key) {
            request.set(key.toLowerCase(), opts.headers[key]);
        });
        request.send(opts.body);
    }
    return request;
}

methods.forEach(function (method) {
    var mu = method.toUpperCase();
    exports[method] = exports[mu] = promisingagent.bind(null, mu);
    if (method === 'delete') {
        exports.del = exports.DEL = exports['delete'];
    }
});
