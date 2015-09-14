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
].map(function (method) {
    return method.toUpperCase();
});

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
    for (var i = 0; i < args.length;) {
        if (typeof args[i] === 'string') {
            var part = args.splice(i, 1)[0]
            if (!method && methods.indexOf(part) > -1) {
                method = part;
            } else {
                strs.push(part);
            }
        } else {
            i += 1;
        }
    }
    url = strs.join('');
    var opts = extend.apply(null, [true, method ? {method: method} : {}].concat(args));
    method = (opts.method||'').toUpperCase() || 'GET';
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
            var v = opts.headers[key];
            if (typeof v === 'function') {
                v = v.call(request);
            }
            if (typeof v === 'string') {
                request.set(key.toLowerCase(), v);
            }
        });
    }
    return request;
}

function addMethods(fn) {
    methods.forEach(function (method) {
        var ml = method.toLowerCase();
        fn[method] = fn[ml] = fn.bind(null, method);
        if (method === 'DELETE') {
            fn.del = fn.DEL = fn['delete'];
        }
    });
}
addMethods(promisingagent);

promisingagent.extend = function extend () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(null);
    var fn = this.bind.apply(this, args);
    addMethods(fn);
    fn.extend = promisingagent.extend;
    return fn;
};
