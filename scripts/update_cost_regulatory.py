#!/usr/bin/env python3
import json,re,urllib.parse,urllib.request,xml.etree.ElementTree as ET
from datetime import datetime,timezone
from pathlib import Path

UA='PharmaHot/1.0 (+https://github.com/luli792366-commits/pharmahot)'

def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':UA})
    with urllib.request.urlopen(req,timeout=30) as r:return r.read()

def clean(s):
    return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',s or '')).strip()

def rss(url,source):
    out=[]
    try:
        root=ET.fromstring(get(url))
        for it in root.findall('.//item')[:40]:
            title=clean(it.findtext('title') or '')
            link=clean(it.findtext('link') or '')
            desc=clean(it.findtext('description') or '')
            date=clean(it.findtext('pubDate') or '')
            out.append({'title':title,'url':link,'summary':desc[:500],'date':date,'source':source})
    except Exception as e:print(source,'failed',e)
    return out

def google_news(q,hl='en-US',gl='US',ceid='US:en'):
    u='https://news.google.com/rss/search?'+urllib.parse.urlencode({'q':q,'hl':hl,'gl':gl,'ceid':ceid})
    return rss(u,'Google News')

def classify(x):
    s=(' '+x['title']+' '+x.get('summary','')+' ').lower()
    if any(k in s for k in ['companion diagnostic','companion diagnostics',' cdx ','biomarker assay','ivd','in vitro diagnostic','analytical validation','bridging study']):
        lane='CDx Development & Regulation'
        if any(k in s for k in ['guidance','fda','regulatory','approval','approved','pma','pilot program']):
            signal='Regulatory change'
            impact='May change CDx evidence, timing, vendor scope or co-development requirements.'
            action='Check whether biomarker strategy, assay validation, bridging or filing assumptions need to move earlier.'
        else:
            signal='Cost / execution signal'
            impact='May affect assay-development scope, testing volume, external lab/CRO spend or launch-readiness timing.'
            action='Check CDx vendor plan, sample strategy, validation package and contingency budget.'
    else:
        lane='Tox / NHP Cost & Capacity'
        if any(k in s for k in ['reduce animal','reducing animal','replace animal','non-human primate','nonhuman primate','nhp','new approach methodologies','nams','single relevant species']):
            signal='Regulatory / design opportunity'
            impact='Could reduce required animal use, study duration or total tox spend for eligible programs.'
            action='Ask Nonclinical whether current tox design can use NAMs, fewer animals/species or a streamlined package before locking CRO scope.'
        else:
            signal='Cost / capacity pressure'
            impact='Could raise GLP tox cost or extend study start dates through animal/CRO supply constraints.'
            action='Refresh tox budget, animal assumptions and CRO slot timing; secure capacity earlier if exposure is material.'
    x.update({'lane':lane,'signal':signal,'impact':impact,'action':action})
    return x

# Official regulatory anchors: these remain visible even when no new article is published.
official=[
 {'title':'FDA: Oncology Pharmaceuticals — Streamlined Nonclinical Safety Studies for Biologics and Conjugated Products','url':'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/oncology-pharmaceuticals-streamlined-nonclinical-safety-studies-biologics-and-conjugated-products','summary':'Draft guidance describing streamlined nonclinical safety approaches for certain oncology biologics and conjugated products, including ways to reduce unnecessary animal studies.','date':'2026-05-29','source':'FDA'},
 {'title':'FDA: Monoclonal Antibodies — Streamlined Nonclinical Safety Studies','url':'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/monoclonal-antibodies-streamlined-nonclinical-safety-studies','summary':'Draft guidance describes when long-term or additional animal toxicology studies may be reduced or unnecessary for certain monospecific monoclonal antibodies.','date':'2025-12-02','source':'FDA'},
 {'title':'FDA: New Approach Methodologies (NAMs)','url':'https://www.fda.gov/science-research/science-and-research-special-topics/new-approach-methodologies-nams','summary':'FDA hub for non-animal and human-relevant methods used to reduce, refine or replace traditional animal testing in drug development.','date':'2026','source':'FDA'},
 {'title':'FDA: Companion Diagnostics','url':'https://www.fda.gov/medical-devices/in-vitro-diagnostics/companion-diagnostics','summary':'FDA overview and guidance links for companion diagnostic co-development, oncology IVD pilot work and approved CDx devices.','date':'Current','source':'FDA'}
]

items=[]
items += google_news('("lab monkey" OR macaque OR "non-human primate" OR NHP) (toxicology OR preclinical OR CRO OR price OR shortage) biotech when:90d')
items += google_news('("companion diagnostic" OR CDx OR "biomarker assay") (pharma OR oncology OR FDA OR regulation OR development) when:90d')
items += rss('https://www.fiercebiotech.com/rss/xml','Fierce Biotech')

keep=[]
for x in items:
    s=(' '+x['title']+' '+x.get('summary','')+' ').lower()
    if any(k in s for k in ['monkey','macaque','primate','toxicology','tox ','glp tox','companion diagnostic',' cdx ','biomarker assay','ivd','in vitro diagnostic','nams','animal testing']):
        keep.append(classify(x))
for x in official:keep.append(classify(x))

seen=set();unique=[]
for x in keep:
    k=re.sub(r'[^a-z0-9]+',' ',x['title'].lower()).strip()[:140]
    if not k or k in seen:continue
    seen.add(k);unique.append(x)

# Put current news first within each lane, while keeping official anchors near the top.
def pri(x):
    official=0 if x['source']=='FDA' else 1
    return (x['lane'],official,x.get('date',''))
unique.sort(key=pri)

tox=[x for x in unique if x['lane']=='Tox / NHP Cost & Capacity'][:10]
cdx=[x for x in unique if x['lane']=='CDx Development & Regulation'][:10]

payload={'updated_at':datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),'tox_nhp':tox,'cdx':cdx,'items':tox+cdx}
Path('data').mkdir(exist_ok=True)
Path('data/cost-regulatory.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
print('wrote',len(tox),'tox/NHP and',len(cdx),'CDx items')
