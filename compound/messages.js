/* Messages: teacher replies to help requests; the student reads them the next time he signs in. */
let MSG={unread:0,list:[]};
const siteURL=()=>location.protocol==="https:"?location.origin+location.pathname:"";
const fmtWhen=t=>new Date(t).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
async function fetchMsgs(){
  if(!TOKEN||DEMO) return MSG;
  try{const r=await rpc("finance_get_messages",{p_token:TOKEN}); if(r.ok) MSG={unread:+r.unread||0,list:r.messages||[]}}catch(e){}
  updateMsgBadge(); return MSG;
}
function updateMsgBadge(){const b=$("msgBadge"); if(!b) return; b.textContent=MSG.unread; b.hidden=!MSG.unread}
setInterval(async()=>{ if(!TOKEN||DEMO) return; const before=MSG.unread; await fetchMsgs(); if(MSG.unread>before) toast("New message from your teacher. Open Messages to read it.") },300000);

function threadHTML(list, teacher){
  const replies=list.filter(m=>m.kind==="reply"), helps=list.filter(m=>m.kind==="help");
  if(!helps.length&&!replies.length) return `<p class="muted">${teacher?"No help requests yet.":"No messages yet. When you ask your teacher for help, the conversation will appear here."}</p>`;
  return helps.map(h=>{const rs=replies.filter(r=>r.reply_to===h.id).sort((a,b)=>a.created_at.localeCompare(b.created_at));
    return `<div class="thread">
      <div class="msg mine"><div class="mh">${teacher?esc(h.name||"Student"):"You"}, ${fmtWhen(h.created_at)}${h.where_text?`<span class="tag plain">${esc(h.where_text)}</span>`:""}</div><div class="mb">${esc(h.body||"").replace(/\n/g,"<br>")}</div>
      ${teacher&&h.teacher_body?`<details class="tonly"><summary>Answer and worked solution (only you see this)</summary><pre>${esc(h.teacher_body)}</pre></details>`:""}</div>
      ${rs.map(r=>`<div class="msg theirs ${!teacher&&!r.read_at?"new":""}"><div class="mh">${teacher?"You replied":"Your teacher"}, ${fmtWhen(r.created_at)}${!teacher&&!r.read_at?' <span class="tag gold">New</span>':""}${teacher?(r.read_at?' <span class="tag good">Read</span>':' <span class="tag plain">Not read yet</span>'):""}</div><div class="mb">${esc(r.body).replace(/\n/g,"<br>")}</div></div>`).join("")}
      ${teacher?`<div class="replybox" data-for="${h.id}"><button class="btn small" data-reply="${h.id}">${rs.length?"Reply again":"Reply"}</button></div>`:(!rs.length?`<p class="muted" style="font-size:13px;margin:4px 0 0 14px">Waiting for your teacher's reply.</p>`:"")}
    </div>`}).join("");
}
async function renderMessages(fromLogin){
  await fetchMsgs();
  const n=MSG.unread;
  $("messages").innerHTML=`<div class="card scroll">${fromLogin&&n?`<div class="newbanner"><b>You have ${n} new message${n>1?"s":""} from your teacher.</b> Read ${n>1?"them":"it"}, then continue to your lesson.<button class="btn small" id="msgGo">Continue to my lesson</button></div>`:""}<h3>Your conversations</h3>${threadHTML(MSG.list,false)}</div>
   <div class="card"><h3>Write to your teacher</h3><p class="muted" style="margin:0 0 8px;font-size:13.5px">Ask a question about the course. Your teacher usually answers in the evening, and the reply appears here the next time you sign in.</p>
    <textarea id="msgNew" rows="5" maxlength="600" placeholder="What would you like to ask?"></textarea><div style="margin-top:8px"><button class="btn small" id="msgSend">Send</button></div>
    <p class="muted" style="font-size:12.5px;margin-top:auto">Stuck on a practice problem? Use Hint and Set it up first. The email button appears on the question itself.</p></div>`;
  if($("msgGo")) $("msgGo").onclick=()=>{const nx=upNext(); nx.none?renderDash():openDay(nx.w,nx.d)};
  $("msgSend").onclick=async()=>{const t=$("msgNew").value.trim(); if(!t){toast("Write your question first.");return}
    $("msgSend").disabled=true; const r=await sendHelp("Messages page",`His message: ${t}`,t);
    if(r==="limit"){toast("You've used today's messages. Ask your teacher in person.");$("msgSend").disabled=false;return}
    toast("Sent. The reply will appear here."); renderMessages(false)};
  show("messages");
  if(n&&TOKEN&&!DEMO){try{await rpc("finance_mark_read",{p_token:TOKEN}); MSG.unread=0; updateMsgBadge()}catch(e){}}
}

/* ---------- Teacher: reply page (opened from the link in the email) and Teacher view panel ---------- */
async function loadTeacherMsgs(){try{const r=await rpc("finance_admin_messages",{p_pass:TPASS}); return r.ok?r.messages:null}catch(e){return null}}
function wireReplies(root,after){
  root.querySelectorAll("[data-reply]").forEach(b=>b.onclick=()=>{const id=+b.dataset.reply, box=root.querySelector(`.replybox[data-for="${id}"]`);
    box.innerHTML=`<textarea rows="4" maxlength="3000" placeholder="Write your reply. He'll see it the next time he signs in."></textarea><div style="display:flex;gap:8px;margin-top:6px"><button class="btn small">Send reply</button><button class="btn ghost small">Cancel</button></div>`;
    const [send,cancel]=box.querySelectorAll("button"); box.querySelector("textarea").focus();
    cancel.onclick=()=>after(); send.onclick=async()=>{const t=box.querySelector("textarea").value.trim(); if(!t){toast("Write a reply first.");return}
      send.disabled=true; const r=await rpc("finance_admin_reply",{p_pass:TPASS,p_id:id,p_body:t});
      if(r.ok){toast("Reply sent. He'll see it the next time he signs in."); after()} else {toast("Couldn't send. Check the password.");send.disabled=false}}});
}
async function renderReplyPage(id){
  show("reply");
  if(!TPASS){ $("reply").innerHTML=`<div class="card" style="max-width:460px;margin:auto"><h3>Reply to your student</h3><p class="muted" style="margin:0">Enter your portal teacher password to open this help request.</p>
      <label class="field"><span>Teacher password</span><input type="password" id="rpPass"></label><p class="err" id="rpErr"></p><button class="btn" id="rpGo">Open</button></div>`;
    const go=async()=>{TPASS=$("rpPass").value; const m=await loadTeacherMsgs(); if(!m){$("rpErr").textContent="That password isn't right.";TPASS="";return} renderReplyPage(id)};
    $("rpGo").onclick=go; $("rpPass").addEventListener("keydown",e=>{if(e.key==="Enter")go()}); $("rpPass").focus(); return; }
  const all=await loadTeacherMsgs(); if(!all){TPASS="";return renderReplyPage(id)}
  const h=all.find(m=>m.id===id&&m.kind==="help");
  const list=h?all.filter(m=>m.id===id||m.reply_to===id):[];
  $("reply").innerHTML=`<div class="card scroll" style="max-width:760px;width:100%;margin:0 auto"><div style="display:flex;align-items:center;gap:10px"><h3 style="margin:0">Help request</h3><span style="flex:1"></span><button class="btn ghost small" id="rpAll">Open the Teacher view</button></div>
    ${h?threadHTML(list,true):`<p class="muted">This help request wasn't found. It may be older than the last 80 messages.</p>`}<div id="rpDone"></div></div>`;
  $("rpAll").onclick=()=>{history.replaceState(null,"",location.pathname); loadTeacher()};
  wireReplies($("reply"),()=>renderReplyPage(id));
  const b=$("reply").querySelector(`[data-reply="${id}"]`); if(b&&!list.some(m=>m.kind==="reply")) b.click();
}
async function fillTeacherMsgs(){
  const box=$("tMsgs"); if(!box) return; const all=await loadTeacherMsgs(); if(!all){box.innerHTML='<p class="muted">Couldn\'t load messages.</p>';return}
  box.innerHTML=threadHTML(all,true); wireReplies(box,fillTeacherMsgs);
  const waiting=all.filter(m=>m.kind==="help"&&!all.some(r=>r.reply_to===m.id)).length;
  $("tTabMsgs").textContent=`Help requests${waiting?` (${waiting} waiting)`:""}`;
}
