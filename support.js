/*
 * Svenska Brunnslock proto: pieni ajonaikainen kirjasto, joka ajaa canvaksen
 * .dc.html-artboardit sellaisenaan selaimessa (GitHub Pages).
 * Tukee: <x-dc>, <helmet>, {{ polku.piste }} -reiät, <sc-for list as>,
 * <sc-if value>, <dc-import name>, DCLogic + setState, onClick/onInput/onChange/onSubmit.
 */
(function () {
  'use strict';

  var hide = document.createElement('style');
  hide.textContent = 'x-dc,helmet{display:none!important}';
  document.head.appendChild(hide);

  var robots = document.createElement('meta');
  robots.name = 'robots';
  robots.content = 'noindex, nofollow';
  document.head.appendChild(robots);

  var mcss = document.createElement('link');
  mcss.rel = 'stylesheet';
  mcss.href = 'mobile.css';
  document.head.appendChild(mcss);

  if (!document.querySelector('meta[name="viewport"]')) {
    var vp = document.createElement('meta');
    vp.name = 'viewport';
    vp.content = 'width=device-width, initial-scale=1';
    document.head.appendChild(vp);
  }

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    Promise.resolve().then(function () { queued = false; render(); });
  }

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, next);
    schedule();
  };
  DCLogic.prototype.renderVals = function () { return {}; };
  window.DCLogic = DCLogic;



  // ---------- kansidata (oikea kauppa, tuotedata-master.xlsx 25.11.2026) ----------
  // Kokoperheet: comp (Composite), pe (PE), gap (GAP). Hinta = nykyinen hinta (alennus jos on), reg = normaalihinta.
  window.SB_LIDS = {
    families: {
      comp: { sv: 'Lätt brunnslock Composite', fi: 'Kevyt kaivonkansi Composite', def: 1050, page: true },
      pe: { sv: 'Lätt brunnslock PE', fi: 'Kevyt kaivonkansi PE', def: 800 },
      gap: { sv: 'Lätt brunnslock GAP', fi: 'Kevyt kaivonkansi GAP', def: 950 }
    },
    items: [{"id": "comp-1050", "fam": "comp", "d": 1050, "sku": "1055", "price": 2645, "reg": null, "lo": 870, "hi": 930, "olo": 1020, "ohi": 1100, "kg": 10, "cls": "A15", "mat": "comp", "sold": 1259, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/latt-brunnslock-1050-composite", "seal": 875, "sealName": "900/1100", "sv": "Lätt Brunnslock 1050 Composite", "fi": "Kevyt kaivonkansi 1050 komposiitti"},
      {"id": "comp-1150", "fam": "comp", "d": 1150, "sku": "10065", "price": 2845, "reg": null, "lo": 960, "hi": 1050, "olo": 1120, "ohi": 1250, "kg": 11, "cls": "A15", "mat": "comp", "sold": 710, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/latt-brunnslock-1150-composite", "seal": 975, "sealName": "1000/1200", "sv": "Lätt Brunnslock 1150 Composite", "fi": "Kevyt kaivonkansi 1150 komposiitti"},
      {"id": "comp-930", "fam": "comp", "d": 930, "sku": "1304", "price": 2150, "reg": null, "lo": 780, "hi": 860, "olo": 850, "ohi": 989, "kg": 8, "cls": "A15", "mat": "comp", "sold": 492, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/latt-brunnslock-930-composite", "seal": 695, "sealName": null, "sv": "Lätt Brunnslock 930 Composite", "fi": "Kevyt kaivonkansi 930 komposiitti"},
      {"id": "pe-800", "fam": "pe", "d": 800, "sku": "1003", "price": 2223, "reg": 2595, "lo": 580, "hi": 640, "olo": null, "ohi": null, "kg": null, "cls": null, "mat": "pe", "sold": 343, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/latt-brunnslock-800-pe", "sv": "Lätt Brunnslock 800 PE", "fi": "Kevyt kaivonkansi 800 PE"},
      {"id": "pe-1100", "fam": "pe", "d": 1100, "sku": "1005", "price": 2700, "reg": 3395, "lo": 880, "hi": 930, "olo": null, "ohi": null, "kg": null, "cls": null, "mat": "pe", "sold": 336, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/latt-brunnslock-1100-pe", "sv": "Lätt Brunnslock 1100 PE", "fi": "Kevyt kaivonkansi 1100 PE"},
      {"id": "p99780", "fam": null, "d": null, "sku": "99780", "price": 2895, "reg": null, "lo": 551, "hi": 670, "olo": 750, "ohi": 849, "kg": 15, "cls": "B125", "mat": "comp", "sold": 191, "url": "/butik/betackningar/betackningar-for-betongbrunnar/latt-brunnslock-780-korbart-composite-125-ton", "sv": "Lätt brunnslock 780 KÖRBART Composite 12,5 ton", "fi": "Kevyt ajettava kaivonkansi 780 komposiitti, 12,5 t"},
      {"id": "p99590", "fam": null, "d": null, "sku": "99590", "price": 1749, "reg": null, "lo": 451, "hi": 550, "olo": 500, "ohi": 615, "kg": 10, "cls": "B125", "mat": "comp", "sold": 163, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/latt-brunnslock-590-korbart-composite-125-ton", "sv": "Lätt Brunnslock 590 KÖRBART Composite 12,5 ton", "fi": "Kevyt ajettava kaivonkansi 590 komposiitti, 12,5 t"},
      {"id": "comp-1340", "fam": "comp", "d": 1340, "sku": "1305", "price": 4395, "reg": null, "lo": 1180, "hi": 1290, "olo": 1280, "ohi": 1450, "kg": 14, "cls": "A15", "mat": "comp", "sold": 162, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/latt-brunnslock-1340-composite", "seal": 1075, "sealName": "1200/1340", "sv": "Lätt Brunnslock 1340 Composite", "fi": "Kevyt kaivonkansi 1340 komposiitti"},
      {"id": "pe-1210", "fam": "pe", "d": 1210, "sku": "1006", "price": 2900, "reg": 3695, "lo": 980, "hi": 1020, "olo": null, "ohi": null, "kg": null, "cls": null, "mat": "pe", "sold": 151, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/latt-brunnslock-1210-pe", "sv": "Lätt Brunnslock 1210 PE", "fi": "Kevyt kaivonkansi 1210 PE"},
      {"id": "pe-660", "fam": "pe", "d": 660, "sku": "1002", "price": 1823, "reg": 1995, "lo": 570, "hi": 670, "olo": null, "ohi": null, "kg": null, "cls": null, "mat": "pe", "sold": 150, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/latt-brunnslock-660-pe", "sv": "Lätt Brunnslock 660 PE", "fi": "Kevyt kaivonkansi 660 PE"},
      {"id": "p7015067", "fam": null, "d": null, "sku": "7015067", "price": 2895, "reg": null, "lo": 600, "hi": 640, "olo": null, "ohi": null, "kg": 31, "cls": "A15", "mat": "iron", "sold": 107, "url": "/butik/betackningar/betackningar-for-betongbrunnar/latt-brunnslock-i-gjutjarn", "sv": "Lätt brunnslock 580-670 A15 i gjutjärn", "fi": "Kevyt kaivonkansi 580-670, valurauta, A15"},
      {"id": "pe-850", "fam": "pe", "d": 850, "sku": "10032", "price": 2323, "reg": 2595, "lo": 590, "hi": 640, "olo": null, "ohi": null, "kg": null, "cls": null, "mat": "pe", "sold": 66, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/latt-brunnslock-850-pe", "sv": "Lätt Brunnslock 850 PE", "fi": "Kevyt kaivonkansi 850 PE"},
      {"id": "gap-950", "fam": "gap", "d": 950, "sku": "1004", "price": 2410, "reg": 2695, "lo": 780, "hi": 820, "olo": null, "ohi": null, "kg": null, "cls": null, "mat": null, "sold": 52, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/latt-brunnslock-950-gap", "sv": "Lätt Brunnslock 950 GAP", "fi": "Kevyt kaivonkansi 950 GAP"},
      {"id": "gap-1420", "fam": "gap", "d": 1420, "sku": "1007", "price": 4595, "reg": 4995, "lo": 1200, "hi": 1270, "olo": null, "ohi": null, "kg": null, "cls": null, "mat": null, "sold": 41, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/latt-brunnslock-1420-gap", "sv": "Lätt Brunnslock 1420 GAP", "fi": "Kevyt kaivonkansi 1420 GAP"},
      {"id": "p11200", "fam": null, "d": null, "sku": "11200", "price": 3885, "reg": null, "lo": 640, "hi": 700, "olo": null, "ohi": null, "kg": null, "cls": null, "mat": "pe", "sold": 33, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/forhojningsring-625-med-lock-pe", "sv": "Förhöjningsring 625 med lock PE", "fi": "Korotusrengas 625 ja kansi, PE"},
      {"id": "p99770", "fam": null, "d": null, "sku": "99770", "price": 2415, "reg": null, "lo": 551, "hi": 670, "olo": 750, "ohi": 849, "kg": 15, "cls": "A15", "mat": "comp", "sold": 31, "url": "/butik/betackningar/betackningar-for-betongbrunnar/latt-brunnslock-780-composite-15-ton", "sv": "Lätt brunnslock 780 Composite 1,5 ton", "fi": "Kevyt kaivonkansi 780 komposiitti, 1,5 t"},
      {"id": "p125050030085", "fam": null, "d": null, "sku": "125050030085", "price": 3957, "reg": null, "lo": 551, "hi": 670, "olo": 750, "ohi": 849, "kg": 25, "cls": "D400", "mat": "comp", "sold": 19, "url": "/butik/betackningar/betackningar-for-betongbrunnar/latt-brunnslock-790-korbart-composite-d400-40ton", "sv": "Lätt brunnslock 790 KÖRBART Composite D400 (40ton)", "fi": "Kevyt ajettava kaivonkansi 790 komposiitti, D400 (40 t)"},
      {"id": "p1019250", "fam": null, "d": null, "sku": "1019250", "price": 9900, "reg": null, "lo": 900, "hi": 900, "olo": 1065, "ohi": 1065, "kg": 55, "cls": "C250", "mat": "comp", "sold": 8, "url": "/butik/betackningar/betackningar-for-betongbrunnar/latt-korbart-brunnslock-900-composite-c250", "sv": "Lätt körbart Brunnslock 900 Composite C250", "fi": "Kevyt ajettava kaivonkansi 900 komposiitti, C250"},
      {"id": "p11210", "fam": null, "d": null, "sku": "11210", "price": 3785, "reg": null, "lo": 600, "hi": 600, "olo": null, "ohi": null, "kg": null, "cls": null, "mat": "pe", "sold": 5, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/forhojningsring-590-med-brunnslock-pe", "sv": "Förhöjningsring 590 med brunnslock PE", "fi": "Korotusrengas 590 ja kaivonkansi, PE"},
      {"id": "p1019600", "fam": null, "d": null, "sku": "1019600", "price": 4495, "reg": null, "lo": 900, "hi": 900, "olo": 1020, "ohi": 1020, "kg": 42, "cls": "A15", "mat": "comp", "sold": 3, "url": "/butik/betackningar/betackningar-for-betongbrunnar/brunnslock-900-composite-a15-gronomrade", "sv": "Brunnslock 900 Composite A15 (grönområde)", "fi": "Kaivonkansi 900 komposiitti, A15 (viheralue)"},
      {"id": "p1019700", "fam": null, "d": null, "sku": "1019700", "price": 7722, "reg": null, "lo": 900, "hi": 900, "olo": 1020, "ohi": 1020, "kg": 69, "cls": "B125", "mat": "comp", "sold": 2, "url": "/butik/betackningar/betackningar-for-betongbrunnar/brunnslock-900-composite-b125-125-ton", "sv": "Brunnslock 900 Composite B125 (12,5 ton)", "fi": "Kaivonkansi 900 komposiitti, B125 (12,5 t)"},
      {"id": "comp-750", "fam": "comp", "d": 750, "sku": "1303", "price": 1495, "reg": null, "lo": 551, "hi": 670, "olo": 710, "ohi": 849, "kg": 8, "cls": "A15", "mat": "comp", "sold": 0, "url": "/butik/brunnslock/latta-brunnslock-for-betongbrunnar/latt-brunnslock-750-composite-2", "seal": 595, "sealName": "600/750", "sv": "Lätt Brunnslock 750 Composite", "fi": "Kevyt kaivonkansi 750 komposiitti"},
      {"id": "p1019", "fam": null, "d": null, "sku": "1019", "price": 17690, "reg": null, "lo": 900, "hi": 1000, "olo": null, "ohi": null, "kg": null, "cls": "D400", "mat": "comp", "sold": 0, "url": "/butik/betackningar/betackningar-for-betongbrunnar/latt-korbart-brunnslock-1100-composite", "sv": "Lätt körbart Brunnslock 1000 Composite D400", "fi": "Kevyt ajettava kaivonkansi 1000 komposiitti, D400"}],
    acc: [
      { id: 'ventil', sku: '1008', price: 569, sv: 'Avluftningsventil', fi: 'Ilmanpoistoventtiili' },
      { id: 'hal', sku: '', price: 58, sv: 'Förborrat hål för avluftningsventil', fi: 'Esiporattu reikä ilmanpoistoventtiilille' },
      { id: 'hanglas', sku: '1009', price: 279, sv: 'Hänglåsadapter', fi: 'Riippulukkosovitin' }
    ]
  };

  // ---------- luukkuperhe SF02 Durkplåtslucka golv/vägg (tuotedata-master.xlsx, Products) ----------
  // 400×400 on nykyisessä kaupassa tarjoustuote (Offert-tagi, tuotetyyppi Quote), muut koot ostettavia.
  // fr = rahtiprofiili nykyisen rahtiluokan mukaan: ei luokkaa = Ombud, Paket = Skrymmande, Pall = Pall.
  window.SB_DURK = {
    sv: 'Durkplåtslucka Golv/vägg', fi: 'Durkplåtiluukku lattiaan ja seinään', def: '300x300',
    items: [{"id": "durk-300x300", "key": "300x300", "label": "300×300", "w": 300, "l": 300, "sku": "236200", "price": 1968, "quote": false, "kg": 5, "fr": "ombud", "sold": 19, "def": true, "url": "/butik/luckor/durkplatsluckor/durkplatslucka-300x300-golv-vagg", "sv": "Durkplåtslucka 300×300 Golv/vägg", "fi": "Durkplåtiluukku 300×300, lattia/seinä"}, {"id": "durk-300x400", "key": "300x400", "label": "300×400", "w": 300, "l": 400, "sku": "236340", "price": 2625, "quote": false, "kg": 8, "fr": "ombud", "sold": 6, "def": false, "url": "/butik/luckor/durkplatsluckor/durkplatslucka-300x400-golv-vagg", "sv": "Durkplåtslucka 300×400 Golv/vägg", "fi": "Durkplåtiluukku 300×400, lattia/seinä"}, {"id": "durk-400x400", "key": "400x400", "label": "400×400", "w": 400, "l": 400, "sku": "236400", "price": null, "quote": true, "kg": 9, "fr": "offert", "sold": 14, "def": false, "url": "/butik/luckor/durkplatsluckor/durkplatslucka-400x400-golv-vagg", "sv": "Durkplåtslucka 400×400 Golv/vägg", "fi": "Durkplåtiluukku 400×400, lattia/seinä"}, {"id": "durk-400x500", "key": "400x500", "label": "400×500", "w": 400, "l": 500, "sku": "236500", "price": 3150, "quote": false, "kg": 14, "fr": "skrym", "sold": 15, "def": false, "url": "/butik/luckor/durkplatsluckor/durkplatslucka-400x500-golv-vagg", "sv": "Durkplåtslucka 400×500 Golv/vägg", "fi": "Durkplåtiluukku 400×500, lattia/seinä"}, {"id": "durk-400x600", "key": "400x600", "label": "400×600", "w": 400, "l": 600, "sku": "236600", "price": 3750, "quote": false, "kg": 16, "fr": "skrym", "sold": 2, "def": false, "url": "/butik/luckor/durkplatsluckor/durkplatslucka-400x600-golv-vagg", "sv": "Durkplåtslucka 400×600 Golv/vägg", "fi": "Durkplåtiluukku 400×600, lattia/seinä"}, {"id": "durk-500x500", "key": "500x500", "label": "500×500", "w": 500, "l": 500, "sku": "236550", "price": 3750, "quote": false, "kg": 14, "fr": "skrym", "sold": 3, "def": false, "url": "/butik/luckor/durkplatsluckor/durkplatslucka-500x500-golv-vagg", "sv": "Durkplåtslucka 500×500 Golv/vägg", "fi": "Durkplåtiluukku 500×500, lattia/seinä"}, {"id": "durk-600x600", "key": "600x600", "label": "600×600", "w": 600, "l": 600, "sku": "236700", "price": 3976, "quote": false, "kg": 21, "fr": "pall", "sold": 9, "def": false, "url": "/butik/luckor/durkplatsluckor/durkplatslucka-600x600-golv-vagg", "sv": "Durkplåtslucka 600×600 Golv/vägg", "fi": "Durkplåtiluukku 600×600, lattia/seinä"}, {"id": "durk-600x700", "key": "600x700", "label": "600×700", "w": 600, "l": 700, "sku": "236770", "price": 4595, "quote": false, "kg": 23, "fr": "pall", "sold": 2, "def": false, "url": "/butik/luckor/durkplatsluckor/durkplatslucka-600x700-golv-vagg", "sv": "Durkplåtslucka 600×700 Golv/vägg", "fi": "Durkplåtiluukku 600×700, lattia/seinä"}, {"id": "durk-600x800", "key": "600x800", "label": "600×800", "w": 600, "l": 800, "sku": "236800", "price": 5157, "quote": false, "kg": 27, "fr": "pall", "sold": 14, "def": false, "url": "/butik/luckor/durkplatsluckor/durkplatslucka-600x800-golv-vagg", "sv": "Durkplåtslucka 600×800 Golv/vägg", "fi": "Durkplåtiluukku 600×800, lattia/seinä"}, {"id": "durk-800x1000", "key": "800x1000", "label": "800×1000", "w": 800, "l": 1000, "sku": "236900", "price": 7406, "quote": false, "kg": 41, "fr": "pall", "sold": 5, "def": false, "url": "/butik/luckor/durkplatsluckor/durkplatslucka-800x1000-golv-vagg", "sv": "Durkplåtslucka 800×1000 Golv/vägg", "fi": "Durkplåtiluukku 800×1000, lattia/seinä"}]
  };

  // ---------- lisävarusteet ja "Passar till" (suositus määritellään lisävarusteelle, ei päätuotteelle) ----------
  // Lähde: tuotedata-masterin kategoria "Locköppnare och tillbehör" ja tuotesivun lisävalinnat (SB_LIDS.acc, tiivisterengas SB_LIDS.sealName).
  // fits = lista ehdoista; tuote sopii, jos jokin ehto täsmää. Ehto: fam (kokoperhe, esim. 'SF19'), sz (koot), sub (alakategoria),
  // ring (renkaan sisämitan väli, osuu tuotteen Passar ring -väliin), name (sana tuotteen nimessä), tpl (tuoteperhe), cat (kategoria).
  // guess: true = ei pääteltävissä datasta, arvaus; SB vahvistaa kotitehtävässä K5.
  // ids = kaikki koritunnisteet, joilla sama tuote voi olla korissa (catalog.js 'w<id>' ja vanhat SB_LIDS-tunnisteet).
  window.SB_ACCESSORIES = [
    { ids: ['w3658', 'seal-750'], pid: '3658', addon: true, why: ['Tätar mellan ring och lock, mot lukt och smådjur.', 'Tiivistää renkaan ja kannen välin hajuja ja pieneläimiä vastaan.'],
      fits: [{ fam: 'SF19', sz: ['750'] }, { sub: 'latta', ring: [570, 640] }] },   // kuvaus: invändigt 570-640 mm; Composite 750: SB_LIDS
    { ids: ['w3664', 'seal-1050'], pid: '3664', addon: true, why: ['Tätar mellan ring och lock, mot lukt och smådjur.', 'Tiivistää renkaan ja kannen välin hajuja ja pieneläimiä vastaan.'],
      fits: [{ fam: 'SF19', sz: ['1050'] }, { sub: 'latta', ring: [880, 920] }] },  // kuvaus: 880-920 mm
    { ids: ['w3668', 'seal-1150'], pid: '3668', addon: true, why: ['Tätar mellan ring och lock, mot lukt och smådjur.', 'Tiivistää renkaan ja kannen välin hajuja ja pieneläimiä vastaan.'],
      fits: [{ fam: 'SF19', sz: ['1150'] }, { sub: 'latta', ring: [980, 1030] }] }, // kuvaus: 980-1030 mm
    { ids: ['w3670', 'seal-1340'], pid: '3670', addon: true, why: ['Tätar mellan ring och lock, mot lukt och smådjur.', 'Tiivistää renkaan ja kannen välin hajuja ja pieneläimiä vastaan.'],
      fits: [{ fam: 'SF19', sz: ['1340'] }, { sub: 'latta', ring: [1170, 1240] }] }, // kuvaus: 1170-1240 mm
    { ids: ['w1135', 'ventil'], pid: '1135', addon: true, why: ['Monteras ovanpå locket, justerbar höjd 100 till 700 mm.', 'Asennetaan kannen päälle, korkeus säädettävissä 100-700 mm.'],
      fits: [{ fam: 'SF19' }, { sub: 'latta', guess: true }] }, // Composite: kaupan lisävalinta ja kuvaus; muut kevyet kannet: arvaus
    { ids: ['hal'], pid: null, addon: true, name: ['Förborrat hål för avluftningsventil', 'Esiporattu reikä ilmanpoistoventtiilille'], price: 58, why: ['Vi borrar hålet innan leverans.', 'Poraamme reiän ennen toimitusta.'],
      fits: [{ fam: 'SF19' }] }, // kaupan lisävalinta Composite-kansille (ei omaa tuotesivua)
    { ids: ['w1128', 'hanglas'], pid: '1128', why: ['Lås locket med hänglås i stället för säkerhetsmuttern.', 'Kansi lukitaan riippulukolla turvamutterin sijaan.'],
      fits: [{ fam: 'SF20' }] }, // kuvaus: "passar till kupade, lätta brunnslock i PE"
    { ids: ['w1540'], pid: '1540', why: ['Öppnar de flesta lock och betäckningar med hävstång.', 'Avaa useimmat kannet vipuvarrella.'],
      fits: [{ tpl: 'kannet', guess: true }, { cat: 'trafik', guess: true }] }, // kuvaus: "de flesta brunnslock och betäckningar", rajaus arvaus
    { ids: ['w1543'], pid: '1543', why: ['För lock med nyckelhål.', 'Kansille, joissa on avaimenreikä.'],
      fits: [{ sub: 'betong', guess: true }] }, // kuvaus: lock med nyckelhål; mitkä kannet, ei datassa
    { ids: ['w16670'], pid: '16670', why: ['Öppnar lås och lock med TK-låsning.', 'Avaa TK-lukitut lukot ja kannet.'],
      fits: [{ name: 'TK-' }] }, // kuvaus: TK-låsning; tuotteet, joiden nimessä TK-
    { ids: ['w1235'], pid: '1235', why: ['Förlänger brunnen, levereras med lätt låsbart lock.', 'Jatkaa kaivoa, mukana kevyt lukittava kansi.'],
      fits: [{ sub: 'plastbrunn', ring: [580, 620], guess: true }, { sub: 'plast', ring: [580, 620], guess: true }] } // 600 mm kaula muovikaivoon: arvaus
  ];
  window.SBAcc = {
    // onko koritunniste lisävaruste (myös vanhat SB_LIDS-tunnisteet)
    isAcc: function (id) { return /^(seal-|ventil$|hal$|hanglas$)/.test(id) || window.SB_ACCESSORIES.some(function (a) { return a.ids.indexOf(id) >= 0; }); },
    fits: function (a, it) {
      if (!it) return false;
      return a.fits.some(function (f) {
        if (f.fam && !(it.fam && it.fam.indexOf(f.fam + ' ') === 0)) return false;
        if (f.sz && f.sz.indexOf(String(it.sz)) < 0) return false;
        if (f.sub && it.sub !== f.sub) return false;
        if (f.tpl && it.tpl !== f.tpl) return false;
        if (f.cat && it.cat !== f.cat) return false;
        if (f.name && String(it.n).indexOf(f.name) < 0) return false;
        if (f.ring) { if (it.rlo == null) return false; var hi = it.rhi != null ? it.rhi : it.rlo; if (!(it.rlo <= f.ring[1] && hi >= f.ring[0])) return false; }
        return true;
      });
    },
    // lisävarusteet tuotteelle; catalog.js-tieto (nimi, hinta) liitetään mukaan
    forItem: function (it) {
      var C = window.SB_CATALOG ? window.SB_CATALOG.items : [];
      return window.SB_ACCESSORIES.filter(function (a) { return a.pid !== it.id && window.SBAcc.fits(a, it); }).map(function (a) {
        var p = a.pid ? C.filter(function (x) { return x.id === a.pid; })[0] : null;
        return { a: a, id: a.ids[0], ids: a.ids, pid: a.pid, addon: !!a.addon, name: p ? p.n : (a.name || ['', ''])[0], nameFi: p ? p.n : (a.name || ['', ''])[1], price: p ? p.price : a.price, sku: p ? p.sku : '', why: a.why };
      }).filter(function (x) { return x.name && x.price != null; });
    },
    // koririvin päätuote catalog.js:stä (w<id> tai vanha SB_LIDS-kansi artikkelinumeron kautta)
    itemOf: function (lineId) {
      var C = window.SB_CATALOG ? window.SB_CATALOG.items : [];
      if (/^w\d+$/.test(lineId)) return C.filter(function (x) { return x.id === lineId.slice(1); })[0] || null;
      var L = window.SB_LIDS ? window.SB_LIDS.items.filter(function (x) { return x.id === lineId; })[0] : null;
      return L ? C.filter(function (x) { return x.sku === L.sku; })[0] || null : null;
    }
  };

  // ---------- rahtiprofiili (service-design/rahtimalli.md, kohdat 3.1 ja 3.3) ----------
  // Rahti määräytyy tuotteen profiilin mukaan ja on sama koko Ruotsissa, joten postinumeroa ei tarvita.
  // Hinnat ovat nykyisen kaupan esimerkkejä: Ombud 172 kr, Skrymmande 590 kr, yleislava 1 480 kr / 8 kpl, plinttilava 2 400 kr.
  var FR = {
    ombud: { price: 172, sv: 'Frakt från 172 kr', fi: 'Rahti alkaen 172 kr', ship: { sv: 'Paket till ombud eller hem', fi: 'Paketti noutopisteeseen tai kotiin' } },
    skrym: { price: 590, sv: 'Frakt 590 kr', fi: 'Rahti 590 kr', ship: { sv: 'Hemleverans', fi: 'Kotiinkuljetus' } },
    pall: { price: 1480, per: 8, sv: 'Pallfrakt från 1 480 kr', fi: 'Lavarahti alkaen 1 480 kr', ship: { sv: 'Pall', fi: 'Lava' } },
    plint: { price: 2400, per: 20, sv: 'Pallfrakt från 2 400 kr', fi: 'Lavarahti alkaen 2 400 kr', ship: { sv: 'Pall', fi: 'Lava' } },
    offert: { price: null, sv: 'Frakt ingår i offerten', fi: 'Rahti sisältyy tarjoukseen' }
  };
  // p: { price, mat, kg, pallet, small }
  window.SBFreight = function (p) {
    var mat = p.mat || '', kg = p.kg || 0, key;
    if (p.price == null) key = 'offert';
    else if (p.pallet === 'plint') key = 'plint';
    else if (['betong', 'iron', 'gjut', 'gjutjarn'].indexOf(mat) >= 0 || kg > 30) key = 'pall';
    else if (p.small || (p.kg != null && kg <= 3)) key = 'ombud';
    else key = 'skrym';
    return Object.assign({ key: key }, FR[key]);
  };
  window.SBFreight.profiles = FR;

  // ---------- rahdin rajat (rahtimalli.md 3.2, esimerkkiarvot, SB vahvistaa) ----------
  var FREIGHT_OMBUD_MAX_KG = 20;    // koko kori enintään 20 kg: paketti noutopisteeseen (kaikkien ombud-palveluiden raja)
  var FREIGHT_HOME_MAX_KG = 30;     // koko kori enintään 30 kg: kotiinkuljetus pakettina (DSV 30, DHL Parcel Connect 31,5, PostNord 35)
  var FREIGHT_HEAVY_MAX_KG = 150;   // koko kori enintään 150 kg: tung kotiinkuljetus rahtina kotiovelle (uusi porras, SB päättää)
  var FREIGHT_RIDER_MAX_KG = 1000;  // muut tuotteet kulkevat lavojen mukana enintään 1 000 kg, sen yli lisää yleislavoja
  var FREIGHT_PALLET_MAX_KG = 1000; // yleislava enintään 1 000 kg
  var FREIGHT_LARGE_PER_PALLET = 10; // isoja tuotteita (esim. Composite-kannet) enintään 10 per lava (esimerkki, SB vahvistaa)
  var FREIGHT_MAX_PALLETS = 5;      // yli 5 lavaa: rahti offeroidaan, ei lisätä summaan
  var FREIGHT_OMBUD_PRICE = 172, FREIGHT_HOME_PRICE = 590;
  var FREIGHT_HEAVY_PRICE = 1240;   // nykyisen "Hemleverans pall" -tavan hinta

  // ---------- lavatyypit ja lavakapasiteetit (rahtimalli.md 1 ja 3.1, nykyisen kaupan rahtiluokat; SB vahvistaa) ----------
  // Lavatyyppi määrää lavan hinnan. Tuote täyttää lavasta osuuden 1 / per; osuudet summataan saman tyypin sisällä ja pyöristetään ylöspäin.
  var PALLET_TYPES = {
    general: { price: 1480, sv: 'pall', fi: 'lava' },              // yleislava (Pall-luokka)
    plint: { price: 2400, sv: 'plintpall', fi: 'plinttilava' },     // plinttilava (Stor pall): TP, KP, KP+
    betong1000: { price: 2080, sv: 'pall', fi: 'lava' },           // Betonglock 1000/600 till gårdspump
    betong1200: { price: 2750, sv: 'pall', fi: 'lava' }            // Betonglock 1200/600 till gårdspump
  };
  // Tuotteen lavatyyppi ja kapasiteetti tuotenimen mukaan (catalog.js n). Ensimmäinen osuva sääntö ratkaisee.
  var PALLET_RULES = [
    { name: /^Betongplint TP (200|300)\b/, type: 'plint', per: 30 },
    { name: /^Betongplint TP (400|500|600)\b/, type: 'plint', per: 20 },
    { name: /^Betongplint KP\+/, type: 'plint', per: 4 },
    { name: /^Betongplint KP \d/, type: 'plint', per: 8 },          // paikkamerkki: nykyinen kauppa laskee 20, SB vahvistaa
    { name: /^Betonglock 1000\/600\b/, type: 'betong1000', per: 2 },
    { name: /^Betonglock 1200\/600\b/, type: 'betong1200', per: 2 }
  ];
  var PALLET_DEFAULT = { type: 'general', per: 8 };                // muut lavatuotteet: 8 kpl yleislavalle (1 480 kr)
  // it: catalog.js-tuote tai korin rivi { n | name, fr, perPall }. Palauttaa { type, per } tai null, jos tuote ei ole lavatuote.
  function palletOf(it) {
    if (!it || (it.fr !== 'pall' && it.fr !== 'plint')) return null;
    var n = String(Array.isArray(it.n) ? it.n[0] : (it.n || it.name || ''));
    var r = PALLET_RULES.filter(function (x) { return x.name.test(n); })[0];
    if (r) return { type: r.type, per: r.per };
    return { type: PALLET_DEFAULT.type, per: it.perPall || PALLET_DEFAULT.per };
  }
  window.SBFreight.pallets = { types: PALLET_TYPES, rules: PALLET_RULES, of: palletOf };

  // ---------- hintanäkymä inkl./exkl. moms (muistetaan sivulta toiselle) ----------
  var VAT_KEY = 'sb-proto-vat';
  window.SBVat = {
    get: function () { try { return localStorage.getItem(VAT_KEY) === 'exkl' ? 'exkl' : 'inkl'; } catch (e) { return 'inkl'; } },
    set: function (v) { try { localStorage.setItem(VAT_KEY, v === 'exkl' ? 'exkl' : 'inkl'); } catch (e) {} }
  };

  // ---------- asiakastili (Mitt konto): demoasiakas ja kirjautumistila, localStorage ----------
  // WooCommercen My Account vastaa: kirjautunut käyttäjä + billing/shipping-osoitteet (user meta).
  // Kaksi demoasiakasta: privat ja foretag (?demo= SvKonto-sivulla). Muokatut osoitteet ja tiedot tallentuvat päälle.
  var ACC_KEY = 'sb-proto-konto', ACC_EDIT_KEY = 'sb-proto-konto-edit';
  var ACC_DEMO = {
    privat: { type: 'privat', first: 'Anna', last: 'Exempel', email: 'anna@exempel.se', phone: '070-123 45 67', company: '', orgnr: '', custNo: '5678',
      billing: { name: 'Anna Exempel', street: 'Exempelvägen 1', zip: '123 45', city: 'Exempelstad' },
      shipping: { name: 'Anna Exempel', street: 'Exempelvägen 1', zip: '123 45', city: 'Exempelstad' } },
    foretag: { type: 'foretag', first: 'Erik', last: 'Exempel', email: 'inkop@exempelbygg.se', phone: '070-765 43 21', company: 'Exempel Bygg AB', orgnr: '556677-8899', custNo: '1234',
      billing: { name: 'Exempel Bygg AB', street: 'Box 123', zip: '123 45', city: 'Exempelstad' },
      shipping: { name: 'Exempel Bygg AB, Erik Exempel', street: 'Arbetsplats Ängsgården, Exempelgatan 5', zip: '123 46', city: 'Exempelstad' } }
  };
  window.SBAccount = {
    get: function () { try { var t = localStorage.getItem(ACC_KEY); return ACC_DEMO[t] ? t : null; } catch (e) { return null; } },
    set: function (t) { try { if (ACC_DEMO[t]) localStorage.setItem(ACC_KEY, t); } catch (e) {} },
    clear: function () { try { localStorage.removeItem(ACC_KEY); } catch (e) {} },
    profile: function (t) {
      t = t || this.get();
      if (!ACC_DEMO[t]) return null;
      var ed = {};
      try { ed = (JSON.parse(localStorage.getItem(ACC_EDIT_KEY) || '{}') || {})[t] || {}; } catch (e) {}
      var p = JSON.parse(JSON.stringify(ACC_DEMO[t]));
      Object.keys(ed).forEach(function (k) { p[k] = (k === 'billing' || k === 'shipping') ? Object.assign(p[k], ed[k]) : ed[k]; });
      return p;
    },
    save: function (t, patch) {
      try {
        var all = JSON.parse(localStorage.getItem(ACC_EDIT_KEY) || '{}') || {};
        all[t] = Object.assign({}, all[t], patch);
        localStorage.setItem(ACC_EDIT_KEY, JSON.stringify(all));
      } catch (e) {}
    }
  };

  // ---------- ostoskori (yhteinen kaikille sivuille, localStorage) ----------
  var CART_KEY = 'sb-proto-cart-v1';
  var CATALOG_ = null;
  function catalog() { if (!CATALOG_) CATALOG_ = buildCatalog(); return CATALOG_; }
  function buildCatalog() {
    var c = {}, L = window.SB_LIDS, CI = window.SB_CATALOG ? window.SB_CATALOG.items : [];
    L.items.forEach(function (it) {
      var pg = it.fam === 'comp';
      // Rahtiprofiili samasta lähteestä kuin tuotesivulla (catalog.js, sama artikkelinumero); arvio vain, jos catalog.js puuttuu
      var w = CI.filter(function (x) { return x.sku === it.sku; })[0];
      c[it.id] = { price: it.price, fr: w ? w.fr : window.SBFreight(it).key, kg: it.kg != null ? it.kg : w ? w.kg : null,
        fi: [it.fi, 'Tuotenro ' + it.sku + (it.lo ? ' · Sopii renkaaseen ' + it.lo + ' ja ' + it.hi + ' mm:n välillä' : ''), pg ? 'FiTuote.dc.html?size=' + it.d : '#'],
        sv: [it.sv, 'Art.nr ' + it.sku + (it.lo ? ' · Passar ring ' + it.lo + ' till ' + it.hi + ' mm' : ''), pg ? 'SvProdukt.dc.html?size=' + it.d : '#'] };
      if (it.seal) c['seal-' + it.d] = { price: it.seal, fr: 'ombud', kg: 1,
        fi: [it.sealName ? 'Tiivisterengas ' + it.sealName : 'Tiivisterengas koolle ' + it.d, 'Lisävaruste kanteen ' + it.d, '#'],
        sv: [it.sealName ? 'Tätningsring ' + it.sealName : 'Tätningsring till ' + it.d, 'Tillval till lock ' + it.d, '#'] };
    });
    window.SB_DURK.items.forEach(function (it) {
      var q = 'p=durk&size=' + it.key;
      c[it.id] = { price: it.quote ? null : it.price, fr: it.fr, kg: it.kg,
        fi: [it.fi, 'Tuotenro ' + it.sku + ' · Vapaa aukko ' + it.label + ' mm', 'FiTuote.dc.html?' + q],
        sv: [it.sv, 'Art.nr ' + it.sku + ' · Fri öppning ' + it.label + ' mm', 'SvProdukt.dc.html?' + q] };
    });
    L.acc.forEach(function (a) { c[a.id] = { price: a.price, fr: 'ombud', kg: 1, fi: [a.fi, 'Lisävaruste kevyisiin kansiin', '#'], sv: [a.sv, 'Tillval till lätta lock', '#'] }; });
    // Kaikki siirrettävät tuotteet (catalog.js), tunniste w<WooCommerce-id>
    if (window.SB_CATALOG) window.SB_CATALOG.items.forEach(function (it) {
      c['w' + it.id] = { price: it.price, fr: it.fr, kg: it.kg,
        sv: [it.n, 'Art.nr ' + (it.sku || ''), 'SvProdukt.dc.html?id=' + it.id], fi: [it.n, 'Tuotenro ' + (it.sku || ''), 'FiTuote.dc.html?id=' + it.id] };
    });
    // lavatyyppi ja kapasiteetti jokaiselle lavatuotteelle (PALLET_RULES)
    Object.keys(c).forEach(function (k) { var pa = palletOf({ fr: c[k].fr, n: c[k].sv[0] }); if (pa) { c[k].pt = pa.type; c[k].per = pa.per; } });
    return c;
  }
  function readCart() {
    try { var c = JSON.parse(localStorage.getItem(CART_KEY) || 'null'); if (c && c.items) return c; } catch (e) {}
    return { items: [], zip: '' };
  }
  function writeCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} }
  // ?demo korvaa aina korin demokorilla, jotta demolinkissä ei näy aiempien demojen jäänteitä
  if (/[?&]demo\b/.test(location.search)) {
    writeCart({ items: [{ id: 'comp-1050', qty: 1 }, { id: 'ventil', qty: 1 }], zip: '' });
  }
  window.SBCart = {
    get catalog() { return catalog(); },
    items: function () { return readCart().items; },
    lines: function (lang) {
      return readCart().items.filter(function (i) { return catalog()[i.id]; }).map(function (i) {
        var p = catalog()[i.id], t = p[lang] || p.fi;
        var price = i.agreed != null ? i.agreed : p.price;
        return { id: i.id, name: t[0], meta: t[1], href: t[2], price: price, qty: i.qty, quote: price == null, agreed: i.agreed != null, fr: p.fr, kg: p.kg, pt: p.pt, per: p.per };
      });
    },
    add: function (id, qty) {
      var c = readCart(), found = c.items.filter(function (i) { return i.id === id; })[0];
      if (found) found.qty += qty || 1; else c.items.push({ id: id, qty: qty || 1 });
      writeCart(c); schedule();
    },
    setItems: function (items) { var c = readCart(); c.items = items.map(function (i) { var o = { id: i.id, qty: i.qty }; if (i.agreed) o.agreed = i.price; return o; }); writeCart(c); schedule(); },
    hasQuote: function () { return readCart().items.some(function (i) { return catalog()[i.id] && catalog()[i.id].price == null && i.agreed == null; }); },
    count: function () { return readCart().items.reduce(function (s, i) { return s + i.qty; }, 0); },
    zip: function () { return readCart().zip || ''; },
    setZip: function (z) { var c = readCart(); c.zip = z; writeCart(c); },
    clear: function () { writeCart({ items: [], zip: readCart().zip }); schedule(); },
    // Kassan valinnat kiitossivulle (maksutapa, toimitustapa). Tyhjenevät clear():n mukana.
    setMeta: function (k, v) { var c = readCart(); c.meta = Object.assign({}, c.meta, (function () { var o = {}; o[k] = v; return o; })()); writeCart(c); },
    meta: function (k) { var m = readCart().meta || {}; return k ? m[k] : m; },
    // Korin rahti rahtimallin kohdan 3.2 mukaan. lines: [{ id, fr, kg, qty, quote }] (id tai pt/per kertoo lavatyypin)
    // Palauttaa { price, key, label, note, options, pallets, quote }. quote = true: yli 5 lavaa, rahti offeroidaan (price null).
    freight: function (lines, lang) {
      lang = lang || 'fi';
      var ls = (lines || this.lines(lang)).filter(function (l) { return !l.quote; });
      if (!ls.length) return { price: 0, label: '', options: [] };
      // Painoportaat koko korille (rahtimalli.md 3.2, esimerkkiarvot, SB vahvistaa):
      // ombud enintään 20 kg, kotiinkuljetus pakettina enintään 30 kg, tung kotiinkuljetus enintään 150 kg, sen yli lava;
      // lavalla kulkee muita tuotteita enintään 1 000 kg; yli 5 lavaa tarjoukseen.
      var OMB_KG = FREIGHT_OMBUD_MAX_KG, HOME_KG = FREIGHT_HOME_MAX_KG, HEAVY_KG = FREIGHT_HEAVY_MAX_KG, RIDER_KG = FREIGHT_RIDER_MAX_KG, PALL_KG = FREIGHT_PALLET_MAX_KG, MAX_PALL = FREIGHT_MAX_PALLETS, PT = PALLET_TYPES;
      var W = 0, riderKg = 0, largeQty = 0, hasGeneral = false, unknownPall = false, noKg = [], has = {}, share = {};
      ls.forEach(function (l) {
        var kg = l.kg == null ? 0 : l.kg * l.qty, pa = null;
        has[l.fr] = true;
        W += kg;
        if (l.fr === 'pall' || l.fr === 'plint') {
          var c = l.id ? catalog()[l.id] : null;
          pa = l.pt ? { type: l.pt, per: l.per } : c && c.pt ? { type: c.pt, per: c.per } : palletOf({ fr: l.fr, n: l.name });
          // Vain omat lavatyypit (plintit, betonikannet) lasketaan kappaleina. Muu lavatavara lasketaan painona kuten muut tuotteet.
          if (pa.type === 'general') { riderKg += kg; hasGeneral = true; }
          else share[pa.type] = (share[pa.type] || 0) + l.qty / pa.per;
          // Lavatuote ilman painoa ei pääse kotiinkuljetukseen (3.2 kohta 6). Muu tuote ilman painoa lasketaan 0 kg:ksi.
          if (l.kg == null) unknownPall = true;
        } else {
          riderKg += kg;
          if (l.fr === 'skrym') largeQty += l.qty;
          // Huomautus vain, kun puuttuva paino voi muuttaa rahtia (useampi kappale tai muu kuin pakettituote)
          if (l.kg == null && (l.qty > 1 || l.fr !== 'ombud') && noKg.indexOf(l.name) < 0) noKg.push(l.name);
        }
      });
      var T = function (sv, fi) { return lang === 'sv' ? sv : fi; };
      var same = T('Samma pris i hela Sverige.', 'Sama hinta koko Ruotsiin.');
      // Fallback: jos tuotteelta puuttuu paino, rahtia ei arvata. SB laskee rahdin ja ilmoittaa sen ennen lähetystä (rahtimalli.md 3.2).
      var missing = ls.filter(function (l) { return l.kg == null; }).map(function (l) { return l.name; }).filter(Boolean);
      if (missing.length) {
        var mn = T('Vi räknar frakten och meddelar dig innan vi skickar. Du godkänner frakten innan leverans.', 'Laskemme rahdin ja ilmoitamme sen ennen lähetystä. Hyväksyt rahdin ennen toimitusta.');
        return { price: null, quote: true, later: true, key: 'calc', label: T('beräknas av oss', 'lasketaan erikseen'), priceTxt: T('Beräknas', 'Lasketaan'), note: mn,
          options: [{ id: 'calc', label: T('Frakt beräknas av oss', 'Rahti lasketaan erikseen'), text: mn, price: null }] };
      }
      var kgTxt = Math.round(W).toLocaleString('sv-SE') + ' kg';
      var money = function (n) { return Math.round(n).toLocaleString('sv-SE') + ' kr'; };
      // Tuote ilman painoa lasketaan 0 kg:ksi (tuotedatasta puuttuu paino), joten rahti voi tarkentua: kerrotaan se asiakkaalle.
      var nk = noKg.filter(Boolean).length ? ' ' + T('Vikt saknas för ' + noKg.filter(Boolean).join(', ') + ', så frakten kan justeras.', 'Painotieto puuttuu tuotteelta ' + noKg.filter(Boolean).join(', ') + ', joten rahti voi tarkentua.') : '';
      var home = function (txt) { return { price: FREIGHT_HOME_PRICE, key: 'skrym', label: T('Hemleverans', 'Kotiinkuljetus'), note: same + nk, options: [{ id: 'skrym', label: T('Hemleverans', 'Kotiinkuljetus'), text: txt + same + nk, price: FREIGHT_HOME_PRICE }] }; };
      var heavyLbl = T('Hemleverans, tungt gods', 'Kotiinkuljetus, raskas tavara');
      var heavy = function (txt) { return { price: FREIGHT_HEAVY_PRICE, key: 'tung', label: heavyLbl, note: same + nk, options: [{ id: 'tung', label: heavyLbl, text: txt + same + nk, price: FREIGHT_HEAVY_PRICE }] }; };
      var hasPall = Object.keys(share).length > 0 || hasGeneral;   // lavatavaraa korissa
      var hasOwn = Object.keys(share).length > 0;                    // omia lavatyyppejä (plintit, betonikannet)
      var wTxt = T('Ordern väger ' + kgTxt + '. ', 'Tilaus painaa ' + kgTxt + '. ');
      // Yli 10 isoa tuotetta ei mahdu pakettina eikä raskaana kotiinkuljetuksena: suoraan lavalle painosta riippumatta.
      if (largeQty > FREIGHT_LARGE_PER_PALLET) unknownPall = true;
      // 1 Koko kori enintään 30 kg: kotiinkuljetus pakettina, myös lavatuotteilla (kevyt lavatilaus)
      if (W <= HOME_KG && !unknownPall && (hasPall || has.skrym || W > OMB_KG)) return home(wTxt);
      // 2b Koko kori yli 30 kg mutta enintään 150 kg: tung kotiinkuljetus rahtina kotiovelle, myös lavatuotteilla
      if (W > HOME_KG && W <= HEAVY_KG && !unknownPall) return heavy(T('Ordern väger ' + kgTxt + ' och körs hem som gods. ', 'Tilaus painaa ' + kgTxt + ' ja ajetaan kotiin rahtina. '));
      if (hasPall || W > HEAVY_KG || largeQty > FREIGHT_LARGE_PER_PALLET) {
        // 2 Lavat: lavatuotteet osuuksina lavatyypeittäin (summa pyöristetään ylöspäin), eri tyypit lasketaan yhteen.
        // Muut tuotteet kulkevat lavojen mukana enintään 1 000 kg; sen yli ne vievät lisää yleislavoja.
        // Ilman lavatuotteita yli 150 kg:n kori menee yleislavoille painon mukaan (enintään 1 000 kg per lava).
        var n = {};
        Object.keys(share).forEach(function (k) { n[k] = Math.ceil(share[k] - 1e-9); });
        // Isot tuotteet vievät tilaa: lavoja vähintään kappalemäärän mukaan (FREIGHT_LARGE_PER_PALLET). Plinttilavojen mukana kulkee enintään 1 000 kg ja 10 isoa tuotetta.
        var nLarge = Math.ceil(largeQty / FREIGHT_LARGE_PER_PALLET);
        var extra = hasOwn ? Math.max(riderKg > RIDER_KG ? Math.ceil((riderKg - RIDER_KG) / PALL_KG) : 0, Math.ceil(Math.max(0, largeQty - FREIGHT_LARGE_PER_PALLET) / FREIGHT_LARGE_PER_PALLET)) : Math.max(1, Math.ceil(W / PALL_KG), nLarge);
        if (extra) n.general = (n.general || 0) + extra;
        var pallets = 0, pp = 0;
        Object.keys(n).forEach(function (k) { pallets += n[k]; pp += n[k] * PT[k].price; });
        var pl = pallets + ' ' + T(pallets === 1 ? 'pall' : 'pallar', pallets === 1 ? 'lava' : 'lavaa');
        var why = hasOwn ? (riderKg > RIDER_KG ? T('Övriga produkter väger ' + Math.round(riderKg).toLocaleString('sv-SE') + ' kg och behöver egna pallar. ', 'Muut tuotteet painavat ' + Math.round(riderKg).toLocaleString('sv-SE') + ' kg ja tarvitsevat omat lavat. ')
            : riderKg > 0 ? T('Lättare produkter följer med pallen utan extra kostnad. ', 'Kevyemmät tuotteet kulkevat lavan mukana ilman lisähintaa. ') : '')
          : T('Ordern väger ' + kgTxt + ', så den skickas på pall. ', 'Tilaus painaa ' + kgTxt + ', joten se lähtee lavalla. ');
        // 3 Yli 5 lavaa: rahti offeroidaan, eikä sitä lisätä summaan
        if (pallets > MAX_PALL) {
          var qn = T('Över ' + MAX_PALL + ' pallar räknar vi frakten i en offert.', 'Yli ' + MAX_PALL + ' lavan rahdin laskemme tarjouksessa.');
          return { price: null, quote: true, key: 'offert', pallets: pallets, estimate: pp, label: pl, priceTxt: T('Offereras', 'Tarjouksella'), note: qn,
            options: [{ id: 'offert', label: T('Frakt offereras, ', 'Rahti tarjouksella, ') + pl, text: qn + ' ' + same, price: null }] };
        }
        return { price: pp, key: 'pall', pallets: pallets, label: T('Pall, ', 'Lava, ') + pl, note: same + nk, options: [{ id: 'pall', label: T('Pallfrakt, ', 'Lavarahti, ') + pl, text: why + same + nk, price: pp }] };
      }
      if (has.skrym) return home(T('Stora lock levereras hem. ', 'Isot kannet toimitetaan kotiin. '));
      return { price: FREIGHT_OMBUD_PRICE, key: 'ombud', label: T('Paket till ombud', 'Paketti noutopisteeseen'), note: nk.trim(), options: [
        { id: 'ombud', label: T('Paket till ombud', 'Paketti noutopisteeseen'), text: T('Hämta hos närmaste utlämningsställe.', 'Nouda lähimmästä noutopisteestä.') + nk, price: FREIGHT_OMBUD_PRICE },
        { id: 'dorr', label: T('Paket hem till dörren', 'Paketti kotiovelle'), text: T('Lämnas vid dörren eller kvitteras.', 'Jätetään ovelle tai kuitataan.'), price: FREIGHT_HOME_PRICE } ] };
    }
  };

  // Rahtiteksti yhdelle kappaleelle (kategoriakortti, tuotesivu): sama tulos kuin korissa yhdellä kappaleella.
  // it: catalog.js-tuote { n, fr, kg, price } tai tuoteapurin tuote. vat: 'exkl' näyttää hinnan ilman arvonlisäveroa (oletus SBVat).
  // Palauttaa esim. "Frakt från 172 kr", "Frakt 590 kr", "Hemleverans, tungt gods 1 240 kr" tai "Pallfrakt från 2 400 kr".
  window.SBFreight.unit = function (it, lang, vat) {
    lang = lang === 'sv' ? 'sv' : 'fi';
    if (!it) return '';
    if (it.price == null || it.fr === 'offert') return FR.offert[lang];
    var ex = (vat || window.SBVat.get()) === 'exkl';
    var fr = it.fr || window.SBFreight(it).key;
    var n = Array.isArray(it.n) ? it.n[0] : (it.n || it.name || (it.sv && it.sv[0]) || '');
    var pa = it.pt ? { type: it.pt, per: it.per } : palletOf({ fr: fr, n: n, perPall: it.perPall });
    var f = window.SBCart.freight([{ fr: fr, kg: it.kg, qty: 1, name: n, pt: pa && pa.type, per: pa && pa.per }], lang);
    if (f.later) return lang === 'sv' ? 'Frakt beräknas av oss' : 'Rahti lasketaan erikseen';
    var kr = Math.round(ex ? f.price / 1.25 : f.price).toLocaleString('sv-SE') + ' kr';
    var sv = lang === 'sv';
    if (f.key === 'ombud') return (sv ? 'Frakt från ' : 'Rahti alkaen ') + kr;
    if (f.key === 'skrym') return (sv ? 'Frakt ' : 'Rahti ') + kr;
    if (f.key === 'tung') return (sv ? 'Hemleverans, tungt gods ' : 'Kotiinkuljetus, raskas tavara ') + kr;
    return (sv ? 'Pallfrakt från ' : 'Lavarahti alkaen ') + kr;
  };

  // ---------- definitions ----------
  var defs = {};

  function scopeCss(css, name) {
    var pre = '[data-c="' + name + '"]';
    return css.replace(/([^{}]+)\{([^{}]*)\}/g, function (_, sel, body) {
      var parts = sel.split(',').map(function (p) {
        p = p.trim();
        if (!p || /^(html|body)\b/.test(p)) return '';
        return pre + ' ' + p + ', ' + pre + p.replace(/^[a-z]+/i, function (t) { return ':is(' + t + ')'; });
      }).filter(Boolean);
      return parts.length ? parts.join(', ') + '{' + body + '}' : '';
    });
  }

  function readDef(doc, scopeName) {
    var xdc = doc.querySelector('x-dc');
    var tpl = document.createDocumentFragment();
    if (xdc) {
      var helmet = xdc.querySelector('helmet');
      if (helmet) {
        Array.prototype.slice.call(helmet.childNodes).forEach(function (n) {
          if (n.nodeType !== 1) return;
          var c = document.importNode(n, true);
          if (scopeName && c.localName === 'style') c.textContent = scopeCss(c.textContent, scopeName);
          document.head.appendChild(c);
        });
        helmet.parentNode.removeChild(helmet);
      }
      Array.prototype.slice.call(xdc.childNodes).forEach(function (n) {
        tpl.appendChild(document.importNode(n, true));
      });
    }
    var script = doc.querySelector('script[type="text/x-dc"]');
    var Comp;
    if (script) {
      Comp = new Function('DCLogic', script.textContent + '\n;return typeof Component !== "undefined" ? Component : null;')(DCLogic);
    }
    return { tpl: tpl, Comp: Comp || DCLogic };
  }

  function collectImports(frag, out) {
    Array.prototype.forEach.call(frag.querySelectorAll ? frag.querySelectorAll('dc-import') : [], function (el) {
      var n = el.getAttribute('name');
      if (n && out.indexOf(n) < 0) out.push(n);
    });
    return out;
  }

  function loadDef(name) {
    if (defs[name]) return Promise.resolve(defs[name]);
    return fetch(name + '.dc.html', { cache: 'no-cache' }).then(function (r) { return r.text(); }).then(function (txt) {
      var doc = new DOMParser().parseFromString(txt, 'text/html');
      var def = readDef(doc, name);
      defs[name] = def;
      return Promise.all(collectImports(def.tpl, []).map(loadDef)).then(function () { return def; });
    });
  }

  // ---------- evaluation ----------
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var ONLY_HOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

  function lookup(expr, scope) {
    expr = expr.trim();
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    if (/^'.*'$|^".*"$/.test(expr)) return expr.slice(1, -1);
    var parts = expr.split('.');
    var cur;
    for (var i = scope.length - 1; i >= 0; i--) {
      if (scope[i] && Object.prototype.hasOwnProperty.call(scope[i], parts[0])) { cur = scope[i][parts[0]]; break; }
    }
    for (var j = 1; j < parts.length && cur != null; j++) cur = cur[parts[j]];
    return cur;
  }

  function attrVal(el, name, scope) {
    var raw = el.getAttribute(name) || '';
    var m = raw.match(ONLY_HOLE);
    return lookup(m ? m[1] : raw, scope);
  }

  function interp(str, scope) {
    return str.replace(HOLE, function (_, e) {
      var v = lookup(e, scope);
      return v == null || v === false ? '' : String(v);
    });
  }

  function camel(name) { return name.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }

  // ---------- render ----------
  var handlers = [];
  var instances = {};
  var rootDef = null;
  var mount = null;
  var BOOL = { checked: 1, disabled: 1, selected: 1, open: 1, hidden: 1, required: 1, readonly: 1, multiple: 1 };

  function build(nodes, scope, key, out) {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.nodeType === 3) { out.push(document.createTextNode(interp(n.nodeValue, scope))); continue; }
      if (n.nodeType !== 1) continue;
      var tag = n.localName;
      var k = key + '.' + i;
      if (tag === 'sc-for') {
        var list = attrVal(n, 'list', scope) || [];
        var as = n.getAttribute('as') || 'item';
        for (var j = 0; j < list.length; j++) {
          var s = {}; s[as] = list[j];
          build(n.childNodes, scope.concat([s]), k + '[' + j + ']', out);
        }
        continue;
      }
      if (tag === 'sc-if') {
        if (attrVal(n, 'value', scope)) build(n.childNodes, scope, k, out);
        continue;
      }
      if (tag === 'helmet') continue;
      if (tag === 'dc-import') {
        var name = n.getAttribute('name');
        var def = defs[name];
        if (!def) continue;
        var props = {};
        Array.prototype.forEach.call(n.attributes, function (a) {
          if (a.name === 'name' || a.name.indexOf('hint-') === 0) return;
          var m = a.value.match(ONLY_HOLE);
          props[camel(a.name)] = m ? lookup(m[1], scope) : interp(a.value, scope);
        });
        var inst = instances[k];
        if (!inst || inst.__def !== def) { inst = new def.Comp(props); inst.__def = def; instances[k] = inst; }
        else inst.props = props;
        var part = build(def.tpl.childNodes, [inst.renderVals() || {}], k, []);
        part.forEach(function (c) { if (c.nodeType === 1) c.setAttribute('data-c', name); out.push(c); });
        continue;
      }
      out.push(buildEl(n, scope, k));
    }
    return out;
  }

  function buildEl(n, scope, k) {
    var el = n.namespaceURI && n.namespaceURI !== 'http://www.w3.org/1999/xhtml'
      ? document.createElementNS(n.namespaceURI, n.localName)
      : document.createElement(n.localName);
    var selectValue;
    var evs = null;
    Array.prototype.forEach.call(n.attributes, function (a) {
      var nm = a.name;
      if (nm.indexOf('hint-') === 0) return;
      var m = a.value.match(ONLY_HOLE);
      if (m) {
        var v = lookup(m[1], scope);
        if (/^on[a-z]+$/.test(nm)) {
          if (typeof v === 'function') { evs = evs || {}; evs[nm.slice(2)] = v; }
          return;
        }
        if (nm === 'value' && n.localName === 'select') { selectValue = v; return; }
        if (BOOL[nm]) { if (v) el.setAttribute(nm, ''); return; }
        if (v == null || v === false) return;
        el.setAttribute(nm, String(v));
      } else {
        el.setAttribute(nm, a.value.indexOf('{{') >= 0 ? interp(a.value, scope) : a.value);
      }
    });
    if (evs) { handlers.push(evs); el.setAttribute('data-h', String(handlers.length - 1)); }
    var kids = build(n.localName === 'template' ? n.content.childNodes : n.childNodes, scope, k, []);
    kids.forEach(function (c) { el.appendChild(c); });
    if (selectValue !== undefined) {
      Array.prototype.forEach.call(el.querySelectorAll('option'), function (o) {
        var ov = o.hasAttribute('value') ? o.getAttribute('value') : o.textContent;
        if (String(ov) === String(selectValue)) o.setAttribute('selected', ''); else o.removeAttribute('selected');
      });
    }
    if (n.localName === 'a') {
      var href = el.getAttribute('href');
      if (href === '#') el.setAttribute('data-noop', '');
    }
    return el;
  }

  // ---------- patch ----------
  function syncAttrs(from, to) {
    var i, a;
    for (i = from.attributes.length - 1; i >= 0; i--) {
      a = from.attributes[i];
      if (!to.hasAttribute(a.name)) {
        if (a.name === 'open' && from.localName === 'details') continue;
        from.removeAttribute(a.name);
      }
    }
    for (i = 0; i < to.attributes.length; i++) {
      a = to.attributes[i];
      if (a.name === 'open' && from.localName === 'details') continue;
      if (from.getAttribute(a.name) !== a.value) from.setAttribute(a.name, a.value);
    }
    var tag = from.localName;
    if (tag === 'input') {
      var type = (to.getAttribute('type') || 'text').toLowerCase();
      if (type === 'checkbox' || type === 'radio') from.checked = to.hasAttribute('checked');
      else { var tv = to.getAttribute('value') || ''; if (from.value !== tv) from.value = tv; }
    } else if (tag === 'textarea') {
      if (from.value !== to.textContent) from.value = to.textContent;
    } else if (tag === 'option') {
      from.selected = to.hasAttribute('selected');
    }
  }

  function patch(from, to) {
    var fc = from.childNodes, tc = to.childNodes;
    var i;
    for (i = 0; i < tc.length; i++) {
      var t = tc[i], f = fc[i];
      if (!f) { from.appendChild(t.cloneNode(true)); continue; }
      if (f.nodeType !== t.nodeType || (f.nodeType === 1 && (f.localName !== t.localName || f.namespaceURI !== t.namespaceURI))) {
        from.replaceChild(t.cloneNode(true), f);
        continue;
      }
      if (f.nodeType === 3) { if (f.nodeValue !== t.nodeValue) f.nodeValue = t.nodeValue; continue; }
      if (f.nodeType === 1) { syncAttrs(f, t); patch(f, t); }
    }
    while (fc.length > tc.length) from.removeChild(from.lastChild);
    if (from.localName === 'select') {
      var sel = to.querySelector('option[selected]');
      if (sel) {
        var idx = Array.prototype.indexOf.call(to.querySelectorAll('option'), sel);
        if (from.selectedIndex !== idx) from.selectedIndex = idx;
      }
    }
  }

  function render() {
    if (!rootDef) return;
    handlers = [];
    if (!instances.root) instances.root = new rootDef.Comp({});
    var vals = instances.root.renderVals() || {};
    var fresh = document.createElement('div');
    build(rootDef.tpl.childNodes, [vals], 'root', []).forEach(function (c) { fresh.appendChild(c); });
    if (!mount.firstChild) {
      while (fresh.firstChild) mount.appendChild(fresh.firstChild);
    } else {
      patch(mount, fresh);
    }
  }

  // ---------- events ----------
  function findHandler(target, type) {
    var el = target && target.nodeType === 1 ? target : target && target.parentElement;
    while (el && el !== document.body) {
      var id = el.getAttribute && el.getAttribute('data-h');
      if (id != null && handlers[id] && handlers[id][type]) return handlers[id][type];
      el = el.parentElement;
    }
    return null;
  }

  function wire() {
    ['click', 'input', 'change'].forEach(function (type) {
      mount.addEventListener(type, function (e) {
        var h = findHandler(e.target, type);
        if (h) h(e);
        if (type === 'click') {
          var a = e.target.closest && e.target.closest('a[data-noop]');
          if (a) e.preventDefault();
        }
      });
    });
    mount.addEventListener('submit', function (e) {
      var h = findHandler(e.target, 'submit');
      // Lomake ilman käsittelijää mutta action-osoitteella (yläpalkin haku) lähtee tavalliseen tapaan
      if (!h && e.target.getAttribute && e.target.getAttribute('action')) return;
      e.preventDefault();
      if (h) h(e);
    });
  }

  function start() {
    var def = readDef(document);
    var xdc = document.querySelector('x-dc');
    mount = document.createElement('div');
    mount.id = 'sb-proto';
    if (xdc) xdc.parentNode.replaceChild(mount, xdc); else document.body.appendChild(mount);
    var names = collectImports(def.tpl, []);
    Promise.all(names.map(loadDef)).then(function () {
      rootDef = def;
      wire();
      render();
      if (location.hash) {
        var t = document.getElementById(location.hash.slice(1));
        if (t) t.scrollIntoView();
      }
    }).catch(function (err) {
      mount.textContent = 'Prototyypin lataus epäonnistui: ' + err;
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
