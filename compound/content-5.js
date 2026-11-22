/* Weeks 16-20: Business basics; Income statements; Balance sheets; Break-even and pricing; Project: plan a small business */
const PRODUCTS = [["custom phone case","phone cases"],["hoodie","hoodies"],["gaming headset","headsets"],["bike light","bike lights"],["water bottle","water bottles"],["desk lamp","desk lamps"],["backpack","backpacks"],["keyboard","keyboards"]];
const kM = v => "$"+nf(v,2)+"M";

Object.assign(G, {
/* ---- Week 16: Business basics ---- */
bz_rev(rng){const p=pick(rng,PRODUCTS),pr=R(8,90)+pick(rng,[0,.5,.99]),q=R(40,900);
  return{q:`A shop sells ${q} ${p[1]} at ${$m(pr)} each. What is its revenue?`,ans:pr*q,unit:"$",hint:`Revenue = price × number sold.`,steps:[`${$m(pr)} × ${q} = ${$m(r2(pr*q))}`]}},
bz_profit(rng){const pr=R(10,60),v=r2(pr*R(30,80)/100),q=R(100,900),f=R(10,120)*50,rev=pr*q,tc=f+v*q;
  return{q:`A business sells ${q} units at ${$m(pr)}. Each unit costs ${$m(v)} to make, and fixed costs for the month are ${$m(f)}. What is its profit? (Negative for a loss.)`,ans:rev-tc,unit:"$",abs:.01,tol:.001,hint:`Revenue minus total cost. Total cost = fixed costs + variable cost per unit × units.`,steps:[`Revenue: ${$m(pr)} × ${q} = ${$m(rev)}`,`Total cost: ${$m(f)} + ${$m(v)} × ${q} = ${$m(r2(tc))}`,`Profit: ${$m(r2(rev-tc))}`]}},
bz_total_cost(rng){const v=R(2,40)+pick(rng,[0,.5]),q=R(50,2000),f=R(5,200)*50;
  return{q:`A factory's fixed costs are ${$m(f)} a month. Each unit has a variable cost of ${$m(v)}. What is the total cost of making ${q} units?`,ans:f+v*q,unit:"$",hint:`Total cost = fixed + variable per unit × units.`,steps:[`${$m(v)} × ${q} = ${$m(r2(v*q))}`,`+ ${$m(f)} = ${$m(r2(f+v*q))}`]}},
bz_avg_cost(rng){const v=R(2,30),f=R(10,200)*50,q=pick(rng,[100,200,250,400,500,800,1000]);
  return{q:`Fixed costs are ${$m(f)} and the variable cost is ${$m(v)} a unit. What is the average cost per unit at ${q} units?`,ans:(f+v*q)/q,unit:"$",tol:.002,hint:`Find the total cost, then divide by the number of units.`,steps:[`Total: ${$m(f)} + ${$m(v)} × ${q} = ${$m(f+v*q)}`,`÷ ${q} = ${$m(r2((f+v*q)/q))}`]}},
bz_fv_mc(rng){const k=R(0,7);const Q=[["rent for the workshop","Fixed"],["materials for each product","Variable"],["a yearly business license","Fixed"],["shipping each order","Variable"],["insurance for the store","Fixed"],["payment fees on each sale","Variable"],["a manager's monthly salary","Fixed"],["packaging for each unit","Variable"]][k];
  return{q:`For a small business, is ${Q[0]} usually a fixed cost or a variable cost?`,choices:["Fixed","Variable"],correct:Q[1]==="Fixed"?0:1,hint:`Fixed costs stay the same however much you sell. Variable costs rise with every unit.`,steps:[`${cap1(Q[0])}: ${Q[1].toLowerCase()}.`]}},
bz_markup_price(rng){const c=R(4,80)+pick(rng,[0,.5]),m=pick(rng,[25,40,50,60,75,100]);
  return{q:`A store buys a ${pick(rng,PRODUCTS)[0]} for ${$m(c)} and marks it up ${m}% on cost. What is the selling price?`,ans:c*(1+m/100),unit:"$",hint:`Markup is a percent of the cost, added on top of the cost.`,steps:[`Markup: ${$m(c)} × ${m/100} = ${$m(r2(c*m/100))}`,`Price: ${$m(c)} + ${$m(r2(c*m/100))} = ${$m(r2(c*(1+m/100)))}`]}},
bz_markup_pct(rng){const c=R(5,80),p=r2(c*(1+R(15,120)/100));
  return{q:`An item costs the store ${$m(c)} and sells for ${$m(p)}. What is the markup on cost? (One decimal.)`,ans:(p-c)/c*100,unit:"%",abs:.06,hint:`Markup % = (price − cost) ÷ cost.`,steps:[`${$m(p)} − ${$m(c)} = ${$m(r2(p-c))}`,`÷ ${$m(c)} = ${nf((p-c)/c*100,1)}%`]}},
bz_margin_pct(rng){const c=R(5,80),p=r2(c*(1+R(15,120)/100));
  return{q:`An item costs ${$m(c)} and sells for ${$m(p)}. What is the gross margin, as a percent of the selling price? (One decimal.)`,ans:(p-c)/p*100,unit:"%",abs:.06,hint:`Margin % = (price − cost) ÷ price. Note: divide by the price, not the cost.`,steps:[`${$m(p)} − ${$m(c)} = ${$m(r2(p-c))}`,`÷ ${$m(p)} = ${nf((p-c)/p*100,1)}%`]}},
bz_terms_mc(rng){const k=R(0,4);const Q=[
  ["Money a business brings in from sales, before any costs, is:","Revenue",["Revenue","Profit","Equity","Margin"]],
  ["Revenue minus all costs is:","Profit",["Profit","Revenue","Markup","Assets"]],
  ["A 50% markup on cost gives what margin on price?","About 33%",["About 33%","50%","100%","25%"]],
  ["As a business makes more units, its average fixed cost per unit:","Falls",["Falls","Rises","Stays the same","Becomes zero immediately"]],
  ["Which is the better first question for a new business idea?","Will customers pay more than it costs to make?",["Will customers pay more than it costs to make?","Can I get a logo?","How big can the office be?","What should the website color be?"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`Think about what each word measures.`,steps:[`${Q[1]}.`]}},

/* ---- Week 17: Income statements ---- */
is_gross(rng){const rev=R(50,900)/10,c=r2(rev*R(30,75)/100);
  return{q:`A company had revenue of ${kM(rev)} and cost of goods sold of ${kM(c)}. What is its gross profit, in millions?`,ans:rev-c,unit:"million",abs:.051,tol:0,hint:`Gross profit = revenue − cost of goods sold.`,steps:[`${kM(rev)} − ${kM(c)} = ${kM(rev-c)}`]}},
is_gm(rng){const rev=R(50,900)/10,c=r2(rev*R(30,75)/100);
  return{q:`Revenue was ${kM(rev)} and cost of goods sold was ${kM(c)}. What is the gross margin? (One decimal.)`,ans:(rev-c)/rev*100,unit:"%",abs:.11,hint:`Gross margin = gross profit ÷ revenue.`,steps:[`Gross profit: ${kM(rev-c)}`,`÷ ${kM(rev)} = ${nf((rev-c)/rev*100,1)}%`]}},
is_growth(rng){const a=R(50,500)/10,b=r2(a*(1+R(-20,40)/100));
  return{q:`A company's revenue went from ${kM(a)} last year to ${kM(b)} this year. What was its revenue growth? (One decimal. Negative if it shrank.)`,ans:(b-a)/a*100,unit:"%",abs:.11,hint:`Growth = (this year − last year) ÷ last year.`,steps:[`(${nf(b,1)} − ${nf(a,1)}) ÷ ${nf(a,1)} = ${nf((b-a)/a*100,1)}%`]}},
is_operating(rng){const gp=R(20,400)/10,sga=r2(gp*R(20,60)/100),rd=r2(gp*R(5,25)/100),dp=r2(gp*R(2,10)/100),op=gp-sga-rd-dp;
  return{q:`Gross profit is ${kM(gp)}. Operating expenses: salaries and overhead ${kM(sga)}, research ${kM(rd)}, depreciation ${kM(dp)}. What is operating income, in millions? (Negative for a loss.)`,ans:op,unit:"million",abs:.051,tol:0,hint:`Operating income = gross profit − operating expenses.`,steps:[`Operating expenses: ${kM(sga+rd+dp)}`,`${kM(gp)} − ${kM(sga+rd+dp)} = ${kM(op)}`]}},
is_depr(rng){const c=R(10,120)*500,s=Math.round(c*R(0,20)/100/100)*100,y=pick(rng,[3,4,5,8,10]);
  return{q:`A business buys a delivery van for ${$m(c)}. It expects to use it ${y} years and then sell it for ${$m(s)}. Using straight‑line depreciation, what is the depreciation expense each year?`,ans:(c-s)/y,unit:"$",hint:`Spread (cost − salvage value) evenly over the years.`,steps:[`${$m(c)} − ${$m(s)} = ${$m(c-s)}`,`÷ ${y} = ${$m(r2((c-s)/y))} a year`]}},
is_op_margin(rng){const rev=R(50,900)/10,op=r2(rev*R(-5,30)/100);
  return{q:`Revenue was ${kM(rev)} and operating income was ${kM(op)}. What is the operating margin? (One decimal. Negative for a loss.)`,ans:op/rev*100,unit:"%",abs:.11,hint:`Operating margin = operating income ÷ revenue.`,steps:[`${nf(op,1)} ÷ ${nf(rev,1)} = ${nf(op/rev*100,1)}%`]}},
is_net(rng){const op=R(20,300)/10,i=r2(op*R(2,15)/100),t=pick(rng,[21,25]),pre=op-i,tax=pre*t/100,ni=pre-tax;
  return{q:`Operating income is ${kM(op)}. Interest expense is ${kM(i)}. Income tax is ${t}% of pre‑tax income. What is net income, in millions? (Two decimals.)`,ans:ni,unit:"million",abs:.011,tol:0,hint:`Subtract interest to get pre‑tax income, take off the tax, and what's left is net income.`,steps:[`Pre‑tax: ${nf(op,2)} − ${nf(i,2)} = ${nf(pre,2)}`,`Tax: ${nf(pre,2)} × ${t/100} = ${nf(tax,2)}`,`Net income: ${nf(ni,2)}`]}},
is_net_margin(rng){const rev=R(50,900)/10,ni=r2(rev*R(2,20)/100);
  return{q:`A company had revenue of ${kM(rev)} and net income of ${kM(ni)}. What is its net profit margin? (One decimal.)`,ans:ni/rev*100,unit:"%",abs:.11,hint:`Net margin = net income ÷ revenue.`,steps:[`${nf(ni,1)} ÷ ${nf(rev,1)} = ${nf(ni/rev*100,1)}%`]}},
is_mc(rng){const k=R(0,5);const Q=[
  ["The top line of an income statement is:","Revenue",["Revenue","Net income","Assets","Equity"]],
  ["The bottom line of an income statement is:","Net income",["Net income","Revenue","Cost of goods sold","Cash"]],
  ["An income statement covers:","A period of time, like a quarter or a year",["A period of time, like a quarter or a year","A single moment","Only cash","Only debts"]],
  ["Cost of goods sold includes:","The direct cost of making the products sold",["The direct cost of making the products sold","The CEO's salary","Interest on loans","Income tax"]],
  ["Spreading the cost of equipment over its useful life is called:","Depreciation",["Depreciation","Dividends","Revenue","Inflation"]],
  ["A company can have high revenue and still lose money if:","Its costs are higher than its revenue",["Its costs are higher than its revenue","It sells too much","Its margin is positive","It pays no rent"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`Picture the income statement from top to bottom.`,steps:[`${Q[1]}.`]}},

/* ---- Week 18: Balance sheets ---- */
bs_equity(rng){const a=R(50,900)*1000,l=Math.round(a*R(10,90)/100/1000)*1000;
  return{q:`A business has assets of ${$m(a)} and liabilities of ${$m(l)}. What is its owners' equity?`,ans:a-l,unit:"$",hint:`Equity = assets − liabilities.`,steps:[`${$m(a)} − ${$m(l)} = ${$m(a-l)}`]}},
bs_assets(rng){const l=R(20,500)*1000,e=R(20,500)*1000;
  return{q:`A company's liabilities are ${$m(l)} and its owners' equity is ${$m(e)}. What are its total assets?`,ans:l+e,unit:"$",hint:`Assets = liabilities + equity. It always balances.`,steps:[`${$m(l)} + ${$m(e)} = ${$m(l+e)}`]}},
bs_networth(rng){const items=[["a car",R(4,20)*1000],["savings",R(1,30)*500],["investments",R(0,40)*500],["a laptop and gear",R(5,30)*100]],debts=[["a car loan",R(2,15)*1000],["a credit card",R(0,30)*100]];const A=items.reduce((x,y)=>x+y[1],0),D=debts.reduce((x,y)=>x+y[1],0);
  return{q:`A young worker owns ${items.map(i=>`${i[0]} worth ${$m(i[1])}`).join(", ")}. He owes ${debts.map(d=>`${$m(d[1])} on ${d[0]}`).join(" and ")}. What is his net worth? (Negative if he owes more than he owns.)`,ans:A-D,unit:"$",abs:.01,tol:0,hint:`A personal balance sheet works the same way: everything owned minus everything owed.`,steps:[`Assets: ${$m(A)}`,`Debts: ${$m(D)}`,`Net worth: ${$m(A-D)}`]}},
bs_classify_mc(rng){const k=R(0,8);const Q=[["cash in the bank","Asset"],["inventory waiting to be sold","Asset"],["money customers still owe the business","Asset"],["a bank loan","Liability"],["bills the business hasn't paid yet","Liability"],["the owners' investment in the business","Equity"],["a delivery truck","Asset"],["wages owed to workers","Liability"],["profits kept in the business over the years","Equity"]][k];
  return{q:`On a balance sheet, where does ${Q[0]} go?`,choices:["Asset","Liability","Equity"],correct:["Asset","Liability","Equity"].indexOf(Q[1]),hint:`Assets are things the business owns. Liabilities are what it owes others. Equity is what belongs to the owners.`,steps:[`${cap1(Q[0])}: ${Q[1].toLowerCase()}.`]}},
bs_working(rng){const ca=R(20,400)*1000,cl=Math.round(ca*R(30,140)/100/1000)*1000;
  return{q:`A company has current assets of ${$m(ca)} and current liabilities of ${$m(cl)}. What is its working capital? (Negative if short.)`,ans:ca-cl,unit:"$",abs:.01,tol:0,hint:`Working capital = current assets − current liabilities.`,steps:[`${$m(ca)} − ${$m(cl)} = ${$m(ca-cl)}`]}},
bs_current(rng){const ca=R(20,400)*1000,cl=Math.round(ca*R(30,140)/100/1000)*1000;
  return{q:`Current assets are ${$m(ca)} and current liabilities are ${$m(cl)}. What is the current ratio? (Two decimals.)`,ans:ca/cl,unit:"",abs:.006,hint:`Current ratio = current assets ÷ current liabilities.`,steps:[`${$m(ca)} ÷ ${$m(cl)} = ${nf(ca/cl,2)}`]}},
bs_de(rng){const l=R(10,600)*1000,e=R(50,600)*1000;
  return{q:`A company has total liabilities of ${$m(l)} and owners' equity of ${$m(e)}. What is its debt‑to‑equity ratio? (Two decimals.)`,ans:l/e,unit:"",abs:.006,hint:`Debt‑to‑equity = total liabilities ÷ equity.`,steps:[`${$m(l)} ÷ ${$m(e)} = ${nf(l/e,2)}`]}},
bs_book(rng){const e=R(20,900)/10,s=R(2,80);
  return{q:`A company's equity is ${kM(e)} and it has ${s} million shares. What is its book value per share?`,ans:e/s,unit:"$",tol:.003,hint:`Book value per share = equity ÷ shares.`,steps:[`${nf(e,1)} ÷ ${s} = ${$m(r2(e/s))}`]}},
bs_re(rng){const re=R(50,400)*1000,ni=R(-40,120)*1000,dv=ni>0?Math.round(ni*R(0,60)/100/1000)*1000:0;
  return{q:`Retained earnings started the year at ${$m(re)}. Net income for the year was ${$m(ni)}, and the company paid ${$m(dv)} in dividends. What are retained earnings at the end of the year?`,ans:re+ni-dv,unit:"$",hint:`Retained earnings grow by net income and shrink by dividends paid out.`,steps:[`${$m(re)} + ${$m(ni)} − ${$m(dv)} = ${$m(re+ni-dv)}`]}},

/* ---- Week 19: Break-even and pricing ---- */
be_cm(rng){const p=R(10,120)+pick(rng,[0,.5]),v=r2(p*R(20,75)/100);
  return{q:`A product sells for ${$m(p)} and costs ${$m(v)} in variable costs per unit. What is its contribution margin per unit?`,ans:p-v,unit:"$",hint:`Contribution margin = price − variable cost per unit.`,steps:[`${$m(p)} − ${$m(v)} = ${$m(r2(p-v))}`]}},
be_units(rng){const p=R(10,120),v=r2(p*R(20,75)/100),f=R(10,300)*50,n=Math.ceil(f/(p-v));
  return{q:`Fixed costs are ${$m(f)} a month. Each unit sells for ${$m(p)} and has a variable cost of ${$m(v)}. How many units must be sold to break even? (Round up.)`,ans:n,unit:"units",abs:0,tol:0,hint:`Break‑even units = fixed costs ÷ contribution margin per unit.`,steps:[`Contribution margin: ${$m(p)} − ${$m(v)} = ${$m(r2(p-v))}`,`${$m(f)} ÷ ${$m(r2(p-v))} = ${nf(f/(p-v),2)}`,`Round up: ${n} units`]}},
be_rev(rng){const p=R(10,120),v=r2(p*R(20,75)/100),f=R(10,300)*50,n=Math.ceil(f/(p-v));
  return{q:`Fixed costs are ${$m(f)}, the price is ${$m(p)} and the variable cost is ${$m(v)} a unit. What is the break‑even revenue, using the rounded‑up number of units?`,ans:n*p,unit:"$",hint:`Find break‑even units first (round up), then multiply by the price.`,steps:[`Units: ${$m(f)} ÷ ${$m(r2(p-v))} = ${nf(f/(p-v),2)} → ${n}`,`Revenue: ${n} × ${$m(p)} = ${$m(n*p)}`]}},
be_target(rng){const p=R(10,120),v=r2(p*R(20,75)/100),f=R(10,300)*50,t=R(4,60)*100,n=Math.ceil((f+t)/(p-v));
  return{q:`Fixed costs are ${$m(f)} a month, the price is ${$m(p)} and the variable cost is ${$m(v)}. How many units must be sold to make a profit of ${$m(t)}? (Round up.)`,ans:n,unit:"units",abs:0,tol:0,hint:`The contribution margin has to cover fixed costs plus the profit target.`,steps:[`(${$m(f)} + ${$m(t)}) ÷ ${$m(r2(p-v))} = ${nf((f+t)/(p-v),2)}`,`Round up: ${n} units`]}},
be_mos(rng){const p=R(10,120),v=r2(p*R(20,70)/100),f=R(10,300)*50,be=f/(p-v),s=Math.ceil(be*R(110,200)/100);
  return{q:`A business breaks even at ${nf(be,1)} units a month (fixed costs ÷ contribution margin). It actually sells ${s}. What is its margin of safety, as a percent of actual sales? (One decimal.)`,ans:(s-be)/s*100,unit:"%",abs:.11,hint:`Margin of safety = (actual − break‑even) ÷ actual. It shows how far sales could fall before a loss.`,steps:[`${s} − ${nf(be,1)} = ${nf(s-be,1)}`,`÷ ${s} = ${nf((s-be)/s*100,1)}%`]}},
pr_compare(rng){const p1=R(10,60),q1=R(200,900),dp=pick(rng,[-20,-10,10,20]),p2=r2(p1*(1+dp/100)),q2=Math.round(q1*(1-dp/100*pick(rng,[.5,1,1.5,2])));
  return{q:`At ${$m(p1)} a store sells ${q1} units a week. If it changes the price to ${$m(p2)}, it expects to sell ${q2}. How much does weekly revenue change? (Negative if it falls.)`,ans:p2*q2-p1*q1,unit:"$",abs:.01,tol:.001,hint:`Find revenue at each price, then subtract old from new.`,steps:[`Old: ${$m(p1)} × ${q1} = ${$m(p1*q1)}`,`New: ${$m(p2)} × ${q2} = ${$m(r2(p2*q2))}`,`Change: ${$m(r2(p2*q2-p1*q1))}`]}},
pr_best(rng){const v=R(4,20),opts=[0,1,2].map(i=>{const p=v+R(3,30);return[p,Math.max(20,Math.round(R(400,900)-(p-v)*R(10,25)))]}),prof=opts.map(o=>(o[0]-v)*o[1]),b=prof.indexOf(Math.max(...prof));
  return{q:`Each unit costs ${$m(v)} to make. A survey says: at ${$m(opts[0][0])} you'd sell ${opts[0][1]}, at ${$m(opts[1][0])} you'd sell ${opts[1][1]}, at ${$m(opts[2][0])} you'd sell ${opts[2][1]}. What is the largest profit (before fixed costs) you could make?`,ans:prof[b],unit:"$",hint:`For each price: (price − cost) × units. Pick the largest.`,steps:[...opts.map((o,i)=>`${$m(o[0])}: (${$m(o[0])} − ${$m(v)}) × ${o[1]} = ${$m(prof[i])}`),`Best: ${$m(prof[b])} at ${$m(opts[b][0])}`]}},
pr_discount(rng){const p=R(20,120),v=r2(p*R(30,60)/100),d=pick(rng,[10,15,20,25,30]),np=p*(1-d/100);
  return{q:`An item normally sells for ${$m(p)} and costs ${$m(v)}. During a ${d}%‑off sale, how much profit does the store make on each one? (Negative for a loss.)`,ans:np-v,unit:"$",abs:.01,tol:.002,hint:`Find the sale price first, then subtract the cost.`,steps:[`Sale price: ${$m(p)} × ${nf(1-d/100,2)} = ${$m(r2(np))}`,`Profit: ${$m(r2(np))} − ${$m(v)} = ${$m(r2(np-v))}`]}},
pr_mc(rng){const k=R(0,4);const Q=[
  ["If customers barely buy less when the price rises, raising the price usually:","Raises revenue",["Raises revenue","Lowers revenue","Has no effect on revenue","Lowers costs"]],
  ["If customers buy much less when the price rises, raising the price usually:","Lowers revenue",["Lowers revenue","Raises revenue","Doubles profit","Raises demand"]],
  ["Break‑even is the point where:","Total revenue equals total cost",["Total revenue equals total cost","Revenue is zero","Fixed costs are zero","Profit is highest"]],
  ["Contribution margin per unit is:","Price minus variable cost",["Price minus variable cost","Price minus fixed cost","Revenue minus profit","Cost plus markup"]],
  ["Lowering fixed costs does what to the break‑even point?","Lowers it",["Lowers it","Raises it","Nothing","Makes it negative"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`Think about price, quantity and cost together.`,steps:[`${Q[1]}.`]}},

/* ---- Week 20: Project ---- */
pj3_startup(rng){const t=R(15,60)*10,b=R(20,90)*10,s=R(5,30)*10,w=R(0,12)*10,l=pick(rng,[0,50,100]);
  return{q:`Your console‑repair business needs: tools ${$m(t)}, a starting stock of used parts ${$m(b)}, a used soldering station ${$m(s)}, a simple website ${$m(w)}, and a local business permit of ${$m(l)}. What are your total startup costs?`,ans:t+b+s+w+l,unit:"$",hint:`Add up everything you need before your first sale.`,steps:[`${[t,b,s,w,l].map(x=>$m(x)).join(" + ")} = ${$m(t+b+s+w+l)}`]}},
pj3_unit(rng){const c=R(40,140),pa=R(5,40),sh=R(8,20),fee=pick(rng,[5,8,10,13]),pr=R(Math.round((c+pa+sh)*1.3),Math.round((c+pa+sh)*1.9)),f=pr*fee/100,prof=pr-c-pa-sh-f;
  return{q:`You buy a broken console for ${$m(c)}, spend ${$m(pa)} on parts, and pay ${$m(sh)} to ship it to the buyer. You sell it online for ${$m(pr)}, and the site keeps a ${fee}% fee. What is your profit on that console?`,ans:prof,unit:"$",tol:.002,hint:`Every cost counts, including the site's fee on the sale price.`,steps:[`Fee: ${$m(pr)} × ${fee/100} = ${$m(r2(f))}`,`Costs: ${$m(c)} + ${$m(pa)} + ${$m(sh)} + ${$m(r2(f))} = ${$m(r2(c+pa+sh+f))}`,`Profit: ${$m(pr)} − ${$m(r2(c+pa+sh+f))} = ${$m(r2(prof))}`]}},
pj3_be(rng){const cm=R(25,90),f=R(4,30)*10;
  return{q:`Each refurbished console earns you ${$m(cm)} after its own costs. Your fixed costs (website, tools upkeep, phone) are ${$m(f)} a month. How many consoles must you sell each month to break even? (Round up.)`,ans:Math.ceil(f/cm),unit:"consoles",abs:0,tol:0,hint:`Fixed costs ÷ what each sale contributes.`,steps:[`${$m(f)} ÷ ${$m(cm)} = ${nf(f/cm,2)}`,`Round up: ${Math.ceil(f/cm)}`]}},
pj3_month(rng){const cm=R(25,90),f=R(4,30)*10,n=R(2,14);
  return{q:`Each console you sell contributes ${$m(cm)}. Fixed costs are ${$m(f)} a month. You sell ${n} this month. What is your profit for the month? (Negative for a loss.)`,ans:cm*n-f,unit:"$",abs:.01,tol:0,hint:`Total contribution minus fixed costs.`,steps:[`${n} × ${$m(cm)} = ${$m(cm*n)}`,`− ${$m(f)} = ${$m(cm*n-f)}`]}},
pj3_payback(rng){const s=R(30,200)*10,p=R(8,60)*10;
  return{q:`Your startup costs were ${$m(s)}. The business makes a profit of ${$m(p)} a month. How many months until you've earned back your startup costs? (Round up.)`,ans:Math.ceil(s/p),unit:"months",abs:0,tol:0,hint:`Startup cost ÷ monthly profit, rounded up.`,steps:[`${$m(s)} ÷ ${$m(p)} = ${nf(s/p,2)}`,`Round up: ${Math.ceil(s/p)} months`]}},
pj3_year(rng){const rev=R(40,200)*100,cogs=Math.round(rev*R(45,70)/100),fx=R(20,120)*10,dep=R(5,30)*10,pre=rev-cogs-fx-dep,se=Math.max(pre,0)*.153;
  return{q:`In its first year, your business had revenue of ${$m(rev)}, cost of goods sold of ${$m(cogs)}, other expenses of ${$m(fx)}, and depreciation on tools of ${$m(dep)}. Using the simplified 15.3% self‑employment tax from week 4 (and no other tax), what is your net income? (Negative for a loss; no tax on a loss.)`,ans:pre-se,unit:"$",tol:.002,abs:.01,hint:`Build the income statement: revenue − COGS = gross profit; minus expenses and depreciation = profit before tax; then take off 15.3% if it's positive.`,steps:[`Gross profit: ${$m(rev)} − ${$m(cogs)} = ${$m(rev-cogs)}`,`Before tax: − ${$m(fx)} − ${$m(dep)} = ${$m(pre)}`,`Tax: ${$m(r2(se))}`,`Net income: ${$m(r2(pre-se))}`]}},
pj3_mc(rng){const k=R(0,4);const Q=[
  ["Your console business sells 10 a month but needs 12 to break even. Which is a real fix?","Cut fixed costs or raise the contribution per console",["Cut fixed costs or raise the contribution per console","Ignore it; revenue looks good","Lower prices below cost","Take a payday loan each month"]],
  ["Before spending on a fancy website, what should you test first?","Whether people will actually buy at your price",["Whether people will actually buy at your price","Which logo color is best","How big your office should be","What to name your second store"]],
  ["Why keep business money separate from personal money?","So you can see the business's real profit",["So you can see the business's real profit","Banks require two cards","It raises revenue","It avoids all taxes"]],
  ["A competitor cuts prices below your cost. What's usually smartest?","Compete on quality and service, not by selling at a loss",["Compete on quality and service, not by selling at a loss","Cut your price below cost too","Quit immediately","Raise prices a lot"]],
  ["A self‑employed person should set aside money during the year because:","No employer withholds his taxes",["No employer withholds his taxes","Taxes are optional","He gets a W‑2","Banks pay his taxes"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`Use everything from this unit and week 4.`,steps:[`${Q[1]}.`]}}
});

/* ================= Week 16 ================= */
const W16 = {title:"Business basics: revenue, cost, profit", sub:"How a business makes money, one unit at a time", days:[
 {title:"Revenue and profit", desc:"What comes in, what goes out", steps:[
  {h:"The simplest equation in business", t:`<p>Every business, from a lemonade stand to a giant company, runs on the same equation.</p><div class="formula">Profit = revenue − costs</div><p><b>Revenue</b> is the money from sales. <b>Costs</b> are everything spent to make those sales happen.</p>`,
   b:()=>work("A hoodie shop, one month",["Sells 300 hoodies at $35","Revenue: 300 × $35 = $10,500","Costs: $8,200","Profit: $10,500 − $8,200 = $2,300"])},
  {h:"Revenue isn't profit", t:`<p>A business can have huge revenue and still lose money. Headlines often brag about sales; owners care about what's left after costs.</p>`,
   b:()=>work("Two shops",["Shop A: $1,000,000 revenue, $1,050,000 costs → −$50,000","Shop B: $200,000 revenue, $150,000 costs → +$50,000","The smaller shop is the better business"])},
  {h:"Kinds of costs", t:`<p><b>Fixed costs</b> stay the same however much you sell: rent, insurance, salaries. <b>Variable costs</b> rise with every unit: materials, packaging, shipping.</p>`,
   b:()=>`<div class="board"><h4>A hoodie shop's costs</h4><table><tr><th>Fixed (per month)</th><th>Variable (per hoodie)</th></tr><tr><td>Rent</td><td>Blank hoodie</td></tr><tr><td>Insurance</td><td>Printing</td></tr><tr><td>Website</td><td>Shipping bag</td></tr><tr><td>Manager's salary</td><td>Card payment fee</td></tr></table></div>`}
 ], practice:["bz_rev","bz_fv_mc","bz_profit","bz_terms_mc","bz_rev","bz_fv_mc","bz_profit","bz_rev","bz_profit","bz_fv_mc"]},
 {title:"Fixed and variable costs", desc:"Total cost and average cost", steps:[
  {h:"Total cost", t:`<div class="formula">Total cost = fixed costs + (variable cost per unit × units)</div><p>Fixed costs are there even if you sell nothing. Variable costs grow with each unit you make.</p>`,
   b:()=>work("$4,000 fixed, $12 a unit",["100 units: 4,000 + 1,200 = $5,200","500 units: 4,000 + 6,000 = $10,000","1,000 units: 4,000 + 12,000 = $16,000"])},
  {h:"Average cost", t:`<p>Divide total cost by the number of units to get the <b>average cost per unit</b>. As you make more, the fixed costs are spread over more units, and the average falls.</p><div class="formula">Average cost = total cost ÷ units</div>`,
   b:()=>{const q=[100,250,500,1000,2000];return `<div class="board"><h4>$4,000 fixed, $12 variable</h4>${barChart(q.map(x=>(4000+12*x)/x),q.map(String),v=>"$"+Math.round(v))}<div class="cap">Average cost per unit falls from $52 to $14.</div></div>`}},
  {h:"Economies of scale", t:`<p>That falling average cost is why big companies can often charge less: their fixed costs are spread over millions of units. It's called <b>economies of scale</b>.</p><p>It's also why a small business has to be careful about high fixed costs early on.</p>`,
   b:()=>work("The lesson for a new business",["Keep fixed costs low at first","Rent tools before buying","Grow fixed costs only as sales grow"])}
 ], practice:["bz_total_cost","bz_avg_cost","bz_fv_mc","bz_profit","bz_total_cost","bz_avg_cost","bz_terms_mc","bz_total_cost","bz_avg_cost","bz_profit"]},
 {title:"Markup and margin", desc:"Two ways to measure the same price", steps:[
  {h:"Markup", t:`<p>Stores often set prices by adding a <b>markup</b> to what the item cost them.</p><div class="formula">Price = cost × (1 + markup %)</div>`,
   b:()=>work("Cost $20, 50% markup",["Markup: $20 × 0.50 = $10","Price: $20 + $10 = $30"])},
  {h:"Margin", t:`<p><b>Gross margin</b> measures the same profit, but as a percent of the <b>price</b> instead of the cost.</p><div class="formula">Margin = (price − cost) ÷ price</div><p>Mixing them up is a classic business mistake.</p>`,
   b:()=>work("Cost $20, price $30",["Profit per item: $10","Markup: 10 ÷ 20 = 50%","Margin: 10 ÷ 30 = 33.3%","Same item, same $10, two different percents"])},
  {h:"Which to use", t:`<p>Buyers and store owners often think in markup. Investors and income statements use margin. Know which one someone means before you compare numbers.</p>`,
   b:()=>`<div class="board"><h4>Markup vs. margin</h4><table><tr><th>Markup</th><th>Margin</th></tr>${[25,50,100,200].map(m=>`<tr><td>${m}%</td><td>${nf(m/(100+m)*100,1)}%</td></tr>`).join("")}</table></div>`}
 ], practice:["bz_markup_price","bz_markup_pct","bz_margin_pct","bz_terms_mc","bz_markup_price","bz_margin_pct","bz_markup_pct","bz_markup_price","bz_margin_pct","bz_markup_pct"]},
 {quiz:true, title:"Week 16 quiz", desc:`10 questions, ${PASS_MARK}% opens week 17`, steps:[
  {h:"Before the quiz", t:`<p>10 questions from this week. No hints, one try each. You need ${PASS_MARK}% to open week 17.</p>`,
   b:()=>`<div class="board"><h4>From this week</h4><table><tr><td>Profit</td><td>revenue − costs</td></tr><tr><td>Total cost</td><td>fixed + variable × units</td></tr><tr><td>Average cost</td><td>total cost ÷ units</td></tr><tr><td>Markup</td><td>(price − cost) ÷ cost</td></tr><tr><td>Margin</td><td>(price − cost) ÷ price</td></tr></table></div>`}
 ], quizFrom:["bz_rev","bz_profit","bz_total_cost","bz_avg_cost","bz_fv_mc","bz_markup_price","bz_markup_pct","bz_margin_pct","bz_terms_mc","bz_profit","bz_margin_pct"]}
]};

/* ================= Week 17 ================= */
const W17 = {title:"Income statements", sub:"Reading a company's report card for a year", days:[
 {title:"From revenue to gross profit", desc:"The top of the income statement", steps:[
  {h:"The income statement", t:`<p>An <b>income statement</b>, also called a profit and loss statement, shows a company's revenue, costs and profit over a period, like a quarter or a year.</p><p>Revenue is the <b>top line</b>. Net income is the <b>bottom line</b>.</p>`,
   b:()=>`<div class="board"><h4>Income statement (in millions)</h4><table><tr><td>Revenue</td><td>$100.0</td></tr><tr><td>Cost of goods sold</td><td>−$60.0</td></tr><tr><td><b>Gross profit</b></td><td><b>$40.0</b></td></tr><tr><td>Operating expenses</td><td>−$25.0</td></tr><tr><td><b>Operating income</b></td><td><b>$15.0</b></td></tr><tr><td>Interest</td><td>−$2.0</td></tr><tr><td>Taxes (25%)</td><td>−$3.25</td></tr><tr><td><b>Net income</b></td><td><b>$9.75</b></td></tr></table></div>`},
  {h:"Gross profit", t:`<p><b>Cost of goods sold</b> (COGS) is the direct cost of the products sold: materials and the labor to make them. Subtract it from revenue to get gross profit.</p><div class="formula">Gross profit = revenue − COGS<br>Gross margin = gross profit ÷ revenue</div>`,
   b:()=>work("Revenue $100M, COGS $60M",["Gross profit: $40M","Gross margin: 40 ÷ 100 = 40%"])},
  {h:"Growth", t:`<p>Investors watch how fast revenue grows from year to year.</p><div class="formula">Growth = (this year − last year) ÷ last year</div><p>Growth with shrinking margins can be a warning: the company may be buying sales by cutting prices.</p>`,
   b:()=>work("Revenue $80M → $100M",["(100 − 80) ÷ 80 = 25% growth"])}
 ], practice:["is_gross","is_gm","is_growth","is_mc","is_gross","is_gm","is_growth","is_mc","is_gross","is_gm"]},
 {title:"Operating income", desc:"Running costs and depreciation", steps:[
  {h:"Operating expenses", t:`<p>Below gross profit come the costs of running the company: salaries for people who don't make the product, rent, marketing, research, and depreciation.</p><div class="formula">Operating income = gross profit − operating expenses</div>`,
   b:()=>work("Gross profit $40M",["Salaries and overhead: $18M","Research: $5M","Depreciation: $2M","Operating income: $15M"])},
  {h:"Depreciation", t:`<p>A delivery van lasts years, so it would be misleading to count its whole cost in the year it's bought. <b>Depreciation</b> spreads the cost over its useful life.</p><div class="formula">Straight‑line = (cost − salvage value) ÷ years</div>`,
   b:()=>work("A $40,000 van, 5 years, sold for $5,000 at the end",["(40,000 − 5,000) ÷ 5 = $7,000 a year","Each year's income statement shows $7,000 of depreciation"])},
  {h:"Operating margin", t:`<p><b>Operating margin</b> shows how much of each dollar of sales is left after the costs of running the business.</p><div class="formula">Operating margin = operating income ÷ revenue</div>`,
   b:()=>work("Operating income $15M on revenue $100M",["15 ÷ 100 = 15%","15 cents of every sales dollar is operating profit"])}
 ], practice:["is_operating","is_depr","is_op_margin","is_operating","is_depr","is_op_margin","is_mc","is_operating","is_depr","is_op_margin"]},
 {title:"The bottom line", desc:"Interest, taxes and net income", steps:[
  {h:"Interest and taxes", t:`<p>After operating income, subtract interest on the company's debts to get pre‑tax income. Then subtract income tax. What's left is <b>net income</b>.</p><div class="formula">Net income = (operating income − interest) × (1 − tax rate)</div>`,
   b:()=>work("Operating income $15M",["Interest: $2M → pre‑tax $13M","Tax at 25%: $3.25M","Net income: $9.75M"])},
  {h:"Net margin", t:`<div class="formula">Net margin = net income ÷ revenue</div><p>Grocery stores often earn only a few cents per dollar of sales; some software companies earn far more. Compare margins within an industry, not across them.</p>`,
   b:()=>work("Net income $9.75M on $100M",["9.75 ÷ 100 = 9.75% net margin"])},
  {h:"Back to EPS", t:`<p>Remember earnings per share from week 11? Net income is the "earnings." Divide by shares and you have EPS, the number behind the P/E ratio.</p>`,
   b:()=>work("$9.75M net income, 5M shares",["EPS: 9.75 ÷ 5 = $1.95","Stock at $39: P/E = 39 ÷ 1.95 = 20"])}
 ], practice:["is_net","is_net_margin","eps","is_mc","is_net","is_net_margin","eps","is_net","is_net_margin","is_mc"]},
 {quiz:true, title:"Week 17 quiz", desc:`10 questions, ${PASS_MARK}% opens week 18`, steps:[
  {h:"Before the quiz", t:`<p>10 questions from this week. No hints, one try each. You need ${PASS_MARK}% to open week 18.</p>`,
   b:()=>`<div class="board"><h4>From this week</h4><table><tr><td>Gross profit</td><td>revenue − COGS</td></tr><tr><td>Operating income</td><td>gross profit − operating expenses</td></tr><tr><td>Depreciation</td><td>(cost − salvage) ÷ years</td></tr><tr><td>Net income</td><td>(operating income − interest) − tax</td></tr><tr><td>Margins</td><td>each profit ÷ revenue</td></tr></table></div>`}
 ], quizFrom:["is_gross","is_gm","is_growth","is_operating","is_depr","is_op_margin","is_net","is_net_margin","is_mc","eps","is_net"]}
]};

/* ================= Week 18 ================= */
const W18 = {title:"Balance sheets", sub:"What a company owns, what it owes, and what's left for the owners", days:[
 {title:"Owns, owes, owners", desc:"Assets, liabilities and equity", steps:[
  {h:"A snapshot", t:`<p>An income statement covers a period. A <b>balance sheet</b> is a snapshot of one moment: everything the company owns and everything it owes.</p><div class="formula">Assets = liabilities + equity</div><p>It's called a balance sheet because the two sides always balance.</p>`,
   b:()=>`<div class="board"><h4>Balance sheet (simplified)</h4><table><tr><th>Assets</th><th></th><th>Liabilities and equity</th><th></th></tr><tr><td>Cash</td><td>$20,000</td><td>Bank loan</td><td>$30,000</td></tr><tr><td>Inventory</td><td>$15,000</td><td>Unpaid bills</td><td>$5,000</td></tr><tr><td>Equipment</td><td>$25,000</td><td>Owners' equity</td><td>$25,000</td></tr><tr><td><b>Total</b></td><td><b>$60,000</b></td><td><b>Total</b></td><td><b>$60,000</b></td></tr></table></div>`},
  {h:"Equity", t:`<p><b>Equity</b> is what would be left for the owners if the company sold everything and paid off every debt.</p><div class="formula">Equity = assets − liabilities</div>`,
   b:()=>work("The shop above",["Assets: $60,000","Liabilities: $35,000","Equity: $25,000"])},
  {h:"Your own balance sheet", t:`<p>People have balance sheets too. Everything you own minus everything you owe is your <b>net worth</b>. Building net worth slowly, year after year, is what the whole course has been about.</p>`,
   b:()=>work("A young worker",["Owns: car $9,000, savings $4,000, investments $3,000","Owes: car loan $6,000, card $500","Net worth: $16,000 − $6,500 = $9,500"])}
 ], practice:["bs_equity","bs_assets","bs_classify_mc","bs_networth","bs_equity","bs_classify_mc","bs_assets","bs_networth","bs_classify_mc","bs_equity"]},
 {title:"Can it pay its bills?", desc:"Current assets, current liabilities and liquidity", steps:[
  {h:"Current vs. long-term", t:`<p><b>Current assets</b> turn into cash within a year: cash, inventory, money customers owe. <b>Current liabilities</b> must be paid within a year: bills, wages, loan payments due soon.</p>`,
   b:()=>work("Sorting the shop",["Current assets: cash, inventory, money owed by customers","Long‑term assets: equipment, buildings","Current liabilities: unpaid bills, wages owed","Long‑term liabilities: a 5‑year loan"])},
  {h:"Working capital", t:`<div class="formula">Working capital = current assets − current liabilities<br>Current ratio = current assets ÷ current liabilities</div><p>A current ratio below 1 means the company owes more in the next year than it can easily raise. That's a warning sign, even for a profitable company.</p>`,
   b:()=>work("Current assets $35,000, current liabilities $20,000",["Working capital: $15,000","Current ratio: 35 ÷ 20 = 1.75"])},
  {h:"Profitable but broke", t:`<p>A business can show a profit on its income statement and still run out of cash: customers pay late, inventory piles up, bills come due. That's why owners watch the balance sheet, not just profit.</p>`,
   b:()=>work("A growing shop",["Sold $50,000 this month on credit","Customers will pay in 60 days","Rent and wages are due now","Profitable on paper, short on cash today"])}
 ], practice:["bs_working","bs_current","bs_classify_mc","bs_working","bs_current","bs_equity","bs_working","bs_current","bs_classify_mc","bs_current"]},
 {title:"Debt and book value", desc:"Leverage, book value and retained earnings", steps:[
  {h:"Leverage", t:`<p>Borrowing lets a company grow faster, but it adds risk. <b>Debt‑to‑equity</b> shows how much the company relies on borrowed money.</p><div class="formula">Debt‑to‑equity = total liabilities ÷ equity</div><p>Higher means more risk if business slows down.</p>`,
   b:()=>work("Two companies, $100,000 of assets each",["A: $20,000 debt, $80,000 equity → 0.25","B: $80,000 debt, $20,000 equity → 4.0","A 20% drop in assets wipes out all of B's equity"])},
  {h:"Book value", t:`<p><b>Book value per share</b> is equity divided by the number of shares: what each share is worth on the company's books. Compare it with the market price from week 10.</p><div class="formula">Book value per share = equity ÷ shares</div>`,
   b:()=>work("Equity $50M, 10M shares",["Book value: $5 a share","Stock trades at $15: investors value it at 3 times book"])},
  {h:"Retained earnings", t:`<p>Profits the company keeps instead of paying out as dividends build up as <b>retained earnings</b>, part of equity. This is how the income statement and the balance sheet connect.</p><div class="formula">End retained earnings = start + net income − dividends</div>`,
   b:()=>work("One year",["Start: $200,000","Net income: +$60,000","Dividends: −$20,000","End: $240,000"])}
 ], practice:["bs_de","bs_book","bs_re","bs_de","bs_book","bs_re","bs_classify_mc","bs_de","bs_re","bs_book"]},
 {quiz:true, title:"Week 18 quiz", desc:`10 questions, ${PASS_MARK}% opens week 19`, steps:[
  {h:"Before the quiz", t:`<p>10 questions from this week. No hints, one try each. You need ${PASS_MARK}% to open week 19.</p>`,
   b:()=>`<div class="board"><h4>From this week</h4><table><tr><td>Balance</td><td>assets = liabilities + equity</td></tr><tr><td>Working capital</td><td>current assets − current liabilities</td></tr><tr><td>Current ratio</td><td>current assets ÷ current liabilities</td></tr><tr><td>Debt‑to‑equity</td><td>liabilities ÷ equity</td></tr><tr><td>Retained earnings</td><td>start + net income − dividends</td></tr></table></div>`}
 ], quizFrom:["bs_equity","bs_assets","bs_networth","bs_classify_mc","bs_working","bs_current","bs_de","bs_book","bs_re","bs_classify_mc","bs_equity"]}
]};

/* ================= Week 19 ================= */
const W19 = {title:"Break‑even and pricing", sub:"How many you need to sell, and what to charge", days:[
 {title:"Break-even", desc:"Contribution margin and the break‑even point", steps:[
  {h:"Contribution margin", t:`<p>Each sale brings in the price but costs the variable cost. What's left <b>contributes</b> toward paying fixed costs, and then toward profit.</p><div class="formula">Contribution margin = price − variable cost</div>`,
   b:()=>work("A $30 hoodie",["Variable cost: $12","Contribution margin: $18","Each sale chips $18 off the fixed costs"])},
  {h:"The break-even point", t:`<p>Break‑even is where revenue exactly covers all costs: zero profit, zero loss.</p><div class="formula">Break‑even units = fixed costs ÷ contribution margin</div><p>Always round up: you can't sell part of a hoodie.</p>`,
   b:()=>work("$4,500 fixed costs, $18 margin",["4,500 ÷ 18 = 250 hoodies","Sell 249: small loss","Sell 251: small profit"])},
  {h:"Seeing it", t:`<p>On a chart, total cost starts at the fixed costs and rises slowly. Revenue starts at zero and rises faster. Where they cross is break‑even.</p>`,
   b:()=>{const q=[...Array(11).keys()].map(i=>i*50);return `<div class="board"><h4>$4,500 fixed, $12 variable, $30 price</h4>${lineChart([{vals:q.map(x=>30*x),label:"Revenue",color:"var(--note)"},{vals:q.map(x=>4500+12*x),label:"Total cost",color:"var(--bad)"}],q.map(x=>x%100===0?String(x):""),kFmt)}<div class="cap">The lines cross at 250 units.</div></div>`}}
 ], practice:["be_cm","be_units","be_rev","pr_mc","be_cm","be_units","be_rev","be_units","be_cm","be_rev"]},
 {title:"Pricing and demand", desc:"How price changes what people buy", steps:[
  {h:"The demand trade-off", t:`<p>Raise the price and you earn more per sale, but usually sell fewer. Lower it and you sell more, but earn less on each. The right price depends on how sensitive your customers are.</p>`,
   b:()=>work("A $20 item selling 500 a week",["Raise to $24, sell 450: revenue $10,800 (was $10,000)","Raise to $24, sell 350: revenue $8,400","Same price change, different customers, different result"])},
  {h:"Elasticity in plain words", t:`<p>When customers barely react to price (few substitutes, a necessity), demand is <b>inelastic</b>, and raising prices raises revenue. When they react a lot (many substitutes), demand is <b>elastic</b>, and raising prices lowers revenue.</p>`,
   b:()=>work("Examples",["Inelastic: insulin, electricity, gasoline in the short run","Elastic: one brand of soda, a movie ticket, a specific video game"])},
  {h:"Profit, not revenue", t:`<p>The best price isn't the one with the most revenue; it's the one with the most <b>profit</b>. For each possible price, compare (price − cost) × units sold.</p>`,
   b:()=>`<div class="board"><h4>Cost $8 a unit</h4><table><tr><th>Price</th><th>Units</th><th>Revenue</th><th>Profit</th></tr>${[[14,600],[18,480],[22,330],[26,200]].map(([p,u])=>`<tr><td>$${p}</td><td>${u}</td><td>${$m(p*u)}</td><td>${$m((p-8)*u)}</td></tr>`).join("")}</table><div class="cap">$18 earns the most profit, though $22 isn't far behind.</div></div>`}
 ], practice:["pr_compare","pr_best","pr_mc","pr_discount","pr_compare","pr_best","pr_discount","pr_compare","pr_best","pr_mc"]},
 {title:"Targets and what-ifs", desc:"Profit goals, discounts and margin of safety", steps:[
  {h:"A profit target", t:`<p>To earn a target profit, the contribution margin must cover the fixed costs <b>and</b> the target.</p><div class="formula">Units = (fixed costs + target profit) ÷ contribution margin</div>`,
   b:()=>work("$4,500 fixed, $18 margin, $1,800 target",["(4,500 + 1,800) ÷ 18 = 350 hoodies"])},
  {h:"The danger of discounts", t:`<p>A 25% sale doesn't cut profit by 25%. It can cut it by much more, because the whole discount comes out of the margin.</p>`,
   b:()=>work("$30 hoodie, $12 cost",["Normal profit: $18","25% off: price $22.50, profit $10.50","Profit per hoodie fell 42%","He must sell 71% more to earn the same"])},
  {h:"Margin of safety", t:`<p>How far could sales fall before you start losing money? That cushion is the <b>margin of safety</b>.</p><div class="formula">Margin of safety = (actual sales − break‑even) ÷ actual sales</div>`,
   b:()=>work("Break‑even 250, selling 400",["(400 − 250) ÷ 400 = 37.5%","Sales could fall 37.5% before a loss"])}
 ], practice:["be_target","pr_discount","be_mos","be_target","be_units","be_mos","pr_discount","be_target","be_mos","pr_mc"]},
 {quiz:true, title:"Week 19 quiz", desc:`10 questions, ${PASS_MARK}% opens week 20`, steps:[
  {h:"Before the quiz", t:`<p>10 questions from this week. No hints, one try each. You need ${PASS_MARK}% to open week 20.</p>`,
   b:()=>`<div class="board"><h4>From this week</h4><table><tr><td>Contribution margin</td><td>price − variable cost</td></tr><tr><td>Break‑even units</td><td>fixed ÷ contribution margin</td></tr><tr><td>Target units</td><td>(fixed + target) ÷ contribution margin</td></tr><tr><td>Margin of safety</td><td>(actual − break‑even) ÷ actual</td></tr></table></div>`}
 ], quizFrom:["be_cm","be_units","be_rev","be_target","be_mos","pr_compare","pr_best","pr_discount","pr_mc","be_units","be_target"]}
]};

/* ================= Week 20: Project ================= */
const W20 = {title:"Project: plan a small business", sub:"A console‑repair and resale business, from first dollar to first year", days:[
 {title:"Startup and unit costs", desc:"What it takes to open, and what each sale earns", steps:[
  {h:"The project", t:`<p>This week you'll plan a real small business: buying broken game consoles, repairing them, and reselling them online. You'll use everything from weeks 16 to 19, plus taxes from week 4.</p>`,
   b:()=>work("The plan, step by step",["1. Startup costs","2. Profit on each console","3. Break‑even and monthly profit","4. First‑year income statement"])},
  {h:"Startup costs", t:`<p>Before your first sale you need tools, a stock of parts, and a way to sell. Keep this number low: every startup dollar has to be earned back before you're really ahead.</p>`,
   b:()=>work("A lean start",["Repair tools: $250","Starting parts: $400","Used soldering station: $120","Website: $60","Total: $830"])},
  {h:"Profit per console", t:`<p>Count <b>every</b> cost on each sale: the broken console, parts, shipping, and the selling site's fee, which is a percent of the price.</p>`,
   b:()=>work("One console",["Bought broken: $85","Parts: $20, shipping: $14","Sold for $199; site fee 10%: $19.90","Profit: 199 − 85 − 20 − 14 − 19.90 = $60.10"])}
 ], practice:["pj3_startup","pj3_unit","bz_markup_price","pj3_unit","pj3_startup","bz_margin_pct","pj3_unit","pj3_startup","pj3_unit","bz_markup_pct"]},
 {title:"Break-even and payback", desc:"Monthly targets and earning back your start", steps:[
  {h:"Monthly break-even", t:`<p>Your fixed costs each month (website, phone, tool upkeep) must be covered before you profit. Use the break‑even formula with the profit each console contributes.</p>`,
   b:()=>work("$60 per console, $150 fixed a month",["150 ÷ 60 = 2.5 → 3 consoles to break even","Selling 8: 8 × 60 − 150 = $330 profit"])},
  {h:"Payback", t:`<p>How long until the business has earned back your startup costs?</p><div class="formula">Payback = startup costs ÷ monthly profit</div>`,
   b:()=>work("$830 startup, $330 a month",["830 ÷ 330 = 2.5 → 3 months","After that, profit is truly yours"])},
  {h:"Growing carefully", t:`<p>Once the business works, you can grow: more consoles, better tools, maybe a helper. Grow fixed costs only after sales prove they can carry them, and watch your margin of safety.</p>`,
   b:()=>{const n=[2,4,6,8,10,12];return `<div class="board"><h4>Monthly profit, $60 per console, $150 fixed</h4>${barChart(n.map(x=>Math.max(0,60*x-150)),n.map(String),v=>"$"+Math.round(v))}<div class="cap">Consoles sold per month along the bottom. Two sales a month is a loss of $30.</div></div>`}}
 ], practice:["pj3_be","pj3_month","pj3_payback","be_mos","pj3_be","pj3_month","pj3_payback","pj3_mc","pj3_month","pj3_payback"]},
 {title:"The first-year report", desc:"An income statement and taxes for your business", steps:[
  {h:"Your income statement", t:`<p>At the end of the year, build the same income statement a big company uses: revenue, cost of goods sold, gross profit, expenses, depreciation, and profit before tax.</p>`,
   b:()=>`<div class="board"><h4>Year one</h4><table><tr><td>Revenue (96 consoles)</td><td>$19,104</td></tr><tr><td>Cost of goods sold (consoles, parts, shipping, fees)</td><td>−$13,334.40</td></tr><tr><td><b>Gross profit</b></td><td><b>$5,769.60</b></td></tr><tr><td>Fixed expenses</td><td>−$1,800</td></tr><tr><td>Depreciation on tools</td><td>−$120</td></tr><tr><td><b>Profit before tax</b></td><td><b>$3,849.60</b></td></tr></table></div>`},
  {h:"Taxes for the self-employed", t:`<p>No employer withholds tax for you. In this course we use the simplified 15.3% self‑employment tax from week 4. Real business owners usually owe income tax too, and they set money aside all year so tax time isn't a shock.</p>`,
   b:()=>work("Profit $3,849.60",["Self‑employment tax: 3,849.60 × 0.153 = $588.99","Net income: $3,260.61","Set aside about a quarter of every month's profit for taxes"])},
  {h:"The plan on one page", t:`<p>A business plan doesn't need to be long. It needs to answer: what do you sell, who buys it, what does each sale earn, how many do you need, and how long until you've earned back your start?</p>`,
   b:()=>work("One‑page plan",["Product: refurbished consoles, tested and guaranteed","Customers: gamers who want a deal","Profit per sale: about $60","Break‑even: 3 a month; payback: 3 months","Rules: separate business account, save for taxes, grow slowly"])}
 ], practice:["pj3_year","pj3_mc","self_emp","pj3_year","pj3_mc","is_net_margin","pj3_year","pj3_mc","self_emp","pj3_year"]},
 {quiz:true, title:"Week 20 quiz", desc:`10 questions on unit 4, ${PASS_MARK}% opens week 21`, steps:[
  {h:"Before the quiz", t:`<p>This quiz covers the whole Business unit, weeks 16 through 20. No hints, one try each. You need ${PASS_MARK}% to open week 21 and finish unit 4.</p>`,
   b:()=>`<div class="board"><h4>Unit 4 in one table</h4><table><tr><td>Profit</td><td>revenue − costs</td></tr><tr><td>Margins</td><td>profit ÷ revenue</td></tr><tr><td>Balance sheet</td><td>assets = liabilities + equity</td></tr><tr><td>Break‑even</td><td>fixed ÷ contribution margin</td></tr><tr><td>Payback</td><td>startup ÷ monthly profit</td></tr></table></div>`}
 ], quizFrom:["bz_profit","bz_margin_pct","is_net","is_depr","bs_equity","bs_current","be_units","be_target","pj3_unit","pj3_payback","pj3_mc"]}
]};
addWeek(16,W16); addWeek(17,W17); addWeek(18,W18); addWeek(19,W19); addWeek(20,W20);

Object.assign(DIVES, {
"16-1": {title:"The moving assembly line", sections:[
  ["Twelve hours a car","In the early 1900s, cars were built one at a time by teams of workers. Henry Ford's Model T took about 12 hours to assemble, and cars were a luxury."],
  ["Bring the work to the worker","In 1913, Ford introduced a moving assembly line: the car moved past workers, each doing one task. Assembly time fell to about an hour and a half."],
  ["Cheaper every year","Making cars faster spread Ford's fixed costs over far more cars, so the cost of each one fell. Ford cut the price of the Model T again and again, and millions of families could afford a car. It's economies of scale in action."]],
 qs:[{q:"In what year did Ford introduce the moving assembly line?",choices:["1913","1776","1950","2001"],why:"It began in 1913."},
     {q:"About how long did it take to assemble a Model T after the change?",choices:["About an hour and a half","About 12 hours","About a week","About 5 minutes"],why:"It fell from about 12 hours to about 90 minutes."},
     {q:"Why could Ford keep lowering prices?",choices:["Fixed costs were spread over many more cars","Steel became free","Workers were paid nothing","The government paid for the cars"],why:"Economies of scale lowered the cost per car."}]},
"16-2": {title:"The five-dollar day", sections:[
  ["A costly problem","The assembly line was fast but boring, and workers quit constantly. Ford had to hire and train enormous numbers of new workers every year, an expensive hidden cost."],
  ["Doubling pay","In 1914, Ford announced it would pay most workers $5 a day, about double the usual wage. Thousands of people lined up for jobs."],
  ["Was it worth it?","Workers stayed longer, so training costs fell and productivity rose. A cost that looked huge on paper saved money elsewhere. Smart businesses look at total cost, not just one line."]],
 qs:[{q:"What did Ford announce in 1914?",choices:["A $5 daily wage","A 4‑day week","Free cars for workers","The end of the assembly line"],why:"About double the usual pay."},
     {q:"What problem was the higher wage meant to fix?",choices:["Workers quitting constantly","Too few customers","High steel prices","Taxes"],why:"Turnover was costly."},
     {q:"What's the business lesson?",choices:["Look at total cost, not just one line","Always pay the least possible","Never train workers","Raise prices first"],why:"Higher pay lowered other costs."}]},
"16-3": {title:"Why bigger can be cheaper", sections:[
  ["Spreading the fixed","A factory, a website or a design costs the same whether you make one product or a million. Big companies spread those fixed costs over so many units that each unit carries only a tiny share."],
  ["Buying power","Large companies also buy materials in huge amounts and can negotiate lower prices. Small shops pay more for the same parts."],
  ["Where small wins","Small businesses can't usually win on price. They win on service, speed, quality, or serving customers big companies ignore. Knowing where you can compete is part of every business plan."]],
 qs:[{q:"Why can big companies often charge less?",choices:["Their fixed costs are spread over many units","They pay no rent","Their products are worse","They ignore costs"],why:"Economies of scale."},
     {q:"Large companies also get lower prices by:",choices:["Buying materials in huge amounts","Paying late","Selling less","Avoiding suppliers"],why:"Bulk buying gives bargaining power."},
     {q:"Where can small businesses usually compete best?",choices:["Service, quality and speed","Lowest price","Biggest factories","Most advertising"],why:"They usually can't win on price alone."}]},
"17-1": {title:"The father of accounting", sections:[
  ["Venetian merchants","Merchants in Venice and other Italian cities kept careful records of every trade. Over time they developed a system where each transaction is written down twice, once as where money came from and once as where it went."],
  ["Pacioli's book","In 1494, the mathematician Luca Pacioli published a huge math book that included the first widely printed description of this double‑entry bookkeeping. He's often called the father of accounting."],
  ["Still in use","Every income statement and balance sheet today rests on that same system. Because every entry has two sides, mistakes show up when the books don't balance."]],
 qs:[{q:"Who published the first widely printed description of double‑entry bookkeeping?",choices:["Luca Pacioli","Henry Ford","Benjamin Graham","Alexander Hamilton"],why:"Pacioli published it in 1494."},
     {q:"In double‑entry bookkeeping, each transaction is recorded:",choices:["Twice","Once","Never","Only at year end"],why:"Once for where money came from and once for where it went."},
     {q:"Why does double entry help catch mistakes?",choices:["The books won't balance if something is wrong","It hides errors","It removes the need for math","It's required by banks only"],why:"The two sides must match."}]},
"17-2": {title:"Growing before profiting", sections:[
  ["Years of losses","Amazon became a public company in 1997, but for years it reported losses or tiny profits. Its first full‑year profit came in 2003."],
  ["On purpose","The company spent heavily on warehouses, technology and lower prices to grow. Its revenue soared while its bottom line stayed thin."],
  ["Reading the signs","Losses aren't always bad, and profits aren't always good. Investors read the whole income statement: is revenue growing, are gross margins healthy, and is the spending building something that will pay off later?"]],
 qs:[{q:"When did Amazon report its first full‑year profit?",choices:["2003","1997","1980","2020"],why:"Its first full‑year profit came in 2003."},
     {q:"Why did Amazon have losses for years?",choices:["It spent heavily to grow","It had no customers","It sold nothing","It paid no taxes"],why:"It invested in growth."},
     {q:"What does the reading suggest about losses?",choices:["Read the whole income statement before judging","All losses are bad","Losses never matter","Only revenue counts"],why:"Context matters."}]},
"17-3": {title:"When the numbers lie", sections:[
  ["A star company","In the late 1990s, Enron was one of the most admired energy companies in America, with soaring reported profits."],
  ["Hidden debts","Its executives used complicated accounting tricks to hide debts and inflate profits. When the truth came out in 2001, the company collapsed into bankruptcy, and thousands of employees lost their jobs and retirement savings."],
  ["New rules","In 2002, Congress passed the Sarbanes‑Oxley Act. Among other things, top executives must now personally certify that their financial statements are accurate. Honest numbers are the foundation of every market."]],
 qs:[{q:"Enron collapsed into bankruptcy in:",choices:["2001","1929","2008","1990"],why:"The collapse came in late 2001."},
     {q:"What did Enron's executives do?",choices:["Hid debts and inflated profits","Paid too much tax","Sold too cheaply","Kept perfect books"],why:"They used accounting tricks."},
     {q:"What does the Sarbanes‑Oxley Act require of top executives?",choices:["Certify their financial statements are accurate","Work for free","Sell their shares","Avoid all debt"],why:"They personally sign off on the numbers."}]},
"18-1": {title:"Why it always balances", sections:[
  ["Two views of the same things","The left side of a balance sheet lists what the business has. The right side lists who has a claim on it: lenders (liabilities) and owners (equity). They're two views of the same pile, so they must be equal."],
  ["Every move keeps the balance","Borrow $1,000 and cash goes up by $1,000 while loans go up by $1,000. Buy a $500 tool with cash and one asset swaps for another. The sides stay equal after every transaction."],
  ["A check on the math","If a balance sheet doesn't balance, something was recorded wrong. That built‑in check is part of what makes accounting trustworthy."]],
 qs:[{q:"Why must a balance sheet balance?",choices:["Both sides describe the same assets from two views","It's a coincidence","Accountants round the numbers","Banks require it once a year"],why:"What it has equals who has claims on it."},
     {q:"Borrowing $1,000 in cash:",choices:["Raises assets and liabilities by $1,000","Raises equity by $1,000","Lowers assets","Changes nothing"],why:"Cash up, loan up."},
     {q:"A balance sheet that doesn't balance means:",choices:["Something was recorded wrong","The company is rich","The company is broke","Taxes are due"],why:"It's a built‑in error check."}]},
"18-2": {title:"Too much leverage", sections:[
  ["A giant bank","Lehman Brothers was one of the largest investment banks in the United States, more than 150 years old."],
  ["Thin equity","By 2007, Lehman held roughly $30 of assets for every $1 of equity. With leverage that high, a drop of just a few percent in the value of its assets could wipe out its equity entirely."],
  ["The fall","When housing‑related investments lost value in 2008, that's what happened. Lehman filed for bankruptcy in September 2008, the largest in U.S. history at the time. The debt‑to‑equity lesson from this week, at the scale of a global bank."]],
 qs:[{q:"About how many dollars of assets did Lehman hold per dollar of equity?",choices:["About 30","About 1","About 2","About 1,000"],why:"Roughly 30 to 1."},
     {q:"With very high leverage, a small drop in assets can:",choices:["Wipe out all the equity","Double the equity","Lower the debt","Raise profits"],why:"Equity is a thin cushion."},
     {q:"When did Lehman Brothers file for bankruptcy?",choices:["September 2008","October 1929","December 2001","January 2020"],why:"It filed in September 2008."}]},
"18-3": {title:"Cash is king", sections:[
  ["Profit on paper","Many small businesses that fail were profitable on paper. They sold on credit, bought inventory ahead, and grew fast, but cash went out before it came in."],
  ["Watching the timing","Owners who watch working capital know when customers will pay and when bills come due. They can arrange a line of credit before they need it, not after."],
  ["Simple habits","Keep a cash cushion, send invoices promptly, follow up on late payers, and don't let inventory pile up. The income statement tells you whether you're making money. The balance sheet tells you whether you can pay your bills."]],
 qs:[{q:"How can a profitable business still fail?",choices:["It runs out of cash","It has too much cash","It has no costs","Its margins are too high"],why:"Cash timing matters."},
     {q:"When should a business arrange a line of credit?",choices:["Before it needs it","After it runs out of cash","Never","Only when it's closing"],why:"Lenders are more willing when you're healthy."},
     {q:"Which statement shows whether a business can pay its bills?",choices:["The balance sheet","The P/E ratio","The coupon","The index"],why:"It shows current assets and liabilities."}]},
"19-1": {title:"Selling the console at a loss", sections:[
  ["A strange strategy","Video game console makers have often sold new consoles close to cost, or even at a loss, especially when a console first launches."],
  ["Where the money comes from","They make it back later: from games, online subscriptions and accessories sold to everyone who owns the console. Each console is the start of a long stream of sales."],
  ["Thinking in totals","Pricing one product below cost only works if the whole customer relationship is profitable. Without the follow‑up sales, a business selling below cost just loses money faster as it grows."]],
 qs:[{q:"Why do console makers sometimes sell consoles at a loss?",choices:["To earn more later from games and subscriptions","Because consoles are free to make","To lose money on purpose","Because of taxes"],why:"Follow‑up sales make up the difference."},
     {q:"When does selling one product below cost make sense?",choices:["When the whole customer relationship is profitable","Always","Never","Only on holidays"],why:"It depends on later sales."},
     {q:"Without follow‑up sales, selling below cost:",choices:["Loses more money as the business grows","Makes a profit","Has no effect","Lowers fixed costs"],why:"Every sale adds to the loss."}]},
"19-2": {title:"Why prices end in .99", sections:[
  ["Charm pricing","Look at almost any store and you'll see $19.99 instead of $20. This is called charm pricing."],
  ["The left digit","Researchers have found that shoppers pay extra attention to the first digit of a price. $19.99 feels closer to $19 than to $20, even though the difference is a penny."],
  ["Knowing the trick","Good pricing considers what customers will pay and how they perceive it. As a shopper, round prices up in your head, and you'll make clearer choices."]],
 qs:[{q:"Pricing at $19.99 instead of $20 is called:",choices:["Charm pricing","Markup","Break‑even","Leverage"],why:"It's a common pricing tactic."},
     {q:"Why can $19.99 feel cheaper than $20?",choices:["Shoppers focus on the left digit","It really is much cheaper","Taxes are lower","Stores lose money on it"],why:"The left‑digit effect."},
     {q:"What does the reading suggest shoppers do?",choices:["Round prices up in their heads","Only buy .99 items","Ignore prices","Always pay cash"],why:"It removes the illusion."}]},
"19-3": {title:"Prices that move", sections:[
  ["Same seat, different price","Two people on the same flight may have paid very different prices. Airlines change prices constantly based on how many seats are left and how close the flight is."],
  ["Surge pricing","Ride‑sharing apps raise prices when many people want rides at once, like after a big game, to bring more drivers out. This is called dynamic or surge pricing."],
  ["Supply and demand, live","Dynamic pricing is supply and demand working minute by minute. For businesses it can raise profit; for customers it rewards planning ahead and flexibility."]],
 qs:[{q:"Airlines change ticket prices based on:",choices:["Seats left and how close the flight is","The weather only","The pilot's choice","A fixed government price"],why:"Demand and remaining supply."},
     {q:"Surge pricing is meant to:",choices:["Bring more drivers out when demand is high","Lower all prices","Punish drivers","Stop people from riding"],why:"Higher prices attract supply."},
     {q:"For customers, dynamic pricing rewards:",choices:["Planning ahead and flexibility","Waiting until the last minute","Paying in cash","Buying more"],why:"Flexible buyers find lower prices."}]},
"20-1": {title:"Started in a garage", sections:[
  ["Two friends in Palo Alto","In the late 1930s, Bill Hewlett and David Packard started a company in a small garage in Palo Alto, California, with a few hundred dollars. Their first big customer was Walt Disney's studio, which bought sound equipment for the film Fantasia."],
  ["A pattern","Apple began in 1976 in the garage of Steve Jobs's family home. Many other famous companies started with almost nothing: a small space, a small budget and a product people wanted."],
  ["Lean starts","Starting small kept their fixed costs tiny, so they could survive mistakes while they learned. It's the same advice from this unit: keep startup costs low and grow as sales prove the idea."]],
 qs:[{q:"Where did Hewlett‑Packard start?",choices:["A garage in Palo Alto","A skyscraper in New York","A bank in London","A factory in Detroit"],why:"The garage is now a historic landmark."},
     {q:"Apple was founded in:",choices:["1976","1913","1494","2003"],why:"It began in 1976."},
     {q:"Why does starting small help?",choices:["Low fixed costs let you survive mistakes","It guarantees success","It avoids taxes","Customers prefer garages"],why:"Lean starts are forgiving."}]},
"20-2": {title:"Help for small businesses", sections:[
  ["The SBA","The U.S. Small Business Administration was created in 1953 to help small businesses. It offers guidance and helps small businesses get loans by guaranteeing part of them to banks."],
  ["Free advice","Programs connected to the SBA offer free mentoring from experienced business owners and workshops on writing a business plan, pricing and taxes."],
  ["Asking for help","Most successful owners didn't figure everything out alone. Knowing where to find advice is one of the most useful skills a new business owner can have."]],
 qs:[{q:"The Small Business Administration was created in:",choices:["1953","1776","2008","1914"],why:"It was founded in 1953."},
     {q:"How does the SBA help with loans?",choices:["It guarantees part of them to banks","It gives free money to everyone","It sets stock prices","It runs payday lenders"],why:"Guarantees make banks more willing to lend."},
     {q:"What does the reading say about asking for help?",choices:["It's one of the most useful skills","Owners should never ask","Only big companies need help","Advice always costs money"],why:"Mentors and workshops are widely available."}]},
"20-3": {title:"Learning from failure", sections:[
  ["The numbers","Government data show that about one in five new U.S. businesses closes within its first year, and roughly half within five years."],
  ["Common reasons","Many fail because they run out of cash, price too low to cover costs, or grow fixed costs faster than sales. Those are exactly the mistakes break‑even, margins and the balance sheet help you catch early."],
  ["Failing small","A business that starts small and tests its idea cheaply can fail without disaster, learn, and try again. Many successful owners had an earlier business that didn't work. What matters is not betting more than you can afford to lose."]],
 qs:[{q:"About what share of new businesses close in their first year?",choices:["About one in five","Almost none","Nearly all","Exactly half"],why:"Roughly 20% close in year one."},
     {q:"Which is a common reason businesses fail?",choices:["Running out of cash","Having too many customers","Charging enough","Keeping costs low"],why:"Cash problems are common."},
     {q:"What's the advice for new owners?",choices:["Test small and don't bet more than you can afford to lose","Borrow as much as possible","Never start a business","Quit after one mistake"],why:"Failing small lets you try again."}]}
});

GLOSSARY.push(
 ["Revenue","Money a business takes in from sales.",16],["Profit","Revenue minus all costs.",16],["Fixed cost","A cost that doesn't change with how much is sold.",16],
 ["Variable cost","A cost that rises with each unit made or sold.",16],["Total cost","Fixed costs plus variable costs.",16],["Average cost","Total cost divided by units made.",16],
 ["Economies of scale","Lower cost per unit from producing more.",16],["Markup","The amount added to cost to set a price, as a percent of cost.",16],["Gross margin","(Price − cost) ÷ price, or gross profit ÷ revenue.",16],
 ["Income statement","A report of revenue, costs and profit over a period.",17],["Cost of goods sold","The direct cost of the products a company sold.",17],
 ["Gross profit","Revenue minus cost of goods sold.",17],["Operating expenses","Costs of running a business beyond making its products.",17],
 ["Operating income","Gross profit minus operating expenses.",17],["Depreciation","Spreading the cost of equipment over its useful life.",17],
 ["Salvage value","What an asset is expected to sell for at the end of its useful life.",17],["Net income","Profit after all costs, interest and taxes; the bottom line.",17],
 ["Net margin","Net income divided by revenue.",17],["Double‑entry bookkeeping","Recording every transaction in two accounts so the books balance.",17],
 ["Balance sheet","A snapshot of what a business owns, owes and what belongs to its owners.",18],["Asset","Something a business or person owns that has value.",18],
 ["Liability","Something a business or person owes.",18],["Owners' equity","Assets minus liabilities.",18],["Net worth","A person's assets minus debts.",18],
 ["Current assets","Assets that will turn into cash within a year.",18],["Current liabilities","Debts due within a year.",18],["Working capital","Current assets minus current liabilities.",18],
 ["Current ratio","Current assets divided by current liabilities.",18],["Debt‑to‑equity","Total liabilities divided by equity.",18],["Leverage","Using borrowed money to grow, which adds risk.",18],
 ["Book value","Equity on the balance sheet; per share, equity divided by shares.",18],["Retained earnings","Profits a company has kept instead of paying out as dividends.",18],
 ["Contribution margin","Price minus variable cost per unit.",19],["Break‑even point","The sales level where revenue equals total cost.",19],
 ["Margin of safety","How far sales can fall before a business has a loss.",19],["Elastic demand","Demand that changes a lot when price changes.",19],
 ["Inelastic demand","Demand that changes little when price changes.",19],["Dynamic pricing","Changing prices often based on demand.",19],
 ["Startup costs","Money spent to open a business before the first sale.",20],["Payback period","How long until profits repay the startup costs.",20],["Business plan","A written plan for what a business sells, to whom, and how it will make money.",20]
);
