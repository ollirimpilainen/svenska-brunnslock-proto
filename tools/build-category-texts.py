# Kategoriatekstit protoon: nykyisen kaupan kategoriakuvaukset (data/kategoriatekstit-nykyiset.json) uuden IA v2 -rakenteen kategorioille.
# Reseptit ja Genero-luonnokset: tools/category_texts_src.py. Suomennokset: tools/category-texts-fi.json.
# Ajo: python3 tools/build-category-texts.py  ->  category-texts.js (+ tools/category-texts-sv.json käännöspohjaksi)
import json, re, html as H, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from category_texts_src import RECIPES, FIXES, DROP, INTRO_WORDS

SRC = json.load(open(os.path.join(HERE, '../../data/kategoriatekstit-nykyiset.json'), encoding='utf-8'))
OLD, OLDFAQ = SRC['categories'], SRC['faq']

# ---------- siivous ----------
def dashes(s, heading=False):
    # Ollin sääntö: ei U+2013/U+2014. Välit yhdysmerkillä, välilyönnein erotettu viiva pilkuksi (otsikossa kaksoispisteeksi).
    s = re.sub(r'SS\s*[–—-]\s*EN', 'SS-EN', s)
    s = re.sub(r'(?<=\w)\s?[–—]\s?(?=\d)', '-', s) if False else s
    s = re.sub(r'(?<=[\w\d])[–—](?=[\w\d])', '-', s)
    s = re.sub(r'\s+[–—]\s+', ': ' if heading else ', ', s)
    s = re.sub(r'^[–—]\s*', '', s)
    return s.replace('–', '-').replace('—', '-')

def inline(s):
    s = re.sub(r'<br\s*/?>', ' ', s)
    s = re.sub(r'<[^>]+>', '', s)
    s = H.unescape(s).replace('\xa0', ' ')
    return re.sub(r'\s+', ' ', s).strip()

PROTECT = {'Svenska', 'Trafikverkets', 'Trafikverket', 'Arbetsmiljöverkets', 'Sverige', 'Skandinavien'}
def sentence_case(s):
    w = s.split(' ')
    out = []
    for i, x in enumerate(w):
        if i > 0 and len(x) > 1 and x[0].isupper() and x[1:].islower() and x not in PROTECT and not (x.startswith('Brunnslock') and out and out[-1] == 'Svenska'):
            x = x[0].lower() + x[1:]
        out.append(x)
    s = ' '.join(out)
    return s[0].upper() + s[1:] if s else s

def fix(s):
    for a, b in FIXES:
        s = s.replace(a, b)
    return s

def parse(d):
    """HTML -> segmentit: [{'h': otsikko tai None, 'blocks': [...]}]. [read]-shortcode merkitsi nykyisessä kaupassa Läs mer -rajan."""
    d = d.replace('\r', '')
    d = re.sub(r'\[/?read[^\]]*\]', '\n', d)
    d = re.sub(r'\[/?[a-z_-]+[^\]]*\]', '\n', d)
    d = re.sub(r'<(h[1-6])[^>]*>(.*?)</\1>', lambda m: '\n<%s>%s</%s>\n' % (m.group(1), inline(m.group(2)), m.group(1)), d, flags=re.S)
    d = re.sub(r'<(ul|ol)[^>]*>(.*?)</\1>', lambda m: '\n<UL>' + '||'.join(inline(x) for x in re.findall(r'<li[^>]*>(.*?)</li>', m.group(2), re.S)) + '</UL>\n', d, flags=re.S)
    d = re.sub(r'</?p[^>]*>', '\n', d)
    segs = [{'h': None, 'lvl': None, 'blocks': []}]
    for line in d.split('\n'):
        line = line.strip()
        if not line:
            continue
        m = re.match(r'<h([1-6])>(.*)</h[1-6]>$', line)
        if m:
            if m.group(2):
                segs.append({'h': fix(sentence_case(dashes(m.group(2), True))), 'lvl': int(m.group(1)), 'blocks': []})
            continue
        if line.startswith('<UL>'):
            segs[-1]['blocks'].append({'t': 'ul', 'items': [fix(dashes(i)) for i in line[4:-5].split('||') if i]})
            continue
        x = inline(line)
        if not x:
            continue
        # luettelorivit (* tai viiva rivin alussa) -> lista
        lm = re.match(r'^(?:\*|[–—-])\s+(.*)$', x)
        if lm:
            b = segs[-1]['blocks']
            item = fix(dashes(lm.group(1)))
            if b and b[-1]['t'] == 'ul' and b[-1].get('auto'):
                b[-1]['items'].append(item)
            else:
                b.append({'t': 'ul', 'items': [item], 'auto': True})
            continue
        x = fix(dashes(x))
        if x in DROP:
            continue
        segs[-1]['blocks'].append({'t': 'p', 'x': x})
    for s in segs:
        for b in s['blocks']:
            b.pop('auto', None)
        s['blocks'] = shape(s['blocks'])
    return segs

def term(x):
    return bool(re.search(r'[.!?:]$', x.strip()))

def shape(bl):
    # vähintään 2 peräkkäistä lyhyttä riviä ilman loppupistettä -> lista
    out, i = [], 0
    while i < len(bl):
        j = i
        while j < len(bl) and bl[j]['t'] == 'p' and words(bl[j]['x']) <= 14 and not term(bl[j]['x']):
            j += 1
        if j - i >= 2:
            out.append({'t': 'ul', 'items': [b['x'] for b in bl[i:j]]})
            i = j
        else:
            out.append(bl[i]); i += 1
    # lyhyt rivi ilman loppupistettä ennen kappaletta tai listaa -> väliotsikko
    for k, b in enumerate(out):
        if b['t'] == 'p' and words(b['x']) <= 8 and not term(b['x']) and k + 1 < len(out) and out[k + 1]['t'] in ('p', 'ul'):
            out[k] = {'t': 'h4', 'x': b['x']}
    return out

def join_lines(segs):
    # rikkinäinen PDF-rivitys: rivit yhdeksi kappaleeksi, tavutus pois
    ps = [b['x'] for b in segs[0]['blocks'] if b['t'] == 'p']
    if not ps:
        return segs
    t = ' '.join(ps)
    t = re.sub(r'(\w)- (\w)', r'\1\2', t)
    segs[0]['blocks'] = [{'t': 'p', 'x': t}]
    return segs

FILLER = re.compile(r'\s*Här (går vi igenom|diskuterar vi|utforskar vi)[^.]*\.')

def faq_of(slug):
    out = []
    for f in OLDFAQ.get(slug, []):
        paras = [fix(dashes(inline(p))) for p in re.split(r'</p>|<br\s*/?>\s*<br\s*/?>', f['a'])]
        out.append({'q': fix(dashes(inline(f['q']))), 'a': [p for p in paras if p]})
    return out

def norm(s):
    return re.sub(r'\W+', ' ', s.lower()).strip()

def words(s):
    return len(re.findall(r'\w+', s))

SENT = re.compile(r'(?<=[.!?])\s+(?=[A-ZÅÄÖ0-9])')

def build(key, R):
    blocks, seen, sources = [], set(), []
    for part in R.get('parts', []):
        path, sel, label = part[0], part[1] if len(part) > 1 else 'all', part[2] if len(part) > 2 else None
        old = OLD[path]
        segs = parse(old['html'])
        if path in R.get('join', []):
            segs = join_lines(segs)
        idx = range(len(segs)) if sel == 'all' else sel
        sources.append({'url': old['url'], 'name': old['name'], 'use': 'text'})
        secondary = bool(blocks) or label is not None
        if label:
            blocks.append({'t': 'h3', 'x': label})
        first_h = True
        for i in idx:
            s = segs[i]
            if s['h']:
                # ensisijainen lähde: h2 -> h3, h3+ -> h4. Toissijainen: label (tai sen ensimmäinen otsikko) h3, muut h4.
                if not secondary:
                    lvl = 'h3' if s['lvl'] <= 2 else 'h4'
                else:
                    lvl = 'h3' if (first_h and not label) else 'h4'
                first_h = False
                blocks.append({'t': lvl, 'x': s['h']})
            for b in s['blocks']:
                b = dict(b)
                if secondary and b['t'] == 'p':
                    b['x'] = FILLER.sub('', b['x']).strip()
                    if not b['x']:
                        continue
                k = norm(b.get('x', ' '.join(b.get('items', []))))
                if k in seen:
                    continue
                seen.add(k)
                blocks.append(b)
    for b in R.get('draft', []):
        blocks.append(dict(b, d=True))
    # tyhjät otsikot pois (otsikko, jonka jälkeen heti toinen otsikko tai loppu)
    clean = []
    for i, b in enumerate(blocks):
        if b['t'] in ('h3', 'h4'):
            nxt = blocks[i + 1] if i + 1 < len(blocks) else None
            if not nxt or (nxt['t'] in ('h3', 'h4') and not (b['t'] == 'h3' and nxt['t'] == 'h4')):
                continue
        clean.append(b)
    blocks = clean
    # intro: 1-2 ensimmäistä virkettä (enintään noin INTRO_WORDS sanaa) ensimmäisestä kunnon kappaleesta
    intro, intro_draft = '', False
    if R.get('intro'):
        intro, intro_draft = R['intro'], R.get('intro_draft', False)
    else:
        for i, b in enumerate(blocks):
            if b['t'] != 'p' or words(b['x']) < 6 or not re.search(r'[.!?]$', b['x'].strip()):
                continue
            if b['x'].rstrip().endswith(':'):
                continue
            sents = SENT.split(b['x'])
            take = [sents[0]]
            for s in sents[1:2]:
                if words(' '.join(take + [s])) <= INTRO_WORDS:
                    take.append(s)
                else:
                    break
            if R.get('intro_sents'):
                take = sents[:R['intro_sents']]
            intro = ' '.join(take)
            rest = ' '.join(sents[len(take):]).strip()
            intro_draft = bool(b.get('d'))
            if rest:
                blocks[i] = dict(b, x=rest)
            else:
                blocks.pop(i)
            break
    blocks = [b for i, b in enumerate(blocks) if not (b['t'] in ('h3', 'h4') and (i + 1 >= len(blocks) or (blocks[i + 1]['t'] in ('h3', 'h4') and not (b['t'] == 'h3' and blocks[i + 1]['t'] == 'h4'))))]
    seen_h3 = False
    for b in blocks:
        if b['t'] == 'h3': seen_h3 = True
        elif b['t'] == 'h4' and not seen_h3: b['t'] = 'h3'; seen_h3 = True
    faq, fseen = [], set()
    for slug in R.get('faq', []):
        if not any(s['url'].endswith('/' + slug) for s in sources):
            old = next(v for k, v in OLD.items() if k.split('/')[-1] == slug)
            sources.append({'url': old['url'], 'name': old['name'], 'use': 'faq'})
        else:
            for s in sources:
                if s['url'].endswith('/' + slug):
                    s['use'] = 'text+faq'
        for f in faq_of(slug):
            if norm(f['q']) in fseen:
                continue
            fseen.add(norm(f['q']))
            faq.append(f)
    for extra in R.get('also', []):
        old = OLD[extra]
        sources.append({'url': old['url'], 'name': old['name'], 'use': 'ingen text' if not old['html'].strip() else 'sammanfogad'})
    has_text = any(not b.get('d') for b in blocks) or (intro and not intro_draft)
    has_draft = any(b.get('d') for b in blocks) or intro_draft
    nsrc = len([s for s in sources if s['use'] != 'ingen text'])
    if not has_text:
        status = 'utkast'
    elif has_draft:
        status = 'befintlig + utkast' if nsrc <= 1 else 'kombinerad + utkast'
    else:
        status = 'befintlig' if nsrc <= 1 else 'kombinerad'
    wc = words(intro) + sum(words(b.get('x', ' '.join(b.get('items', [])))) for b in blocks)
    wf = sum(words(f['q']) + sum(words(a) for a in f['a']) for f in faq)
    return {'status': status, 'sources': sources, 'words': wc, 'faqWords': wf, 'check': R.get('check', ''),
            'sv': {'intro': intro, 'introDraft': intro_draft, 'blocks': blocks, 'faq': faq}}

out = {k: build(k, R) for k, R in RECIPES.items()}
json.dump({k: v['sv'] for k, v in out.items()}, open(os.path.join(HERE, 'category-texts-sv.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
fi_path = os.path.join(HERE, 'category-texts-fi.json')
FI = json.load(open(fi_path, encoding='utf-8')) if os.path.exists(fi_path) else {}
for k, v in out.items():
    if k in FI:
        f = FI[k]
        assert len(f['blocks']) == len(v['sv']['blocks']), k + ': fi blocks ' + str(len(f['blocks'])) + ' != sv ' + str(len(v['sv']['blocks']))
        v['fi'] = {'intro': f['intro'], 'introDraft': v['sv']['introDraft'], 'h': f.get('h', ''),
                   'blocks': [dict(sb, **({'x': fb['x']} if 'x' in sb else {'items': fb['items']})) for sb, fb in zip(v['sv']['blocks'], f['blocks'])],
                   'faq': f['faq']}
# tarkistus: ei ajatusviivoja missään
txt = json.dumps(out, ensure_ascii=False)
bad = [c for c in ('–', '—') if c in txt]
assert not bad, 'ajatusviiva datassa'
hdr = ('// Kategoriatekstit (IA v2): nykyisen kaupan kategoriakuvaukset siivottuina, yhdistettyinä ja jaettuina introksi ja leipätekstiksi.\n'
       '// status: befintlig = yksi vanha teksti, kombinerad = useasta vanhasta, utkast = Genero-luonnos (merkitty d: true / introDraft), SB tarkistaa.\n'
       '// sources: vanhat kategoria-URLit (use: text, faq, text+faq). Generoitu: python3 tools/build-category-texts.py. Älä muokkaa käsin.\n')
open(os.path.join(HERE, '../category-texts.js'), 'w', encoding='utf-8').write(hdr + 'window.SB_CATTEXT = ' + json.dumps(out, ensure_ascii=False) + ';\n')
for k, v in out.items():
    print('%-16s %-22s %4d w  faq %2d  src %d  intro %2d w' % (k, v['status'], v['words'], len(v['sv']['faq']), len(v['sources']), words(v['sv']['intro'])))
