#!/usr/bin/env python3
import json,re,urllib.parse,urllib.request,xml.etree.ElementTree as ET
from datetime import datetime,timezone,timedelta
from pathlib import Path

UA='PharmaHot/1.0 (+https://github.com/luli792366-commits/pharmahot)'
TODAY=datetime.now(timezone.utc).date()
START=TODAY-timedelta(days=60)

DISCOVERY_TERMS=[
 'preclinical','pre-clinical','drug discovery','lead optimization','lead optimisation','hit-to-lead','candidate nomination',
 'development candidate','ind-enabling','ind enabling','glp tox','toxicology','safety pharmacology','dmpk','adme','pk/pd',
 'xenograft','patient-derived xenograft','organoid','in vivo','in vitro','developability','manufacturability','formulation'
]
MODALITY_TERMS={
 'ADC / ATTC':['antibody-drug conjugate','antibody drug conjugate',' adc ','attc','payload','linker','drug-to-antibody ratio',' dar '],
 'Biologics':['antibody','bispecific','trispecific','protein therapeutic','biologic','monoclonal','nanobody'],
 'Small Molecule':['small molecule','small-molecule','inhibitor','degrader','protac','molecular glue','kinase inhibitor']
}
STAGE_RULES=[
 ('IND submitted / cleared',['ind submission','ind submitted','ind clearance','ind cleared','investigational new drug application']),
 ('GLP tox / safety package',['glp tox','toxicology','safety pharmacology','noael','toxicokinetic']),
 ('IND-enabling',['ind-enabling','ind enabling']),
 ('Development candidate',['candidate nomination','candidate nominated','development candidate','preclinical candidate']),
 ('Lead optimization',['lead optimization','lead optimisation','hit-to-lead','hit to lead']),
 ('Preclinical efficacy',['xenograft','patient-derived xenograft','organoid','in vivo','tumor regression','tumour regression','preclinical efficacy']),
 ('Discovery',['drug discovery','target validation','screening','in vitro'])
]

def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json, application/xml, text/xml, */*'})
 with urllib.request.urlopen(req,timeout=30) as r:return r.read()
def get_json(url):return json.loads(get(url).decode('utf-8','replace'))
def clean(s):return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',s or '')).strip()
def text(el,name):
 x=el.find(name);return ''.join(x.itertext()).strip() if x is not None else ''
def blob(title,summary):return (' '+clean(title)+' '+clean(summary)+' ').lower()
def relevant(s):return any(k in s for k in DISCOVERY_TERMS) and any(k in s for v in MODALITY_TERMS.values() for k in v)
def modality(s):
 best=('Cross-modality',0)
 for name,terms in MODALITY_TERMS.items():
  n=sum(1 for t in terms if t in s)
  if n>best[1]:best=(name,n)
 return best[0]
def stage(s):
 for name,terms in STAGE_RULES:
  if any(t in s for t in terms):return name
 return 'Discovery / Preclinical'
def evidence(s):
 if any(x in s for x in ['ind-enabling','ind enabling','glp tox','development candidate','candidate nominated','candidate nomination']):return 'Development-ready signal'
 if any(x in s for x in ['dose response','dose-response','pk/pd','multiple models','xenograft','organoid','in vivo']):return 'Reproducible package'
 return 'Early signal'
def finance_action(stg,mod):
 if stg=='IND submitted / cleared':return 'Move the model from preclinical close-out toward FIH start-up, clinical supply and ongoing CMC.'
 if stg in ('GLP tox / safety package','IND-enabling'):return 'Check GLP tox, bioanalysis, safety pharmacology, GMP material and CMC timing on the critical path.'
 if stg=='Development candidate':return 'Expect spend to concentrate around the nominated asset: DMPK, tox, formulation/process development and IND-enabling work.'
 if mod=='ADC / ATTC':return 'Track safety margin, payload/linker supply, conjugation control, stability and GMP scale-up before treating efficacy as development-ready.'
 if mod=='Small Molecule':return 'Track DMPK, selectivity, formulation, off-target/tox risk and scale-up chemistry before moving timeline or valuation assumptions.'
 return 'Track developability, PK, immunogenicity, process yield, analytics and tox-material readiness before moving timeline assumptions.'
def score_item(s,source):
 v=45
 if source=='Europe PMC':v+=8
 if source=='bioRxiv':v+=5
 if any(x in s for x in ['development candidate','candidate nominated','candidate nomination']):v+=16
 if any(x in s for x in ['ind-enabling','ind enabling','glp tox','ind submitted','ind clearance']):v+=20
 if any(x in s for x in ['antibody-drug conjugate','antibody drug conjugate',' adc ','attc']):v+=8
 if any(x in s for x in ['pk/pd','dose-response','dose response','multiple models']):v+=5
 return min(99,v)
def make(title,summary,url,date,source,authors=''):
 s=blob(title,summary)
 if not relevant(s):return None
 mod=modality(s);stg=stage(s)
 return {'title':clean(title),'summary':clean(summary)[:700],'url':url,'date':date,'source':source,'authors':clean(authors)[:220],
         'modality':mod,'stage':stg,'evidence':evidence(s),'score':score_item(s,source),'finance':finance_action(stg,mod)}

def europe_pmc():
 terms='("antibody drug conjugate" OR ADC OR "small molecule" OR antibody OR bispecific OR PROTAC OR "molecular glue") AND (preclinical OR "drug discovery" OR "lead optimization" OR "development candidate" OR "IND-enabling" OR toxicology OR DMPK OR xenograft OR organoid)'
 q=f'{terms} AND FIRST_PDATE:[{START.isoformat()} TO {TODAY.isoformat()}]'
 url='https://www.ebi.ac.uk/europepmc/webservices/rest/search?'+urllib.parse.urlencode({'query':q,'format':'json','pageSize':60,'resultType':'core'})
 out=[]
 try:
  data=get_json(url)
  for r in data.get('resultList',{}).get('result',[]):
   title=r.get('title','');summary=r.get('abstractText','') or r.get('title','')
   pmid=r.get('pmid');doi=r.get('doi');src=r.get('source','')
   link=('https://europepmc.org/article/MED/'+pmid) if pmid else (('https://doi.org/'+doi) if doi else 'https://europepmc.org/')
   date=r.get('firstPublicationDate') or r.get('firstIndexDate','')[:10]
   item=make(title,summary,link,date,'Europe PMC',r.get('authorString',''))
   if item:out.append(item)
 except Exception as e:print('Europe PMC failed',e)
 return out

def biorxiv():
 out=[]
 base=f'https://api.biorxiv.org/details/biorxiv/{START.isoformat()}/{TODAY.isoformat()}'
 try:
  for cursor in (0,100):
   data=get_json(f'{base}/{cursor}')
   collection=data.get('collection',[])
   for r in collection:
    title=r.get('title','');summary=r.get('abstract','');doi=r.get('doi','')
    item=make(title,summary,('https://www.biorxiv.org/content/'+doi if doi else 'https://www.biorxiv.org/'),r.get('date',''),'bioRxiv',r.get('authors',''))
    if item:out.append(item)
   if len(collection)<100:break
 except Exception as e:print('bioRxiv failed',e)
 return out

def industry_preclinical():
 out=[]
 try:
  root=ET.fromstring(get('https://www.fiercebiotech.com/rss/xml'))
  for it in root.findall('.//item')[:50]:
   title=clean(text(it,'title'));summary=clean(text(it,'description'));link=text(it,'link');date=text(it,'pubDate')[:16]
   s=blob(title,summary)
   if not any(x in s for x in ['preclinical','pre-clinical','drug discovery','development candidate','ind-enabling','ind enabling','toxicology']):continue
   item=make(title,summary,link,date,'Fierce Biotech')
   if item:out.append(item)
 except Exception as e:print('industry preclinical failed',e)
 return out

items=europe_pmc()+biorxiv()+industry_preclinical()
seen=set();unique=[]
for x in sorted(items,key=lambda z:(z.get('date',''),z.get('score',0)),reverse=True):
 k=re.sub(r'[^a-z0-9]+',' ',x['title'].lower()).strip()[:120]
 if not k or k in seen:continue
 seen.add(k);unique.append(x)
Path('data').mkdir(exist_ok=True)
payload={'updated_at':datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),'window_days':60,'sources':['Europe PMC','bioRxiv','Fierce Biotech'],'items':unique[:36]}
Path('data/preclinical.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
print('wrote',len(payload['items']),'preclinical stories')
