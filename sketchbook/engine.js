/* Sketchbook math engine: 12 units, 60 assignments, adaptive question generators. */
(function (g) {
'use strict';
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
const fmt = x => (Math.round(x * 1000) / 1000).toLocaleString('en-US', { maximumFractionDigits: 3 });
const money = x => '$' + (Math.round(x * 100) / 100).toFixed(2);
const NAMES = ['Chavi', 'Rivky', 'Leah', 'Malka', 'Tzippy', 'Shira', 'Bracha', 'Esti', 'Miri', 'Dina', 'Yehudis', 'Chana'];
const SUP = ['crayons', 'markers', 'paintbrushes', 'colored pencils', 'stickers', 'beads', 'paint tubes', 'erasers', 'pastels', 'glitter pens'];
const X = '\u00D7', D = '\u00F7', MINUS = '\u2212';
const P = ['#3A5BD9', '#D23C77', '#F2B533', '#2FA572', '#7A4FD1', '#F07A2E'];

/* ---------- answer builders ---------- */
function numQ(prompt, ans, explain, o) {
  o = o || {};
  return { type: 'num', prompt, answer: ans, tol: o.tol != null ? o.tol : 0.0001, pre: o.pre || '', suf: o.suf || '', explain, visual: o.visual || '', show: o.show || fmt(ans) };
}
function mcQ(prompt, correct, wrongs, explain, o) {
  o = o || {};
  const set = [String(correct)];
  for (const w of wrongs) { const s = String(w); if (!set.includes(s) && set.length < 4) set.push(s); }
  const opts = o.keep ? set : shuf(set);
  return { type: 'mc', prompt, options: opts, answer: opts.indexOf(String(correct)), explain, visual: o.visual || '', show: String(correct) };
}
function numMC(prompt, ans, f, explain, wr, o) {
  const c = f(ans), set = [];
  const cand = (wr || []).concat([ans + 1, ans - 1, ans + 2, ans * 2, ans + 10, ans - 10, ans + 5]);
  for (const w of cand) { if (typeof w !== 'number' || !isFinite(w) || w < 0) continue; const s = f(w); if (s !== c && !set.includes(s)) set.push(s); if (set.length >= 3) break; }
  return mcQ(prompt, c, set, explain, o);
}
/* mix: sometimes typed, sometimes multiple choice (harder levels type more) */
function ask(prompt, ans, explain, d, o) {
  o = o || {};
  if (o.forceNum || Math.random() < [0.35, 0.55, 0.75][d - 1]) return numQ(prompt, ans, explain, o);
  return numMC(prompt, ans, o.f || (x => (o.pre || '') + fmt(x) + (o.suf ? ' ' + o.suf : '')), explain, o.wr, o);
}

/* ---------- visuals (SVG strings) ---------- */
const svg = (w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${inner}</svg>`;
function vGroups(n, per, icon) {
  const cols = Math.min(n, n > 6 ? 4 : 3), rows = Math.ceil(n / cols), bw = 120, bh = 110;
  let s = '';
  for (let i = 0; i < n; i++) {
    const gx = (i % cols) * (bw + 14) + 8, gy = Math.floor(i / cols) * (bh + 14) + 8;
    s += `<rect x="${gx}" y="${gy}" width="${bw}" height="${bh}" rx="26" fill="#fff" stroke="${P[i % 6]}" stroke-width="3" stroke-dasharray="7 5"/>`;
    const pc = Math.ceil(Math.sqrt(per)), sz = Math.min(26, 90 / pc);
    for (let j = 0; j < per; j++) {
      const cx = gx + bw / 2 + ((j % pc) - (pc - 1) / 2) * (sz + 4), cy = gy + bh / 2 + (Math.floor(j / pc) - (Math.ceil(per / pc) - 1) / 2) * (sz + 4);
      s += icon === 'star' ? star(cx, cy, sz / 2, P[(i + 2) % 6]) : `<circle cx="${cx}" cy="${cy}" r="${sz / 2.3}" fill="${P[(i + 2) % 6]}"/>`;
    }
  }
  return svg(cols * (bw + 14) + 2, rows * (bh + 14) + 2, s);
}
function star(cx, cy, r, c) {
  let p = '';
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; p += (k ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1); }
  return `<path d="${p}Z" fill="${c}"/>`;
}
function vArray(r, c, col) {
  const s0 = Math.min(34, 300 / Math.max(r, c)); let s = '';
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) s += `<circle cx="${20 + j * s0 + s0 / 2}" cy="${20 + i * s0 + s0 / 2}" r="${s0 * 0.34}" fill="${col || P[i % 6]}"/>`;
  return svg(c * s0 + 40, r * s0 + 40, s);
}
function vGrid(r, c, label) {
  const s0 = Math.min(32, 320 / Math.max(r, c)); let s = '';
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) s += `<rect x="${30 + j * s0}" y="${30 + i * s0}" width="${s0}" height="${s0}" fill="${(i + j) % 2 ? '#CFE0FF' : '#FFE3A8'}" stroke="#2B2D5B" stroke-width="1"/>`;
  if (label) s += `<text x="${30 + c * s0 / 2}" y="22" text-anchor="middle" font-size="16" fill="#2B2D5B">${c} units</text><text x="20" y="${30 + r * s0 / 2}" text-anchor="middle" font-size="16" fill="#2B2D5B" transform="rotate(-90 20 ${30 + r * s0 / 2})">${r} units</text>`;
  return svg(c * s0 + 50, r * s0 + 50, s);
}
function vRect(l, w, unit) {
  const W = 260, H = Math.max(70, Math.min(180, 260 * w / l));
  return svg(340, H + 70, `<rect x="40" y="25" width="${W}" height="${H}" fill="#E8EEFF" stroke="#3A5BD9" stroke-width="4" rx="4"/><text x="${40 + W / 2}" y="18" text-anchor="middle" font-size="18" fill="#2B2D5B">${l} ${unit}</text><text x="${48 + W}" y="${25 + H / 2 + 6}" font-size="18" fill="#2B2D5B">${w} ${unit}</text>`);
}
function vPie(num, den, kind) {
  let s = '';
  if (kind === 'bar') {
    const w = 300 / den;
    for (let i = 0; i < den; i++) s += `<rect x="${20 + i * w}" y="30" width="${w}" height="70" fill="${i < num ? '#D23C77' : '#fff'}" stroke="#2B2D5B" stroke-width="2.5"/>`;
    return svg(340, 130, s);
  }
  const cx = 110, cy = 110, r = 90;
  for (let i = 0; i < den; i++) {
    const a0 = -Math.PI / 2 + i * 2 * Math.PI / den, a1 = a0 + 2 * Math.PI / den;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    s += `<path d="M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}Z" fill="${i < num ? '#3A5BD9' : '#fff'}" stroke="#2B2D5B" stroke-width="2.5"/>`;
  }
  return svg(220, 220, s);
}
function vLineType(t) {
  const dot = (x, l) => `<circle cx="${x}" cy="60" r="7" fill="#2B2D5B"/><text x="${x}" y="95" text-anchor="middle" font-size="20" fill="#2B2D5B">${l}</text>`;
  const arrow = (x, dir) => `<path d="M${x} 60 l${-14 * dir} -9 v18Z" fill="#D23C77"/>`;
  let s = '';
  if (t === 'point') s = dot(170, 'A');
  if (t === 'segment') s = `<line x1="80" y1="60" x2="260" y2="60" stroke="#D23C77" stroke-width="5"/>` + dot(80, 'A') + dot(260, 'B');
  if (t === 'ray') s = `<line x1="80" y1="60" x2="310" y2="60" stroke="#D23C77" stroke-width="5"/>` + arrow(325, 1) + dot(80, 'A') + dot(220, 'B');
  if (t === 'line') s = `<line x1="30" y1="60" x2="310" y2="60" stroke="#D23C77" stroke-width="5"/>` + arrow(325, 1) + arrow(15, -1) + dot(110, 'A') + dot(230, 'B');
  return svg(340, 110, s);
}
function vCoord(pts, size) {
  size = size || 8; const u = 26, o = 36; let s = '';
  for (let i = 0; i <= size; i++) {
    s += `<line x1="${o + i * u}" y1="${o - 10}" x2="${o + i * u}" y2="${o + size * u}" stroke="#D5DAEA"/><line x1="${o}" y1="${o + i * u}" x2="${o + size * u + 10}" y2="${o + i * u}" stroke="#D5DAEA"/>`;
    s += `<text x="${o + i * u}" y="${o + size * u + 20}" text-anchor="middle" font-size="13" fill="#5A5F80">${i}</text>`;
    if (i) s += `<text x="${o - 12}" y="${o + (size - i) * u + 5}" text-anchor="middle" font-size="13" fill="#5A5F80">${i}</text>`;
  }
  s += `<line x1="${o}" y1="${o + size * u}" x2="${o + size * u + 14}" y2="${o + size * u}" stroke="#2B2D5B" stroke-width="2.5"/><line x1="${o}" y1="${o + size * u}" x2="${o}" y2="${o - 14}" stroke="#2B2D5B" stroke-width="2.5"/>`;
  s += `<text x="${o + size * u + 16}" y="${o + size * u + 5}" font-size="14" fill="#2B2D5B">x</text><text x="${o - 4}" y="${o - 18}" font-size="14" fill="#2B2D5B">y</text>`;
  pts.forEach((p, i) => { const x = o + p[0] * u, y = o + (size - p[1]) * u; s += `<circle cx="${x}" cy="${y}" r="7" fill="${P[(i + 1) % 6]}"/><text x="${x + 9}" y="${y - 8}" font-size="16" font-weight="700" fill="#2B2D5B">${p[2]}</text>`; });
  return svg(o + size * u + 34, o + size * u + 30, s);
}
function vBars(labels, vals, step, title, hist) {
  const max = Math.max(...vals), top = Math.ceil(max / step) * step, H = 180, bw = hist ? 280 / labels.length : 240 / labels.length, o = 46;
  let s = `<text x="${o + 140}" y="16" text-anchor="middle" font-size="15" font-weight="700" fill="#2B2D5B">${title}</text>`;
  for (let v = 0; v <= top; v += step) { const y = 30 + H - v / top * H; s += `<line x1="${o}" y1="${y}" x2="${o + 290}" y2="${y}" stroke="#E1E4F0"/><text x="${o - 8}" y="${y + 5}" text-anchor="end" font-size="12" fill="#5A5F80">${v}</text>`; }
  labels.forEach((l, i) => {
    const h = vals[i] / top * H, x = hist ? o + 4 + i * bw : o + 12 + i * (bw + 0) + bw * 0.15, w = hist ? bw : bw * 0.7;
    s += `<rect x="${x}" y="${30 + H - h}" width="${w}" height="${h}" fill="${hist ? '#7A4FD1' : P[i % 6]}" stroke="${hist ? '#fff' : 'none'}" stroke-width="2"/>`;
    s += `<text x="${x + w / 2}" y="${30 + H + 18}" text-anchor="middle" font-size="12" fill="#2B2D5B">${l}</text>`;
  });
  s += `<line x1="${o}" y1="${30 + H}" x2="${o + 290}" y2="${30 + H}" stroke="#2B2D5B" stroke-width="2"/>`;
  return svg(350, 240, s);
}
function vPicto(labels, vals, key) {
  let s = '';
  labels.forEach((l, i) => {
    s += `<text x="8" y="${40 + i * 44}" font-size="16" fill="#2B2D5B">${l}</text>`;
    const full = Math.floor(vals[i] / key), half = vals[i] % key;
    for (let k = 0; k < full; k++) s += star(110 + k * 30, 34 + i * 44, 13, '#F2B533');
    if (half) s += `<clipPath id="hc${i}"><rect x="${110 + full * 30 - 14}" y="${18 + i * 44}" width="14" height="30"/></clipPath><g clip-path="url(#hc${i})">${star(110 + full * 30, 34 + i * 44, 13, '#F2B533')}</g>`;
  });
  s += `<text x="8" y="${40 + labels.length * 44}" font-size="15" fill="#5A5F80">Key: </text>${star(56, 34 + labels.length * 44, 11, '#F2B533')}<text x="72" y="${40 + labels.length * 44}" font-size="15" fill="#5A5F80">= ${key} visitors</text>`;
  return svg(360, 60 + labels.length * 44, s);
}
function vBox(l, w, h) {
  const k = 22, dx = 0.5 * k, dy = -0.4 * k, X0 = 40, Y0 = 60 + h * k;
  const pt = (a, b, c) => [(X0 + a * k + c * dx).toFixed(1), (Y0 - b * k + c * dy).toFixed(1)].join(' ');
  let s = `<path d="M${pt(0, 0, 0)} L${pt(l, 0, 0)} L${pt(l, h, 0)} L${pt(0, h, 0)}Z" fill="#FFE3A8" stroke="#2B2D5B" stroke-width="2"/>`;
  s += `<path d="M${pt(0, h, 0)} L${pt(l, h, 0)} L${pt(l, h, w)} L${pt(0, h, w)}Z" fill="#FFF1CF" stroke="#2B2D5B" stroke-width="2"/>`;
  s += `<path d="M${pt(l, 0, 0)} L${pt(l, 0, w)} L${pt(l, h, w)} L${pt(l, h, 0)}Z" fill="#F7CF7A" stroke="#2B2D5B" stroke-width="2"/>`;
  for (let i = 1; i < l; i++) s += `<line x1="${pt(i, 0, 0).split(' ')[0]}" y1="${pt(i, 0, 0).split(' ')[1]}" x2="${pt(i, h, 0).split(' ')[0]}" y2="${pt(i, h, 0).split(' ')[1]}" stroke="#2B2D5B" stroke-opacity=".25"/>`;
  for (let i = 1; i < h; i++) s += `<line x1="${pt(0, i, 0).split(' ')[0]}" y1="${pt(0, i, 0).split(' ')[1]}" x2="${pt(l, i, 0).split(' ')[0]}" y2="${pt(l, i, 0).split(' ')[1]}" stroke="#2B2D5B" stroke-opacity=".25"/>`;
  const [ax, ay] = pt(l / 2, 0, 0).split(' '), [bx, by] = pt(l, 0, w / 2).split(' '), [cx, cy] = pt(0, h / 2, 0).split(' ');
  s += `<text x="${ax}" y="${+ay + 22}" text-anchor="middle" font-size="16" fill="#2B2D5B">${l} cm</text><text x="${+bx + 8}" y="${+by + 16}" font-size="16" fill="#2B2D5B">${w} cm</text><text x="${+cx - 8}" y="${+cy + 5}" text-anchor="end" font-size="16" fill="#2B2D5B">${h} cm</text>`;
  return svg(X0 + l * k + w * dx + 80, Y0 + 40, s);
}

/* ---------- generators ---------- */
const nm = () => pick(NAMES), sup = () => pick(SUP);
const G = {};

function factQ(a, b, div) {
  const p = a * b;
  const q = div ? numQ(`${p} ${D} ${a} = ?`, b, [`Think of the fact family: ${a} ${X} ? = ${p}.`, `${a} ${X} ${b} = ${p}, so ${p} ${D} ${a} = ${b}.`]) : numQ(Math.random() < 0.5 ? `${a} ${X} ${b} = ?` : `${b} ${X} ${a} = ?`, p, [`Count by ${a}s, ${b} times: ${Array.from({ length: Math.min(b, 10) }, (_, i) => a * (i + 1)).join(', ')}.`, `${a} ${X} ${b} = ${p}.`]);
  q.fact = Math.min(a, b) + 'x' + Math.max(a, b); q.key = 'facts'; return q;
}
G.facts = (d, o) => {
  const set = (o && o.set) || [2, 3, 4, 5, 6, 7, 8, 9, 10];
  return factQ(pick(set), d === 1 ? R(1, 6) : R(1, 10), o && o.div);
};

/* Unit 1 */
G.eqGroups = d => {
  const n = R(2, d === 1 ? 4 : 6); let per = R(2, d === 1 ? 5 : 8); if (per === n) per++; const t = n * per;
  if (d === 1) return mcQ(`There are ${n} equal groups with ${per} in each group. Which multiplication sentence matches the picture?`, `${n} ${X} ${per} = ${t}`, [`${n} + ${per} = ${n + per}`, `${n} ${X} ${n} = ${n * n}`, `${per} ${X} ${per} = ${per * per}`, `${n} ${X} ${per} = ${t + per}`], [`Count the groups: ${n}.`, `Count how many are in ONE group: ${per}.`, `Groups ${X} number in each group: ${n} ${X} ${per} = ${t}.`], { visual: vGroups(n, per) });
  if (d === 2) return ask(`How many stars are there in all? Write it as ${n} groups of ${per}.`, t, [`There are ${n} groups.`, `Each group has ${per}.`, `${n} ${X} ${per} = ${t}.`], d, { visual: vGroups(n, per, 'star') });
  return mcQ(`Which picture description matches ${n} ${X} ${per}?`, `${n} groups with ${per} in each group`, [`${per} groups with ${per} in each group`, `${n} groups with ${n} in each group`, `${n + per} groups with 1 in each group`], [`The first number tells how many groups: ${n}.`, `The second number tells how many in each group: ${per}.`]);
};
G.repAdd = d => {
  const a = R(2, d === 1 ? 5 : 9), n = R(3, d === 1 ? 4 : 6), t = a * n, add = Array(n).fill(a).join(' + ');
  if (d === 1) return mcQ(`${add} is the same as…`, `${n} ${X} ${a}`, [`${n} + ${a}`, `${a} ${X} ${a}`, `${n + 1} ${X} ${a}`], [`Count how many times ${a} is added: ${n} times.`, `Adding ${a} ${n} times is ${n} ${X} ${a} = ${t}.`]);
  if (d === 2) { const s = pick([2, 3, 4, 5, 10]), k = R(3, 6), seq = Array.from({ length: k }, (_, i) => s * (i + 1)); return ask(`Skip count by ${s}s: ${seq.join(', ')}, __. What comes next?`, s * (k + 1), [`Each number is ${s} more than the one before.`, `${seq[k - 1]} + ${s} = ${s * (k + 1)}.`, `That is ${k + 1} ${X} ${s}.`], d); }
  return ask(`${add} = ?  (Use multiplication to find it fast.)`, t, [`${a} is added ${n} times.`, `${n} ${X} ${a} = ${t}.`], d);
};
G.life1 = d => {
  const f = d === 1 ? pick([2, 5, 10]) : R(3, 9), n = R(3, d === 3 ? 9 : 7), s = sup(), w = nm();
  if (d < 3) return ask(`${w} buys ${n} packs of ${s}. Each pack has ${f} ${s}. How many ${s} does she have?`, n * f, [`Equal groups: ${n} packs, ${f} in each pack.`, `${n} ${X} ${f} = ${n * f}.`], d, { suf: s });
  const ex = R(2, 9);
  return ask(`${w} has ${n} boxes of ${s} with ${f} in each box. Her friend gives her ${ex} more. How many does she have now?`, n * f + ex, [`First multiply: ${n} ${X} ${f} = ${n * f}.`, `Then add the extra: ${n * f} + ${ex} = ${n * f + ex}.`], d);
};
/* Unit 2 */
G.arrays = d => {
  const r = R(2, d === 1 ? 4 : 6), c = R(3, d === 1 ? 5 : 9);
  if (d === 1) return mcQ(`This array has ${r} rows and ${c} columns. Which sentence tells how many dots?`, `${r} ${X} ${c} = ${r * c}`, [`${r} + ${c} = ${r + c}`, `${r} ${X} ${c} = ${r * c + c}`, `${c} ${X} ${c} = ${c * c}`], [`Rows go across. There are ${r} rows.`, `Each row has ${c} dots.`, `${r} ${X} ${c} = ${r * c}.`], { visual: vArray(r, c) });
  if (d === 2) return ask(`${r} ${X} ${c} = ${c} ${X} ?`, r, [`Turning an array sideways does not change the total.`, `So ${r} ${X} ${c} = ${c} ${X} ${r}. The missing number is ${r}.`], d);
  return ask(`How many dots are in this array?`, r * c, [`Count the rows: ${r}. Count one row: ${c}.`, `${r} ${X} ${c} = ${r * c}.`], d, { visual: vArray(r, c, '#7A4FD1') });
};
G.area = d => {
  const r = R(2, d === 1 ? 4 : 7), c = R(3, d === 1 ? 6 : 9);
  if (d === 1) return ask(`What is the area of this rectangle in square units?`, r * c, [`Area means how many squares cover the shape.`, `${r} rows of ${c} squares: ${r} ${X} ${c} = ${r * c} square units.`], d, { visual: vGrid(r, c), suf: 'square units' });
  if (d === 2) return ask(`A drawing paper is ${c} inches long and ${r} inches wide. What is its area?`, r * c, [`Area of a rectangle = length ${X} width.`, `${c} ${X} ${r} = ${r * c} square inches.`], d, { visual: vRect(c, r, 'in'), suf: 'sq in' });
  return ask(`A rectangle has an area of ${r * c} square cm. One side is ${c} cm. How long is the other side?`, r, [`Area = length ${X} width, so ${c} ${X} ? = ${r * c}.`, `${r * c} ${D} ${c} = ${r}. The other side is ${r} cm.`], d, { suf: 'cm' });
};
G.life2 = d => {
  const a = R(3, d === 1 ? 5 : 9), b = R(3, d === 1 ? 6 : 9), w = nm();
  if (d < 3) return ask(`${w} is making a mosaic. It has ${a} rows of tiles with ${b} tiles in each row. How many tiles does she need?`, a * b, [`Rows ${X} tiles in each row.`, `${a} ${X} ${b} = ${a * b} tiles.`], d);
  const used = R(2, a * b - 2);
  return ask(`${w}'s mosaic needs ${a} rows of ${b} tiles. She already glued ${used} tiles. How many more does she need?`, a * b - used, [`Total tiles: ${a} ${X} ${b} = ${a * b}.`, `Subtract what is done: ${a * b} ${MINUS} ${used} = ${a * b - used}.`], d);
};
/* Unit 3 */
G.share = d => {
  const gr = R(2, d === 1 ? 4 : 6), each = R(2, d === 1 ? 5 : 8), t = gr * each;
  if (d === 1) return ask(`${t} beads are shared equally into ${gr} cups. How many beads go in each cup?  (${t} ${D} ${gr})`, each, [`Share them out one at a time into ${gr} cups.`, `Each cup ends up with ${each}, because ${gr} ${X} ${each} = ${t}.`], d, { visual: vGroups(gr, each) });
  if (d === 2) return ask(`How many groups of ${each} can you make from ${t}?`, gr, [`Division can mean "how many groups?"`, `Ask: ? ${X} ${each} = ${t}.`, `${gr} ${X} ${each} = ${t}, so there are ${gr} groups.`], d);
  return ask(`${t} ${D} ${gr} = ?`, each, [`Think multiplication: ${gr} ${X} ? = ${t}.`, `${gr} ${X} ${each} = ${t}, so the answer is ${each}.`], d);
};
G.family = d => {
  const a = R(2, 9), b = R(2, 9), p = a * b;
  if (d === 1) return ask(`? ${X} ${a} = ${p}`, b, [`Use division: ${p} ${D} ${a}.`, `${b} ${X} ${a} = ${p}, so the missing number is ${b}.`], d);
  if (d === 2) return mcQ(`Which fact is in the same fact family as ${a} ${X} ${b} = ${p}?`, `${p} ${D} ${b} = ${a}`, [`${p} ${D} ${a} = ${a}`, `${a} + ${b} = ${p}`, `${p} ${X} ${a} = ${b}`], [`A fact family uses the same three numbers: ${a}, ${b}, and ${p}.`, `The biggest number (${p}) is divided by one factor to get the other.`]);
  return ask(`${p} ${D} ? = ${a}`, b, [`Ask: ${a} ${X} ? = ${p}.`, `${a} ${X} ${b} = ${p}, so ${p} ${D} ${b} = ${a}.`], d);
};
G.life3 = d => {
  const f = R(2, d === 1 ? 5 : 9), e = R(2, d === 1 ? 6 : 9), t = f * e, w = nm(), s = sup();
  if (d < 3) return ask(`${w} has ${t} ${s}. She shares them equally with ${f} friends. How many does each friend get?`, e, [`Share ${t} into ${f} equal groups.`, `${t} ${D} ${f} = ${e}, because ${f} ${X} ${e} = ${t}.`], d);
  const tt = t;
  return ask(`${w}'s art class has ${tt} ${s}. Each table gets ${e}. How many tables get ${s}?`, f, [`How many groups of ${e} fit in ${tt}?`, `${tt} ${D} ${e} = ${f} tables.`], d);
};
/* Unit 4 */
G.breakApart = d => {
  const a = R(6, 9), b = R(6, 9), p1 = 5, p2 = b - 5;
  if (d === 1) return ask(`${a} ${X} ${b} = (${a} ${X} 5) + (${a} ${X} ?)`, p2, [`Break ${b} into 5 and ${p2}.`, `${b} = 5 + ${p2}, so the missing number is ${p2}.`], d);
  if (d === 2) return ask(`Break apart to solve: ${a} ${X} ${b} = ${a * 5} + ${a * p2} = ?`, a * b, [`${a} ${X} 5 = ${a * 5}.`, `${a} ${X} ${p2} = ${a * p2}.`, `${a * 5} + ${a * p2} = ${a * b}.`], d);
  const c = R(11, 15);
  return ask(`Use break apart: ${a} ${X} ${c} = ?`, a * c, [`Break ${c} into 10 and ${c - 10}.`, `${a} ${X} 10 = ${a * 10}, and ${a} ${X} ${c - 10} = ${a * (c - 10)}.`, `${a * 10} + ${a * (c - 10)} = ${a * c}.`], d);
};
G.tens = d => {
  const a = R(2, 9), b = R(2, 9), z = d === 1 ? 10 : d === 2 ? pick([10, 100]) : 100;
  if (d < 3) return ask(`${a} ${X} ${b * z} = ?`, a * b * z, [`Start with the basic fact: ${a} ${X} ${b} = ${a * b}.`, `${b * z} has ${String(z).length - 1} zero${z > 10 ? 's' : ''}, so add ${z > 10 ? 'them' : 'it'}: ${a * b * z}.`], d);
  return ask(`${a * 10} ${X} ${b * 10} = ?`, a * b * 100, [`Basic fact: ${a} ${X} ${b} = ${a * b}.`, `Count the zeros in both numbers: 2 zeros.`, `${a * b} with 2 zeros is ${a * b * 100}.`], d);
};
G.life4 = d => {
  const per = R(6, 9), n = R(3, 9), w = nm();
  if (d < 3) return ask(`Each bracelet uses ${per} beads. ${w} makes ${n} bracelets. How many beads does she use?`, per * n, [`${n} bracelets, ${per} beads each.`, `${n} ${X} ${per} = ${per * n} beads.`], d);
  const extra = R(1, 5) * 10;
  return ask(`${w} makes ${n} bracelets with ${per} beads each and a necklace with ${extra} beads. How many beads in all?`, per * n + extra, [`Bracelets: ${n} ${X} ${per} = ${per * n}.`, `Add the necklace: ${per * n} + ${extra} = ${per * n + extra}.`], d);
};
/* Unit 5 */
G.moneyAdd = d => {
  if (d === 1) { const a = R(1, 9) + pick([0, 0.25, 0.5, 0.75]), b = R(1, 9) + pick([0, 0.25, 0.5]); return ask(`${money(a)} + ${money(b)} = ?`, a + b, [`Line up the decimal points.`, `Add dollars: ${Math.floor(a)} + ${Math.floor(b)}. Add cents: ${Math.round((a % 1) * 100)}¢ + ${Math.round((b % 1) * 100)}¢.`, `Total: ${money(a + b)}.`], d, { pre: '$', f: money, tol: 0.005, show: money(a + b) }); }
  if (d === 2) { const a = R(100, 999) / 100, b = R(100, 999) / 100; return ask(`${money(a)} + ${money(b)} = ?`, Math.round((a + b) * 100) / 100, [`Line up the decimal points.`, `Add the cents, then the dollars. Carry 100¢ as $1 if needed.`, `Total: ${money(a + b)}.`], d, { pre: '$', f: money, tol: 0.005, show: money(a + b) }); }
  const pay = pick([10, 20]), cost = R(150, pay * 100 - 50) / 100, ch = Math.round((pay - cost) * 100) / 100;
  return ask(`You pay ${money(pay)} for paint that costs ${money(cost)}. How much change do you get?`, ch, [`Change = money paid ${MINUS} cost.`, `${money(pay)} ${MINUS} ${money(cost)} = ${money(ch)}.`], d, { pre: '$', f: money, tol: 0.005, show: money(ch) });
};
G.unitPrice = d => {
  const n = R(2, d === 1 ? 5 : 8), it = pick(['paintbrushes', 'sketch pads', 'glue sticks', 'markers', 'canvases']);
  if (d === 1) { const u = R(2, 9); return ask(`${n} ${it} cost $${n * u}. How much does ONE cost?`, u, [`Unit price = total cost ${D} number of items.`, `$${n * u} ${D} ${n} = $${u}.`], d, { pre: '$', f: x => '$' + x, tol: 0.005, show: '$' + u }); }
  if (d === 2) { const u = R(5, 40) * 25 / 100; const t = Math.round(u * n * 100) / 100; return ask(`${n} ${it} cost ${money(t)}. What is the price of one?`, u, [`Divide the total by the number of items.`, `${money(t)} ${D} ${n} = ${money(u)}.`], d, { pre: '$', f: money, tol: 0.005, show: money(u) }); }
  const a = R(2, 4), ua = R(3, 8) * 25 / 100, b = a + R(1, 3); let ub = ua + pick([-0.25, 0.25]); if (ub <= 0) ub = ua + 0.25;
  const ta = Math.round(a * ua * 100) / 100, tb = Math.round(b * ub * 100) / 100;
  const better = ua < ub ? `${a} for ${money(ta)}` : `${b} for ${money(tb)}`, worse = ua < ub ? `${b} for ${money(tb)}` : `${a} for ${money(ta)}`;
  return mcQ(`Which is the better buy for ${it}?`, better, [worse, 'They cost the same'], [`Find the unit price of each.`, `${money(ta)} ${D} ${a} = ${money(ua)} each.`, `${money(tb)} ${D} ${b} = ${money(ub)} each.`, `The lower unit price is the better buy.`]);
};
G.life5 = d => {
  const n = R(2, 5), u = R(1, 6) + pick([0.25, 0.5, 0.75]), it = pick(['sketch pads', 'paint sets', 'clay packs', 'brush sets']), w = nm();
  const t = Math.round(n * u * 100) / 100;
  if (d < 3) return ask(`${w} buys ${n} ${it} for ${money(u)} each. What is the total cost?`, t, [`Multiply the price by how many: ${n} ${X} ${money(u)}.`, `${n} ${X} ${Math.floor(u)} = ${n * Math.floor(u)} dollars and ${n} ${X} ${Math.round(u % 1 * 100)}¢ = ${Math.round(n * (u % 1) * 100)}¢.`, `Total: ${money(t)}.`], d, { pre: '$', f: money, tol: 0.005, show: money(t) });
  const pay = t < 20 ? 20 : 50, ch = Math.round((pay - t) * 100) / 100;
  return ask(`${w} buys ${n} ${it} at ${money(u)} each and pays with ${money(pay)}. How much change?`, ch, [`Total: ${n} ${X} ${money(u)} = ${money(t)}.`, `Change: ${money(pay)} ${MINUS} ${money(t)} = ${money(ch)}.`], d, { pre: '$', f: money, tol: 0.005, show: money(ch) });
};
/* Unit 6 */
G.mult1 = d => {
  const a = d === 1 ? R(12, 49) : d === 2 ? R(102, 489) : R(1012, 3999), b = R(3, 9);
  const parts = String(a).split('').map((c, i, s) => +c * Math.pow(10, s.length - 1 - i)).filter(x => x);
  return ask(`${a} ${X} ${b} = ?`, a * b, [`Break ${a} into place values: ${parts.join(' + ')}.`, ...parts.map(p => `${p} ${X} ${b} = ${p * b}`), `Add the parts: ${parts.map(p => p * b).join(' + ')} = ${a * b}.`], d);
};
G.mult2 = d => {
  const a = d === 3 ? R(102, 349) : R(12, 49), b = d === 1 ? pick([11, 12, 20, 21, 30]) : R(12, 39);
  const t = Math.floor(b / 10) * 10, o = b % 10;
  return ask(`${a} ${X} ${b} = ?`, a * b, [`Break ${b} into ${t} + ${o}.`, `${a} ${X} ${t} = ${a * t}.`, o ? `${a} ${X} ${o} = ${a * o}.` : `${a} ${X} 0 = 0.`, `Add: ${a * t} + ${a * o} = ${a * b}.`], d);
};
G.life6 = d => {
  const cls = R(3, 9), per = d === 1 ? R(12, 25) : R(24, 48), it = pick(['sheets of paper', 'pipe cleaners', 'craft sticks', 'pom-poms']);
  if (d < 3) return ask(`The art teacher orders ${per} ${it} for each of ${cls} classes. How many ${it} is that?`, per * cls, [`${cls} classes ${X} ${per} each.`, `${per} ${X} ${cls} = ${per * cls}.`], d);
  const boxes = R(12, 24), inb = R(15, 36);
  return ask(`A store has ${boxes} boxes of ${it} with ${inb} in each box. How many in all?`, boxes * inb, [`${boxes} ${X} ${inb}: break ${inb} into ${Math.floor(inb / 10) * 10} + ${inb % 10}.`, `${boxes} ${X} ${Math.floor(inb / 10) * 10} = ${boxes * Math.floor(inb / 10) * 10}; ${boxes} ${X} ${inb % 10} = ${boxes * (inb % 10)}.`, `Total: ${boxes * inb}.`], d);
};
/* Unit 7 */
G.remainder = d => {
  const b = R(2, d === 1 ? 5 : 9), q = R(2, 9), r = R(1, b - 1), t = b * q + r;
  return mcQ(`${t} ${D} ${b} = ?`, `${q} R ${r}`, [`${q + 1} R ${r}`, `${q} R ${r + 1 < b ? r + 1 : r - 1 || b}`, `${q - 1} R ${r + b}`, `${q}`], [`Find the biggest fact of ${b} that fits in ${t}: ${b} ${X} ${q} = ${b * q}.`, `What's left over? ${t} ${MINUS} ${b * q} = ${r}.`, `The remainder (${r}) must be smaller than ${b}. Answer: ${q} R ${r}.`]);
};
G.longDiv = d => {
  const b = R(2, 9), q = d === 1 ? R(11, 24) : d === 2 ? R(21, 189) : R(102, 999), t = b * q;
  const steps = [`Divide one place at a time, starting on the left.`];
  let rem = 0; const ds = String(t);
  for (let i = 0; i < ds.length; i++) { const cur = rem * 10 + +ds[i]; const qq = Math.floor(cur / b); if (cur >= b || i > 0) steps.push(`Bring down to get ${cur}. ${cur} ${D} ${b} = ${qq}${cur - qq * b ? ' with ' + (cur - qq * b) + ' left' : ''}.`); rem = cur - qq * b; }
  steps.push(`Check: ${q} ${X} ${b} = ${t}. Answer: ${q}.`);
  return ask(`${t} ${D} ${b} = ?`, q, steps, d);
};
G.life7 = d => {
  const box = R(4, 9), full = R(3, 9), left = R(1, box - 1), t = box * full + left, w = nm();
  const k = d === 1 ? 'full' : d === 2 ? 'need' : pick(['left', 'need']);
  if (k === 'full') return ask(`${w} packs ${t} paintbrushes into boxes of ${box}. How many boxes can she fill all the way?`, full, [`${t} ${D} ${box} = ${full} R ${left}.`, `Only full boxes count, so the answer is ${full}.`], d);
  if (k === 'need') return ask(`${t} students go to the art museum. Each van holds ${box} students. How many vans are needed so everyone can go?`, full + 1, [`${t} ${D} ${box} = ${full} R ${left}.`, `${full} vans hold ${full * box} students. ${left} students are still waiting!`, `They need one more van: ${full + 1}.`], d);
  return ask(`${w} has ${t} stickers and puts ${box} on each page. How many stickers are left over?`, left, [`${t} ${D} ${box} = ${full} R ${left}.`, `The remainder is what's left over: ${left}.`], d);
};
/* Unit 8 */
const fr = (n, d) => `${n}/${d}`;
G.fracName = d => {
  if (d === 1) { const den = pick([2, 3, 4, 5, 6, 8]), num = R(1, den - 1); return mcQ(`What fraction of the shape is shaded?`, fr(num, den), [fr(den - num, den), fr(num, den + 1), fr(den, num), fr(num + 1, den)].filter(x => x !== fr(num, den)), [`Count all the equal parts: ${den}. That is the bottom number.`, `Count the shaded parts: ${num}. That is the top number.`, `Answer: ${num}/${den}.`], { visual: vPie(num, den, pick(['pie', 'bar'])) }); }
  if (d === 2) { const den = pick([2, 3, 4, 5]), num = R(1, den - 1), k = R(2, 4); return ask(`${num}/${den} = ?/${den * k}`, num * k, [`What times ${den} makes ${den * k}? ${X}${k}.`, `Do the same to the top: ${num} ${X} ${k} = ${num * k}.`, `${num}/${den} = ${num * k}/${den * k}.`], d); }
  const den = pick([3, 4, 5, 6]), num = R(1, den - 1), k = R(2, 3);
  return mcQ(`Which fraction is equal to ${fr(num, den)}?`, fr(num * k, den * k), [fr(num + k, den + k), fr(num * k, den), fr(num, den * k)], [`Equal fractions: multiply the top AND bottom by the same number.`, `${num} ${X} ${k} = ${num * k} and ${den} ${X} ${k} = ${den * k}.`, `So ${fr(num, den)} = ${fr(num * k, den * k)}.`]);
};
G.fracOps = d => {
  if (d === 1) { const den = R(4, 10), a = R(1, den - 1); let b = R(1, den - 1); if (b === a) b = a === 1 ? 2 : a - 1; return mcQ(`Compare: ${fr(a, den)}  ?  ${fr(b, den)}`, a > b ? '>' : '<', [a > b ? '<' : '>', '='], [`The bottoms are the same, so the pieces are the same size.`, `More pieces means a bigger fraction: ${Math.max(a, b)} pieces beats ${Math.min(a, b)}.`, `${fr(a, den)} ${a > b ? '>' : '<'} ${fr(b, den)}.`], { keep: false }); }
  if (d === 2) { const den = R(5, 12), a = R(1, den - 2), b = R(1, den - a - 1); return mcQ(`${fr(a, den)} + ${fr(b, den)} = ?`, fr(a + b, den), [fr(a + b, den * 2), fr(a + b, den + den), fr(a * b, den), fr(a + b + 1, den)], [`The bottoms are the same, so the piece size stays ${den}ths.`, `Add the tops only: ${a} + ${b} = ${a + b}.`, `Answer: ${fr(a + b, den)}.`]); }
  const den = pick([2, 3, 4, 5]), num = R(1, den - 1), k = R(2, 6), t = den * k;
  return ask(`What is ${fr(num, den)} of ${t}?`, num * k, [`Find 1/${den} first: ${t} ${D} ${den} = ${k}.`, `Then take ${num} of those: ${num} ${X} ${k} = ${num * k}.`], d);
};
G.life8 = d => {
  const w = nm();
  if (d < 3) { const den = pick([4, 6, 8]), a = R(1, den / 2), b = R(1, den / 2 - 1 || 1); return mcQ(`${w} mixes ${fr(a, den)} cup of blue paint with ${fr(b, den)} cup of yellow paint to make green. How much green paint does she have?`, fr(a + b, den) + ' cup', [fr(a + b, den * 2) + ' cup', fr(a + b, den + den) + ' cup', fr(Math.abs(a - b) || 1, den) + ' cup'], [`Same bottom numbers (${den}ths), so add the tops.`, `${a} + ${b} = ${a + b}.`, `${fr(a + b, den)} cup of green.`]); }
  const den = pick([3, 4, 5]), num = R(1, den - 1), k = R(3, 8), t = den * k;
  return ask(`${w} has ${t} sheets of paper. She uses ${fr(num, den)} of them for a painting project. How many sheets does she use?`, num * k, [`1/${den} of ${t} is ${t} ${D} ${den} = ${k}.`, `${num}/${den} is ${num} ${X} ${k} = ${num * k} sheets.`], d);
};
/* Unit 9 */
G.lineTypes = d => {
  const t = pick(['point', 'segment', 'ray', 'line']);
  const name = { point: 'Point', segment: 'Line segment', ray: 'Ray', line: 'Line' };
  const why = { point: 'A point is one exact spot. It is just a dot.', segment: 'A segment has two endpoints. It stops at both ends.', ray: 'A ray has one endpoint and goes on forever in one direction (one arrow).', line: 'A line goes on forever in both directions (two arrows).' };
  if (d < 3) return mcQ(`What is this called?`, name[t], Object.values(name).filter(x => x !== name[t]), [why[t]], { visual: vLineType(t) });
  const q = pick([['How many endpoints does a line segment have?', '2', ['1', '0', 'It goes on forever'], 'A segment stops at both ends, so it has 2 endpoints.'], ['How many endpoints does a ray have?', '1', ['2', '0', '3'], 'A ray starts at one endpoint and goes on forever the other way.'], ['How many endpoints does a line have?', '0', ['1', '2', '4'], 'A line goes on forever both ways, so it has no endpoints.'], ['Which one goes on forever in BOTH directions?', 'A line', ['A ray', 'A line segment', 'A point'], 'Lines have arrows on both ends.']]);
  return mcQ(q[0], q[1], q[2], [q[3]]);
};
G.coord = d => {
  const x = R(1, 7), y = R(1, 7);
  if (d === 1) return mcQ(`What are the coordinates of point P?`, `(${x}, ${y})`, [`(${y}, ${x})`, `(${x + 1}, ${y})`, `(${x}, ${y - 1 || y + 1})`].filter(o => o !== `(${x}, ${y})`), [`Start at 0. Go ACROSS first: x = ${x}.`, `Then go UP: y = ${y}.`, `Write (across, up): (${x}, ${y}).`], { visual: vCoord([[x, y, 'P']]) });
  if (d === 2) { let x2 = y, y2 = x; if (x2 === x && y2 === y) { x2 = (x % 7) + 1; } const pts = shuf([[x, y, 'A'], [x2, y2, 'B'], [Math.min(8, x + 2), Math.max(1, y - 2), 'C']]); const ans = pts.find(p => p[0] === x && p[1] === y)[2]; return mcQ(`Which point is at (${x}, ${y})?`, `Point ${ans}`, ['A', 'B', 'C'].filter(l => l !== ans).map(l => 'Point ' + l).concat(['None of them']), [`(${x}, ${y}) means go across ${x}, then up ${y}.`, `The point there is ${ans}.`], { visual: vCoord(pts) }); }
  const q = pick([['The point (0, 0), where the x-axis and y-axis meet, is called the…', 'origin', ['center', 'endpoint', 'axis'], 'The origin is (0, 0), where both axes start.'], ['To plot (5, 2), which way do you move FIRST?', '5 to the right', ['5 up', '2 to the right', '2 up'], 'The first number (x) tells how far to move across.'], ['The line that goes straight across the bottom is called the…', 'x-axis', ['y-axis', 'origin', 'ray'], 'The x-axis runs across; the y-axis runs up.'], [`Point M is at (${x}, ${y}). It moves 2 units up. Where is it now?`, `(${x}, ${y + 2})`, [`(${x + 2}, ${y})`, `(${x}, ${y - 2 > 0 ? y - 2 : y + 3})`, `(${x + 2}, ${y + 2})`], 'Moving up changes only the y-number (the second one).']]);
  return mcQ(q[0], q[1], q[2], [q[3]]);
};
G.life9 = d => {
  const w = nm();
  if (d === 1) { const x = R(1, 4), y = R(1, 6), m = R(1, 3); return ask(`${w} draws a flower at (${x}, ${y}) on her grid paper. She draws the next flower ${m} units to the right. What is the new x-coordinate?`, x + m, [`Moving right adds to x (the first number).`, `${x} + ${m} = ${x + m}. The new point is (${x + m}, ${y}).`], d); }
  const l = R(6, 15), wd = R(4, 12);
  if (d === 2) return ask(`A picture frame is ${l} inches long and ${wd} inches wide. How many inches of gold ribbon go all the way around it (perimeter)?`, 2 * (l + wd), [`Perimeter = add all four sides.`, `${l} + ${wd} + ${l} + ${wd} = ${2 * (l + wd)} inches.`], d, { visual: vRect(l, wd, 'in') });
  return ask(`${w} draws a square that is ${wd} cm on each side. What is its perimeter?`, 4 * wd, [`A square has 4 equal sides.`, `4 ${X} ${wd} = ${4 * wd} cm.`], d);
};
/* Unit 10 */
G.massUnit = d => {
  const items = d === 1 ? [['a paperclip', 'grams (g)', 'kilograms (kg)'], ['a crayon', 'grams (g)', 'kilograms (kg)'], ['a big bag of clay', 'kilograms (kg)', 'grams (g)'], ['a desk', 'kilograms (kg)', 'grams (g)'], ['a pencil', 'grams (g)', 'kilograms (kg)'], ['a heavy box of paint', 'kilograms (kg)', 'grams (g)']]
    : d === 2 ? [['the length of a crayon', 'centimeters (cm)', 'kilometers (km)'], ['the distance to the museum', 'kilometers (km)', 'centimeters (cm)'], ['the length of a classroom', 'meters (m)', 'millimeters (mm)'], ['the thickness of a paper', 'millimeters (mm)', 'meters (m)']]
      : [['a cup of paint water', 'milliliters (mL)', 'liters (L)'], ['a big bucket of paint', 'liters (L)', 'milliliters (mL)'], ['a drop of glue', 'milliliters (mL)', 'liters (L)']];
  const it = pick(items), all = d === 1 ? ['grams (g)', 'kilograms (kg)'] : d === 2 ? ['millimeters (mm)', 'centimeters (cm)', 'meters (m)', 'kilometers (km)'] : ['milliliters (mL)', 'liters (L)'];
  const what = d === 1 ? 'mass' : d === 2 ? 'length' : 'capacity';
  const hint = d === 1 ? ['Grams are for light things (a paperclip is about 1 g).', 'Kilograms are for heavy things (1 kg = 1,000 g, like a big book).'] : d === 2 ? ['mm: tiny. cm: about a fingernail. m: about a big step. km: a long walk.'] : ['mL: a few drops or a small cup. L: a big bottle or more.'];
  return mcQ(`Which unit would you use for the ${what} of ${it[0]}?`, it[1], all.filter(u => u !== it[1]), hint.concat([`So ${it[0]} uses ${it[1]}.`]));
};
G.convert = d => {
  const c = pick(d === 3 ? [['kg', 'g', 1000], ['m', 'cm', 100], ['L', 'mL', 1000]] : [['kg', 'g', 1000], ['m', 'cm', 100], ['cm', 'mm', 10], ['km', 'm', 1000], ['L', 'mL', 1000]]);
  if (d < 3) { const n = R(2, d === 1 ? 9 : 25); return ask(`${n} ${c[0]} = ? ${c[1]}`, n * c[2], [`1 ${c[0]} = ${c[2].toLocaleString()} ${c[1]}.`, `Big unit to small unit: multiply. ${n} ${X} ${c[2].toLocaleString()} = ${(n * c[2]).toLocaleString()}.`], d, { suf: c[1] }); }
  const n = R(11, 49) * c[2] / 10;
  return ask(`${n.toLocaleString()} ${c[1]} = ? ${c[0]}`, n / c[2], [`Small unit to big unit: divide by ${c[2].toLocaleString()}.`, `${n.toLocaleString()} ${D} ${c[2].toLocaleString()} = ${fmt(n / c[2])}.`], d, { suf: c[0] });
};
G.life10 = d => {
  const w = nm(), per = pick([150, 200, 250, 300]), n = R(2, 6);
  if (d === 1) return ask(`${w} uses ${per} g of clay for each figure. How many grams for ${n} figures?`, per * n, [`${n} ${X} ${per} = ${per * n} g.`], d, { suf: 'g' });
  if (d === 2) { const bag = pick([1, 2]) * 1000, k = Math.floor(bag / per); return ask(`A bag has ${bag / 1000} kg of clay. Each figure needs ${per} g. How many whole figures can ${w} make?`, k, [`${bag / 1000} kg = ${bag} g.`, `${bag} ${D} ${per} = ${fmt(bag / per)}. Only whole figures count: ${k}.`], d); }
  const l = R(20, 60), wd = R(15, 40);
  return ask(`A canvas is ${l} cm long and ${wd} cm wide. ${w} glues ribbon around the edge. How many cm of ribbon?`, 2 * (l + wd), [`Perimeter: ${l} + ${wd} + ${l} + ${wd}.`, `= ${2 * (l + wd)} cm.`], d, { suf: 'cm' });
};
/* Unit 11 */
const COLS = ['Blue', 'Pink', 'Green', 'Yellow', 'Purple'];
G.barGraph = d => {
  const labs = shuf(COLS).slice(0, 4), step = d === 1 ? 1 : 2, vals = labs.map(() => R(1, d === 1 ? 8 : 9) * step);
  const v = vBars(labs, vals, step * (d === 1 ? 2 : 2), 'Favorite paint color', false);
  const i = R(0, 3); let j = R(0, 3); if (j === i) j = (i + 1) % 4;
  if (d === 1) return ask(`How many students chose ${labs[i]}?`, vals[i], [`Find the ${labs[i]} bar.`, `Look across from the top of the bar to the numbers: ${vals[i]}.`], d, { visual: v });
  if (d === 2) return ask(`How many more students chose ${vals[i] >= vals[j] ? labs[i] : labs[j]} than ${vals[i] >= vals[j] ? labs[j] : labs[i]}?`, Math.abs(vals[i] - vals[j]), [`${labs[i]}: ${vals[i]}. ${labs[j]}: ${vals[j]}.`, `"How many more" means subtract: ${Math.max(vals[i], vals[j])} ${MINUS} ${Math.min(vals[i], vals[j])} = ${Math.abs(vals[i] - vals[j])}.`], d, { visual: v });
  return ask(`How many students voted in all?`, vals.reduce((a, b) => a + b), [`Add every bar: ${vals.join(' + ')}.`, `= ${vals.reduce((a, b) => a + b)}.`], d, { visual: v });
};
G.histogram = d => {
  const labs = ['0–9', '10–19', '20–29', '30–39', '40–49'], vals = labs.map(() => R(1, 8));
  const v = vBars(labs, vals, 2, 'Minutes spent drawing', true);
  const i = R(0, 4);
  if (d === 1) return ask(`How many students drew for ${labs[i]} minutes?`, vals[i], [`In a histogram each bar is a range of numbers.`, `Find the bar for ${labs[i]}. Its height is ${vals[i]}.`], d, { visual: v });
  if (d === 2) { const s = vals.slice(2).reduce((a, b) => a + b); return ask(`How many students drew for 20 minutes or more?`, s, [`20 or more means the bars 20–29, 30–39, and 40–49.`, `${vals.slice(2).join(' + ')} = ${s}.`], d, { visual: v }); }
  const tot = vals.reduce((a, b) => a + b); return ask(`How many students are shown in the histogram altogether?`, tot, [`Add the height of every bar.`, `${vals.join(' + ')} = ${tot}.`], d, { visual: v });
};
G.life11 = d => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed'], key = d === 1 ? 2 : pick([5, 10]), vals = days.map(() => R(1, 6) * key + (d === 3 && Math.random() < 0.5 ? key / 2 : 0));
  const v = vPicto(days, vals, key), i = R(0, 3);
  if (d < 3) return ask(`The pictograph shows visitors to the school art show. How many visitors came on ${days[i]}?`, vals[i], [`Each star stands for ${key} visitors.`, `Count the stars on ${days[i]} and multiply by ${key}${vals[i] % key ? ' (a half star is ' + key / 2 + ')' : ''}.`, `${days[i]} had ${vals[i]} visitors.`], d, { visual: v });
  const tot = vals.reduce((a, b) => a + b);
  return ask(`How many visitors came to the art show on all four days?`, tot, [`Find each day: ${vals.join(', ')}.`, `Add them: ${tot}.`], d, { visual: v });
};
/* Unit 12 */
G.decimals = d => {
  if (d === 1) { const w = R(1, 9), t = R(1, 9), h = R(1, 9), s = `${w}.${t}${h}`, tenth = Math.random() < 0.6, dg = tenth ? t : h, v = tenth ? t / 10 : h / 100;
    const opts = [dg, t / 10, h / 100, dg * 10, dg / 1000].map(fmt).filter((x, i, a) => x !== fmt(v) && a.indexOf(x) === i);
    return mcQ(`In ${s}, what is the value of the ${tenth ? 'first' : 'second'} digit after the decimal point (the ${dg})?`, fmt(v), opts, [`The first place after the decimal point is tenths; the second is hundredths.`, `${dg} ${tenth ? 'tenths' : 'hundredths'} = ${fmt(v)}.`]); }
  if (d === 2) { let a = R(11, 99) / 100, b = R(1, 9) / 10; if (Math.abs(a - b) < 0.001) b += 0.1; return mcQ(`Which is greater?`, fmt(Math.max(a, b)), [fmt(Math.min(a, b)), 'They are equal'], [`Write both with the same number of places: ${a.toFixed(2)} and ${b.toFixed(2)}.`, `Compare: ${Math.max(a, b).toFixed(2)} is greater.`]); }
  const n = R(11, 999) / 100, k = pick([10, 100]);
  return ask(`${n.toFixed(2)} ${X} ${k} = ?`, Math.round(n * k * 100) / 100, [`Multiplying by ${k} moves every digit ${k === 10 ? '1 place' : '2 places'} to the left.`, `${n.toFixed(2)} becomes ${fmt(n * k)}.`], d);
};
G.volume = d => {
  const l = R(2, d === 1 ? 4 : 6), w = R(2, d === 1 ? 3 : 5), h = R(2, d === 1 ? 3 : 5);
  if (d < 3) return ask(`What is the volume of this box in cubic cm?`, l * w * h, [`Volume = length ${X} width ${X} height.`, `${l} ${X} ${w} = ${l * w}, then ${l * w} ${X} ${h} = ${l * w * h} cubic cm.`], d, { visual: vBox(l, w, h), suf: 'cubic cm' });
  return ask(`A box has a volume of ${l * w * h} cubic cm. It is ${l} cm long and ${w} cm wide. How tall is it?`, h, [`Volume = length ${X} width ${X} height.`, `${l} ${X} ${w} = ${l * w}.`, `${l * w * h} ${D} ${l * w} = ${h} cm.`], d, { suf: 'cm' });
};
G.life12 = d => pick([G.life5, G.life7, G.life8, G.life10, G.volume])(d);


/* ---------- new units ---------- */
const simp = (n, d) => { const g0 = gcd(n, d); return [n / g0, d / g0]; };
const fs = (n, d) => { const [a, b] = simp(n, d); if (b === 1) return String(a); if (a > b) return Math.floor(a / b) + ' ' + (a % b) + '/' + b; return a + '/' + b; };
function vAngle(deg) {
  const cx = 150, cy = 150, L = 120, a = -deg * Math.PI / 180, x2 = cx + L * Math.cos(a), y2 = cy + L * Math.sin(a);
  let s = `<line x1="${cx}" y1="${cy}" x2="${cx + L + 20}" y2="${cy}" stroke="#2B2D5B" stroke-width="4" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#2B2D5B" stroke-width="4" stroke-linecap="round"/>`;
  if (deg === 90) s += `<path d="M${cx + 22} ${cy}V${cy - 22}H${cx}" fill="none" stroke="#D23C77" stroke-width="3"/>`;
  else { const r = 34, ex = cx + r * Math.cos(a), ey = cy + r * Math.sin(a); s += `<path d="M${cx + r} ${cy}A${r} ${r} 0 ${deg > 180 ? 1 : 0} 0 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="#D23C77" stroke-width="3"/>`; }
  return svg(420, 180, s);
}
/* Factors & multiples */
G.factors = d => {
  const n = pick([12, 16, 18, 20, 24, 30, 36, 40, 42, 48]), fac = []; for (let i = 1; i <= n; i++) if (n % i === 0) fac.push(i);
  if (d === 1) { const f = pick(fac.filter(x => x > 1 && x < n)), wr = shuf([5, 7, 9, 11, 13, 14].filter(x => n % x)).slice(0, 3); return mcQ(`Which number is a factor of ${n}?`, f, wr, [`A factor divides a number with no remainder.`, `${n} ${D} ${f} = ${n / f}, so ${f} is a factor of ${n}.`]); }
  if (d === 2) return ask(`How many factors does ${n} have?`, fac.length, [`Find factor pairs: ${fac.filter(x => x * x <= n).map(x => x + ' ' + X + ' ' + n / x).join(', ')}.`, `The factors are ${fac.join(', ')}. That is ${fac.length} factors.`], d);
  const p = pick([[13, 'prime'], [17, 'prime'], [19, 'prime'], [23, 'prime'], [29, 'prime'], [15, 'composite'], [21, 'composite'], [27, 'composite'], [33, 'composite'], [39, 'composite']]);
  const fx = []; for (let i = 1; i <= p[0]; i++) if (p[0] % i === 0) fx.push(i);
  return mcQ(`Is ${p[0]} prime or composite?`, p[1], [p[1] === 'prime' ? 'composite' : 'prime', 'neither'], [`Prime numbers have exactly 2 factors: 1 and themselves.`, `${p[0]} has factors ${fx.join(', ')}, so it is ${p[1]}.`]);
};
G.multiples = d => {
  const a = R(3, 9);
  if (d === 1) { const k = R(3, 8); return ask(`What is the ${['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'][k]} multiple of ${a}? (Count by ${a}s.)`, a * k, [`Multiples are what you say when you count by ${a}s: ${Array.from({ length: k }, (_, i) => a * (i + 1)).join(', ')}.`, `The answer is ${a} ${X} ${k} = ${a * k}.`], d); }
  if (d === 2) { const m = a * R(3, 9); return mcQ(`Which number is a multiple of ${a}?`, m, [m + 1, m - 1, m + 2].filter(x => x % a), [`A multiple of ${a} divides by ${a} with nothing left over.`, `${m} ${D} ${a} = ${m / a}, so ${m} is a multiple of ${a}.`]); }
  const p = pick([[4, 6], [3, 4], [6, 8], [4, 10], [6, 9], [2, 5], [3, 5], [8, 12]]), l = p[0] * p[1] / gcd(p[0], p[1]);
  return ask(`What is the least common multiple of ${p[0]} and ${p[1]}?`, l, [`Multiples of ${p[0]}: ${Array.from({ length: l / p[0] + 1 }, (_, i) => p[0] * (i + 1)).join(', ')}.`, `Multiples of ${p[1]}: ${Array.from({ length: l / p[1] + 1 }, (_, i) => p[1] * (i + 1)).join(', ')}.`, `The smallest one in both lists is ${l}.`], d);
};
G.life5b = d => {
  const w = nm();
  if (d < 3) { const n = pick([12, 18, 20, 24, 30, 36]), fac = []; for (let i = 2; i < n; i++) if (n % i === 0) fac.push(i); const f = pick(fac); return mcQ(`${w} hangs ${n} drawings in equal rows with none left over. How many could go in each row?`, f, shuf([5, 7, 11, 13].filter(x => n % x)).slice(0, 3), [`Equal rows with none left over means a factor of ${n}.`, `${n} ${D} ${f} = ${n / f} rows, so ${f} works.`]); }
  const p = pick([[6, 8], [4, 6], [8, 12], [6, 10]]), l = p[0] * p[1] / gcd(p[0], p[1]);
  return ask(`Markers come in packs of ${p[0]}. Pencils come in packs of ${p[1]}. ${w} wants the same number of markers and pencils. What is the smallest number of each she can buy?`, l, [`She needs a number that is a multiple of ${p[0]} AND of ${p[1]}.`, `The least common multiple of ${p[0]} and ${p[1]} is ${l}.`], d);
};
/* Place value & rounding */
const PV = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands'];
G.placeValue = d => {
  if (d === 1) { const n = R(1000, 9999), s0 = String(n), i = R(0, 3), dg = +s0[i]; if (!dg) return G.placeValue(d); const v = dg * Math.pow(10, 3 - i); return mcQ(`In ${n.toLocaleString()}, what is the value of the digit ${dg} in the ${PV[3 - i]} place?`, v.toLocaleString(), [dg, dg * 10 === v ? dg * 100 : dg * 10, dg * 1000 === v ? dg * 100 : dg * 1000].map(x => x.toLocaleString()), [`The ${PV[3 - i]} place is worth ${Math.pow(10, 3 - i).toLocaleString()}.`, `${dg} ${X} ${Math.pow(10, 3 - i).toLocaleString()} = ${v.toLocaleString()}.`]); }
  if (d === 2) { const th = R(1, 9), h = R(0, 9), t = R(0, 9), o = R(1, 9), skip = R(0, 2), parts = [[th, 'thousands', 1000], [h, 'hundreds', 100], [t, 'tens', 10], [o, 'ones', 1]].filter((p, i) => i !== skip + 1 || true); const n = th * 1000 + h * 100 + t * 10 + o; return ask(`Write the number: ${parts.filter(p => p[0]).map(p => p[0] + ' ' + p[1]).join(' + ')}`, n, [`Put each digit in its place. Use 0 for an empty place.`, `${n.toLocaleString()}`], d); }
  const n = R(10, 999) * 10; return ask(`10 ${X} ${n.toLocaleString()} = ?`, n * 10, [`Multiplying by 10 moves every digit one place to the left.`, `Add a zero: ${(n * 10).toLocaleString()}.`], d);
};
G.rounding = d => {
  const to = [10, 100, 1000][d - 1], n = d === 1 ? R(11, 99) + 100 * R(0, 9) : d === 2 ? R(101, 9999) : R(1001, 99999);
  const r = Math.round(n / to) * to, lo = Math.floor(n / to) * to, hi = lo + to, look = Math.floor(n / (to / 10)) % 10;
  if (n % to === 0 || n % to === to / 2) return G.rounding(d);
  return numMC(`Round ${n.toLocaleString()} to the nearest ${to.toLocaleString()}.`, r, x => x.toLocaleString(), [`${n.toLocaleString()} is between ${lo.toLocaleString()} and ${hi.toLocaleString()}.`, `Look at the digit to the right of the ${to === 10 ? 'tens' : to === 100 ? 'hundreds' : 'thousands'} place: ${look}.`, `${look} is ${look >= 5 ? '5 or more, so round up' : 'less than 5, so round down'}: ${r.toLocaleString()}.`], [r === lo ? hi : lo, n, r + to]);
};
G.life6b = d => {
  const w = nm();
  if (d < 3) { const n = R(1101, 9899); if (n % 100 === 50) return G.life6b(d); const r = Math.round(n / 100) * 100; return numMC(`The school art show had ${n.toLocaleString()} visitors this year. About how many is that, rounded to the nearest hundred?`, r, x => x.toLocaleString(), [`Look at the tens digit: ${Math.floor(n / 10) % 10}.`, `${Math.floor(n / 10) % 10 >= 5 ? 'Round up' : 'Round down'}: ${r.toLocaleString()}.`], [r + 100, r - 100, Math.round(n / 1000) * 1000]); }
  const a = R(21, 89) * 10 + R(1, 9), b = R(21, 89) * 10 + R(1, 9), ra = Math.round(a / 100) * 100, rb = Math.round(b / 100) * 100;
  return numMC(`${w} sold ${a} cards on Monday and ${b} on Tuesday. Round each to the nearest hundred to ESTIMATE the total.`, ra + rb, x => x.toLocaleString(), [`${a} rounds to ${ra}. ${b} rounds to ${rb}.`, `${ra} + ${rb} = ${ra + rb}.`], [a + b, ra + rb + 100, ra + rb - 100]);
};
/* Adding & subtracting big numbers */
G.addBig = d => {
  const lim = [[25, 99], [125, 999], [1250, 9999]][d - 1], a = R(lim[0], lim[1]), b = R(lim[0], lim[1]);
  return ask(`${a.toLocaleString()} + ${b.toLocaleString()} = ?`, a + b, [`Line up the numbers by place value.`, `Add the ones first. If you get 10 or more, carry 1 ten to the tens column.`, `Keep going left, place by place: ${(a + b).toLocaleString()}.`], d);
};
G.subBig = d => {
  const lim = [[40, 99], [300, 999], [3000, 9999]][d - 1], a = R(lim[0], lim[1]), b = R(Math.floor(lim[0] / 3), a - 5);
  return ask(`${a.toLocaleString()} ${MINUS} ${b.toLocaleString()} = ?`, a - b, [`Line up the numbers by place value.`, `Start with the ones. If the top digit is smaller, borrow 1 from the next place (it becomes 10 more).`, `Work left, place by place: ${(a - b).toLocaleString()}.`, `Check: ${(a - b).toLocaleString()} + ${b.toLocaleString()} = ${a.toLocaleString()}.`], d);
};
G.life7b = d => {
  const w = nm(), a = R(d === 1 ? 120 : 1200, d === 1 ? 600 : 5000), b = R(80, Math.floor(a * 0.7));
  if (d < 3) return ask(`${w} had ${a.toLocaleString()} beads. She used ${b.toLocaleString()} for a necklace project. How many beads are left?`, a - b, [`"Left" means subtract.`, `${a.toLocaleString()} ${MINUS} ${b.toLocaleString()} = ${(a - b).toLocaleString()}.`], d);
  const c = R(100, 900);
  return ask(`${w} had ${a.toLocaleString()} beads. She bought ${c} more, then used ${b.toLocaleString()}. How many does she have now?`, a + c - b, [`First add: ${a.toLocaleString()} + ${c} = ${(a + c).toLocaleString()}.`, `Then subtract: ${(a + c).toLocaleString()} ${MINUS} ${b.toLocaleString()} = ${(a + c - b).toLocaleString()}.`], d);
};
/* Patterns & expressions */
G.orderOps = d => {
  const a = R(2, 9), b = R(2, 9), c = R(2, 6);
  if (d === 1) return ask(`${a} + ${b} ${X} ${c} = ?`, a + b * c, [`Multiply before you add.`, `${b} ${X} ${c} = ${b * c}.`, `${a} + ${b * c} = ${a + b * c}.`], d, { wr: [(a + b) * c] });
  if (d === 2) return ask(`(${a} + ${b}) ${X} ${c} = ?`, (a + b) * c, [`Parentheses first: ${a} + ${b} = ${a + b}.`, `Then multiply: ${a + b} ${X} ${c} = ${(a + b) * c}.`], d, { wr: [a + b * c] });
  const e = R(1, b - 1 || 1), f = R(2, 9);
  return ask(`${c} ${X} (${b + e} ${MINUS} ${e}) + ${f} = ?`, c * b + f, [`Parentheses first: ${b + e} ${MINUS} ${e} = ${b}.`, `Then multiply: ${c} ${X} ${b} = ${c * b}.`, `Then add: ${c * b} + ${f} = ${c * b + f}.`], d);
};
G.patterns = d => {
  if (d === 1) { const s = R(1, 9), st = R(2, 9), seq = [0, 1, 2, 3].map(i => s + st * i); return ask(`What comes next? ${seq.join(', ')}, __`, s + st * 4, [`Find the rule: each number goes up by ${st}.`, `${seq[3]} + ${st} = ${s + st * 4}.`], d); }
  if (d === 2) { const m = R(2, 9), add = R(0, 5), x = R(3, 9); const rule = add ? `multiply by ${m}, then add ${add}` : `multiply by ${m}`; return ask(`The rule is: ${rule}. If the input is ${x}, what is the output?`, x * m + add, [`${x} ${X} ${m} = ${x * m}.`, add ? `${x * m} + ${add} = ${x * m + add}.` : `The output is ${x * m}.`], d); }
  const a = R(2, 9), b = R(2, 5);
  return mcQ(`Which expression means "add ${a} and 4, then multiply by ${b}"?`, `(${a} + 4) ${X} ${b}`, [`${a} + 4 ${X} ${b}`, `${a} ${X} 4 + ${b}`, `${b} + (${a} ${X} 4)`], [`"Then" tells you the order. The adding happens first, so it goes in parentheses.`, `(${a} + 4) ${X} ${b}.`]);
};
G.life11b = d => {
  const w = nm(), p = R(3, 9), sh = R(2, 6), n = R(3, 8);
  if (d === 1) return mcQ(`Each picture frame costs $${p}. Shipping is $${sh} for the whole order. Which expression shows the cost of ${n} frames?`, `${n} ${X} ${p} + ${sh}`, [`${n} + ${p} ${X} ${sh}`, `(${n} + ${sh}) ${X} ${p}`, `${n} ${X} ${sh} + ${p}`], [`Multiply the number of frames by the price: ${n} ${X} ${p}.`, `Then add shipping once: + ${sh}.`]);
  return ask(`Each picture frame costs $${p}. Shipping is $${sh} for the whole order. How much do ${n} frames cost with shipping?`, n * p + sh, [`${n} ${X} $${p} = $${n * p}.`, `$${n * p} + $${sh} = $${n * p + sh}.`], d, { pre: '$', f: x => '$' + x });
};
/* Mixed numbers & unlike denominators */
G.mixed = d => {
  const den = pick([2, 3, 4, 5, 6, 8]), w = R(1, 3), num = R(1, den - 1), imp = w * den + num;
  if (d === 1) return mcQ(`Write ${imp}/${den} as a mixed number.`, `${w} ${num}/${den}`, [`${w + 1} ${num}/${den}`, `${w} ${den}/${num}`, `${num} ${w}/${den}`], [`How many wholes? ${imp} ${D} ${den} = ${w} with ${num} left over.`, `${w} wholes and ${num}/${den}: ${w} ${num}/${den}.`]);
  if (d === 2) return mcQ(`Write ${w} ${num}/${den} as an improper fraction.`, `${imp}/${den}`, [`${w * num + den}/${den}`, `${w + num}/${den}`, `${imp}/${den * w}`], [`Each whole is ${den}/${den}. ${w} wholes = ${w * den}/${den}.`, `Add the ${num}/${den}: ${w * den} + ${num} = ${imp}. Answer: ${imp}/${den}.`]);
  const w2 = R(1, 3), n2 = R(1, den - 1); const tot = imp + w2 * den + n2;
  return mcQ(`${w} ${num}/${den} + ${w2} ${n2}/${den} = ?`, fs(tot, den), [fs(tot + den, den), `${w + w2} ${num + n2}/${den + den}`, fs(tot - 1, den)].filter(x => x !== fs(tot, den)), [`Add the wholes: ${w} + ${w2} = ${w + w2}.`, `Add the fractions: ${num}/${den} + ${n2}/${den} = ${num + n2}/${den}.`, num + n2 >= den ? `${num + n2}/${den} is more than 1 whole, so carry 1. Answer: ${fs(tot, den)}.` : `Answer: ${fs(tot, den)}.`]);
};
G.unlike = d => {
  const pr = d === 1 ? pick([[2, 4], [2, 6], [3, 6], [2, 8], [4, 8]]) : pick([[2, 3], [3, 4], [2, 5], [4, 6], [3, 5], [5, 10], [3, 9]]);
  const [d1, d2] = pr, a = R(1, d1 - 1), b = R(1, d2 - 1), L = d1 * d2 / gcd(d1, d2), A1 = a * L / d1, B1 = b * L / d2;
  const sub = d === 3 && a / d1 !== b / d2;
  let n = sub ? Math.abs(A1 - B1) : A1 + B1; const big = sub && a / d1 < b / d2;
  const p = sub ? (big ? `${b}/${d2} ${MINUS} ${a}/${d1}` : `${a}/${d1} ${MINUS} ${b}/${d2}`) : `${a}/${d1} + ${b}/${d2}`;
  const right = fs(n, L);
  return mcQ(`${p} = ?`, right, [`${sub ? Math.abs(a - b) : a + b}/${sub ? Math.abs(d1 - d2) || d1 : d1 + d2}`, fs(n + 1, L), fs(sub ? A1 + B1 : Math.abs(A1 - B1) || n + 2, L)].filter(x => x !== right), [`The bottoms are different, so make them the same. Use ${L}ths.`, `${a}/${d1} = ${A1}/${L} and ${b}/${d2} = ${B1}/${L}.`, `${sub ? 'Subtract' : 'Add'} the tops: ${n}/${L}${fs(n, L) !== n + '/' + L ? ' = ' + right : ''}.`]);
};
G.life13 = d => {
  const w = nm();
  if (d < 3) { const pr = pick([[2, 4], [3, 6], [2, 3], [4, 8], [2, 5]]), L = pr[0] * pr[1] / gcd(pr[0], pr[1]), n = L / pr[0] + L / pr[1]; return mcQ(`${w} uses 1/${pr[0]} yard of ribbon for one card and 1/${pr[1]} yard for another. How much ribbon in all?`, fs(n, L) + ' yard', [`2/${pr[0] + pr[1]} yard`, fs(n + 1, L) + ' yard', `1/${pr[0] * pr[1] / gcd(pr[0], pr[1]) + 1} yard`], [`Make the bottoms the same: ${L}ths.`, `1/${pr[0]} = ${L / pr[0]}/${L}, 1/${pr[1]} = ${L / pr[1]}/${L}.`, `Add: ${n}/${L}${fs(n, L) !== n + '/' + L ? ' = ' + fs(n, L) : ''} yard.`]); }
  const den = pick([4, 8]), w1 = R(2, 4), n1 = R(1, den - 1), w2 = 1, n2 = R(1, den - 1), t = (w1 * den + n1) - (w2 * den + n2);
  return mcQ(`${w} has ${w1} ${n1}/${den} cups of paint and uses ${w2} ${n2}/${den} cups. How much is left?`, fs(t, den) + ' cups', [fs(t + den, den) + ' cups', fs(t + 1, den) + ' cups', fs(Math.max(1, t - 1), den) + ' cups'].filter(x => x !== fs(t, den) + ' cups'), [`Change both to ${den}ths: ${w1 * den + n1}/${den} ${MINUS} ${w2 * den + n2}/${den}.`, `${w1 * den + n1} ${MINUS} ${w2 * den + n2} = ${t}. That is ${fs(t, den)} cups.`]);
};
/* Multiplying fractions */
G.fracWhole = d => {
  const den = pick([3, 4, 5, 6, 8]), num = R(1, den - 1), n = R(2, d === 1 ? 4 : 6);
  if (d < 3) { const r = fs(n * num, den); return mcQ(`${n} ${X} ${num}/${den} = ?`, r, [`${n * num}/${n * den}`, fs(n + num, den), `${num}/${n * den}`].filter(x => x !== r), [`${n} ${X} ${num}/${den} means ${n} groups of ${num}/${den}.`, `Multiply the top: ${n} ${X} ${num} = ${n * num}. Keep the bottom: ${n * num}/${den}.`, `${n * num}/${den} = ${r}.`]); }
  const a = R(1, 3), b = pick([2, 3, 4]), c = R(1, 4), e = pick([3, 4, 5, 6]); if (a >= b || c >= e) return G.fracWhole(d);
  const r = fs(a * c, b * e); return mcQ(`${a}/${b} ${X} ${c}/${e} = ?`, r, [`${a + c}/${b + e}`, `${a * c}/${b + e}`, fs(a * e, b * c)].filter(x => x !== r), [`Multiply the tops: ${a} ${X} ${c} = ${a * c}.`, `Multiply the bottoms: ${b} ${X} ${e} = ${b * e}.`, `${a * c}/${b * e}${fs(a * c, b * e) !== a * c + '/' + b * e ? ' = ' + r : ''}.`]);
};
G.scaling = d => {
  if (d === 1) { const n = R(4, 12), den = pick([3, 4, 5]), num = R(1, den - 1); return mcQ(`Is ${n} ${X} ${num}/${den} more or less than ${n}?`, `Less than ${n}`, [`More than ${n}`, `Equal to ${n}`], [`${num}/${den} is less than 1 whole.`, `Multiplying by a fraction less than 1 makes the number smaller.`]); }
  const den = pick([2, 3, 4, 5]), num = R(1, den - 1), k = R(2, 8), t = den * k;
  return ask(`${num}/${den} ${X} ${t} = ?`, num * k, [`${num}/${den} of ${t}: first divide by ${den}: ${t} ${D} ${den} = ${k}.`, `Then multiply by ${num}: ${num} ${X} ${k} = ${num * k}.`], d);
};
G.life14 = d => {
  const w = nm(), den = pick([2, 3, 4]), num = R(1, den - 1), n = R(2, 6), r = fs(n * num, den);
  if (d < 3) return mcQ(`One batch of play dough uses ${num}/${den} cup of salt. ${w} makes ${n} batches. How much salt does she need?`, r + ' cups', [`${n * num}/${n * den} cups`, fs(n + num, den) + ' cups', `${num}/${n * den} cups`].filter(x => x !== r + ' cups'), [`${n} ${X} ${num}/${den} = ${n * num}/${den}.`, `${n * num}/${den} = ${r} cups.`]);
  const a = 1, b = pick([2, 3, 4]), c = R(1, 3), e = pick([4, 5]), r2 = fs(a * c, b * e);
  return mcQ(`A poster is ${a}/${b} meter wide and ${c}/${e} meter tall. What is its area?`, r2 + ' square meter', [`${a + c}/${b + e} square meter`, `${a * c}/${b + e} square meter`, fs(a * e + c * b, b * e) + ' square meter'].filter(x => x !== r2 + ' square meter'), [`Area = width ${X} height.`, `Multiply tops: ${a} ${X} ${c} = ${a * c}. Multiply bottoms: ${b} ${X} ${e} = ${b * e}.`, `${r2} square meter.`]);
};
/* Angles & shapes */
G.angles = d => {
  if (d === 1) { const t = pick(['acute', 'right', 'obtuse']), deg = t === 'acute' ? R(25, 70) : t === 'right' ? 90 : R(110, 160); return mcQ(`What kind of angle is this?`, t, ['acute', 'right', 'obtuse', 'straight'].filter(x => x !== t), [`Acute: smaller than a square corner. Right: exactly a square corner (90°). Obtuse: wider than a square corner.`, `This one is ${t}.`], { visual: vAngle(deg) }); }
  if (d === 2) { const deg = pick([R(10, 85), 90, R(95, 175), 180]), t = deg < 90 ? 'acute' : deg === 90 ? 'right' : deg < 180 ? 'obtuse' : 'straight'; return mcQ(`An angle measures ${deg}°. What kind of angle is it?`, t, ['acute', 'right', 'obtuse', 'straight'].filter(x => x !== t), [`Less than 90° is acute, exactly 90° is right, between 90° and 180° is obtuse, 180° is straight.`, `${deg}° is ${t}.`]); }
  const a = R(15, 75); return ask(`Two angles together make a right angle (90°). One is ${a}°. What is the other?`, 90 - a, [`A right angle is 90°.`, `90 ${MINUS} ${a} = ${90 - a}°.`], d, { suf: '°' });
};
G.shapes = d => {
  if (d === 1) { const q = pick([['Which shape has 4 equal sides and 4 right angles?', 'square', ['rectangle', 'triangle', 'trapezoid']], ['Which shape has exactly 3 sides?', 'triangle', ['square', 'pentagon', 'hexagon']], ['How many sides does a hexagon have?', '6', ['5', '8', '4']], ['How many sides does a pentagon have?', '5', ['6', '4', '8']], ['Which shape has 4 right angles but not always 4 equal sides?', 'rectangle', ['square', 'triangle', 'rhombus']]]); return mcQ(q[0], q[1], q[2], [`Count the sides and look at the corners.`, `The answer is ${q[1]}.`]); }
  if (d === 2) { const t = pick(['equilateral', 'isosceles', 'scalene']), s = t === 'equilateral' ? [5, 5, 5] : t === 'isosceles' ? [6, 6, 4] : [3, 5, 7]; const m = R(1, 3); return mcQ(`A triangle has sides ${s.map(x => x * m).join(' cm, ')} cm. What kind of triangle is it?`, t, ['equilateral', 'isosceles', 'scalene'].filter(x => x !== t), [`Equilateral: all 3 sides equal. Isosceles: 2 sides equal. Scalene: no sides equal.`, `This one is ${t}.`]); }
  const a = R(30, 80), b = R(30, 150 - a); return ask(`The angles inside every triangle add up to 180°. A triangle has angles of ${a}° and ${b}°. What is the third angle?`, 180 - a - b, [`${a} + ${b} = ${a + b}.`, `180 ${MINUS} ${a + b} = ${180 - a - b}°.`], d, { suf: '°' });
};
G.life16 = d => {
  const w = nm();
  if (d < 3) { const s = R(3, 12), n = pick([[3, 'triangle (all sides equal)'], [4, 'square'], [5, 'pentagon (all sides equal)'], [6, 'hexagon (all sides equal)']]); return ask(`${w} cuts a ${n[1]} out of paper. Each side is ${s} cm. What is the perimeter?`, n[0] * s, [`A ${n[1].split(' ')[0]} has ${n[0]} sides.`, `${n[0]} ${X} ${s} = ${n[0] * s} cm.`], d, { suf: 'cm' }); }
  const a = pick([30, 45, 60]); return ask(`${w} folds a square corner (90°) of paper so one part is ${a}°. How many degrees is the other part?`, 90 - a, [`The whole corner is 90°.`, `90 ${MINUS} ${a} = ${90 - a}°.`], d, { suf: '°' });
};
/* Time */
const tstr = m => { m = ((m % 720) + 720) % 720; const h = Math.floor(m / 60) || 12; return h + ':' + String(m % 60).padStart(2, '0'); };
G.timeConv = d => {
  if (d === 1) { const h = R(2, 6); return ask(`How many minutes are in ${h} hours?`, h * 60, [`1 hour = 60 minutes.`, `${h} ${X} 60 = ${h * 60} minutes.`], d, { suf: 'min' }); }
  if (d === 2) { const h = R(1, 3), m = R(1, 5) * 10; return ask(`How many minutes is ${h} hour${h > 1 ? 's' : ''} and ${m} minutes?`, h * 60 + m, [`${h} ${X} 60 = ${h * 60} minutes.`, `${h * 60} + ${m} = ${h * 60 + m} minutes.`], d, { suf: 'min' }); }
  const m = R(7, 17) * 10; return mcQ(`${m} minutes is the same as…`, `${Math.floor(m / 60)} hr ${m % 60} min`, [`${Math.floor(m / 60) + 1} hr ${m % 60} min`, `${Math.floor(m / 100)} hr ${m % 100} min`, `${m % 60} hr ${Math.floor(m / 60)} min`].filter(x => x !== `${Math.floor(m / 60)} hr ${m % 60} min`), [`Take out groups of 60 minutes: ${m} ${D} 60 = ${Math.floor(m / 60)} with ${m % 60} left.`, `${Math.floor(m / 60)} hr ${m % 60} min.`]);
};
G.elapsed = d => {
  const st = R(13, 66) * 5 + 60, add = d === 1 ? pick([15, 30, 45]) : d === 2 ? R(5, 20) * 5 : R(13, 30) * 5;
  if (d < 3) return mcQ(`What time is it ${add} minutes after ${tstr(st)}?`, tstr(st + add), [tstr(st + add + 10), tstr(st + add - 10), tstr(st + add + 60)], [`Start at ${tstr(st)}.`, `Count forward ${add} minutes. Passing :60 starts a new hour.`, `It is ${tstr(st + add)}.`]);
  const h = Math.floor(add / 60), m = add % 60, ans = `${h} hr ${m} min`;
  return mcQ(`How much time passes from ${tstr(st)} to ${tstr(st + add)}?`, ans, [`${h + 1} hr ${m} min`, `${h} hr ${(m + 10) % 60} min`, `${h} hr ${Math.abs(m - 15)} min`].filter(x => x !== ans), [`Count whole hours first: ${tstr(st)} to ${tstr(st + h * 60)} is ${h} hour${h === 1 ? '' : 's'}.`, `Then minutes: ${tstr(st + h * 60)} to ${tstr(st + add)} is ${m} minutes.`, `Total: ${ans}.`]);
};
G.life18 = d => {
  const st = R(16, 26) * 5 * 6 / 6 + 480, len = d === 1 ? pick([30, 45, 60]) : R(7, 18) * 5;
  if (d < 3) return mcQ(`Art class starts at ${tstr(st)} and lasts ${len} minutes. What time does it end?`, tstr(st + len), [tstr(st + len + 15), tstr(st + len - 10), tstr(st + 60)].filter(x => x !== tstr(st + len)), [`Start at ${tstr(st)} and count forward ${len} minutes.`, `It ends at ${tstr(st + len)}.`]);
  const p = R(3, 6), t = R(8, 15); return ask(`${nm()} paints for ${t} minutes a day for ${p * 2} days. How many minutes is that? (Then think: is it more than 2 hours?)`, t * p * 2, [`${p * 2} ${X} ${t} = ${t * p * 2} minutes.`, `2 hours = 120 minutes, so it is ${t * p * 2 > 120 ? 'more' : 'not more'} than 2 hours.`], d, { suf: 'min' });
};

/* ---------- curriculum ---------- */
const UNITS = [
  { t: 'Equal Groups', sub: 'What multiplication really means', color: '#3A5BD9', facts: { set: [2, 5, 10] }, factLabel: 'Facts: ×2, ×5, ×10',
    goals: ['Explain multiplication as equal groups', 'Write a multiplication sentence for a picture', 'Know ×2, ×5 and ×10 facts quickly'], ixl: 'V98',
    a: [['learn', 'eqGroups', 'Learn: Equal groups', 'See groups and write multiplication sentences'], ['learn', 'repAdd', 'Learn: Repeated addition & skip counting', 'Connect adding the same number to multiplying'], ['life', 'life1', 'Studio supplies', 'Packs of art supplies: how many in all?']] },
  { t: 'Arrays & Area', sub: 'Rows, columns and covering space', color: '#D23C77', facts: { set: [3, 4] }, factLabel: 'Facts: ×3, ×4',
    goals: ['Use arrays to multiply', 'Know that 3 × 7 = 7 × 3', 'Find the area of a rectangle'],
    a: [['learn', 'arrays', 'Learn: Arrays', 'Rows × columns, and turning arrays around'], ['learn', 'area', 'Learn: Area', 'Count squares, then multiply length × width'], ['life', 'life2', 'Mosaic tiles', 'Plan the tiles for a mosaic']] },
  { t: 'Sharing & Dividing', sub: 'Division is multiplication backwards', color: '#2FA572', facts: { set: [2, 3, 4, 5, 10], div: true }, factLabel: 'Facts: ÷2, ÷3, ÷4, ÷5, ÷10',
    goals: ['Divide by sharing and by grouping', 'Use fact families', 'Find a missing factor'],
    a: [['learn', 'share', 'Learn: Sharing equally', 'Split things into equal groups'], ['learn', 'family', 'Learn: Fact families', 'Missing numbers and related facts'], ['life', 'life3', 'Sharing supplies', 'Share art supplies fairly']] },
  { t: 'Bigger Facts', sub: '×6 to ×9 and multiplying by tens', color: '#F07A2E', facts: { set: [6, 7, 8, 9] }, factLabel: 'Facts: ×6, ×7, ×8, ×9',
    goals: ['Know ×6 to ×9 facts', 'Break apart a hard fact into easy ones', 'Multiply by 10s and 100s'],
    a: [['learn', 'breakApart', 'Learn: Break apart', 'Turn a hard fact into two easy ones'], ['learn', 'tens', 'Learn: Tens and hundreds', '3 × 40, 6 × 700 and other zero patterns'], ['life', 'life4', 'Bead bracelets', 'Count beads for bracelets and necklaces']] },
  { t: 'Factors & Multiples', sub: 'Numbers that divide and numbers you count to', color: '#2FA572', facts: { set: [6, 7, 8, 9], div: true }, factLabel: 'Facts: ÷6, ÷7, ÷8, ÷9',
    goals: ['Find factors of a number', 'Find multiples and common multiples', 'Tell prime from composite'],
    a: [['learn', 'factors', 'Learn: Factors & primes', 'Numbers that divide evenly'], ['learn', 'multiples', 'Learn: Multiples', 'Counting by a number, and common multiples'], ['life', 'life5b', 'Hanging the art show', 'Equal rows and matching packs']] },
  { t: 'Place Value & Rounding', sub: 'What each digit is worth', color: '#7A4FD1', facts: { set: [3, 4, 6, 7, 8, 9] }, factLabel: 'Facts review: mixed ×',
    goals: ['Read the value of a digit', 'Write numbers from place values', 'Round to the nearest 10, 100 and 1,000'],
    a: [['learn', 'placeValue', 'Learn: Place value', 'Ones, tens, hundreds, thousands'], ['learn', 'rounding', 'Learn: Rounding', 'Nearest 10, 100 and 1,000'], ['life', 'life6b', 'Estimating crowds', 'Round to estimate real numbers']] },
  { t: 'Adding & Subtracting', sub: 'Big numbers, carrying and borrowing', color: '#F07A2E', facts: { set: [3, 4, 6, 7, 8, 9], div: true }, factLabel: 'Facts review: mixed ÷',
    goals: ['Add 2-, 3- and 4-digit numbers', 'Subtract with borrowing', 'Check subtraction with addition'],
    a: [['learn', 'addBig', 'Learn: Adding big numbers', 'Line up places and carry'], ['learn', 'subBig', 'Learn: Subtracting big numbers', 'Borrow and check'], ['life', 'life7b', 'Bead inventory', 'Keep track of supplies']] },
  { t: 'Money & Unit Price', sub: 'Shopping at the art store', color: '#F2B533', facts: { set: [6, 7, 8, 9], div: true }, factLabel: 'Facts: ÷6, ÷7, ÷8, ÷9',
    goals: ['Add and subtract money', 'Find the price of one item (unit price)', 'Pick the better buy'], ixl: 'UKD',
    a: [['learn', 'moneyAdd', 'Learn: Adding money & change', 'Line up the decimal points'], ['learn', 'unitPrice', 'Learn: Unit price', 'Total ÷ number of items'], ['life', 'life5', 'Art store trip', 'Total cost and change at the store']] },
  { t: 'Big Multiplying', sub: 'Multi-digit multiplication', color: '#7A4FD1', facts: { set: [3, 4, 6, 7, 8, 9] }, factLabel: 'Facts review: mixed ×',
    goals: ['Multiply 2-, 3- and 4-digit numbers by 1 digit', 'Multiply 2-digit by 2-digit numbers', 'Use the area model'],
    a: [['learn', 'mult1', 'Learn: Big × small', 'Break numbers into place values'], ['learn', 'mult2', 'Learn: Two-digit × two-digit', 'Break the second number into tens and ones'], ['life', 'life6', 'Supply order', 'Order supplies for the whole school']] },
  { t: 'Long Division', sub: 'Long division and leftovers', color: '#3A5BD9', facts: { set: [3, 4, 6, 7, 8, 9], div: true }, factLabel: 'Facts review: mixed ÷',
    goals: ['Divide with remainders', 'Divide 2-, 3- and 4-digit numbers', 'Decide what to do with a remainder'],
    a: [['learn', 'remainder', 'Learn: Remainders', 'What is left over after sharing'], ['learn', 'longDiv', 'Learn: Long division', 'Divide one place at a time'], ['life', 'life7', 'Packing & vans', 'Does the remainder need its own box?']] },
  { t: 'Patterns & Expressions', sub: 'Rules, order of operations and parentheses', color: '#3A5BD9', facts: { set: [2, 3, 4, 5, 6, 7, 8, 9] }, factLabel: 'Facts review: all ×',
    goals: ['Use the order of operations', 'Follow a number rule', 'Write an expression with parentheses'],
    a: [['learn', 'orderOps', 'Learn: Order of operations', 'Parentheses, then ×, then +'], ['learn', 'patterns', 'Learn: Patterns & rules', 'What comes next, input and output'], ['life', 'life11b', 'Ordering frames', 'Write and solve a cost expression']] },
  { t: 'Fractions', sub: 'Parts of a whole', color: '#D23C77', facts: { set: [2, 3, 4, 5, 6, 7, 8, 9] }, factLabel: 'Facts review: all ×',
    goals: ['Name fractions from a picture', 'Find equal fractions', 'Compare and add fractions', 'Find a fraction of a number'],
    a: [['learn', 'fracName', 'Learn: Naming & equal fractions', 'Top number, bottom number, equal fractions'], ['learn', 'fracOps', 'Learn: Compare, add & fraction of', 'Same-size pieces and fractions of a group'], ['life', 'life8', 'Paint mixing', 'Mix paint and share paper']] },
  { t: 'Mixed Numbers', sub: 'Mixed numbers and unlike denominators', color: '#D23C77', facts: { set: [2, 3, 4, 5, 6, 7, 8, 9], div: true }, factLabel: 'Facts review: all ÷',
    goals: ['Change between mixed numbers and improper fractions', 'Add mixed numbers', 'Add and subtract fractions with different bottoms'],
    a: [['learn', 'mixed', 'Learn: Mixed numbers', 'Wholes and parts together'], ['learn', 'unlike', 'Learn: Different denominators', 'Make the bottoms match'], ['life', 'life13', 'Ribbon & paint', 'Real measurements with fractions']] },
  { t: 'Multiplying Fractions', sub: 'Groups of fractions and fractions of fractions', color: '#F2B533', facts: { set: [6, 7, 8, 9] }, factLabel: 'Facts review: ×6 to ×9',
    goals: ['Multiply a whole number by a fraction', 'Multiply two fractions', 'Know when an answer gets smaller'],
    a: [['learn', 'fracWhole', 'Learn: Fraction × number', 'Tops multiply, bottoms stay or multiply'], ['learn', 'scaling', 'Learn: Fraction of a number', 'Smaller or bigger?'], ['life', 'life14', 'Play dough recipe', 'Batches and poster area']] },
  { t: 'Lines & the Grid', sub: 'Geometry and the coordinate plane', color: '#2FA572', facts: { set: [2, 3, 4, 5, 6, 7, 8, 9], div: true }, factLabel: 'Facts review: all ÷',
    goals: ['Tell points, lines, segments and rays apart', 'Read and plot points (x, y)', 'Find perimeter'], ixl: 'DFS, PF8',
    a: [['learn', 'lineTypes', 'Learn: Points, lines, segments & rays', 'Endpoints and arrows'], ['learn', 'coord', 'Learn: The coordinate plane', 'Across first, then up'], ['life', 'life9', 'Drawing on a grid', 'Plan a drawing on grid paper']] },
  { t: 'Angles & Shapes', sub: 'Acute, right, obtuse and polygons', color: '#7A4FD1', facts: { set: [2, 3, 4, 5, 6, 7, 8, 9] }, factLabel: 'Facts review: all ×',
    goals: ['Name acute, right and obtuse angles', 'Classify triangles and polygons', 'Find a missing angle'],
    a: [['learn', 'angles', 'Learn: Angles', 'Smaller, equal to, or wider than a square corner'], ['learn', 'shapes', 'Learn: Shapes & triangles', 'Sides, corners and 180°'], ['life', 'life16', 'Paper cutting', 'Perimeter and folded corners']] },
  { t: 'Measuring', sub: 'Metric mass, length and capacity', color: '#F07A2E', facts: { set: [6, 7, 8, 9] }, factLabel: 'Facts review: ×6 to ×9',
    goals: ['Choose the right metric unit', 'Convert kg ↔ g, m ↔ cm, L ↔ mL', 'Solve measurement problems'], ixl: 'PTF',
    a: [['learn', 'massUnit', 'Learn: Which unit?', 'Grams or kilograms? cm or km?'], ['learn', 'convert', 'Learn: Converting units', 'Multiply by 10, 100 or 1,000'], ['life', 'life10', 'Clay & canvas', 'Clay weights and canvas borders']] },
  { t: 'Time', sub: 'Converting time and elapsed time', color: '#2FA572', facts: { set: [3, 4, 6, 7, 8, 9], div: true }, factLabel: 'Facts review: mixed ÷',
    goals: ['Change hours to minutes', 'Find a time after some minutes', 'Find how much time passed'],
    a: [['learn', 'timeConv', 'Learn: Hours & minutes', '60 minutes in every hour'], ['learn', 'elapsed', 'Learn: Elapsed time', 'Count forward on the clock'], ['life', 'life18', 'The art class schedule', 'Start times, end times and totals']] },
  { t: 'Data & Graphs', sub: 'Bar graphs, pictographs and histograms', color: '#7A4FD1', facts: { set: [2, 3, 4, 5, 6, 7, 8, 9, 10], div: true }, factLabel: 'Facts review: mixed ÷',
    goals: ['Read bar graphs', 'Read histograms (ranges)', 'Use a pictograph key'], ixl: 'CBF',
    a: [['learn', 'barGraph', 'Learn: Bar graphs', 'Read, compare and total'], ['learn', 'histogram', 'Learn: Histograms', 'Bars that stand for a range'], ['life', 'life11', 'The art show', 'Count visitors with a pictograph']] },
  { t: 'Decimals & Volume', sub: 'Fifth-grade finale', color: '#F2B533', facts: { set: [2, 3, 4, 5, 6, 7, 8, 9, 10] }, factLabel: 'Facts: final mastery check',
    goals: ['Read decimal place value', 'Compare decimals and multiply by 10 or 100', 'Find the volume of a box'],
    a: [['learn', 'decimals', 'Learn: Decimals', 'Tenths, hundredths, and moving the point'], ['learn', 'volume', 'Learn: Volume', 'Length × width × height'], ['life', 'life12', 'Grand studio project', 'A mix of real-life problems']] }
];
/* Each unit: Fact Lab, Learn A, Learn B, Real-Life, Review */
UNITS.forEach((u, ui) => {
  u.assign = [{ kind: 'facts', key: 'facts', name: 'Fact Lab', desc: u.factLabel.replace('Facts: ', '').replace('Facts review: ', 'Review: ') }]
    .concat(u.a.map(x => ({ kind: x[0], key: x[1], name: x[2], desc: x[3] })))
    .concat([{ kind: 'review', key: 'review', name: 'Unit review', desc: 'A mix of facts, this unit and earlier units' }]);
  u.assign.forEach((a, ai) => { a.id = `u${ui + 1}a${ai + 1}`; a.n = a.kind === 'facts' ? 20 : 10; a.pass = a.kind === 'facts' ? 18 : 8; });
});

function makeQ(ui, a, d) {
  const u = UNITS[ui]; let q, key;
  if (a.kind === 'facts') { q = G.facts(d, u.facts); key = 'facts'; }
  else if (a.kind !== 'review') { key = a.key; q = G[key](d); }
  else {
    const r = Math.random();
    if (r < 0.25) { q = G.facts(Math.max(2, d), UNITS[R(0, ui)].facts); key = 'facts'; }
    else if (r < 0.65 || ui === 0) { key = pick(u.a)[1]; q = G[key](d); }
    else { key = pick(UNITS[R(0, ui - 1)].a)[1]; q = G[key](Math.min(3, d + 1)); }
  }
  q.key = key; return q;
}

/* Tutorials: the big idea and steps, plus a live worked example */
const TUT = {
  facts: ['Facts become fast when you see patterns.', ['×2: double it.', '×5: count by 5s (ends in 0 or 5).', '×10: add a zero.', 'Division: think "what times this number makes that?"']],
  eqGroups: ['Multiplication counts equal groups fast.', ['Count how many groups.', 'Count how many in ONE group.', 'Write groups × number in each group.']],
  repAdd: ['Adding the same number again and again is multiplication.', ['Count how many times the number is added.', 'That count × the number = the total.']],
  arrays: ['An array is objects in rows and columns.', ['Count the rows.', 'Count how many in one row.', 'Rows × number in each row. You can turn it around and get the same total.']],
  area: ['Area is how many squares cover a shape.', ['Count squares in one row (the length).', 'Count the rows (the width).', 'Length × width = area in square units.']],
  share: ['Division splits a total into equal groups.', ['Know the total.', 'Know how many groups (or how many in each).', 'Ask: what number times this makes the total?']],
  family: ['Three numbers make a fact family: two multiplication and two division facts.', ['Find the biggest number (the product).', 'The two smaller numbers multiply to make it.', 'Divide the product by one to get the other.']],
  breakApart: ['A hard fact = two easy facts added together.', ['Break one number into 5 + something, or 10 + something.', 'Multiply each part.', 'Add the two answers.']],
  tens: ['Use the basic fact, then add the zeros.', ['Cover the zeros and do the basic fact.', 'Count all the zeros you covered.', 'Put them on the end.']],
  moneyAdd: ['Money is a decimal: dollars . cents', ['Line up the decimal points.', 'Add (or subtract) cents first, then dollars.', '100 cents = 1 dollar.']],
  unitPrice: ['Unit price is the cost of ONE item.', ['Total cost ÷ number of items.', 'To compare deals, find each unit price.', 'Lower unit price = better buy.']],
  mult1: ['Break the big number by place value.', ['Split into thousands, hundreds, tens and ones.', 'Multiply each part.', 'Add the parts.']],
  mult2: ['Break the second number into tens and ones.', ['Multiply by the tens part.', 'Multiply by the ones part.', 'Add the two answers.']],
  remainder: ['A remainder is what is left over.', ['Find the biggest fact that fits.', 'Subtract to see what is left.', 'The remainder must be smaller than the divisor.']],
  longDiv: ['Divide one place at a time, left to right.', ['Divide, multiply, subtract, bring down.', 'Repeat for every digit.', 'Check by multiplying back.']],
  fracName: ['A fraction is equal parts of a whole.', ['Bottom number: total equal parts.', 'Top number: parts you count.', 'Equal fractions: multiply top and bottom by the same number.']],
  fracOps: ['Same bottom number = same size pieces.', ['To compare: more pieces is bigger.', 'To add: add the tops, keep the bottom.', 'Fraction of a number: divide by the bottom, multiply by the top.']],
  lineTypes: ['Look at the ends!', ['Point: a single dot.', 'Segment: 2 endpoints.', 'Ray: 1 endpoint + 1 arrow.', 'Line: 2 arrows, no endpoints.']],
  coord: ['Points are written (across, up).', ['Start at the origin (0, 0).', 'Move across to the first number (x).', 'Move up to the second number (y).']],
  massUnit: ['Pick the unit that fits the size.', ['Small things: g, mm, cm, mL.', 'Big things: kg, m, km, L.']],
  convert: ['Metric units are built on 10s.', ['1 cm = 10 mm, 1 m = 100 cm, 1 km = 1,000 m.', '1 kg = 1,000 g, 1 L = 1,000 mL.', 'Big → small: multiply. Small → big: divide.']],
  barGraph: ['The height of a bar shows the amount.', ['Find the bar.', 'Read across to the scale.', '"How many more" means subtract.']],
  histogram: ['A histogram bar stands for a RANGE of numbers.', ['Read the range under the bar.', 'Read its height.', 'Add bars to combine ranges.']],
  decimals: ['Places after the decimal: tenths, hundredths.', ['First place after the point = tenths.', 'Compare from the left, place by place.', '× 10 moves digits one place left.']],
  volume: ['Volume = how many cubes fill a box.', ['Length × width = cubes in one layer.', '× height = number of layers.', 'Answer in cubic units.']]
};
['life1', 'life2', 'life3', 'life4', 'life5', 'life6', 'life7', 'life8', 'life9', 'life10', 'life11', 'life12'].forEach(k => { TUT[k] = ['Real-life problems: read, picture it, then choose the operation.', ['Read the story twice.', 'Ask: equal groups (×)? sharing (÷)? combining (+)? difference (−)?', 'Solve, then check if the answer makes sense.']]; });

Object.assign(TUT, {
  factors: ['A factor divides a number with nothing left over.', ['Try 1, 2, 3… and see which divide evenly.', 'Factors come in pairs: 3 × 8 = 24 gives 3 and 8.', 'Prime = exactly 2 factors. Composite = more than 2.']],
  multiples: ['Multiples are the numbers you say when you count by a number.', ['Count by the number: 6, 12, 18…', 'A multiple divides evenly by the number.', 'Least common multiple: the first number in both lists.']],
  placeValue: ['Each place is worth 10 times the place to its right.', ['ones, tens, hundreds, thousands.', 'Value = digit × what its place is worth.', 'Use 0 to hold an empty place.']],
  rounding: ['Rounding finds a nearby, easier number.', ['Find the place you round to.', 'Look at the digit just to its right.', '5 or more: round up. Less than 5: round down.']],
  addBig: ['Add one place at a time, starting with the ones.', ['Line up the places.', 'Add the ones. 10 or more? Carry 1 to the tens.', 'Keep going left.']],
  subBig: ['Subtract one place at a time, starting with the ones.', ['Line up the places.', 'Top digit too small? Borrow 1 from the next place.', 'Check: answer + what you subtracted = the top number.']],
  orderOps: ['Do the steps in the right order.', ['Parentheses first.', 'Then multiply and divide.', 'Then add and subtract, left to right.']],
  patterns: ['A pattern follows a rule.', ['Look at how each number changes.', 'Say the rule out loud.', 'Use the rule on the next number.']],
  mixed: ['A mixed number is wholes plus a fraction.', ['Improper → mixed: divide top by bottom; the remainder is the new top.', 'Mixed → improper: whole × bottom + top.', 'Add wholes, add fractions, carry if needed.']],
  unlike: ['You can only add pieces of the same size.', ['Find a common bottom number (a common multiple).', 'Change each fraction to that bottom.', 'Add or subtract the tops. Simplify if you can.']],
  fracWhole: ['Multiplying fractions: tops times tops, bottoms times bottoms.', ['Whole number × fraction: multiply the top only.', 'Fraction × fraction: multiply tops, multiply bottoms.', 'Change to a mixed number or simplify.']],
  scaling: ['Multiplying by a fraction less than 1 makes a number smaller.', ['To find 2/3 of 12: divide by 3, then multiply by 2.', 'Fraction less than 1 → smaller answer.']],
  angles: ['Compare the angle to a square corner (90°).', ['Smaller than a square corner: acute.', 'Exactly a square corner: right.', 'Wider: obtuse. A flat line: straight (180°).']],
  shapes: ['Shapes are named by their sides and angles.', ['Count the sides.', 'Look for equal sides and square corners.', 'Triangle angles always add to 180°.']],
  timeConv: ['There are 60 minutes in one hour.', ['Hours → minutes: × 60.', 'Minutes → hours: take out groups of 60.']],
  elapsed: ['Count forward on the clock.', ['Jump whole hours first.', 'Then count the minutes.', 'After :59 comes a new hour.']]
});
['life5b', 'life6b', 'life7b', 'life11b', 'life13', 'life14', 'life16', 'life18'].forEach(k => { TUT[k] = TUT.life1; });

g.Engine = { UNITS, makeQ, factQ, G, TUT, fmt, money, R, pick, shuf };
})(typeof window !== 'undefined' ? window : globalThis);
