# Poimii tuotedata-master.xlsx:n Products-sheetistä yleisen kategoriasivun datan proto/catalog.js:ään
import re, json, sys
from collections import defaultdict, Counter
sys.path.insert(0, __import__('os').path.dirname(__file__))
from xlsx_read import load
names, rows = load(__import__('os').path.join(__import__('os').path.dirname(__file__), '../../data/tuotedata-master.xlsx'), 2)
def na(v): return v is None or str(v).strip() in ('', 'n/a') or str(v).startswith('Not applicable')
def g(r, c): v = r.get(c); return None if na(v) else str(v).strip()
def num(v):
    try: f = float(str(v).replace(',', '.')); return int(f) if f == int(f) else f
    except: return None
def multi(v): return [x.strip() for x in v.split('|')] if v else []

CATS = [
 ('lock', 'Brunnslock och luckor', 'Kaivonkannet ja luukut', 'Brunnslock och luckor', [
   ('latta','Lätta brunnslock','Kevyet kaivonkannet'), ('plastbrunn','Lätta lock för plastbrunnar','Kevyet kannet muovikaivoihin'), ('plast','Brunnslock i plast','Muovikannet'),
   ('betong','Betonglock','Betonikannet'), ('gjutjarn','Lock och sil i gjutjärn','Valurautakannet ja sihdit'), ('luckor','Luckor','Luukut'),
   ('golv','Golv- och krypgrundsluckor','Lattia- ja ryömintätilan luukut'), ('sakerhet','Säkerhets- och evakueringsluckor','Turva- ja poistumisluukut'),
   ('kund','Kundanpassade luckor','Mittatilausluukut'), ('tillbehor','Locköppnare och tillbehör','Kannennostimet ja tarvikkeet')]),
 ('el', 'Elinfrastruktur', 'Sähköinfra', 'Elinfrastruktur', [
   ('kabelbrunn','Kabelbrunnar','Kaapelikaivot'), ('skarv','Skarv- och optobrunnar','Jatkos- ja optokaivot'), ('rannor','Kabelrännor','Kaapelikourut'),
   ('skyddsror','Kabelskyddsrör','Kaapelinsuojaputket'), ('flerfack','Flerfackskanaler','Monikanavaputket')]),
 ('bygg', 'Bygg', 'Rakentaminen', 'Bygg', [
   ('plintar','Betongplintar','Betoniplintit'), ('stolp','Stolpfundament och stolpskor','Pylväsperustukset ja pylväskengät'), ('markskruv','Markskruvar','Maaruuvit'),
   ('stegar','Glasfiberstegar','Lasikuitutikkaat'), ('fallskydd','Fallskydd','Putoamissuojaus')]),
 ('trafik', 'Trafik', 'Liikenne', 'Trafik', [
   ('gjutjarn','Gjutjärnsbetäckningar och gatugods','Valurautakannet ja katuvalut'), ('flyg','Betäckningar för flygplatser och hamnar','Lentokenttien ja satamien kannet'),
   ('trumogon','Trumögon','Rumpusilmät'), ('stolpar','Stolpar för bullerskärmar','Meluesteiden pylväät')]),
 ('jvg', 'Järnväg', 'Rautatie', 'Järnväg', [
   ('lock','Kabelbrunnslock i aluminium och durkplåt','Alumiini- ja ruutulevykannet'), ('fundament','Betongfundament och stolprör','Betoniperustukset ja pylväsputket'),
   ('planering','Planeringslåda för makadam','Sepelilaatikot'), ('stegjarn','Stegjärn och nedstigning','Kiipeilyraudat ja laskeutumistikkaat'),
   ('profiler','Profiler','Profiilit'), ('grod','Grod- och kräldjursevakuering','Sammakko- ja matelijaesteet'), ('ovrigt','Övrigt för kabelbrunnar','Muut kaapelikaivotarvikkeet')]),
 ('ent', 'Entreprenad och mark', 'Urakointi ja maarakennus', 'Entreprenad och mark', [
   ('brunnar','Brunnar för vatten och avlopp','Vesi- ja viemärikaivot'), ('pump','Pumpar och pumphus','Pumppaamot ja pumput'), ('avskiljare','Fett- och oljeavskiljare','Rasva- ja öljynerottimet'),
   ('tankar','Glasfibertankar','Lasikuitusäiliöt'), ('tryckror','Tryckrör','Paineputket'), ('forhojning','Förhöjningsringar','Korotusrenkaat'), ('stodmurar','Stödmurar','Tukimuurit'),
   ('geo','Geotextiler och markgaller','Geotekstiilit ja maaritilät'), ('spont','Plastspont och sjöledningsvikter','Muoviponttilevyt ja vesijohtopainot'), ('redskap','Redskap för hjullastare och grävmaskin','Työlaitteet pyöräkuormaajiin ja kaivinkoneisiin')]),
]
IA = {c[3]: c[0] for c in CATS}

def sub_of(cat, c0, name, mat, allc=''):
    n = name.lower()
    if cat == 'lock':
        if 'Avluftningsventil' in c0 or 'Locköppnare' in c0: return 'tillbehor'
        # Moni tuote on useassa kategoriassa; kevyiden kansien kategoria voittaa, vaikka se ei olisi ensimmäinen
        if re.search(r'Lätta Brunnslock > (Lätta brunnslock för betongbrunnar|Betongring)', allc): return 'latta'
        if c0.startswith('Lätta Brunnslock'): return 'latta'
        if c0.startswith('Gjutjärns betäckningar'): return 'latta' if 'Composite' in mat else 'gjutjarn'
        if c0.startswith('Brunnslock plast'): return 'plastbrunn' if re.search(r'rör|korrug|slät', n) else 'plast'
        if c0.startswith('Betonglock') or 'Betonglock med ingjuten' in c0: return 'betong'
        if c0.startswith('Lock och sil'): return 'gjutjarn'
        if re.search(r'Golvlucka|Inspektionsluckor|Krypgrund', c0): return 'golv'
        if 'Evakuering' in c0: return 'sakerhet'
        if 'Kundanpassade' in c0: return 'kund'
        return 'luckor'
    if cat == 'el':
        if 'Skarvlåda' in c0: return 'skarv'
        if c0.startswith('Kabelbrunnar'): return 'kabelbrunn'
        if 'Flerfack' in c0: return 'flerfack'
        if 'Broränna' in c0 or c0.startswith('Kabelrännor'): return 'rannor'
        return 'skyddsror'
    if cat == 'bygg':
        if 'Stolpskor' in c0: return 'stolp'
        if c0.startswith('Betongplintar'): return 'plintar'
        if c0.startswith('Markskruvar'): return 'markskruv'
        if c0.startswith('Glasfiberstegar'): return 'stegar'
        return 'fallskydd'
    if cat == 'trafik':
        if 'flygplatser' in c0: return 'flyg'
        if 'Trumögon' in c0: return 'trumogon'
        if 'bullerskärm' in c0: return 'stolpar'
        return 'gjutjarn'
    if cat == 'jvg':
        if re.search(r'Brunnslock i (Durkplåt|Aluminium)', c0): return 'lock'
        if re.search(r'Betong ?fundament|Fundament för 60', c0): return 'fundament'
        if 'Planeringslåda' in c0: return 'planering'
        if 'Stegjärn' in c0: return 'stegjarn'
        if re.search(r'profiler|Pendelskena', c0): return 'profiler'
        if 'Grod' in c0: return 'grod'
        return 'ovrigt'
    if cat == 'ent':
        for k, pat in [('brunnar','Brunnar Vatten'),('pump','Brunnsöverbyggnad|Pumpar'),('avskiljare','AVSKILJARE'),('tankar','Glasfibertankar'),('tryckror','Tryckrör'),
                       ('forhojning','Förhöjningsringar'),('stodmurar','Stödmurar'),('geo','Geotextil|Markgaller'),('spont','Plastspont|Sjöledning'),('redskap','Redskap')]:
            if re.search(pat, c0): return k
        return 'redskap'

def fr_of(cl, quote, model):
    if quote: return 'offert'
    if not cl: return 'ombud'
    if cl.startswith('Paket'): return 'skrym'
    if cl.startswith('Betongplintar'): return 'plint'
    return 'pall'

P = [r for r in rows[2:] if (r.get(216) or '').startswith(('Yes', 'Check'))]
items = []
for r in P:
    cat = IA[g(r, 56)]
    c0 = (g(r, 14) or '').split(' | ')[0]
    name = g(r, 1)
    mat = multi(g(r, 92))
    quote = g(r, 62) == 'Quote'
    price = num(g(r, 10)) or num(g(r, 9))
    if not price: quote = True
    kg = num(g(r, 94)) or (num(g(r, 16)) or None)
    it = dict(id=g(r, 0), n=name, sku=g(r, 60) or g(r, 6), cat=cat, sub=sub_of(cat, c0, name, mat, g(r, 14) or ''),
              cls=multi(g(r, 88)), mat=mat, price=None if quote else price, q=quote, kg=kg,
              rlo=num(g(r, 105)), rhi=num(g(r, 107)), ow=num(g(r, 125)), ol=num(g(r, 127)), il=num(g(r, 145)), iw=num(g(r, 147)),
              model=g(r, 159), h=num(g(r, 161)), fam=g(r, 207), sz=g(r, 209), dflt=g(r, 213) == 'Yes', sold=num(g(r, 215)) or 0,
              fr=fr_of(g(r, 20), quote, g(r, 159)))
    items.append({k: v for k, v in it.items() if v not in (None, [], False, '') or k in ('price',)})

def famname(pat, d, lst):
    # Kuvion #-kohdat: arvo pidetään, jos se on sama kaikilla perheen tuotteilla, muuten pudotetaan
    pt = re.sub(r'^SF\d+\s+', '', pat).split()
    toks = [x['n'].split() for x in lst]
    ref = d['n'].split()
    out = []
    for i, t in enumerate(pt):
        if '#' not in t:
            out.append(ref[i] if len(toks[0]) == len(pt) and i < len(ref) and ref[i].lower() == t.lower() else t); continue
        if all(len(tk) == len(pt) for tk in toks) and len(set(tk[i] for tk in toks)) == 1:
            out.append(ref[i])
    s = ' '.join(out)
    s = re.sub(r'\(\s*\)', '', s); s = re.sub(r'\s+mm\b', '', s); s = re.sub(r'\s{2,}', ' ', s).strip(' ,-.:')
    words = {w.lower(): w for w in ref}
    s = ' '.join(words.get(w.lower(), w) for w in s.split(' '))
    if s.count('(') < s.count(')'): s = re.sub(r'\s*\S*\)', '', s).strip()
    if len(s.split()) < 2: s = d['n']
    return s[:1].upper() + s[1:]
fams = {}
for it in items:
    if it.get('fam'):
        fams.setdefault(it['fam'], []).append(it)
fam_out = {}
for f, lst in fams.items():
    d = next((x for x in lst if x.get('dflt')), None) or max(lst, key=lambda x: x.get('sold', 0))
    fam_out[f] = dict(name=famname(f, d, lst), dflt=d['id'])
cats = [dict(id=c[0], sv=c[1], fi=c[2], subs=[dict(id=s[0], sv=s[1], fi=s[2]) for s in c[4]]) for c in CATS]
out = 'window.SB_CATALOG = ' + json.dumps(dict(cats=cats, fams=fam_out, items=items), ensure_ascii=False, separators=(',', ':')) + ';\n'
hdr = '// Yleisen kategoriasivun data: data/tuotedata-master.xlsx, sheet Products, siirrettävät tuotteet (sarake 216 Yes tai Check).\n// Generoitu: python3 tools/build-catalog.py. Älä muokkaa käsin.\n'
open(__import__('os').path.join(__import__('os').path.dirname(__file__), '../catalog.js'), 'w').write(hdr + out)
print(len(items), 'items', len(fam_out), 'families', round(len(out)/1024), 'kB')
# raportti
cnt = Counter((i['cat'], i['sub']) for i in items)
for c in CATS:
    print(c[1], {s[0]: cnt[(c[0], s[0])] for s in c[4]})
for f, v in fam_out.items(): print(f, '->', v['name'], len(fams[f]))
