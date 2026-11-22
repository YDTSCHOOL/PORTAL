/* Compound app: screens, lesson engine, game layer, pacing and teacher view. */
document.querySelectorAll("svg.seal").forEach(s=>drawSeal(s, sealRings(5).map(r=>[r[0]+6,r[1]+1,r[2],r[3],1.1,.9])));
drawSeal($("bigSeal"), sealRings(10));

/* ================= State ================= */
let S, TOKEN=null, NAME="", DEMO=/[?&]demo/.test(location.search);
function normState(st){st=st||{};return {wk:st.wk||1, done:st.done||{}, quiz:st.quiz||{}, xp:st.xp||0, cur:st.cur||null, boss:st.boss||{}, ach:st.ach||[], bestCombo:st.bestCombo||0, dive:st.dive||{}, act:st.act||{}, hist:st.hist||[], vid:st.vid||{}, walk:st.walk||{}, help:st.help||{}, oriented:!!st.oriented}}
S = normState({});
const key=(w,d)=>w+"-"+d;
const UNITS=[["Money and time",1,3],["Earning, spending and borrowing",4,9],["Investing",10,15],["Business",16,20],["A plan for life",21,25]];
const unitOf=w=>UNITS.find(u=>w>=u[1]&&w<=u[2]);

/* ================= Dates and pacing ================= */
const dstr=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const today=()=>dstr(new Date());
function weekDates(){const d=new Date(); d.setDate(d.getDate()-d.getDay()); return [...Array(7)].map((_,i)=>{const x=new Date(d);x.setDate(d.getDate()+i);return dstr(x)})} // Sunday to Saturday
const actOf=d=>S.act[d]||{m:0,n:0};
const weekCount=()=>weekDates().reduce((a,d)=>a+actOf(d).n,0);
const weekMinutes=()=>Math.round(weekDates().reduce((a,d)=>a+actOf(d).m,0)/60);
function bumpDay(){const d=today(); S.act[d]=S.act[d]||{m:0,n:0}; S.act[d].n++; return S.act[d].n}
let lastAct=Date.now(), dirty=false;
setInterval(()=>{ if(!(TOKEN||DEMO)) return; if(Date.now()-lastAct<60000 && document.visibilityState==="visible"){const d=today(); S.act[d]=S.act[d]||{m:0,n:0}; S.act[d].m+=15; dirty=true} },15000);
setInterval(()=>{ if(dirty&&TOKEN){dirty=false; save()} },120000);

/* ================= Game layer ================= */
const RANKS=[[0,"Intern"],[150,"Bank Teller"],[400,"Analyst"],[800,"Associate"],[1300,"Trader"],[2000,"Portfolio Manager"],[3000,"Fund Manager"],[4500,"Chief Investment Officer"],[6500,"Mogul"]];
function rankOf(xp){let r=RANKS[0];for(const x of RANKS)if(xp>=x[0])r=x;return r[1]}
const nextRank=xp=>RANKS.find(x=>x[0]>xp);
function rankProgress(xp){const n=nextRank(xp); if(!n) return 100; let c=RANKS[0]; for(const x of RANKS) if(xp>=x[0]) c=x; return Math.round((xp-c[0])/(n[0]-c[0])*100)}
const TROPHIES={first:["First day done","Finish any lesson day"],perfect:["Perfect day","Score 100% on a day's practice"],combo5:["Combo ×5","Five first‑try answers in a row"],combo10:["Combo ×10","Ten first‑try answers in a row"],
  boss:["Boss beaten","Win any boss round"],speed:["Speedrun","Beat a boss in under 60 seconds"],flawless:["Flawless boss","Beat a boss with 5 of 5"],bosses5:["Boss hunter","Beat 5 different bosses"],
  week:["Week passed","Pass a weekly quiz"],ace:["Ace","Score 100% on a weekly quiz"],diver:["Deep diver","Get 3 of 3 on five Deep Dives"],weekgoal:["Weekly goal","Finish 4 lesson days in one week"],ahead:["Ahead of pace","Finish 2 lesson days in one day"]};
function award(id,list){if(!S.ach.includes(id)){S.ach.push(id);list.push(TROPHIES[id][0])}}
const BOSS_SECONDS=120, BOSS_QS=5, BOSS_WIN=4, BOSS_POINTS=50, AHEAD_BONUS=20, WEEK_BONUS=40;

/* ================= Grades ================= */
const GRADES=[[93,"A"],[90,"A−"],[87,"B+"],[83,"B"],[80,"B−"],[77,"C+"],[73,"C"],[70,"C−"],[67,"D+"],[63,"D"],[60,"D−"],[0,"F"]];
const letter=p=>GRADES.find(g=>p>=g[0])[1];
const gcls=p=>p>=90?"ga":p>=80?"gb":p>=70?"gc":p>=60?"gd":"gf";
const GRADE_WEIGHTS=[["Quizzes",.5],["Practice",.35],["Deep Dives",.15]];
function courseGrade(st){
  st=st||S; const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
  const prac=Object.entries(st.done).filter(([k])=>{const [w,d]=k.split("-").map(Number);return WEEKS[w-1]&&WEEKS[w-1].days&&!WEEKS[w-1].days[d-1].quiz}).map(([,v])=>v.p);
  const vals=[avg(Object.values(st.quiz)),avg(prac),avg(Object.values(st.dive).map(v=>v/3*100))];
  const have=vals.map((v,i)=>[v,GRADE_WEIGHTS[i][1]]).filter(x=>x[0]!==null); if(!have.length) return null;
  const p=Math.round(have.reduce((a,x)=>a+x[0]*x[1],0)/have.reduce((a,x)=>a+x[1],0));
  return {p,l:letter(p),parts:vals.map((v,i)=>[GRADE_WEIGHTS[i][0],v===null?null:Math.round(v)])};
}
const gchip=(p,big)=>`<span class="gchip ${gcls(p)}${big?" lg":""}">${letter(p)}</span>`;

/* ================= Server ================= */
async function rpc(fn,args,keep){
  const h={"Content-Type":"application/json","apikey":SUPABASE_KEY};
  if(SUPABASE_KEY.startsWith("eyJ")) h.Authorization="Bearer "+SUPABASE_KEY;
  const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/"+fn,{method:"POST",headers:h,body:JSON.stringify(args||{}),keepalive:!!keep});
  if(!r.ok) throw new Error("HTTP "+r.status);
  return r.json();
}
let saveChain=Promise.resolve();
function save(event,detail){
  if(DEMO||!TOKEN) return;
  const el=$("saving"); el.className="saving"; el.textContent="Saving…";
  const body={p_token:TOKEN,p_state:S,p_event:event||null,p_detail:detail||null};
  saveChain=saveChain.then(()=>rpc("finance_save",body)).then(res=>{
    if(res&&res.ok){el.textContent="Saved"} else {el.className="saving err";el.textContent=res&&res.error==="session"?"Signed out":"Not saved";
      if(res&&res.error==="session"){toast("Your session ended. Please sign in again.");setTimeout(signOut,1500)}}
  }).catch(()=>{el.className="saving err";el.textContent="Not saved"});
}

/* ================= Screens ================= */
const MODE={signin:"out",teacher:"out",reply:"out",messages:"app",dash:"app",course:"app",library:"app",trophies:"app",lesson:"focus",result:"focus"};
const TITLES={messages:"Messages",dash:"Dashboard",course:"Course",library:"Library",trophies:"Achievements",teacher:"Teacher view"};
let CUR_SCREEN="signin";
function show(id){
  CUR_SCREEN=id; if(id!=="result") clearInterval(autoT); if(id!=="lesson"&&typeof stopWalk==="function") stopWalk();
  document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("on",s.id===id));
  document.body.dataset.mode=MODE[id]; $("pageTitle").textContent=TITLES[id]||"";
  document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on",b.dataset.go===id));
  $("exitBtn").hidden=MODE[id]!=="focus"; $("topPill").hidden=MODE[id]!=="focus";
  $("topPill").textContent=rankOf(S.xp)+", "+S.xp+" points";
  $("sName").textContent=NAME; $("sRank").textContent=rankOf(S.xp)+", "+S.xp+" points"; $("sBar").style.width=rankProgress(S.xp)+"%";
  const cg=courseGrade(); $("sGrade").innerHTML=cg?`Grade ${gchip(cg.p)} ${cg.p}%`:"Grade: none yet";
}
const PAGES={messages:()=>renderMessages(false),dash:renderDash,course:()=>renderCourse(),library:()=>renderLibrary(),trophies:renderTrophies};
document.querySelectorAll("#nav button").forEach(b=>b.onclick=()=>PAGES[b.dataset.go]());
$("exitBtn").onclick=()=>{stopTimer();renderDash()};

/* ---------- Daily lock (set from the Teacher view) ---------- */
let LOCK={...DEFAULT_LOCK}, clockOffset=0; // offset corrects a wrong Chromebook clock using the server's time
const tmin=t=>{const [h,m]=t.split(":").map(Number);return h*60+m};
const nowMin=()=>{const d=new Date(); return (((d.getHours()*60+d.getMinutes()+clockOffset)%1440)+1440)%1440};
const fmtT12=t=>{const [h,m]=t.split(":").map(Number); return ((h+11)%12+1)+":"+String(m).padStart(2,"0")+(h<12?" AM":" PM")};
const closeLabel=()=>fmtT12(LOCK.close);
function isClosed(){ if(!LOCK.on) return false; const c=tmin(LOCK.close), o=tmin(LOCK.open), n=nowMin();
  if(c<o) return n>=c&&n<o; if(c>o) return n>=c||n<o; return false }
function minsToClose(){ if(!LOCK.on||isClosed()) return null; return (tmin(LOCK.close)-nowMin()+1440)%1440 }
async function fetchLock(){
  try{const r=await rpc("finance_get_settings",{}); if(r&&r.ok){LOCK={on:!!r.lock_on,close:r.close_time,open:r.open_time};
    if(typeof r.now_min==="number"){const d=new Date(), dev=d.getHours()*60+d.getMinutes(); let off=r.now_min-dev; if(off>720)off-=1440; if(off<-720)off+=1440; clockOffset=Math.abs(off)<=1?0:off}}}catch(e){}
  checkClock();
}
function setClosedView(){const c=isClosed(); $("signForm").hidden=c; $("closedBox").hidden=!c; $("inGo").hidden=c;
  if(c) $("closedMsg").textContent=`Your work is saved. Compound opens again at ${fmtT12(LOCK.open)}. Have a good day!`}
async function closeForDay(){
  clearInterval(autoT); stopTimer(); closeHelp();
  const tok=TOKEN, st=S, demo=DEMO;
  TOKEN=null;NAME="";DEMO=false;S=normState({});dirty=false;$("saving").textContent="";$("clockWarn").hidden=true;
  show("signin"); setClosedView();
  if(tok&&!demo){try{await rpc("finance_save",{p_token:tok,p_state:st,p_event:"closed",p_detail:`Signed out automatically at ${closeLabel()}`}); await rpc("finance_signout",{p_token:tok})}catch(e){}}
}
function checkClock(){
  const inApp=!!(TOKEN||DEMO), left=minsToClose();
  if(inApp&&left!==null&&left>0&&left<=CLOSE_WARN_MINUTES){$("clockWarn").hidden=false; $("clockWarn").textContent=`Class ends at ${closeLabel()}: ${left} minute${left>1?"s":""} left. Your work saves automatically.`}
  else $("clockWarn").hidden=true;
  if(isClosed()&&inApp) closeForDay();
  else if(CUR_SCREEN==="signin") setClosedView();
}
setInterval(checkClock,10000);
setInterval(fetchLock,60000);

/* ---------- Sign in / out ---------- */
async function signIn(){
  if(isClosed()){setClosedView();return}
  const n=$("inName").value.trim(), p=$("inPin").value.trim(); $("inErr").textContent="";
  if(!n||!p){$("inErr").textContent="Type your first name and PIN.";return}
  $("inGo").disabled=true; $("inGo").textContent="Signing in…";
  try{
    const res=await rpc("finance_login",{p_name:n,p_pin:p});
    if(res.ok){TOKEN=res.token;NAME=res.name;S=normState(res.state);$("inPin").value="";lastAct=Date.now(); await fetchMsgs(); if(needsOrientation()) openOrientation(); else if(MSG.unread) renderMessages(true); else renderDash()}
    else if(res.error==="closed"){await fetchLock(); LOCK.on=true; setClosedView()}
    else $("inErr").textContent={name:"That name isn't on the school list. Check the spelling.",pin:"That PIN doesn't match. Try again.",locked:"Too many wrong PINs. Wait 5 minutes, then try again."}[res.error]||"Sign‑in didn't work. Ask your teacher.";
  }catch(e){$("inErr").textContent="Can't reach the school server. Check the Wi‑Fi and try again."}
  $("inGo").disabled=false; $("inGo").textContent="Sign in";
}
async function signOut(){
  stopTimer();
  if(TOKEN&&!DEMO){try{if(dirty)await rpc("finance_save",{p_token:TOKEN,p_state:S,p_event:null,p_detail:null}); await rpc("finance_signout",{p_token:TOKEN},true)}catch(e){}}
  TOKEN=null;NAME="";DEMO=false;S=normState({});dirty=false;$("saving").textContent="";$("inName").value="";$("clockWarn").hidden=true;show("signin");setClosedView();if(!isClosed())$("inName").focus();
}
$("inGo").onclick=signIn;
$("inPin").addEventListener("keydown",e=>{if(e.key==="Enter")signIn()});
$("inName").addEventListener("keydown",e=>{if(e.key==="Enter")$("inPin").focus()});
$("outBtn").onclick=signOut;
let idleT; function poke(){lastAct=Date.now(); clearTimeout(idleT); if(TOKEN||DEMO) idleT=setTimeout(()=>{toast("Signed out after "+IDLE_MINUTES+" minutes without activity.");signOut()},IDLE_MINUTES*60000)}
["click","keydown","pointermove"].forEach(ev=>document.addEventListener(ev,poke,{passive:true}));

/* ================= Navigation helpers ================= */
function dayOpen(w,d){ if(w>S.wk) return false; return d===1 || !!S.done[key(w,d-1)] }
function upNext(){
  if(S.cur) return {w:S.cur.w,d:S.cur.d,resume:true};
  const w=Math.min(S.wk,WEEKS.length), W=WEEKS[w-1];
  if(!W.days) return {w,none:true};
  const d=[1,2,3,4].find(x=>dayOpen(w,x)&&!S.done[key(w,x)]);
  return d?{w,d}:{w,d:4};
}
const totalDays=()=>WEEKS.length*4;
const contentWeeks=()=>WEEKS.filter(W=>W.days).length;
function miniBars(vals,labels,fmt){
  const W=520,H=150,L=34,B=22,T=8; const max=Math.max(...vals,1)*1.1; const n=vals.length, bw=(W-L-6)/n; const y=v=>T+(H-T-B)*(1-v/max);
  let g=""; for(let k=0;k<=2;k++){const v=max*k/2; g+=`<line x1="${L}" x2="${W-6}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line2)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${fmt(v)}</text>`}
  vals.forEach((v,i)=>{g+=`<rect x="${L+i*bw+bw*.2}" y="${y(v)}" width="${bw*.6}" height="${Math.max(0,H-B-y(v))}" rx="2" fill="${i===n-1?"var(--seal)":"var(--note)"}"/><text x="${L+i*bw+bw/2}" y="${H-6}" text-anchor="middle">${labels[i]}</text>`});
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
}

/* ================= Dashboard ================= */
function renderDash(){
  const nx=upNext(), wkN=weekCount(), tA=actOf(today()), quizVals=Object.values(S.quiz);
  const avg=quizVals.length?Math.round(quizVals.reduce((a,b)=>a+b,0)/quizVals.length):null;
  const doneCount=Object.keys(S.done).length, nr=nextRank(S.xp), cg=courseGrade();
  let next;
  if(nx.none){ next=`<span class="eyebrow">Up next: week ${nx.w}</span><h2>${esc(WEEKS[nx.w-1].title)}</h2><p class="muted">You've finished every lesson that's ready. This week is being written now. Until it arrives, sharpen your skills: retake bosses for a faster time, or redo any day for a higher score.</p><div style="margin-top:auto"><button class="btn" id="goCourse">Open the course</button></div>`; }
  else { const D=WEEKS[nx.w-1].days[nx.d-1];
    next=`<span class="eyebrow">${nx.resume?"Resume":"Up next"}: week ${nx.w}, day ${nx.d}</span><h2>${esc(D.title)}</h2><p class="muted" style="margin:0">${esc(D.desc)}. ${esc(WEEKS[nx.w-1].title)}.</p>
      <div class="next-meta"><span>${D.quiz?"Weekly quiz: 10 questions":(hasVid(nx.w,nx.d)?"Video, lesson, 10 practice problems, Deep Dive":hasWalk(nx.w,nx.d)?"Walkthrough, lesson, 10 practice problems, Deep Dive":"Lesson, 10 practice problems, Deep Dive")}</span><span>About 35 to 40 minutes</span><span>${D.quiz?`Pass mark ${PASS_MARK}%`:`Mastery ${MASTERY}%`}</span></div>
      <div class="next-row"><button class="btn" id="goNext">${nx.resume?"Resume":"Start"} day ${nx.d}</button>
      <div class="goal ${tA.n>0?"met":""}"><span class="dot"></span><span>${tA.n>0?(tA.n>1?`Today's goal met with ${tA.n} days finished. You're ahead of pace.`:`Today's goal met. Keep going: a second day today earns a ${AHEAD_BONUS}‑point ahead‑of‑pace bonus.`):"Today's goal: finish one full lesson day."}</span></div></div>`; }
  const days=[...Array(10)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-9+i);return d});
  const mins=days.map(d=>Math.round(actOf(dstr(d)).m/60));
  const recent=S.hist.slice(-6).reverse();
  const wd=weekDates(), dn=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  $("dash").innerHTML=`
   <div class="kpis">
    <div class="kpi"><div class="k">Rank</div><div class="v">${rankOf(S.xp)}</div><div class="meter gold"><i style="width:${rankProgress(S.xp)}%"></i></div><div class="s">${nr?`${nr[0]-S.xp} points to ${nr[1]}`:"Top rank reached"}</div></div>
    <div class="kpi"><div class="k">Points</div><div class="v">${S.xp.toLocaleString("en-US")}</div><div class="s">Best combo ×${S.bestCombo}</div></div>
    <div class="kpi"><div class="k">This week</div><div class="v">${wkN} of ${WEEKLY_GOAL} days</div><div class="meter"><i style="width:${Math.min(100,wkN/WEEKLY_GOAL*100)}%"></i></div><div class="s">${wkN>=WEEKLY_GOAL?'<span class="tag good">Goal met</span>':`${WEEKLY_GOAL-wkN} to go`}, ${weekMinutes()} active min</div></div>
    <div class="kpi"><div class="k">Course grade</div>${cg?`<div class="v">${gchip(cg.p,true)} ${cg.p}%</div><div class="s">${cg.parts.filter(x=>x[1]!==null).map(x=>`${x[0]} ${x[1]}%`).join(", ")}</div>`:`<div class="v">None yet</div><div class="s">Your grade starts with your first lesson day</div>`}</div>
    <div class="kpi"><div class="k">Course progress</div><div class="v">${Math.round(doneCount/totalDays()*100)}%</div><div class="meter"><i style="width:${doneCount/totalDays()*100}%"></i></div><div class="s">${doneCount} of ${totalDays()} days</div></div>
   </div>
   <div class="dash-grid">
    <div class="card next-card">${next}</div>
    <div class="card"><h3>Active minutes, last 10 days</h3>${mins.some(m=>m>0)?miniBars(mins,days.map(d=>d.getDate()),v=>Math.round(v)):`<p class="muted">Your activity will appear here once you start working. Only minutes when you're actually working are counted.</p>`}</div>
    <div class="card"><h3>Recent results</h3>${recent.length?`<table class="tbl"><tr><th>Date</th><th>Item</th><th class="num">Score</th></tr>${recent.map(h=>`<tr><td>${new Date(h.d+"T12:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td><td>${esc(h.k)}: ${esc(h.t)}</td><td class="num"><span class="tag ${h.ok?"good":"bad"}">${esc(h.s)}</span></td></tr>`).join("")}</table>`:`<p class="muted">Finished lessons, quizzes and boss rounds will be listed here.</p>`}</div>
    <div class="card"><h3>This week</h3><div class="wkstrip">${wd.map((d,i)=>{const a=actOf(d);return `<div class="${d===today()?"td":""} ${a.n?"has":""}"><span>${dn[i]}</span><b>${Math.round(a.m/60)}</b><em>min</em><i>${a.n?a.n+" day"+(a.n>1?"s":""):"&nbsp;"}</i></div>`}).join("")}</div><p class="muted" style="font-size:12.5px;margin:10px 0 0">Weekly goal: ${WEEKLY_GOAL} lesson days. Only minutes of real work are counted.</p></div></div>
   </div>`;
  if($("goNext")) $("goNext").onclick=()=>openDay(nx.w,nx.d);
  if($("goCourse")) $("goCourse").onclick=()=>renderCourse();
  show("dash");
}

/* ================= Course ================= */
let selWeek=null;
function renderCourse(w){
  selWeek = w || selWeek || Math.min(S.wk, WEEKS.length);
  const rows=UNITS.map(u=>`<div class="unit"><h4>Unit ${UNITS.indexOf(u)+1}: ${u[0]}</h4><div class="wk-rows" style="grid-template-columns:1fr 1fr">${WEEKS.slice(u[1]-1,u[2]).map((W,i)=>{const n=u[1]+i,open=n<=S.wk&&W.days,passed=(S.quiz[n]||0)>=PASS_MARK;
    return `<button class="wkrow ${open?"open":""} ${n===selWeek?"sel":""}" data-w="${n}" ${W.days?"":"disabled"} title="${esc(W.title)}${W.days?"":" (coming soon)"}"><span class="n">${n}</span><span class="t">${esc(W.title)}</span>${passed?'<span class="tag good">Passed</span>':W.days?(open?'<span class="tag gold">Open</span>':'<span class="tag plain">Locked</span>'):'<span class="tag plain">Soon</span>'}</button>`}).join("")}</div></div>`).join("");
  const W=WEEKS[selWeek-1];
  let detail;
  if(!W.days) detail=`<span class="eyebrow">Week ${selWeek}</span><h2>${esc(W.title)}</h2><p class="muted">This week is being written.</p>`;
  else{ const firstOpen=[1,2,3,4].find(d=>dayOpen(selWeek,d)&&!S.done[key(selWeek,d)]);
    detail=`<div class="week-head"><span class="eyebrow">Week ${selWeek}, unit ${UNITS.indexOf(unitOf(selWeek))+1}: ${unitOf(selWeek)[0]}</span><h2>${esc(W.title)}</h2><p class="muted" style="margin:0 0 14px">${esc(W.sub)}</p></div>
     <ul class="days">${W.days.map((D,i)=>{const d=i+1,k=key(selWeek,d),dn=S.done[k],open=dayOpen(selWeek,d),isCur=S.cur&&S.cur.w===selWeek&&S.cur.d===d;
       let info=esc(D.desc);
       if(dn) info+= D.quiz?`. Best ${S.quiz[selWeek]||dn.p}%`:`. Practice ${dn.p}%${S.dive[k]!==undefined?`, Deep Dive ${S.dive[k]}/3`:""}${S.boss[k]?`, boss ${S.boss[k]}s`:""}`;
       else if(!open) info+=selWeek>S.wk?". Opens when the previous week's quiz is passed":`. Opens after day ${d-1}`;
       return `<li class="day ${dn?"done":""} ${d===firstOpen?"next":""} ${open?"":"locked"}"><span class="dn">${d}</span><span><div class="dt">${esc(D.title)}</div><div class="dd">${info}</div></span><span class="acts">${allowed(selWeek,d)?`<button class="btn small" data-d="${d}">${isCur?"Resume":"Start"}</button>`:dn?'<span class="tag good">Completed</span>':""}</span></li>`}).join("")}</ul>
     <p class="muted" style="margin-top:auto;font-size:13px">Finished lessons are locked, so the course only moves forward. Lesson days need ${MASTERY}% on practice to count. The weekly quiz needs ${PASS_MARK}% to open the next week.</p>`; }
  $("course").innerHTML=`<div class="card"><h3>Course map</h3><div class="units">${rows}</div></div><div class="card">${detail}</div>`;
  $("course").querySelectorAll(".wkrow:not([disabled])").forEach(b=>b.onclick=()=>renderCourse(+b.dataset.w));
  $("course").querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>openDay(selWeek,+b.dataset.d));
  show("course");
}

/* ================= Library ================= */
let libTab="glossary", libQ="";
function formulaSets(){return WEEKS.map((W,i)=>W.days?{w:i+1,t:W.title,f:[...new Set(W.days.flatMap(D=>D.steps.flatMap(s=>[...s.t.matchAll(/<div class="formula">(.*?)<\/div>/g)].map(m=>m[1]))))]}:null).filter(Boolean)}
function renderLibrary(){
  const q=libQ.toLowerCase();
  let body;
  if(libTab==="glossary"){
    const terms=GLOSSARY.filter(g=>!q||g[0].toLowerCase().includes(q)||g[1].toLowerCase().includes(q)).sort((a,b)=>a[0].localeCompare(b[0]));
    body=`<div class="card scroll"><div class="gl">${terms.map(g=>`<div class="${g[2]>S.wk?"lk":""}"><b>${esc(g[0])}</b> <span class="tag plain" style="display:inline-block">Week ${g[2]}</span><span>${esc(g[1])}</span></div>`).join("")||'<p class="muted">No terms match that search.</p>'}</div></div>`;
  } else {
    const sets=formulaSets().filter(s=>!q||s.t.toLowerCase().includes(q)||s.f.some(f=>f.toLowerCase().includes(q)));
    body=`<div class="scroll"><div class="fs">${sets.map(s=>`<div class="card"><span class="eyebrow">Week ${s.w}</span><h3 style="font-size:17px;margin:2px 0 8px">${esc(s.t)}</h3><table>${s.f.map(f=>`<tr><td>${f}</td></tr>`).join("")}</table></div>`).join("")}</div></div>`;
  }
  $("library").innerHTML=`<div class="lib-bar"><div class="tabs"><button data-t="glossary" class="${libTab==="glossary"?"on":""}">Glossary (${GLOSSARY.length} terms)</button><button data-t="formulas" class="${libTab==="formulas"?"on":""}">Formula sheet</button></div><input id="libQ" placeholder="Search" value="${esc(libQ)}" aria-label="Search the library"></div>${body}`;
  $("library").querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{libTab=b.dataset.t;renderLibrary()});
  const inp=$("libQ"); inp.oninput=()=>{libQ=inp.value;renderLibrary();const n=$("libQ");n.focus();n.setSelectionRange(n.value.length,n.value.length)};
  show("library");
}

/* ================= Achievements ================= */
const TROPHY_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h10v5a5 5 0 0 1-10 0zM12 14v4M8 21h8"/></svg>';
function renderTrophies(){
  const bosses=Object.keys(S.boss).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  $("trophies").innerHTML=`<div class="card"><h3>Trophies <span class="muted" style="font-family:var(--sans);font-size:14px">${S.ach.length} of ${Object.keys(TROPHIES).length}</span></h3><div class="tro">${Object.entries(TROPHIES).map(([id,t])=>`<div class="tr ${S.ach.includes(id)?"got":""}"><span class="ic">${TROPHY_ICON}</span><span><b>${t[0]}</b><span>${t[1]}</span></span></div>`).join("")}</div></div>
   <div style="display:grid;grid-template-rows:auto minmax(0,1fr);gap:16px;min-height:0">
    <div class="card"><h3>Career ladder</h3><div class="ranks">${RANKS.map(r=>`<div class="rk-row ${rankOf(S.xp)===r[1]?"cur":S.xp>=r[0]?"past":""}"><span>${r[1]}</span><span>${r[0].toLocaleString("en-US")} pts</span></div>`).join("")}</div></div>
    <div class="card scroll"><h3>Boss records</h3>${bosses.length?`<table class="tbl"><tr><th>Boss</th><th class="num">Best time</th></tr>${bosses.map(k=>{const [w,d]=k.split("-");return `<tr><td>Week ${w}, day ${d}: ${esc(WEEKS[w-1].days[d-1].title)}</td><td class="num">${S.boss[k]}s</td></tr>`}).join("")}</table>`:`<p class="muted">Beat a boss round after any lesson day to set a record.</p>`}</div>
   </div>`;
  show("trophies");
}

/* ================= Lesson engine ================= */
let L=null;
function buildQs(day,seed){
  const rng=mulberry(seed); RNG=rng;
  const list = day.quiz ? shuffle(rng,day.quizFrom).slice(0,10) : day.practice;
  return list.map(g=>{const q=G[g](rng); if(q.correctText) q.correct=q.choices.indexOf(q.correctText); return q});
}
const hasVid=(w,d)=>USE_VIDEOS&&!!VIDEOS[key(w,d)];
function allowed(w,d){const nx=upNext(); return !nx.none&&nx.w===w&&nx.d===d}
function openDay(w,d){
  if(needsOrientation()){openOrientation();return}
  if(!allowed(w,d)){toast("Finished lessons are locked. Keep moving forward.");return}
  const day=WEEKS[w-1].days[d-1];
  if(S.cur&&S.cur.w===w&&S.cur.d===d){L=Object.assign({},S.cur)}
  else{L={w,d,seed:Math.floor(Math.random()*1e9),phase:hasVid(w,d)?"video":(hasWalk(w,d)?"walk":"learn"),step:0,seen:0,qi:0,pts:0,res:[],combo:0,bonus:0,maxCombo:0}; save("start",`Week ${w} day ${d}: ${day.title}`)}
  L.day=day; L.qs=buildQs(day,L.seed); L.tries=0; L.answered=false; L.boss=false; L.seen=L.seen||0;
  if(L.phase==="dive") L.diveT0=Date.now();
  persistCur(); renderLesson(); show("lesson");
}
function persistCur(){if(L.boss)return; S.cur={w:L.w,d:L.d,seed:L.seed,phase:L.phase,step:L.step,seen:L.seen,qi:L.qi,pts:L.pts,res:L.res,combo:L.combo,bonus:L.bonus,maxCombo:L.maxCombo}; save()}
function renderTrack(){
  let html="";
  if(!L.boss&&(hasVid(L.w,L.d)||hasWalk(L.w,L.d)||L.phase==="walk")){html+=`<i class="${L.phase==="video"||L.phase==="walk"?"h":"f"}" style="flex:3"></i><span style="width:8px"></span>`}
  if(!L.boss){L.day.steps.forEach((_,i)=>html+=`<i class="${(L.phase!=="learn"&&L.phase!=="video"&&L.phase!=="walk")||(L.phase==="learn"&&i<=L.step)?"f":""}"></i>`); html+=`<span style="width:8px"></span>`}
  L.qs.forEach((_,i)=>{const r=L.res[i];html+=`<i class="${r===undefined?(L.phase==="practice"&&i===L.qi?"h":""):r>=1?"r":r>0?"h":"w"}"></i>`});
  if(!L.boss&&!L.day.quiz&&DIVES[key(L.w,L.d)]){html+=`<span style="width:8px"></span><i class="${L.phase==="dive"?"h":""}" style="flex:3"></i>`}
  $("lTrack").innerHTML=html;
  const ans=L.res.filter(x=>x!==undefined);
  if((L.phase==="practice")&&ans.length){const pc=Math.round(ans.reduce((a,b)=>a+b,0)/ans.length*100); $("lScore").innerHTML=`<span class="muted">Score so far</span> ${pc}% ${gchip(pc)}`; $("lScore").hidden=false}
  else if(L.phase==="dive"&&L.diveScore!==undefined){const pc=Math.round(L.diveScore/3*100); $("lScore").innerHTML=`<span class="muted">Deep Dive</span> ${pc}% ${gchip(pc)}`; $("lScore").hidden=false}
  else $("lScore").hidden=true;
}
let stepTimer=null;
function renderLesson(){
  clearInterval(stepTimer);
  $("lTitle").textContent= L.boss?`Boss round: ${L.day.title}`:`Week ${L.w}, day ${L.d}: ${L.day.title}`;
  $("lCombo").textContent = L.combo>=3?`Combo ×${L.combo}`:"";
  $("lBody").className="lbody"; $("lLeft").className="col lesson-text";
  renderTrack();
  if(L.phase==="video"){renderVideo();return}
  if(L.phase==="walk"){renderWalk();return}
  if(L.phase==="learn"){
    const st=L.day.steps[L.step], last=L.step===L.day.steps.length-1;
    $("lPhase").textContent=`Lesson, step ${L.step+1} of ${L.day.steps.length}`;
    $("lLeft").innerHTML=`<h2>${st.h}</h2>${st.t}`; $("lRight").innerHTML=st.b();
    const label=last?(L.day.quiz?"Start the quiz":"Start practice"):"Next step";
    $("lNav").innerHTML=`<button class="btn ghost" id="nBack" ${L.step===0?"disabled":""}>Back</button><span class="spacer"></span><button class="btn" id="nNext">${label}</button>`;
    $("nBack").onclick=()=>{L.step--;renderLesson()};
    $("nNext").onclick=()=>{L.seen=Math.max(L.seen,L.step+1); if(last){L.phase="practice";L.qi=0}else L.step++; persistCur(); renderLesson()};
    if(L.step>=L.seen && !DEMO_FAST){ let left=STEP_SECONDS; const b=$("nNext"); b.disabled=true; b.textContent=`${label} (${left})`;
      stepTimer=setInterval(()=>{left--; if(left<=0){clearInterval(stepTimer); b.disabled=false; b.textContent=label} else b.textContent=`${label} (${left})`},1000) }
  } else if(L.phase==="dive") renderDive();
  else renderQuestion();
  $("lLeft").scrollTop=0;
}
const DEMO_FAST=/[?&]fast/.test(location.search); // testing only: skips reading timers
function formulaCards(){ if(L.day.quiz||L.boss) return "";
  const f=[...new Set(L.day.steps.flatMap(s=>[...s.t.matchAll(/<div class="formula">(.*?)<\/div>/g)].map(m=>m[1])))];
  return f.length?`<h4 style="margin-top:4px">Formulas from the lesson</h4><div class="fcards">${f.slice(0,4).map(x=>`<div class="fcard">${x}</div>`).join("")}</div>`:"";
}
function renderQuestion(){
  const q=L.qs[L.qi];
  $("lPhase").textContent=`${L.boss?"Boss":L.day.quiz?"Quiz":"Practice"}, question ${L.qi+1} of ${L.qs.length}`;
  const ansUI = q.choices ? `<div class="choices" id="choices">${q.choices.map((c,i)=>`<button class="choice" data-i="${i}">${esc(c)}</button>`).join("")}</div>`
    : `<div class="ansrow">${q.unit==="$"?'<span class="unit">$</span>':""}<input id="ans" inputmode="decimal" autocomplete="off" aria-label="Your answer">${q.unit&&q.unit!=="$"?`<span class="unit">${q.unit}</span>`:""}</div>`;
  $("lLeft").innerHTML=`<p class="q">${q.q}</p>${ansUI}<div id="fb"></div>`;
  $("lRight").innerHTML=`<div class="board tools"><h4>Calculator</h4><div class="calc"><input id="calcIn" aria-label="Calculator" placeholder="e.g. 2500*1.06^8"><button class="btn small" id="calcGo">=</button></div><div class="calc-out" id="calcOut"></div><p class="calc-tip">Use ^ for powers and brackets for roots: 2^(1/8). Press Enter to calculate.</p>${formulaCards()}</div>`;
  $("calcGo").onclick=calc; $("calcIn").addEventListener("keydown",e=>{if(e.key==="Enter")calc()});
  navForQuestion();
  if(q.choices) $("choices").querySelectorAll(".choice").forEach(b=>b.onclick=()=>{if(L.answered)return;$("choices").querySelectorAll(".choice").forEach(x=>x.classList.remove("picked"));b.classList.add("picked")});
  else { $("ans").addEventListener("keydown",e=>{if(e.key==="Enter"){L.answered?next():check()}}); setTimeout(()=>$("ans")&&$("ans").focus(),30) }
}
function navForQuestion(){
  const test=L.day.quiz||L.boss;
  const q=L.qs[L.qi];
  $("lNav").innerHTML=`${test?"":`<button class="btn ghost" id="nHint">Hint</button>${q.choices||L.answered?"":`<button class="btn ghost" id="nSetup">Set it up</button>`}<button class="btn ghost" id="nLesson">Review lesson</button>${stuckReady()?`<button class="btn gold" id="nStuck">Still stuck? Email my teacher</button>`:""}`}<span class="spacer"></span>${L.answered?`<button class="btn" id="nNext">${L.qi===L.qs.length-1?"Continue":"Next question"}</button>`:`<button class="btn" id="nCheck">Check answer</button>`}`;
  if(!test){
    $("nHint").onclick=()=>{qHelp().hint=true; $("fb").innerHTML=`<div class="fb hint"><b>Hint.</b> ${q.hint}</div>`; navForQuestion()};
    if($("nSetup")) $("nSetup").onclick=()=>{qHelp().setup=true; const lines=setupLines(q);
      $("fb").innerHTML=`<div class="fb hint"><b>Set it up.</b> Here's how to set up the problem. You fill in each <span class="qmark">?</span>.${lines.length?`<ol>${lines.map(x=>`<li>${x}</li>`).join("")}</ol>`:`<br>${q.hint}`}</div>`; navForQuestion()};
    $("nLesson").onclick=reviewLesson;
    if($("nStuck")) $("nStuck").onclick=showStuckForm;
  }
  if(L.answered) $("nNext").onclick=next; else $("nCheck").onclick=check;
}
function reviewLesson(){
  let i=0; const tries=L.tries;
  const draw=()=>{const st=L.day.steps[i];$("lPhase").textContent=`Reviewing step ${i+1} of ${L.day.steps.length}`;$("lLeft").innerHTML=`<h2>${st.h}</h2>${st.t}`;$("lRight").innerHTML=st.b();
    $("lNav").innerHTML=`<button class="btn ghost" id="rB" ${i===0?"disabled":""}>Back</button><button class="btn ghost" id="rN" ${i===L.day.steps.length-1?"disabled":""}>Next step</button><span class="spacer"></span><button class="btn" id="rDone">Back to question</button>`;
    $("rB").onclick=()=>{i--;draw()};$("rN").onclick=()=>{i++;draw()};$("rDone").onclick=()=>{renderQuestion();L.tries=tries}};
  draw();
}
function parseNum(s){s=String(s).replace(/[$,%\s]/g,"").replace(/−/g,"-");if(s===""||!/^-?\d*\.?\d+$/.test(s))return NaN;return parseFloat(s)}
function isRight(q,v){ if(isNaN(v))return false; const abs=q.abs!==undefined?q.abs:0.01, tol=q.tol!==undefined?q.tol:0.003; return Math.abs(v-q.ans)<=Math.max(abs,Math.abs(q.ans)*tol) }
function fmtAns(q){return q.unit==="$"?$m(r2(q.ans)):q.unit==="%"?nf(q.ans,2)+"%":q.unit?nf(q.ans,2)+" "+q.unit:nf(q.ans,4)}
function check(){
  const q=L.qs[L.qi], test=L.day.quiz||L.boss; let ok;
  if(q.choices){const p=document.querySelector(".choice.picked"); if(!p){$("fb").innerHTML=`<div class="fb hint">Pick an answer first.</div>`;return} ok=+p.dataset.i===q.correct}
  else{const v=parseNum($("ans").value); if(isNaN(v)){$("fb").innerHTML=`<div class="fb hint">Type a number, like 240 or 3.88.</div>`;return} ok=isRight(q,v); L.lastV=v}
  if(!test) qHelp().tries.push(q.choices?q.choices[+document.querySelector(".choice.picked").dataset.i]:$("ans").value.trim());
  const sol=`<ol>${q.steps.map(s=>`<li>${s}</li>`).join("")}</ol>`;
  if(ok) finishQ(test?1:(L.tries===0?1:.5), `<div class="fb good"><b>Correct.</b>${sol}</div>`);
  else if(!test && L.tries===0){ L.tries=1; $("fb").innerHTML=`<div class="fb bad"><b>Not quite.</b> ${diagnose(q,L.lastV)} Check your work and try once more.<br>${q.hint}</div>`; if(!q.choices)$("ans").select() }
  else finishQ(0, `<div class="fb bad"><b>The answer is ${q.choices?esc(q.choices[q.correct]):fmtAns(q)}.</b> Here's how:${sol}</div>`);
}
function finishQ(pts,html){
  const q=L.qs[L.qi];
  L.res[L.qi]=pts; L.pts+=pts; L.answered=true;
  if(pts===1){L.combo++; L.maxCombo=Math.max(L.maxCombo,L.combo); if(L.combo>=3&&!L.boss){const b=Math.min(L.combo-2,5)*2; L.bonus+=b; html=html.replace("<b>Correct.</b>",`<b>Correct. Combo ×${L.combo}, +${b} bonus points.</b>`)}}
  else { if(L.combo>=3) html=html.replace(/<div class="fb (good|bad)">/,m=>m+`Combo of ${L.combo} ended. `); L.combo=0 }
  $("lCombo").textContent=L.combo>=3?`Combo ×${L.combo}`:"";
  $("fb").innerHTML=html;
  if(q.choices) document.querySelectorAll(".choice").forEach((b,i)=>{b.disabled=true;if(i===q.correct)b.classList.add("right");else if(b.classList.contains("picked"))b.classList.add("wrong")});
  else $("ans").readOnly=true;
  renderTrack(); navForQuestion(); persistCur();
}
function next(){
  L.answered=false; L.tries=0;
  const sb=$("stuckBox"); if(sb) sb.remove();
  if(L.qi<L.qs.length-1){L.qi++;persistCur();renderQuestion();renderTrack();return}
  if(!L.boss && !L.day.quiz && DIVES[key(L.w,L.d)] && L.pts/L.qs.length*100>=MASTERY){L.phase="dive"; L.diveT0=Date.now(); persistCur(); renderLesson(); return}
  finishDay(false);
}

/* ---------- Khan Academy video ---------- */
let ytReady=null, player=null, vidPoll=null;
function loadYT(){
  if(ytReady) return ytReady;
  ytReady=new Promise((res,rej)=>{
    if(window.YT&&YT.Player) return res();
    const t=setTimeout(()=>rej(new Error("timeout")),10000);
    window.onYouTubeIframeAPIReady=()=>{clearTimeout(t);res()};
    const sc=document.createElement("script"); sc.src="https://www.youtube.com/iframe_api"; sc.onerror=()=>{clearTimeout(t);rej(new Error("blocked"))}; document.head.appendChild(sc);
  });
  ytReady.catch(()=>{ytReady=null});
  return ytReady;
}
function stopVideo(){if(typeof stopWalk==="function")stopWalk();clearInterval(vidPoll);vidPoll=null;if(player&&player.destroy){try{player.destroy()}catch(e){}}player=null}
const mmss=s=>Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0");
function renderVideo(){
  const k=key(L.w,L.d), V=VIDEOS[k]; stopVideo();
  $("lPhase").textContent="Video: watch, then continue to the lesson";
  $("lBody").className="vid";
  $("lLeft").className="col vleft"; $("lLeft").innerHTML=`<div class="vbox"><div id="ytp"></div><div class="vmsg" id="vmsg">Loading the video…</div></div>`;
  $("lRight").innerHTML=`<div class="board"><span class="eyebrow">Khan Academy</span><h3 style="font-size:21px;margin:2px 0 2px">${esc(V.title)}</h3><p class="muted" style="margin:0 0 12px;font-size:13px">Taught by Sal Khan</p>
    <h4>Listen for</h4><ol>${V.listen.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>${V.note?`<p class="cap">${esc(V.note)}</p>`:""}
    <h4 style="margin-top:14px">Your progress</h4><div class="meter"><i id="vbar" style="width:0%"></i></div><p class="cap" id="vtxt">Press play to start. Watch at least ${Math.round(WATCH_REQUIRED*100)}% to unlock the lesson.</p></div>`;
  $("lNav").innerHTML=`<span class="muted" style="font-size:13px">Skipping ahead doesn't count. Only time the video actually plays is counted.</span><span class="spacer"></span><button class="btn" id="vGo" disabled>Continue to lesson</button>`;
  const go=$("vGo"); go.onclick=()=>{stopVideo(); L.phase="learn"; L.step=0; persistCur(); renderLesson()};
  const unlock=(why)=>{go.disabled=false; if(why==="done"&&!S.vid[k]){S.vid[k]=1; save("video",`Week ${L.w} day ${L.d} video watched: ${V.title}`)}};
  if(DEMO_FAST) unlock("fast");
  const blocked=(reason)=>{stopVideo(); $("vmsg").hidden=false; $("vmsg").innerHTML=`<b>This video can't play on this computer.</b><br>${reason}<br>${walkable(L.w,L.d)?`<button class="btn small" id="vWalk" style="margin-top:10px">Watch the walkthrough instead</button><br>`:""}Or go straight to the lesson.`; if($("vWalk")) $("vWalk").onclick=()=>{stopVideo(); L.phase="walk"; persistCur(); renderLesson()}; $("vtxt").textContent="Video unavailable here."; unlock("blocked");
    if(!L.vBlockedLogged){L.vBlockedLogged=true; save("video blocked",`Week ${L.w} day ${L.d}: ${V.title}`)}};
  loadYT().then(()=>{
    if(L.phase!=="video") return;
    const watched=new Set(); let last=null;
    player=new YT.Player("ytp",{videoId:V.id,host:"https://www.youtube-nocookie.com",width:"100%",height:"100%",
      playerVars:{rel:0,modestbranding:1,playsinline:1},
      events:{onReady:()=>{$("vmsg").hidden=true;
          vidPoll=setInterval(()=>{ if(!player||!player.getCurrentTime) return;
            const t=player.getCurrentTime(), dur=player.getDuration()||0, st=player.getPlayerState();
            if(st===1 && last!==null && t>last && t-last<=2.6){ for(let x=Math.floor(last);x<Math.floor(t);x++) watched.add(x) }
            last=t; if(!dur) return;
            const share=Math.min(1,watched.size/Math.floor(dur));
            $("vbar").style.width=Math.round(share*100)+"%";
            $("vtxt").textContent=`Watched ${mmss(watched.size)} of ${mmss(dur)} (${Math.round(share*100)}%).`+(share>=WATCH_REQUIRED?" The lesson is unlocked.":` Reach ${Math.round(WATCH_REQUIRED*100)}% to unlock the lesson.`);
            if(share>=WATCH_REQUIRED && go.disabled) unlock("done");
          },1000)},
        onError:()=>blocked("The school network or the video's settings stopped it from playing.")}});
  }).catch(()=>blocked("YouTube seems to be blocked on this network."));
}

/* ---------- Deep Dive ---------- */
function renderDive(){
  const k=key(L.w,L.d), D=DIVES[k], rng=mulberry(L.seed+11);
  L.diveQs=D.qs.map(q=>{const order=shuffle(rng,q.choices.map((_,i)=>i));return {q:q.q,why:q.why,choices:order.map(i=>q.choices[i]),correct:order.indexOf(0)}});
  L.dPick={}; L.diveDone=false;
  $("lPhase").textContent="Deep Dive: read, then answer";
  $("lBody").className="dive";
  $("lLeft").className="col read"; $("lLeft").innerHTML=`<span class="eyebrow">Deep Dive</span><h2>${esc(D.title)}</h2>${D.sections.map(s=>`<h3>${esc(s[0])}</h3><p>${esc(s[1])}</p>`).join("")}`;
  $("lRight").innerHTML=`<div class="board">${L.diveQs.map((q,qi)=>`<div class="dq"><p>${qi+1}. ${esc(q.q)}</p><div class="choices">${q.choices.map((c,i)=>`<button class="choice" data-q="${qi}" data-i="${i}">${esc(c)}</button>`).join("")}</div><div class="why" id="why${qi}"></div></div>`).join("")}</div>`;
  $("lRight").querySelectorAll(".choice").forEach(b=>b.onclick=()=>{if(L.diveDone)return; const qi=+b.dataset.q; $("lRight").querySelectorAll(`.choice[data-q="${qi}"]`).forEach(x=>x.classList.remove("picked")); b.classList.add("picked"); L.dPick[qi]=+b.dataset.i});
  $("lNav").innerHTML=`<span class="muted" style="font-size:13px">Each correct answer is worth 10 points.</span><span class="spacer"></span><button class="btn" id="dCheck">Check answers</button>`;
  const b=$("dCheck"); const tick=()=>{const left=Math.ceil((DIVE_SECONDS*1000-(Date.now()-L.diveT0))/1000); if(left>0&&!DEMO_FAST){b.disabled=true;b.textContent=`Check answers (${left})`} else {b.disabled=false;b.textContent="Check answers";clearInterval(stepTimer)}};
  tick(); stepTimer=setInterval(tick,1000);
  b.onclick=()=>{
    if(Object.keys(L.dPick).length<L.diveQs.length){toast("Answer all three questions first.");return}
    L.diveDone=true; let right=0;
    L.diveQs.forEach((q,qi)=>{const ok=L.dPick[qi]===q.correct; if(ok)right++;
      $("lRight").querySelectorAll(`.choice[data-q="${qi}"]`).forEach((x,i)=>{x.disabled=true; if(i===q.correct)x.classList.add("right"); else if(i===L.dPick[qi])x.classList.add("wrong")});
      $("why"+qi).textContent=(ok?"Correct. ":"")+q.why});
    L.diveScore=right; renderTrack();
    $("lNav").innerHTML=`<span><b>${right} of 3</b> correct</span><span class="spacer"></span><button class="btn" id="dFin">Finish day</button>`;
    $("dFin").onclick=()=>{$("lLeft").className="col lesson-text"; finishDay(false)};
  };
}

/* ---------- Boss round ---------- */
let bossTimer=null;
function stopTimer(){clearInterval(autoT);clearInterval(bossTimer);bossTimer=null;clearInterval(stepTimer);$("lTimer").hidden=true;stopVideo()}
function openBoss(w,d){
  const day=WEEKS[w-1].days[d-1], seed=Math.floor(Math.random()*1e9), rng=mulberry(seed); RNG=rng;
  const list=shuffle(rng,[...new Set(day.practice)]).slice(0,BOSS_QS);
  L={w,d,day,seed,boss:true,phase:"practice",step:0,qi:0,pts:0,res:[],tries:0,answered:false,combo:0,bonus:0,maxCombo:0,
     qs:list.map(g=>{const q=G[g](rng);if(q.correctText)q.correct=q.choices.indexOf(q.correctText);return q}),t0:Date.now()};
  save("boss start",`Week ${w} day ${d} boss`);
  stopTimer(); $("lTimer").hidden=false;
  const tick=()=>{const left=BOSS_SECONDS-Math.floor((Date.now()-L.t0)/1000), m=Math.max(0,left);
    $("lTimer").textContent=Math.floor(m/60)+":"+String(m%60).padStart(2,"0"); if(left<=0){stopTimer(); finishBoss(true)}};
  tick(); bossTimer=setInterval(tick,250);
  $("lLeft").className="col lesson-text"; renderLesson(); show("lesson");
}
function finishBoss(timedOut){
  stopTimer();
  const {w,d}=L, right=L.res.filter(x=>x===1).length, secs=Math.min(BOSS_SECONDS,Math.round((Date.now()-L.t0)/1000)), won=!timedOut&&right>=BOSS_WIN;
  const before=rankOf(S.xp), got=[]; let gained=right*5; const k=key(w,d), prev=S.boss[k];
  if(won){gained+=BOSS_POINTS; if(!prev||secs<prev) S.boss[k]=secs; award("boss",got); if(secs<60)award("speed",got); if(right===BOSS_QS)award("flawless",got); if(Object.keys(S.boss).length>=5)award("bosses5",got)}
  S.xp+=gained; pushHist(`W${w} D${d}`,"Boss round",`${right}/${BOSS_QS}${won?", "+secs+"s":""}`,won);
  save("boss",`Week ${w} day ${d} boss: ${right}/${BOSS_QS} in ${secs}s, ${won?"beaten":"not beaten"}`);
  const after=rankOf(S.xp), best=S.boss[k];
  $("resBox").innerHTML=`<h2>${won?"Boss beaten":timedOut?"Time's up":"The boss survived"}</h2><div class="big">${right} / ${BOSS_QS}</div>
   <p>${won?`Finished in ${secs} seconds.${best===secs?" That's your best time on this boss.":` Your best is ${best} seconds.`}`:`You need ${BOSS_WIN} right before the clock runs out. Every try has new numbers.`} You earned ${gained} points.</p>
   ${after!==before?`<div class="rankup">Promoted to ${after}</div>`:""}${got.length?`<div class="trophies">${got.map(t=>`<span class="trophy">${t}</span>`).join("")}</div>`:""}
   ${contRow(`<button class="btn ghost" id="again">${won?"Beat your time":"Fight the boss again"}</button>`,w,d)}`;
  show("result"); wireCont(); $("again").onclick=()=>{clearInterval(autoT);openBoss(w,d)};
}
function pushHist(k,t,s,ok){S.hist.push({d:today(),k,t,s,ok:!!ok}); if(S.hist.length>60) S.hist=S.hist.slice(-60)}

/* ---------- Auto-continue ---------- */
const AUTO_SECONDS=15; let autoT=null;
function contRow(extra,w,d){
  const nx=upNext();
  if(nx.none) return `<div class="row">${extra||""}<button class="btn" id="toDash">Back to dashboard</button></div>`;
  const same=nx.w===w&&nx.d===d, D=WEEKS[nx.w-1].days[nx.d-1];
  const label=same?(D.quiz?"Retake the quiz":`Redo day ${nx.d}`):`Continue: week ${nx.w}, day ${nx.d}`;
  return `<div class="row">${extra||""}<button class="btn" id="goOn">${label}</button></div><p class="muted" style="font-size:13px">Starting automatically in <b id="autoN">${AUTO_SECONDS}</b> seconds.</p>`;
}
function wireCont(){
  clearInterval(autoT); const nx=upNext();
  if($("toDash")) $("toDash").onclick=renderDash;
  if(!$("goOn")) return;
  const go=()=>{clearInterval(autoT); openDay(nx.w,nx.d)};
  $("goOn").onclick=go; let n=AUTO_SECONDS;
  autoT=setInterval(()=>{n--; if($("autoN"))$("autoN").textContent=Math.max(n,0); if(n<=0&&CUR_SCREEN==="result"&&!$("help").classList.contains("on")) go()},1000);
}

/* ---------- Finish a day ---------- */
function finishDay(timedOut){
  if(L.boss) return finishBoss(timedOut);
  const before=rankOf(S.xp), got=[], {w,d,day}=L, k=key(w,d);
  const total=L.qs.length, s=Math.round(L.pts*10)/10, pct=Math.round(L.pts/total*100);
  const passed = day.quiz ? pct>=PASS_MARK : pct>=MASTERY;
  let gained=Math.round(L.pts*10)+L.bonus, extra=[];
  S.cur=null; S.bestCombo=Math.max(S.bestCombo,L.maxCombo);
  if(L.maxCombo>=5)award("combo5",got); if(L.maxCombo>=10)award("combo10",got);
  let dive=null;
  if(!day.quiz && passed && L.diveScore!==undefined){dive=L.diveScore; gained+=dive*10; S.dive[k]=Math.max(S.dive[k]||0,dive);
    if(Object.values(S.dive).filter(v=>v===3).length>=5)award("diver",got)}
  if(passed){
    const prev=S.done[k]; if(!prev||prev.p<pct) S.done[k]={s,t:total,p:pct};
    award("first",got); if(pct===100&&!day.quiz)award("perfect",got);
    const n=bumpDay(); if(n>=2){gained+=AHEAD_BONUS; extra.push(`+${AHEAD_BONUS} ahead of pace`); award("ahead",got)}
    if(weekCount()===WEEKLY_GOAL){gained+=WEEK_BONUS; extra.push(`+${WEEK_BONUS} weekly goal`); award("weekgoal",got)}
  }
  S.xp+=gained;
  let title,msg="";
  if(day.quiz){
    S.quiz[w]=Math.max(S.quiz[w]||0,pct);
    if(passed){ if(S.wk===w) S.wk=w+1; title="Quiz passed"; award("week",got); if(pct===100)award("ace",got);
      msg = WEEKS[w]&&WEEKS[w].days ? `Week ${w+1}, “${esc(WEEKS[w].title)},” is now open.` : (w<WEEKS.length?`Week ${w+1} is being written. You've finished everything that's ready so far.`:`You've finished the course.`) }
    else { title="Not passed yet"; msg=`You need ${PASS_MARK}% to move on. Review the lesson days, then retake the quiz with new numbers.` }
    pushHist(`W${w} quiz`,day.title,pct+"%",passed);
    save("quiz",`Week ${w} quiz: ${pct}% ${passed?"passed":"not passed"}`);
  } else if(passed){ title="Day complete"; msg = d<4?`Day ${d+1} is now open.`:"";
    pushHist(`W${w} D${d}`,day.title,pct+"%",true);
    save("finish",`Week ${w} day ${d}: practice ${pct}%${dive!==null?`, Deep Dive ${dive}/3`:""}`);
  } else { title="Not mastered yet"; msg=`A lesson day needs ${MASTERY}% on practice to count. Redo it with new numbers. Use Review lesson and the hints.`;
    pushHist(`W${w} D${d}`,day.title,pct+"%",false);
    save("finish",`Week ${w} day ${d}: practice ${pct}%, below mastery, must redo`);
  }
  const after=rankOf(S.xp), nr=nextRank(S.xp);
  $("resBox").innerHTML=`<h2>${title}</h2><div class="big">${pct}% ${gchip(pct,true)}</div>
   <div class="split"><div><b>${day.quiz?`${s} / ${total}`:`${s} / ${total}`}</b><span>${day.quiz?"Quiz score":"Practice points"}</span></div><div><b>${dive!==null?dive+" / 3":day.quiz?"None":"Not taken"}</b><span>Deep Dive</span></div><div><b>+${gained}</b><span>Points earned</span></div></div>
   <p>${L.bonus?`Includes ${L.bonus} combo bonus points. `:""}${extra.join(", ")}${extra.length?". ":""}${after!==before?"":nr?`${nr[0]-S.xp} points to ${nr[1]}.`:""}</p>
   ${after!==before?`<div class="rankup">Promoted to ${after}</div>`:""}
   ${got.length?`<div class="trophies">${got.map(t=>`<span class="trophy">${t}</span>`).join("")}</div>`:""}<p>${msg}</p>
   ${!day.quiz&&passed?`<div class="boss-card"><b>Boss round</b> (optional)<br>${BOSS_QS} questions from today, ${BOSS_SECONDS/60} minutes on the clock, no hints. Get ${BOSS_WIN} right to win ${BOSS_POINTS} points.${S.boss[k]?` Your best: ${S.boss[k]} seconds.`:""}<div style="margin-top:8px"><button class="btn small gold" id="bossGo">Fight the boss</button></div></div>`:""}
   ${contRow("",w,d)}`;
  show("result"); wireCont();
  if($("bossGo"))$("bossGo").onclick=()=>{clearInterval(autoT);openBoss(w,d)};
}

/* ---------- Calculator ---------- */
function calc(){
  const raw=$("calcIn").value.replace(/,/g,"").replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-");
  if(!/^[0-9+\-*/().^\s]*$/.test(raw)||!raw.trim()){$("calcOut").textContent="Use numbers and + − * / ^ ( ) only";return}
  try{const v=Function('"use strict";return ('+raw.replace(/\^/g,"**")+')')(); $("calcOut").textContent=isFinite(v)?(+v.toPrecision(12)).toLocaleString("en-US",{maximumFractionDigits:8}):"Can't calculate that"}catch(e){$("calcOut").textContent="Check the brackets and signs"}
}

/* ================= Help ================= */
const HELP_PAGES={
 signin:["Signing in","<p>Type your first name exactly as it appears on the school list, and the same PIN you use for the school portal.</p><p>After 5 wrong PINs, sign‑in pauses for 5 minutes. If you've forgotten your PIN, ask your teacher.</p>"],
 dash:["Your dashboard","<p><b>Up next</b> always shows the next lesson. Press Start to begin, or Resume to pick up where you stopped.</p><p><b>Course grade</b> is your grade so far. <b>This week</b> tracks your goal of 4 lesson days. <b>Active minutes</b> counts only time you're actually working.</p>"],
 course:["The course map","<p>The course has 25 weeks in 5 units. A green tag means the week's quiz is passed. Finished lessons are locked, so the course only moves forward. The Start button appears on the one lesson that's next.</p>"],
 library:["The library","<p>Use the search box to look up any term or formula from the course. Terms from weeks you haven't reached yet are shown lighter.</p>"],
 trophies:["Achievements","<p>Trophies are earned for skill and steady work. Your rank goes up as you earn points. Boss records show your best time on each boss round.</p>"],
 result:["Your results","<p>Your score and letter grade for the day are shown at the top. The next lesson starts automatically. Press Continue to start it now.</p><p>The boss round is optional. Pressing it pauses the countdown.</p>"],
 teacher:["Teacher view","<p>Choose a week to move the student. Reset erases all progress. The activity log on the right lists sign‑ins, lessons, quiz results, help requests and blocked videos.</p>"]
};
const HELP_PHASES={
 walk:["Watching the walkthrough","<p>The walkthrough plays by itself: today's plan, the big ideas, the formulas, and two problems worked out step by step with fresh numbers. Use <b>Pause</b>, <b>Back</b> and <b>Replay part</b> anytime, and click any part in the list on the right to rewatch it.</p><p>Watch to the end to unlock the lesson. If your Chromebook has a male voice installed, <b>Read aloud</b> will narrate it.</p>"],
 video:["Watching the video","<p>Press play and watch at least "+Math.round(WATCH_REQUIRED*100)+"% of the video. The progress bar on the right fills as you watch. Skipping ahead doesn't count.</p><p>Read the <b>Listen for</b> questions first so you know what to pay attention to. If the video won't play, a message appears and you can go straight to the lesson.</p>"],
 learn:["Reading the lesson","<p>Read the left side first, then study the worked example on the right. Each new step stays on screen for a few seconds before Next unlocks.</p><p>The gold boxes are formulas. You'll find all of them in the Library later. Use Back to reread an earlier step in this lesson.</p>"],
 practice:["Practice problems","<p><b>Hint</b> gives you a nudge without giving away the answer. <b>Review lesson</b> shows the lesson steps again.</p><p>You get two tries. Right the first time earns 1 point, right the second time earns ½, and after that you'll see the worked solution. You need "+MASTERY+"% for the day to count.</p>"],
 quiz:["The weekly quiz","<p>10 questions, one try each, no hints. You need "+PASS_MARK+"% to open next week. If you don't make it, you retake the quiz with new numbers. The calculator is still available.</p>"],
 boss:["Boss round","<p>5 questions, 2 minutes, no hints. Get "+BOSS_WIN+" right before time runs out to win. It's optional, and every try has new numbers.</p>"],
 dive:["Deep Dive","<p>Read all three sections before answering. The questions are about details in the reading, so scan back to find each answer. Answers unlock after "+DIVE_SECONDS+" seconds. Each one is worth 10 points.</p>"]
};
function helpContext(){
  if(CUR_SCREEN==="lesson"&&OR&&$("lTitle").textContent==="Course orientation") return ["Orientation","<p>This tour explains what the course is about and what is expected of you. Read each step, then answer the three quick‑check questions to start week 1. You can open it again later from Help.</p>"];
  if(CUR_SCREEN==="lesson"&&L){ if(L.boss) return HELP_PHASES.boss; if(L.phase==="practice") return L.day.quiz?HELP_PHASES.quiz:HELP_PHASES.practice; return HELP_PHASES[L.phase]||HELP_PHASES.learn }
  return HELP_PAGES[CUR_SCREEN]||HELP_PAGES.dash;
}
function openHelp(){
  const [t,h]=helpContext(), signed=!!(TOKEN||DEMO), w=(L&&CUR_SCREEN==="lesson")?L.w:Math.min(S.wk,WEEKS.length);
  const terms=GLOSSARY.filter(g=>g[2]===w), fs=formulaSets().find(f=>f.w===w);
  $("helpBody").innerHTML=`<details open><summary>${t}</summary>${h}</details>
   ${signed&&S.oriented&&CUR_SCREEN!=="lesson"?`<details><summary>Course orientation</summary><p>See the welcome tour again: what the course is about, what is expected, and how grades work.</p><button class="btn small ghost" id="reOrient">Open the orientation</button></details>`:""}
   <details><summary>How your grade works</summary><p>Your course grade combines quizzes (50%), practice (35%) and Deep Dives (15%). Each uses the scores that count toward the course.</p><table class="tbl">${[["A",93],["A−",90],["B+",87],["B",83],["B−",80],["C+",77],["C",73],["C−",70],["D",60],["F",0]].map(g=>`<tr><td>${g[0]}</td><td class="num">${g[1]?g[1]+"% and up":"below 60%"}</td></tr>`).join("")}</table></details>
   <details><summary>Typing answers</summary><p>Type just the number: <b>240</b> or <b>3.88</b>. You don't need the $ or % sign, and commas are fine. Round money to the cent. Small rounding differences are accepted, but don't round in the middle of a problem, only at the end.</p></details>
   <details><summary>Using the calculator</summary><p>Use * to multiply and / to divide. Use ^ for powers: <b>1.06^8</b>. For a root, use a power in brackets: <b>2^(1/8)</b> is the 8th root of 2. Press Enter to calculate.</p></details>
   ${terms.length?`<details><summary>Key terms for week ${w}</summary>${terms.map(g=>`<p><b>${esc(g[0])}:</b> ${esc(g[1])}</p>`).join("")}</details>`:""}
   ${fs?`<details><summary>Formulas for week ${w}</summary>${fs.f.map(f=>`<div class="fcard" style="margin-bottom:6px">${f}</div>`).join("")}</details>`:""}
   ${signed&&CUR_SCREEN!=="teacher"?`<details><summary>Still stuck?</summary>${helpStuckHTML()}</details>`:""}`;
  if($("reOrient")) $("reOrient").onclick=()=>{closeHelp();openOrientation(true)};
  if($("askT")) $("askT").onclick=async()=>{
    const ctx=(CUR_SCREEN==="lesson"&&L)?`Week ${L.w} day ${L.d}, ${L.phase==="dive"?"Deep Dive":L.phase==="video"?"video":L.phase==="walk"?"walkthrough":"lesson step "+(L.step+1)}`:(TITLES[CUR_SCREEN]||CUR_SCREEN);
    const note=($("askMsg").value||"").trim(); if(!note){toast("Write what you need help with first.");return}
    $("askT").disabled=true; $("askT").textContent="Sending…";
    const r=await sendHelp(ctx,`Where: ${ctx}\nHis note: ${note}`,note);
    if(r==="limit"){toast("You've used today's help emails. Ask your teacher in person.");$("askT").textContent="Limit reached";return}
    $("askT").textContent="Sent"; toast("Your teacher will see your message.");
  };
  $("help").classList.add("on"); $("scrim").hidden=false;
}
function helpStuckHTML(){
  if(CUR_SCREEN==="lesson"&&L&&(L.boss||L.day.quiz)&&L.phase==="practice") return `<p>Help isn't available during quizzes and boss rounds. Do your best. You'll see the worked solution after each answer.</p>`;
  if(CUR_SCREEN==="lesson"&&L&&L.phase==="practice") return `<p>On a practice question, use <b>Hint</b> and <b>Set it up</b> first. If you're still stuck after both, or after you see the worked solution, a gold <b>Still stuck? Email my teacher</b> button appears next to them.</p>`;
  return `<p>Tell your teacher what you need help with. Your teacher will see which lesson you're on.</p><textarea id="askMsg" rows="3" maxlength="600" placeholder="What's confusing you?"></textarea><button class="btn small" id="askT" style="margin-top:8px">Email my teacher</button>`;
}
function closeHelp(){$("help").classList.remove("on"); $("scrim").hidden=true}
$("helpBtn").onclick=()=>$("help").classList.contains("on")?closeHelp():openHelp();
$("helpX").onclick=closeHelp; $("scrim").onclick=closeHelp;
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeHelp()});

/* ================= Teacher view ================= */
let TPASS="";
$("teachLink").onclick=()=>{const p=prompt("Teacher password (same as the school portal):"); if(!p) return; TPASS=p; loadTeacher()};
async function loadTeacher(){
  try{
    const res=await rpc("finance_admin_data",{p_pass:TPASS});
    if(!res.ok){alert("That password isn't right.");return}
    const fmtT=t=>t?new Date(t).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}):"";
    const wd=weekDates(), td=today();
    const rows=res.students.map(s=>{const st=normState(s.state), a=st.act[td]||{m:0,n:0};
      const wk=wd.reduce((x,d)=>x+((st.act[d]||{}).n||0),0), wm=Math.round(wd.reduce((x,d)=>x+((st.act[d]||{}).m||0),0)/60);
      const q=Object.keys(st.quiz).map(k=>`W${k} ${st.quiz[k]}%`).join(", ")||"None";
      const dv=Object.values(st.dive); const dAvg=dv.length?(dv.reduce((x,y)=>x+y,0)/dv.length).toFixed(1)+"/3":"None";
      return `<tr><td><b>${esc(s.name)}</b><div class="muted" style="font-size:12px">${rankOf(st.xp)}, ${st.xp} pts</div></td><td>${(g=>g?`${gchip(g.p)} ${g.p}%`:"None")(courseGrade(st))}</td>
       <td><select data-id="${esc(s.id)}" class="setwk">${WEEKS.map((W,i)=>`<option value="${i+1}" ${st.wk===i+1?"selected":""}>Week ${i+1}</option>`).join("")}</select></td>
       <td class="num">${Math.round(a.m/60)} min, ${a.n} day${a.n===1?"":"s"}${st.help[td]?`<br><span class="tag bad">${st.help[td]} help request${st.help[td]>1?"s":""}</span>`:""}</td><td class="num"><span class="tag ${wk>=WEEKLY_GOAL?"good":wk>0?"gold":"bad"}">${wk} of ${WEEKLY_GOAL}</span> ${wm} min</td>
       <td class="num">${Object.keys(st.done).length}</td><td>${q}</td><td class="num">${dAvg}</td><td class="num">${Object.keys(st.boss).length}</td><td class="num">${Object.keys(st.vid).length}</td><td>${fmtT(s.last_seen||s.updated_at)}</td>
       <td><button class="link" data-reset="${esc(s.id)}" data-name="${esc(s.name)}">Reset</button></td></tr>`}).join("");
    await fetchLock(); let em={}; try{em=await rpc("finance_admin_email_status",{p_pass:TPASS})}catch(e){}
    $("teacher").innerHTML=`<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><h2 style="font-size:24px">Compound, teacher view</h2>
     <div class="lockbar"><label class="switch"><input type="checkbox" id="lkOn" ${LOCK.on?"checked":""}><span></span></label><b id="lkState">${LOCK.on?"Daily lock on":"Daily lock off"}</b>
      <label>Closes <input type="time" id="lkClose" value="${LOCK.close}"></label><label>Reopens <input type="time" id="lkOpen" value="${LOCK.open}"></label>
      <button class="btn small" id="lkSave">Save</button><span class="muted" id="lkNow" style="font-size:12.5px">${isClosed()?"Closed right now":"Open right now"}</span></div>
     <span style="flex:1"></span><button class="btn ghost small" id="tRefresh">Refresh</button><button class="btn ghost small" id="tClose">Close</button></div>
     <div class="lockbar"><b>Help emails</b><label>Send to <input type="email" id="emTo" value="${esc(em.teacher_email||"")}" placeholder="you@example.com" style="width:220px"></label>
      <label>Resend key <input type="password" id="emKey" placeholder="${em.key_set?"Saved (leave blank to keep)":"re_…"}" style="width:200px"></label>
      <button class="btn small" id="emSave">Save</button><button class="btn ghost small" id="emTest">Send test email</button>
      <span class="muted" id="emState" style="font-size:12.5px">${em.teacher_email&&em.key_set?"Emails are on":"Emails are off until both are saved"}</span></div>
     <div class="tgrid"><div class="card scroll"><table class="tbl"><tr><th>Student</th><th>Grade</th><th>Week</th><th class="num">Today</th><th class="num">This week</th><th class="num">Days done</th><th>Quizzes</th><th class="num">Deep Dive avg</th><th class="num">Bosses</th><th class="num">Videos</th><th>Last active</th><th></th></tr>${rows||`<tr><td colspan="12">No one has signed in to Compound yet. Students appear here after their first sign‑in.</td></tr>`}</table></div>
     <div class="card scroll"><div class="tabs" style="align-self:flex-start;margin-bottom:10px"><button class="on" id="tTabMsgs">Help requests</button><button id="tTabLog">Activity log</button></div><div id="tMsgs"><p class="muted">Loading…</p></div><div id="tLogBox" hidden><table class="tbl"><tr><th>When</th><th>Student</th><th>Activity</th></tr>${res.log.map(l=>`<tr><td style="white-space:nowrap">${fmtT(l.at)}</td><td>${esc(l.name||"")}</td><td>${esc(l.detail||l.event)}</td></tr>`).join("")}</table></div></div></div>`;
    $("lkOn").onchange=()=>{$("lkState").textContent=$("lkOn").checked?"Daily lock on":"Daily lock off"};
    $("lkSave").onclick=async()=>{
      const r=await rpc("finance_admin_set_settings",{p_pass:TPASS,p_lock_on:$("lkOn").checked,p_close:$("lkClose").value,p_open:$("lkOpen").value});
      if(r.ok){await fetchLock(); $("lkNow").textContent=isClosed()?"Closed right now":"Open right now"; toast(LOCK.on?`Saved. Closes at ${fmtT12(LOCK.close)}, reopens at ${fmtT12(LOCK.open)}.`:"Saved. The daily lock is off.")}
      else toast(r.error==="time"?"Check the times and try again.":"Couldn't save. Check the password.");
    };
    $("emSave").onclick=async()=>{const r=await rpc("finance_admin_set_email",{p_pass:TPASS,p_email:$("emTo").value,p_key:$("emKey").value});
      if(r.ok){const st=await rpc("finance_admin_email_status",{p_pass:TPASS}); $("emKey").value=""; $("emKey").placeholder=st.key_set?"Saved (leave blank to keep)":"re_…";
        $("emState").textContent=st.teacher_email&&st.key_set?"Emails are on":"Emails are off until both are saved"; toast("Email settings saved.")} else toast("Couldn't save.")};
    $("emTest").onclick=async()=>{const r=await rpc("finance_admin_test_email",{p_pass:TPASS}); toast(r.sent?"Test sent. Check your inbox (and spam) in a minute.":"Not sent. Save your email and Resend key first, and turn on pg_net in Supabase.")};
    $("tTabMsgs").onclick=()=>{$("tTabMsgs").classList.add("on");$("tTabLog").classList.remove("on");$("tMsgs").hidden=false;$("tLogBox").hidden=true};
    $("tTabLog").onclick=()=>{$("tTabLog").classList.add("on");$("tTabMsgs").classList.remove("on");$("tMsgs").hidden=true;$("tLogBox").hidden=false};
    fillTeacherMsgs();
    $("tRefresh").onclick=loadTeacher; $("tClose").onclick=()=>{TPASS="";show("signin");setClosedView()};
    document.querySelectorAll(".setwk").forEach(sel=>sel.onchange=async()=>{const r=await rpc("finance_admin_set_week",{p_pass:TPASS,p_student:sel.dataset.id,p_week:+sel.value});toast(r.ok?"Week updated":"Couldn't update")});
    document.querySelectorAll("[data-reset]").forEach(b=>b.onclick=async()=>{if(!confirm(`Erase all of ${b.dataset.name}'s progress in Compound?`))return;const r=await rpc("finance_admin_reset",{p_pass:TPASS,p_student:b.dataset.reset});toast(r.ok?"Progress erased":"Couldn't reset");loadTeacher()});
    show("teacher");
  }catch(e){alert("Can't reach the school server. Check the Wi‑Fi and try again.")}
}

/* ================= Start ================= */
window.addEventListener("load",async()=>{ const rm=location.hash.match(/^#reply=(\d+)$/); if(rm){renderReplyPage(+rm[1]);return}
  await Promise.race([fetchLock(), new Promise(r=>setTimeout(r,3000))]);
  if(DEMO&&!isClosed()){NAME="Demo student"; if(needsOrientation()&&!DEMO_FAST) openOrientation(); else {S.oriented=S.oriented||DEMO_FAST; renderDash()}} else {DEMO=false;show("signin");setClosedView();if(!isClosed())$("inName").focus()} });
window.addEventListener("pagehide",()=>{if(TOKEN&&!DEMO){try{rpc("finance_save",{p_token:TOKEN,p_state:S,p_event:null,p_detail:null},true);rpc("finance_signout",{p_token:TOKEN},true)}catch(e){}}});
