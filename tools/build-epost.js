// Generoi SvEpost.dc.html: kaikki kaupan lähettämät viestit yhdessä brändätyssä sähköpostipohjassa.
// Aja: node tools/build-epost.js (proto-kansiosta). Muokkaa viestit tänne, ei suoraan HTML:ään.
// {{teksti}} = paikkamerkki, jonka SB päättää (näkyy katkoviivalaatikkona).
const fs = require('fs');
const path = require('path');

const UP = 'https://www.svenskabrunnslock.se/wp-content/uploads/';
const P = {
  comp1050: { n: 'Lätt Brunnslock 1050 Composite', sku: '1055', price: 2645, img: UP + 'PLASTLOCK1050-RAK-BRUNN-STÄNGD.jpg' },
  ventil: { n: 'Avluftningsventil', sku: '1008', price: 569, img: UP + 'Avluftningsventil.jpg' },
  tp600: { n: 'Betongplint TP 600', sku: '600450', price: 921, img: UP + 'Betongplint-TP-600.jpg' },
  gjut: { n: 'Lätt brunnslock 580-670 A15 i gjutjärn', sku: '7015067', price: 2895, img: UP + '7015067.jpg' },
  ring: { n: 'Tätningsring 900/1100', sku: '30010', price: 875, img: UP + 'Tätningslister.png' }
};

const kr = (n) => {
  const r = Math.round(n * 100) / 100;
  return (Number.isInteger(r) ? r.toLocaleString('sv-SE') : r.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + ' kr';
};
const ph = (s) => s.replace(/\{\{(.+?)\}\}/g, '<span class="ph">$1</span>');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Esimerkkitilaukset. Rahti rahtimalli.md 3.2 mukaan, hinnat sis. alv.
const ORDERS = {
  privat: {
    no: 'SB-10231', date: '26 november 2026', mode: 'privat',
    lines: [['comp1050', 1], ['ventil', 1]],
    freight: { label: 'Frakt: hemleverans, paket', note: 'Kori 11 kg, ett stort lock: paket hem (regel 3)', price: 590 },
    info: [['Leveransadress', 'Anna Exempel, Exempelvägen 1, 123 45 Exempelstad'], ['Betalning', 'Kort via {{betalpartner, MAK1}}']]
  },
  foretag: {
    no: 'SB-10232', date: '26 november 2026', mode: 'foretag',
    lines: [['tp600', 3], ['gjut', 1]],
    freight: { label: 'Frakt: 1 pall (plintpall)', note: 'Kori 232 kg: plintpall, locket följer med (regel 5)', price: 2400 },
    info: [['Företag', 'Exempel Bygg AB, org.nr 556000-0000 (exempel)'], ['Er referens', 'Projekt Exempelgatan, Johan Exempel'], ['Leveransadress', 'Arbetsplats Exempelgatan 5, 123 45 Exempelstad'], ['Kontakt på plats', 'Johan Exempel, 070-123 45 67'], ['Betalning', 'Faktura, {{betalningsvillkor, P22}}']]
  },
  avbruten: {
    no: 'SB-10233', date: '26 november 2026', mode: 'privat',
    lines: [['comp1050', 1], ['ring', 1]],
    freight: { label: 'Frakt: hemleverans, paket', price: 590 },
    info: [['Leveransadress', 'Anna Exempel, Exempelvägen 1, 123 45 Exempelstad']]
  }
};

function orderBlock(o, opt = {}) {
  const ex = o.mode === 'foretag';
  const v = (n) => (ex ? n / 1.25 : n);
  let rows = o.lines.map(([id, q]) => {
    const p = P[id];
    return `<div class="e-line"><img src="${encodeURI(p.img)}" alt="" width="56" height="56"><div class="e-line-t"><b>${esc(p.n)}</b><span>Art.nr ${p.sku} · ${q} st à ${kr(v(p.price))}</span></div><b class="e-sum">${kr(v(p.price * q))}</b></div>`;
  }).join('');
  const goods = o.lines.reduce((t, [id, q]) => t + P[id].price * q, 0);
  const tot = goods + o.freight.price;
  rows += `<div class="e-row"><span>${esc(o.freight.label)}${o.freight.note && opt.freightNote ? `<small>${esc(o.freight.note)}</small>` : ''}</span><b>${kr(v(o.freight.price))}</b></div>`;
  if (ex) {
    rows += `<div class="e-row e-sep"><span>Summa exkl. moms</span><b>${kr(tot / 1.25)}</b></div><div class="e-row e-muted"><span>Moms 25 %</span><span>${kr(tot - tot / 1.25)}</span></div><div class="e-row e-total"><span>Att betala</span><span>${kr(tot)}</span></div>`;
  } else {
    rows += `<div class="e-row e-sep e-total"><span>Totalt inkl. moms</span><span>${kr(tot)}</span></div><div class="e-row e-muted"><span>varav moms 25 %</span><span>${kr(tot - tot / 1.25)}</span></div>`;
  }
  const info = (opt.info === false ? [] : o.info).map(([k, val]) => `<div class="e-kv"><span>${k}</span><span>${ph(val)}</span></div>`).join('');
  return `<div class="e-order"><div class="e-order-h"><b>${opt.heading || 'Beställning ' + o.no}</b><span>${o.date}</span></div>${rows}${info ? `<div class="e-info">${info}</div>` : ''}</div>`;
}

function stepsBlock(title, steps, done = 1) {
  return `<div class="e-steps"><b class="e-h2">${title}</b><ol>${steps.map((s, i) => `<li><span class="e-num${i < done ? ' on' : ''}">${i + 1}</span><span><b>${ph(s[0])}</b>${s[1] ? `<span>${ph(s[1])}</span>` : ''}</span></li>`).join('')}</ol></div>`;
}

const btn = (label, href, sub) => `<div class="e-btnwrap"><a class="e-btn" href="${href}">${label}</a>${sub ? `<span class="e-btnsub">${ph(sub)}</span>` : ''}</div>`;
const btn2 = (label, href) => `<a class="e-btn2" href="${href}">${label}</a>`;
const contact = (txt) => `<div class="e-contact"><b>${txt || 'Frågor om beställningen?'}</b><span>Svara på det här mejlet eller ring oss och uppge ordernumret.</span><a href="tel:+46920520056">0920-52 00 56</a></div>`;
const note = (who, txt) => `<div class="e-note"><span>${who}</span><p>${ph(txt)}</p></div>`;
const text = (html) => `<div class="e-text">${ph(html)}</div>`;
const kv = (rows) => `<div class="e-order"><div class="e-info">${rows.map(([k, v]) => `<div class="e-kv"><span>${k}</span><span>${ph(v)}</span></div>`).join('')}</div></div>`;

function head(kind) {
  const right = kind === 'admin' ? '<span class="e-headlink">Till butiken</span>' : kind === 'nshift' ? '<span class="e-headlink">Spårning via nShift</span>' : '<a class="e-headlink" href="SvKonto.dc.html">Mina sidor</a>';
  return `<div class="e-head"><span class="e-logo">LOGO Svenska Brunnslock</span>${right}</div>`;
}
function foot(kind) {
  const co = '<p><b>Svenska Brunnslock</b> · {{bolagsnamn, org.nr och adress}}</p><p>0920-52 00 56 · {{e-postadress}}</p>';
  const links = '<p><a href="#">Köpvillkor</a> · <a href="#">Frakt och leverans</a> · <a href="#">Integritetspolicy</a></p>';
  if (kind === 'mkt') return `<div class="e-foot">${ph(co)}${links}<p>Du får det här mejlet för att du har anmält dig till vårt nyhetsbrev. <a href="#">Avregistrera dig</a> · <a href="#">Ändra inställningar</a></p></div>`;
  if (kind === 'admin') return `<div class="e-foot"><p>Internt mejl från butiken. Skickas inte till kunden.</p></div>`;
  if (kind === 'nshift') return `<div class="e-foot">${ph(co)}<p>Skickas av nShift Track för Svenska Brunnslock. Bara om leveransen, ingen marknadsföring.</p></div>`;
  return `<div class="e-foot">${ph(co)}${links}<p>Du får det här mejlet för att du har handlat eller skapat konto hos oss. Det innehåller ingen marknadsföring.</p></div>`;
}
const title = (h, p) => `<div class="e-title"><h3>${h}</h3>${p ? `<p>${ph(p)}</p>` : ''}</div>`;

// ---------- Viestit ----------
const FROM = 'Svenska Brunnslock &lt;{{order-adress}}&gt;';
const NEXT_STEPS_ORDER = [
  ['Orderbekräftelse', 'Det här mejlet. Spara det, ordernumret behövs om du hör av dig.'],
  ['Vi beställer från leverantören', 'Leveranstid: {{leveranstid som SB anger per produkt}}.'],
  ['Spårningslänk när det skickas', 'Du får ett mejl med spårningslänk. Du ser den också på Mina sidor.'],
  ['Leverans till din adress', '']
];

const GROUPS = [
  ['order', 'Beställning'], ['leverans', 'Leverans'], ['offert', 'Offert'], ['konto', 'Konto'], ['faktura', 'Faktura'], ['mkt', 'Marknadsföring']
];

const D24 = JSON.parse(fs.readFileSync(path.join(__dirname, 'epost-d24.json'), 'utf8')); // Förslag D24 (frakt beräknas av oss), tillagt 26.11.
const M = [
  // ----- Beställning
  { id: 'ny-bestallning', g: 'order', name: 'Ny beställning (till SB)', status: 'launch', sys: 'WooCommerce', woo: 'Ny beställning (standard)',
    trigger: 'Kunden lägger en beställning (status Behandlas eller Pausad).', from: 'Butiken &lt;{{order-adress}}&gt;', to: 'SB: {{orderinkorg, P35}}',
    subject: '[Svenska Brunnslock] Ny beställning SB-10232 från Exempel Bygg AB', pre: 'Faktura, 1 pall, 8 058 kr. Fakturan väntar på godkännande.', foot: 'admin', head: 'admin',
    body: () => title('Ny beställning SB-10232', 'Exempel Bygg AB vill betala mot faktura. Ordern står som <b>Pausad</b> tills ni har godkänt fakturan.') +
      orderBlock(ORDERS.foretag, { freightNote: true }) + btn('Öppna ordern i admin', '#', 'Godkänn fakturan: ändra status till Behandlas.') },

  { id: 'behandlas', g: 'order', name: 'Orderbekräftelse (Behandlas)', status: 'launch', sys: 'WooCommerce', woo: 'Behandlar order (standard)',
    trigger: 'Betalningen är godkänd och ordern får status Behandlas. Exempel: privatkund, kort.', from: FROM, to: 'Kunden (Anna Exempel, privat)',
    subject: 'Tack för din beställning SB-10231', pre: 'Lätt Brunnslock 1050 Composite med mera, 3 804 kr inkl. moms och frakt.',
    body: () => title('Tack för din beställning!', 'Hej Anna, vi har tagit emot din beställning och betalningen. Här är en sammanfattning.') +
      orderBlock(ORDERS.privat, { freightNote: true }) + stepsBlock('Så går det till nu', NEXT_STEPS_ORDER) + btn('Se din beställning', 'SvKonto.dc.html', 'Utan konto: ordernummer och e-post räcker när du hör av dig.') + contact() },

  { id: 'frakt-beraknas', g: 'order', name: 'Orderbekräftelse, frakt beräknas av oss', status: 'decide', sys: 'WooCommerce', woo: 'Behandlar order (standard)',
    trigger: D24['frakt-beraknas'].trigger, from: FROM, to: 'Kunden (Anna Exempel, privat)',
    subject: 'Tack för din beställning SB-10482', pre: D24['frakt-beraknas'].pre,
    body: () => D24['frakt-beraknas'].body },

  { id: 'frakt-betala', g: 'order', name: 'Frakt att betala', status: 'decide', sys: 'WooCommerce', woo: 'Nytt mejl med betalningslänk från {{betalpartner, MAK1}}',
    trigger: D24['frakt-betala'].trigger, from: FROM, to: 'Kunden (Anna Exempel, privat)',
    subject: 'Frakt att betala för SB-10482', pre: D24['frakt-betala'].pre,
    body: () => D24['frakt-betala'].body },

  { id: 'pausad', g: 'order', name: 'Beställningen väntar (Pausad, faktura)', status: 'launch', sys: 'WooCommerce', woo: 'Pausad order (standard)',
    trigger: 'Företag väljer faktura. Ordern pausas tills SB har godkänt fakturan (P22, P37).', from: FROM, to: 'Kunden (Exempel Bygg AB)',
    subject: 'Vi har tagit emot din beställning SB-10232', pre: 'Vi kontrollerar fakturaunderlaget och hör av oss, sedan beställer vi.',
    body: () => title('Vi har tagit emot din beställning', 'Hej Johan, tack för beställningen. Ni har valt faktura, så vi kontrollerar uppgifterna innan vi beställer från leverantören. Det tar {{tid som SB bestämmer}}.') +
      orderBlock(ORDERS.foretag, { freightNote: true }) +
      stepsBlock('Så går det till nu', [['Beställningen är mottagen', ''], ['Vi godkänner fakturaunderlaget', 'Inget nytt mejl när det är klart. Går det inte, ringer vi.'], ['Vi beställer och skickar', 'Spårningslänk med e-post när pallen lämnar leverantören.'], ['Faktura från Fortnox', 'Kommer i ett separat mejl, med PDF.']]) +
      contact() },

  { id: 'kundnotering', g: 'order', name: 'Meddelande om beställningen (kundnotering)', status: 'launch', sys: 'WooCommerce', woo: 'Kundnotering (standard)',
    trigger: 'SB skriver en notering till kunden i ordern i admin.', from: FROM, to: 'Kunden',
    subject: 'Ett meddelande om din beställning SB-10232', pre: 'Plintarna och locket kommer från olika leverantörer.',
    body: () => title('Ett meddelande om din beställning', 'Hej Johan, vi har lagt till en notering i beställning SB-10232:') +
      note('Från Svenska Brunnslock', 'Plintarna och gjutjärnslocket kommer från olika leverantörer och kan komma i två leveranser. Du får en spårningslänk för varje leverans. Frakten betalar du bara en gång.') +
      btn('Se din beställning', 'SvKonto.dc.html') + contact() },

  { id: 'avbruten', g: 'order', name: 'Beställningen är avbruten', status: 'launch', sys: 'WooCommerce', woo: 'Avbruten order (standard till SB, kundversion föreslås)',
    trigger: 'SB avbryter ordern, eller en obetald order går ut.', from: FROM, to: 'Kunden och SB',
    subject: 'Din beställning SB-10233 är avbruten', pre: 'Beställningen går inte vidare. Vill du beställa igen?',
    body: () => title('Din beställning är avbruten', 'Hej Anna, beställning SB-10233 är avbruten och skickas inte. {{orsak, om SB skriver en}}') +
      orderBlock(ORDERS.avbruten, { info: false }) + btn('Beställ igen', 'SvVarukorg.dc.html', 'Lägger samma produkter i varukorgen.') + contact('Var det fel?') },

  { id: 'misslyckad', g: 'order', name: 'Betalningen gick inte igenom (Misslyckad)', status: 'launch', sys: 'WooCommerce', woo: 'Misslyckad order (standard till SB, kundversion föreslås)',
    trigger: 'Betalningen avvisas eller avbryts i betalfönstret.', from: FROM, to: 'Kunden och SB',
    subject: 'Betalningen för SB-10233 gick inte igenom', pre: 'Beställningen är sparad. Du kan försöka igen med samma eller ett annat betalsätt.',
    body: () => title('Betalningen gick inte igenom', 'Hej Anna, vi fick inte betalningen för beställning SB-10233. Beställningen är sparad, så du behöver inte börja om.') +
      orderBlock(ORDERS.avbruten, { info: false }) + btn('Betala nu', 'SvKassa.dc.html', 'Öppnar betalningen för samma beställning.') + contact('Fungerar det inte?') },

  { id: 'aterbetald', g: 'order', name: 'Återbetalning', status: 'launch', sys: 'WooCommerce', woo: 'Återbetald order (standard, hel eller delvis)',
    trigger: 'SB gör en återbetalning i ordern (hela eller del).', from: FROM, to: 'Kunden',
    subject: 'Återbetalning för beställning SB-10231', pre: '569 kr återbetalas till samma betalsätt.',
    body: () => title('Vi har gjort en återbetalning', 'Hej Anna, vi har återbetalat en del av beställning SB-10231.') +
      kv([['Produkt', 'Avluftningsventil, 1 st'], ['Återbetalt', '569 kr inkl. moms'], ['Till', 'Samma betalsätt som du använde'], ['När syns pengarna?', '{{enligt betalpartnerns villkor}}']]) + contact() },

  // ----- Leverans
  { id: 'skickad', g: 'leverans', name: 'Din beställning är skickad (Skickad, ny)', status: 'launch', sys: 'WooCommerce', woo: 'Ny status och nytt mejl: Skickad',
    trigger: 'SB sätter status Skickad och sparar spårningskod och länk på ordern (P55). Koden kan komma från nShift (P54).', from: FROM, to: 'Kunden (Exempel Bygg AB)',
    subject: 'Din beställning SB-10232 är skickad', pre: 'Följ pallen hos transportören. Spårningskoden finns också på Mina sidor.',
    body: () => title('Din beställning är skickad', 'Hej Johan, pallen med beställning SB-10232 har lämnat leverantören.') +
      kv([['Transportör', '{{transportör, t.ex. DHL}}'], ['Spårningskod', '00340434161094015902 (exempel)'], ['Leveransadress', 'Arbetsplats Exempelgatan 5, 123 45 Exempelstad'], ['Kontakt på plats', 'Johan Exempel, 070-123 45 67']]) +
      btn('Spåra försändelsen', '#', 'Öppnar transportörens spårningssida.') + btn2('Se ordern på Mina sidor', 'SvKonto.dc.html') +
      stepsBlock('Leveransen', [['Skickad', 'I dag'], ['Transportören kontaktar dig', 'Om tid för lossning: {{hur, enligt transportör}}'], ['Pallen levereras', 'Lossning vid gatan. Kranbil eller bakgavellyft om det är valt (P28).']], 1) +
      orderBlock(ORDERS.foretag, { heading: 'Det här skickas', info: false }) + contact('Frågor om leveransen?') },

  { id: 'slutford', g: 'leverans', name: 'Tack för ditt köp (Slutförd)', status: 'decide', sys: 'WooCommerce', woo: 'Slutförd order (standard)',
    trigger: 'SB sätter status Slutförd efter leveransen. Skickas eller stängs av (Skickad har redan informerat).', from: FROM, to: 'Kunden',
    subject: 'Tack för ditt köp, SB-10231', pre: 'Beställningen är klar. Här hittar du produktblad och anvisningar.',
    body: () => title('Tack för ditt köp', 'Hej Anna, beställning SB-10231 är levererad och avslutad.') +
      orderBlock(ORDERS.privat, { heading: 'Du har köpt', info: false }) +
      text('<p><b>Produktblad och anvisningar</b> finns på produktsidan för varje produkt. Kunden kan också öppna dem från ordern på Mina sidor.</p>') +
      btn('Se din beställning', 'SvKonto.dc.html') + contact('Något som inte stämmer?') },

  { id: 'nshift-track', g: 'leverans', name: 'Leveransaviseringar (nShift Track)', status: 'k54', sys: 'nShift Track',
    trigger: 'Transportörens händelser: på väg, levereras i dag, levererad, försenad.', from: 'Svenska Brunnslock via nShift', to: 'Kunden (e-post, sms senare)',
    subject: 'Din leverans från Svenska Brunnslock kommer i dag', pre: 'Beställning SB-10231. Följ paketet live.', foot: 'nshift', head: 'nshift',
    body: () => title('Din leverans kommer i dag', 'Hej Anna, paketet med beställning SB-10231 är ute för leverans.') +
      stepsBlock('Paketets väg', [['Skickad', '{{datum}}'], ['På väg', '{{datum}}'], ['Ute för leverans', 'I dag'], ['Levererad', '']], 3) +
      btn('Följ leveransen', '#', 'nShift Track-sida med Svenska Brunnslocks logga.') + contact('Frågor om leveransen?') },

  // ----- Offert
  { id: 'offert-mottagen', g: 'offert', name: 'Offertförfrågan mottagen (OF-nummer)', status: 'launch', sys: 'WooCommerce', woo: 'Nytt mejl (offertformuläret)',
    trigger: 'Kunden skickar offertformuläret eller en varukorg med offertprodukter.', from: FROM, to: 'Kunden (Exempel Bygg AB)',
    subject: 'Vi har tagit emot din offertförfrågan OF-1042', pre: 'Du får offerten inom {{svarstid, D15}}.',
    body: () => title('Tack, vi har tagit emot din förfrågan', 'Hej Johan, din förfrågan har nummer <b>OF-1042</b>. Ange numret om du hör av dig.') +
      kv([['Produkter', 'Lätt Brunnslock 1050 Composite, 10 st<br>Tätningsring 900/1100, 10 st'], ['Leverans', 'Till postnummer 123 45, så snart som möjligt'], ['Lossning', 'Vi behöver kranbil'], ['Bilaga', 'mangdforteckning.pdf']]) +
      stepsBlock('Så går det till nu', [['Förfrågan är mottagen', ''], ['Vi räknar på produkter, frakt och lossning', 'Svar inom {{svarstid, D15}}.'], ['Du får offerten med e-post', 'Godkänn med ett klick, eller be om ändring.']]) + contact('Vill du ändra något?') },

  { id: 'offert-ny-sb', g: 'offert', name: 'Ny offertförfrågan (till SB)', status: 'launch', sys: 'WooCommerce', woo: 'Nytt mejl (offertformuläret)',
    trigger: 'Samma som ovan. Vart förfrågan går är öppet (P35).', from: 'Butiken &lt;{{order-adress}}&gt;', to: 'SB: {{offertinkorg, P35}}',
    subject: '[Svenska Brunnslock] Ny offertförfrågan OF-1042 från Exempel Bygg AB', pre: '2 produkter, postnummer 123 45, kranbil, bilaga.', foot: 'admin', head: 'admin',
    body: () => title('Ny offertförfrågan OF-1042', 'Svara inom {{svarstid, D15}}.') +
      kv([['Företag', 'Exempel Bygg AB, org.nr 556000-0000 (exempel)'], ['Kontakt', 'Johan Exempel, 070-123 45 67, johan@exempel.se'], ['Produkter', 'Lätt Brunnslock 1050 Composite, 10 st (webbpris 2 645 kr)<br>Tätningsring 900/1100, 10 st (webbpris 875 kr)'], ['Leverans', 'Postnummer 123 45, så snart som möjligt, kranbil'], ['Meddelande', '”Till nytt bostadsområde, etapp 1.”'], ['Bilaga', 'mangdforteckning.pdf']]) +
      btn('Öppna förfrågan', '#', 'Skapa offerten i {{butiken eller Fortnox, P36}}.') },

  { id: 'offert-klar', g: 'offert', name: 'Din offert är klar (godkänn med ett klick)', status: 'launch', sys: 'WooCommerce', woo: 'Nytt mejl (förslag, P35 och P36 öppna)',
    trigger: 'SB skickar offerten. Kunden godkänner med ett klick och offerten blir en order.', from: FROM, to: 'Kunden (Exempel Bygg AB)',
    subject: 'Din offert OF-1042 är klar', pre: '25 920 kr exkl. moms för produkterna. Frakt och lossning ingår i offerten. Giltig i 30 dagar.',
    body: () => title('Din offert är klar', 'Hej Johan, här är offerten för förfrågan OF-1042. Priserna gäller i 30 dagar.') +
      `<div class="e-order"><div class="e-order-h"><b>Offert OF-1042</b><span>Giltig i 30 dagar</span></div>
<div class="e-line"><img src="${encodeURI(P.comp1050.img)}" alt="" width="56" height="56"><div class="e-line-t"><b>Lätt Brunnslock 1050 Composite</b><span>10 st à 1 948 kr</span></div><b class="e-sum">19 480 kr</b></div>
<div class="e-line"><img src="${encodeURI(P.ring.img)}" alt="" width="56" height="56"><div class="e-line-t"><b>Tätningsring 900/1100</b><span>10 st à 644 kr</span></div><b class="e-sum">6 440 kr</b></div>
<div class="e-row"><span>Frakt och lossning med kranbil<small>Till postnummer 123 45</small></span><b>${ph('{{SB anger}}')}</b></div>
<div class="e-row e-sep"><span>Summa exkl. moms</span><b>25 920 kr + frakt</b></div><div class="e-row e-muted"><span>Moms 25 % tillkommer</span><span></span></div></div>` +
      btn('Godkänn och beställ', 'SvOffert.dc.html', 'Ett klick: offerten blir en order. Inget nytt formulär.') + btn2('Be om ändring', 'mailto:') + contact('Frågor om offerten?') },

  // ----- Konto
  { id: 'nytt-konto', g: 'konto', name: 'Välkommen, ditt konto är skapat', status: 'launch', sys: 'WooCommerce', woo: 'Nytt konto (standard)',
    trigger: 'Kunden skapar konto i kassan, på Tack-sidan eller på Mina sidor.', from: FROM, to: 'Kunden',
    subject: 'Ditt konto hos Svenska Brunnslock är skapat', pre: 'Se ordrar, spårning och fakturor på ett ställe.',
    body: () => title('Välkommen!', 'Hej Johan, ditt konto för johan@exempel.se är skapat.') +
      stepsBlock('Det här finns på Mina sidor', [['Ordrar och spårning', 'Status och spårningslänk för varje order.'], ['Offerter', 'Godkänn eller be om ändring.'], ['Fakturor', '{{om SB visar fakturor från Fortnox, P39}}'], ['Adresser', 'Spara arbetsplatser och fakturaadress.']], 0) +
      btn('Gå till Mina sidor', 'SvKonto.dc.html') + text('<p>Du har inte bett om ett konto? Svara på mejlet så tar vi bort det.</p>') },

  { id: 'aterstall', g: 'konto', name: 'Återställ lösenord', status: 'launch', sys: 'WooCommerce', woo: 'Återställ lösenord (standard)',
    trigger: 'Kunden klickar ”Glömt lösenord?” och anger sin e-post.', from: FROM, to: 'Kunden',
    subject: 'Återställ ditt lösenord hos Svenska Brunnslock', pre: 'Länken gäller en gång.',
    body: () => title('Återställ ditt lösenord', 'Hej Johan, någon har bett om ett nytt lösenord för johan@exempel.se.') +
      btn('Välj nytt lösenord', 'SvKonto.dc.html', 'Länken gäller en gång.') + text('<p>Var det inte du? Då kan du strunta i mejlet. Ditt lösenord ändras inte.</p>') },

  // ----- Faktura
  { id: 'faktura', g: 'faktura', name: 'Faktura (från Fortnox)', status: 'launch', sys: 'Fortnox', woo: 'Fortnox e-postfaktura, inte butiken',
    trigger: 'SB skapar fakturan i Fortnox från ordern (TIK1) och skickar den med e-post. Gäller företag på faktura. Privatpersonens faktura kommer från betalpartnern (MAK3).', from: 'Svenska Brunnslock via Fortnox, svar till {{SB:s adress}}', to: 'Kundens fakturaadress (Exempel Bygg AB)',
    subject: 'Faktura {{nr}} från Svenska Brunnslock', pre: 'Faktura för beställning SB-10232, 8 058 kr. Förfaller {{datum}}.', foot: 'trans',
    body: () => title('Faktura från Svenska Brunnslock', 'Hej, här kommer fakturan för beställning SB-10232. Fakturan finns som PDF i mejlet.') +
      `<div class="e-attach"><span class="e-pdf">PDF</span><span><b>Faktura_{{nr}}.pdf</b><small>Bifogad fil, skapad i Fortnox</small></span></div>`.replace(/\{\{(.+?)\}\}/g, '<span class="ph">$1</span>') +
      kv([['Fakturanummer', '{{nr från Fortnox}}'], ['Er referens', 'Projekt Exempelgatan, Johan Exempel'], ['Ordernummer', 'SB-10232'], ['Fakturadatum', '{{datum}}'], ['Förfallodatum', '{{betalningsvillkor, P22}}'], ['Att betala', '8 058 kr (varav moms 1 611,60 kr)'], ['Betala till', 'Bankgiro {{nr}}, OCR {{nr}}']]) +
      text('<p><b>PDF:en innehåller:</b> fakturarader som i ordern (Betongplint TP 600, 3 st, Lätt brunnslock 580-670 A15 i gjutjärn, 1 st, frakt 1 pall), belopp exkl. moms, moms 25 %, att betala, SB:s org.nr och momsreg.nr, dröjsmålsränta enligt {{villkor}}.</p>') +
      text('<p class="e-small">Mejlet följer Fortnox mall: logga, text och avsändarnamn går att ändra, layouten inte.</p>') },

  // ----- Marknadsföring
  { id: 'nyhetsbrev-bekrafta', g: 'mkt', name: 'Bekräfta prenumerationen (dubbel opt-in)', status: 'decide', sys: 'Klaviyo',
    trigger: 'Kunden kryssar i nyhetsbrevet i kassan eller anmäler sig i sidfoten (VIE6). Används om SB väljer dubbel opt-in.', from: 'Svenska Brunnslock &lt;{{nyhetsbrev-adress}}&gt;', to: 'Den som anmälde sig',
    subject: 'Bekräfta din prenumeration', pre: 'Ett klick, sedan är du med.', foot: 'mkt',
    body: () => title('Bekräfta din prenumeration', 'Klicka på knappen så börjar vi skicka nyhetsbrevet till anna@exempel.se.') + btn('Ja, jag vill ha nyhetsbrevet', '#') + text('<p>Har du inte anmält dig? Då kan du strunta i mejlet.</p>') },

  { id: 'nyhetsbrev-valkommen', g: 'mkt', name: 'Välkommen till nyhetsbrevet', status: 'launch', sys: 'Klaviyo',
    trigger: 'Prenumerationen är bekräftad (eller direkt, utan dubbel opt-in).', from: 'Svenska Brunnslock &lt;{{nyhetsbrev-adress}}&gt;', to: 'Prenumeranten',
    subject: 'Välkommen till nyhetsbrevet från Svenska Brunnslock', pre: '{{vad nyhetsbrevet handlar om och hur ofta}}', foot: 'mkt',
    body: () => title('Välkommen!', 'Tack för att du prenumererar. I nyhetsbrevet får du {{innehåll och hur ofta, SB bestämmer}}.') +
      text('<p><b>Hitta rätt lock</b>: produktguiden frågar om brunnens mått och användning och visar lock som passar.</p>') + btn('Till produktguiden', 'SvProduktguide.dc.html') },

  { id: 'overgiven-varukorg', g: 'mkt', name: 'Du har produkter kvar i varukorgen', status: 'later', sys: 'Klaviyo',
    trigger: 'Varukorg med e-post (inloggad eller ifylld i kassan) utan beställning efter {{tid}} (VIE7). Bara enligt samtycke.', from: 'Svenska Brunnslock &lt;{{nyhetsbrev-adress}}&gt;', to: 'Kunden',
    subject: 'Du har produkter kvar i varukorgen', pre: 'Lätt Brunnslock 1050 Composite väntar. Frakten är uträknad.', foot: 'mkt',
    body: () => title('Glömde du något?', 'Hej Anna, din varukorg är sparad. Frakten är redan uträknad.') +
      orderBlock(ORDERS.privat, { heading: 'Din varukorg', info: false }) + btn('Fortsätt till kassan', 'SvVarukorg.dc.html') + contact('Osäker på storleken?') },

  { id: 'feedback', g: 'mkt', name: 'Hur gick det? (feedbackenkät)', status: 'later', sys: 'Klaviyo',
    trigger: '{{antal dagar}} efter Slutförd. Verktyg och frågor är öppna (K36).', from: 'Svenska Brunnslock &lt;{{nyhetsbrev-adress}}&gt;', to: 'Kunden',
    subject: 'Hur gick det med ditt lock?', pre: 'En fråga, tar tio sekunder.', foot: 'mkt',
    body: () => title('Hur gick det?', 'Hej Anna, passade Lätt Brunnslock 1050 Composite din brunn?') +
      '<div class="e-scale">' + ['1', '2', '3', '4', '5'].map((n) => `<a href="#">${n}</a>`).join('') + '</div><div class="e-scale-l"><span>Inte alls</span><span>Perfekt</span></div>' +
      text('<p>Ett klick räcker. Vill du skriva mer kommer du till en kort sida.</p>') }
];

// Genomgång 26.11.: behövs mejlet? keep = skickas, merge = variant av ett annat mejl, drop = skickas inte, later = senare.
const V = {
  'ny-bestallning': ['keep', 'SB:s signal att agera. WooCommerce-standard, kostar inget.'],
  'behandlas': ['keep', 'Krävs: orderbekräftelse och kvitto. En mall med två varianter (faktura, frakt beräknas av oss).'],
  'frakt-beraknas': ['merge', 'Variant av Orderbekräftelse: samma mejl, fraktraden säger Beräknas av oss (D24).'],
  'frakt-betala': ['keep', 'Kunden måste betala frakten. Behövs bara om SB väljer D24.'],
  'pausad': ['merge', 'Variant av Orderbekräftelse för fakturakunder. Inget extra mejl när SB godkänner fakturan.'],
  'kundnotering': ['keep', 'Bara när SB skriver något, t.ex. delad leverans. Standard, kostar inget.'],
  'avbruten': ['keep', 'Kunden måste veta att ordern inte kommer. Bara till kunden, SB:s kopia stängs av.'],
  'misslyckad': ['drop', 'Kunden ser felet direkt i kassan och betalar igen där. Standardmejlet till SB stängs av.'],
  'aterbetald': ['keep', 'Bekräftar återbetalningen. Standard, kostar inget.'],
  'skickad': ['keep', 'Spårningslänken. Det enda leveransmejlet vid lansering.'],
  'slutford': ['drop', 'Upprepar Skickad utan något nytt att göra. Status Slutförd blir intern.'],
  'nshift-track': ['later', 'Dubblerar Skickad. Bara om priset passar (K54), och då utan ett eget skickat-mejl.'],
  'offert-mottagen': ['keep', 'Kunden får OF-numret och vet att förfrågan kom fram.'],
  'offert-ny-sb': ['keep', 'Så når förfrågan SB (P35).'],
  'offert-klar': ['keep', 'Kunden måste godkänna offerten.'],
  'nytt-konto': ['keep', 'Standard: bekräftar kontot och inloggningen. Kostar inget.'],
  'aterstall': ['keep', 'Behövs för att inloggningen ska fungera.'],
  'faktura': ['keep', 'Krävs för fakturakunder. Fortnox mall, ingen egen design.'],
  'nyhetsbrev-bekrafta': ['drop', 'Enkel opt-in med kryssruta räcker (SB bekräftar). Ett steg mindre för kunden.'],
  'nyhetsbrev-valkommen': ['later', 'Behövs när SB börjar skicka nyhetsbrev, inte vid lansering.'],
  'overgiven-varukorg': ['later', 'Efter lansering, när det finns trafik att mäta.'],
  'feedback': ['later', 'Verktyg och frågor öppna (K36). Efter lansering.']
};
M.forEach((m) => { if (!V[m.id]) throw new Error('Beslut saknas: ' + m.id); m.v = V[m.id][0]; m.why = V[m.id][1]; });
const VERD = { keep: ['Skickas', 'st-launch'], merge: ['Slås ihop med Orderbekräftelse', 'st-decide'], drop: ['Skickas inte', 'st-later'], later: ['Senare', 'st-later'] };
const grpOf = (m) => (m.v === 'drop' ? 'drop' : m.v === 'later' ? 'later' : m.g);
const GROUPS2 = GROUPS.concat([['later', 'Senare'], ['drop', 'Skickas inte']]);
const CNT = (v) => M.filter((m) => m.v === v).length;

const STATUS = { launch: ['Vid lansering', 'st-launch'], later: ['Senare', 'st-later'], decide: ['SB bestämmer', 'st-decide'], k54: ['Vid lansering om priset passar (K54), annars senare', 'st-decide'] };

// ---------- Sivu ----------
function emailHtml(m, anno) {
  const a = (n) => (anno ? `<span class="anno">${n}</span>` : '');
  const kind = m.foot || 'trans';
  return `<div class="email${anno ? ' email-anno' : ''}">${a(1)}${head(m.head || kind)}<div class="e-body">${a(3)}${m.body()}</div>${a(8)}${foot(kind)}</div>`;
}

function clientHtml(m, anno) {
  return `<div class="client"><div class="client-meta">
<div><span>Från</span><span>${ph(m.from)}</span></div>
<div><span>Till</span><span>${ph(m.to)}</span></div>
<div><span>Ämne</span><b>${ph(m.subject)}</b></div>
<div class="client-pre"><span>${anno ? '<span class="anno anno-in">2</span> ' : ''}Förhandstext</span><span>${ph(m.pre)}</span></div>
</div><div class="client-body">${emailHtml(m, anno)}</div></div>`;
}

function section(m) {
  const [st, cls] = VERD[m.v];
  return `<section class="msg${m.v === 'drop' ? ' msg-off' : ''}" id="${m.id}" aria-labelledby="${m.id}-h">
<div class="msg-meta">
<div class="msg-top"><span class="chip ${cls}">${st}</span><span class="chip chip-sys">${m.sys}</span></div>
<h2 id="${m.id}-h">${m.name}</h2>
<dl>
<div><dt>Beslut 26.11.</dt><dd>${m.why}</dd></div>
<div><dt>Utlösare</dt><dd>${ph(m.trigger)}</dd></div>
<div><dt>System</dt><dd>${m.sys}${m.woo ? ` <span class="muted">(${ph(m.woo)})</span>` : ''}</dd></div>
<div><dt>Mottagare</dt><dd>${ph(m.to)}</dd></div>
<div><dt>Ämnesrad</dt><dd><b>${ph(m.subject)}</b></dd></div>
</dl>
<a class="toplink" href="#oversikt">Till översikten</a>
</div>
${clientHtml(m)}
</section>`;
}

const groupName = Object.fromEntries(GROUPS);
const overview = GROUPS2.map(([g, gn]) => `<div class="ov-group"><h3>${gn}</h3>${M.filter((m) => grpOf(m) === g).map((m) => {
  const [st, cls] = VERD[m.v];
  return `<a class="ov-row" href="#${m.id}"><span class="ov-name"><b>${m.name}</b><span class="chip ${cls}">${st}</span>${m.v === 'keep' ? '' : `<small class="ov-why">${m.why}</small>`}</span><span class="ov-trig">${ph(m.trigger)}</span><span class="ov-sys">${m.sys}</span><span class="ov-to">${ph(m.to)}</span><span class="ov-sub">${ph(m.subject)}</span></a>`;
}).join('')}</div>`).join('');

const nav = GROUPS2.map(([g, gn]) => `<li><b>${gn}</b><ul>${M.filter((m) => grpOf(m) === g).map((m) => `<li><a href="#${m.id}">${m.name}</a></li>`).join('')}</ul></li>`).join('');

const ANNO = [
  ['Sidhuvud', 'Logga (platshållare) och länk till Mina sidor. Internt mejl: ”Till butiken”.'],
  ['Förhandstext', 'Syns i inkorgen efter ämnesraden. Säger det viktigaste: summa, status eller nästa steg.'],
  ['Rubrik och ingress', 'Vad har hänt, med kundens namn och ordernummer.'],
  ['Ordersammanfattning', 'Rader med produktbild, art.nr och antal. Frakt enligt fraktregeln (rahtimalli 3.2). Privat: inkl. moms och varav moms. Företag: exkl. moms, moms 25 %, att betala.'],
  ['Status och nästa steg', 'Numrerade steg: vad som är klart och vad som händer sedan. Inga löften om tider som SB inte har bestämt.'],
  ['Knapp', 'En huvudknapp per mejl: spåra, betala, godkänn offert, se ordern. Full bredd i mobilen.'],
  ['Kontakt', 'Svara på mejlet eller ring 0920-52 00 56 med ordernumret.'],
  ['Sidfot', 'Företagsuppgifter, köpvillkor, frakt, integritet. Avregistrering bara i marknadsföring (Klaviyo).']
];

const flow = `<div class="flow" role="img" aria-label="Orderstatus och mejl">
<div class="flow-main">
<div class="fs"><b>Väntar på betalning</b><span>Inget mejl</span></div><span class="arr">→</span>
<div class="fs"><b>Behandlas</b><span>Orderbekräftelse + Ny beställning till SB</span></div><span class="arr">→</span>
<div class="fs fs-new"><b>Skickad (ny)</b><span>Spårningslänk</span></div><span class="arr">→</span>
<div class="fs"><b>Slutförd</b><span>Inget mejl (intern status)</span></div>
</div>
<div class="flow-side">
<div class="fs"><b>Pausad</b><span>Orderbekräftelse, fakturavariant</span></div>
<div class="fs"><b>Misslyckad</b><span>Inget mejl (felet syns i kassan)</span></div>
<div class="fs"><b>Avbruten</b><span>Beställningen är avbruten</span></div>
<div class="fs"><b>Återbetald</b><span>Återbetalning</span></div>
</div></div>`;

const CSS = fs.readFileSync(path.join(__dirname, 'epost.css'), 'utf8');

const html = `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>E-post från butiken</title>
<!-- Generoitu: node tools/build-epost.js. Älä muokkaa käsin. -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&amp;family=Inter:wght@400;500;600;700&amp;display=swap">
<style>
${CSS}
</style>
</head>
<body>
<header class="top"><a href="SvStartsida.dc.html" class="top-home">Svenska Brunnslock</a><span class="top-tag">Prototyp · E-post</span></header>
<div class="wrap">
<nav class="side" aria-label="Mejl">
<a href="#mall" class="side-a"><b>Mallen</b></a>
<a href="#oversikt" class="side-a"><b>Översikt</b></a>
<ul>${nav}</ul>
</nav>
<main>
<div class="intro">
<h1>E-post från butiken</h1>
<p class="sum">Genomgång 26.11.: ${M.length} meddelanden blev <b>${CNT('keep')} som skickas vid lansering</b> (2 av dem till SB). ${CNT('merge')} slås ihop med Orderbekräftelse, ${CNT('drop')} skickas inte och ${CNT('later')} kommer senare. <b>I en vanlig beställning får kunden 2 mejl:</b> Orderbekräftelse och Skickad. Fakturakund: 3, med fakturan från Fortnox. Om frakten beräknas av oss (D24): ett till, Frakt att betala.</p>
<p>En och samma mall för alla mejl. Texterna är exempel. Ordernummer, priser och kunder är exempel med riktiga produkter och priser från katalogen. <span class="ph">Streckad ruta</span> = SB bestämmer.</p>
<div class="width" role="group" aria-label="Bredd på mejlen"><span>Visa mejlen i</span><button type="button" data-w="375px">Mobil 375 px</button><button type="button" data-w="600px" aria-pressed="true">Dator 600 px</button></div>
</div>

<section id="mall" class="block" aria-labelledby="mall-h">
<h2 id="mall-h">Mallen: en för alla mejl</h2>
<p class="lead">Mobil först, högst 600 px bred. Gråskala i wireframen, produktbilder i färg. Samma delar i alla mejl, bara innehållet byts.</p>
<div class="anatomy">
<div class="anatomy-mail">${clientHtml({ ...M.find((m) => m.id === 'behandlas'), body: () => `<span class="anno">3</span>` + title('Tack för din beställning!', 'Hej Anna, vi har tagit emot din beställning och betalningen.') + '<span class="anno">4</span>' + orderBlock(ORDERS.privat, { freightNote: true }) + '<span class="anno">5</span>' + stepsBlock('Så går det till nu', NEXT_STEPS_ORDER) + '<span class="anno">6</span>' + btn('Se din beställning', 'SvKonto.dc.html') + '<span class="anno">7</span>' + contact() }, true).replace('<div class="e-body"><span class="anno">3</span>', '<div class="e-body">')}</div>
<ol class="anatomy-list">${ANNO.map(([h, t], i) => `<li><span class="anno">${i + 1}</span><span><b>${h}</b>${t}</span></li>`).join('')}</ol>
</div>
<h3 class="h3">Orderstatus och vilka mejl de skickar</h3>
${flow}
</section>

<section id="oversikt" class="block" aria-labelledby="ov-h">
<h2 id="ov-h">Översikt: utlösare, system, mottagare, ämnesrad</h2>
<div class="ov-head" aria-hidden="true"><span>Meddelande</span><span>Utlösare</span><span>System</span><span>Mottagare</span><span>Ämnesrad</span></div>
${overview}
</section>

${GROUPS2.map(([g, gn]) => `<div class="grp" id="grp-${g}"><h2 class="grp-h">${gn}</h2>${M.filter((m) => grpOf(m) === g).map(section).join('\n')}</div>`).join('\n')}
</main>
</div>
<script>
document.querySelectorAll('.width button').forEach(function (b) {
  b.addEventListener('click', function () {
    document.documentElement.style.setProperty('--mailw', b.dataset.w);
    document.querySelectorAll('.width button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
  });
});
</script>
</body>
</html>
`;

if (/[–—]/.test(html)) { console.error('Ajatusviiva löytyi, korjaa.'); process.exit(1); }
fs.writeFileSync(path.join(__dirname, '..', 'SvEpost.dc.html'), html);
console.log('SvEpost.dc.html', M.length, 'viestiä', html.length, 'merkkiä');
