// Viime vuoden tilaukset uuden rahtisäännön läpi: node tests/replay-orders.js
// Data: data/rahti-korit-12kk.txt, rivi "tilauksia|tapa:rahti_alv0;wooId*kpl+..." (vain tuotteet, määrät ja rahti, ei henkilötietoja).
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const noop = () => {}; const el = { style: {}, setAttribute: noop, appendChild: noop, addEventListener: noop, classList: { add: noop, remove: noop, toggle: noop }, querySelector: () => null, querySelectorAll: () => [] };
const ctx = { console, setTimeout: () => 0, clearTimeout: noop, localStorage: { getItem: () => null, setItem: noop }, location: { search: '', pathname: '/x', href: '' }, navigator: { userAgent: '' },
  document: Object.assign({}, el, { readyState: 'complete', documentElement: el, body: el, head: el, createElement: () => Object.assign({}, el), createDocumentFragment: () => Object.assign({}, el), getElementById: () => null }),
  addEventListener: noop, matchMedia: () => ({ matches: false, addEventListener: noop }), CustomEvent: function () {}, dispatchEvent: noop };
ctx.window = ctx; vm.createContext(ctx);
for (const f of ['catalog.js', 'support.js']) { try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx); } catch (e) {} }
const cat = ctx.SBCart.catalog;
const src = fs.readFileSync(path.join(ROOT, '..', 'data', 'rahti-korit-12kk.txt'), 'utf8').trim().split(/\s+/);
const kinds = {}, flags = []; let orders = 0, skipped = 0, paidOld = 0, paidNew = 0, missingKg = 0;
for (const tok of src) {
  const [n, rest] = tok.split('|'); const [m, items] = rest.split(';'); const ship = Math.round(parseFloat(m.split(':')[1]) * 1.25);
  const lines = []; let ok = true;
  for (const it of items.split('+')) { const [id, q] = it.split('*'); const c = cat['w' + id]; if (!c) { ok = false; break; } if (c.price == null) { ok = false; break; } if (c.kg == null) missingKg += +n; lines.push({ id: 'w' + id, fr: c.fr, kg: c.kg, qty: +q, name: c.sv ? c.sv[0] : id }); }
  if (!ok || !ship) { skipped += +n; continue; }
  const r = ctx.SBCart.freight(lines, 'sv'); const k = r.key; kinds[k] = (kinds[k] || 0) + +n; orders += +n;
  paidOld += ship * n; paidNew += (r.price == null ? ship : r.price) * n;
  const W = lines.reduce((s, l) => s + (l.kg || 0) * l.qty, 0);
  if (r.price == null || (r.price && r.price > 3 * ship) || (r.price && r.price < ship / 3)) flags.push(`${n} tilaus: ${lines.map(l => l.qty + ' x ' + l.name).join(', ')} (${Math.round(W)} kg) nyt ${ship} kr, uusi ${r.price == null ? 'tarjous' : r.price + ' kr'} ${r.label || ''}`);
}
console.log(`Tilauksia ${orders} (ohitettu ${skipped}: tarjoustuote, poistettu tuote tai 0 kr rahti). Tilauksia, joissa tuotteelta puuttuu paino: ${missingKg}.`);
console.log('Toimitustavat uudella säännöllä:', JSON.stringify(kinds));
console.log(`Rahti yhteensä: nyt ${paidOld.toLocaleString('sv-SE')} kr, uusi ${paidNew.toLocaleString('sv-SE')} kr (tarjoukseen menevät laskettu nykyhinnalla).`);
console.log(`\nTarkistettavat (uusi yli 3 x tai alle 1/3 nykyisestä, tai tarjous): ${flags.length}`);
for (const f of flags.slice(0, 40)) console.log('  ' + f);
