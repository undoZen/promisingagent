'use strict';
var http = require('http');
var fs = require('fs');
var concat = require('concat-stream');
module.exports = http.createServer(function (req, res) {
    req.url = req.url.replace(/\/+/g, '/');
    var fstream;
    if (req.url === '/') {
        fstream = fs.createReadStream(__dirname + '/browser/index.html');
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    } else if (req.url === '/test.js' || req.url === '/es5shimsham.js') {
        fstream = fs.createReadStream(__dirname + '/browser' + req.url);
        res.writeHead(200, {'Content-Type': 'application/javascript; charset=utf-8'});
    }
    if (fstream) {
        fstream.pipe(res);
        return;
    }
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
