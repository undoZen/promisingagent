'use strict';
var tape = require('tape');
var promisingagent = require('../../');
var Promise = require('bluebird');
var qs = require('qs');
var isBrowser = require('is-browser');
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
    tape('concat url parts', function (test) {
        test.plan(4);
        var request = promisingagent(addHost(''), '/hello', '/world').end();
        test.ok(request instanceof Promise);
        request
        .then(function (response) {
            test.ok(response.status && response.body);
            test.equal(response.body.method, 'GET');
            test.equal(response.body.url, '/hello/world');
        });
    });
    tape('post concat url parts', function (test) {
        test.plan(5);
        var request = promisingagent('POST', addHost(''), '/hello',
            {
                query: {hello: 'world'},
            },
            '/world',
            {
                body: {foo: 'bar'},
            }).end();
        test.ok(request instanceof Promise);
        request
        .then(function (response) {
            test.ok(response.status && response.body);
            test.equal(response.body.method, 'POST');
            test.equal(response.body.url, '/hello/world?hello=world');
            test.equal(response.body.body, 'foo=bar');
        });
    });

    tape('post concat url parts', function (test) {
        test.plan(5);
        var request = promisingagent(addHost(''), 'POST', '/hello',
            {
                query: {hello: 'world'},
            },
            '/world',
            {
                body: {foo: 'bar'},
            }).end();
        test.ok(request instanceof Promise);
        request
        .then(function (response) {
            test.ok(response.status && response.body);
            test.equal(response.body.method, 'POST');
            test.equal(response.body.url, '/hello/world?hello=world');
            test.equal(response.body.body, 'foo=bar');
        });
    });

    tape('do not reject non-2xx response', function (test) {
        test.plan(4);
        var request = promisingagent(addHost('/404')).end();
        test.ok(request instanceof Promise);
        request
        .then(function (response) {
            test.ok(response.status && response.body);
            test.equal(response.body.method, 'GET');
            test.equal(response.body.url, '/404');
        });
    });

    tape('reject connection error', function (test) {
        test.plan(isBrowser ? 3 : 4);
        var request = promisingagent('http://0.0.0.0/connection-error').end();
        test.ok(request instanceof Promise);
        request
        .then(function (response) {
            throw new Error('this line should not be reached', response);
        }, function (err) {
            test.ok(!err.response);
            test.ok(err instanceof Error);
            if (!isBrowser) {
                test.equal(err.code, 'ECONNREFUSED');
            }
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

    tape('request.post() alias request("POST", ...)', function (test) {
        test.plan(4);
        var request = promisingagent.post(addHost('/post'), {
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

    tape('simple change headers and set url in opts', function (test) {
        test.plan(6);
        var request = promisingagent.post({
            url: addHost('/post'),
            headers: {
                'x-custom': '1',
                'x-custom-header': 'a',
            },
            query: {
                name: 'uz',
                arr: [1,2,3],
            },
            body: {
                hello: 'world',
                arr: [4,5,6],
            },
        }, {
            headers: {
                'x-custom-header': 'b',
            },
        }).end();
        request
        .then(function (response) {
            test.ok(response.status && response.body);
            test.equal(response.body.method, 'POST');
            test.equal(response.body.headers['x-custom'], '1');
            test.equal(response.body.headers['x-custom-header'], 'b');
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
