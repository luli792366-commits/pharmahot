(()=>{
const PIPELINE=[
 {name:'Our HER2 ATTC',targets:['her2'],modalities:['adc','attc','antibody-drug conjugate','antibody targeted therapy conjugate']},
 {name:'Our EGFR ATTC',targets:['egfr'],modalities:['adc','attc','antibody-drug conjugate','antibody targeted therapy conjugate']}
];
const esc=s=>(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const txt=e=>[e.title,e.summary,e.category,e.region,(e.tags||[]).join(' '),e.why].join(' ').toLowerCase();
function scoreEvent(e){
 const s=txt(e); let match=0,competitive=0,evidence=0,finance=0,asset='ADC / ATTC watch';
 for(const p of PIPELINE){
  const target=p.targets.some(x=>s.includes(x)); const modality=p.modalities.some(x=>s.includes(x));
  let m=(target?23:0)+(modality?12:0);
  if(m>match){match=m;asset=p.name;}
 }
 if(!match && /adc|attc|antibody.?drug conjugate|conjugate/.test(s)) match=14;
 if(/phase 3|phase iii|pivotal|approval|approv|bla|nda|nmpa|fda|ema/.test(s)) competitive+=14;
 else if(/phase 2|phase ii|poc|endpoint|orr|pfs|os|dor/.test(s)) competitive+=10;
 else if(/phase 1|phase i|fih|first.in.human/.test(s)) competitive+=5;
 if(/license|licens|m&a|deal|acqui|partnership|partner/.test(s)) competitive+=8;
 if(/her2|egfr/.test(s)) competitive+=3;
 competitive=Math.min(25,competitive);
 if(/approval|approv|phase 3|phase iii|pivotal|primary endpoint|nda|bla/.test(s)) evidence=20;
 else if(/phase 2|phase ii|orr|pfs|os|dor|clinical data/.test(s)) evidence=14;
 else if(/phase 1|phase i|preclinical|fast track|orphan/.test(s)) evidence=8;
 else evidence=5;
 if(/budget|forecast|cash|capex|opex|commercial|manufactur|capacity|supply|launch|sales|revenue/.test(s)) finance+=10;
 if(/approval|phase 3|phase iii|license|deal|acqui|commercial/.test(s)) finance+=6;
 if(/adc|attc|her2|egfr/.test(s)) finance+=4;
 finance=Math.min(20,finance);
 const total=Math.min(100,match+competitive+evidence+finance);
 const level=total>=80?'Critical':total>=65?'High':total>=45?'Medium':'Watch';
 return {total,match,competitive,evidence,finance,level,asset};
}
function actionFor(e,r){
 const s=txt(e);
 if(r.level==='Critical') return 'Revisit forecast assumptions and ask Clinical/Portfolio whether timeline, enrollment, CMC or differentiation assumptions should change.';
 if(/license|deal|acqui|m&a/.test(s)) return 'Use as a BD comparable: separate upfront, milestones, royalties and cost sharing before using it in valuation assumptions.';
 if(/phase 3|phase iii|approval|approv|bla|nda/.test(s)) return 'Check whether our development timeline, launch-readiness spend or competitive window needs to move.';
 if(/phase 1|phase i|phase 2|phase ii/.test(s)) return 'Monitor next readout; do not change forecast yet unless the signal is reproduced in a larger cohort.';
 return 'Monitor; no forecast change yet.';
}
function injectStyle(){
 const st=document.createElement('style');st.textContent=`
 .ourRadar{margin:18px 0 28px;padding:20px;border:1px solid #dde3ea;border-radius:18px;background:#fff}.ourRadarHead{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:14px}.ourRadarHead h2{margin:3px 0 4px;font-size:24px}.ourRadarHead p{margin:0;color:#667085}.ourEyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;color:#6b7280}.ourScope{font-size:12px;border:1px solid #d0d5dd;border-radius:999px;padding:7px 10px;color:#344054;white-space:nowrap}.ourAssets{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}.ourAsset{background:#f2f4f7;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:700}.radarGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.radarCard{border:1px solid #e4e7ec;border-radius:14px;padding:15px}.radarMeta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px;color:#667085}.impactBadge{font-weight:800;padding:4px 7px;border-radius:7px;background:#101828;color:#fff}.radarCard h3{font-size:16px;line-height:1.35;margin:10px 0}.radarAsset{font-size:12px;font-weight:700;color:#344054}.scoreBreak{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0}.scoreBreak span{background:#f8fafc;border-radius:8px;padding:7px;font-size:11px;color:#475467}.scoreBreak b{display:block;font-size:15px;color:#101828}.bpAction{border-left:3px solid #98a2b3;padding-left:10px;margin:10px 0 0;color:#344054;font-size:13px;line-height:1.45}.radarNote{margin-top:12px;font-size:11px;color:#667085}.radarEmpty{padding:18px;color:#667085;background:#f8fafc;border-radius:10px}@media(max-width:800px){.radarGrid{grid-template-columns:1fr}.ourRadarHead{align-items:flex-start;flex-direction:column}.scoreBreak{grid-template-columns:repeat(2,1fr)}}`;
 document.head.appendChild(st);
}
function relabel(){
 const p=document.querySelector('.pagehead p');if(p)p.textContent='Finance BP external intelligence · ADC / ATTC first · filtered by relevance to Us';
 const h=document.querySelector('#rank .panelhead b');if(h)h.textContent='Industry Hot Rank';
 const hs=[...document.querySelectorAll('.sectionbar h2')].find(x=>x.textContent.includes('当前热点'));if(hs)hs.textContent='Industry Signals';
 const dd=document.querySelector('#decisionDesk h2');if(dd)dd.textContent='ADC / ATTC Finance BP Decision Desk';
}
async function render(){
 injectStyle();relabel();
 const anchor=document.querySelector('.tabs')||document.querySelector('.hotbox'); if(!anchor)return;
 const section=document.createElement('section');section.className='ourRadar';section.id='ourRadar';
 section.innerHTML=`<div class="ourRadarHead"><div><span class="ourEyebrow">US-FIRST COMPETITIVE INTELLIGENCE</span><h2>ADC / ATTC Competitive Radar</h2><p>只把可能影响 Our pipeline、竞争窗口和财务假设的外部信号抬到前面。</p></div><span class="ourScope">Phase 1 · ADC/ATTC first</span></div><div class="ourAssets"><span class="ourAsset">Our HER2 ATTC</span><span class="ourAsset">Our EGFR ATTC</span></div><div id="ourRadarGrid" class="radarGrid"><div class="radarEmpty">正在匹配本周 ADC / ATTC 竞争信号…</div></div><div class="radarNote">Impact Score = Our Pipeline Match 35 + Competitive Impact 25 + Evidence 20 + Finance Impact 20。它衡量“对 Us 的决策相关度”，不是媒体热度。</div>`;
 anchor.insertAdjacentElement('afterend',section);
 try{
  const res=await fetch('data/news.json?radar=20260813'); const data=await res.json();
  const ranked=(data.items||[]).map(e=>({e,r:scoreEvent(e)})).filter(x=>x.r.match>=14).sort((a,b)=>b.r.total-a.r.total).slice(0,6);
  const grid=document.querySelector('#ourRadarGrid');
  if(!ranked.length){grid.innerHTML='<div class="radarEmpty">本期新闻源里没有足够强的 ADC / ATTC 匹配。保留空结果比为了凑榜单抬高无关新闻更可靠。</div>';return;}
  grid.innerHTML=ranked.map(({e,r})=>`<article class="radarCard"><div class="radarMeta"><span class="impactBadge">${r.level} · ${r.total}</span><span>${esc(e.category||'Signal')}</span><span>${esc(e.date||'')}</span></div><h3>${esc(e.title)}</h3><div class="radarAsset">Related to Us: ${esc(r.asset)}</div><div class="scoreBreak"><span>Pipeline Match<b>${r.match}/35</b></span><span>Competitive<b>${r.competitive}/25</b></span><span>Evidence<b>${r.evidence}/20</b></span><span>Finance<b>${r.finance}/20</b></span></div><div class="bpAction"><b>BP action:</b> ${esc(actionFor(e,r))}</div>${e.sources?.[0]?.url?`<p><a href="${esc(e.sources[0].url)}" target="_blank" rel="noopener">Source ↗</a></p>`:''}</article>`).join('');
 }catch(err){document.querySelector('#ourRadarGrid').innerHTML='<div class="radarEmpty">竞争雷达暂时无法读取新闻数据；原有新闻页面不受影响。</div>';}
}
window.addEventListener('DOMContentLoaded',render);
})();