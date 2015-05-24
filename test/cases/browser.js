'use strict';
require('tap-browser-color')();

var addHost = function (url) {
    return url;
};

require('./common')(addHost);
