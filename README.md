# promisingagent

superagent wrapped with bluebird, inspired by the new fetch api

browser compatibility: IE8+, test coverage: 100%

## install

```bash
npm i --save promisingagent
# or maybe
npm i --save promisingagent bluebird qs
```

## usage

`promisingagent(method, url, opts)` or `promisingagent(url, opts)` with a method property in opts (default to 'GET'), it return you a superagent request object whose `.end()` method return a promise.

```js
var promisingagent = require('promisingagent');
var request = promisingagent('POST', '/hello', {
    type: 'json', // defaults to 'form'
    query: {arr: [1, 2, 3]},
    body: {arr: [4, 5, 6]},
})
var responsePromise = request.end(); // this will send
// '{"arr":[4,5,6]}' to /hello?arr%5B0%5D=1&arr%5B1%5D=2&arr%5B2%5D=3
// you can alter default serializer for query and body as
var qs = require('qs');
function serializer(query) {
    return qs.stringify(query, {arrayFormat: 'repeat'});
}
promisingagent.bodySerializer['application/x-www-form-urlencoded'] = serializer;
promisingagent.querySerializer = serializer;
// then
promisingagent('POST', '/hello', {
    query: {arr: [1, 2, 3]},
    body: {arr: [4, 5, 6]},
}).end(); // will send 'arr=1&arr=2&arr=3' to /hello?arr=4&arr=5&arr=6
```
You can pass request object directly to promise customer or call it's `.then()` method directly, in this way the request object is like a lazy evaluated promise, `request.then(...)` will trigger it to start requesting.

Some utility methods from bluebird were included, they are `then spread catch caught finnaly lastly bind tap call get return throw reflect`, so you can just `request('/some/get/method/api').get('body')`. refer [Bluebird API](https://github.com/petkaantonov/bluebird/blob/master/API.md#getstring-propertynameint-index---promise)

note that in 2.0 promisingagent do not treat non-2xx response as error, behaves like using superagent@<1.0

## license
MIT
