/* Coach: knows every answer, but only nudges. Email to the teacher unlocks only when he's still stuck. */
const plain=h=>String(h).replace(/<sup>(.*?)<\/sup>/g,"^$1").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
// "Set it up": every step of the worked solution, with each computed result hidden.
function setupLines(q){
  const variants=[$m(r2(q.ans)),$m(q.ans),nf(q.ans,2),nf(q.ans,3),nf(q.ans,4),String(q.ans),nf(Math.round(q.ans),0)];
  const hide=s=>{const i=s.lastIndexOf("="); return i>=0? s.slice(0,i+1)+' <span class="qmark">?</span>' : null};
  return q.steps.map(hide).filter(Boolean).filter(s=>!variants.some(v=>v.length>1&&plain(s).includes(plain(v))));
}
// Feedback on a wrong number that points at the mistake without giving the answer.
function diagnose(q,v){
  if(q.choices||isNaN(v)) return "";
  const a=q.ans, near=(x,y)=>Math.abs(x-y)<=Math.max(.011,Math.abs(y)*.004);
  if(a!==0&&(near(v*100,a)||near(v/100,a))) return "It looks like a percent and a decimal got mixed up. Check where the decimal point belongs.";
  if(a!==0&&Math.abs(v-a)/Math.abs(a)<0.03) return "You're very close. Check your rounding: keep every decimal until the last step.";
  if(a!==0&&(near(v,-a))) return "Check the sign of your answer.";
  return v>a?"Your answer is too high.":"Your answer is too low.";
}
function qHelp(){L.qh=L.qh||{}; return L.qh[L.qi]=L.qh[L.qi]||{hint:false,setup:false,tries:[],emailed:false}}
function stuckReady(){const h=qHelp(); return !h.emailed && ((h.hint&&h.setup)||(L.answered&&L.res[L.qi]===0))}
function showStuckForm(){
  const box=document.createElement("div"); box.className="fb hint stuck"; box.id="stuckBox";
  box.innerHTML=`<b>Email your teacher</b><br>Tell your teacher what's confusing. Your question, your answers and the help you used are included automatically.
    <textarea id="stuckMsg" rows="3" maxlength="600" placeholder="For example: I don't understand why we divide by 12."></textarea>
    <div style="display:flex;gap:8px;margin-top:8px"><button class="btn small" id="stuckSend">Send to my teacher</button><button class="btn ghost small" id="stuckCancel">Cancel</button></div>`;
  const old=$("stuckBox"); if(old) old.remove();
  $("lLeft").appendChild(box); $("stuckMsg").focus();
  $("stuckCancel").onclick=()=>box.remove();
  $("stuckSend").onclick=async()=>{
    const q=L.qs[L.qi], h=qHelp(), where=`Week ${L.w}, day ${L.d}, practice question ${L.qi+1}`;
    const msg=[`Question: ${plain(q.q)}`,
      q.choices?`Choices: ${q.choices.join(" | ")}`:"",
      `His answers so far: ${h.tries.length?h.tries.join(", "):"none yet"}`,
      `Help he used: ${[h.hint?"hint":"",h.setup?"set it up":"",L.answered?"saw the worked solution":""].filter(Boolean).join(", ")||"none"}`,
      `His note: ${($("stuckMsg").value||"").trim()||"(none)"}`,
      ``,`---- For the teacher only ----`,
      `Correct answer: ${q.choices?q.choices[q.correct]:fmtAns(q)}`,
      `Worked solution:`, ...q.steps.map((s,i)=>`  ${i+1}. ${plain(s)}`)].filter(x=>x!=="").join("\n");
    $("stuckSend").disabled=true; $("stuckSend").textContent="Sending…";
    const note=($("stuckMsg").value||"").trim();
    const r=await sendHelp(where,msg,`Question: ${plain(q.q)}\nMy note: ${note||"(none)"}`);
    if(r==="limit"){toast("You've used today's help emails. Raise your hand or ask your teacher in person.");box.remove();return}
    h.emailed=true; box.innerHTML=`<b>Sent.</b> Your teacher ${r==="emailed"?"got an email with":"will see"} your question. The reply will appear in Messages the next time you sign in. Keep going while you wait.`;
    navForQuestion();
  };
}
async function sendHelp(where,msg,studentView){
  const d=today(); S.help[d]=(S.help[d]||0)+1;
  if(DEMO||!TOKEN) return "saved";
  try{const r=await rpc("finance_help_request",{p_token:TOKEN,p_where:where,p_message:msg,p_student_view:studentView||"",p_site:siteURL()}); save();
    if(r.error==="limit") return "limit"; return r.emailed?"emailed":"saved"}catch(e){return "saved"}
}
