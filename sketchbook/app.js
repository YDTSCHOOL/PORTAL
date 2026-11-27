/* Sketchbook app */
(function () {
'use strict';
const E = window.Engine, ST = window.Studio, UNITS = E.UNITS, TOTAL = UNITS.length * 5, LAST = UNITS.length - 1;
const CFG = Object.assign({ SUPABASE_URL: '', SUPABASE_ANON_KEY: '', REPORT_EMAIL: '', PROGRAM_NAME: 'Sketchbook' }, window.SKETCHBOOK_CONFIG || {});
const REMOTE = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
/* Works with both the old "anon" key (starts eyJ...) and the new "publishable" key (starts sb_publishable_...) */
const AUTH = () => Object.assign({ apikey: CFG.SUPABASE_ANON_KEY }, /^eyJ/.test(CFG.SUPABASE_ANON_KEY) ? { Authorization: 'Bearer ' + CFG.SUPABASE_ANON_KEY } : {});
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const nice = iso => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const niceDate = ds => new Date(ds + 'T12:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

/* ---------- storage: everything goes through Supabase functions (the tables themselves are locked) ---------- */
const mem = {};
const LS = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return mem[k] == null ? null : mem[k]; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }
};
const API = CFG.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/rpc/';
async function rpc(fn, args) {
  let r;
  try { r = await fetch(API + fn, { method: 'POST', headers: Object.assign(AUTH(), { 'Content-Type': 'application/json' }), body: JSON.stringify(args || {}) }); }
  catch (e) { throw new Error('Can’t reach the progress server. Check the internet connection and try again.'); }
  const t = await r.text(); let d = null;
  try { d = t ? JSON.parse(t) : null; } catch (e) { }
  if (!r.ok) {
    let m = (d && (d.message || d.hint)) || ('Server error ' + r.status);
    if (/could not find the function|schema cache/i.test(m)) m = 'Sketchbook isn’t set up in Supabase yet. Run sketchbook/setup.sql in the SQL Editor.';
    throw new Error(m);
  }
  return d;
}
/* A copy on this computer, in case the internet drops. The newer copy wins at the next sign-in. */
const localKey = id => 'sketchbook2:' + id;
function keepLocal() { if (S && SID) LS.set(localKey(SID), JSON.stringify({ data: S, updated_at: new Date().toISOString() })); }
/* Only used to recognise copies saved on this computer by the old version of Sketchbook. */
async function hashPin(u, p) {
  const s = 'sketchbook|' + u + '|' + p;
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''); }
  catch (e) { let h = 5381; for (const c of s) h = (h * 33 + c.charCodeAt(0)) >>> 0; return 'h' + h; }
}

/* ---------- state ---------- */
let TOKEN = null, SID = null, S = null, SES = null, view = 'map', mapSel = 0, A = null, saveTimer = null;
function blank(name) {
  return { name, created: new Date().toISOString(), unit: 0, asg: {}, facts: {}, drops: 0, unlocked: [], log: [], studio: { paper: 'plain', items: [], drawing: '' } };
}
function setSave(t) { const el = $('#saveState'); if (el) el.textContent = t; }
function save(now) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    if (!S) return;
    setSave('Saving…');
    keepLocal();
    try {
      const r = await rpc('sketch_save', { p_token: TOKEN, p_data: S });
      if (r && r.ok) setSave('Saved');
      else if (r && r.error === 'session') sessionEnded();
      else throw new Error('Not saved');
    }
    catch (e) { setSave('Not saved yet'); console.warn(e); saveTimer = setTimeout(() => save(true), 10000); }
  }, now ? 0 : 800);
}
function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); }
function overlay(html) { const o = $('#overlay'); o.innerHTML = html; o.classList.remove('hidden'); return o; }
function closeOverlay() { const o = $('#overlay'); o.classList.add('hidden'); o.innerHTML = ''; }
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('div'); c.className = 'confetti';
  const cols = ['#3A5BD9', '#D23C77', '#F2B533', '#2FA572', '#7A4FD1', '#F07A2E'];
  for (let i = 0; i < 70; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + 'vw'; p.style.background = cols[i % 6]; p.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px'); p.style.animationDuration = (1.8 + Math.random() * 1.6) + 's'; p.style.animationDelay = Math.random() * 0.5 + 's'; c.appendChild(p); }
  document.body.appendChild(c); setTimeout(() => c.remove(), 4200);
}

/* ---------- progress helpers ---------- */
const rec = (ui, ai) => S.asg[UNITS[ui].assign[ai].id];
const isDone = (ui, ai) => !!(rec(ui, ai) && rec(ui, ai).done);
function avail(ui, ai) { if (ui > S.unit) return false; if (ui < S.unit) return true; return ai === 0 || isDone(ui, ai - 1); }
const unitDone = ui => UNITS[ui].assign.every((_, ai) => isDone(ui, ai));
const totalDone = () => Object.values(S.asg).filter(r => r.done).length;
const factKey = (a, b) => Math.min(a, b) + 'x' + Math.max(a, b);
const fluent = k => S.facts[k] && S.facts[k].s >= 2;
const fluentCount = () => { let n = 0; for (let a = 1; a <= 10; a++) for (let b = a; b <= 10; b++) if (fluent(a + 'x' + b)) n++; return n; };
function starsFor(a, score) { const miss = a.n - score; return score < a.pass ? 0 : miss === 0 ? 3 : miss === 1 ? 2 : 1; }
const starStr = n => '★'.repeat(n) + `<s>${'★'.repeat(3 - n)}</s>`;
function nextUp() { for (let ui = 0; ui <= S.unit; ui++) for (let ai = 0; ai < 5; ai++) if (!isDone(ui, ai) && avail(ui, ai)) return [ui, ai]; return null; }

/* ---------- icons ---------- */
const ICON = {
  drop: '<svg viewBox="0 0 24 24"><path d="M12 2C16 8 19 11.5 19 15A7 7 0 0 1 5 15C5 11.5 8 8 12 2Z" fill="#3A5BD9"/><path d="M9 15a3 3 0 0 0 3 3" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
  brand: '<svg viewBox="0 0 32 32"><path d="M16 3C8 3 3 9 3 16c0 8 6 13 12 13 3 0 4-2 3-4s0-4 3-4h4c3 0 4-3 4-5C29 8 23 3 16 3Z" fill="#F2DCC0" stroke="#2B2D5B" stroke-width="2"/><circle cx="10" cy="13" r="2.6" fill="#D23C77"/><circle cx="15" cy="8.5" r="2.6" fill="#F2B533"/><circle cx="21.5" cy="9.5" r="2.6" fill="#2FA572"/><circle cx="24" cy="15" r="2.6" fill="#3A5BD9"/></svg>',
  facts: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7Z" fill="#fff"/></svg>',
  learn: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-4 12.7V18h8v-3.3A7 7 0 0 0 12 2Z" fill="#fff"/><rect x="9" y="19.5" width="6" height="2.5" rx="1" fill="#fff"/></svg>',
  life: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1.5 13h-11Z" fill="#fff"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="#fff" stroke-width="2" fill="none"/></svg>',
  review: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M20 3v6h-6" fill="#fff"/></svg>'
};
const KIND = { facts: ['Fact mastery', '#F07A2E'], learn: ['Concept', '#3A5BD9'], life: ['Real life', '#2FA572'], review: ['Review', '#7A4FD1'] };

/* ---------- sign in ---------- */
function showGate(msg) {
  TOKEN = SID = S = SES = A = null;
  $('#top').innerHTML = `<div class="brand">${ICON.brand}${esc(CFG.PROGRAM_NAME)}</div>`;
  $('#main').innerHTML = `<section class="panel gate" style="height:auto">
    <h1>${esc(CFG.PROGRAM_NAME)}</h1>
    <p class="lead">Math in color. Master skills, earn art supplies, and fill your studio.</p>
    <form id="gf" autocomplete="off">
      <label for="gn">Your first and last name</label><input id="gn" maxlength="40" required>
      <label for="gp">Your 4-digit code</label><input id="gp" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" required>
      <p class="tip" style="text-align:left;margin-top:.5vh">Use the name and code your teacher gave you.</p>
      <p class="err" id="gerr">${esc(msg || '')}</p>
      <button class="btn wide" id="gb">Open my sketchbook</button>
    </form>
    <p class="dbstat ${REMOTE ? 'on' : ''}">${REMOTE ? 'Progress database connected' : 'Progress database not set up yet (see config.js)'}</p>
    <button class="link" id="teacher">Teacher page</button>
  </section>`;
  $('#gn').focus();
  $('#teacher').onclick = adminGate;
  $('#gf').onsubmit = async e => {
    e.preventDefault();
    const name = $('#gn').value.trim().replace(/\s+/g, ' '), pin = $('#gp').value.trim();
    if (name.length < 2) return ($('#gerr').textContent = 'Type your name.');
    if (!/^\d{4}$/.test(pin)) return ($('#gerr').textContent = 'Your code is 4 numbers.');
    $('#gb').disabled = true; $('#gb').textContent = 'Loading your progress…'; $('#gerr').textContent = '';
    const fail = m => { $('#gb').disabled = false; $('#gb').textContent = 'Open my sketchbook'; $('#gerr').textContent = m; };
    if (!REMOTE) return fail('Sketchbook isn’t connected to the progress database yet. Ask your teacher.');
    try {
      const res = await rpc('sketch_login', { p_name: name, p_pin: pin });
      if (!res || !res.ok) {
        const er = res && res.error;
        $('#gp').value = '';
        return fail(er === 'locked' ? 'Too many wrong codes. Wait 5 minutes, or ask your teacher.' : 'Ask your teacher to sign you up.');
      }
      TOKEN = res.token; SID = res.id;
      let data = res.data || null, at = res.updated_at || '';
      const loc = LS.get(localKey(SID));
      if (loc) { const l = JSON.parse(loc); if (l.data && (!data || l.updated_at > at)) { data = l.data; at = l.updated_at; } }
      if (res.legacy) {
        const old = LS.get('sketchbook:' + res.legacy);
        if (old) { const l = JSON.parse(old); if (l.data && l.pin === await hashPin(res.legacy, pin) && (!data || l.updated_at > at)) data = l.data; }
      }
      const back = !!data;
      S = data || blank(res.name);
      startSession();
      toast(back ? `Welcome back, ${S.name.split(' ')[0]}! Your progress is loaded (${totalDone()} of ${TOTAL}).` : `Welcome, ${S.name.split(' ')[0]}! Your sketchbook is saved online.`);
    } catch (err) {
      console.warn(err);
      fail(err.message);
    }
  };
}
function sessionEnded() {
  keepLocal(); clearTimeout(saveTimer); saveTimer = null;
  closeOverlay();
  showGate('You were signed out. Sign in again to keep going. Your work is kept.');
}
function startSession() {
  S.log = (S.log || []).slice(-200);
  SES = { date: today(), start: new Date().toISOString(), end: new Date().toISOString(), q: 0, c: 0, done: [] };
  S.log.push(SES);
  const nu = nextUp(); mapSel = nu ? nu[0] : S.unit;
  save(true); go('map');
}
async function signOut() {
  if (!S) return showGate();
  overlay(`<div class="sheet" style="width:min(92vw,26em)"><h2>Saving…</h2><p>Saving your progress. One moment.</p></div>`);
  if (SES && SES.q > 0 && SES.reportedQ !== SES.q) { sendReport(S, SES.date); SES.reportedQ = SES.q; }
  if (SES) SES.end = new Date().toISOString();
  clearTimeout(saveTimer); saveTimer = null;
  let ok = true;
  keepLocal();
  try { const r = await rpc('sketch_save', { p_token: TOKEN, p_data: S }); ok = !!(r && r.ok); } catch (e) { ok = false; console.warn(e); }
  if (ok) rpc('sketch_signout', { p_token: TOKEN }).catch(() => { });
  overlay(ok
    ? `<div class="sheet" style="width:min(92vw,28em)"><h2>Saved!</h2><p>Your progress is saved online. Sign in on any computer to keep going.</p><p><b>${totalDone()} of ${TOTAL}</b> assignments mastered.</p><div class="btns"><button class="btn" id="bye">Done</button></div></div>`
    : `<div class="sheet" style="width:min(92vw,28em)"><h2>Not saved online</h2><p>The progress database didn’t answer. Your work is kept on this computer and will upload the next time you sign in here.</p><div class="btns"><button class="btn alt" id="retry">Try again</button><button class="btn" id="bye">Sign out anyway</button></div></div>`);
  const done = () => { closeOverlay(); showGate(); };
  $('#bye').onclick = done; if ($('#retry')) $('#retry').onclick = signOut;
  if (ok) setTimeout(() => { if ($('#bye')) done(); }, 2500);
}
window.addEventListener('pagehide', () => {
  if (!S || !SES) return;
  if (SES.q > 0 && SES.reportedQ !== SES.q) { SES.reportedQ = SES.q; sendReport(S, SES.date); }
  keepLocal();
  if (TOKEN && saveTimer) { clearTimeout(saveTimer); saveTimer = null; const body = JSON.stringify({ p_token: TOKEN, p_data: S }); if (body.length < 60000) fetch(API + 'sketch_save', { method: 'POST', keepalive: true, body, headers: Object.assign(AUTH(), { 'Content-Type': 'application/json' }) }).catch(() => { }); }
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') keepLocal(); });

/* ---------- top bar & routing ---------- */
function topBar() {
  $('#top').innerHTML = `<div class="brand">${ICON.brand}${esc(CFG.PROGRAM_NAME)}</div>
    <button class="tab ${view === 'map' ? 'on' : ''}" id="tMap">My path</button>
    <button class="tab ${view === 'studio' ? 'on' : ''}" id="tStudio">My studio</button>
    <div class="tprog" title="Assignments mastered"><div class="bigbar"><i id="tbar" style="width:${totalDone() / TOTAL * 100}%"></i></div><span id="tnum">${totalDone()} / ${TOTAL}</span></div>
    <span class="drops" title="Paint drops earned">${ICON.drop}${S.drops}</span>
    <span class="who">${esc(S.name)}</span>
    <span class="save" id="saveState">Saved</span>
    <button class="tab" id="tOut">Sign out</button>`;
  $('#tMap').onclick = () => go('map'); $('#tStudio').onclick = () => go('studio'); $('#tOut').onclick = signOut;
}
function go(v) { if (S) save(true); view = v; A = null; topBar(); if (v === 'map') renderMap(); else if (v === 'studio') renderStudio(); }

/* ---------- map ---------- */
const COLS = 5, NODES = (() => { const xs = [72, 216, 360, 504, 648], n = []; for (let i = 0; i < UNITS.length; i++) { const r = Math.floor(i / COLS), c = i % COLS; n.push([r % 2 ? xs[COLS - 1 - c] : xs[c], 56 + r * 118]); } return n; })();
const MAPH = 56 + Math.ceil(UNITS.length / COLS) * 118 - 40;
function pathD(a, b) { const [x1, y1] = NODES[a], [x2, y2] = NODES[b]; if (y1 === y2) return `M${x1} ${y1}L${x2} ${y2}`; const dir = x1 > 360 ? 1 : -1; return `M${x1} ${y1}C${x1 + dir * 80} ${y1} ${x2 + dir * 80} ${y2} ${x2} ${y2}`; }
function label(t, x, y, col) {
  const w = t.split(' '); let l1 = t, l2 = '';
  if (t.length > 14 && w.length > 1) { let best = 1, diff = 99; for (let i = 1; i < w.length; i++) { const d = Math.abs(w.slice(0, i).join(' ').length - w.slice(i).join(' ').length); if (d < diff) { diff = d; best = i; } } l1 = w.slice(0, best).join(' '); l2 = w.slice(best).join(' '); }
  return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="700" font-size="13" fill="${col}">${esc(l1)}${l2 ? `<tspan x="${x}" dy="15">${esc(l2)}</tspan>` : ''}</text>`;
}
function mapSvg() {
  let s = '';
  const N = UNITS.length;
  for (let i = 0; i < N - 1; i++) s += `<path d="${pathD(i, i + 1)}" stroke="#DCDFEE" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="2 15"/>`;
  for (let i = 0; i < N - 1; i++) if (unitDone(i)) s += `<path d="${pathD(i, i + 1)}" stroke="${UNITS[i].color}" stroke-width="11" fill="none" stroke-linecap="round" opacity=".85"/>`;
  UNITS.forEach((u, i) => {
    const [x, y] = NODES[i], open = i <= S.unit, done = unitDone(i), cur = i === S.unit && !done, sel = i === mapSel;
    const n = u.assign.filter((_, ai) => isDone(i, ai)).length;
    s += `<g class="node ${open ? '' : 'locked'}" data-u="${i}" tabindex="${open ? 0 : -1}" role="button" aria-label="Unit ${i + 1}: ${esc(u.t)}${open ? '' : ' (locked)'}">`;
    if (cur) s += `<circle class="pulse" cx="${x}" cy="${y}" r="33" fill="${u.color}" opacity=".25"/>`;
    s += `<circle class="ring2" cx="${x}" cy="${y}" r="28" fill="${open ? u.color : '#fff'}" stroke="${sel ? '#2B2D5B' : open ? u.color : '#DCDFEE'}" stroke-width="${sel ? 5 : 3}"/>`;
    if (open && !done) s += `<circle cx="${x}" cy="${y}" r="22" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4.5"/><circle cx="${x}" cy="${y}" r="22" fill="none" stroke="#fff" stroke-width="4.5" stroke-dasharray="${n / 5 * 138.2} 200" transform="rotate(-90 ${x} ${y})"/>`;
    s += done ? `<path d="M${x - 11} ${y}l7 8 15-16" stroke="#fff" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : `<text x="${x}" y="${y + 8}" text-anchor="middle" font-family="Patrick Hand,cursive" font-size="24" fill="${open ? '#fff' : '#9AA0B8'}">${i + 1}</text>`;
    s += label(u.t, x, y + 46, open ? '#2B2D5B' : '#9AA0B8') + '</g>';
  });
  return `<svg viewBox="0 0 720 ${MAPH}" aria-label="Learning path">${s}</svg>`;
}
function renderMap() {
  const done = totalDone();
  const pct = Math.round(done / TOTAL * 100);
  $('#main').innerHTML = `<div class="map">
    <section class="panel pathPanel">
      <div class="pathHead"><h2>My math path</h2><button class="mini" id="mini">${mosaicSvg(true)}<span>Fact picture<br><b>${fluentCount()} of 55</b></span></button></div>
      <div class="pathSvg">${mapSvg()}</div>
      <div class="pathFoot"><div class="bigbar tall" role="progressbar" aria-valuemin="0" aria-valuemax="${TOTAL}" aria-valuenow="${done}"><i style="width:${pct}%"></i></div><span class="pnum"><b>${done}</b> of ${TOTAL} assignments · ${pct}%</span></div>
    </section>
    <section class="panel overview" id="ov"></section>
  </div>`;
  document.querySelectorAll('.node').forEach(n => {
    const pickIt = () => { const u = +n.dataset.u; if (u > S.unit) return toast('Finish Unit ' + (u) + ' to open this one.'); mapSel = u; renderMap(); };
    n.onclick = pickIt; n.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickIt(); } };
  });
  $('#mini').onclick = showMosaic;
  renderOverview();
}
function renderOverview() {
  const ui = mapSel, u = UNITS[ui], nu = nextUp();
  let rows = '';
  u.assign.forEach((a, ai) => {
    const r = rec(ui, ai), ok = avail(ui, ai), dn = isDone(ui, ai), now = nu && nu[0] === ui && nu[1] === ai;
    const k = KIND[a.kind];
    const right = dn ? `<span class="stars">${starStr(r.stars)}</span><button class="go again" data-a="${ai}">Practice</button>`
      : ok ? `${r && r.tries ? `<span class="tip">Best ${r.best}/${a.n}</span>` : ''}<button class="go" data-a="${ai}">${r && r.tries ? 'Try again' : 'Start'}</button>`
        : `<span class="lockic">Locked</span>`;
    rows += `<div class="arow ${now ? 'now' : ''} ${ok ? '' : 'lock'}"><span class="ic" style="background:${k[1]}" title="${k[0]}">${ICON[a.kind]}</span>
      <div><b>${esc(a.name)}</b><small>${k[0]} · ${esc(a.desc)} · ${a.n} questions, master with ${a.pass}</small></div><div class="st">${right}</div></div>`;
  });
  $('#ov').innerHTML = `<div class="ovTop"><span class="ovNum" style="background:${u.color}">${ui + 1}</span><div style="flex:1"><h2>${esc(u.t)}</h2><p>${esc(u.sub)}</p></div><span class="ucount">${u.assign.filter((_, ai) => isDone(ui, ai)).length} of 5 done</span></div>
    <div class="goals">${u.goals.map(g => `<span>${esc(g)}</span>`).join('')}${u.ixl ? `<span class="ixl">IXL: ${u.ixl}</span>` : ''}</div>
    ${canTestOut(ui) ? `<div class="testout"><div><b>Already know this?</b><small>Get 5 of 5 on a quick test to skip this unit. One try per unit.</small></div><button class="go" id="tout">Test out</button></div>` : ''}
    <div class="alist">${rows}</div>`;
  document.querySelectorAll('#ov .go[data-a]').forEach(b => b.onclick = () => startAssign(ui, +b.dataset.a));
  if ($('#tout')) $('#tout').onclick = () => startTestOut(ui);
}

/* ---------- fact picture (mosaic) ---------- */
const PIC = ['yy...pp...', 'yy..pyyp..', '....pyyp..', '.....pp.vv', '..g...gvwv', '.ggg..g.vv', '..g..gg..g', '..g...g.gg', 'oooooooggg', 'bbbbbbbbbb'];
const PCOL = { '.': '#CFE7FF', y: '#F2B533', p: '#D23C77', g: '#2FA572', o: '#F07A2E', v: '#7A4FD1', w: '#FFFFFF', b: '#8A5A3B' };
function mosaicSvg(mini, hi) {
  const c = mini ? 10 : 34, o = mini ? 0 : 26; let s = '';
  if (!mini) for (let i = 1; i <= 10; i++) s += `<text x="${o + (i - .5) * c}" y="18" text-anchor="middle" font-size="14" font-weight="700" fill="#5A5F80">${i}</text><text x="12" y="${o + (i - .5) * c + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="#5A5F80">${i}</text>`;
  for (let i = 1; i <= 10; i++) for (let j = 1; j <= 10; j++) {
    const k = factKey(i, j), f = fluent(k), col = PCOL[PIC[i - 1][j - 1]], x = o + (j - 1) * c, y = o + (i - 1) * c, h = hi && hi === k;
    s += `<rect x="${x}" y="${y}" width="${c}" height="${c}" fill="${f ? col : '#fff'}" stroke="${h ? '#2B2D5B' : '#E1E4F0'}" stroke-width="${h ? 3 : 1}"/>`;
    if (!mini && f) s += `<text x="${x + c / 2}" y="${y + c / 2 + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="${col === '#FFFFFF' || col === '#CFE7FF' || col === '#F2B533' ? '#2B2D5B' : '#fff'}">${i * j}</text>`;
  }
  return `<svg viewBox="0 0 ${o + 10 * c} ${o + 10 * c}" role="img" aria-label="Multiplication picture: ${fluentCount()} of 55 facts painted">${s}</svg>`;
}
function showMosaic() {
  overlay(`<div class="sheet"><h2>My fact picture</h2><p>Every fact you answer fast and correctly two times paints its squares. Paint all 55 facts to finish the picture.</p>
    <div style="width:min(80vw,58vh);margin:1.4vh auto">${mosaicSvg(false)}</div><p><b>${fluentCount()}</b> of 55 facts painted</p><div class="btns"><button class="btn" id="cl">Close</button></div></div>`);
  $('#cl').onclick = closeOverlay; $('#cl').focus();
}

/* ---------- assignments ---------- */
function startAssign(ui, ai) {
  const a = UNITS[ui].assign[ai];
  A = { ui, ai, a, i: 0, res: [], d: isDone(ui, ai) ? 2 : 1, streak: 0, q: null, prev: '' };
  view = 'act'; topBar();
  if (a.kind === 'facts') renderLabShell(); else renderActShell();
  nextQ();
}
/* ----- adaptive picking ----- */
function wpick(items, weight) { const w = items.map(weight), t = w.reduce((x, y) => x + y, 0); let r = Math.random() * t; for (let i = 0; i < items.length; i++) { r -= w[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; }
/* a fact she hasn't mastered yet, favoring ones she missed or answered slowly */
function weakFact(fs) {
  const set = fs.set, cand = [];
  for (const x of set) for (let y = 1; y <= 10; y++) { const k = factKey(x, y); if (!fluent(k)) cand.push([x, y, k]); }
  if (!cand.length) return null;
  const c = wpick(cand, ([, , k]) => { const f = S.facts[k] || { s: 0, w: 0 }; return 1 + f.w * 6 + (2 - Math.min(2, f.s)) * 1.5; });
  return E.factQ(c[0], c[1], fs.div);
}
function factFor(fs, d) { return (Math.random() < 0.67 && weakFact(fs)) || E.G.facts(d, fs); }
/* how hard a skill has been for her: 0 (easy) to 1 (hard) */
function skillWeak(key) { const st = (S.skills || {})[key] || { c: 0, w: 0 }; return (st.w + 1) / (st.c + st.w + 2); }
function reviewQ(ui, d) {
  const r = Math.random();
  if (r < 0.25) { const fu = UNITS[E.R(0, ui)].facts; const q = factFor(fu, Math.max(2, d)); return q; }
  const keys = []; for (let u = 0; u <= ui; u++) UNITS[u].a.forEach(x => keys.push([x[1], u]));
  const here = keys.filter(k => k[1] === ui);
  /* this unit's skills get a head start; skills she missed more get picked more */
  const k = wpick(r < 0.55 ? here : keys, ([key, u]) => Math.pow(0.15 + skillWeak(key), 2) * (u === ui ? 2 : 1));
  const q = E.G[k[0]](k[1] === ui ? d : Math.min(3, d + 1)); q.key = k[0]; return q;
}
function buildQ() {
  if (A.plan) { const p = A.plan[A.i]; if (p.fact) return E.G.facts(p.d, p.fact); const q = E.G[p.key](p.d); q.key = p.key; return q; }
  if (A.a.kind === 'facts') return factFor(UNITS[A.ui].facts, A.d);
  if (A.a.kind === 'review') return reviewQ(A.ui, A.d);
  return E.makeQ(A.ui, A.a, A.d);
}
function nextQ() {
  if (A.i >= A.a.n) return finish();
  let q, tries = 0;
  do { q = buildQ(); } while ((q.prompt === A.prev) && ++tries < 8);
  A.prev = q.prompt; A.q = q; A.answered = false; A.t0 = Date.now();
  if (A.a.kind === 'facts') renderFact(); else renderQ();
}
function dotsHtml() { return Array.from({ length: A.a.n }, (_, i) => `<i class="${i < A.res.length ? (A.res[i] ? 'ok' : 'no') : i === A.i ? 'cur' : ''}"></i>`).join(''); }
function headHtml() {
  const u = UNITS[A.ui];
  return `<div class="actHead"><h2>${esc(A.a.name)}<small>Unit ${A.ui + 1} · ${esc(u.t)} · ${A.res.filter(Boolean).length} correct so far</small></h2>
    <div class="dots" id="dots">${dotsHtml()}</div>${A.a.kind === 'testout' ? '' : '<button class="help" id="how">Show me how</button>'}<button class="x" id="quit">Back to path</button></div>`;
}
function updHead() { const s = document.querySelector('.actHead h2 small'); if (s) s.textContent = `Unit ${A.ui + 1} · ${UNITS[A.ui].t} · ${A.res.filter(Boolean).length} correct so far`; }
function wireHead() { if ($('#how')) $('#how').onclick = showTutorial; $('#quit').onclick = () => { if (A.res.length && !confirm('Leave this assignment? Your answers so far won’t count toward mastering it.')) return; go('map'); }; }
function renderActShell() { $('#main').innerHTML = `<section class="panel act" id="act"></section>`; }
function renderQ() {
  const q = A.q;
  const ans = q.type === 'mc'
    ? `<div class="opts">${q.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${'ABCD'[i]}</span>${esc(o)}</button>`).join('')}</div>`
    : `<div class="numrow">${q.pre ? `<span class="unit">${esc(q.pre)}</span>` : ''}<input id="num" inputmode="decimal" autocomplete="off" aria-label="Your answer">${q.suf ? `<span class="unit">${esc(q.suf)}</span>` : ''}<button class="btn" id="chk">Check</button></div>`;
  $('#act').innerHTML = headHtml() + `<div class="qbody ${q.visual ? '' : 'solo'}">${q.visual ? `<div class="vis">${q.visual}</div>` : ''}
    <div class="qside"><p class="tip">Question ${A.i + 1} of ${A.a.n}</p><div class="prompt">${esc(q.prompt)}</div>${ans}<div class="fb" id="fb" aria-live="polite"></div></div></div>`;
  wireHead();
  if (q.type === 'mc') document.querySelectorAll('.opt').forEach(b => b.onclick = () => answerMC(+b.dataset.i));
  else { const inp = $('#num'); inp.focus(); inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); answerNum(); } }; $('#chk').onclick = answerNum; }
}
document.addEventListener('keydown', e => {
  if (!A || A.a.kind === 'facts' || !A.q || $('#overlay:not(.hidden)')) return;
  if (A.answered && e.key === 'Enter' && document.activeElement.id !== 'nx') { e.preventDefault(); const n = $('#nx'); if (n) n.click(); return; }
  if (!A.answered && A.q.type === 'mc') { const i = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase()); if (i >= 0 && i < A.q.options.length) answerMC(i); }
});
function parseNum(s) { s = String(s).replace(/[$,\s]/g, '').replace(/[a-z²³]+$/i, ''); if (!/^-?\d*\.?\d+$/.test(s)) return null; return parseFloat(s); }
function answerNum() {
  if (A.answered) return;
  const v = parseNum($('#num').value);
  if (v === null) { $('#num').focus(); return toast('Type a number.'); }
  const ok = Math.abs(v - A.q.answer) <= Math.max(A.q.tol, 1e-9);
  $('#num').disabled = true; $('#chk').disabled = true;
  scored(ok);
}
function answerMC(i) {
  if (A.answered) return;
  const ok = i === A.q.answer;
  document.querySelectorAll('.opt').forEach((b, j) => { b.disabled = true; if (j === A.q.answer) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
  scored(ok);
}
function recordFact(q, ok, ms) {
  if (!q.fact) return;
  const f = S.facts[q.fact] || (S.facts[q.fact] = { s: 0, c: 0, w: 0 });
  if (ok) { f.c++; f.s += ms < 5000 ? 1 : 0.5; } else { f.w++; f.s = Math.max(0, f.s - 1); }
}
function tally(ok) {
  A.answered = true; A.res.push(ok); A.i++;
  if (A.q && A.q.key && A.q.key !== 'facts') { S.skills = S.skills || {}; const st = S.skills[A.q.key] || (S.skills[A.q.key] = { c: 0, w: 0 }); if (ok) st.c++; else st.w++; }
  if (ok) { A.streak++; if (A.streak >= 2 && A.d < 3) { A.d++; A.streak = 0; } } else { A.streak = 0; if (A.d > 1) A.d--; }
  SES.q++; if (ok) SES.c++; SES.end = new Date().toISOString();
}
function scored(ok) {
  recordFact(A.q, ok, Date.now() - A.t0);
  tally(ok);
  $('#dots').innerHTML = dotsHtml(); updHead();
  const fb = $('#fb'), q = A.q;
  fb.className = 'fb show ' + (ok ? 'ok' : 'no');
  fb.innerHTML = ok
    ? `<h3>${['Yes!', 'Correct!', 'You got it!', 'Beautiful work!', 'Exactly right!'][Math.floor(Math.random() * 5)]}</h3><p class="tip">${esc(q.explain[q.explain.length - 1])}</p><div class="row"><span></span><button class="btn" id="nx">Next</button></div>`
    : `<h3>Not quite. The answer is ${esc(q.show)}.</h3><ol>${q.explain.map(x => `<li>${esc(x)}</li>`).join('')}</ol><div class="row"><span class="tip">Read the steps, then try the next one.</span><button class="btn" id="nx">Next</button></div>`;
  $('#nx').onclick = nextQ;
  setTimeout(() => { const n = $('#nx'); if (n) n.focus(); }, 30);
  save();
}

/* ---------- fact lab ---------- */
function renderLabShell() {
  const u = UNITS[A.ui];
  $('#main').innerHTML = `<section class="panel act" id="act">${headHtml()}<div class="lab">
    <div class="factCard"><p class="tip">${esc(u.factLabel)} · answer fast, but correct counts most</p><div class="fact" id="fact"></div>
      <div class="labans" id="labans" aria-live="polite"></div><div class="tip" id="labfb" style="min-height:2.6em;text-align:center"></div>
      <div class="pad" id="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}<button data-k="del" aria-label="Erase">⌫</button><button data-k="0">0</button><button data-k="ok" class="enter">Enter</button></div></div>
    <div class="mosaicBox"><div id="mos" style="width:min(100%,52vh)"></div><p>Facts you know fast paint your picture. <b id="fc">${fluentCount()}</b> of 55 painted.</p></div>
  </div></section>`;
  wireHead();
  document.querySelectorAll('#pad button').forEach(b => b.onclick = () => labKey(b.dataset.k));
}
function renderFact() {
  A.typed = ''; A.waiting = false;
  $('#fact').textContent = A.q.prompt.replace(' = ?', ' =');
  $('#labans').textContent = ''; $('#labfb').textContent = '';
  $('#dots').innerHTML = dotsHtml(); updHead();
  $('#mos').innerHTML = mosaicSvg(false, A.q.fact);
  $('#fc').textContent = fluentCount();
}
function labKey(k) {
  if (!A || A.a.kind !== 'facts') return;
  if (A.waiting) { if (k === 'ok') nextQ(); return; }
  if (A.answered) return;
  if (k === 'del') A.typed = A.typed.slice(0, -1);
  else if (k === 'ok') { if (A.typed) checkFact(); return; }
  else if (A.typed.length < 3) A.typed += k;
  $('#labans').textContent = A.typed;
}
document.addEventListener('keydown', e => {
  if (!A || A.a.kind !== 'facts' || $('#overlay:not(.hidden)')) return;
  if (/^\d$/.test(e.key)) labKey(e.key); else if (e.key === 'Backspace') labKey('del'); else if (e.key === 'Enter') { e.preventDefault(); labKey('ok'); }
});
function checkFact() {
  const ok = +A.typed === A.q.answer, ms = Date.now() - A.t0;
  recordFact(A.q, ok, ms); tally(ok);
  $('#dots').innerHTML = dotsHtml(); updHead();
  if (ok) {
    $('#fact').classList.remove('flash'); void $('#fact').offsetWidth; $('#fact').classList.add('flash');
    $('#labfb').innerHTML = ms < 5000 ? 'Fast and correct!' : 'Correct! Try to be a little quicker next time.';
    $('#mos').innerHTML = mosaicSvg(false, A.q.fact);
    setTimeout(() => { if (A && A.a.kind === 'facts') nextQ(); }, 650);
  } else {
    A.waiting = true;
    $('#labans').textContent = A.q.answer;
    $('#labfb').innerHTML = `<b style="color:var(--magenta)">${esc(A.q.prompt.replace('?', A.q.answer))}</b><br>${esc(A.q.explain[0])} Press Enter to go on.`;
  }
  save();
}

/* ---------- test out ---------- */
const canTestOut = ui => ui === S.unit && UNITS[ui].assign.every((_, ai) => !rec(ui, ai)) && !(S.testout || {})[ui];
function startTestOut(ui) {
  const u = UNITS[ui];
  const plan = [{ fact: u.facts, d: 2 }, { key: u.a[0][1], d: 3 }, { key: u.a[1][1], d: 3 }, { key: u.a[2][1], d: 3 }, { key: E.pick([u.a[0][1], u.a[1][1]]), d: 3 }];
  A = { ui, ai: -1, a: { kind: 'testout', name: `Test out: Unit ${ui + 1}`, n: 5, pass: 5 }, plan, i: 0, res: [], d: 3, streak: 0, q: null, prev: '' };
  view = 'act'; topBar(); renderActShell(); nextQ();
}
function finishTestOut() {
  const ui = A.ui, u = UNITS[ui], score = A.res.filter(Boolean).length, passed = score === 5;
  S.testout = S.testout || {}; S.testout[ui] = { date: today(), score };
  const got = [];
  if (passed) {
    u.assign.forEach((a, ai) => {
      S.asg[a.id] = { best: a.pass, stars: 2, tries: 0, done: true, first: today(), last: today(), testedOut: true };
      const rw = ST.rewardFor(ui * 5 + ai); if (rw && !S.unlocked.includes(rw)) { S.unlocked.push(rw); got.push(rw); }
    });
    S.drops += 100;
    SES.done.push(`Tested out of Unit ${ui + 1} ${u.t}`);
    if (S.unit < LAST) S.unit++;
    mapSel = Math.min(ui + 1, LAST);
  }
  save(true);
  const dr = document.querySelector('.drops'); if (dr) dr.innerHTML = ICON.drop + S.drops;
  if ($('#tbar')) { $('#tbar').style.width = totalDone() / TOTAL * 100 + '%'; $('#tnum').textContent = totalDone() + ' / ' + TOTAL; }
  if (passed) {
    const next = ui < LAST ? UNITS[ui + 1] : null;
    overlay(`<div class="sheet"><h2>You tested out!</h2><div class="stars">★★★</div><p>5 of 5 right. You already know <b>${esc(u.t)}</b>, so all 5 assignments are done. +100 paint drops.</p>
      <div class="reward" style="flex-wrap:wrap">${got.map(r => `<div style="width:4.5em" title="${esc(ST.rewardLabel(r))}">${ST.rewardPreview(r)}</div>`).join('')}<span class="tip" style="width:100%">${got.length} new things in your studio</span></div>
      <div class="btns"><button class="btn alt" id="toMap">Back to my path</button>${next ? `<button class="btn" id="nextTest">Test out of Unit ${ui + 2}</button>` : ''}</div></div>`);
    confetti();
    if ($('#nextTest')) $('#nextTest').onclick = () => { closeOverlay(); startTestOut(ui + 1); };
  } else {
    overlay(`<div class="sheet"><h2>Good try!</h2><p>You got <b>${score} of 5</b>. To test out you need all 5, so this unit has things to practice.</p><p>Start with the Fact Lab. The program will give you extra practice on what you missed.</p>
      <div class="btns"><button class="btn" id="toMap">Start the unit</button></div></div>`);
  }
  $('#toMap').onclick = () => { closeOverlay(); go('map'); };
}

/* ---------- finishing ---------- */
function finish() {
  if (A.a.kind === 'testout') return finishTestOut();
  const { ui, ai, a } = A, score = A.res.filter(Boolean).length, stars = starsFor(a, score);
  const r = S.asg[a.id] || (S.asg[a.id] = { best: 0, stars: 0, tries: 0, done: false });
  r.tries++; r.last = today(); if (score > r.best) r.best = score;
  let reward = null, unitFinished = false, gained = 0;
  if (stars) {
    if (!r.done) {
      r.done = true; r.first = today(); reward = ST.rewardFor(ui * 5 + ai);
      if (reward && !S.unlocked.includes(reward)) S.unlocked.push(reward);
      SES.done.push(`Unit ${ui + 1} ${a.name} (${score}/${a.n})`);
      if (ai === 4 && ui === S.unit) { unitFinished = true; if (S.unit < LAST) S.unit++; }
    }
    if (stars > r.stars) { gained = (stars - r.stars) * 10; S.drops += gained; r.stars = stars; }
  }
  save(true);
  const dr = document.querySelector('.drops'); if (dr) dr.innerHTML = ICON.drop + S.drops;
  if ($('#tbar')) { $('#tbar').style.width = totalDone() / TOTAL * 100 + '%'; $('#tnum').textContent = totalDone() + ' / ' + TOTAL; }
  if (stars) {
    const rw = reward ? `<div class="reward">${ST.rewardPreview(reward)}<div style="text-align:left"><b>New: ${esc(ST.rewardLabel(reward))}</b><span class="tip">It’s waiting in your studio.</span></div></div>` : '';
    overlay(`<div class="sheet"><h2>${unitFinished ? `Unit ${ui + 1} complete!` : 'Mastered!'}</h2><div class="stars">${starStr(stars)}</div>
      <p>You got <b>${score} of ${a.n}</b> right on ${esc(a.name)}.${gained ? ` +${gained} paint drops.` : ''}</p>
      ${unitFinished && ui < LAST ? `<p>Unit ${ui + 2}, <b>${esc(UNITS[ui + 1].t)}</b>, is now open.</p>` : ''}${unitFinished && ui === LAST ? '<p><b>You finished the whole sketchbook!</b></p>' : ''}
      ${rw}<div class="btns">${reward ? '<button class="btn alt" id="toStudio">Go to my studio</button>' : ''}<button class="btn" id="toMap">Back to my path</button></div></div>`);
    if (unitFinished || stars === 3) confetti();
    if (unitFinished && ui < LAST) mapSel = ui + 1;
  } else {
    overlay(`<div class="sheet"><h2>Almost there</h2><p>You got <b>${score} of ${a.n}</b>. To master ${esc(a.name)} you need ${a.pass}.</p>
      <p>Every try has new problems. Use <b>Show me how</b> whenever you’re stuck.</p>
      <div class="btns"><button class="btn alt" id="toMap">Back to my path</button><button class="btn" id="again">Try again</button></div></div>`);
    $('#again').onclick = () => { closeOverlay(); startAssign(ui, ai); };
  }
  $('#toMap').onclick = () => { closeOverlay(); mapSel = unitFinished && ui < LAST ? ui + 1 : ui; go('map'); };
  if ($('#toStudio')) $('#toStudio').onclick = () => { closeOverlay(); go('studio'); };
  (document.querySelector('#overlay .btn:last-child') || {}).focus && document.querySelector('#overlay .btn:last-child').focus();
}

/* ---------- tutorial ---------- */
function showTutorial() {
  const key = A.q.key, t = E.TUT[key] || E.TUT.facts;
  let ex, n = 0;
  do { ex = key === 'facts' ? E.G.facts(2, UNITS[A.ui].facts) : E.G[key](Math.max(1, A.d)); } while (ex.prompt === A.q.prompt && ++n < 10);
  overlay(`<div class="sheet tut"><h2>Show me how</h2><p class="idea">${esc(t[0])}</p>
    <div class="tcols"><div><h3 style="font-size:1.3em">Steps</h3><ol>${t[1].map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>
    <div class="ex"><h3>A worked example</h3><p><b>${esc(ex.prompt)}</b></p>${ex.visual ? `<div class="vis">${ex.visual}</div>` : ''}
      <ol>${ex.explain.map(s => `<li>${esc(s)}</li>`).join('')}</ol><p class="ans">Answer: ${esc(ex.show)}</p></div></div>
    <p class="tip" style="margin-top:1.2vh">The example uses different numbers. Now try yours the same way.</p>
    <div class="btns"><button class="btn" id="cl">Back to my question</button></div></div>`);
  $('#cl').onclick = () => { closeOverlay(); const i = $('#num'); if (i && !i.disabled) i.focus(); };
  $('#cl').focus();
}

/* ---------- studio ---------- */
const stu = { mode: 'move', color: '#D23C77', brush: 'pencil', sel: null, ctx: null, drawing: false, last: null };
const has = r => S.unlocked.includes(r);
function unlockHint(r) { const i = ST.order.indexOf(r); if (i < 0) return ''; return `Unlocks with Unit ${Math.floor(i / 5) + 1}: ${UNITS[Math.floor(i / 5)].assign[i % 5].name}`; }
function renderStudio() {
  const st = S.studio;
  const colors = ST.COLORS0.map(c => [c, true]).concat(ST.COLORS.map(c => [c[0], has('color:' + c[0])]));
  const brushes = Object.keys(ST.BRUSHES).map(b => [b, b === 'pencil' || has('brush:' + b)]);
  const papers = Object.keys(ST.PAPERS).map(p => [p, p === 'plain' || has('paper:' + p)]);
  const stickers = ST.STARTERS.concat(ST.order.filter(r => r.startsWith('sticker:')).map(r => r.slice(8)));
  $('#main').innerHTML = `<div class="studio">
    <section class="panel tools">
      <h3>Tools</h3>
      <div class="seg"><button id="mMove" class="${stu.mode === 'move' ? 'on' : ''}">Move</button><button id="mDraw" class="${stu.mode === 'draw' ? 'on' : ''}">Draw</button></div>
      <div class="chips" id="brushes">${brushes.map(([b, ok]) => `<button class="chip ${stu.brush === b ? 'on' : ''} ${ok ? '' : 'lock'}" data-b="${b}" ${ok ? '' : `title="${esc(unlockHint('brush:' + b))}"`}>${ST.BRUSHES[b][0]}</button>`).join('')}<button class="chip ${stu.brush === 'eraser' ? 'on' : ''}" data-b="eraser">Eraser</button></div>
      <h3>Colors</h3>
      <div class="swatches">${colors.map(([c, ok]) => `<button class="sw ${stu.color === c ? 'on' : ''} ${ok ? '' : 'lock'}" style="background:${c}" data-c="${c}" aria-label="${ok ? 'Color' : 'Locked color'}" ${ok ? '' : `title="${esc(unlockHint('color:' + c))}"`}></button>`).join('')}</div>
      <div id="selbox"></div>
      <h3>Paper</h3>
      <div class="chips">${papers.map(([p, ok]) => `<button class="chip ${st.paper === p ? 'on' : ''} ${ok ? '' : 'lock'}" data-p="${p}" ${ok ? '' : `title="${esc(unlockHint('paper:' + p))}"`}>${ST.PAPERS[p][0]}</button>`).join('')}</div>
      <div class="chips" style="margin-top:auto"><button class="chip" id="clrDraw">Clear drawing</button><button class="chip" id="clrStk">Clear stickers</button></div>
    </section>
    <section class="canvasWrap"><div class="board ${stu.mode === 'draw' ? 'draw' : ''}" id="board"><canvas id="cv" width="960" height="720"></canvas></div></section>
    <section class="panel drawer"><h3>Stickers</h3><p class="note">Tap one to add it. Drag it to move it. Master assignments to unlock more.</p>
      <div class="sgrid">${stickers.map(id => { const ok = ST.STARTERS.includes(id) || has('sticker:' + id); return `<button data-s="${id}" ${ok ? '' : 'disabled'} title="${esc(ok ? ST.S[id][0] : unlockHint('sticker:' + id))}" aria-label="${esc(ST.S[id][0])}${ok ? '' : ' (locked)'}">${ST.stickerSVG(id)}</button>`; }).join('')}</div>
    </section></div>`;
  paintPaper();
  const cv = $('#cv'); stu.ctx = cv.getContext('2d');
  if (st.drawing) { const im = new Image(); im.onload = () => stu.ctx.drawImage(im, 0, 0, cv.width, cv.height); im.src = st.drawing; }
  drawStickers(); selBox();
  $('#mMove').onclick = () => { stu.mode = 'move'; renderStudio(); };
  $('#mDraw').onclick = () => { stu.mode = 'draw'; stu.sel = null; renderStudio(); };
  document.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { if (b.classList.contains('lock')) return toast(b.title); stu.brush = b.dataset.b; stu.mode = 'draw'; stu.sel = null; renderStudio(); });
  document.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { if (b.classList.contains('lock')) return toast(b.title); stu.color = b.dataset.c; if (stu.sel != null && stu.mode === 'move') { st.items[stu.sel].c = stu.color; drawStickers(); save(); } if (stu.brush === 'eraser') stu.brush = 'pencil'; document.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === b)); });
  document.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { if (b.classList.contains('lock')) return toast(b.title); st.paper = b.dataset.p; save(); renderStudio(); });
  document.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { st.items.push({ id: b.dataset.s, x: 40 + Math.random() * 20, y: 40 + Math.random() * 20, s: 16, r: 0, f: 1, c: null }); stu.mode = 'move'; stu.sel = st.items.length - 1; save(); renderStudio(); });
  $('#clrDraw').onclick = () => { if (!confirm('Erase your whole drawing?')) return; stu.ctx.clearRect(0, 0, cv.width, cv.height); st.drawing = ''; save(); };
  $('#clrStk').onclick = () => { if (!st.items.length || !confirm('Take all stickers off the page?')) return; st.items = []; stu.sel = null; save(); renderStudio(); };
  wireBoard();
}
function paintPaper() { const p = ST.PAPERS[S.studio.paper] || ST.PAPERS.plain, b = $('#board'); b.style.background = p[2] || 'none'; b.style.backgroundColor = p[1]; }
function drawStickers() {
  const b = $('#board'); b.querySelectorAll('.stk').forEach(x => x.remove());
  S.studio.items.forEach((it, i) => {
    const d = document.createElement('div'); d.className = 'stk' + (i === stu.sel ? ' sel' : ''); d.dataset.i = i;
    d.style.cssText = `left:${it.x}%;top:${it.y}%;width:${it.s}%;aspect-ratio:1;transform:translate(-50%,-50%) rotate(${it.r}deg) scaleX(${it.f});z-index:${i + 2}`;
    d.innerHTML = ST.stickerSVG(it.id, it.c); b.appendChild(d);
  });
}
function selBox() {
  const box = $('#selbox'); if (!box) return;
  if (stu.sel == null || stu.mode !== 'move') { box.innerHTML = ''; return; }
  box.innerHTML = `<h3>This sticker</h3><div class="selbox"><button data-o="small" title="Smaller">−</button><button data-o="big" title="Bigger">+</button><button data-o="rl" title="Turn left">⟲</button><button data-o="rr" title="Turn right">⟳</button>
    <button data-o="flip" title="Flip">Flip</button><button data-o="front" title="Bring to front">Front</button><button data-o="back" title="Send to back">Back</button><button data-o="del" class="del" title="Remove">✕</button><p>Pick a color above to paint it.</p></div>`;
  box.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
    const its = S.studio.items, it = its[stu.sel]; if (!it) return;
    const o = b.dataset.o;
    if (o === 'small') it.s = Math.max(5, it.s - 3); if (o === 'big') it.s = Math.min(70, it.s + 3);
    if (o === 'rl') it.r -= 15; if (o === 'rr') it.r += 15; if (o === 'flip') it.f *= -1;
    if (o === 'front') { its.splice(stu.sel, 1); its.push(it); stu.sel = its.length - 1; }
    if (o === 'back') { its.splice(stu.sel, 1); its.unshift(it); stu.sel = 0; }
    if (o === 'del') { its.splice(stu.sel, 1); stu.sel = null; selBox(); }
    drawStickers(); save();
  });
}
function wireBoard() {
  const b = $('#board'), cv = $('#cv');
  let drag = null;
  b.onpointerdown = e => {
    const rect = b.getBoundingClientRect();
    if (stu.mode === 'move') {
      const t = e.target.closest('.stk');
      if (!t) { stu.sel = null; drawStickers(); selBox(); return; }
      stu.sel = +t.dataset.i; drawStickers(); selBox();
      const it = S.studio.items[stu.sel];
      drag = { dx: (e.clientX - rect.left) / rect.width * 100 - it.x, dy: (e.clientY - rect.top) / rect.height * 100 - it.y };
      b.setPointerCapture(e.pointerId);
    } else {
      stu.drawing = true; b.setPointerCapture(e.pointerId);
      stu.last = pt(e); stroke(stu.last, stu.last);
    }
  };
  b.onpointermove = e => {
    const rect = b.getBoundingClientRect();
    if (drag && stu.sel != null) {
      const it = S.studio.items[stu.sel];
      it.x = Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100 - drag.dx));
      it.y = Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100 - drag.dy));
      const el = b.querySelector(`.stk[data-i="${stu.sel}"]`); if (el) { el.style.left = it.x + '%'; el.style.top = it.y + '%'; }
    } else if (stu.drawing) { const p = pt(e); stroke(stu.last, p); stu.last = p; }
  };
  b.onpointerup = b.onpointercancel = () => {
    if (drag) { drag = null; save(); }
    if (stu.drawing) { stu.drawing = false; S.studio.drawing = cv.toDataURL('image/png'); save(); }
  };
  function pt(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * cv.width, (e.clientY - r.top) / r.height * cv.height]; }
}
function stroke(a, b) {
  const c = stu.ctx, br = stu.brush;
  c.save(); c.lineCap = c.lineJoin = 'round';
  if (br === 'eraser') { c.globalCompositeOperation = 'destination-out'; c.lineWidth = 34; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.restore(); return; }
  const [, w, alpha] = ST.BRUSHES[br];
  c.strokeStyle = c.fillStyle = stu.color; c.globalAlpha = alpha;
  if (br === 'crayon') { for (let k = 0; k < 4; k++) { const o1 = (Math.random() - .5) * w, o2 = (Math.random() - .5) * w; c.lineWidth = 2.2; c.beginPath(); c.moveTo(a[0] + o1, a[1] + o2); c.lineTo(b[0] + o1, b[1] + o2); c.stroke(); } c.restore(); return; }
  if (br === 'glitter') { const gc = [stu.color, '#F2B533', '#FFFFFF', stu.color]; for (let i = 0; i < 10; i++) { const ang = Math.random() * Math.PI * 2, rr = Math.random() * w; c.fillStyle = gc[i % 4]; c.beginPath(); c.arc(b[0] + Math.cos(ang) * rr, b[1] + Math.sin(ang) * rr, 1.5 + Math.random() * 2, 0, 7); c.fill(); } c.restore(); return; }
  if (br === 'spray') { const n = 16; for (let i = 0; i < n; i++) { const ang = Math.random() * Math.PI * 2, rr = Math.random() * w; c.fillRect(b[0] + Math.cos(ang) * rr, b[1] + Math.sin(ang) * rr, 2, 2); } }
  else { c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0] + 0.01, b[1]); c.stroke(); }
  c.restore();
}
document.addEventListener('keydown', e => {
  if (view !== 'studio' || stu.sel == null || stu.mode !== 'move' || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { S.studio.items.splice(stu.sel, 1); stu.sel = null; drawStickers(); selBox(); save(); }
});

/* ---------- reports ---------- */
function buildReport(d, date) {
  const ses = (d.log || []).filter(x => x.date === date && x.q > 0);
  const q = ses.reduce((a, x) => a + x.q, 0), c = ses.reduce((a, x) => a + x.c, 0);
  const mins = ses.reduce((a, x) => a + Math.max(1, Math.round((new Date(x.end) - new Date(x.start)) / 60000)), 0);
  const done = [].concat(...ses.map(x => x.done));
  const where = (() => { for (let ui = 0; ui <= d.unit; ui++) for (let ai = 0; ai < 5; ai++) { const r = d.asg[UNITS[ui].assign[ai].id]; if (!r || !r.done) return `Unit ${ui + 1} (${UNITS[ui].t}): ${UNITS[ui].assign[ai].name}`; } return 'Finished every unit'; })();
  const stuck = []; UNITS.forEach((u, ui) => u.assign.forEach(a => { const r = d.asg[a.id]; if (r && !r.done && r.tries >= 2) stuck.push(`Unit ${ui + 1} ${a.name}: ${r.tries} tries, best ${r.best}/${a.n}`); }));
  let fl = 0; for (let a = 1; a <= 10; a++) for (let b = a; b <= 10; b++) { const f = d.facts[a + 'x' + b]; if (f && f.s >= 2) fl++; }
  const mastered = Object.values(d.asg).filter(r => r.done).length;
  return [
    `${CFG.PROGRAM_NAME} report for ${d.name}, ${niceDate(date)}`, '',
    ses.length ? `Time: ${ses.map(x => nice(x.start) + '–' + nice(x.end)).join(', ')} (about ${mins} min)` : 'No work today.',
    `Questions answered: ${q}${q ? ` (${c} correct, ${Math.round(c / q * 100)}%)` : ''}`,
    `Mastered today: ${done.length ? done.join('; ') : 'none yet'}`,
    `Now working on: ${where}`,
    `Overall: ${mastered} of ${TOTAL} assignments mastered, ${fl} of 55 multiplication facts fluent`,
    stuck.length ? `Needs help with: ${stuck.join('; ')}` : 'Needs help with: nothing flagged'
  ].join('\n');
}
function sendReport(d, date) {
  if (!CFG.REPORT_EMAIL) return Promise.resolve(false);
  const fd = new FormData();
  fd.append('_subject', `${CFG.PROGRAM_NAME}: ${d.name}, ${niceDate(date)}`);
  fd.append('_template', 'box'); fd.append('_captcha', 'false');
  fd.append('Report', buildReport(d, date));
  return fetch('https://formsubmit.co/ajax/' + encodeURIComponent(CFG.REPORT_EMAIL), { method: 'POST', body: fd, headers: { Accept: 'application/json' }, keepalive: true }).then(r => r.ok).catch(() => false);
}

/* ---------- teacher page ---------- */
/* The password is checked inside Supabase (it is the portal's teacher password). It is kept only while this page is open. */
let ADMIN = null, AD = null;
const sheetInput = 'width:100%;font-size:1.1em;padding:.6em;border:2px solid var(--line);border-radius:10px;margin:.4vh 0 1.2vh';
function adminGate() {
  overlay(`<div class="sheet" style="width:min(92vw,26em)"><h2>Teacher page</h2><p>Enter the teacher password. It is the same password as the portal’s Teacher page.</p>
    <form id="af"><input id="ap" type="password" style="${sheetInput}" aria-label="Teacher password"><p class="err" id="aerr" style="color:var(--magenta);min-height:1.4em"></p>
    <div class="btns"><button type="button" class="btn alt" id="ac">Cancel</button><button class="btn" id="ao">Open</button></div></form></div>`);
  $('#ap').focus(); $('#ac').onclick = closeOverlay;
  $('#af').onsubmit = async e => {
    e.preventDefault();
    const p = $('#ap').value; $('#aerr').textContent = ''; $('#ao').disabled = true;
    try {
      if (!(await rpc('sketch_admin_check', { p_pass: p }))) { $('#ao').disabled = false; return ($('#aerr').textContent = 'That password is not right.'); }
      ADMIN = p; closeOverlay(); adminList();
    } catch (err) { $('#ao').disabled = false; $('#aerr').textContent = err.message; }
  };
}
const hasSketch = st => AD && AD.sketch_id && (st.programs || []).indexOf(AD.sketch_id) >= 0;
async function adminList() {
  $('#top').innerHTML = `<div class="brand">${ICON.brand}${esc(CFG.PROGRAM_NAME)} · Teacher</div><button class="tab" id="aOut">Back to sign in</button>`;
  $('#aOut').onclick = () => { ADMIN = null; showGate(); };
  $('#main').innerHTML = `<section class="panel admin"><div class="adminTop"><h2>Students</h2><button class="btn" id="addS">Add a student</button><button class="btn alt" id="plan">Print the unit plan</button></div><div id="alist" class="tbl"><p style="padding:1em">Loading…</p></div>
    <p class="tip">Only students you add can sign in. This is the same list as the portal’s: a student uses one name and code for both.</p>
    ${CFG.REPORT_EMAIL ? `<p class="tip">Reports go to ${esc(CFG.REPORT_EMAIL)} each time a student signs out or closes the page.</p>` : '<p class="warn">No report email is set in config.js.</p>'}</section>`;
  $('#plan').onclick = printPlan;
  $('#addS').onclick = addStudent;
  try { AD = await rpc('sketch_admin_list', { p_pass: ADMIN }); } catch (e) { $('#alist').innerHTML = `<p style="padding:1em">Couldn’t load students: ${esc(e.message)}</p>`; return; }
  const rows = AD.students.filter(hasSketch), others = AD.students.length - rows.length;
  const note = others ? `<p style="padding:.6em 1em;margin:0">${others} other portal student${others > 1 ? 's' : ''} can’t open Sketchbook. To let them in, tick Sketchbook for them on the portal’s Teacher page.</p>` : '';
  if (!rows.length) { $('#alist').innerHTML = '<p style="padding:1em">No students can open Sketchbook yet. Press “Add a student”.</p>' + note; return; }
  const wk = Date.now() - 7 * 864e5;
  $('#alist').innerHTML = `<table><thead><tr><th>Student</th><th>Current unit</th><th>Mastered</th><th>Fluent facts</th><th>Last active</th><th>Minutes this week</th><th></th></tr></thead><tbody>${rows.map((r, i) => {
    const lock = r.locked ? ' <small style="color:var(--magenta)">(locked)</small>' : '';
    const acts = `<td style="white-space:nowrap"><button class="btn alt" style="font-size:.8em;padding:.4em .8em" data-code="${i}">Set a new code</button> <button class="btn alt" style="font-size:.8em;padding:.4em .8em" data-rm="${i}">Remove student</button></td>`;
    if (!r.data) return `<tr class="click" data-i="${i}"><td><b>${esc(r.name)}</b>${lock}</td><td colspan="5" style="color:var(--muted,#777)">Not started yet</td>${acts}</tr>`;
    const d = r.data, m = Object.values(d.asg || {}).filter(x => x.done).length;
    let fl = 0; for (let a = 1; a <= 10; a++) for (let b = a; b <= 10; b++) { const f = (d.facts || {})[a + 'x' + b]; if (f && f.s >= 2) fl++; }
    const mins = (d.log || []).filter(x => new Date(x.start) > wk && x.q > 0).reduce((a, x) => a + Math.max(1, Math.round((new Date(x.end) - new Date(x.start)) / 60000)), 0);
    return `<tr class="click" data-i="${i}"><td><b>${esc(r.name)}</b>${lock}</td><td>${d.unit + 1}. ${esc(UNITS[d.unit].t)}</td><td>${m} / ${TOTAL}</td><td>${fl} / 55</td><td>${new Date(r.updated_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td><td>${mins}</td>${acts}</tr>`;
  }).join('')}</tbody></table>` + note;
  document.querySelectorAll('tr.click').forEach(tr => tr.onclick = e => {
    const r = rows[+tr.dataset.i], b = e.target.closest('button');
    if (!b) return adminDetail(r);
    if (b.dataset.code != null) return setCode(r);
    if (b.dataset.rm != null) return removeStudent(r);
  });
}
function addStudent() {
  const progs = (AD && AD.programs) || [];
  overlay(`<div class="sheet" style="width:min(92vw,30em)"><h2>Add a student</h2>
    <form id="nf" autocomplete="off">
      <label for="nfF">First name</label><input id="nfF" maxlength="30" style="${sheetInput}" required>
      <label for="nfL">Last name</label><input id="nfL" maxlength="30" style="${sheetInput}" required>
      <label for="nfP">4-digit code</label><input id="nfP" inputmode="numeric" maxlength="4" style="${sheetInput};letter-spacing:.4em" required>
      <p style="margin:.6vh 0 .4vh"><b>Programs they can use</b></p>
      <div style="display:flex;flex-wrap:wrap;gap:.5em 1.2em;margin-bottom:1vh">${progs.map(p => `<label style="display:flex;gap:.4em;align-items:center;font-weight:500"><input type="checkbox" value="${esc(p.id)}" ${p.id === AD.sketch_id ? 'checked' : ''} style="width:1.2em;height:1.2em"> ${esc((p.icon || '') + ' ' + p.name)}</label>`).join('')}</div>
      <p class="err" id="nerr" style="color:var(--magenta);min-height:1.4em"></p>
      <div class="btns"><button type="button" class="btn alt" id="nc">Cancel</button><button class="btn" id="ns">Add student</button></div>
    </form></div>`);
  $('#nfF').focus(); $('#nc').onclick = closeOverlay;
  $('#nfP').oninput = function () { this.value = this.value.replace(/\D/g, '').slice(0, 4); };
  $('#nf').onsubmit = async e => {
    e.preventDefault();
    const first = $('#nfF').value.trim(), last = $('#nfL').value.trim(), pin = $('#nfP').value.trim();
    if (!/^\d{4}$/.test(pin)) return ($('#nerr').textContent = 'The code must be exactly 4 digits.');
    const ids = Array.from(document.querySelectorAll('#nf input[type=checkbox]:checked')).map(c => c.value);
    $('#ns').disabled = true;
    try {
      const r = await rpc('portal_add_student', { p_pass: ADMIN, p_first: first, p_last: last, p_pin: pin, p_programs: ids });
      closeOverlay(); toast(`${r.name} added. Code: ${pin}`); adminList();
    } catch (err) { $('#ns').disabled = false; $('#nerr').textContent = err.message; }
  };
}
async function setCode(r) {
  const p = prompt(`New 4-digit code for ${r.name}:`); if (p == null) return;
  if (!/^\d{4}$/.test(p.trim())) return toast('The code must be 4 numbers.');
  try { await rpc('portal_set_code', { p_pass: ADMIN, p_id: r.id, p_pin: p.trim() }); toast(`New code saved for ${r.name}.`); }
  catch (e) { toast(e.message); }
}
async function removeStudent(r) {
  if (!confirm(`Remove ${r.name}? They will not be able to sign in to Sketchbook or the portal. Their saved Sketchbook work stays in the database.`)) return;
  try { await rpc('portal_remove_student', { p_pass: ADMIN, p_id: r.id }); toast(`${r.name} removed.`); adminList(); }
  catch (e) { toast(e.message); }
}
function adminDetail(row) {
  const d = row.data || blank(row.name);
  d.asg = d.asg || {}; d.facts = d.facts || {}; d.log = d.log || [];
  const grid = UNITS.map((u, ui) => `<tr><td>${ui + 1}. ${esc(u.t)}</td>${u.assign.map(a => { const r = d.asg[a.id]; return `<td title="${esc(a.name)}">${r ? (r.done ? (r.testedOut ? 'tested out' : `<span class="stars">${'★'.repeat(r.stars)}</span>`) : `${r.best}/${a.n} (${r.tries} tr${r.tries > 1 ? 'ies' : 'y'})`) : (ui <= d.unit ? '·' : '')}</td>`; }).join('')}</tr>`).join('');
  const ses = d.log.filter(x => x.q > 0).slice(-14).reverse();
  $('#main').innerHTML = `<section class="panel admin"><div class="adminTop"><h2>${esc(row.name)}</h2>
      <button class="btn alt" id="back">All students</button><button class="btn alt" id="unl">Open the next unit</button><button class="btn alt" id="pin">Set a new code</button><button class="btn alt" id="rm">Remove student</button><button class="btn" id="rep">Email today’s report</button></div>
    <div class="cols2"><div class="tbl"><table><thead><tr><th>Unit</th><th>Fact Lab</th><th>Learn 1</th><th>Learn 2</th><th>Real life</th><th>Review</th></tr></thead><tbody>${grid}</tbody></table></div>
    <div class="tbl"><table><thead><tr><th>Day</th><th>Time</th><th>Questions</th><th>Correct</th><th>Mastered</th></tr></thead><tbody>${ses.map(x => `<tr><td>${niceDate(x.date)}</td><td>${nice(x.start)}–${nice(x.end)}</td><td>${x.q}</td><td>${Math.round(x.c / x.q * 100)}%</td><td style="white-space:normal">${esc(x.done.join('; ') || '–')}</td></tr>`).join('') || '<tr><td colspan="5">No sessions yet.</td></tr>'}</tbody></table></div></div>
    <pre style="white-space:pre-wrap;font-family:var(--sans);font-size:.85em;background:var(--page);border-radius:10px;padding:1em">${esc(buildReport(d, today()))}</pre></section>`;
  $('#back').onclick = adminList;
  $('#unl').onclick = async () => {
    if (d.unit >= LAST) return toast('All units are already open.');
    if (!confirm(`Open Unit ${d.unit + 2} (${UNITS[d.unit + 1].t}) for ${row.name}? Use this to place them ahead.`)) return;
    d.unit++;
    try { await rpc('sketch_admin_save', { p_pass: ADMIN, p_id: row.id, p_data: d }); row.data = d; toast('Unit opened.'); adminDetail(row); }
    catch (e) { d.unit--; toast(e.message); }
  };
  $('#pin').onclick = () => setCode(row);
  $('#rm').onclick = () => removeStudent(row);
  $('#rep').onclick = async () => { if (!CFG.REPORT_EMAIL) return toast('Add REPORT_EMAIL in config.js first.'); const ok = await sendReport(d, today()); toast(ok ? 'Report sent to ' + CFG.REPORT_EMAIL : 'The report didn’t send. If this is the first one, check that inbox for the FormSubmit "Activate" email.'); };
}
function printPlan() {
  $('#print').innerHTML = `<h1>${esc(CFG.PROGRAM_NAME)}: Unit plan</h1><p>${UNITS.length} units, 5 assignments each (${TOTAL} assignments). Every unit has fact mastery, two concept lessons, a real-life application, and a mixed review. An assignment is mastered with 8 of 10 correct (Fact Lab: 18 of 20). Each mastered assignment unlocks a reward in the art studio.</p>` +
    UNITS.map((u, ui) => `<div class="u"><h2>Unit ${ui + 1}: ${esc(u.t)}</h2><p><i>${esc(u.sub)}</i>${u.ixl ? ` · IXL skills: ${u.ixl}` : ''}</p><p>Goals: ${u.goals.map(esc).join('; ')}.</p>
      <table><thead><tr><th>#</th><th>Assignment</th><th>Type</th><th>What she does</th><th>To master</th></tr></thead><tbody>${u.assign.map((a, ai) => `<tr><td>${ui + 1}.${ai + 1}</td><td>${esc(a.name)}</td><td>${KIND[a.kind][0]}</td><td>${esc(a.desc)}</td><td>${a.pass} of ${a.n}</td></tr>`).join('')}</tbody></table></div>`).join('');
  window.print();
}

showGate();
})();
