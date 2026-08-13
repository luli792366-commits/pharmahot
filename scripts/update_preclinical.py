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
REVIEW_TERMS=['review','perspective','overview','landscape','current status','emerging frontiers','comprehensive narrative','state of the art']

MAJOR_PATTERNS=[
 ('IND submitted / cleared',[
  r'\bind (?:application )?(?:was |has been )?(?:submitted|filed|cleared|accepted)\b',
  r'\b(?:submitted|filed) (?:an |the )?ind\b',
  r'\bind clearance\b',r'\bind cleared\b',r'\binvestigational new drug application (?:was |has been )?(?:submitted|accepted|cleared)\b'
 ]),
 ('GLP tox / safety package',[
  r'\bglp[- ](?:compliant )?(?:tox|toxicology|toxicology studies|safety studies)\b',
  r'\b(?:completed|initiated|started|began) (?:the )?glp (?:tox|toxicology)\b',
  r'\bglp (?:tox|toxicology) (?:completed|initiated|started|underway)\b'
 ]),
 ('IND-enabling',[
  r'\b(?:initiated|started|began|commenced|entered) (?:its |the )?ind[- ]enabling\b',
  r'\bind[- ]enabling (?:studies|activities|work|program|programme) (?:were |was |are |is )?(?:initiated|started|underway|completed)\b'
 ]),
 ('Development candidate',[
  r'\bdevelopment candidate (?:was |has been )?(?:nominated|selected|chosen)\b',
  r'\b(?:nominated|selected|chosen) (?:as |a |the )*(?:lead )?development candidate\b',
  r'\bcandidate nomination\b',r'\bcandidate nominated\b'
 ])
]
STAGE_RULES=[
 ('Lead optimization',['lead optimization','lead optimisation','hit-to-lead','hit to lead']),
 ('Preclinical safety',['nonclinical toxicology','preclinical toxicology','toxicology assessment','safety pharmacology','noael','toxicokinetic']),
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
def is_review(s):return any(x in s for x in REVIEW_TERMS)
def major_stage(s):
 if is_review(s):return None
 for name,patterns in MAJOR_PATTERNS:
  if any(re.search(p,s,re.I) for p in patterns):return name
 return None
def stage(s):
 major=major_stage(s)
 if major:return major
 for name,terms in STAGE_RULES:
  if any(t in s for t in terms):return name
 return 'Discovery / Preclinical'
def evidence(s,stg):
 if stg in ('IND submitted / cleared','GLP tox / safety package','IND-enabling','Development candidate'):return 'Development-ready signal'
 if any(x in s for x in ['dose response','dose-response','pk/pd','multiple models','xenograft','organoid','in vivo']):return 'Reproducible package'
 return 'Early signal'
def signal_class(s,stg):
 return 'Major Development Signal' if stg in ('IND submitted / cleared','GLP tox / safety package','IND-enabling','Development candidate') else 'Research Watch'
def finance_action(stg,mod):
 if stg=='IND submitted / cleared':return 'Move the model from preclinical close-out toward FIH start-up, clinical supply and ongoing CMC.'
 if stg in ('GLP tox / safety package','IND-enabling'):return 'Check GLP tox, bioanalysis, safety pharmacology, GMP material and CMC timing on the critical path.'
 if stg=='Development candidate':return 'Expect spend to concentrate around the nominated asset: DMPK, tox, formulation/process development and IND-enabling work.'
 if stg=='Preclinical safety':return 'Treat this as a safety-learning signal, not a formal development milestone unless GLP or IND-enabling status is explicitly stated.'
 if mod=='ADC / ATTC':return 'Track safety margin, payload/linker supply, conjugation control, stability and GMP scale-up before treating efficacy as development-ready.'
 if mod=='Small Molecule':return 'Track DMPK, selectivity, formulation, off-target/tox risk and scale-up chemistry before moving timeline or valuation assumptions.'
 return 'Track developability, PK, immunogenicity, process yield, analytics and tox-material readiness before moving timeline assumptions.'
def score_item(s,source,stg):
 v=45
 if source=='Europe PMC':v+=8
 if source=='bioRxiv':v+=5
 if stg=='Development candidate':v+=22
 if stg in ('IND-enabling','GLP tox / safety package','IND submitted / cleared'):v+=25
 if any(x in s for x in ['antibody-drug conjugate','antibody drug conjugate',' adc ','attc']):v+=8
 if any(x in s for x in ['pk/pd','dose-response','dose response','multiple models']):v+=5
 if is_review(s):v-=15
 return max(1,min(99,v))
def make(title,summary,url,date,source,authors=''):
 s=blob(title,summary)
 if not relevant(s):return None
 mod=modality(s);stg=stage(s);cls=signal_class(s,stg)
 return {'title':clean(title),'summary':clean(summary)[:700],'url':url,'date':date,'source':source,'authors':clean(authors)[:220],
         'modality':mod,'stage':stg,'evidence':evidence(s,stg),'signal_class':cls,'score':score_item(s,source,stg),'finance':finance_action(stg,mod)}

def europe_pmc():
 terms='("antibody drug conjugate" OR ADC OR "small molecule" OR antibody OR bispecific OR PROTAC OR "molecular glue") AND (preclinical OR "drug discovery" OR "lead optimization" OR "development candidate" OR "IND-enabling" OR toxicology OR DMPK OR xenograft OR organoid)'
 q=f'{terms} AND FIRST_PDATE:[{START.isoformat()} TO {TODAY.isoformat()}]'
 url='https://www.ebi.ac.uk/europepmc/webservices/rest/search?'+urllib.parse.urlencode({'query':q,'format':'json','pageSize':80,'resultType':'core'})
 out=[]
 try:
  data=get_json(url)
  for r in data.get('resultList',{}).get('result',[]):
   title=r.get('title','');summary=r.get('abstractText','') or r.get('title','')
   pmid=r.get('pmid');doi=r.get('doi')
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
  for cursor in (0,100,200):
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
  for it in root.findall('.//item')[:60]:
   title=clean(text(it,'title'));summary=clean(text(it,'description'));link=text(it,'link');date=text(it,'pubDate')[:16]
   s=blob(title,summary)
   if not any(x in s for x in ['preclinical','pre-clinical','drug discovery','development candidate','ind-enabling','ind enabling','toxicology']):continue
   item=make(title,summary,link,date,'Fierce Biotech')
   if item:out.append(item)
 except Exception as e:print('industry preclinical failed',e)
 return out

items=europe_pmc()+biorxiv()+industry_preclinical()
seen=set();unique=[]
for x in items:
 k=re.sub(r'[^a-z0-9]+',' ',x['title'].lower()).strip()[:120]
 if not k or k in seen:continue
 seen.add(k);unique.append(x)
priority={'Major Development Signal':0,'Research Watch':1}
unique.sort(key=lambda z:(priority.get(z.get('signal_class'),9),-z.get('score',0),z.get('date','')),reverse=False)
major=[x for x in unique if x.get('signal_class')=='Major Development Signal'][:12]
research=[x for x in unique if x.get('signal_class')=='Research Watch'][:24]
Path('data').mkdir(exist_ok=True)
payload={'updated_at':datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),'window_days':60,'sources':['Europe PMC','bioRxiv','Fierce Biotech'],'major_signals':major,'research_watch':research,'items':major+research}
Path('data/preclinical.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
print('wrote',len(major),'major and',len(research),'research preclinical stories')
