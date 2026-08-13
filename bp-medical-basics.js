(()=>{
const STEPS=[
 {n:'01',k:'Drug / Modality',title:'先判断“它是什么”',body:'先看靶点、药物形式和作用机制。以 ADC / ATTC 为例，不能只看“都是 ADC”，还要看 target、antibody、linker、payload、DAR、bystander effect 与 safety window。',why:'这些设计决定可覆盖患者、疗效上限、毒性、CMC复杂度和制造成本。'},
 {n:'02',k:'Development Stage',title:'再判断“走到哪一步”',body:'FIH / Phase I 主要回答安全性、剂量与PK；Phase II开始验证PoC；Phase III用更大样本确认获益；BLA/NDA与获批则进入注册和商业化准备。',why:'阶段越后，失败概率通常下降，但患者数、中心数、供应和商业准备投入会快速上升。'},
 {n:'03',k:'Clinical Evidence',title:'然后判断“数据有多硬”',body:'ORR回答多少患者肿瘤缩小，DoR回答维持多久，PFS看疾病进展，OS看生存。还要结合样本量、对照组、HR、置信区间、治疗线次和安全性。',why:'一条“ORR很高”的早期新闻，和随机III期PFS/OS阳性，对开发决策与预算的意义完全不同。'},
 {n:'04',k:'Competitive Meaning',title:'再问“它真的和我们竞争吗”',body:'同靶点不等于直接竞品。要同时比较适应症、患者生物标志物、治疗线次、地区、临床阶段、疗效、安全性、给药便利性和上市时间窗。',why:'只有竞争窗口真的变化，才值得调整我们的开发优先级、差异化策略或BD假设。'},
 {n:'05',k:'Finance Impact',title:'最后落到“Finance要检查什么”',body:'把医学变化翻译成 timeline、enrollment、CMC、clinical supply、launch readiness、peak sales、probability of success、BD comparables 和 cash burn 的变化。',why:'Finance BP的终点不是复述新闻，而是判断 Forecast / Budget / valuation assumption 是否需要复核。'}
];
const ADC_CHAIN=[
 ['Mechanism','某 HER2 ADC 的 payload / linker 改变','可能改善 efficacy 或 safety window'],
 ['Evidence','Phase II 显示持续 ORR / DoR，随后 III 期达到主要终点','竞争信号从“值得观察”升级为“高确定性”'],
 ['Competition','如果适应症、线次和患者群与 Our HER2 ATTC 重叠','我们的差异化与上市时间窗可能被压缩'],
 ['Finance','开发节奏、入组假设、CMC投入或 launch-readiness 可能前移','需要复核 Forecast / Budget，而不是只收藏新闻']
];
function style(){const s=document.createElement('style');s.textContent=`
.bpBasics{margin:28px 0;padding:24px;border:1px solid #dde3ea;border-radius:18px;background:#fff;scroll-margin-top:18px}.bpBasicsHead{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;margin-bottom:18px}.bpBasicsHead h2{margin:4px 0 3px;font-size:24px}.bpBasicsHead p{margin:0;color:#667085}.bpBasicsEyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;color:#6b7280}.bpFlow{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;align-items:stretch}.bpStep{position:relative;border:1px solid #e4e7ec;border-radius:14px;padding:14px;background:#fcfcfd}.bpStep:not(:last-child):after{content:'→';position:absolute;right:-10px;top:50%;transform:translate(50%,-50%);z-index:2;background:#fff;color:#98a2b3;font-weight:800}.bpStepNo{font-size:11px;color:#98a2b3}.bpStepKey{font-size:11px;font-weight:800;color:#475467;text-transform:uppercase;letter-spacing:.05em}.bpStep h3{font-size:15px;margin:8px 0}.bpStep p{font-size:12px;line-height:1.5;color:#475467;margin:0 0 9px}.bpWhy{border-top:1px solid #eaecf0;padding-top:8px;font-size:11px;line-height:1.45;color:#667085}.bpCase{margin-top:18px;padding:16px;border-radius:14px;background:#f8fafc}.bpCase h3{margin:0 0 4px;font-size:17px}.bpCaseIntro{margin:0 0 12px;color:#667085;font-size:12px}.bpCaseRow{display:grid;grid-template-columns:100px 1fr 1fr;gap:10px;padding:10px 0;border-top:1px solid #e4e7ec;align-items:start}.bpCaseRow:first-of-type{border-top:0}.bpCaseStage{font-weight:800;font-size:12px}.bpCaseRow span{font-size:12px;line-height:1.45;color:#475467}.bpTakeaway{margin-top:14px;border-left:3px solid #101828;padding:9px 12px;font-size:13px;line-height:1.5;color:#344054}.bpBasicsNav{font-size:12px;border:1px solid #d0d5dd;border-radius:999px;padding:7px 10px;color:#344054;white-space:nowrap}@media(max-width:1050px){.bpFlow{grid-template-columns:1fr}.bpStep:not(:last-child):after{content:'↓';right:auto;left:50%;top:auto;bottom:-11px;transform:translate(-50%,50%)}.bpCaseRow{grid-template-columns:80px 1fr}}
`;document.head.appendChild(s)}
function render(){
 style();
 const anchor=document.querySelector('#decisionDesk');if(!anchor)return;
 const section=document.createElement('section');section.id='bpMedicalBasics';section.className='bpBasics';
 section.innerHTML=`<div class="bpBasicsHead"><div><span class="bpBasicsEyebrow">BP MEDICAL BASICS</span><h2>From medical signal to finance decision</h2><p>不是记术语，而是沿同一条逻辑判断：药是什么 → 走到哪一步 → 数据有多硬 → 是否真竞争 → 财务假设是否要变。</p></div><span class="bpBasicsNav">ADC / ATTC as running example</span></div><div class="bpFlow">${STEPS.map(x=>`<article class="bpStep"><span class="bpStepNo">${x.n}</span><div class="bpStepKey">${x.k}</div><h3>${x.title}</h3><p>${x.body}</p><div class="bpWhy"><b>Why it matters:</b> ${x.why}</div></article>`).join('')}</div><div class="bpCase"><h3>ADC example · 一条新闻应该怎么一路读到 Finance</h3><p class="bpCaseIntro">同一条竞争新闻，不停在“某ADC有新数据”，而是连续回答四个问题。</p>${ADC_CHAIN.map(x=>`<div class="bpCaseRow"><div class="bpCaseStage">${x[0]}</div><span>${x[1]}</span><span>→ ${x[2]}</span></div>`).join('')}<div class="bpTakeaway"><b>BP takeaway:</b> 医学事实本身不是终点。只有当证据成熟度、竞争重叠和时间窗口共同发生变化时，才升级为需要复核 Forecast / Budget / valuation assumption 的信号。</div></div>`;
 anchor.insertAdjacentElement('beforebegin',section);
 document.querySelectorAll('[data-bp-basics]').forEach(btn=>btn.addEventListener('click',()=>section.scrollIntoView({behavior:'smooth',block:'start'})));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',render):render();
})();