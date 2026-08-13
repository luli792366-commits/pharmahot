(()=>{
const PIPELINE=[
 {name:'Our HER2 ATTC',targets:['her2'],modalities:['adc','attc','antibody-drug conjugate','antibody targeted therapy conjugate']},
 {name:'Our EGFR ATTC',targets:['egfr'],modalities:['adc','attc','antibody-drug conjugate','antibody targeted therapy conjugate']}
];
const esc=s=>(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const txt=e=>[e.title,e.summary,e.category,e.region,(e.tags||[]).join(' '),e.why,e.bp].join(' ').toLowerCase();
const isADC=s=>/\badc\b|\battc\b|antibody.?drug conjugate|antibody targeted therapy conjugate|抗体偶联|抗体靶向偶联/.test(s);
function scoreEvent(e){
 const s=txt(e); let match=0,competitive=0,evidence=0,finance=0,asset='ADC / ATTC watch';
 const modality=isADC(s);
 for(const p of PIPELINE){const target=p.targets.some(x=>s.includes(x));if(target&&modality){const m=35;if(m>match){match=m;asset=p.name;}}}
 if(!match&&modality) match=14;
 if(/phase 3|phase iii|pivotal|approval|approv|获批|批准|bla|nda|nmpa|fda|ema/.test(s)) competitive+=14;
 else if(/phase 2|phase ii|poc|endpoint|orr|pfs|os|dor|主要终点/.test(s)) competitive+=10;
 else if(/phase 1|phase i|fih|first.in.human|首例/.test(s)) competitive+=5;
 if(/license|licens|m&a|deal|acqui|partnership|partner|授权|合作|并购/.test(s)) competitive+=8;
 if(/her2|egfr/.test(s)&&modality) competitive+=3;
 competitive=Math.min(25,competitive);
 if(/approval|approv|获批|批准|phase 3|phase iii|pivotal|primary endpoint|主要终点|nda|bla/.test(s)) evidence=20;
 else if(/phase 2|phase ii|orr|pfs|os|dor|clinical data|临床数据/.test(s)) evidence=14;
 else if(/phase 1|phase i|preclinical|fast track|orphan|首例/.test(s)) evidence=8;
 else evidence=5;
 if(/budget|forecast|cash|capex|opex|commercial|manufactur|capacity|supply|launch|sales|revenue|预算|现金|产能|供应|商业化|收入/.test(s)) finance+=10;
 if(/approval|获批|批准|phase 3|phase iii|license|deal|acqui|commercial|授权|合作/.test(s)) finance+=6;
 if(modality) finance+=4;
 finance=Math.min(20,finance);
 const total=Math.min(100,match+competitive+evidence+finance);
 const level=total>=80?'Critical':total>=65?'High':total>=45?'Medium':'Watch';
 return {total,match,competitive,evidence,finance,level,asset};
}
function actionFor(e,r){
 const s=txt(e);
 if(r.level==='Critical') return 'Revisit Forecast assumptions and confirm with Clinical / Portfolio whether timeline, enrollment, CMC or differentiation assumptions should change.';
 if(/license|deal|acqui|m&a|授权|合作|并购/.test(s)) return 'Use as a BD comparable: separate upfront, milestones, royalty and cost sharing before applying it to valuation or budget assumptions.';
 if(/phase 3|phase iii|approval|approv|获批|批准|bla|nda/.test(s)) return 'Check whether our development timeline, launch-readiness spend or competitive window needs to move.';
 if(/phase 1|phase i|phase 2|phase ii|首例/.test(s)) return 'Monitor the next readout; do not change Forecast until the signal is reproduced in a larger dataset.';
 return 'Monitor; no Forecast change yet.';
}
function injectStyle(){
 const st=document.createElement('style');st.textContent=`
 .ourRadar{margin:18px 0 28px;padding:20px;border:1px solid #dde3ea;border-radius:18px;background:#fff;scroll-margin-top:18px}.ourRadarHead{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:12px}.ourRadarHead h2{margin:3px 0 0;font-size:24px}.ourEyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;color:#6b7280}.ourScope{font-size:12px;border:1px solid #d0d5dd;border-radius:999px;padding:7px 10px;color:#344054;white-space:nowrap}.ourAssets{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}.ourAsset{background:#f2f4f7;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:700}.radarGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.radarCard{border:1px solid #e4e7ec;border-radius:14px;padding:15px}.radarMeta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px;color:#667085}.impactBadge{font-weight:800;padding:4px 7px;border-radius:7px;background:#101828;color:#fff}.radarCard h3{font-size:16px;line-height:1.35;margin:10px 0}.radarAsset{font-size:12px;font-weight:700;color:#344054}.scoreBreak{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin:10px 0}.scoreBreak span{background:#f8fafc;border-radius:7px;padding:5px 7px;font-size:10px;line-height:1.15;color:#667085}.scoreBreak b{display:block;margin-top:2px;font-size:13px;line-height:1.1;color:#101828}.bpAction{border-left:3px solid #98a2b3;padding-left:10px;margin:10px 0 0;color:#344054;font-size:13px;line-height:1.45}.radarEmpty{padding:18px;color:#667085;background:#f8fafc;border-radius:10px}@media(max-width:800px){.radarGrid{grid-template-columns:1fr}.ourRadarHead{align-items:flex-start;flex-direction:column}.scoreBreak{grid-template-columns:repeat(2,1fr)}}`;
 document.head.appendChild(st);
}
function relabel(){
 const p=document.querySelector('.pagehead p');if(p)p.textContent='Finance BP external intelligence · ADC / ATTC first · filtered by relevance to Our pipeline';
 const h=document.querySelector('#rank .panelhead b');if(h)h.textContent='Industry Hot Rank';
 const dd=document.querySelector('#decisionDesk h2');if(dd)dd.textContent='ADC / ATTC Finance BP Decision Desk';
}
function bindNavigation(){
 document.querySelectorAll('[data-scrollto]').forEach(btn=>{if(btn.dataset.radarNavBound)return;btn.dataset.radarNavBound='1';btn.addEventListener('click',()=>{const id=btn.dataset.scrollto;setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}),0);});});
 document.querySelectorAll('.topic[data-filter]').forEach(btn=>{if(btn.dataset.topicScrollBound)return;btn.dataset.topicScrollBound='1';btn.addEventListener('click',()=>setTimeout(()=>document.getElementById('news')?.scrollIntoView({behavior:'smooth',block:'start'}),40));});
}
function normalizeCompanyUpdate(x){return {title:x.title,summary:x.summary,category:x.type||'Clinical',date:x.date,tags:[x.company,x.type].filter(Boolean),why:x.bp,bp:x.bp,sources:x.url?[{name:x.company||'Source',url:x.url}]:[]};}
function dedupe(items){const seen=new Set();return items.filter(e=>{const k=(e.title||'').toLowerCase().replace(/\s+/g,' ').trim();if(!k||seen.has(k))return false;seen.add(k);return true;});}
async function render(){
 injectStyle();relabel();
 const anchor=document.querySelector('.tabs')||document.querySelector('.hotbox'); if(!anchor)return;
 const section=document.createElement('section');section.className='ourRadar';section.id='ourRadar';
 section.innerHTML=`<div class="ourRadarHead"><div><span class="ourEyebrow">OUR-PIPELINE-FIRST COMPETITIVE INTELLIGENCE</span><h2>ADC / ATTC Competitive Radar</h2></div><span class="ourScope">Phase 1 · ADC/ATTC first</span></div><div class="ourAssets"><span class="ourAsset">Our HER2 ATTC</span><span class="ourAsset">Our EGFR ATTC</span></div><div id="ourRadarGrid" class="radarGrid"><div class="radarEmpty">Matching ADC / ATTC competitive signals…</div></div>`;
 anchor.insertAdjacentElement('afterend',section);bindNavigation();
 try{
  const res=await fetch('data/news.json?radar=20260813d'); const data=await res.json();
  let extras=[];try{if(typeof COMPANY_UPDATES!=='undefined')extras=COMPANY_UPDATES.map(normalizeCompanyUpdate)}catch(e){}
  const all=dedupe([...(data.items||[]),...extras]);
  const ranked=all.map(e=>({e,r:scoreEvent(e)})).filter(x=>x.r.match>=14).sort((a,b)=>b.r.total-a.r.total).slice(0,8);
  const grid=document.querySelector('#ourRadarGrid');
  if(!ranked.length){grid.innerHTML='<div class="radarEmpty">No sufficiently strong ADC / ATTC match in the current sources. We keep the radar empty rather than inflate unrelated signals.</div>';return;}
  grid.innerHTML=ranked.map(({e,r})=>`<article class="radarCard"><div class="radarMeta"><span class="impactBadge">${r.level} · ${r.total}</span><span>${esc(e.category||'Signal')}</span><span>${esc(e.date||'')}</span></div><h3>${esc(e.title)}</h3><div class="radarAsset">Related to Our pipeline: ${esc(r.asset)}</div><div class="scoreBreak"><span>Pipeline Match<b>${r.match}/35</b></span><span>Competitive<b>${r.competitive}/25</b></span><span title="How mature and well-confirmed the external signal is">Evidence<b>${r.evidence}/20</b></span><span>Finance<b>${r.finance}/20</b></span></div><div class="bpAction"><b>BP action:</b> ${esc(actionFor(e,r))}</div>${e.sources?.[0]?.url?`<p><a href="${esc(e.sources[0].url)}" target="_blank" rel="noopener">Source ↗</a></p>`:''}</article>`).join('');
 }catch(err){document.querySelector('#ourRadarGrid').innerHTML='<div class="radarEmpty">The competitive radar could not load its source data. The rest of the site remains available.</div>';}
}
window.addEventListener('DOMContentLoaded',render);
})();