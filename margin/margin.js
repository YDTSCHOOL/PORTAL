/* MARGIN: a music store simulation. Version 1.0 (Nov 2026)
   Sign-in, saving, the daily lock, help emails and the teacher view work the same way as Compound,
   using the SCHOOL Supabase project. */

/* ================= Settings ================= */
const SUPABASE_URL = "https://belathxxgwayxdmiqvpd.supabase.co";   // SCHOOL project
const SUPABASE_KEY = "sb_publishable_Kxuxi919RbsmEk-p8iNt-w_zm6BsRI9"; // public key, safe to keep here
const IDLE_MINUTES = 20;          // signs out after this long with no activity
const CLOSE_WARN_MINUTES = 5;     // warning shown this many minutes before the daily lock closes
// Daily lock. The real setting lives in Supabase and is changed from the Teacher view (off to start).
// These are only used if the server can't be reached.
const DEFAULT_LOCK = {on:false, close:"15:10", open:"16:15"};


/* ---------- data ---------- */
const PRODUCTS = [
  {id:'picks',   name:'Guitar picks',       unit:'12-pack',  cost:2.40, market:5,   base:70, unlock:0},
  {id:'strings', name:'Guitar string sets', unit:'set',      cost:6.50, market:14,  base:40, unlock:0},
  {id:'sticks',  name:'Drumsticks',         unit:'pair',     cost:7.20, market:15,  base:28, unlock:0},
  {id:'cables',  name:'Instrument cables',  unit:'10 ft',    cost:9.00, market:22,  base:20, unlock:1},
  {id:'phones',  name:'Studio headphones',  unit:'each',     cost:48,   market:110, base:9,  unlock:2},
  {id:'mics',    name:'Microphones',        unit:'each',     cost:62,   market:140, base:7,  unlock:3},
  {id:'keys',    name:'Digital keyboards',  unit:'61-key',   cost:180,  market:399, base:4,  unlock:3}
];
const GOALS = [
  {nw:2500,   reward:'Instrument cables join your catalog, and you can hire a part-time helper.'},
  {nw:6000,   reward:'Studio headphones join your catalog, and you can move into a storefront.'},
  {nw:15000,  reward:'Microphones and keyboards join your catalog, and you can open an online store.'},
  {nw:50000,  reward:'You can open a second location.'},
  {nw:250000, reward:'Your stores are worth a quarter of a million dollars. You’ve built a real business.'}
];
const ELASTIC = 2.5, SHIP = 20, TAX = 0.06, SAVE_RATE = 0.0075, LOAN_RATE = 0.02, STORAGE = 0.02;

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const r2 = n => Math.round(n*100)/100;
const money = n => (n < -0.004 ? '−$' : '$') + Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const money0 = n => (n < -0.5 ? '−$' : '$') + Math.round(Math.abs(n)).toLocaleString('en-US');
const pct = n => (Math.round(n*1000)/10) + '%';
const def = id => PRODUCTS.find(p => p.id === id);
const rand = (a,b) => a + Math.random()*(b-a);
const pickOne = arr => arr[Math.floor(Math.random()*arr.length)];
let S = null;

function newState(name){
  const products = {};
  PRODUCTS.forEach(p => products[p.id] = {stock:0, avgCost:0, price:p.market, cost:p.cost, sold:null});
  return {name, week:1, cash:1500, savings:0, loan:0, rep:50, level:0, products,
    marketing:0, helper:false, up:{storefront:false, online:false, second:false},
    payments:[], share:null, hikes:[], mods:{}, event:null, lastEventType:null,
    history:[1500], report:null, totalProfit:0, won:false,
    act:{}, help:{}, restarts:0, best:1500, started:today()};
}
const unlocked = () => PRODUCTS.filter(p => p.unlock <= S.level);
const tierRate = q => q >= 250 ? .15 : q >= 100 ? .10 : q >= 50 ? .05 : 0;
const lineCost = (id,q) => q > 0 ? q*S.products[id].cost*(1 - tierRate(q)) + SHIP : 0;
const invValue = () => Object.values(S.products).reduce((a,p) => a + p.stock*p.avgCost, 0);
const owed = () => S.payments.reduce((a,p) => a + p.amt*p.left, 0);
const netWorth = () => S.cash + S.savings - S.loan + invValue() - owed();
const loanLimit = () => 1500 + S.level*2500;
const rent = () => (S.up.storefront ? 450 : 120) + (S.up.second ? 450 : 0);
const WAGE = 16, HOURS = 15;

function addStock(id, q, total){
  const p = S.products[id];
  p.avgCost = (p.stock*p.avgCost + total) / (p.stock + q);
  p.stock += q;
}
function toast(msg){ const t = $('#toast'); t.textContent = msg; clearTimeout(toast.h); toast.h = setTimeout(() => t.textContent = '', 5000); }

/* ---------- events ---------- */
function stocked(min){ return unlocked().filter(p => S.products[p.id].stock >= min); }
const EVENTS = {
  clearance:{
    can:() => true,
    make(){ const p = pickOne(unlocked()); return {p:p.id, q:pickOne([120,150,200]), d:pickOne([.25,.3,.35])}; },
    view(e){
      const d = def(e.p), c = S.products[e.p].cost, total = e.q*c*(1-e.d);
      return {title:'Supplier clearance',
        text:`Your supplier is clearing out ${d.name.toLowerCase()}: ${Math.round(e.d*100)}% off the usual ${money(c)}, free shipping, but only as one lot of ${e.q}. Today only.`,
        options:[
          {label:`Buy the lot of ${e.q}`, ok:S.cash >= total, why:'Not enough cash in the register', fn(){ S.cash -= total; addStock(e.p, e.q, total); toast(`${e.q} ${d.name.toLowerCase()} added to your stock.`); }},
          {label:'Pass', fn(){}}
        ]};
    }
  },
  band:{
    can:() => stocked(15).some(p => p.unlock <= 1 && p.market < 30),
    make(){
      const p = pickOne(stocked(15).filter(p => p.market < 30));
      const q = Math.min(S.products[p.id].stock, pickOne([20,25,30,40]));
      return {p:p.id, q, price:Math.round(p.market*rand(.62,.8)*2)/2};
    },
    view(e){
      const d = def(e.p);
      return {title:'Bulk order from a school band',
        text:`A band director wants ${e.q} ${d.name.toLowerCase()} for the whole section at ${money(e.price)} each. They’ll pay at the end of the week. You have ${S.products[e.p].stock} in stock.`,
        options:[
          {label:`Sell ${e.q} at ${money(e.price)} each`, ok:S.products[e.p].stock >= e.q, why:'Not enough in stock', fn(){
            const p = S.products[e.p]; p.stock -= e.q;
            (S.mods.special ||= []).push({name:`${d.name} (band order)`, q:e.q, price:e.price, cogs:e.q*p.avgCost});
            toast('Order set aside for the band.'); }},
          {label:'Turn it down', fn(){}}
        ]};
    }
  },
  competitor:{
    can:() => true,
    make(){ return {d:pickOne([.15,.2,.25])}; },
    view(e){
      return {title:'Sale across town',
        text:`The shop across town is taking ${Math.round(e.d*100)}% off everything this week. Shoppers are comparing prices.`,
        options:[
          {label:'Keep my prices', fn(){ S.mods.demand = (S.mods.demand||1)*(1 - e.d*1.4); }},
          {label:`Match them: set every price to ${Math.round(e.d*100)}% below what other shops usually charge`, fn(){
            unlocked().forEach(p => { S.products[p.id].price = Math.min(S.products[p.id].price, r2(p.market*(1-e.d))); });
            toast('Prices lowered. They stay that way until you change them.'); }}
        ]};
    }
  },
  radio:{
    can:() => S.week > 2,
    make(){ return {flat:pickOne([200,250,300]), pct:pickOne([.06,.08,.1])}; },
    view(e){
      return {title:'Radio ad offer',
        text:`A local station will run an ad for your store all week. They’ll take ${money0(e.flat)} up front, or ${Math.round(e.pct*100)}% of everything you sell this week instead. Either way, the ad brings the same crowd.`,
        options:[
          {label:`Pay ${money0(e.flat)} flat`, fn(){ S.mods.demand = (S.mods.demand||1)*1.3; (S.mods.extra ||= []).push({label:'Radio ad', amt:e.flat}); }},
          {label:`Pay ${Math.round(e.pct*100)}% of this week’s sales`, fn(){ S.mods.demand = (S.mods.demand||1)*1.3; S.mods.adPct = e.pct; }},
          {label:'No ad', fn(){}}
        ]};
    }
  },
  repair:{
    can:() => S.payments.length < 2,
    make(){ const now = pickOne([300,360,420]); const wk = pickOne([6,8]); return {now, wk, per:Math.round(now*rand(1.12,1.3)/wk)}; },
    view(e){
      return {title:'Broken display case',
        text:`Your glass display case cracked. The repair shop will take ${money0(e.now)} now, or ${money0(e.per)} a week for ${e.wk} weeks.`,
        options:[
          {label:`Pay ${money0(e.now)} this week`, fn(){ (S.mods.extra ||= []).push({label:'Display case repair', amt:e.now}); }},
          {label:`Pay ${money0(e.per)} a week for ${e.wk} weeks`, fn(){ S.payments.push({label:'Display case plan', amt:e.per, left:e.wk}); }}
        ]};
    }
  },
  concert:{
    can:() => true,
    make(){ return {}; },
    view(){
      return {title:'Big concert in town',
        text:'Touring musicians are in town this week, and plenty of them forgot something at home. Expect a lot more customers than usual.',
        options:[{label:'Got it', fn(){ S.mods.demand = (S.mods.demand||1)*1.5; }}]};
    }
  },
  damaged:{
    can:() => stocked(20).length > 0,
    make(){ const p = pickOne(stocked(20)); return {p:p.id, f:pickOne([.1,.15,.2]), ins:pickOne([.5,.6,.75])}; },
    view(e){
      const d = def(e.p), p = S.products[e.p], lost = Math.round(p.stock*e.f);
      return {title:'Water leak in the stockroom',
        text:`A pipe leaked overnight. ${lost} of your ${d.name.toLowerCase()} are ruined. Insurance pays back ${Math.round(e.ins*100)}% of what you paid for them.`,
        options:[{label:'File the claim', fn(){
          const back = lost*p.avgCost*e.ins; p.stock -= lost; S.cash += back;
          toast(`Insurance paid ${money(back)}.`); }}]};
    }
  },
  hike:{
    can:() => true,
    make(){ const p = pickOne(unlocked()); return {p:p.id, pct:pickOne([.1,.12,.15])}; },
    view(e){
      const d = def(e.p);
      return {title:'Supplier price increase',
        text:`Starting next week, your supplier is raising the price of ${d.name.toLowerCase()} by ${Math.round(e.pct*100)}%. This week you can still order at ${money(S.products[e.p].cost)}.`,
        options:[{label:'Noted', fn(){ S.hikes.push({p:e.p, pct:e.pct}); }}]};
    }
  },
  studio:{
    can:() => S.level >= 2 && stocked(5).some(p => p.market >= 100),
    make(){ const p = pickOne(stocked(5).filter(p => p.market >= 100)); return {p:p.id, q:Math.min(S.products[p.id].stock, pickOne([5,6,8])), d:pickOne([.2,.25,.3])}; },
    view(e){
      const d = def(e.p), price = r2(S.products[e.p].price*(1-e.d));
      return {title:'Recording studio order',
        text:`A recording studio wants ${e.q} ${d.name.toLowerCase()}, but only if you take ${Math.round(e.d*100)}% off your current price of ${money(S.products[e.p].price)}.`,
        options:[
          {label:`Accept the order`, ok:S.products[e.p].stock >= e.q, why:'Not enough in stock', fn(){
            const p = S.products[e.p]; p.stock -= e.q;
            (S.mods.special ||= []).push({name:`${d.name} (studio order)`, q:e.q, price, cogs:e.q*p.avgCost}); toast('Order set aside for the studio.'); }},
          {label:'Decline', fn(){}}
        ]};
    }
  },
  partner:{
    can:() => S.level >= 1 && !S.share && S.payments.length < 2,
    make(){ const amt = pickOne([2000,3000]); return {amt, back:Math.round(amt*pickOne([1.25,1.3])/10)*10, wk:10, share:pickOne([.15,.2])}; },
    view(e){
      return {title:'A customer wants in',
        text:`A regular customer believes in your store and offers ${money0(e.amt)} today. Pick how you pay it back: ${money0(e.back/e.wk)} a week for ${e.wk} weeks, or ${Math.round(e.share*100)}% of each week’s profit for ${e.wk} weeks (nothing in a week you lose money).`,
        options:[
          {label:`Weekly payments of ${money0(e.back/e.wk)}`, fn(){ S.cash += e.amt; S.payments.push({label:'Payment to backer', amt:e.back/e.wk, left:e.wk}); }},
          {label:`${Math.round(e.share*100)}% of profit`, fn(){ S.cash += e.amt; S.share = {pct:e.share, left:e.wk}; }},
          {label:'No thanks', fn(){}}
        ]};
    }
  }
};
function rollEvent(){
  S.event = null;
  if (S.week < 2 || Math.random() > 0.6) return;
  const pool = Object.keys(EVENTS).filter(k => k !== S.lastEventType && EVENTS[k].can());
  if (!pool.length) return;
  const k = pickOne(pool);
  S.event = Object.assign({type:k}, EVENTS[k].make());
  S.lastEventType = k;
}
function resolveEvent(i){
  const v = EVENTS[S.event.type].view(S.event);
  const o = v.options[i];
  if (o.ok === false) return;
  o.fn();
  S.event = null; save('offer', `${v.title}: ${o.label}`); render();
}

/* ---------- the week ---------- */
function runWeek(){
  if (S.event){ toast('Make a decision on the offer first.'); return; }
  const m = S.mods;
  let mult = (0.5 + S.rep/100) * (1 + 0.35*Math.log(1 + S.marketing/100));
  if (S.helper) mult *= 1.2;
  if (S.up.storefront) mult *= 1.8;
  if (S.up.online) mult *= 1.35;
  if (S.up.second) mult *= 1.5;
  mult *= (m.demand || 1);

  const lines = [], tips = [];
  let revenue = 0, cogs = 0, turned = 0, repDelta = 0;
  unlocked().forEach(d => {
    const p = S.products[d.id];
    if (!(p.price > 0)){ p.sold = 0; return; }
    const priceF = clamp(1 + ELASTIC*(d.market - p.price)/d.market, 0, 2.2);
    const demand = Math.round(d.base * mult * priceF * rand(.85,1.15));
    const sold = Math.min(demand, p.stock);
    const missed = demand - sold;
    p.stock -= sold; p.sold = sold;
    revenue += sold*p.price; cogs += sold*p.avgCost; turned += missed;
    if (sold > 0) lines.push({name:d.name, q:sold, price:p.price});
    if (demand > 0 && missed/demand > .2) repDelta -= 2.5;
    if (p.price > d.market*1.3) repDelta -= 1;
    else if (p.price <= d.market && sold > 0) repDelta += .4;
    if (missed >= 5) tips.push(`${missed} customers asked for ${d.name.toLowerCase()} after you sold out.`);
    if (sold > 0 && p.price < p.avgCost) tips.push(`You sold ${d.name.toLowerCase()} for less than you paid for them.`);
    if (p.price > d.market*1.25) tips.push(`Your ${d.name.toLowerCase()} cost a lot more than at other shops, and customers notice.`);
  });
  (m.special || []).forEach(s => { revenue += s.q*s.price; cogs += s.cogs; lines.push({name:s.name, q:s.q, price:s.price}); });

  const costs = [];
  costs.push({label: S.up.storefront ? 'Rent' : 'Kiosk rent', amt: rent()});
  if (S.helper) costs.push({label:'Helper wages', amt: WAGE*HOURS});
  if (S.marketing > 0) costs.push({label:'Marketing', amt:S.marketing});
  if (m.adPct) costs.push({label:'Radio ad (share of sales)', amt: revenue*m.adPct});
  if (S.up.online) costs.push({label:'Card fees (3%)', amt: revenue*.03});
  (m.extra || []).forEach(x => costs.push(x));
  S.payments.forEach(p => { costs.push({label:p.label, amt:p.amt}); p.left--; });
  S.payments = S.payments.filter(p => p.left > 0);
  const storage = invValue()*STORAGE;
  if (storage > 0.005) costs.push({label:'Storage and insurance', amt: storage});

  const spent = costs.reduce((a,c) => a + c.amt, 0);
  let operating = revenue - cogs - spent;
  let share = 0;
  if (S.share){
    if (operating > 0){ share = operating*S.share.pct; costs.push({label:'Backer’s share of profit', amt:share}); }
    if (--S.share.left <= 0) S.share = null;
  }
  const loanInt = S.loan*LOAN_RATE, saveInt = S.savings*SAVE_RATE;
  S.loan += loanInt; S.savings += saveInt;
  S.cash += revenue - spent - share;
  const net = operating - share - loanInt + saveInt;
  S.totalProfit += net;

  let overdraft = 0;
  if (S.cash < 0){ overdraft = -S.cash; S.loan += overdraft; S.cash = 0; }

  if (S.marketing > 0) repDelta += .5;
  if (S.helper) repDelta += .7;
  S.rep = clamp(S.rep + repDelta, 10, 100);

  S.hikes.forEach(h => { S.products[h.p].cost = r2(S.products[h.p].cost*(1+h.pct)); });
  S.hikes = [];

  if (storage > 40) tips.push(`Unsold stock cost you ${money(storage)} to store and insure this week.`);
  if (loanInt > 0) tips.push(`Your loan grew by ${money(loanInt)} in interest this week.`);
  if (S.cash > 2500 && S.savings < 1) tips.push('Money in the register doesn’t grow. The bank pays interest on savings every week.');
  if (overdraft) tips.push(`You ran out of cash, so the bank covered ${money(overdraft)} and added it to your loan.`);
  if (!tips.length && net > 0) tips.push('A clean week. Look at which product made you the most per sale.');

  S.report = {week:S.week, lines, revenue, tax:revenue*TAX, cogs, costs, loanInt, saveInt, net, turned, tips:tips.slice(0,4), fresh:true};
  S.week++;
  S.mods = {};
  S.history.push(r2(netWorth()));
  S.best = Math.max(S.best || 0, netWorth());
  const dk = today(); S.act[dk] = S.act[dk] || {m:0, n:0}; S.act[dk].n++;

  const before = S.level;
  while (S.level < GOALS.length && netWorth() >= GOALS[S.level].nw) S.level++;
  rollEvent();
  save('week', `Week ${S.week-1}: ${S.report.net >= 0 ? 'profit' : 'loss'} ${money(S.report.net)}, net worth ${money0(netWorth())}, cash ${money0(S.cash)}${S.loan > 0 ? ', loan ' + money0(S.loan) : ''}, reputation ${Math.round(S.rep)}`);
  if (S.level > before) save('goal', `Reached the ${money0(GOALS[S.level-1].nw)} goal in week ${S.week-1}`);
  render();
  if (S.level > before){
    const g = GOALS[S.level-1];
    showModal(`<h2>Goal reached: ${money0(g.nw)}</h2><p>${g.reward}</p><div class="acts"><button class="btn" data-close>Back to the store</button></div>`);
    if (S.level === GOALS.length && !S.won){ S.won = true; save(); }
  }
}

/* ---------- actions ---------- */
function placeOrder(){
  const qs = readOrders();
  const total = Object.entries(qs).reduce((a,[id,q]) => a + lineCost(id,q), 0);
  if (total <= 0){ toast('Type how many you want in the Order column first.'); return; }
  if (total > S.cash + 0.001){ toast(`That order costs ${money(total)} and you have ${money(S.cash)} in cash. Order less, or move money in from the bank.`); return; }
  Object.entries(qs).forEach(([id,q]) => { if (q > 0) addStock(id, q, lineCost(id,q)); });
  S.cash -= total;
  toast('');
  save('order', 'Ordered ' + Object.entries(qs).map(([id,q]) => `${q} ${def(id).name.toLowerCase()}`).join(', ') + ` for ${money(total)}`); render();
}
function readOrders(){
  const o = {};
  document.querySelectorAll('input[data-order]').forEach(i => { const q = Math.floor(+i.value); if (q > 0) o[i.dataset.order] = q; });
  return o;
}
function updateOrderTotal(){
  const qs = readOrders();
  const t = Object.entries(qs).reduce((a,[id,q]) => a + lineCost(id,q), 0);
  $('#orderTotal').textContent = 'Order total ' + money(t);
}
function bank(action){
  const amt = r2(+$('#bankAmt').value);
  if (!(amt > 0)){ toast('Type an amount first.'); return; }
  if (action === 'dep'){ if (amt > S.cash) return toast('You don’t have that much cash.'); S.cash -= amt; S.savings += amt; }
  if (action === 'wd'){ if (amt > S.savings + .001) return toast('Your savings aren’t that large.'); S.savings -= amt; S.cash += amt; }
  if (action === 'bor'){ if (S.loan + amt > loanLimit()) return toast(`The bank will lend you up to ${money0(loanLimit())} in total.`); S.loan += amt; S.cash += amt; }
  if (action === 'pay'){ const a = Math.min(amt, S.loan); if (a > S.cash) return toast('You don’t have that much cash.'); S.loan -= a; S.cash -= a; }
  S.savings = r2(S.savings); S.loan = r2(S.loan);
  save('bank', {dep:'Deposited', wd:'Withdrew', bor:'Borrowed', pay:'Repaid'}[action] + ' ' + money(amt) + (action === 'dep' || action === 'wd' ? ' (savings)' : ' (loan)')); render();
}
function buyUpgrade(k){
  const U = UPGRADES[k];
  if (S.cash < U.cost) return toast(`You need ${money0(U.cost)} in cash for that.`);
  S.cash -= U.cost; S.up[k] = true; save('upgrade', U.name); render();
  toast('');
}
const UPGRADES = {
  storefront:{lvl:2, cost:3500, name:'Move into a storefront', text:'Leave the kiosk for a real shop on Main Street. Rent goes from $120 to $450 a week, and far more people walk in.'},
  online:{lvl:3, cost:2000, name:'Open an online store', text:'Sell to customers outside town. Card companies charge 3% of everything you sell.'},
  second:{lvl:4, cost:15000, name:'Open a second location', text:'A second shop across the county adds $450 a week in rent and a whole new set of customers.'}
};

/* ---------- render ---------- */
function render(){
  $('#storeName').textContent = S.name;
  $('#whoLine').textContent = NAME + (DEMO ? ' (demo, nothing is saved)' : '');
  $('#hWeek').textContent = S.week;
  $('#hCash').textContent = money(S.cash);
  const nw = netWorth();
  $('#hNW').textContent = money0(nw);
  $('#hRep').textContent = Math.round(S.rep);
  $('#hRepBar').style.width = S.rep + '%';
  $('#bRun').textContent = `Open the store for week ${S.week}`;

  // table
  const rows = PRODUCTS.map(d => {
    const p = S.products[d.id];
    if (d.unlock > S.level){
      return `<tr class="locked"><td class="name"><b>${d.name}</b><small>Unlocks at ${money0(GOALS[d.unlock-1].nw)} net worth</small></td><td colspan="7"></td></tr>`;
    }
    const stock = p.stock === 0 ? '<span class="out">Sold out</span>' : p.stock;
    return `<tr>
      <td class="name"><b>${d.name}</b><small>${d.unit}</small></td>
      <td class="num">${stock}</td>
      <td class="num">${p.stock ? money(p.avgCost) : '—'}</td>
      <td class="num">${money(p.cost)}</td>
      <td class="num">${money(d.market)}</td>
      <td><input class="field num" type="number" min="0" step="0.25" inputmode="decimal" data-price="${d.id}" value="${p.price.toFixed(2)}" aria-label="Your price for ${d.name}"></td>
      <td class="num">${p.sold === null ? '—' : p.sold}</td>
      <td><input class="field qty num" type="number" min="0" step="1" inputmode="numeric" data-order="${d.id}" placeholder="0" aria-label="Order ${d.name}"></td>
    </tr>`;
  }).join('');
  $('#tbody').innerHTML = rows;
  updateOrderTotal();

  // bank
  $('#bank').innerHTML = `
    <div class="row"><span>Cash in register</span><b class="num">${money(S.cash)}</b></div>
    <div class="row"><span>Savings, earns 0.75% a week</span><b class="num">${money(S.savings)}</b></div>
    <div class="row"><span>Loan, costs 2% a week</span><b class="num" style="color:${S.loan>0?'var(--loss)':'inherit'}">${money(S.loan)}</b></div>
    <div class="row"><span>Bank will lend up to</span><b class="num">${money0(loanLimit())}</b></div>
    <div class="bankform">
      <input class="field num" id="bankAmt" type="number" min="0" step="10" inputmode="decimal" placeholder="Amount" aria-label="Bank amount">
      <button class="btn small line" data-bank="dep">Deposit</button>
      <button class="btn small line" data-bank="wd">Withdraw</button>
      <button class="btn small line" data-bank="bor">Borrow</button>
      <button class="btn small line" data-bank="pay">Repay loan</button>
    </div>`;

  // shop
  let shop = `<div class="mkt"><span style="color:var(--muted)">Marketing per week</span><input class="field num" id="mkt" type="number" min="0" step="25" value="${S.marketing}" aria-label="Marketing per week"></div>`;
  shop += `<div class="up"><b>Part-time helper</b><p>${HOURS} hours a week at $${WAGE} an hour. Shorter lines, happier customers.</p>`;
  shop += S.level >= 1
    ? `<button class="btn small ${S.helper?'line':''}" id="bHelper">${S.helper ? 'Let the helper go' : 'Hire a helper'}</button>`
    : `<span class="lockmsg">Unlocks at ${money0(GOALS[0].nw)} net worth</span>`;
  shop += `</div>`;
  Object.entries(UPGRADES).forEach(([k,U]) => {
    shop += `<div class="up"><b>${U.name}</b><p>${U.text} Costs ${money0(U.cost)}.</p>`;
    if (S.up[k]) shop += `<span class="lockmsg">Done</span>`;
    else if (S.level >= U.lvl) shop += `<button class="btn small" data-up="${k}" ${S.cash < U.cost ? 'disabled' : ''}>Buy for ${money0(U.cost)}</button>`;
    else shop += `<span class="lockmsg">Unlocks at ${money0(GOALS[U.lvl-1].nw)} net worth</span>`;
    shop += `</div>`;
  });
  $('#shop').innerHTML = shop;

  // goal
  const g = GOALS[S.level];
  if (g){
    const prev = S.level ? GOALS[S.level-1].nw : 0;
    const prog = clamp((nw - prev)/(g.nw - prev), 0, 1);
    $('#goal').innerHTML = `<div class="row"><span>Next goal</span><b class="num">${money0(g.nw)} net worth</b></div><div class="bar"><i style="width:${prog*100}%"></i></div><p>Total profit so far: <b class="num" style="color:${S.totalProfit>=0?'var(--gain)':'var(--loss)'}">${money0(S.totalProfit)}</b></p>`;
  } else {
    $('#goal').innerHTML = `<p>Every goal reached. Total profit: <b class="num">${money0(S.totalProfit)}</b>. Keep growing.</p>`;
  }
  drawChart();

  // event
  if (S.event){
    const v = EVENTS[S.event.type].view(S.event);
    $('#eventBox').innerHTML = `<div class="event"><h3>${v.title}</h3><p>${v.text}</p><div class="opts">${
      v.options.map((o,i) => `<button class="btn small line" data-opt="${i}" ${o.ok===false?'disabled':''}>${o.label}</button>${o.ok===false?`<span class="why">${o.why}</span>`:''}`).join('')
    }</div></div>`;
  } else $('#eventBox').innerHTML = '';

  renderReceipt();
}

function renderReceipt(){
  const R = S.report;
  if (!R){
    $('#counter').innerHTML = `<div class="notes" style="margin-top:4px">
      <p>You’re starting with ${money0(1500)} and an empty kiosk at the mall.</p>
      <p>Order some stock, check your prices, then open the store. Each week ends with a receipt showing exactly where your money went.</p>
      <p>Reach a net worth of ${money0(GOALS[0].nw)} to unlock your next product.</p></div>`;
    return;
  }
  const L = (a,b,cls='') => `<div class="l ${cls}"><span>${a}</span><span class="num">${b}</span></div>`;
  let h = `<div class="receipt ${R.fresh?'print':''}">
    <div class="c hd">${esc(S.name)}</div><div class="c m">Week ${R.week} summary</div><div class="dash"></div>`;
  if (R.lines.length) R.lines.forEach(l => { h += L(`${l.name}<br><span class="m">${l.q} × ${money(l.price)}</span>`, money(l.q*l.price)); });
  else h += `<div class="m">No sales this week.</div>`;
  h += `<div class="dash"></div>` + L('Sales', money(R.revenue));
  h += L('<span class="m">Sales tax collected (6%), paid to the state</span>', `<span class="m">${money(R.tax)}</span>`);
  h += `<div class="dash"></div>` + L('What those goods cost you', '−' + money(R.cogs));
  R.costs.forEach(c => h += L(c.label, '−' + money(c.amt)));
  if (R.loanInt > 0) h += L('Loan interest', '−' + money(R.loanInt));
  if (R.saveInt > 0) h += L('Savings interest', '+' + money(R.saveInt));
  h += `<div class="dash"></div>` + L(R.net >= 0 ? 'Profit' : 'Loss', money(R.net), 'big');
  if (R.turned > 0) h += `<div class="dash"></div><div class="c m">Customers turned away: ${R.turned}</div>`;
  h += `</div>`;
  if (R.tips.length) h += `<div class="notes">${R.tips.map(t => `<p>${t}</p>`).join('')}</div>`;
  $('#counter').innerHTML = h;
  if (R.fresh){ R.fresh = false; }
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function drawChart(){
  const c = $('#chart'), dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth, h = c.clientHeight;
  if (!w) return;
  c.width = w*dpr; c.height = h*dpr;
  const x = c.getContext('2d'); x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,w,h);
  const cs = getComputedStyle(document.documentElement);
  const data = S.history.slice(-40);
  const max = Math.max(...data, 100), min = Math.min(...data, 0);
  const px = i => data.length < 2 ? w/2 : 4 + i*(w-8)/(data.length-1);
  const py = v => h - 14 - (v - min)/(max - min || 1)*(h - 24);
  x.strokeStyle = cs.getPropertyValue('--line'); x.lineWidth = 1;
  x.beginPath(); x.moveTo(0, py(0)); x.lineTo(w, py(0)); x.stroke();
  x.strokeStyle = cs.getPropertyValue('--brass'); x.lineWidth = 2; x.lineJoin = 'round';
  x.beginPath(); data.forEach((v,i) => i ? x.lineTo(px(i),py(v)) : x.moveTo(px(i),py(v))); x.stroke();
  x.fillStyle = cs.getPropertyValue('--muted'); x.font = '11px Barlow, sans-serif';
  x.fillText(money0(max), 2, 10);
}

/* ================= Server ================= */
async function rpc(fn, args, keep){
  const h = {'Content-Type':'application/json', 'apikey':SUPABASE_KEY};
  if (SUPABASE_KEY.startsWith('eyJ')) h.Authorization = 'Bearer ' + SUPABASE_KEY;
  const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {method:'POST', headers:h, body:JSON.stringify(args || {}), keepalive:!!keep});
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
let TOKEN = null, NAME = '', DEMO = /[?&]demo\b/.test(location.search), dirty = false, lastAct = Date.now();
let saveChain = Promise.resolve();
function save(event, detail){
  dirty = true;
  if (DEMO || !TOKEN || !S) return;
  dirty = false;
  const el = $('#saving'); el.className = 'saving'; el.textContent = 'Saving…';
  const body = {p_token:TOKEN, p_state:S, p_event:event || null, p_detail:detail || null};
  saveChain = saveChain.then(() => rpc('margin_save', body)).then(res => {
    if (res && res.ok) el.textContent = 'Saved';
    else {
      el.className = 'saving err'; el.textContent = res && res.error === 'session' ? 'Signed out' : 'Not saved'; dirty = true;
      if (res && res.error === 'session'){ flash('Your session ended. Please sign in again.'); setTimeout(signOut, 1500); }
    }
  }).catch(() => { el.className = 'saving err'; el.textContent = 'Not saved'; dirty = true; });
}
let saveT; function saveSoon(){ dirty = true; clearTimeout(saveT); saveT = setTimeout(() => save(), 1500); }
setInterval(() => { if (dirty && TOKEN && !DEMO) save(); }, 120000);

function today(){ const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function dstr(d){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function weekDates(){ const d = new Date(); d.setDate(d.getDate() - d.getDay()); return [...Array(7)].map((_,i) => { const x = new Date(d); x.setDate(d.getDate()+i); return dstr(x); }); }
// time on task: counts 15 seconds at a time while he is active
setInterval(() => {
  if (!(TOKEN || DEMO) || !S || document.body.dataset.mode !== 'app') return;
  if (Date.now() - lastAct < 60000 && document.visibilityState === 'visible'){
    const k = today(); S.act[k] = S.act[k] || {m:0, n:0}; S.act[k].m += 15; dirty = true;
  }
}, 15000);
function flash(msg){ const t = $('#toastbox'); t.textContent = msg; t.classList.add('on'); clearTimeout(flash.h); flash.h = setTimeout(() => t.classList.remove('on'), 3200); }

function normState(st){
  if (!st || !st.products || typeof st.cash !== 'number') return null;
  PRODUCTS.forEach(p => { if (!st.products[p.id]) st.products[p.id] = {stock:0, avgCost:0, price:p.market, cost:p.cost, sold:null}; });
  st.mods ||= {}; st.act ||= {}; st.help ||= {}; st.payments ||= []; st.hikes ||= []; st.history ||= [st.cash];
  st.up ||= {storefront:false, online:false, second:false};
  if (st.restarts == null) st.restarts = 0;
  if (st.best == null) st.best = Math.max(...st.history);
  return st;
}

/* ================= Screens ================= */
function showOuter(id){
  document.body.dataset.mode = 'out';
  document.querySelectorAll('.outer .screen').forEach(s => s.classList.toggle('on', s.id === id));
  closeModal(); closeDrawer();
}
function showGame(){ document.body.dataset.mode = 'app'; render(); }

/* ---------- daily lock (off unless turned on in the Teacher view) ---------- */
let LOCK = {...DEFAULT_LOCK}, clockOffset = 0;
const tmin = t => { const [h,m] = t.split(':').map(Number); return h*60 + m; };
const nowMin = () => { const d = new Date(); return (((d.getHours()*60 + d.getMinutes() + clockOffset) % 1440) + 1440) % 1440; };
const fmtT12 = t => { const [h,m] = t.split(':').map(Number); return ((h+11)%12+1) + ':' + String(m).padStart(2,'0') + (h < 12 ? ' AM' : ' PM'); };
function isClosed(){ if (!LOCK.on) return false; const c = tmin(LOCK.close), o = tmin(LOCK.open), n = nowMin();
  if (c < o) return n >= c && n < o; if (c > o) return n >= c || n < o; return false; }
function minsToClose(){ if (!LOCK.on || isClosed()) return null; return (tmin(LOCK.close) - nowMin() + 1440) % 1440; }
async function fetchLock(){
  try{
    const r = await rpc('margin_get_settings', {});
    if (r && r.ok){
      LOCK = {on:!!r.lock_on, close:r.close_time, open:r.open_time};
      if (typeof r.now_min === 'number'){ const d = new Date(), dev = d.getHours()*60 + d.getMinutes(); let off = r.now_min - dev; if (off > 720) off -= 1440; if (off < -720) off += 1440; clockOffset = Math.abs(off) <= 1 ? 0 : off; }
    }
  }catch(e){}
  checkClock();
}
function setClosedView(){
  const c = isClosed(); $('#signForm').hidden = c; $('#closedBox').hidden = !c; $('#inGo').hidden = c;
  if (c) $('#closedMsg').textContent = `Your store is saved. Margin opens again at ${fmtT12(LOCK.open)}.`;
}
async function closeForDay(){
  const tok = TOKEN, st = S, demo = DEMO;
  TOKEN = null; NAME = ''; DEMO = false; S = null; dirty = false; $('#clockWarn').hidden = true;
  showOuter('signin'); setClosedView();
  if (tok && !demo){ try{ await rpc('margin_save', {p_token:tok, p_state:st, p_event:'closed', p_detail:`Signed out automatically at ${fmtT12(LOCK.close)}`}); await rpc('margin_signout', {p_token:tok}); }catch(e){} }
}
function checkClock(){
  const inApp = !!(TOKEN || DEMO) && S, left = minsToClose();
  if (inApp && left !== null && left > 0 && left <= CLOSE_WARN_MINUTES){ $('#clockWarn').hidden = false; $('#clockWarn').textContent = `Store closes in ${left} minute${left > 1 ? 's' : ''}. Your progress saves automatically.`; }
  else $('#clockWarn').hidden = true;
  if (isClosed() && inApp) closeForDay();
  else if (document.body.dataset.mode === 'out' && $('#signin').classList.contains('on')) setClosedView();
}
setInterval(checkClock, 10000);
setInterval(fetchLock, 60000);

/* ---------- sign in / out ---------- */
async function signIn(){
  if (isClosed()){ setClosedView(); return; }
  const n = $('#inName').value.trim(), p = $('#inPin').value.trim(); $('#inErr').textContent = '';
  if (!n || !p){ $('#inErr').textContent = 'Type your first name and PIN.'; return; }
  $('#inGo').disabled = true; $('#inGo').textContent = 'Signing in…';
  try{
    const res = await rpc('margin_login', {p_name:n, p_pin:p});
    if (res.ok){
      TOKEN = res.token; NAME = res.name; $('#inPin').value = ''; lastAct = Date.now(); poke();
      S = normState(res.state);
      await fetchMsgs();
      if (!S){ S = newState('Riverside Music Supply'); showGame(); startScreen(); }
      else { showGame(); if (MSG.unread) openDrawer(true); }
    }
    else if (res.error === 'closed'){ await fetchLock(); LOCK.on = true; setClosedView(); }
    else $('#inErr').textContent = {name:'That name isn’t on the school list. Check the spelling.', pin:'That PIN doesn’t match. Try again.', locked:'Too many wrong PINs. Wait 5 minutes, then try again.'}[res.error] || 'Sign-in didn’t work. Ask your teacher.';
  }catch(e){ $('#inErr').textContent = 'Can’t reach the school server. Check the Wi-Fi and try again.'; }
  $('#inGo').disabled = false; $('#inGo').textContent = 'Sign in';
}
async function signOut(){
  if (TOKEN && !DEMO){ try{ await rpc('margin_save', {p_token:TOKEN, p_state:S, p_event:null, p_detail:null}); await rpc('margin_signout', {p_token:TOKEN}, true); }catch(e){} }
  TOKEN = null; NAME = ''; S = null; dirty = false; $('#saving').textContent = ''; $('#inName').value = ''; $('#clockWarn').hidden = true;
  if (DEMO){ DEMO = false; history.replaceState(null, '', location.pathname); }
  showOuter('signin'); setClosedView(); if (!isClosed()) $('#inName').focus();
}
let idleT;
function poke(){ lastAct = Date.now(); clearTimeout(idleT); if (TOKEN || DEMO) idleT = setTimeout(() => { flash(`Signed out after ${IDLE_MINUTES} minutes without activity.`); signOut(); }, IDLE_MINUTES*60000); }
['click','keydown','pointermove'].forEach(ev => document.addEventListener(ev, poke, {passive:true}));

/* ================= Modals ================= */
function showModal(html){ $('#sheet').innerHTML = html; $('#modal').classList.add('on'); const f = $('#sheet').querySelector('input,textarea,button'); if (f) f.focus(); }
function closeModal(){ $('#modal').classList.remove('on'); }
function startScreen(again){
  showModal(`<h2>${again ? 'Open a new store' : 'Open your music store'}</h2>
    <p>You have ${money0(1500)} and a rented kiosk at the mall. The supplier wants to be paid up front.</p>
    <p>Buy stock, price it, and keep customers coming back. Grow from a kiosk into a business worth ${money0(GOALS[GOALS.length-1].nw)}.</p>
    <label for="nm" style="font-size:13px;color:var(--muted)">Name your store</label>
    <input type="text" id="nm" maxlength="32" placeholder="For example: Riverside Music Supply">
    <div class="acts"><button class="btn" id="bStart">Open for business</button></div>`);
  const go = () => {
    const n = $('#nm').value.trim() || 'Riverside Music Supply';
    const keep = S ? {act:S.act, help:S.help, restarts:(S.restarts || 0) + (again ? 1 : 0)} : null;
    const old = again && S ? `Started a new store "${n}" (the old one was worth ${money0(netWorth())} in week ${S.week})` : `Opened "${n}"`;
    S = newState(n); if (keep) Object.assign(S, keep);
    closeModal(); save('new store', old); render();
  };
  $('#bStart').onclick = go;
  $('#nm').onkeydown = e => { if (e.key === 'Enter') go(); };
}
function helpScreen(){
  showModal(`<h2>How to play</h2><ul>
    <li><b>Stock and prices.</b> You buy from the supplier and sell to customers. Price above other shops and fewer people buy. Price too low and you sell a lot but keep very little.</li>
    <li><b>Running out</b> turns customers away and hurts your reputation. <b>Overstocking</b> costs you 2% of the stock’s value every week to store and insure.</li>
    <li><b>Bigger orders</b> get supplier discounts, but every product you order costs $20 to ship.</li>
    <li><b>The bank</b> pays interest on savings and charges interest on loans, every week, on whatever the balance is.</li>
    <li><b>Offers</b> show up some weeks. Read them carefully: the best choice isn’t always the one that sounds best.</li>
    <li><b>Net worth</b> is your cash, savings and stock, minus anything you owe. Hit each goal to unlock new products and upgrades.</li>
    <li>Your store saves automatically. Stuck? Press <b>Ask my teacher</b>.</li></ul>
    <div class="acts"><button class="btn" data-close>Back to the store</button></div>`);
}
function newStoreScreen(){
  showModal(`<h2>Start a new store?</h2><p>Your current store, ${esc(S.name)}, will be closed for good and you’ll start again with ${money0(1500)}. Your teacher will see that you started over.</p>
    <div class="acts"><button class="btn line" data-close>Keep my store</button><button class="btn" id="bWipe">Start a new store</button></div>`);
  $('#bWipe').onclick = () => startScreen(true);
}

/* ================= Messages and help emails ================= */
let MSG = {unread:0, list:[]};
const siteURL = () => location.protocol === 'https:' ? location.origin + location.pathname : '';
const fmtWhen = t => new Date(t).toLocaleString('en-US', {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'});
async function fetchMsgs(){
  if (!TOKEN || DEMO) return MSG;
  try{ const r = await rpc('margin_get_messages', {p_token:TOKEN}); if (r.ok) MSG = {unread:+r.unread || 0, list:r.messages || []}; }catch(e){}
  updateBadge(); return MSG;
}
function updateBadge(){ const b = $('#msgBadge'); b.textContent = MSG.unread; b.hidden = !MSG.unread; }
setInterval(async () => { if (!TOKEN || DEMO) return; const before = MSG.unread; await fetchMsgs(); if (MSG.unread > before) flash('New message from your teacher. Press Ask my teacher to read it.'); }, 300000);

function storeSnapshot(){
  const lines = [
    `Store: ${S.name}, week ${S.week}`,
    `Cash ${money(S.cash)}, savings ${money(S.savings)}, loan ${money(S.loan)}, net worth ${money(netWorth())}, reputation ${Math.round(S.rep)}`,
    `Goal: ${GOALS[S.level] ? money0(GOALS[S.level].nw) + ' net worth' : 'all goals reached'}`,
    `Products (stock / his avg cost / supplier price / his price / other shops / sold last week):`,
    ...unlocked().map(d => { const p = S.products[d.id]; return `  ${d.name}: ${p.stock} / ${p.stock ? money(p.avgCost) : '-'} / ${money(p.cost)} / ${money(p.price)} / ${money(d.market)} / ${p.sold ?? '-'}`; })
  ];
  if (S.report) lines.push(`Last week: ${S.report.net >= 0 ? 'profit' : 'loss'} ${money(S.report.net)}, sales ${money(S.report.revenue)}, customers turned away ${S.report.turned}`);
  if (S.event){ const v = EVENTS[S.event.type].view(S.event); lines.push(`Offer on screen: ${v.title}. ${v.text}`, `  Choices: ${v.options.map(o => o.label).join(' | ')}`); }
  return lines.join('\n');
}
async function sendHelp(note){
  const k = today(); S.help[k] = (S.help[k] || 0) + 1;
  if (DEMO || !TOKEN) return 'saved';
  const where = `Week ${S.week}` + (S.event ? `, ${EVENTS[S.event.type].view(S.event).title}` : '');
  const msg = `His message: ${note}\n\n---- His store right now ----\n${storeSnapshot()}`;
  try{
    const r = await rpc('margin_help_request', {p_token:TOKEN, p_where:where, p_message:msg, p_student_view:note, p_site:siteURL()});
    save();
    if (r.error === 'limit') return 'limit';
    return r.emailed ? 'emailed' : 'saved';
  }catch(e){ return 'error'; }
}
function threadHTML(list, teacher){
  const replies = list.filter(m => m.kind === 'reply'), helps = list.filter(m => m.kind === 'help');
  if (!helps.length) return `<p class="muted">${teacher ? 'No help requests yet.' : 'No messages yet. When you ask your teacher something, the conversation shows up here.'}</p>`;
  return helps.map(h => {
    const rs = replies.filter(r => r.reply_to === h.id).sort((a,b) => a.created_at.localeCompare(b.created_at));
    return `<div class="thread">
      <div class="msg mine"><div class="mh">${teacher ? esc(h.name || 'Student') : 'You'}, ${fmtWhen(h.created_at)}${h.where_text ? `<span class="tag">${esc(h.where_text)}</span>` : ''}</div><div>${esc(h.body || '').replace(/\n/g,'<br>')}</div>
      ${teacher && h.teacher_body ? `<details class="tonly"><summary>His store at that moment (only you see this)</summary><pre>${esc(h.teacher_body)}</pre></details>` : ''}</div>
      ${rs.map(r => `<div class="msg theirs ${!teacher && !r.read_at ? 'new' : ''}"><div class="mh">${teacher ? 'You replied' : 'Your teacher'}, ${fmtWhen(r.created_at)}${!teacher && !r.read_at ? '<span class="tag gold">New</span>' : ''}${teacher ? (r.read_at ? '<span class="tag good">Read</span>' : '<span class="tag">Not read yet</span>') : ''}</div><div>${esc(r.body).replace(/\n/g,'<br>')}</div></div>`).join('')}
      ${teacher ? `<div class="replybox" data-for="${h.id}"><button class="btn small" data-reply="${h.id}">${rs.length ? 'Reply again' : 'Reply'}</button></div>` : (!rs.length ? `<p class="muted" style="font-size:13px;margin:4px 0 0 14px">Waiting for your teacher’s reply.</p>` : '')}
    </div>`;
  }).join('');
}
async function openDrawer(fromLogin){
  await fetchMsgs();
  const n = MSG.unread;
  $('#drawerBody').innerHTML = `${fromLogin && n ? `<div class="newbanner"><b>You have ${n} new message${n > 1 ? 's' : ''} from your teacher.</b></div>` : ''}
    <p class="muted" style="margin-top:0">Stuck on a decision, or not sure what something means? Ask here. Your teacher sees your store’s numbers along with your message, and the reply shows up here.</p>
    <textarea id="askMsg" rows="4" maxlength="600" placeholder="For example: Should I take the radio offer or not? I don’t get how to compare them."></textarea>
    <div style="margin-top:8px"><button class="btn small" id="askSend">Send to my teacher</button></div>
    <h4 style="margin:18px 0 0">Your conversations</h4>${threadHTML(MSG.list, false)}`;
  $('#askSend').onclick = async () => {
    const t = $('#askMsg').value.trim(); if (!t){ flash('Write your question first.'); return; }
    $('#askSend').disabled = true; $('#askSend').textContent = 'Sending…';
    const r = await sendHelp(t);
    if (r === 'limit'){ flash('You’ve used today’s messages. Ask your teacher in person.'); $('#askSend').disabled = false; $('#askSend').textContent = 'Send to my teacher'; return; }
    if (r === 'error'){ flash('Couldn’t send. Check the Wi-Fi and try again.'); $('#askSend').disabled = false; $('#askSend').textContent = 'Send to my teacher'; return; }
    flash(DEMO ? 'Demo mode: nothing was sent.' : 'Sent. The reply will show up here.'); openDrawer(false);
  };
  $('#drawer').classList.add('on'); $('#scrim').hidden = false;
  if (n && TOKEN && !DEMO){ try{ await rpc('margin_mark_read', {p_token:TOKEN}); MSG.unread = 0; updateBadge(); }catch(e){} }
}
function closeDrawer(){ $('#drawer').classList.remove('on'); $('#scrim').hidden = true; }

/* ================= Teacher view ================= */
let TPASS = '';
$('#teachLink').onclick = () => { const p = prompt('Teacher password (same as the school portal):'); if (!p) return; TPASS = p; loadTeacher(); };
async function loadTeacherMsgs(){ try{ const r = await rpc('margin_admin_messages', {p_pass:TPASS}); return r.ok ? r.messages : null; }catch(e){ return null; } }
function wireReplies(root, after){
  root.querySelectorAll('[data-reply]').forEach(b => b.onclick = () => {
    const id = +b.dataset.reply, box = root.querySelector(`.replybox[data-for="${id}"]`);
    box.innerHTML = `<textarea rows="4" maxlength="3000" placeholder="Write your reply. He’ll see it the next time he signs in."></textarea><div style="display:flex;gap:8px;margin-top:6px"><button class="btn small">Send reply</button><button class="btn small line">Cancel</button></div>`;
    const [send, cancel] = box.querySelectorAll('button'); box.querySelector('textarea').focus();
    cancel.onclick = () => after();
    send.onclick = async () => {
      const t = box.querySelector('textarea').value.trim(); if (!t){ flash('Write a reply first.'); return; }
      send.disabled = true; const r = await rpc('margin_admin_reply', {p_pass:TPASS, p_id:id, p_body:t});
      if (r.ok){ flash('Reply sent. He’ll see it the next time he signs in.'); after(); } else { flash('Couldn’t send. Check the password.'); send.disabled = false; }
    };
  });
}
async function fillTeacherMsgs(){
  const box = $('#tMsgs'); if (!box) return;
  const all = await loadTeacherMsgs(); if (!all){ box.innerHTML = '<p class="muted">Couldn’t load messages.</p>'; return; }
  box.innerHTML = threadHTML(all, true); wireReplies(box, fillTeacherMsgs);
  const waiting = all.filter(m => m.kind === 'help' && !all.some(r => r.reply_to === m.id)).length;
  $('#tTabMsgs').textContent = `Help requests${waiting ? ` (${waiting} waiting)` : ''}`;
}
function nwOf(st){ return st.cash + st.savings - st.loan + Object.values(st.products).reduce((a,p) => a + p.stock*p.avgCost, 0) - (st.payments || []).reduce((a,p) => a + p.amt*p.left, 0); }
async function loadTeacher(){
  try{
    const res = await rpc('margin_admin_data', {p_pass:TPASS});
    if (!res.ok){ alert('That password isn’t right.'); TPASS = ''; return; }
    const fmtT = t => t ? new Date(t).toLocaleString('en-US', {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}) : '';
    const wd = weekDates(), td = today();
    const rows = res.students.map(s => {
      const st = normState(s.state);
      if (!st) return `<tr><td><b>${esc(s.name)}</b></td><td colspan="9" class="muted">Signed in, hasn’t opened a store yet.</td><td>${fmtT(s.last_seen || s.updated_at)}</td><td><button class="link" data-reset="${esc(s.id)}" data-name="${esc(s.name)}">Reset</button></td></tr>`;
      const a = st.act[td] || {m:0, n:0};
      const wkN = wd.reduce((x,d) => x + ((st.act[d] || {}).n || 0), 0), wkM = Math.round(wd.reduce((x,d) => x + ((st.act[d] || {}).m || 0), 0)/60);
      const nw = nwOf(st), last = st.report;
      return `<tr>
        <td><b>${esc(s.name)}</b><div class="muted" style="font-size:12px">${esc(st.name)}${st.restarts ? `, started over ${st.restarts}×` : ''}</div></td>
        <td class="n">${st.week}</td>
        <td class="n">${money0(nw)}<div class="muted" style="font-size:12px">best ${money0(st.best || nw)}</div></td>
        <td class="n">${st.level} of ${GOALS.length}</td>
        <td class="n" style="color:${st.totalProfit >= 0 ? 'var(--gain)' : 'var(--loss)'}">${money0(st.totalProfit)}</td>
        <td class="n">${last ? `<span style="color:${last.net >= 0 ? 'var(--gain)' : 'var(--loss)'}">${money0(last.net)}</span>` : '—'}</td>
        <td class="n">${money0(st.loan)}</td>
        <td class="n">${Math.round(st.rep)}</td>
        <td class="n">${Math.round(a.m/60)} min, ${a.n} wk${st.help[td] ? `<br><span class="tag bad">${st.help[td]} help</span>` : ''}</td>
        <td class="n">${wkM} min, ${wkN} wk</td>
        <td>${fmtT(s.last_seen || s.updated_at)}</td>
        <td><button class="link" data-reset="${esc(s.id)}" data-name="${esc(s.name)}">Reset</button></td></tr>`;
    }).join('');
    await fetchLock();
    let em = {}; try{ em = await rpc('margin_admin_email_status', {p_pass:TPASS}); }catch(e){}
    const emState = em.effective_email && em.effective_key ? (em.shared ? `Emails are on, using Compound’s settings (${esc(em.effective_email)})` : 'Emails are on') : 'Emails are off until an address and Resend key are saved';
    $('#teacher').innerHTML = `<div class="twrap">
      <div class="thead"><h2>Margin, teacher view</h2><button class="ghost" id="tRefresh">Refresh</button><button class="ghost" id="tClose">Close</button></div>
      <div class="lockbar"><label class="switch"><input type="checkbox" id="lkOn" ${LOCK.on ? 'checked' : ''}><b id="lkState">${LOCK.on ? 'Daily lock on' : 'Daily lock off'}</b></label>
        <label>Closes <input type="time" id="lkClose" value="${LOCK.close}"></label><label>Reopens <input type="time" id="lkOpen" value="${LOCK.open}"></label>
        <button class="btn small" id="lkSave">Save</button><span class="muted" id="lkNow" style="font-size:12.5px">${isClosed() ? 'Closed right now' : 'Open right now'}</span></div>
      <div class="lockbar"><b>Help emails</b>
        <label>Send to <input type="email" id="emTo" value="${esc(em.teacher_email || '')}" placeholder="${em.shared && em.effective_email ? esc(em.effective_email) : 'you@example.com'}" style="width:220px"></label>
        <label>Resend key <input type="password" id="emKey" placeholder="${em.key_set ? 'Saved (leave blank to keep)' : em.shared && em.effective_key ? 'Using Compound’s key' : 're_…'}" style="width:200px"></label>
        <button class="btn small" id="emSave">Save</button><button class="btn small line" id="emTest">Send test email</button>
        <span class="muted" id="emState" style="font-size:12.5px">${emState}</span></div>
      <div class="tgrid">
        <div class="tcard"><table class="tbl"><tr><th>Student</th><th class="n">Game week</th><th class="n">Net worth</th><th class="n">Goals</th><th class="n">Total profit</th><th class="n">Last week</th><th class="n">Loan</th><th class="n">Reputation</th><th class="n">Today</th><th class="n">This week</th><th>Last active</th><th></th></tr>
          ${rows || `<tr><td colspan="12">No one has signed in to Margin yet. Students show up here after their first sign-in.</td></tr>`}</table>
          <p class="muted" style="font-size:12.5px;margin:10px 0 0">“wk” counts game weeks played. The activity log shows every decision he made: orders, offers he took or turned down, bank moves and each week’s result.</p></div>
        <div class="tcard"><div class="tabs"><button class="on" id="tTabMsgs">Help requests</button><button id="tTabLog">Activity log</button></div>
          <div id="tMsgs"><p class="muted">Loading…</p></div>
          <div id="tLogBox" hidden><table class="tbl"><tr><th>When</th><th>Student</th><th>Activity</th></tr>${res.log.map(l => `<tr><td style="white-space:nowrap">${fmtT(l.at)}</td><td>${esc(l.name || '')}</td><td>${esc(l.detail ? (l.event === 'offer' ? 'Offer: ' : '') + l.detail : l.event)}</td></tr>`).join('')}</table></div></div>
      </div></div>`;
    $('#lkOn').onchange = () => { $('#lkState').textContent = $('#lkOn').checked ? 'Daily lock on' : 'Daily lock off'; };
    $('#lkSave').onclick = async () => {
      const r = await rpc('margin_admin_set_settings', {p_pass:TPASS, p_lock_on:$('#lkOn').checked, p_close:$('#lkClose').value, p_open:$('#lkOpen').value});
      if (r.ok){ await fetchLock(); $('#lkNow').textContent = isClosed() ? 'Closed right now' : 'Open right now'; flash(LOCK.on ? `Saved. Closes at ${fmtT12(LOCK.close)}, reopens at ${fmtT12(LOCK.open)}.` : 'Saved. The daily lock is off.'); }
      else flash(r.error === 'time' ? 'Check the times and try again.' : 'Couldn’t save. Check the password.');
    };
    $('#emSave').onclick = async () => {
      const r = await rpc('margin_admin_set_email', {p_pass:TPASS, p_email:$('#emTo').value, p_key:$('#emKey').value});
      if (r.ok){ flash('Email settings saved.'); loadTeacher(); } else flash('Couldn’t save.');
    };
    $('#emTest').onclick = async () => { const r = await rpc('margin_admin_test_email', {p_pass:TPASS}); flash(r.sent ? 'Test sent. Check your inbox (and spam) in a minute.' : 'Not sent. Save your email and Resend key first, and turn on pg_net in Supabase.'); };
    $('#tTabMsgs').onclick = () => { $('#tTabMsgs').classList.add('on'); $('#tTabLog').classList.remove('on'); $('#tMsgs').hidden = false; $('#tLogBox').hidden = true; };
    $('#tTabLog').onclick = () => { $('#tTabLog').classList.add('on'); $('#tTabMsgs').classList.remove('on'); $('#tMsgs').hidden = true; $('#tLogBox').hidden = false; };
    fillTeacherMsgs();
    $('#tRefresh').onclick = loadTeacher;
    $('#tClose').onclick = () => { TPASS = ''; showOuter('signin'); setClosedView(); };
    document.querySelectorAll('[data-reset]').forEach(b => b.onclick = async () => {
      if (!confirm(`Erase ${b.dataset.name}’s store in Margin? He’ll start over with a new store.`)) return;
      const r = await rpc('margin_admin_reset', {p_pass:TPASS, p_student:b.dataset.reset}); flash(r.ok ? 'Store erased' : 'Couldn’t reset'); loadTeacher();
    });
    showOuter('teacher');
  }catch(e){ alert('Can’t reach the school server. Check the Wi-Fi and try again.'); }
}
async function renderReplyPage(id){
  showOuter('reply');
  if (!TPASS){
    $('#reply').innerHTML = `<div class="signwrap"><div class="card"><h3>Reply to your student</h3><p class="muted" style="margin:0">Enter your portal teacher password to open this help request.</p>
      <label class="fieldrow"><span>Teacher password</span><input type="password" id="rpPass"></label><p class="err" id="rpErr"></p><button class="btn" id="rpGo">Open</button></div></div>`;
    const go = async () => { TPASS = $('#rpPass').value; const m = await loadTeacherMsgs(); if (!m){ $('#rpErr').textContent = 'That password isn’t right.'; TPASS = ''; return; } renderReplyPage(id); };
    $('#rpGo').onclick = go; $('#rpPass').addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); $('#rpPass').focus(); return;
  }
  const all = await loadTeacherMsgs(); if (!all){ TPASS = ''; return renderReplyPage(id); }
  const h = all.find(m => m.id === id && m.kind === 'help');
  const list = h ? all.filter(m => m.id === id || m.reply_to === id) : [];
  $('#reply').innerHTML = `<div class="twrap" style="max-width:760px"><div class="tcard" style="max-height:none"><div style="display:flex;align-items:center;gap:10px"><h3 style="margin:0;font-family:'Barlow Condensed',sans-serif;font-size:24px">Help request</h3><span style="flex:1"></span><button class="ghost" id="rpAll">Open the Teacher view</button></div>
    ${h ? threadHTML(list, true) : `<p class="muted">This help request wasn’t found. It may be older than the last 80 messages.</p>`}</div></div>`;
  $('#rpAll').onclick = () => { history.replaceState(null, '', location.pathname); loadTeacher(); };
  wireReplies($('#reply'), () => renderReplyPage(id));
  const b = $('#reply').querySelector(`[data-reply="${id}"]`); if (b && !list.some(m => m.kind === 'reply')) b.click();
}

/* ================= Wiring ================= */
document.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.close !== undefined) return closeModal();
  if (!S) return;
  if (t.dataset.opt !== undefined) return resolveEvent(+t.dataset.opt);
  if (t.dataset.bank) return bank(t.dataset.bank);
  if (t.dataset.up) return buyUpgrade(t.dataset.up);
  if (t.id === 'bHelper'){ S.helper = !S.helper; save('helper', S.helper ? 'Hired a part-time helper' : 'Let the helper go'); render(); }
});
document.addEventListener('change', e => {
  const t = e.target; if (!S) return;
  if (t.dataset.price){ const v = r2(+t.value); S.products[t.dataset.price].price = v > 0 ? v : 0; t.value = S.products[t.dataset.price].price.toFixed(2); saveSoon(); }
  if (t.id === 'mkt'){ S.marketing = Math.max(0, Math.round(+t.value || 0)); t.value = S.marketing; saveSoon(); }
});
document.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.order !== undefined) updateOrderTotal(); });
$('#bOrder').onclick = placeOrder;
$('#bRun').onclick = () => { if (isClosed() && !DEMO) return closeForDay(); runWeek(); };
$('#bHelp').onclick = helpScreen;
$('#bNew').onclick = newStoreScreen;
$('#bOut').onclick = signOut;
$('#bMsg').onclick = () => openDrawer(false);
$('#drawerX').onclick = closeDrawer; $('#scrim').onclick = closeDrawer;
$('#inGo').onclick = signIn;
$('#inPin').addEventListener('keydown', e => { if (e.key === 'Enter') signIn(); });
$('#inName').addEventListener('keydown', e => { if (e.key === 'Enter') $('#inPin').focus(); });
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal' && S && !$('#bStart')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape'){ closeDrawer(); if (S && !$('#bStart')) closeModal(); } });
window.addEventListener('resize', () => S && document.body.dataset.mode === 'app' && drawChart());
window.addEventListener('pagehide', () => { if (TOKEN && !DEMO && S){ try{ rpc('margin_save', {p_token:TOKEN, p_state:S, p_event:null, p_detail:null}, true); rpc('margin_signout', {p_token:TOKEN}, true); }catch(e){} } });

window.addEventListener('load', async () => {
  const rm = location.hash.match(/^#reply=(\d+)$/); if (rm){ renderReplyPage(+rm[1]); return; }
  await Promise.race([fetchLock(), new Promise(r => setTimeout(r, 3000))]);
  if (DEMO){ NAME = 'Demo student'; S = newState('Riverside Music Supply'); showGame(); poke(); startScreen(); return; }
  showOuter('signin'); setClosedView(); if (!isClosed()) $('#inName').focus();
});
