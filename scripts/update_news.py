#!/usr/bin/env python3
import json,re,urllib.request,xml.etree.ElementTree as ET
from datetime import datetime,timezone
from pathlib import Path

FEEDS=[
 ('EMA','https://www.ema.europa.eu/en/news.xml','Regulatory'),
 ('Fierce Biotech','https://www.fiercebiotech.com/rss/xml','Clinical'),
 ('Fierce Pharma','https://www.fiercepharma.com/rss/xml','BD/M&A'),
]
KEYWORDS={
 'Regulatory':['fda','ema','approval','approves','authorisation','authorization','regulatory','label','warning','committee'],
 'Clinical':['phase 1','phase i','phase 2','phase ii','phase 3','phase iii','trial','clinical','endpoint','patient','data','study'],
 'BD/M&A':['acquire','acquisition','merger','deal','license','licensing','partnership','partner','buyout'],
 'CRO/CDMO':['cro','cdmo','manufacturing','capacity','facility','outsourcing'],
 'AI Drug Discovery':['artificial intelligence',' ai ','machine learning','drug discovery','insilico']}

def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':'PharmaHot/1.0 (+https://github.com/luli792366-commits/pharmahot)'})
 with urllib.request.urlopen(req,timeout=25) as r:return r.read()
def text(el,name):
 x=el.find(name);return ''.join(x.itertext()).strip() if x is not None else ''
def clean(s):return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',s or '')).strip()
def category(title,desc,default):
 s=(' '+title+' '+desc+' ').lower()
 best=(0,default)
 for cat,words in KEYWORDS.items():
  n=sum(1 for w in words if w in s)
  if n>best[0]:best=(n,cat)
 return best[1]
def score(title,desc,source,cat):
 s=(title+' '+desc).lower();v=65
 if source=='EMA':v+=12
 if cat=='Regulatory':v+=8
 if cat=='Clinical' and any(x in s for x in ['phase 3','phase iii','endpoint','pivotal']):v+=8
 if cat=='BD/M&A' and any(x in s for x in ['acquire','acquisition','merger']):v+=7
 if any(x in s for x in ['safety','warning','fails','failed','approval','approves']):v+=5
 return min(99,v)

def parse_feed(source,url,default):
 out=[]
 try:
  root=ET.fromstring(get(url))
  nodes=root.findall('.//item')
  if nodes:
   for it in nodes[:25]:
    title=clean(text(it,'title'));link=text(it,'link');desc=clean(text(it,'description'));date=text(it,'pubDate')
    if title and link:
     cat=category(title,desc,default);out.append({'title':title,'url':link,'summary':desc[:360] or '点击查看原文。','source':source,'category':cat,'date':date[:16],'score':score(title,desc,source,cat)})
  else:
   ns={'a':'http://www.w3.org/2005/Atom'}
   for it in root.findall('.//a:entry',ns)[:25]:
    title=clean(text(it,'{http://www.w3.org/2005/Atom}title'));desc=clean(text(it,'{http://www.w3.org/2005/Atom}summary'))
    l=it.find('{http://www.w3.org/2005/Atom}link');link=l.get('href','') if l is not None else ''
    date=text(it,'{http://www.w3.org/2005/Atom}updated')[:10]
    if title and link:
     cat=category(title,desc,default);out.append({'title':title,'url':link,'summary':desc[:360] or '点击查看原文。','source':source,'category':cat,'date':date,'score':score(title,desc,source,cat)})
 except Exception as e:print('feed failed',source,e)
 return out

items=[]
for f in FEEDS:items.extend(parse_feed(*f))
seen=set();unique=[]
for x in sorted(items,key=lambda x:x['score'],reverse=True):
 k=re.sub(r'[^a-z0-9]+',' ',x['title'].lower()).strip()[:90]
 if k not in seen:seen.add(k);unique.append(x)
Path('data').mkdir(exist_ok=True)
Path('data/news.json').write_text(json.dumps({'updated_at':datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),'items':unique[:40]},ensure_ascii=False,indent=2),encoding='utf-8')
print('wrote',len(unique[:40]),'stories')
