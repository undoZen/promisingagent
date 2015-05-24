'use strict';
var tape = require('tape');
var server = require('../server');
var address = server.listen().address();

var addHost = function (url) {
    return 'http://localhost:' + address.port + url;
};

require('./common')(addHost);

tape('close server', function (test) {
    test.plan(1);
    server.close(function () {
        test.ok(true);
    });
});
