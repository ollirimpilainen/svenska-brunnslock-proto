// Ajaa kategoriasivun (SvSortiment.dc.html) oman listauslogiikan Nodessa ilman selainta.
// listing(state, lang) -> renderVals()-tulos. Käyttö testeissä: tests/listing.test.js
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
function load(page) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const m = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/);
  const ctx = { console, URLSearchParams, location: { search: '' }, history: { replaceState() {} } };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ['catalog.js', 'category-texts.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
  vm.runInContext('class DCLogic { constructor(p) { this.props = p; this.state = {}; } setState(p) { Object.assign(this.state, p); } }\n' + m[1] + '\nthis.Component = Component;', ctx);
  return ctx;
}
const cache = {};
function listing(state, page) {
  const ctx = cache[page || 'SvSortiment.dc.html'] = cache[page || 'SvSortiment.dc.html'] || load(page || 'SvSortiment.dc.html');
  const c = new ctx.Component({});
  Object.assign(c.state, { f: {}, other: {}, q: '', limit: 999 }, state);
  return c.renderVals();
}
module.exports = { listing };
