(()=>{
const $=s=>document.querySelector(s);
const norm=s=>(s||'').toLowerCase()
 .replace(/pd\s*[-–—]?\s*\(l\)\s*1/g,'pdl1')
 .replace(/pd\s*[-–—]?\s*l\s*[-–—]?\s*1/g,'pdl1')
 .replace(/pd\s*[-–—]?\s*1/g,'pd1')
 .replace(/phase\s*iii/g,'phase3').replace(/phase\s*ii/g,'phase2').replace(/phase\s*i/g,'phase1')
 .replace(/[^a-z0-9\u4e00-\u9fff]+/g,'');

// Replace the original literal search matcher with terminology-aware matching.
try{
  match=function(e,q){
    const hay=norm([e.title,e.summary,e.category,e.region,...(e.tags||[]),...(e.sources||[]).map(x=>x.name)].join(' '));
    const needle=norm(q);
    if(!needle) return true;
    if(hay.includes(needle)) return true;
    if(needle==='pdl1') return hay.includes('pdl1')||hay.includes('pd1');
    if(needle==='pd1') return hay.includes('pd1')||hay.includes('pdl1');
    if(needle==='pd') return hay.includes('pd1')||hay.includes('pdl1');
    return false;
  };
}catch(e){}

function searchNow(){
  try{ filter='all'; }catch(e){}
  document.querySelectorAll('.topic').forEach(x=>x.classList.toggle('active',x.dataset.filter==='all'));
  try{ render(); }catch(e){}
  const q=$('#search')?.value.trim()||'';
  let status=$('#searchStatus');
  if(!status){ status=document.createElement('div');status.id='searchStatus';status.className='searchStatus';document.querySelector('.tabs')?.after(status); }
  const n=document.querySelectorAll('#stories .event').length;
  status.innerHTML=q?`搜索 <b>${q.replace(/[<>]/g,'')}</b> · 找到 ${n} 条相关信息 <button id="clearSearch">清除</button>`:'';
  $('#clearSearch')?.addEventListener('click',()=>{ $('#search').value=''; try{render()}catch(e){} status.innerHTML=''; });
  if(q) $('#news')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function favs(){try{return JSON.parse(localStorage.getItem('pharmahot_glossary_favorites')||'[]')}catch(e){return[]}}
function saveFavs(a){localStorage.setItem('pharmahot_glossary_favorites',JSON.stringify(a));try{renderFavs()}catch(e){};renderGlossary();}
function toggleFav(k){let a=favs();a=a.includes(k)?a.filter(x=>x!==k):[...a,k];saveFavs(a)}

function ensureGlossary(){
  if($('#glossaryDrawer')) return;
  const d=document.createElement('div');d.id='glossaryDrawer';d.className='glossaryDrawer hidden';
  d.innerHTML=`<div class="glossaryBackdrop" data-close-glossary></div><div class="glossaryPanel"><div class="glossaryHead"><div><small>PHARMAHOT LEARNING</small><h2>我的术语库</h2><p>收藏常用术语，也可以浏览全部高频词。</p></div><button data-close-glossary>×</button></div><div class="glossaryTabs"><button class="active" data-glossary-mode="all">全部术语</button><button data-glossary-mode="fav">我的收藏</button></div><div id="glossaryList"></div></div>`;
  document.body.appendChild(d);
  d.querySelectorAll('[data-close-glossary]').forEach(b=>b.onclick=()=>d.classList.add('hidden'));
  d.querySelectorAll('[data-glossary-mode]').forEach(b=>b.onclick=()=>{d.querySelectorAll('[data-glossary-mode]').forEach(x=>x.classList.remove('active'));b.classList.add('active');d.dataset.mode=b.dataset.glossaryMode;renderGlossary()});
}
function renderGlossary(){
  ensureGlossary();
  const box=$('#glossaryList'); if(!box) return;
  const mode=$('#glossaryDrawer').dataset.mode||'all';
  let keys=[]; try{keys=Object.keys(GLOSSARY)}catch(e){}
  const fs=favs(); if(mode==='fav') keys=keys.filter(k=>fs.includes(k));
  box.innerHTML=keys.length?keys.map(k=>{const x=GLOSSARY[k];return `<article class="glossaryItem"><div class="glossaryTerm"><button class="glossaryOpen" data-open-term="${k}">${k}</button><button class="glossaryStar ${fs.includes(k)?'on':''}" data-toggle-term="${k}" title="收藏">${fs.includes(k)?'★':'☆'}</button></div><p>${x[0]}</p><small>${x[1]}</small></article>`}).join(''):'<div class="glossaryEmpty">还没有收藏术语。可先从新闻正文中收藏。</div>';
  box.querySelectorAll('[data-open-term]').forEach(b=>b.onclick=()=>{try{showTerm(b.dataset.openTerm)}catch(e){}});
  box.querySelectorAll('[data-toggle-term]').forEach(b=>b.onclick=()=>toggleFav(b.dataset.toggleTerm));
}
function openGlossary(){ensureGlossary();renderGlossary();$('#glossaryDrawer').classList.remove('hidden')}

function boot(){
  ensureGlossary();renderGlossary();
  const favBtn=$('#favTermsBtn'); if(favBtn) favBtn.onclick=openGlossary;
  const input=$('#search'),btn=$('#searchBtn');
  if(input){ input.oninput=null; input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchNow()}}); }
  if(btn) btn.onclick=searchNow;
  // Search as user pauses typing, while preserving explicit button/Enter behavior.
  let t; input?.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(searchNow,280)});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
})();