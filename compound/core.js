/* Compound core: settings, helpers, charts and the content registries. */

/* ================= Settings ================= */
const SUPABASE_URL = "https://belathxxgwayxdmiqvpd.supabase.co";   // SCHOOL project
const SUPABASE_KEY = "sb_publishable_Kxuxi919RbsmEk-p8iNt-w_zm6BsRI9"; // public key, safe to keep here
const IDLE_MINUTES = 20;   // signs out after this long with no activity
const PASS_MARK = 80;      // quiz percent needed to open the next week
const VERSION = "3.4 (Nov 2026)";
const MASTERY = 70;       // practice percent needed for a day to count
const STEP_SECONDS = 8;   // a new lesson step must stay on screen this long
const DIVE_SECONDS = 40;  // reading time before Deep Dive answers can be checked
const WEEKLY_GOAL = 4;    // lesson days per week
// Daily lock. The real settings live in Supabase and are changed from the Teacher view.
// These are only used if the server can't be reached.
const DEFAULT_LOCK = {on:true, close:"15:10", open:"16:15"};
const CLOSE_WARN_MINUTES = 5; // warning shown this many minutes before closing
const USE_VIDEOS = true;  // true: Khan Academy videos open each lesson day. false: no videos.
const USE_WALKTHROUGHS = true; // animated step-by-step tutorial on lesson days without a video
const PRACTICE_CALC = 0;    // typed calculation problems per lesson day (0 = none; the math is shown, not asked)
const PRACTICE_CONCEPT = 2; // decision and concept questions per lesson day (pick an answer, no typing)
const CASE_SECONDS = 45;    // reading time before the first Case File question can be checked
const QUIZ_CALC = 0;        // weekly quiz: typed calculation problems; the rest are reading and decision questions
const QV = 3;               // question-set version, so a lesson saved under the old setup restarts cleanly
const WATCH_REQUIRED = 0.85; // share of a video that must be played before the lesson unlocks

/* ================= Helpers ================= */
const $ = id => document.getElementById(id);
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let RNG = Math.random;
const R = (a,b) => a + Math.floor(RNG()*(b-a+1));   // uses the current question's seeded RNG
const pick = (rng,arr) => arr[Math.floor(rng()*arr.length)];
const shuffle = (rng,arr) => {const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const r2 = x => Math.round(x*100)/100;
function $m(x){const neg=x<0;x=Math.abs(x);const whole=Math.abs(x-Math.round(x))<1e-9;const s=x.toLocaleString("en-US",{minimumFractionDigits:whole?0:2,maximumFractionDigits:2});return (neg?"−$":"$")+s}
const pc = x => (Math.round(x*1000)/1000).toString()+"%";
const nf = (x,d=4) => (+x.toFixed(d)).toString();
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("on"),2600)}
const work = (title, lines, ans) => `<div class="board"><h4>${title}</h4><ol>${lines.map(l=>`<li>${l}</li>`).join("")}</ol>${ans?`<div class="ans">${ans}</div>`:""}</div>`;
const NAMES = ["Eli","Dovid","Yosef","Ari","Moshe","Avi","Chaim","Yehuda","Ben","Sam","Natan","Meir"];

/* Guilloche seal: the engraved rosette from banknotes and stock certificates */
function drawSeal(svg, rings){
  let out = "";
  const cx=50, cy=50;
  rings.forEach(([R0,amp,lobes,rot,w,op])=>{
    let d=""; const N=720;
    for(let k=0;k<=N;k++){const th=k/N*Math.PI*2; const r=R0+amp*Math.sin(lobes*th+rot); const x=cx+r*Math.cos(th*1+rot*0), y=cy+r*Math.sin(th);
      d+=(k?"L":"M")+x.toFixed(2)+" "+y.toFixed(2)}
    out+=`<path d="${d}Z" fill="none" stroke="currentColor" stroke-width="${w}" opacity="${op}"/>`;
  });
  svg.innerHTML = out;
}
function sealRings(n){const r=[];for(let i=0;i<n;i++){r.push([20+i*2.6, 2.4+i*.3, 18, i*.32, .4, .7])}return r}

/* ================= Charts ================= */
function lineChart(series, xLabels, yFmt){
  const W=420,H=220,L=52,B=26,T=10,Rr=12; const all=series.flatMap(s=>s.vals); const max=Math.max(...all)*1.05, min=0;
  const x=i=>L+(W-L-Rr)*i/(series[0].vals.length-1), y=v=>T+(H-T-B)*(1-(v-min)/(max-min));
  let g=""; for(let k=0;k<=4;k++){const v=min+(max-min)*k/4; g+=`<line x1="${L}" x2="${W-Rr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${yFmt(v)}</text>`}
  xLabels.forEach((lab,i)=>{if(lab!=="")g+=`<text x="${x(i)}" y="${H-8}" text-anchor="middle">${lab}</text>`});
  series.forEach(s=>{g+=`<polyline fill="none" stroke="${s.color}" stroke-width="2.5" points="${s.vals.map((v,i)=>x(i)+","+y(v)).join(" ")}"/>`;
    const lv=s.vals[s.vals.length-1]; g+=`<text x="${W-Rr}" y="${y(lv)-7}" text-anchor="end" style="fill:${s.color};font-weight:600">${s.label}</text>`});
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
}
function barChart(vals, labels, yFmt, color){
  const W=420,H=220,L=52,B=26,T=10; const max=Math.max(...vals)*1.08; const n=vals.length; const bw=(W-L-10)/n;
  const y=v=>T+(H-T-B)*(1-v/max); let g="";
  for(let k=0;k<=4;k++){const v=max*k/4; g+=`<line x1="${L}" x2="${W-10}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${yFmt(v)}</text>`}
  vals.forEach((v,i)=>{g+=`<rect x="${L+i*bw+bw*.18}" y="${y(v)}" width="${bw*.64}" height="${H-B-y(v)}" rx="2" fill="${color||"var(--note)"}"/><text x="${L+i*bw+bw/2}" y="${H-8}" text-anchor="middle">${labels[i]}</text>`});
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
}
const kFmt = v => v>=1000 ? "$"+(Math.round(v/100)/10)+"k" : "$"+Math.round(v);


/* Week titles for the full course. Weeks without days are shown as coming soon. */
const OUTLINE = ["How money grows","Banks, inflation and real returns","The time value of money","Paychecks and taxes withheld","Budgeting","Credit cards","Loans and amortization","Credit scores and the cost of borrowing","Project: a first‑year budget","What a stock is","Stock returns, dividends and P/E","Bonds and yields","Funds, index funds and fees","Risk, return and diversification","Project: build a model portfolio","Business basics: revenue, cost, profit","Income statements","Balance sheets","Break‑even and pricing","Project: plan a small business","How income tax brackets work","Insurance and managing risk","Big purchases: cars and homes","Charity, goals and a long‑term plan","Capstone: a lifetime financial plan"];
const WEEKS = OUTLINE.map((t,i)=>({title:t,days:null}));


const G = {};        // question generators, added by content files
const DIVES = {};    // Deep Dive readings, keyed "week-day"
const GLOSSARY = []; // [term, definition, week]
const CASES = {};    // Case Files, keyed "week-day" (cases-*.js)
/* Case File helper. Each question: [question, correct, wrong, wrong, wrong, why, hint].
   Questions 4 and 5 stand on their own (no names from the story) so the weekly quiz can use them. */
function C(k, title, sections, qs){ CASES[k] = {title, sections, qs:qs.map(a=>({q:a[0],choices:a.slice(1,5),why:a[5],hint:a[6]}))}; }
function addWeek(n, W){ WEEKS[n-1] = W; }
