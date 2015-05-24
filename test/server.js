'use strict';
var http = require('http');
var concat = require('concat-stream');
module.exports = http.createServer(function (req, res) {
    req.url = req.url.replace(/\/+/g, '/');
    req.pipe(concat(function (buf) {
        var body = buf.toString();
        res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
        res.end(JSON.stringify({
            headers: req.headers,
            method: req.method,
            url: req.url,
            body: body,
        }));
    }));
});
