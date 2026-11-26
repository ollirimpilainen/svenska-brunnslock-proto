// Rahtisäännön testit: node tests/freight.test.js (ei riippuvuuksia)
// Lähde: service-design/rahtimalli.md kohta 3.2. Testit vertaavat proton SBCart.freightia
// erilliseen viitetoteutukseen (oracle), joka on kirjoitettu dokumentista, ei koodista.
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

// ---------- proton lataus ilman selainta ----------
const noop = () => {};
const el = { style: {}, setAttribute: noop, appendChild: noop, addEventListener: noop, classList: { add: noop, remove: noop, toggle: noop }, querySelector: () => null, querySelectorAll: () => [] };
const ctx = { console, setTimeout: () => 0, clearTimeout: noop, localStorage: { getItem: () => null, setItem: noop },
  location: { search: '', pathname: '/x', href: '' }, navigator: { userAgent: '' },
  document: Object.assign({}, el, { readyState: 'complete', documentElement: el, body: el, head: el, createElement: () => Object.assign({}, el), createDocumentFragment: () => Object.assign({}, el), getElementById: () => null }),
  addEventListener: noop, matchMedia: () => ({ matches: false, addEventListener: noop }), CustomEvent: function () {}, dispatchEvent: noop };
ctx.window = ctx; vm.createContext(ctx);
for (const f of ['catalog.js', 'support.js']) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); } catch (e) { /* sivun DOM-osat kaatuvat, rahtilogiikka on jo ladattu */ }
}
const freight = (lines) => ctx.SBCart.freight(lines, 'sv');

// ---------- esimerkkiarvot (rahtimalli.md 3.2), yksi paikka ----------
const V = { OMBUD_KG: 20, HOME_KG: 30, HEAVY_KG: 150, PALLET_KG: 1000, LARGE_PER: 10, MAX_PALLETS: 5,
  P: { ombud: 172, home: 590, heavy: 1240, general: 1480, plint: 2400, betong1000: 2080, betong1200: 2750 } };
const OWN = { TP200: { type: 'plint', per: 30 }, TP600: { type: 'plint', per: 20 }, KP: { type: 'plint', per: 8 }, KPplus: { type: 'plint', per: 4 },
  BL1000: { type: 'betong1000', per: 2 }, BL1200: { type: 'betong1200', per: 2 } };

// ---------- viitetoteutus dokumentista ----------
// line: { fr: 'ombud'|'skrym'|'pall'|'plint', kg, qty, own: {type, per} | null }
function oracle(lines) {
  const W = lines.reduce((s, l) => s + (l.kg || 0) * l.qty, 0);
  const smallOnly = lines.every(l => l.fr === 'ombud');
  const largeAll = lines.filter(l => l.fr === 'skrym').reduce((s, l) => s + l.qty, 0);
  const palletGoodsNoKg = lines.some(l => (l.fr === 'pall' || l.fr === 'plint') && l.kg == null) || largeAll > V.LARGE_PER; // yli 10 isoa: aina lava
  if (smallOnly && W <= V.OMBUD_KG) return { kind: 'ombud', price: V.P.ombud };                       // sääntö 2
  if (!palletGoodsNoKg && W <= V.HOME_KG) return { kind: 'home', price: V.P.home };                   // sääntö 3
  if (!palletGoodsNoKg && W <= V.HEAVY_KG) return { kind: 'heavy', price: V.P.heavy };                // sääntö 4
  const share = {}; let otherKg = 0, large = 0;                                                       // sääntö 5
  for (const l of lines) {
    if (l.own) share[l.own.type] = (share[l.own.type] || 0) + l.qty / l.own.per;
    else { otherKg += (l.kg || 0) * l.qty; if (l.fr === 'skrym') large += l.qty; }
  }
  const n = {}; for (const t in share) n[t] = Math.ceil(share[t] - 1e-9);
  const hasOwn = Object.keys(n).length > 0;
  const general = hasOwn
    ? Math.max(Math.ceil(Math.max(0, otherKg - V.PALLET_KG) / V.PALLET_KG), Math.ceil(Math.max(0, large - V.LARGE_PER) / V.LARGE_PER))
    : Math.max(1, Math.ceil(W / V.PALLET_KG), Math.ceil(large / V.LARGE_PER));
  if (general) n.general = (n.general || 0) + general;
  const pallets = Object.values(n).reduce((a, b) => a + b, 0);
  const price = Object.entries(n).reduce((s, [t, k]) => s + k * V.P[t], 0);
  if (pallets > V.MAX_PALLETS) return { kind: 'quote', price: null, pallets };                        // sääntö 6
  return { kind: 'pallet', price, pallets };
}
const KIND = { ombud: 'ombud', skrym: 'home', tung: 'heavy', pall: 'pallet', offert: 'quote' };
const toProto = (lines) => lines.map(l => ({ fr: l.fr, kg: l.kg, qty: l.qty, name: l.name || l.fr, pt: l.own ? l.own.type : (l.fr === 'pall' || l.fr === 'plint' ? 'general' : undefined), per: l.own ? l.own.per : 8 }));
function run(lines) { const r = freight(toProto(lines)); return { kind: KIND[r.key] || r.key, price: r.price == null ? null : r.price, pallets: r.pallets }; }

// ---------- pieni testikehys ----------
let pass = 0, fail = 0; const fails = [];
function check(name, cond, info) { if (cond) pass++; else { fail++; fails.push(name + (info ? ' :: ' + info : '')); } }
const L = (fr, kg, qty, own) => ({ fr, kg, qty, own: own || null });
const same = (a, b) => a.kind === b.kind && a.price === b.price && (a.pallets || 0) === (b.pallets || 0);
const show = (r) => `${r.kind} ${r.price == null ? 'tarjous' : r.price + ' kr'}${r.pallets ? ', ' + r.pallets + ' lavaa' : ''}`;

// 1 Dokumentin esimerkit (rahtimalli.md 3.2, taulukko "Esimerkit")
const EX = [
  ['1 Lätt 800 PE 5 kg', [L('ombud', 5, 1)], 'ombud 172'],
  ['3 Lätt 750 24 kg', [L('ombud', 8, 3)], 'home 590'],
  ['1 Composite 1050 10 kg', [L('skrym', 10, 1)], 'home 590'],
  ['1 valurautakansi 31 kg', [L('pall', 31, 1)], 'heavy 1240'],
  ['1 TP 600 67 kg', [L('plint', 67, 1, OWN.TP600)], 'heavy 1240'],
  ['3 TP 600 201 kg', [L('plint', 67, 3, OWN.TP600)], 'pallet 2400'],
  ['3 TP 600 + valurautakansi', [L('plint', 67, 3, OWN.TP600), L('pall', 31, 1)], 'pallet 2400'],
  ['20 Composite 1050 200 kg', [L('skrym', 10, 20)], 'pallet 2960'],
  ['57 Composite 1340 798 kg', [L('skrym', 14, 57)], 'quote null'],
  ['12 TP 600 + Composite 1050', [L('plint', 67, 12, OWN.TP600), L('skrym', 10, 1)], 'pallet 2400'],
  ['120 TP 600', [L('plint', 67, 120, OWN.TP600)], 'quote null'],
];
for (const [n, ls, exp] of EX) {
  const r = run(ls), o = oracle(ls);
  check('esimerkki: ' + n + ' = ' + exp, `${r.kind} ${r.price}` === exp, 'proto ' + show(r));
  check('esimerkki vs oracle: ' + n, same(r, o), 'proto ' + show(r) + ' / oracle ' + show(o));
}

// 2 Rajat: juuri rajalla ja hieman yli
const B = [
  ['pieni 20 kg', [L('ombud', 20, 1)], 'ombud'], ['pieni 20,1 kg', [L('ombud', 20.1, 1)], 'home'],
  ['kori 30 kg', [L('skrym', 15, 2)], 'home'], ['kori 30,1 kg', [L('skrym', 30.1, 1)], 'heavy'],
  ['kori 150 kg', [L('pall', 50, 3)], 'heavy'], ['kori 150,1 kg', [L('pall', 150.1, 1)], 'pallet'],
  ['10 isoa yleislavalla', [L('skrym', 16, 10)], 'pallet'], ['11 isoa', [L('skrym', 16, 11)], 'pallet'],
  ['yleislava 1 000 kg', [L('pall', 100, 10)], 'pallet'], ['yleislava 1 000,1 kg', [L('pall', 100.01, 10)], 'pallet'],
];
for (const [n, ls, k] of B) { const r = run(ls), o = oracle(ls); check('raja: ' + n + ' = ' + k, r.kind === k, show(r)); check('raja vs oracle: ' + n, same(r, o), show(r) + ' / ' + show(o)); }
check('raja: 10 isoa = 1 lava', run([L('skrym', 16, 10)]).pallets === 1);
check('raja: 11 isoa = 2 lavaa', run([L('skrym', 16, 11)]).pallets === 2);
check('raja: 1 000 kg = 1 lava', run([L('pall', 100, 10)]).pallets === 1);
check('raja: 1 000,1 kg = 2 lavaa', run([L('pall', 100.01, 10)]).pallets === 2);
for (const [nm, own, kg] of [['TP 200', OWN.TP200, 45], ['TP 600', OWN.TP600, 67], ['KP', OWN.KP, 144], ['KP+', OWN.KPplus, 360], ['Betonglock 1000', OWN.BL1000, 225], ['Betonglock 1200', OWN.BL1200, 300]]) {
  const fr = own.type === 'plint' ? 'plint' : 'pall';
  const atCap = run([L(fr, kg, own.per, own)]), over = run([L(fr, kg, own.per + 1, own)]);
  check(`kapasiteetti: ${own.per} ${nm} = 1 lava`, atCap.kind !== 'pallet' || atCap.pallets === 1, show(atCap));
  check(`kapasiteetti: ${own.per + 1} ${nm} = 2 lavaa`, over.pallets === 2, show(over));
}
// 5 ja 6 lavaa
check('5 lavaa on vielä hinnoiteltu', run([L('plint', 67, 100, OWN.TP600)]).kind === 'pallet');
check('6 lavaa menee tarjoukseen', run([L('plint', 67, 101, OWN.TP600)]).kind === 'quote');
// Plinttilavan mukana: 10 isoa ja 1 000 kg
check('plinttilava + 10 isoa = 1 lava', run([L('plint', 67, 3, OWN.TP600), L('skrym', 10, 10)]).pallets === 1);
check('plinttilava + 11 isoa = 2 lavaa', run([L('plint', 67, 3, OWN.TP600), L('skrym', 10, 11)]).pallets === 2);
check('plinttilava + 1 000 kg muuta = 1 lava', run([L('plint', 67, 3, OWN.TP600), L('pall', 100, 10)]).pallets === 1);
check('plinttilava + 1 001 kg muuta = 2 lavaa', run([L('plint', 67, 3, OWN.TP600), L('pall', 100.1, 10)]).pallets === 2);

// 3 Ominaisuudet satunnaiskoreilla (siemen, jotta tulokset toistuvat)
let seed = 20261126; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const POOL = [L('ombud', 1, 0), L('ombud', 5, 0), L('ombud', 8, 0), L('skrym', 10, 0), L('skrym', 14, 0), L('pall', 21, 0), L('pall', 31, 0), L('pall', 78, 0),
  L('plint', 45, 0, OWN.TP200), L('plint', 67, 0, OWN.TP600), L('plint', 144, 0, OWN.KP), L('plint', 360, 0, OWN.KPplus), L('pall', 225, 0, OWN.BL1000), L('pall', 300, 0, OWN.BL1200)];
const randCart = () => POOL.map(p => Object.assign({}, p, { qty: rnd() < 0.6 ? 0 : Math.floor(rnd() * (rnd() < 0.25 ? 80 : 6)) + 1 })).filter(l => l.qty > 0);
const priceOf = (r) => r.price == null ? Infinity : r.price;
let diffs = 0, mono = 0, oneOutcome = 0, largeOmbud = 0, palletGoodsOmbud = 0, N = 20000;
for (let i = 0; i < N; i++) {
  const c = randCart(); if (!c.length) continue;
  const r = run(c), o = oracle(c);
  if (!same(r, o)) { diffs++; if (diffs <= 5) fails.push('oracle-ero: ' + JSON.stringify(c.map(l => [l.fr, l.kg, l.qty, l.own && l.own.type])) + ' proto ' + show(r) + ' / oracle ' + show(o)); }
  if (!['ombud', 'home', 'heavy', 'pallet', 'quote'].includes(r.kind)) oneOutcome++;
  if (c.some(l => l.fr === 'skrym') && r.kind === 'ombud') largeOmbud++;
  if (c.some(l => l.fr === 'pall' || l.fr === 'plint') && r.kind === 'ombud') palletGoodsOmbud++;
  const j = Math.floor(rnd() * POOL.length), c2 = c.map(l => Object.assign({}, l)); const hit = c2.find(l => l.fr === POOL[j].fr && l.kg === POOL[j].kg);
  if (hit) hit.qty++; else c2.push(Object.assign({}, POOL[j], { qty: 1 }));
  if (priceOf(run(c2)) < priceOf(r)) { mono++; if (mono <= 3) fails.push('rahti laski lisäyksestä: ' + JSON.stringify(c2.map(l => [l.fr, l.kg, l.qty]))); }
}
check(`proto = oracle ${N} satunnaiskorilla`, diffs === 0, diffs + ' eroa');
check('tuotteen lisääminen ei laske rahtia', mono === 0, mono + ' tapausta');
check('jokaisella korilla yksi tunnettu tulos', oneOutcome === 0, oneOutcome + ' tapausta');
check('iso tuote ei koskaan noutopisteeseen', largeOmbud === 0, largeOmbud + ' tapausta');
check('lavatavara ei koskaan noutopisteeseen', palletGoodsOmbud === 0, palletGoodsOmbud + ' tapausta');

// 4 Puuttuva paino: dokumentin mukaan paino on pakollinen. Nämä kertovat, mitä proto tekee ilman sitä.
const noKg = [['pieni ilman painoa', [L('ombud', null, 3)]], ['iso ilman painoa', [L('skrym', null, 30)]], ['lavatavara ilman painoa', [L('pall', null, 1)]]];
const missingInfo = noKg.map(([n, ls]) => n + ': ' + show(run(ls)));

// 5 Katalogin tuotteet: yksi kappale ja isot määrät
const cat = ctx.SBCart.catalog, ids = Object.keys(cat).filter(k => cat[k].price != null);
let unitMismatch = 0, bigWrong = 0, noKgProducts = 0; const unitEx = [], bigEx = [];
for (const id of ids) {
  const c = cat[id]; if (c.kg == null) noKgProducts++;
  const one = freight([{ id, fr: c.fr, kg: c.kg, qty: 1, name: c.sv ? c.sv[0] : id }]);
  if (ctx.SBFreight && ctx.SBFreight.unit) {
    let txt = ''; try { txt = String(ctx.SBFreight.unit(Object.assign({ id }, c), 'sv', 'inkl')); } catch (e) { txt = 'ERR'; }
    const p = one.price == null ? null : Math.round(one.price).toLocaleString('sv-SE');
    if (p && txt.replace(/\s/g, ' ').indexOf(p.replace(/\s/g, ' ')) < 0) { unitMismatch++; if (unitEx.length < 5) unitEx.push(`${c.sv ? c.sv[0] : id}: kori ${p} kr, kortti "${txt}"`); }
  }
  if (c.fr === 'skrym') { const r = freight([{ id, fr: c.fr, kg: c.kg, qty: 57, name: id }]); if (!(r.price == null || (r.pallets || 0) >= 6)) { bigWrong++; if (bigEx.length < 5) bigEx.push('57 x ' + (c.sv ? c.sv[0] : id) + ' kg ' + c.kg + ': ' + r.label); } }
}
check('tuotekortin rahti = korin rahti yhdelle kappaleelle', unitMismatch === 0, unitMismatch + ' tuotetta: ' + unitEx.join(' | '));
check('57 isoa tuotetta vie aina vähintään 6 lavaa', bigWrong === 0, bigWrong + ' tuotetta: ' + bigEx.join(' | '));
check('11 isoa ilman painoa menee lavalle', run([L('skrym', null, 11)]).kind === 'pallet', show(run([L('skrym', null, 11)])));
check('11 kevyttä isoa (5 kg) menee lavalle', run([L('skrym', 5, 11)]).kind === 'pallet', show(run([L('skrym', 5, 11)])));

// ---------- raportti ----------
console.log(`\nRahtisäännön testit: ${pass} ok, ${fail} epäonnistui\n`);
for (const f of fails) console.log('  FAIL ' + f);
console.log('\nPuuttuva paino (ei läpäisy/hylkäys, vaan tieto):'); for (const m of missingInfo) console.log('  ' + m);
console.log(`  Katalogissa ${noKgProducts} / ${ids.length} hinnoiteltua tuotetta ilman painoa.`);
process.exitCode = fail ? 1 : 0;
