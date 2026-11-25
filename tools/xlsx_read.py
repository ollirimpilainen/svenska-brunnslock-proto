import zipfile, re, sys, xml.etree.ElementTree as ET
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def load(path, sheet_index=0):
    z=zipfile.ZipFile(path)
    ss=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',NS):
            ss.append(''.join(t.text or '' for t in si.iter('{%s}t'%NS['m'])))
    wb=ET.fromstring(z.read('xl/workbook.xml'))
    sheets=[(s.get('name'),s.get('{%s}id'%NS['r'])) for s in wb.find('m:sheets',NS)]
    rels=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    rmap={r.get('Id'):r.get('Target') for r in rels}
    name,rid=sheets[sheet_index]
    tgt=rmap[rid]; tgt=tgt.lstrip('/'); tgt=tgt if tgt.startswith('xl/') else 'xl/'+tgt
    root=ET.fromstring(z.read(tgt))
    rows=[]
    def col(ref):
        c=re.match(r'[A-Z]+',ref).group(0); n=0
        for ch in c: n=n*26+ord(ch)-64
        return n-1
    for r in root.iter('{%s}row'%NS['m']):
        row={}
        for c in r.findall('m:c',NS):
            t=c.get('t'); v=c.find('m:v',NS); is_=c.find('m:is',NS)
            if t=='s' and v is not None: val=ss[int(v.text)]
            elif t=='inlineStr' and is_ is not None: val=''.join(x.text or '' for x in is_.iter('{%s}t'%NS['m']))
            else: val=v.text if v is not None else None
            row[col(c.get('r'))]=val
        rows.append(row)
    return [s[0] for s in sheets], rows
