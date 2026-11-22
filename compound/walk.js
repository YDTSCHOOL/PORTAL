/* Compound walkthroughs: an animated, step-by-step tutorial that plays before the lesson
   on any lesson day without a Khan Academy video. Built from the day's own lesson, formulas
   and problem generators, so every day has one and the numbers are new each time.
   Optional read-aloud uses the Chromebook's built-in voice, and only a male voice. */

const walkable = (w,d) => { const W=WEEKS[w-1]; return !!(USE_WALKTHROUGHS && W && W.days && W.days[d-1] && !W.days[d-1].quiz); };
const hasWalk  = (w,d) => walkable(w,d) && !hasVid(w,d);

/* ---------- Building the scenes ---------- */
const firstSentence = h => { const p=String(h).match(/<p>([\s\S]*?)<\/p>/); const t=plain(p?p[1]:String(h).replace(/<[^>]+>/g," ")); const m=t.match(/^.*?[.!?](\s|$)/); return esc(m?m[0].trim():t); };
const markResult = s => String(s).replace(/=\s*([^=<]*(?:<sup>[^<]*<\/sup>[^=<]*)*)$/, '= <span class="res">$1</span>');

function walkScenes(w,d,seed){
  const D=WEEKS[w-1].days[d-1], rng=mulberry(seed+77), saved=RNG;
  const scenes=[];
  scenes.push({tag:"Today", title:D.title, beats:[
    {k:"lead", h:`${esc(D.desc)}. Here's the plan for today.`},
    ...D.steps.map((s,i)=>({k:"item", h:`<b>${i+1}.</b> ${s.h}`}))]});
  scenes.push({tag:"Big ideas", title:"What you need to know", beats:
    D.steps.map(s=>({k:"idea", h:`<b>${s.h}.</b> ${firstSentence(s.t)}`}))});
  const forms=[...new Set(D.steps.flatMap(s=>[...s.t.matchAll(/<div class="formula">(.*?)<\/div>/g)].map(m=>m[1])))]
    .flatMap(f=>f.split(/<br\s*\/?>/)).map(f=>f.trim()).filter(Boolean);
  if(forms.length) scenes.push({tag:"Tools", title:"Today's formulas", beats:[
    {k:"lead", h:"Keep these handy. You'll use them in every practice problem."},
    ...forms.map(f=>({k:"formula", h:f}))]});
  // Worked examples, made fresh from the day's own practice problems
  const gens=shuffle(rng,[...new Set(D.practice)]), picked=[];
  for(const g of gens){ if(picked.length>=2) break; RNG=mulberry(seed+picked.length*131+7); const q=G[g](RNG); if(!q.choices) picked.push(q); }
  if(!picked.length){ RNG=mulberry(seed+9); const q=G[gens[0]](RNG); if(q.correctText) q.correct=q.choices.indexOf(q.correctText); picked.push(q); }
  picked.forEach((q,i)=>{
    const beats=[{k:"q", h:q.q}];
    if(q.choices) beats.push({k:"choices", h:q.choices.map(c=>`• ${esc(c)}`).join("<br>")});
    beats.push({k:"plan", h:`<b>Plan:</b> ${q.hint}`});
    q.steps.forEach(s=>beats.push({k:"step", h:markResult(s)}));
    beats.push({k:"ans", h:`Answer: ${q.choices?esc(q.choices[q.correct]):fmtAns(q)}`});
    scenes.push({tag:`Example ${i+1}`, title:i===0?"Watch it done":"One more, with new numbers", beats});
  });
  scenes.push({tag:"Your turn", title:"Now you try", beats:[
    {k:"lead", h:"Next comes the lesson, one step at a time. Then 10 practice problems with new numbers."},
    {k:"item", h:`You need <b>${MASTERY}%</b> on practice for today to count.`},
    {k:"item", h:"Stuck? Use <b>Hint</b> first, then <b>Set it up</b>. Your teacher is one email away."},
    {k:"item", h:"Work it on paper the way you just saw it done. Keep every decimal until the last step."}]});
  RNG=saved;
  return scenes;
}

/* ---------- Voice (optional, male voices only) ---------- */
const FEMALE_V=/female|zira|susan|samantha|karen|victoria|hazel|moira|tessa|fiona|veena|kate|serena|libby|sonia|aria|jenny|michelle|emma|ava\b|allison|joanna|salli|kimberly|ivy|kendra|nicole|amy|olivia|natasha|clara|heera|ana\b|nora|catherine|google us english$/i;
const MALE_V=/\bmale\b|david|daniel|guy\b|george|james|mark\b|fred\b|alex\b|tom\b|aaron|arthur|rishi|ryan|eric\b|christopher|roger|brian|matthew|justin|joey|russell|oliver|liam|thomas|william/i;
let WVOICE=null;
function pickVoice(){ if(!("speechSynthesis" in window)) return null;
  const vs=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));
  WVOICE=vs.find(v=>MALE_V.test(v.name)&&!FEMALE_V.test(v.name))||null; return WVOICE; }
if("speechSynthesis" in window){ pickVoice(); speechSynthesis.onvoiceschanged=()=>{ pickVoice(); if(CUR_SCREEN==="lesson"&&L&&L.phase==="walk") walkControls(); }; }
const speakify = h => plain(h).replace(/×/g," times ").replace(/÷/g," divided by ").replace(/−/g," minus ").replace(/\^/g," to the power ")
  .replace(/=/g," equals ").replace(/≈/g," about ").replace(/%/g," percent").replace(/‑/g,"-").replace(/•/g,"").replace(/\s+/g," ").trim();

/* ---------- Player ---------- */
let WK=null;
function stopWalk(){ if(!WK) return; clearTimeout(WK.timer); WK.timer=null; WK.playing=false; if("speechSynthesis" in window) speechSynthesis.cancel(); }
function renderWalk(){
  stopWalk();
  const k=key(L.w,L.d), scenes=walkScenes(L.w,L.d,L.seed);
  const done=!!(S.walk&&S.walk[k]);
  WK={k, scenes, si:0, bi:0, far:done?scenes.length:0, playing:true, speed:WK?WK.speed:1, voice:WK?WK.voice&&!!WVOICE:false, timer:null, done};
  $("lPhase").textContent="Walkthrough: watch, then continue to the lesson";
  $("lBody").className="vid";
  $("lLeft").className="col vleft"; $("lLeft").innerHTML=`<div class="wstage" id="wStage"></div>`;
  walkPanel(); walkControls(); walkScene();
}
function walkPanel(){
  const total=WK.scenes.reduce((a,s)=>a+s.beats.length,0), pos=WK.scenes.slice(0,WK.si).reduce((a,s)=>a+s.beats.length,0)+WK.bi;
  const pct=WK.done?100:Math.round(pos/total*100);
  $("lRight").innerHTML=`<div class="board"><span class="eyebrow">Walkthrough</span><h3 style="font-size:21px;margin:2px 0 10px">${esc(L.day.title)}</h3>
    <ol class="wlist">${WK.scenes.map((s,i)=>`<li class="${i===WK.si?"on":i<Math.max(WK.far,WK.si)?"seen":""}"><button data-s="${i}" ${i<=Math.max(WK.far,WK.si)?"":"disabled"}>${esc(s.tag)}: ${esc(s.title)}</button></li>`).join("")}</ol>
    <h4 style="margin-top:14px">Your progress</h4><div class="meter"><i style="width:${pct}%"></i></div>
    <p class="cap">${WK.done?"Watched. The lesson is unlocked, and you can rewatch any part.":"Watch to the end to unlock the lesson. You can pause or go back anytime."}</p></div>`;
  $("lRight").querySelectorAll(".wlist button").forEach(b=>b.onclick=()=>{stopWalk(); WK.si=+b.dataset.s; WK.bi=0; WK.playing=true; walkControls(); walkScene()});
}
function walkControls(){
  if(!WK) return;
  const canVoice=!!WVOICE;
  $("lNav").innerHTML=`<button class="btn ghost" id="wBack" ${WK.si===0?"disabled":""}>Back</button>
    <button class="btn ghost" id="wPlay">${WK.playing?"Pause":"Play"}</button>
    <button class="btn ghost" id="wAgain">Replay part</button>
    <button class="btn ghost small" id="wSpeed">Speed ${WK.speed}×</button>
    ${canVoice?`<button class="btn ghost small" id="wVoice">${WK.voice?"Read aloud: on":"Read aloud: off"}</button>`:""}
    <span class="spacer"></span><button class="btn" id="wGo" ${WK.done||DEMO_FAST?"":"disabled"}>Continue to lesson</button>`;
  $("wBack").onclick=()=>{stopWalk(); WK.si=Math.max(0,WK.si-1); WK.bi=0; WK.playing=true; walkControls(); walkScene()};
  $("wAgain").onclick=()=>{stopWalk(); WK.bi=0; WK.playing=true; walkControls(); walkScene()};
  $("wPlay").onclick=()=>{ if(WK.playing){stopWalk(); walkControls()} else {WK.playing=true; walkControls(); walkNext()} };
  $("wSpeed").onclick=()=>{WK.speed=WK.speed===1?1.5:WK.speed===1.5?0.75:1; walkControls()};
  if(canVoice) $("wVoice").onclick=()=>{WK.voice=!WK.voice; if(!WK.voice&&"speechSynthesis" in window) speechSynthesis.cancel(); walkControls()};
  $("wGo").onclick=()=>{stopWalk(); L.phase="learn"; L.step=0; persistCur(); renderLesson()};
}
function walkScene(){
  const sc=WK.scenes[WK.si], st=$("wStage"); if(!st) return;
  st.classList.remove("fade"); void st.offsetWidth; st.classList.add("fade");
  st.innerHTML=`<div class="wtag">${esc(sc.tag)}</div><h3 class="wtitle">${esc(sc.title)}</h3><div class="wbeats" id="wBeats"></div><div class="wpage">${WK.si+1} / ${WK.scenes.length}</div>`;
  walkPanel();
  // re-show beats already passed in this scene (after a pause or jump), then keep going
  for(let i=0;i<WK.bi;i++) addBeat(sc.beats[i],false);
  if(WK.playing) WK.timer=setTimeout(walkNext, 900/WK.speed);
}
function addBeat(b,animate){
  const box=$("wBeats"); if(!box) return;
  box.querySelectorAll(".latest").forEach(x=>x.classList.remove("latest"));
  const el=document.createElement("div"); el.className=`beat k-${b.k}${animate?" anim":""} latest`; el.innerHTML=b.h; box.appendChild(el);
  const st=$("wStage"); st.scrollTop=st.scrollHeight;
}
function walkNext(){
  if(!WK||!WK.playing||CUR_SCREEN!=="lesson"||L.phase!=="walk") return;
  const sc=WK.scenes[WK.si];
  if(WK.bi>=sc.beats.length){
    if(WK.si<WK.scenes.length-1){ WK.si++; WK.bi=0; WK.far=Math.max(WK.far,WK.si); walkControls(); walkScene(); return }
    // finished
    WK.playing=false; WK.far=WK.scenes.length;
    if(!WK.done){ WK.done=true; S.walk=S.walk||{}; S.walk[WK.k]=1; save("walkthrough",`Week ${L.w} day ${L.d} walkthrough watched`) }
    walkControls(); walkPanel(); return;
  }
  const b=sc.beats[WK.bi]; addBeat(b,true); WK.bi++; walkPanel();
  const wait=Math.min(9000, 1500 + plain(b.h).length*42) / WK.speed;
  if(WK.voice&&WVOICE){
    const u=new SpeechSynthesisUtterance(speakify(b.h)); u.voice=WVOICE; u.rate=Math.min(1.6,0.95*WK.speed);
    let moved=false; const go=()=>{ if(moved) return; moved=true; clearTimeout(WK.timer); WK.timer=setTimeout(walkNext, 450/WK.speed) };
    u.onend=go; u.onerror=go; speechSynthesis.cancel(); speechSynthesis.speak(u);
    WK.timer=setTimeout(go, wait*2.5); // safety net if the voice stalls
  } else WK.timer=setTimeout(walkNext, wait);
}
