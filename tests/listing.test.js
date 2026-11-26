// Kategoriasivun suodatinmäärien testit: node tests/listing.test.js (ei riippuvuuksia)
// Sääntö (facettihaku): suodattimen sisällä TAI, suodattimien välillä JA. Arvon määrä = tuoteperheet, jotka täyttävät
// MUIDEN suodattimien valinnat ja joilla on tämä arvo. Määrä 0 = ei valittavissa (paitsi jos valittu). Arvojen järjestys ei muutu.
// Listan määrä, mobiilin "Visa N" ja tuoteapurin paneelin määrä = lista. Testit vertaavat sivun logiikkaa erilliseen viitetoteutukseen.
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
const { listing } = require('./listing-harness');
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'catalog.js'), 'utf8'), ctx);
const C = ctx.SB_CATALOG;

// ---------- viitetoteutus ----------
const CHILDREN = { 'lock/luckor': ['golv', 'sakerhet', 'kund'] };
const scopeOf = (kat, sub) => C.items.filter((i) => i.cat === kat && (!sub || i.sub === sub || (CHILDREN[kat + '/' + sub] || []).indexOf(i.sub) >= 0));
const fam = (i) => i.fam || 'p' + i.id;
const fams = (items) => new Set(items.map(fam)).size;
const MATCH = {
  cls: (i, v) => (i.cls || []).indexOf(v) >= 0,
  mat: (i, v) => (i.mat || []).indexOf(v) >= 0,
  ring: (i, v) => i.rlo != null && +v >= i.rlo && +v <= (i.rhi != null ? i.rhi : i.rlo),
  open: (i, v) => !!(i.ow && i.ol) && (v === i.ow + '×' + i.ol || v === i.ol + '×' + i.ow)
};
const sel = (f, k) => (Array.isArray(f[k]) ? f[k] : f[k] != null ? [String(f[k])] : []);
const passes = (i, f, skip) => Object.keys(f).every((k) => k === skip || !sel(f, k).length || sel(f, k).some((v) => MATCH[k](i, v)));
const expectList = (kat, sub, f) => fams(scopeOf(kat, sub).filter((i) => passes(i, f, null)));
const expectValue = (kat, sub, f, k, v) => fams(scopeOf(kat, sub).filter((i) => passes(i, f, k) && MATCH[k](i, v)));
const VAL = { cls: (o) => o.label, mat: null, ring: (o) => o.label, open: (o) => o.label };
const MATV = { Komposit: 'Composite', Plast: 'Plastic', Betong: 'Concrete', Gjutjärn: 'Cast iron', 'Varmförzinkat stål': 'Galvanised steel', 'Rostfritt stål': 'Stainless steel', Aluminium: 'Aluminium', Stål: 'Steel', Glasfiber: 'Glass fibre' };
const rawValue = (k, o) => (k === 'mat' ? MATV[o.label] : o.label);

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('FAIL ' + msg); } };

function check(name, kat, sub, f) {
  const v = listing({ kat: kat, sub: sub || '', f: f });
  const base = listing({ kat: kat, sub: sub || '', f: {} });
  const n = expectList(kat, sub, f);
  ok(v.countLabel === n + (n === 1 ? ' produkt' : ' produkter'), name + ': listan määrä ' + v.countLabel + ', odotettu ' + n);
  ok(v.cards.length === n, name + ': kortteja ' + v.cards.length + ', odotettu ' + n);
  ok(v.showLabel === 'Visa ' + n + (n === 1 ? ' produkt' : ' produkter'), name + ': mobiilin Visa-painike ' + v.showLabel);
  v.filters.forEach((flt) => {
    const b = base.filters.find((x) => x.id === flt.id);
    ok(b && b.opts.map((o) => o.label).join('|') === flt.opts.map((o) => o.label).join('|'), name + ': ' + flt.id + ' arvojen järjestys muuttui');
    flt.opts.forEach((o) => {
      const raw = rawValue(flt.id, o);
      if (!MATCH[flt.id] || raw == null) return;
      const e = expectValue(kat, sub, f, flt.id, raw);
      ok(o.count === '(' + e + ')', name + ': ' + flt.id + ' ' + o.label + ' ' + o.count + ', odotettu (' + e + ')');
      ok(o.off === (e === 0 && !o.on), name + ': ' + flt.id + ' ' + o.label + ' off=' + o.off);
    });
  });
  return v;
}

// 1. Lätta brunnslock: A15 + Komposit (Ollin esimerkki: Plast ei saa näyttää 4)
const v1 = check('latta A15+Komposit', 'lock', 'latta', { cls: ['A15'], mat: ['Composite'] });
const plast = v1.filters.find((x) => x.id === 'mat').opts.find((o) => o.label === 'Plast');
ok(plast && plast.count === '(0)' && plast.off, 'latta: Plast näkyy harmaana (0)');
// 2. Saman suodattimen valinnat TAI-ehdolla: A15 tai B125
check('latta A15|B125', 'lock', 'latta', { cls: ['A15', 'B125'] });
check('latta rengas 600 + Komposit', 'lock', 'latta', { ring: '600', mat: ['Composite'] });
// 3. Luckor (välitaso, sisältää lapset): luokka + aukon koko
check('luckor D400', 'lock', 'luckor', { cls: ['D400'] });
check('luckor D400 + 600×600', 'lock', 'luckor', { cls: ['D400'], open: ['600×600'] });
// 4. Pääkategoriat (koko listaus)
check('lock Plast', 'lock', '', { mat: ['Plastic'] });
check('lock D400 + Gjutjärn', 'lock', '', { cls: ['D400'], mat: ['Cast iron'] });
check('trafik D400', 'trafik', '', { cls: ['D400'] });
check('el ilman valintoja', 'el', '', {});
// 5. Tuoteapurin paneelin määrä = lista
const g = listing({ kat: 'lock', sub: '', f: {}, gId: 'brunnslock', gA: { typ: 'betong', last: 'B125' }, gOpen: true, gStep: 2 });
ok(g.g.countTxt === g.cards.length + ' produkter passar' && g.countLabel === g.cards.length + ' produkter', 'apurin paneeli: ' + g.g.countTxt + ' / ' + g.countLabel);

console.log(fail ? fail + ' epäonnistui, ' + pass + ' ok' : 'Kaikki ' + pass + ' tarkistusta ok');
process.exit(fail ? 1 : 0);
