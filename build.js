'use strict';
const fs = require('fs')
const browserify = require('browserify')
const b = browserify()
b.external('bluebird')
b.external('extend')
b.plugin('browserify-derequire')
b.add('./index.js')
b.bundle(function(err, src) {
  const bundle = src.toString()
  fs.writeFileSync(
    './browser.js',
    bundle
      .replace("_dereq_('bluebird')", "require('bluebird')")
      .replace("_dereq_('qs')", "require('qs')"),
    'utf-8'
  )
})
