/* First-day orientation: what the course is and what is expected. Shown once, before week 1. */
function orientSteps(){
  const vid = USE_VIDEOS;
  return [
  {h:"Welcome to Compound", t:`<p>This year, your ELA period becomes a full course in <b>finance</b>: how money grows, how people earn and spend it, how markets work, and how businesses make a profit.</p><p>It's built for a student who is ready for serious material. The math is real, the history is real, and the work counts. By the end of the year, you'll understand money better than most adults do.</p><p>The name says it all: <b>compound</b> growth is the most powerful idea in finance, and small, steady effort every day adds up the same way.</p>`,
   b:()=>`<div class="board"><h4>Your course at a glance</h4><table><tr><td>Length</td><td>25 weeks</td></tr><tr><td>Classes</td><td>4 a week, 40 minutes each</td></tr><tr><td>Units</td><td>5</td></tr><tr><td>Lesson days</td><td>75, plus 25 weekly quizzes</td></tr><tr><td>Where</td><td>Here, on your Chromebook</td></tr></table></div>`},
  {h:"What you'll learn", t:`<p>The course has five units. Each one builds on the one before it.</p><p>By the end of the year, you should be able to:</p><ul><li>Calculate exactly how savings and debts grow</li><li>Read a pay stub and build a working budget</li><li>Compare loans and credit cards and spot a bad deal</li><li>Value stocks and bonds and explain risk</li><li>Read a company's financial statements</li><li>Build a financial plan for a whole lifetime</li></ul>`,
   b:()=>`<div class="board"><h4>The five units</h4><table><tr><th>Unit</th><th>Weeks</th></tr>${UNITS.map((u,i)=>`<tr><td>${i+1}. ${u[0]}</td><td>${u[1]}–${u[2]}</td></tr>`).join("")}</table></div>`},
  {h:"How each class works", t:`<p>Every class is one <b>lesson day</b>, and it takes about 35 to 40 minutes. Days 1, 2 and 3 of each week are lesson days. Day 4 is the <b>weekly quiz</b>.</p><p>The program moves you forward automatically. When you finish a day, the next one starts by itself.</p><p>After each lesson day you can try an optional <b>boss round</b>: 5 fast questions against a 2‑minute clock.</p>`,
   b:()=>work("A lesson day, step by step",[...(vid?["Video: a Khan Academy lesson taught by Sal Khan"]:[]),"Lesson: short steps with worked examples","Practice: 10 problems with hints and a calculator","Deep Dive: a reading on the real history behind the topic","Results: your score, your grade, and what's next"])},
  {h:"What we expect from you", t:`<p>This course replaces a class, so it carries the same responsibility as one. Here is what we expect every week:</p><ul><li><b>Finish one full lesson day every class.</b> That's 4 a week.</li><li><b>Earn ${MASTERY}% or more on practice.</b> Below that, the day doesn't count and you redo it.</li><li><b>Pass each weekly quiz with ${PASS_MARK}%.</b> That's what opens the next week.</li><li><b>Do your own work.</b> Read the lessons, use the hints, and show what you really know.</li><li><b>Ask for help when you're stuck</b> instead of guessing.</li></ul>`,
   b:()=>`<div class="board"><h4>Your targets</h4><table><tr><td>Lesson days per week</td><td>${WEEKLY_GOAL}</td></tr><tr><td>Practice to pass a day</td><td>${MASTERY}%</td></tr><tr><td>Quiz to pass a week</td><td>${PASS_MARK}%</td></tr><tr><td>Grade to aim for</td><td>A or B</td></tr></table><div class="cap">Your teacher can see your progress, your scores and your active minutes at any time.</div></div>`},
  {h:"How your grade works", t:`<p>You earn a real letter grade, and you can watch it change as you work. A live score appears during practice, and your course grade is always on your dashboard.</p><p>Your course grade is made of three parts: <b>quizzes</b> (50%), <b>practice</b> (35%) and <b>Deep Dives</b> (15%).</p><p>In practice, a right answer on the first try is worth 1 point and on the second try ½ point. Careful work beats fast guessing.</p>`,
   b:()=>`<div class="board"><h4>Grade scale</h4><table>${[["A","93% and up"],["A−","90%"],["B+","87%"],["B","83%"],["B−","80%"],["C","70% to 79%"],["D","60% to 69%"],["F","below 60%"]].map(g=>`<tr><td>${g[0]}</td><td>${g[1]}</td></tr>`).join("")}</table></div>`},
  {h:"Points, ranks and trophies", t:`<p>Everything you do earns <b>points</b>. Points move you up a career ladder, from Intern all the way to Mogul.</p><p>Extra points come from <b>combos</b> (three or more first‑try answers in a row), beating boss rounds, finishing two days in one class, and hitting your weekly goal.</p><p>There are also 13 trophies to collect. Some are hard to get.</p>`,
   b:()=>`<div class="board"><h4>The career ladder</h4><table>${RANKS.map(r=>`<tr><td>${r[1]}</td><td>${r[0].toLocaleString("en-US")} points</td></tr>`).join("")}</table></div>`},
  {h:"The rules of the program", t:`<p><b>Sign in every class</b> with your name and PIN. Your work saves automatically after every answer.</p><p><b>The course only moves forward.</b> Finished lessons lock, so give every lesson your full attention the first time.</p><p><b>Compound closes at ${fmtT12(LOCK.close)}</b> and reopens at ${fmtT12(LOCK.open)}. You'll get a warning 5 minutes before. If you stop working for ${IDLE_MINUTES} minutes, you'll be signed out.</p><p><b>Need help?</b> The Help button at the top of every screen explains what to do, and it can send your teacher a message saying exactly where you're stuck.</p>`,
   b:()=>work("Your daily routine",["Sign in with your name and PIN","Press Start on your dashboard","Work through the day from start to finish","If there's time left, keep going to the next day","Your work saves itself, and the program signs you out at the end"])}
  ];
}
const ORIENT_CHECK=[
  {q:"What score do you need on practice for a lesson day to count?",choices:[MASTERY+"%","50%","100%","Any score"],why:`Lesson days need ${MASTERY}% on practice. Below that, you redo the day with new numbers.`},
  {q:"How many lesson days are you expected to finish each week?",choices:[String(WEEKLY_GOAL),"1","2","As many as you feel like"],why:`The goal is one full lesson day each class: ${WEEKLY_GOAL} a week.`},
  {q:"What happens to a lesson after you finish it?",choices:["It locks, and the course moves forward","You can redo it for more points","It disappears from your grade","Your teacher deletes it"],why:"Finished lessons lock, so give every lesson your best effort the first time."}
];
let OR=null;
function needsOrientation(){return !S.oriented && Object.keys(S.done).length===0}
function openOrientation(review){
  OR={i:0,seen:0,review:!!review,steps:orientSteps(),back:CUR_SCREEN}; show("lesson"); renderOrient();
}
function renderOrient(){
  clearInterval(stepTimer);
  const n=OR.steps.length, total=n+(OR.review?0:1);
  $("lTitle").textContent="Course orientation"; $("lCombo").textContent=""; $("lScore").hidden=true; $("lTimer").hidden=true;
  $("lTrack").innerHTML=[...Array(total)].map((_,k)=>`<i class="${k<=OR.i?"f":""}"></i>`).join("");
  $("lBody").className="lbody"; $("lLeft").className="col lesson-text";
  if(OR.i<n){
    const st=OR.steps[OR.i], last=OR.i===n-1;
    $("lPhase").textContent=`Step ${OR.i+1} of ${total}`;
    $("lLeft").innerHTML=`<span class="eyebrow">Orientation</span><h2>${st.h}</h2>${st.t}`; $("lRight").innerHTML=st.b();
    const label=last?(OR.review?"Close":"Take the quick check"):"Next";
    $("lNav").innerHTML=`<button class="btn ghost" id="oBack" ${OR.i===0?"disabled":""}>Back</button><span class="spacer"></span><button class="btn" id="oNext">${label}</button>`;
    $("oBack").onclick=()=>{OR.i--;renderOrient()};
    $("oNext").onclick=()=>{OR.seen=Math.max(OR.seen,OR.i+1); if(last&&OR.review){PAGES[OR.back]?PAGES[OR.back]():renderDash();return} OR.i++; renderOrient()};
    if(!OR.review&&OR.i>=OR.seen&&!DEMO_FAST){let left=STEP_SECONDS; const b=$("oNext"); b.disabled=true; b.textContent=`${label} (${left})`;
      stepTimer=setInterval(()=>{left--; if(left<=0){clearInterval(stepTimer);b.disabled=false;b.textContent=label} else b.textContent=`${label} (${left})`},1000)}
  } else renderOrientCheck();
  $("lLeft").scrollTop=0;
}
function renderOrientCheck(){
  const rng=mulberry(7);
  const qs=ORIENT_CHECK.map(q=>{const o=shuffle(rng,q.choices.map((_,i)=>i));return {q:q.q,why:q.why,choices:o.map(i=>q.choices[i]),correct:o.indexOf(0)}});
  const pick={};
  $("lPhase").textContent=`Step ${OR.steps.length+1} of ${OR.steps.length+1}: quick check`;
  $("lBody").className="dive";
  $("lLeft").innerHTML=`<span class="eyebrow">Orientation</span><h2>Quick check</h2><p>Answer these three questions to show you understand how the course works. You need all three right to begin. If you miss one, read the explanation and try again.</p><p>When you're done, week 1 starts.</p>`;
  $("lRight").innerHTML=`<div class="board">${qs.map((q,qi)=>`<div class="dq"><p>${qi+1}. ${esc(q.q)}</p><div class="choices">${q.choices.map((c,i)=>`<button class="choice" data-q="${qi}" data-i="${i}">${esc(c)}</button>`).join("")}</div><div class="why" id="owhy${qi}"></div></div>`).join("")}</div>`;
  $("lRight").querySelectorAll(".choice").forEach(b=>b.onclick=()=>{const qi=+b.dataset.q; $("lRight").querySelectorAll(`.choice[data-q="${qi}"]`).forEach(x=>x.classList.remove("picked","right","wrong")); b.classList.add("picked"); pick[qi]=+b.dataset.i; $("owhy"+qi).textContent=""});
  $("lNav").innerHTML=`<button class="btn ghost" id="oBack">Back</button><span class="spacer"></span><button class="btn" id="oCheck">Check my answers</button>`;
  $("oBack").onclick=()=>{OR.i--;renderOrient()};
  $("oCheck").onclick=()=>{
    if(Object.keys(pick).length<qs.length){toast("Answer all three questions first.");return}
    let ok=0; qs.forEach((q,qi)=>{const b=$("lRight").querySelector(`.choice[data-q="${qi}"][data-i="${pick[qi]}"]`); if(pick[qi]===q.correct){ok++;b.classList.add("right");$("owhy"+qi).textContent="Correct."} else {b.classList.add("wrong");$("owhy"+qi).textContent=q.why}});
    if(ok<qs.length){toast("Not quite. Read the explanation and change your answer.");return}
    S.oriented=true; save("orientation","Finished the course orientation");
    $("lNav").innerHTML=`<span><b>All correct.</b> You're ready.</span><span class="spacer"></span><button class="btn" id="oGo">I'm ready: start week 1</button>`;
    $("oGo").onclick=()=>{const nx=upNext(); if(nx.none) renderDash(); else openDay(nx.w,nx.d)};
  };
}
