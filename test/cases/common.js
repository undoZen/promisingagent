'use strict';
var tape = require('tape');
var promisingagent = require('../../');
var Promise = require('bluebird');
var qs = require('qs');
function serializer(query) {
    return qs.stringify(query, {arrayFormat: 'repeat'});
}

module.exports = function (addHost) {
    tape('simple get', function (test) {
        test.plan(4);
        var request = promisingagent(addHost('/hello')).end();
        test.ok(request instanceof Promise);
        request
        .then(function (response) {
            test.ok(response.status && response.body);
            test.equal(response.body.method, 'GET');
            test.equal(response.body.url, '/hello');
        });
    });

    tape('compatible with node style callback', function (test) {
        test.plan(4);
        promisingagent(addHost('/hello')).end(function (err, response) {
            test.ok(!err);
            test.ok(response.status && response.body);
            test.equal(response.body.method, 'GET');
            test.equal(response.body.url, '/hello');
        });
    });

    tape('end() called multiple times', function (test) {
        test.plan(7);
        var request = promisingagent(addHost('/hello'))
        var request1 = request.end();
        var request2 = request.end();
        test.ok(request1 instanceof Promise);
        test.ok(request2 instanceof Promise);
        test.strictEqual(request1, request2);
        request.end(function (err, response) {
            test.ok(!err);
            test.ok(response.status && response.body);
            test.equal(response.body.method, 'GET');
            test.equal(response.body.url, '/hello');
        });
    });

    tape('handy helpers', function (test) {
        test.plan(3);
        promisingagent(addHost('/hello'))
        .then(function (response) {
            test.equal(response.body.url, '/hello');
            return promisingagent(addHost(response.body.url));
        })
        .then(function (response) {
            test.equal(response.body.url, '/hello');
            return promisingagent(addHost(response.body.url)).get('body').get('url');
        })
        .then(function (url) {
            test.equal(url, '/hello');
        });
    });

    tape('simple post with query & body', function (test) {
        test.plan(4);
        var request = promisingagent('POST', addHost('/post'), {
            query: {
                name: 'uz',
                arr: [1,2,3],
            },
            body: {
                hello: 'world',
                arr: [4,5,6],
            },
        }).end();
        request
        .then(function (response) {
            test.ok(response.status && response.body);
            test.equal(response.body.method, 'POST');
            test.equal(response.body.url, '/post?name=uz&arr%5B0%5D=1&arr%5B1%5D=2&arr%5B2%5D=3');
            test.equal(response.body.body, 'hello=world&arr%5B0%5D=4&arr%5B1%5D=5&arr%5B2%5D=6');
        });
    });

    tape('set method in opts and change default serializer', function (test) {
        test.plan(4);
        promisingagent.bodySerializer['application/x-www-form-urlencoded'] = serializer;
        promisingagent.querySerializer = serializer;
        var request = promisingagent(addHost('/post?a=b'), {
            method: 'POST',
            query: {
                name: 'uz',
                arr: [1,2,3],
            },
            body: {
                hello: 'world',
                arr: [4,5,6],
            },
        }).end();
        request
        .then(function (response) {
            test.ok(response.status && response.body);
            test.equal(response.body.method, 'POST');
            test.equal(response.body.url, '/post?a=b&name=uz&arr=1&arr=2&arr=3');
            test.equal(response.body.body, 'hello=world&arr=4&arr=5&arr=6');
        });
    });

}
