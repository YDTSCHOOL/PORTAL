/* Weeks 10-15: What a stock is; Stock returns, dividends and P/E; Bonds and yields; Funds, index funds and fees; Risk, return and diversification; Project: build a model portfolio */
const pcs = x => (x>=0?"+":"−")+nf(Math.abs(x),2)+"%";
const sgn = x => x<0?"−":"+";
const TICK = ["Maple Robotics","Harbor Foods","Summit Energy","Cedar Software","Atlas Freight","Beacon Health","Pioneer Tools","Granite Bank"];

Object.assign(G, {
/* ---- Week 10: What a stock is ---- */
st_own(rng){const tot=pick(rng,[1000,2000,4000,5000,10000]),k=R(1,Math.floor(tot/20))*5;
  return{q:`A family business is split into ${tot.toLocaleString()} shares. He owns ${k} of them. What percent of the company does he own? (Two decimals if needed.)`,ans:k/tot*100,unit:"%",abs:.006,hint:`Ownership = your shares ÷ all the shares.`,steps:[`${k} ÷ ${tot.toLocaleString()} = ${nf(k/tot,5)}`,`= ${nf(k/tot*100,2)}%`]}},
st_cost(rng){const p=R(12,240)+pick(rng,[0,.25,.5,.75]),n=R(3,60),c=pick(rng,[0,0,4.95]);
  return{q:`He buys ${n} shares of ${pick(rng,TICK)} at ${$m(p)} a share${c?`, plus a ${$m(c)} trading fee`:""}. What is the total cost?`,ans:n*p+c,unit:"$",hint:`Shares × price per share${c?", then add the fee":""}.`,steps:[`${n} × ${$m(p)} = ${$m(r2(n*p))}`,...(c?[`+ ${$m(c)} = ${$m(r2(n*p+c))}`]:[])]}},
st_mcap(rng){const p=R(15,300)+pick(rng,[0,.5]),s=R(20,900);
  return{q:`${pick(rng,TICK)} stock trades at ${$m(p)} and the company has ${s} million shares. What is its market capitalization, in millions of dollars?`,ans:p*s,unit:"million",tol:.002,hint:`Market cap = share price × number of shares.`,steps:[`${$m(p)} × ${s} million = $${nf(r2(p*s),2)} million`]}},
st_gain(rng){const n=R(5,80),p1=R(20,150)+pick(rng,[0,.5]),p2=r2(p1*(1+R(-30,60)/100));
  return{q:`He bought ${n} shares at ${$m(p1)} and sold them at ${$m(p2)}. What was his gain? (Negative if it was a loss.)`,ans:n*(p2-p1),unit:"$",abs:.01,tol:.001,hint:`Find the change per share, then multiply by the number of shares.`,steps:[`Per share: ${$m(p2)} − ${$m(p1)} = ${$m(r2(p2-p1))}`,`× ${n} = ${$m(r2(n*(p2-p1)))}`]}},
st_pct(rng){const p1=R(20,200)+pick(rng,[0,.5]),p2=r2(p1*(1+R(-45,80)/100));
  return{q:`A stock went from ${$m(p1)} to ${$m(p2)}. What was the percent change? (One decimal. Negative if it fell.)`,ans:(p2-p1)/p1*100,unit:"%",abs:.06,hint:`Percent change = (new − old) ÷ old.`,steps:[`(${$m(p2)} − ${$m(p1)}) ÷ ${$m(p1)} = ${nf((p2-p1)/p1,4)}`,`= ${nf((p2-p1)/p1*100,1)}%`]}},
st_recover(rng){const x=pick(rng,[10,20,25,30,40,50,60]);
  return{q:`A stock falls ${x}%. What percent gain does it now need to get back to where it started? (One decimal.)`,ans:x/(100-x)*100,unit:"%",abs:.06,hint:`Try it with $100. After the fall, how much is left, and what percent of that is needed to get back to $100?`,steps:[`$100 falls to $${100-x}`,`Needed: $${x} ÷ $${100-x} = ${nf(x/(100-x),4)}`,`= ${nf(x/(100-x)*100,1)}%`]}},
st_avgcost(rng){const n1=R(5,40),p1=R(20,120)+pick(rng,[0,.5]),n2=R(5,40),p2=r2(p1*(1+R(-30,30)/100)),a=(n1*p1+n2*p2)/(n1+n2);
  return{q:`He bought ${n1} shares at ${$m(p1)} and later ${n2} more at ${$m(p2)}. What is his average cost per share?`,ans:a,unit:"$",tol:.002,hint:`Total dollars spent ÷ total shares owned.`,steps:[`${n1} × ${$m(p1)} = ${$m(r2(n1*p1))}`,`${n2} × ${$m(p2)} = ${$m(r2(n2*p2))}`,`Total: ${$m(r2(n1*p1+n2*p2))} for ${n1+n2} shares`,`Average: ${$m(r2(a))}`]}},
st_terms_mc(rng){const k=R(0,6);const Q=[
  ["Owning a share of stock means:","Owning a small piece of the company",["Owning a small piece of the company","Lending money to the company","Working for the company","Being owed interest by the company"]],
  ["When a company sells its shares to the public for the first time, it's called:","An IPO",["An IPO","A dividend","A bond","A stock split"]],
  ["When you buy a share on the stock exchange from another investor, who gets your money?","The investor who sold it",["The investor who sold it","The company","The government","The exchange keeps it"]],
  ["A list that tracks a group of stocks to show how the market is doing, like the S&P 500, is called:","An index",["An index","A ledger","A bond","A broker"]],
  ["A long period of falling stock prices is called:","A bear market",["A bear market","A bull market","An IPO","A dividend"]],
  ["Share price × number of shares equals the company's:","Market capitalization",["Market capitalization","Revenue","Dividend","Profit"]],
  ["A firm licensed to buy and sell stocks for you is a:","Brokerage",["Brokerage","Credit bureau","Mint","Payday lender"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`This was covered in this week's lessons.`,steps:[`${Q[1]}.`]}},

/* ---- Week 11: Returns, dividends and P/E ---- */
dv_annual(rng){const d=R(10,95)/100,n=R(20,400);
  return{q:`A stock pays a quarterly dividend of ${$m(d)} a share. He owns ${n} shares. How much dividend income does he get in a year?`,ans:d*4*n,unit:"$",hint:`Quarterly means four times a year.`,steps:[`Yearly per share: ${$m(d)} × 4 = ${$m(r2(d*4))}`,`× ${n} shares = ${$m(r2(d*4*n))}`]}},
dv_yield(rng){const p=R(20,180)+pick(rng,[0,.5]),d=r2(p*R(5,60)/1000);
  return{q:`A stock trades at ${$m(p)} and pays ${$m(d)} a share in dividends each year. What is its dividend yield? (Two decimals.)`,ans:d/p*100,unit:"%",abs:.006,hint:`Dividend yield = yearly dividend ÷ share price.`,steps:[`${$m(d)} ÷ ${$m(p)} = ${nf(d/p,5)}`,`= ${nf(d/p*100,2)}%`]}},
dv_need(rng){const g=R(5,40)*100,d=R(80,400)/100,n=Math.ceil(g/d);
  return{q:`A stock pays ${$m(d)} a share in dividends each year. How many shares would he need to collect at least ${$m(g)} a year? (Round up to a whole share.)`,ans:n,unit:"shares",abs:0,tol:0,hint:`Divide the goal by the dividend per share. A partial share won't do, so round up.`,steps:[`${$m(g)} ÷ ${$m(d)} = ${nf(g/d,2)}`,`Round up: ${n} shares`]}},
tr_total(rng){const p1=R(20,150),p2=r2(p1*(1+R(-25,50)/100)),dv=r2(p1*R(1,6)/100),t=(p2-p1+dv)/p1*100;
  return{q:`He bought a share at ${$m(p1)}, collected ${$m(dv)} in dividends, and sold it a year later at ${$m(p2)}. What was his total return? (One decimal. Negative for a loss.)`,ans:t,unit:"%",abs:.06,hint:`Total return counts the price change and the dividends together, divided by what he paid.`,steps:[`Price change: ${$m(p2)} − ${$m(p1)} = ${$m(r2(p2-p1))}`,`Plus dividends: ${$m(r2(p2-p1+dv))}`,`÷ ${$m(p1)} = ${nf(t,1)}%`]}},
tr_cagr(rng){const s=R(2,20)*500,y=pick(rng,[3,4,5,8,10]),g=R(3,14),e=Math.round(s*Math.pow(1+g/100,y)/10)*10,a=(Math.pow(e/s,1/y)-1)*100;
  return{q:`An investment grew from ${$m(s)} to ${$m(e)} in ${y} years. What was its average annual return, compounded? Use (end ÷ start)<sup>1/n</sup> − 1. (Two decimals.)`,ans:a,unit:"%",abs:.011,hint:`Divide end by start, raise it to the power 1 ÷ ${y}, then subtract 1.`,steps:[`${$m(e)} ÷ ${$m(s)} = ${nf(e/s,5)}`,`${nf(e/s,5)}<sup>1/${y}</sup> = ${nf(Math.pow(e/s,1/y),5)}`,`− 1 = ${nf(a,2)}%`]}},
eps(rng){const ni=R(20,900)/10,sh=R(10,400);
  return{q:`A company earned a profit of $${nf(ni,1)} million last year and has ${sh} million shares. What are its earnings per share (EPS)?`,ans:ni/sh,unit:"$",tol:.003,hint:`EPS = profit ÷ number of shares.`,steps:[`$${nf(ni,1)} million ÷ ${sh} million = ${$m(r2(ni/sh))}`]}},
pe(rng){const e=R(50,900)/100,p=r2(e*R(8,40)+R(0,99)/100);
  return{q:`A stock trades at ${$m(p)} and its earnings per share are ${$m(e)}. What is its P/E ratio? (One decimal.)`,ans:p/e,unit:"",abs:.06,hint:`P/E = price ÷ earnings per share.`,steps:[`${$m(p)} ÷ ${$m(e)} = ${nf(p/e,1)}`]}},
pe_price(rng){const e=R(50,900)/100,m=R(8,35);
  return{q:`Similar companies trade at a P/E of ${m}. This company's EPS is ${$m(e)}. At that P/E, what would its share price be?`,ans:e*m,unit:"$",hint:`If P/E = price ÷ EPS, then price = P/E × EPS.`,steps:[`${m} × ${$m(e)} = ${$m(r2(e*m))}`]}},
pe_mc(rng){const k=R(0,4);const Q=[
  ["A P/E of 30 means investors are paying:","$30 for every $1 of yearly earnings",["$30 for every $1 of yearly earnings","$1 for every $30 of earnings","30% interest","A $30 dividend"]],
  ["Two similar companies: A has a P/E of 12, B has a P/E of 40. What does that usually suggest?","Investors expect B's earnings to grow faster",["Investors expect B's earnings to grow faster","B is definitely a better buy","A has more shares","B pays a bigger dividend"]],
  ["Total return includes:","Price change plus dividends",["Price change plus dividends","Only the dividend","Only the price change","The P/E ratio"]],
  ["A company that pays out none of its profit as dividends usually:","Reinvests the profit to grow",["Reinvests the profit to grow","Has no profit","Is breaking the law","Owes the money to bondholders"]],
  ["Earnings per share are found by dividing:","Profit by the number of shares",["Profit by the number of shares","Price by profit","Dividends by price","Shares by price"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`Think about what each number measures.`,steps:[`${Q[1]}.`]}},

/* ---- Week 12: Bonds and yields ---- */
bd_coupon(rng){const f=pick(rng,[1000,1000,5000,10000]),c=pick(rng,[2,2.5,3,3.5,4,4.5,5,5.5,6,7]),semi=rng()<.5;
  return{q:`A bond has a face value of ${$m(f)} and a coupon rate of ${c}%, paid ${semi?"twice a year":"once a year"}. How much is each interest payment?`,ans:f*c/100/(semi?2:1),unit:"$",hint:`Yearly interest = face value × coupon rate.${semi?" Then split it into two payments.":""}`,steps:[`Yearly: ${$m(f)} × ${c/100} = ${$m(f*c/100)}`,...(semi?[`Each payment: ${$m(f*c/100)} ÷ 2 = ${$m(f*c/200)}`]:[])]}},
bd_total(rng){const f=pick(rng,[1000,5000]),c=pick(rng,[3,3.5,4,4.5,5,6]),y=pick(rng,[5,10,20,30]);
  return{q:`He buys a newly issued ${$m(f)} bond with a ${c}% coupon and holds it ${y} years until it matures. How much does he receive in total, counting all the interest and the face value at the end?`,ans:f*c/100*y+f,unit:"$",hint:`Add up ${y} years of interest, then add the face value repaid at maturity.`,steps:[`Interest: ${$m(f*c/100)} × ${y} = ${$m(f*c/100*y)}`,`+ face value ${$m(f)} = ${$m(f*c/100*y+f)}`]}},
bd_cy(rng){const c=pick(rng,[3,4,4.5,5,6,7]),pr=R(820,1150)+pick(rng,[0,.5]);
  return{q:`A $1,000 bond with a ${c}% coupon is selling for ${$m(pr)}. What is its current yield? (Two decimals.)`,ans:1000*c/100/pr*100,unit:"%",abs:.006,hint:`Current yield = yearly coupon ÷ price you pay.`,steps:[`Yearly coupon: $1,000 × ${c/100} = ${$m(10*c)}`,`${$m(10*c)} ÷ ${$m(pr)} = ${nf(10*c/pr,5)} = ${nf(1000*c/pr,2)}%`]}},
bd_zero(rng){const f=1000,n=pick(rng,[2,3,5,10]),y=pick(rng,[3,4,5,6]),p=Math.round(f/Math.pow(1+y/100,n)*(1+R(-15,15)/1000)),a=(Math.pow(f/p,1/n)-1)*100;
  return{q:`A zero‑coupon bond pays $1,000 in ${n} years and nothing before that. It costs ${$m(p)} today. What yearly return does it give? Use (1,000 ÷ price)<sup>1/n</sup> − 1. (Two decimals.)`,ans:a,unit:"%",abs:.011,hint:`It's the same compound‑growth formula from last week: end ÷ start, to the power 1 ÷ n, minus 1.`,steps:[`1,000 ÷ ${p} = ${nf(f/p,5)}`,`<sup>1/${n}</sup> = ${nf(Math.pow(f/p,1/n),5)}`,`− 1 = ${nf(a,2)}%`]}},
bd_zero_price(rng){const n=pick(rng,[2,3,5,10,20]),y=pick(rng,[3,4,4.5,5,6]),p=1000/Math.pow(1+y/100,n);
  return{q:`A zero‑coupon bond will pay $1,000 in ${n} years. If investors want a ${y}% yearly return, what price will it sell for today? Use price = 1,000 ÷ (1 + r)<sup>n</sup>.`,ans:p,unit:"$",tol:.002,hint:`This is present value from week 3.`,steps:[`(1 + ${y/100})<sup>${n}</sup> = ${nf(Math.pow(1+y/100,n),5)}`,`1,000 ÷ ${nf(Math.pow(1+y/100,n),5)} = ${$m(r2(p))}`]}},
bd_one(rng){const c=pick(rng,[3,4,5,6]),m=c+pick(rng,[-2,-1,1,2,3]),p=(1000+10*c)/(1+m/100);
  return{q:`A bond matures in one year. It will pay its $1,000 face value plus a ${$m(10*c)} coupon at that time. New bonds now pay ${m}%. What would an investor pay for this bond today to earn ${m}%?`,ans:p,unit:"$",tol:.002,hint:`What amount, growing at ${m}% for one year, becomes ${$m(1000+10*c)}?`,steps:[`Total paid in a year: ${$m(1000+10*c)}`,`Price = ${$m(1000+10*c)} ÷ ${nf(1+m/100,2)} = ${$m(r2(p))}`,m>c?`Rates rose above the coupon, so the price is under $1,000.`:`Rates fell below the coupon, so the price is over $1,000.`]}},
bd_dir_mc(rng){const k=R(0,4);const Q=[
  ["Interest rates on new bonds rise. What happens to the price of older bonds with lower coupons?","It falls",["It falls","It rises","It stays exactly the same","It doubles"]],
  ["Interest rates on new bonds fall. What happens to the price of older bonds with higher coupons?","It rises",["It rises","It falls","It stays exactly the same","It goes to zero"]],
  ["A bond's price goes up. What happens to its yield?","It goes down",["It goes down","It goes up","Nothing","It becomes the coupon"]],
  ["A bond pays a 5% coupon but sells for less than its face value. Its current yield is:","Higher than 5%",["Higher than 5%","Lower than 5%","Exactly 5%","Zero"]],
  ["The date a bond's face value is repaid is its:","Maturity date",["Maturity date","Coupon date","Issue price","Yield"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`Bond prices and interest rates move in opposite directions.`,steps:[`${Q[1]}.`]}},
bd_kind_mc(rng){const k=R(0,5);const Q=[
  ["Which bonds are considered the safest from default in the U.S.?","Treasury bonds",["Treasury bonds","Junk bonds","Corporate bonds from a new startup","Payday loans"]],
  ["Bonds issued by states and cities, whose interest is often free of federal income tax, are called:","Municipal bonds",["Municipal bonds","Treasury bonds","Junk bonds","Savings accounts"]],
  ["A bond rated below investment grade, which pays more because it's riskier, is called:","A high‑yield or junk bond",["A high‑yield or junk bond","A Treasury bond","A zero‑coupon bond","A municipal bond"]],
  ["Which is the highest credit rating a bond can get?","AAA",["AAA","BB","C","D"]],
  ["If a company goes bankrupt, who is generally paid back first?","Bondholders",["Bondholders","Stockholders","Customers","Nobody, ever"]],
  ["Compared with stocks, high‑quality bonds usually have:","Lower risk and lower expected return",["Lower risk and lower expected return","Higher risk and higher return","No risk at all","Higher return and lower risk"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`Think about who is borrowing and how likely they are to pay it back.`,steps:[`${Q[1]}.`]}},

/* ---- Week 13: Funds, index funds and fees ---- */
nav(rng){const a=R(50,900)/10,l=R(1,30)/10,s=R(2,60)/10;
  return{q:`A mutual fund holds $${nf(a,1)} million of investments and owes $${nf(l,1)} million in expenses. It has ${nf(s,1)} million shares. What is its net asset value (NAV) per share?`,ans:(a-l)/s,unit:"$",tol:.002,hint:`NAV = (assets − liabilities) ÷ shares.`,steps:[`$${nf(a,1)}M − $${nf(l,1)}M = $${nf(a-l,1)}M`,`÷ ${nf(s,1)}M shares = ${$m(r2((a-l)/s))}`]}},
nav_shares(rng){const x=R(5,100)*100,n=R(1000,9000)/100;
  return{q:`He invests ${$m(x)} in a mutual fund with a NAV of ${$m(n)}. How many shares does he get? (Two decimals; funds sell fractional shares.)`,ans:x/n,unit:"shares",tol:.001,abs:.011,hint:`Amount invested ÷ price per share.`,steps:[`${$m(x)} ÷ ${$m(n)} = ${nf(x/n,2)} shares`]}},
er_cost(rng){const b=R(10,200)*100,e=pick(rng,[.03,.05,.1,.2,.5,.75,1,1.25]);
  return{q:`A fund has an expense ratio of ${e}%. He has ${$m(b)} in it. About how much does he pay in fees each year?`,ans:b*e/100,unit:"$",hint:`Expense ratio × balance. Watch the decimal: ${e}% = ${nf(e/100,4)}.`,steps:[`${e}% = ${nf(e/100,4)}`,`${$m(b)} × ${nf(e/100,4)} = ${$m(r2(b*e/100))}`]}},
er_long(rng){const x=R(5,50)*1000,r=pick(rng,[6,7,8]),t=pick(rng,[20,30,40]),e1=pick(rng,[.04,.1]),e2=pick(rng,[.75,1,1.25]),a=x*Math.pow(1+(r-e1)/100,t),b=x*Math.pow(1+(r-e2)/100,t);
  return{q:`He invests ${$m(x)} for ${t} years. The investments earn ${r}% a year before fees. Fund A charges ${e1}% a year; fund B charges ${e2}%. Treat each fund's yearly return as ${r}% minus its fee. How much more does he end up with in fund A?`,ans:a-b,unit:"$",tol:.004,hint:`Fund A grows at ${nf(r-e1,2)}% and fund B at ${nf(r-e2,2)}%. Use FV = P(1 + r)<sup>t</sup> for each.`,steps:[`A: ${$m(x)} × ${nf(1+(r-e1)/100,4)}<sup>${t}</sup> = ${$m(r2(a))}`,`B: ${$m(x)} × ${nf(1+(r-e2)/100,4)}<sup>${t}</sup> = ${$m(r2(b))}`,`Difference: ${$m(r2(a-b))}`]}},
idx_weight(rng){const c=[R(50,900),R(50,900),R(50,900)],k=R(0,2),T=c[0]+c[1]+c[2],nm=["A","B","C"];
  return{q:`A small index holds three companies, weighted by market cap: A is worth $${c[0]} billion, B $${c[1]} billion and C $${c[2]} billion. What percent of the index is company ${nm[k]}? (One decimal.)`,ans:c[k]/T*100,unit:"%",abs:.06,hint:`In a cap‑weighted index, a company's weight is its market cap ÷ the total of all of them.`,steps:[`Total: $${T} billion`,`${c[k]} ÷ ${T} = ${nf(c[k]/T*100,1)}%`]}},
load(rng){const x=R(5,100)*100,l=pick(rng,[3,4.5,5,5.75]);
  return{q:`A fund charges a ${l}% front‑end load, a sales fee taken out when you invest. He invests ${$m(x)}. How much actually goes into the fund?`,ans:x*(1-l/100),unit:"$",hint:`Take the load percent off the top.`,steps:[`Load: ${$m(x)} × ${l/100} = ${$m(r2(x*l/100))}`,`Invested: ${$m(x)} − ${$m(r2(x*l/100))} = ${$m(r2(x*(1-l/100)))}`]}},
fund_mc(rng){const k=R(0,5);const Q=[
  ["A mutual fund is:","A pool of many investors' money invested in many securities",["A pool of many investors' money invested in many securities","A single company's stock","A government bond","A bank savings account"]],
  ["An index fund tries to:","Match the performance of a market index",["Match the performance of a market index","Beat the market by picking winners","Avoid all stocks","Pay a fixed interest rate"]],
  ["How is an ETF different from a traditional mutual fund?","It trades on an exchange all day like a stock",["It trades on an exchange all day like a stock","It can only hold bonds","It has no fees ever","It's run by the government"]],
  ["A fund with a manager who picks investments to try to beat the market is:","Actively managed",["Actively managed","Passively managed","An index fund","A zero‑coupon bond"]],
  ["The yearly fee a fund charges, as a percent of your money, is the:","Expense ratio",["Expense ratio","Dividend yield","Coupon rate","P/E ratio"]],
  ["Over long periods, most actively managed stock funds:","Trail their index after fees",["Trail their index after fees","Beat their index every year","Never charge fees","Hold only one stock"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`This was covered in this week's lessons.`,steps:[`${Q[1]}.`]}},

/* ---- Week 14: Risk, return and diversification ---- */
rk_avg(rng){const r=[...Array(5)].map(()=>R(-20,30)),a=r.reduce((x,y)=>x+y,0)/5;
  return{q:`A fund's returns for five years were ${r.map(x=>x+"%").join(", ")}. What was its average (arithmetic mean) yearly return? (Negative if below zero.)`,ans:a,unit:"%",abs:.01,hint:`Add the five returns and divide by 5.`,steps:[`Sum: ${r.reduce((x,y)=>x+y,0)}`,`÷ 5 = ${nf(a,2)}%`]}},
rk_range(rng){const r=[...Array(6)].map(()=>R(-30,40));
  return{q:`A stock's yearly returns were ${r.map(x=>x+"%").join(", ")}. What is the range (best year minus worst year), in percentage points?`,ans:Math.max(...r)-Math.min(...r),unit:"points",abs:0,tol:0,hint:`Find the highest and the lowest, then subtract.`,steps:[`Best: ${Math.max(...r)}%, worst: ${Math.min(...r)}%`,`${Math.max(...r)} − (${Math.min(...r)}) = ${Math.max(...r)-Math.min(...r)}`]}},
rk_growth(rng){const x=R(2,20)*500,r=[...Array(3)].map(()=>R(-25,35));let v=x;r.forEach(g=>v*=1+g/100);
  return{q:`He invests ${$m(x)}. The returns over three years are ${r.map(g=>g+"%").join(", then ")}. What is it worth at the end?`,ans:v,unit:"$",tol:.002,hint:`Multiply by (1 + each year's return) one year at a time. A −10% year means × 0.90.`,steps:[`${$m(x)} × ${r.map(g=>nf(1+g/100,2)).join(" × ")}`,`= ${$m(r2(v))}`]}},
rk_avg_trap(rng){const up=pick(rng,[20,25,50,100]),dn=Math.round(up/(100+up)*100*1000)/1000;const x=1000;
  return{q:`A $1,000 investment rises ${up}% one year and falls ${up}% the next. What is it worth after two years?`,ans:x*(1+up/100)*(1-up/100),unit:"$",hint:`A ${up}% fall is taken from the bigger, new amount.`,steps:[`After year 1: $1,000 × ${nf(1+up/100,2)} = ${$m(x*(1+up/100))}`,`After year 2: × ${nf(1-up/100,2)} = ${$m(r2(x*(1+up/100)*(1-up/100)))}`,`The average return was 0%, but he lost money.`]}},
port_ret(rng){const w=R(3,8)*10,a=R(-15,30),b=R(-5,8),p=w/100*a+(100-w)/100*b;
  return{q:`A portfolio is ${w}% stocks and ${100-w}% bonds. This year stocks returned ${a}% and bonds returned ${b}%. What did the whole portfolio return? (Two decimals. Negative for a loss.)`,ans:p,unit:"%",abs:.006,hint:`Weighted average: each return times its share of the portfolio, then add.`,steps:[`Stocks: ${w/100} × ${a}% = ${nf(w/100*a,2)}%`,`Bonds: ${(100-w)/100} × ${b}% = ${nf((100-w)/100*b,2)}%`,`Total: ${nf(p,2)}%`]}},
port_value(rng){const x=R(4,40)*500,w=R(3,8)*10,a=R(-20,30),b=R(-3,7),s=x*w/100,bd=x-s,v=s*(1+a/100)+bd*(1+b/100);
  return{q:`He puts ${$m(x)} into a portfolio: ${w}% in a stock fund and the rest in a bond fund. The stock fund returns ${a}% and the bond fund ${b}%. What is the portfolio worth after the year?`,ans:v,unit:"$",tol:.002,hint:`Split the money first, grow each part, then add them back together.`,steps:[`Stocks: ${$m(s)} × ${nf(1+a/100,2)} = ${$m(r2(s*(1+a/100)))}`,`Bonds: ${$m(bd)} × ${nf(1+b/100,2)} = ${$m(r2(bd*(1+b/100)))}`,`Total: ${$m(r2(v))}`]}},
rebal(rng){const t=pick(rng,[50,60,70,80]),s=R(30,90)*100,b0=Math.round(s*(100-t)/t*R(55,90)/100/10)*10,T=s+b0,mv=s-T*t/100;
  return{q:`His target is ${t}% stocks and ${100-t}% bonds. After a strong year he has ${$m(s)} in stocks and ${$m(b0)} in bonds. How much stock must he sell and move into bonds to get back to his target?`,ans:mv,unit:"$",tol:.002,hint:`Find the total, then the dollar target for stocks. The extra above that target is what moves.`,steps:[`Total: ${$m(T)}`,`Stock target: ${$m(T)} × ${t/100} = ${$m(r2(T*t/100))}`,`Move: ${$m(s)} − ${$m(r2(T*t/100))} = ${$m(r2(mv))}`]}},
dca(rng){const a=pick(rng,[100,150,200,250]),p=[...Array(3)].map(()=>R(16,40)),sh=p.map(x=>a/x),avg=3*a/sh.reduce((x,y)=>x+y,0);
  return{q:`He invests ${$m(a)} every month for three months. The fund's price is ${p.map(x=>$m(x)).join(", then ")}. What is his average cost per share? (He buys fractional shares.)`,ans:avg,unit:"$",tol:.002,hint:`Find the shares bought each month (dollars ÷ price), add them, then divide total dollars by total shares.`,steps:[`Shares: ${sh.map(x=>nf(x,4)).join(" + ")} = ${nf(sh.reduce((x,y)=>x+y,0),4)}`,`${$m(3*a)} ÷ ${nf(sh.reduce((x,y)=>x+y,0),4)} = ${$m(r2(avg))}`,`Lower than the simple average price, ${$m(r2(p.reduce((x,y)=>x+y,0)/3))}`]}},
age_rule(rng){const age=R(16,70);
  return{q:`One rule of thumb says to hold "110 minus your age" percent in stocks and the rest in bonds. What percent in stocks for a ${age}-year-old?`,ans:110-age,unit:"%",abs:0,tol:0,hint:`Just subtract the age from 110.`,steps:[`110 − ${age} = ${110-age}%`]}},
risk_mc(rng){const k=R(0,5);const Q=[
  ["Which usually has the highest risk and highest long‑run expected return?","Stocks",["Stocks","Bonds","Savings accounts","Cash"]],
  ["Diversification means:","Spreading money across many different investments",["Spreading money across many different investments","Buying one stock you love","Keeping all money in cash","Borrowing to invest"]],
  ["Diversification reduces the risk of:","One company's bad news hurting you badly",["One company's bad news hurting you badly","The whole market falling","Inflation","Paying any taxes"]],
  ["Investing the same dollar amount on a regular schedule is called:","Dollar‑cost averaging",["Dollar‑cost averaging","Market timing","Rebalancing","Short selling"]],
  ["Selling some of what grew and buying what lagged, to get back to your target mix, is:","Rebalancing",["Rebalancing","Diversifying","Day trading","Compounding"]],
  ["Why do young investors usually hold more stocks than older ones?","They have more years to recover from drops",["They have more years to recover from drops","Stocks are safer for the young","Bonds are illegal under 30","Older people can't buy stocks"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`Think about risk, return and time.`,steps:[`${Q[1]}.`]}},

/* ---- Week 15: Project ---- */
pj2_shares(rng){const x=R(5,20)*1000,w=pick(rng,[20,25,30,40,50,60]),p=R(15,400)+pick(rng,[0,.25,.5,.75]),amt=x*w/100,n=Math.floor(amt/p);
  return{q:`Your model portfolio has ${$m(x)}. You put ${w}% into a stock fund ETF priced at ${$m(p)} a share, and you can only buy whole shares. How many shares can you buy?`,ans:n,unit:"shares",abs:0,tol:0,hint:`Find the dollar amount for this holding, divide by the price, then round down.`,steps:[`${$m(x)} × ${w/100} = ${$m(amt)}`,`${$m(amt)} ÷ ${$m(p)} = ${nf(amt/p,2)}`,`Round down: ${n} shares`]}},
pj2_value(rng){const h=[[R(20,60)*100,R(-20,35)],[R(10,40)*100,R(-10,25)],[R(10,40)*100,R(-4,7)]],v=h.reduce((a,x)=>a+x[0]*(1+x[1]/100),0);
  return{q:`After a year, your three holdings changed like this: U.S. stock fund ${$m(h[0][0])} at ${h[0][1]}%, international stock fund ${$m(h[1][0])} at ${h[1][1]}%, bond fund ${$m(h[2][0])} at ${h[2][1]}%. What is the portfolio worth now?`,ans:v,unit:"$",tol:.002,hint:`Grow each holding by its own return, then add.`,steps:[...h.map(x=>`${$m(x[0])} × ${nf(1+x[1]/100,2)} = ${$m(r2(x[0]*(1+x[1]/100)))}`),`Total: ${$m(r2(v))}`]}},
pj2_ret(rng){const s=R(8,30)*500,e=Math.round(s*(1+R(-15,25)/100)),inc=R(0,8)*25,t=(e+inc-s)/s*100;
  return{q:`Your portfolio started the year at ${$m(s)} and ended at ${$m(e)}. It also paid ${$m(inc)} in dividends and interest that you kept in cash. What was your total return for the year? (One decimal. Negative for a loss.)`,ans:t,unit:"%",abs:.06,hint:`Total return = (ending value + income − starting value) ÷ starting value.`,steps:[`${$m(e)} + ${$m(inc)} − ${$m(s)} = ${$m(e+inc-s)}`,`÷ ${$m(s)} = ${nf(t,1)}%`]}},
pj2_future(rng){const d=R(5,40)*25,r=pick(rng,[6,7,8]),y=pick(rng,[20,30,40]),m=r/1200,n=y*12,fv=d*(Math.pow(1+m,n)-1)/m;
  return{q:`From your first job, you invest ${$m(d)} at the end of every month for ${y} years in your portfolio, averaging ${r}% a year compounded monthly. What will it be worth? Use FV = D × ((1 + r)<sup>n</sup> − 1) ÷ r, with monthly r and n.`,ans:fv,unit:"$",tol:.003,hint:`r = ${r} ÷ 1200 and n = ${y} × 12.`,steps:[`r = ${nf(m,6)}, n = ${n}`,`(1 + r)<sup>${n}</sup> = ${nf(Math.pow(1+m,n),5)}`,`FV = ${$m(d)} × ${nf(Math.pow(1+m,n)-1,5)} ÷ ${nf(m,6)} = ${$m(r2(fv))}`,`You put in ${$m(d*n)}; growth added ${$m(r2(fv-d*n))}`]}},
pj2_mc(rng){const k=R(0,4);const Q=[
  ["You're 14 and investing for 40 years. Which portfolio fits best?","Mostly low‑cost stock index funds, with some bonds",["Mostly low‑cost stock index funds, with some bonds","All cash","All in one exciting stock","All in payday loans to friends"]],
  ["Two S&P 500 index funds hold the same stocks. One charges 0.03%, the other 0.9%. Which should you choose?","The 0.03% fund",["The 0.03% fund","The 0.9% fund","Either; fees don't matter","Neither; index funds are illegal"]],
  ["The market falls 20% in a month. Your plan is for 40 years. What does your plan say to do?","Stick to the plan and keep investing on schedule",["Stick to the plan and keep investing on schedule","Sell everything at once","Stop investing forever","Borrow to buy a single stock"]],
  ["Your stocks grew to 85% of the portfolio, but your target is 70%. What should you do?","Rebalance back toward 70%",["Rebalance back toward 70%","Buy more stocks","Do nothing ever","Sell all the bonds"]],
  ["Before investing at all, what should be in place?","An emergency fund and no high‑interest debt",["An emergency fund and no high‑interest debt","A new car","A credit card balance","A payday loan"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`Use everything from this unit and unit 2.`,steps:[`${Q[1]}.`]}}
});

/* ================= Week 10 ================= */
const W10 = {title:"What a stock is", sub:"Owning a piece of a company, and what happens when its price moves", days:[
 {title:"Owning a piece", desc:"Shares, ownership and market cap", steps:[
  {h:"Slicing up a company", t:`<p>A company can be divided into <b>shares</b>. Own a share and you own a small piece of the company: a slice of its profits and a vote on big decisions.</p><div class="formula">Ownership = your shares ÷ total shares</div><p>That's what <b>stock</b> is: ownership, split into pieces small enough for anyone to buy.</p>`,
   b:()=>work("A bakery with 2,000 shares",["You own 150 shares","150 ÷ 2,000 = 0.075","You own 7.5% of the bakery","7.5% of its profits are yours"])},
  {h:"Why companies sell shares", t:`<p>A company that wants to grow needs money for factories, stores and workers. It can borrow (you'll study bonds in week 12) or it can sell ownership.</p><p>The first time a company sells shares to the public is its <b>initial public offering</b>, or IPO. The company gets the money from that sale.</p>`,
   b:()=>work("An IPO",["Company sells 10 million new shares at $20","It raises $200 million to grow","Those shares now belong to the public","After this, they trade between investors"])},
  {h:"Market capitalization", t:`<p>To see what the market thinks a whole company is worth, multiply its share price by the number of shares.</p><div class="formula">Market cap = share price × shares outstanding</div><p>Market cap is how people compare the size of companies: "large‑cap" companies are worth tens or hundreds of billions.</p>`,
   b:()=>work("A company with 400 million shares",["Price: $55","Market cap: $55 × 400 million","= $22,000 million = $22 billion"])}
 ], practice:["st_own","st_terms_mc","st_cost","st_mcap","st_own","st_cost","st_terms_mc","st_mcap","st_own","st_cost"]},
 {title:"How the market works", desc:"Exchanges, brokers, indexes and gains", steps:[
  {h:"The stock exchange", t:`<p>After the IPO, shares trade on a <b>stock exchange</b>, like the New York Stock Exchange or Nasdaq. When you buy a share there, you buy it from another investor, not from the company.</p><p>You trade through a <b>brokerage</b>, a firm licensed to place your orders.</p>`,
   b:()=>work("One trade",["Seller wants to sell 50 shares","Buyer wants 50 shares","They agree on a price: $42.10","Buyer pays $2,105; seller receives it","The company isn't involved at all"])},
  {h:"Why prices move", t:`<p>A share's price is whatever buyers and sellers agree on right now. When more people want to buy than sell, the price rises. Good news about profits pushes it up; bad news pushes it down.</p><p>Over the long run, prices follow the company's profits. Day to day, they follow moods and news.</p>`,
   b:()=>{const xs=[...Array(60).keys()];let v=40,a=[];for(const i of xs){a.push(v);v*=1+Math.sin(i*1.7)*.025+Math.cos(i*.9)*.02+.004}return `<div class="board"><h4>One stock, 60 trading days</h4>${lineChart([{vals:a,label:"Price",color:"var(--note)"}],xs.map(i=>i%10===0?String(i):""),v=>"$"+Math.round(v))}<div class="cap">Lots of noise day to day, a trend over months.</div></div>`}},
  {h:"Gains and losses", t:`<p>Your gain or loss is the change in price times the number of shares. Until you sell, it's only a gain on paper.</p><div class="formula">Gain = (sell price − buy price) × shares</div>`,
   b:()=>work("30 shares",["Bought at $48.00","Sold at $57.50","Per share: +$9.50","Gain: 30 × $9.50 = $285"])},
  {h:"Indexes", t:`<p>To see how "the market" did, people look at an <b>index</b>: a list that tracks a group of stocks. The <b>S&P 500</b> follows about 500 of the largest U.S. companies. The <b>Dow Jones Industrial Average</b> follows 30.</p><p>A rising market is a <b>bull market</b>; a long fall is a <b>bear market</b>.</p>`,
   b:()=>work("Reading the news",["\"The S&P 500 rose 1.2% today\"","On average, large U.S. stocks rose that day","Some still fell; the index is an average"])}
 ], practice:["st_gain","st_terms_mc","st_gain","st_cost","st_terms_mc","st_gain","st_mcap","st_gain","st_terms_mc","st_own"]},
 {title:"Percents up and down", desc:"Percent change, recovering from losses and average cost", steps:[
  {h:"Percent change", t:`<p>Dollar gains don't compare well: $5 on a $10 stock is huge, $5 on a $500 stock is small. Percent change puts everything on the same scale.</p><div class="formula">Percent change = (new − old) ÷ old</div>`,
   b:()=>work("Two stocks, both up $5",["$10 → $15: 5 ÷ 10 = +50%","$500 → $505: 5 ÷ 500 = +1%"])},
  {h:"Losses are lopsided", t:`<p>A loss needs a <b>bigger</b> gain to recover, because the gain starts from a smaller base.</p><div class="formula">Gain needed = loss ÷ (100 − loss)</div><p>Lose 50% and you need +100% just to get back to even. That's why avoiding big losses matters so much.</p>`,
   b:()=>`<div class="board"><h4>Loss and the gain needed to recover</h4><table><tr><th>Loss</th><th>Gain needed</th></tr>${[10,20,30,50,75,90].map(x=>`<tr><td>−${x}%</td><td>+${nf(x/(100-x)*100,1)}%</td></tr>`).join("")}</table></div>`},
  {h:"Average cost", t:`<p>If you buy the same stock at different times, your <b>average cost</b> per share is total dollars spent ÷ total shares. It's your break‑even price.</p>`,
   b:()=>work("Two purchases",["20 shares at $50 = $1,000","30 shares at $40 = $1,200","Total: $2,200 for 50 shares","Average: $44 a share"])}
 ], practice:["st_pct","st_recover","st_avgcost","st_pct","st_gain","st_recover","st_avgcost","st_pct","st_recover","st_avgcost"]},
 {quiz:true, title:"Week 10 quiz", desc:`10 questions, ${PASS_MARK}% opens week 11`, steps:[
  {h:"Before the quiz", t:`<p>10 questions from this week. No hints, one try each. You need ${PASS_MARK}% to open week 11.</p>`,
   b:()=>`<div class="board"><h4>From this week</h4><table><tr><td>Ownership</td><td>your shares ÷ total shares</td></tr><tr><td>Market cap</td><td>price × shares</td></tr><tr><td>Percent change</td><td>(new − old) ÷ old</td></tr><tr><td>Gain to recover</td><td>loss ÷ (100 − loss)</td></tr><tr><td>Average cost</td><td>total $ ÷ total shares</td></tr></table></div>`}
 ], quizFrom:["st_own","st_cost","st_mcap","st_gain","st_pct","st_recover","st_avgcost","st_terms_mc","st_pct","st_gain","st_terms_mc"]}
]};

/* ================= Week 11 ================= */
const W11 = {title:"Stock returns, dividends and P/E", sub:"How stocks pay you, and how investors judge a price", days:[
 {title:"Dividends", desc:"Cash paid to owners", steps:[
  {h:"Sharing the profits", t:`<p>When a company makes a profit, it can keep the money to grow, or pay part of it to its owners as a <b>dividend</b>. Many U.S. companies pay dividends every quarter, four times a year.</p>`,
   b:()=>work("200 shares, $0.45 a quarter",["Yearly per share: $0.45 × 4 = $1.80","Yearly income: 200 × $1.80 = $360"])},
  {h:"Dividend yield", t:`<p>To compare dividends across stocks, divide the yearly dividend by the share price.</p><div class="formula">Dividend yield = yearly dividend ÷ price</div><p>A higher yield isn't automatically better. Sometimes a yield is high because the price has collapsed on bad news.</p>`,
   b:()=>work("$1.80 dividend, $60 price",["1.80 ÷ 60 = 0.03","Dividend yield: 3%"])},
  {h:"Growing or paying", t:`<p>Young, fast‑growing companies often pay no dividend at all; they reinvest every dollar. Mature companies with steady profits often pay them.</p><p>Neither is better. What matters is whether the company uses its profits well.</p>`,
   b:()=>work("Income goal: $1,000 a year",["Dividend: $2.50 a share","1,000 ÷ 2.50 = 400 shares","At $60 a share: $24,000 invested"])}
 ], practice:["dv_annual","dv_yield","dv_need","pe_mc","dv_annual","dv_yield","dv_need","dv_annual","dv_yield","dv_need"]},
 {title:"Total return", desc:"Price change plus dividends, and yearly growth", steps:[
  {h:"Counting everything", t:`<p>A stock pays you two ways: the price can rise, and it can pay dividends. <b>Total return</b> counts both.</p><div class="formula">Total return = (price change + dividends) ÷ price paid</div>`,
   b:()=>work("One year",["Bought at $50","Sold at $54","Dividends: $1.50","(4 + 1.50) ÷ 50 = 11%"])},
  {h:"Average yearly return", t:`<p>Over many years, investors want the steady yearly rate that would have produced the same result. That's the <b>compound annual growth rate</b>:</p><div class="formula">Yearly return = (end ÷ start)<sup>1/n</sup> − 1</div><p>It's the compound interest formula from week 1, solved for the rate.</p>`,
   b:()=>work("$5,000 → $8,000 in 6 years",["8,000 ÷ 5,000 = 1.6",`1.6<sup>1/6</sup> = ${nf(Math.pow(1.6,1/6),5)}`,`Yearly return: ${nf((Math.pow(1.6,1/6)-1)*100,2)}%`])},
  {h:"Reinvesting dividends", t:`<p>If you use each dividend to buy more shares, those shares pay dividends too. That's compounding inside a stock, and over decades it makes a large share of the stock market's total return.</p>`,
   b:()=>{const xs=[...Array(31).keys()];return `<div class="board"><h4>$10,000, 5% price growth, 3% dividends</h4>${lineChart([{vals:xs.map(t=>10000*Math.pow(1.08,t)),label:"Reinvested",color:"var(--note)"},{vals:xs.map(t=>10000*Math.pow(1.05,t)),label:"Price only",color:"var(--seal)"}],xs.map(t=>t%5===0?String(t):""),kFmt)}<div class="cap">After 30 years, about $100,600 vs. $43,200.</div></div>`}}
 ], practice:["tr_total","tr_cagr","tr_total","dv_yield","tr_cagr","tr_total","pe_mc","tr_cagr","tr_total","tr_cagr"]},
 {title:"Earnings and P/E", desc:"EPS, the P/E ratio and what it tells you", steps:[
  {h:"Earnings per share", t:`<p>A company's profit is also called its <b>earnings</b>. Divide by the number of shares to get each share's slice.</p><div class="formula">EPS = profit ÷ shares</div>`,
   b:()=>work("$90 million profit, 30 million shares",["EPS = 90 ÷ 30 = $3.00","Each share \"earned\" $3 this year"])},
  {h:"The P/E ratio", t:`<p>The <b>price‑to‑earnings ratio</b> compares the price to those earnings.</p><div class="formula">P/E = price ÷ EPS</div><p>A P/E of 20 means investors pay $20 for each $1 of yearly profit. A high P/E usually means investors expect fast growth. A low one can mean a bargain, or trouble.</p>`,
   b:()=>work("Price $60, EPS $3",["P/E = 60 ÷ 3 = 20","Investors pay $20 per $1 of earnings"])},
  {h:"Using P/E", t:`<p>P/E is most useful for comparing similar companies. If peers trade at a P/E of 15 and a company earns $4 a share, a "fair" price at that multiple is 15 × $4 = $60.</p><p>It's a starting point, not an answer. Future profits matter more than last year's.</p>`,
   b:()=>`<div class="board"><h4>Three companies, same EPS of $2</h4><table><tr><th>Company</th><th>Price</th><th>P/E</th></tr><tr><td>Steady utility</td><td>$28</td><td>14</td></tr><tr><td>Grocery chain</td><td>$40</td><td>20</td></tr><tr><td>Fast‑growing tech</td><td>$90</td><td>45</td></tr></table></div>`}
 ], practice:["eps","pe","pe_price","pe_mc","eps","pe","pe_price","eps","pe","pe_price"]},
 {quiz:true, title:"Week 11 quiz", desc:`10 questions, ${PASS_MARK}% opens week 12`, steps:[
  {h:"Before the quiz", t:`<p>10 questions from this week. No hints, one try each. You need ${PASS_MARK}% to open week 12.</p>`,
   b:()=>`<div class="board"><h4>From this week</h4><table><tr><td>Dividend yield</td><td>yearly dividend ÷ price</td></tr><tr><td>Total return</td><td>(price change + dividends) ÷ price paid</td></tr><tr><td>Yearly return</td><td>(end ÷ start)<sup>1/n</sup> − 1</td></tr><tr><td>EPS</td><td>profit ÷ shares</td></tr><tr><td>P/E</td><td>price ÷ EPS</td></tr></table></div>`}
 ], quizFrom:["dv_annual","dv_yield","dv_need","tr_total","tr_cagr","eps","pe","pe_price","pe_mc","dv_yield","tr_total"]}
]};

/* ================= Week 12 ================= */
const W12 = {title:"Bonds and yields", sub:"Lending to companies and governments, and why bond prices move", days:[
 {title:"How bonds work", desc:"Face value, coupon and maturity", steps:[
  {h:"A loan you can buy", t:`<p>A <b>bond</b> is a loan. When you buy one, you lend money to a company or government. In return it promises to pay interest and repay the loan on a set date.</p><p>A stockholder is an owner. A bondholder is a lender.</p>`,
   b:()=>work("A $1,000 bond, 5% coupon, 10 years",["Face value: $1,000, repaid at maturity","Coupon: 5% × $1,000 = $50 a year","Maturity: 10 years from now"])},
  {h:"Coupons", t:`<p>The interest a bond pays is its <b>coupon</b>, set as a percent of the face value. Many U.S. bonds pay it in two halves, every six months.</p><div class="formula">Yearly coupon = face value × coupon rate</div>`,
   b:()=>work("$1,000 at 4.5%, paid twice a year",["Yearly: $45","Every six months: $22.50"])},
  {h:"Holding to maturity", t:`<p>Hold a bond until it matures and, as long as the borrower doesn't default, you know exactly what you'll get: every coupon, plus the face value at the end.</p><p>That predictability is the reason people own bonds.</p>`,
   b:()=>work("$1,000 at 5% for 10 years",["Coupons: $50 × 10 = $500","Face value at maturity: $1,000","Total received: $1,500"])}
 ], practice:["bd_coupon","bd_total","bd_kind_mc","bd_coupon","bd_total","bd_coupon","bd_kind_mc","bd_total","bd_coupon","bd_total"]},
 {title:"Prices and yields", desc:"Why bond prices fall when rates rise", steps:[
  {h:"Bonds trade too", t:`<p>You don't have to hold a bond to maturity. Bonds are bought and sold between investors, and their prices change.</p><p>The main reason: <b>interest rates</b>. If new bonds pay more than yours, nobody will pay full price for yours.</p>`,
   b:()=>work("Your bond pays 3%; new bonds pay 5%",["A buyer can get 5% on a new bond","Your 3% bond is worth less to him","Its price falls below $1,000"])},
  {h:"Opposite directions", t:`<p>Bond prices and interest rates move in <b>opposite directions</b>. When rates rise, existing bond prices fall. When rates fall, prices rise.</p><p>The price adjusts until the bond gives a buyer about the same return as a new one.</p>`,
   b:()=>`<div class="board"><h4>1‑year bond paying $1,030 at maturity</h4><table><tr><th>Market rate</th><th>Price today</th></tr>${[1,2,3,4,5,6].map(m=>`<tr><td>${m}%</td><td>${$m(r2(1030/(1+m/100)))}</td></tr>`).join("")}</table><div class="cap">Price = 1,030 ÷ (1 + rate)</div></div>`},
  {h:"Yield", t:`<p>A bond's <b>yield</b> is the return you actually get at the price you pay. The simplest version:</p><div class="formula">Current yield = yearly coupon ÷ price</div><p>A <b>zero‑coupon bond</b> pays no coupon. You buy it cheap and get the face value later; the growth is your return, figured with the formula from last week.</p>`,
   b:()=>work("Two ways to measure",["$50 coupon, bond costs $940: 50 ÷ 940 = 5.32%",`Zero‑coupon: $820 now, $1,000 in 5 years: (1000 ÷ 820)<sup>1/5</sup> − 1 = ${nf((Math.pow(1000/820,.2)-1)*100,2)}%`])}
 ], practice:["bd_dir_mc","bd_cy","bd_one","bd_zero","bd_zero_price","bd_cy","bd_dir_mc","bd_one","bd_zero","bd_zero_price"]},
 {title:"Kinds of bonds and risk", desc:"Treasuries, municipals, corporates and ratings", steps:[
  {h:"Who borrows", t:`<ul><li><b>Treasury</b> bonds: the U.S. government. Considered the safest.</li><li><b>Municipal</b> bonds: states and cities. Interest is often free of federal income tax.</li><li><b>Corporate</b> bonds: companies. They pay more, because companies can fail.</li></ul>`,
   b:()=>work("Typical pattern",["Treasury: lowest yield, safest","High‑quality corporate: a bit more","Risky corporate: much more","Higher yield = more risk"])},
  {h:"Credit ratings", t:`<p>Agencies such as Moody's, S&P and Fitch grade how likely a borrower is to repay. AAA is the top. Bonds rated BBB‑ or higher (Baa3 at Moody's) are <b>investment grade</b>; lower ones are <b>high‑yield</b> or "junk" bonds.</p><p>It's the credit score idea from week 8, applied to companies and governments.</p>`,
   b:()=>`<div class="board"><h4>Rating ladder (S&P style)</h4><table><tr><td>AAA, AA</td><td>Very strong</td></tr><tr><td>A, BBB</td><td>Investment grade</td></tr><tr><td>BB, B</td><td>High‑yield (junk)</td></tr><tr><td>CCC and below</td><td>Real danger of default</td></tr></table></div>`},
  {h:"Bonds vs. stocks", t:`<p>If a company fails, bondholders are paid back before stockholders. That makes bonds safer, but a bond's upside is capped at its coupons. A stock's upside isn't.</p><p>That's why most portfolios hold both: stocks for growth, bonds for stability.</p>`,
   b:()=>work("Lending vs. owning",["Bondholder: fixed interest, paid first","Stockholder: share of all future profits, paid last","Over long periods, stocks have usually returned more, with bigger swings"])}
 ], practice:["bd_kind_mc","bd_cy","bd_dir_mc","bd_kind_mc","bd_zero_price","bd_one","bd_kind_mc","bd_coupon","bd_dir_mc","bd_cy"]},
 {quiz:true, title:"Week 12 quiz", desc:`10 questions, ${PASS_MARK}% opens week 13`, steps:[
  {h:"Before the quiz", t:`<p>10 questions from this week. No hints, one try each. You need ${PASS_MARK}% to open week 13.</p>`,
   b:()=>`<div class="board"><h4>From this week</h4><table><tr><td>Coupon</td><td>face value × coupon rate</td></tr><tr><td>Current yield</td><td>coupon ÷ price</td></tr><tr><td>Zero‑coupon price</td><td>face ÷ (1 + r)<sup>n</sup></td></tr><tr><td>Rates up</td><td>bond prices down</td></tr></table></div>`}
 ], quizFrom:["bd_coupon","bd_total","bd_cy","bd_zero","bd_zero_price","bd_one","bd_dir_mc","bd_kind_mc","bd_cy","bd_coupon","bd_dir_mc"]}
]};

/* ================= Week 13 ================= */
const W13 = {title:"Funds, index funds and fees", sub:"Owning hundreds of companies at once, and the cost of doing it", days:[
 {title:"Mutual funds", desc:"Pooling money and net asset value", steps:[
  {h:"Pooling money", t:`<p>Buying dozens of stocks yourself is expensive and hard. A <b>mutual fund</b> pools money from many investors and buys a big collection of stocks, bonds or both. Each investor owns shares of the fund.</p>`,
   b:()=>work("One fund",["10,000 investors put in $50 million","The fund buys 300 different stocks","Each investor owns a slice of all 300"])},
  {h:"Net asset value", t:`<p>A mutual fund's share price is its <b>net asset value</b>, figured once a day after the market closes.</p><div class="formula">NAV = (assets − liabilities) ÷ shares</div><p>Funds sell fractional shares, so every dollar you invest gets used.</p>`,
   b:()=>work("A fund",["Assets: $52.4 million","Liabilities: $0.4 million","Shares: 2 million","NAV = 52.0 ÷ 2 = $26.00"])},
  {h:"Loads", t:`<p>Some funds charge a <b>load</b>, a sales fee when you buy. A 5% load on $1,000 means only $950 is invested. Many good funds are <b>no‑load</b>, so there's rarely a reason to pay one.</p>`,
   b:()=>work("$1,000 into a 5.75% load fund",["Load: $57.50","Invested: $942.50","You start 5.75% behind"])}
 ], practice:["nav","nav_shares","load","fund_mc","nav","nav_shares","load","nav","fund_mc","nav_shares"]},
 {title:"Index funds and ETFs", desc:"Matching the market instead of trying to beat it", steps:[
  {h:"Active vs. passive", t:`<p>An <b>actively managed</b> fund pays experts to pick investments and try to beat the market. A <b>passive</b> or <b>index fund</b> simply buys every stock in an index, like the S&P 500, and matches it.</p><p>Over long periods, most active stock funds have trailed their index after fees.</p>`,
   b:()=>work("Why matching often wins",["The market's return is the average investor's return, before costs","Active funds charge more","After costs, the average active dollar trails the index"])},
  {h:"Cap weighting", t:`<p>Most big indexes are <b>cap‑weighted</b>: each company counts in proportion to its market cap, so the biggest companies move the index most.</p><div class="formula">Weight = company's market cap ÷ total market cap</div>`,
   b:()=>work("An index of three",["A: $600B, B: $300B, C: $100B","Total: $1,000B","Weights: 60%, 30%, 10%"])},
  {h:"ETFs", t:`<p>An <b>exchange‑traded fund</b> (ETF) is a fund that trades on a stock exchange all day, like a single stock. Many ETFs are index funds with very low fees.</p><p>For a beginner, a low‑cost index fund or ETF is one of the simplest ways to own a share of hundreds of companies.</p>`,
   b:()=>work("Mutual fund vs. ETF",["Mutual fund: priced once a day at NAV","ETF: price changes all day on an exchange","Both can hold the same index"])}
 ], practice:["idx_weight","fund_mc","idx_weight","nav_shares","fund_mc","idx_weight","nav","fund_mc","idx_weight","nav_shares"]},
 {title:"The cost of fees", desc:"Expense ratios and what they do over decades", steps:[
  {h:"The expense ratio", t:`<p>Every fund charges a yearly fee called the <b>expense ratio</b>, taken quietly out of the fund. You never get a bill, so it's easy to ignore.</p><div class="formula">Yearly fee ≈ balance × expense ratio</div>`,
   b:()=>work("$20,000 invested",["Index fund at 0.04%: $8 a year","Active fund at 1%: $200 a year"])},
  {h:"Fees compound too", t:`<p>A fee isn't just this year's dollars. Money paid in fees can't grow, every year, for decades. A rough way to see it: subtract the fee from the return each year.</p>`,
   b:()=>{const xs=[...Array(41).keys()];return `<div class="board"><h4>$10,000 at 7% before fees</h4>${lineChart([{vals:xs.map(t=>10000*Math.pow(1.0696,t)),label:"0.04% fee",color:"var(--note)"},{vals:xs.map(t=>10000*Math.pow(1.06,t)),label:"1% fee",color:"var(--bad)"}],xs.map(t=>t%10===0?String(t):""),kFmt)}<div class="cap">After 40 years: about ${$m(Math.round(10000*Math.pow(1.0696,40)/1000)*1000)} vs. ${$m(Math.round(10000*Math.pow(1.06,40)/1000)*1000)}.</div></div>`}},
  {h:"What you can control", t:`<p>You can't control what the market does. You can control what you pay. Choosing low‑cost funds is one of the few sure ways to keep more of your return.</p>`,
   b:()=>work("Questions to ask about any fund",["What's the expense ratio?","Is there a load?","What does it hold?","Is there a cheaper fund holding the same things?"])}
 ], practice:["er_cost","er_long","fund_mc","er_cost","er_long","load","er_cost","er_long","fund_mc","er_long"]},
 {quiz:true, title:"Week 13 quiz", desc:`10 questions, ${PASS_MARK}% opens week 14`, steps:[
  {h:"Before the quiz", t:`<p>10 questions from this week. No hints, one try each. You need ${PASS_MARK}% to open week 14.</p>`,
   b:()=>`<div class="board"><h4>From this week</h4><table><tr><td>NAV</td><td>(assets − liabilities) ÷ shares</td></tr><tr><td>Index weight</td><td>cap ÷ total cap</td></tr><tr><td>Yearly fee</td><td>balance × expense ratio</td></tr><tr><td>Load</td><td>taken off the top</td></tr></table></div>`}
 ], quizFrom:["nav","nav_shares","load","idx_weight","er_cost","er_long","fund_mc","nav","er_cost","fund_mc","idx_weight"]}
]};

/* ================= Week 14 ================= */
const W14 = {title:"Risk, return and diversification", sub:"Why the reward comes with ups and downs, and how to smooth them", days:[
 {title:"Risk and return", desc:"Ups, downs and averages", steps:[
  {h:"No free lunch", t:`<p>Investments that can earn more can also lose more. That trade‑off between <b>risk</b> and <b>return</b> runs through all of finance.</p>`,
   b:()=>`<div class="board"><h4>The usual ladder (long‑run, typical)</h4><table><tr><th>Investment</th><th>Risk</th><th>Expected return</th></tr><tr><td>Savings account</td><td>Very low</td><td>Low</td></tr><tr><td>Treasury bonds</td><td>Low</td><td>Low to moderate</td></tr><tr><td>Corporate bonds</td><td>Moderate</td><td>Moderate</td></tr><tr><td>Stock index fund</td><td>Higher</td><td>Higher</td></tr><tr><td>A single stock</td><td>Highest</td><td>Anything</td></tr></table></div>`},
  {h:"Measuring the swings", t:`<p>One simple measure of risk is the <b>range</b>: best year minus worst year. A wider range means a bumpier ride. Professionals use a related measure called standard deviation.</p>`,
   b:()=>work("Two funds, five years",["Fund A: 6%, 7%, 5%, 8%, 6% → range 3 points","Fund B: 25%, −15%, 30%, −5%, 10% → range 45 points","Same‑ish average, very different rides"])},
  {h:"The average trap", t:`<p>Averages can fool you. Gain 50%, then lose 50%: the average is 0%, but $1,000 becomes $1,500 and then $750.</p><p>To find what really happened, multiply year by year.</p>`,
   b:()=>work("$1,000: +50%, then −50%",["$1,000 × 1.50 = $1,500","$1,500 × 0.50 = $750","Average return 0%, actual loss 25%"])}
 ], practice:["rk_avg","rk_range","rk_growth","rk_avg_trap","risk_mc","rk_avg","rk_growth","rk_range","rk_avg_trap","rk_growth"]},
 {title:"Diversification", desc:"Spreading money so no one loss sinks you", steps:[
  {h:"Many baskets", t:`<p>Put everything in one company and one bad headline can wipe you out. Spread across hundreds of companies and any single failure barely matters. That's <b>diversification</b>.</p><p>It doesn't remove the risk of the whole market falling, but it removes most of the risk of any one company.</p>`,
   b:()=>work("$10,000",["In one stock that falls 80%: $2,000 left","In 100 stocks, one falls 80%: $9,920 left"])},
  {h:"Portfolio return", t:`<p>A portfolio's return is the <b>weighted average</b> of its parts.</p><div class="formula">Return = (weight A × return A) + (weight B × return B)</div><p>When stocks fall, high‑quality bonds often hold steady, so a mix swings less than stocks alone.</p>`,
   b:()=>work("60% stocks, 40% bonds",["Stocks: −20%, bonds: +4%","0.6 × −20% = −12%","0.4 × 4% = +1.6%","Portfolio: −10.4%"],"Half the stock market's fall")},
  {h:"Asset allocation", t:`<p>Your mix of stocks, bonds and cash is your <b>asset allocation</b>. It matters more than which individual funds you pick. Someone with decades ahead can ride out more swings, so he can hold more stocks.</p><p>One rough rule: 110 minus your age, in stocks.</p>`,
   b:()=>work("110 minus your age",["Age 14: 96% stocks","Age 40: 70% stocks","Age 70: 40% stocks"])}
 ], practice:["port_ret","port_value","age_rule","risk_mc","port_ret","port_value","risk_mc","port_ret","port_value","age_rule"]},
 {title:"Staying on plan", desc:"Rebalancing and dollar‑cost averaging", steps:[
  {h:"Rebalancing", t:`<p>After a big year for stocks, a 60/40 portfolio might drift to 70/30, riskier than you planned. <b>Rebalancing</b> means selling some of what grew and buying what lagged to get back to target.</p><p>It forces you to sell high and buy low, without guessing.</p>`,
   b:()=>work("Target 60/40",["Now: $7,000 stocks, $3,000 bonds","Total $10,000; stock target $6,000","Sell $1,000 of stocks, buy $1,000 of bonds"])},
  {h:"Dollar-cost averaging", t:`<p>Investing the same amount on a schedule, every month no matter what, is <b>dollar‑cost averaging</b>. When prices are low, your dollars buy more shares; when high, fewer.</p><p>Your average cost ends up below the average price.</p>`,
   b:()=>{const p=[20,10,20],sh=p.map(x=>100/x);return work("$100 a month",["$20: 5 shares","$10: 10 shares","$20: 5 shares",`$300 ÷ 20 shares = $15 average cost`],"The average price was $16.67")}},
  {h:"Time in the market", t:`<p>Trying to jump in and out at the right moment, called <b>market timing</b>, almost never works. Some of the market's best days come right after its worst, and those who sell in a panic often miss them.</p><p>A steady plan beats a clever guess.</p>`,
   b:()=>work("A plan that runs itself",["Automatic monthly investing","Low‑cost, diversified funds","Rebalance once a year","Ignore the daily news"])}
 ], practice:["rebal","dca","risk_mc","rebal","dca","port_ret","rebal","dca","risk_mc","rebal"]},
 {quiz:true, title:"Week 14 quiz", desc:`10 questions, ${PASS_MARK}% opens week 15`, steps:[
  {h:"Before the quiz", t:`<p>10 questions from this week. No hints, one try each. You need ${PASS_MARK}% to open week 15.</p>`,
   b:()=>`<div class="board"><h4>From this week</h4><table><tr><td>Real growth</td><td>multiply (1 + r) each year</td></tr><tr><td>Portfolio return</td><td>weighted average</td></tr><tr><td>Rebalance</td><td>back to target weights</td></tr><tr><td>DCA average cost</td><td>total $ ÷ total shares</td></tr></table></div>`}
 ], quizFrom:["rk_avg","rk_range","rk_growth","rk_avg_trap","port_ret","port_value","rebal","dca","age_rule","risk_mc","port_ret"]}
]};

/* ================= Week 15: Project ================= */
const W15 = {title:"Project: build a model portfolio", sub:"Design it, run it for a year, and plan the next forty", days:[
 {title:"Design the portfolio", desc:"Allocation and buying the shares", steps:[
  {h:"The project", t:`<p>This week you'll build a model portfolio with an imaginary <b>$10,000</b>, using everything from weeks 10 to 14. No real money, but real decisions.</p><p>Step one is the plan: what mix of stocks and bonds, and in which funds?</p>`,
   b:()=>work("Your design checklist",["1. Allocation: stocks vs. bonds","2. Funds: low‑cost and diversified","3. Buy the shares","4. Track, rebalance, and plan ahead"])},
  {h:"A simple three-fund mix", t:`<p>Many investors use just three index funds: a U.S. stock fund, an international stock fund and a bond fund. Together they own thousands of companies and bonds around the world.</p>`,
   b:()=>work("$10,000, 80% stocks",["U.S. stock fund: 50% = $5,000","International stock fund: 30% = $3,000","Bond fund: 20% = $2,000"])},
  {h:"Buying shares", t:`<p>If a fund is an ETF, you buy whole shares at its market price (some brokerages allow fractions, but plan for whole shares). Divide, then round down; the leftover stays in cash.</p>`,
   b:()=>work("$5,000 into an ETF at $236.40",["5,000 ÷ 236.40 = 21.15","Buy 21 shares: $4,964.40","Cash left: $35.60"])}
 ], practice:["pj2_shares","port_ret","age_rule","pj2_shares","er_cost","pj2_shares","idx_weight","pj2_shares","port_ret","pj2_shares"]},
 {title:"A year in the market", desc:"Tracking value, return and income", steps:[
  {h:"Updating the value", t:`<p>A year later, each holding has moved by its own return. Grow each one, then add them up.</p>`,
   b:()=>work("After one year",["U.S. stocks: $5,000 × 1.12 = $5,600","International: $3,000 × 0.96 = $2,880","Bonds: $2,000 × 1.03 = $2,060","Total: $10,540"])},
  {h:"Your total return", t:`<p>Include any dividends and interest the funds paid you.</p><div class="formula">Total return = (end value + income − start value) ÷ start value</div>`,
   b:()=>work("The model portfolio",["End: $10,540, income: $180","(10,540 + 180 − 10,000) ÷ 10,000","= 7.2%"])},
  {h:"Time to rebalance?", t:`<p>Check the mix against your target. If stocks have drifted well above it, rebalance.</p>`,
   b:()=>work("Target 80/20",["Stocks: $8,480 of $10,540 = 80.5%","Bonds: $2,060 = 19.5%","Close enough; no trade needed this year"])}
 ], practice:["pj2_value","pj2_ret","rebal","pj2_value","pj2_ret","port_value","pj2_value","pj2_ret","rebal","pj2_value"]},
 {title:"The forty-year plan", desc:"Regular investing, fees and staying the course", steps:[
  {h:"Adding every month", t:`<p>The $10,000 is a start. The real engine is adding money every month from your paycheck, for decades. That's the regular‑deposit formula from week 3, with monthly rates.</p><div class="formula">FV = D × ((1 + r)<sup>n</sup> − 1) ÷ r</div>`,
   b:()=>{const m=.07/12,n=480,fv=300*(Math.pow(1+m,n)-1)/m;return work("$300 a month, 7%, 40 years",[`r = ${nf(m,6)}, n = 480`,`FV = ${$m(r2(fv))}`,`Put in: $144,000`],`Growth adds about ${$m(Math.round((fv-144000)/1000)*1000)}`)}},
  {h:"Keep costs low", t:`<p>Over 40 years, a 1% fee can cost a large share of your ending balance. Your plan should name the expense ratio of every fund you hold.</p>`,
   b:()=>{const a=10000*Math.pow(1.0696,40),b=10000*Math.pow(1.06,40);return work("$10,000 for 40 years at 7%",[`0.04% fee: ${$m(Math.round(a))}`,`1% fee: ${$m(Math.round(b))}`,`Difference: ${$m(Math.round(a-b))}`])}},
  {h:"Write the rules down", t:`<p>The hardest part of investing isn't math. It's staying calm when markets fall. Investors who write down their rules ahead of time are less likely to panic.</p>`,
   b:()=>work("Sample investment rules",["Emergency fund and no card debt first","Invest every month, automatically","80% stocks, 20% bonds, low‑cost index funds","Rebalance once a year","Never sell in a panic"])}
 ], practice:["pj2_future","er_long","pj2_mc","pj2_future","dca","pj2_mc","pj2_future","er_long","pj2_mc","pj2_future"]},
 {quiz:true, title:"Week 15 quiz", desc:`10 questions on unit 3, ${PASS_MARK}% opens week 16`, steps:[
  {h:"Before the quiz", t:`<p>This quiz covers the whole Investing unit, weeks 10 through 15. No hints, one try each. You need ${PASS_MARK}% to open week 16 and finish unit 3.</p>`,
   b:()=>`<div class="board"><h4>Unit 3 in one table</h4><table><tr><td>Stocks</td><td>ownership, % change, P/E, dividends</td></tr><tr><td>Bonds</td><td>coupons, yields, prices vs. rates</td></tr><tr><td>Funds</td><td>NAV, index funds, expense ratios</td></tr><tr><td>Portfolios</td><td>weighted returns, rebalancing, DCA</td></tr></table></div>`}
 ], quizFrom:["st_pct","st_recover","tr_cagr","pe","bd_cy","bd_dir_mc","er_long","port_ret","rebal","pj2_future","pj2_mc"]}
]};
addWeek(10,W10); addWeek(11,W11); addWeek(12,W12); addWeek(13,W13); addWeek(14,W14); addWeek(15,W15);

Object.assign(DIVES, {
"10-1": {title:"The first shares", sections:[
  ["Ships and risk","In the 1600s, a voyage to Asia for spices could make a fortune or sink to the bottom of the sea. No single merchant wanted to risk everything on one ship. The answer was to split the risk among many investors."],
  ["The Dutch East India Company","In 1602, the Dutch East India Company sold shares to the public. Anyone could buy, and the shares could be traded with other people. It is widely considered the first company with publicly traded shares."],
  ["The first exchange","Trading in those shares grew so busy that Amsterdam became home to what's often called the first stock exchange. Many ideas investors still use, like buying shares on credit and betting on falling prices, appeared there within a few years."]],
 qs:[{q:"Which company is widely considered the first with publicly traded shares?",choices:["The Dutch East India Company","Bank of America","The New York Stock Exchange","Diners Club"],why:"It sold shares to the public in 1602."},
     {q:"Why did merchants want to share ownership of voyages?",choices:["To split the risk of losing a ship","To avoid paying sailors","Because spices were cheap","Because the law required it"],why:"Sharing ownership spread the risk."},
     {q:"Which city became home to an early stock exchange?",choices:["Amsterdam","Fresno","Babylon","Atlanta"],why:"Trading in the Dutch company's shares centered in Amsterdam."}]},
"10-2": {title:"Under the buttonwood tree", sections:[
  ["Twenty-four brokers","In 1792, 24 stockbrokers in New York signed an agreement to trade with one another and charge set commissions. Tradition says they met under a buttonwood tree on Wall Street, so it's called the Buttonwood Agreement."],
  ["The Big Board","That small group grew into the New York Stock Exchange, today one of the largest stock exchanges in the world. Nasdaq, founded in 1971, was the first electronic stock market."],
  ["From shouting to servers","For most of its history, trading meant people shouting orders on a crowded floor. Today almost all trades are matched by computers in a fraction of a second. The idea hasn't changed: a buyer, a seller and a price."]],
 qs:[{q:"The Buttonwood Agreement of 1792 led to:",choices:["The New York Stock Exchange","The Federal Reserve","The first credit card","Social Security"],why:"The brokers' group grew into the NYSE."},
     {q:"How many brokers signed the Buttonwood Agreement?",choices:["24","2","240","2,400"],why:"Twenty‑four brokers signed it."},
     {q:"Nasdaq was notable as:",choices:["The first electronic stock market","The oldest exchange","A bank","A bond rating agency"],why:"Nasdaq started in 1971 as an electronic market."}]},
"10-3": {title:"The crash of 1929", sections:[
  ["A roaring market","During the 1920s, stock prices soared. Many people bought stocks with borrowed money, sure prices would keep climbing. In 1929, they stopped."],
  ["The fall","Starting in October 1929, prices collapsed. By 1932, the Dow Jones Industrial Average had lost about 89% of its value from the peak. People who had borrowed to buy were wiped out."],
  ["The long climb back","The Dow didn't return to its 1929 peak until 1954, about 25 years later. That's the lopsided math from today's lesson: an 89% loss needs a gain of over 800% to recover. It's also why borrowing to invest and putting everything in stocks are so dangerous."]],
 qs:[{q:"About how much did the Dow fall from its 1929 peak to 1932?",choices:["About 89%","About 10%","About 25%","It rose"],why:"It lost about 89% of its value."},
     {q:"When did the Dow regain its 1929 peak?",choices:["1954","1930","2000","1933"],why:"It took until 1954."},
     {q:"Which habit made the crash worse for many investors?",choices:["Buying stocks with borrowed money","Holding bonds","Keeping an emergency fund","Diversifying"],why:"Borrowed money magnified the losses."}]},
"11-1": {title:"Patient owners", sections:[
  ["Paid to wait","Some companies have paid dividends without a break for many decades, through wars and recessions. Owners who held on collected checks the whole time, whatever the share price did."],
  ["Dividend aristocrats","An S&P 500 company that has raised its dividend every year for at least 25 years in a row is nicknamed a dividend aristocrat. Raising a dividend that long takes steady profits and careful management."],
  ["Cuts tell a story","Companies hate to cut dividends, because investors read a cut as a sign of trouble. That's why a sudden, very high yield can be a warning: the price may have fallen because investors expect a cut."]],
 qs:[{q:"A dividend aristocrat has raised its dividend every year for at least:",choices:["25 years","2 years","100 years","6 months"],why:"25 years in a row."},
     {q:"Why can a very high dividend yield be a warning?",choices:["The price may have fallen because a cut is expected","High yields are illegal","It means the company has no profit ever","Yields never change"],why:"Yield rises when price falls."},
     {q:"How do investors usually react to a dividend cut?",choices:["As a sign of trouble","As great news","They don't notice","By buying more bonds"],why:"Companies avoid cuts because of this reaction."}]},
"11-2": {title:"Compounding and Warren Buffett", sections:[
  ["An early start","Warren Buffett, one of the most successful investors in history, bought his first stock at age 11. He has often said he wishes he'd started even earlier."],
  ["Most of it came late","The vast majority of Buffett's fortune was built after his 50th birthday. That's not because he became a better investor late in life. It's compounding: the biggest growth comes in the final years of a long run, once the base is huge."],
  ["Giving it away","Buffett has pledged to give away the vast majority of his fortune to charity. The lesson for the rest of us is the same as week 1: time is the most powerful ingredient, and patience pays."]],
 qs:[{q:"How old was Buffett when he bought his first stock?",choices:["11","30","50","65"],why:"He bought his first stock at 11."},
     {q:"Why did most of Buffett's wealth come after age 50?",choices:["Compounding grows fastest late in a long run","He stopped investing early","Stocks only rise after 50","He won a lottery"],why:"Growth on a large base is largest at the end."},
     {q:"What has Buffett pledged to do with most of his fortune?",choices:["Give it to charity","Spend it on cars","Bury it","Put it all in one stock"],why:"He has pledged most of it to charity."}]},
"11-3": {title:"Mr. Market", sections:[
  ["The father of value investing","Benjamin Graham taught finance at Columbia University and wrote The Intelligent Investor, published in 1949. One of his students was a young Warren Buffett."],
  ["A moody partner","Graham imagined the market as a business partner named Mr. Market, who shows up every day offering to buy your share or sell you his. Some days he's thrilled and asks a silly high price; some days he's gloomy and offers a bargain."],
  ["Using his moods","Graham's point: you don't have to accept Mr. Market's price. Use his gloomy days to buy and ignore his excitement. Measures like P/E help you tell whether he's being reasonable."]],
 qs:[{q:"Who wrote The Intelligent Investor?",choices:["Benjamin Graham","Sal Khan","Alexander Hamilton","Frank McNamara"],why:"Graham published it in 1949."},
     {q:"In Graham's story, Mr. Market is:",choices:["A moody partner who offers prices every day","A bank teller","A bond rating agency","A tax collector"],why:"He represents the market's changing moods."},
     {q:"Graham's advice about Mr. Market's moods:",choices:["Use them, don't follow them","Always accept his price","Sell whenever he's gloomy","Never invest"],why:"Buy bargains on gloomy days; ignore the excitement."}]},
"12-1": {title:"Liberty Bonds", sections:[
  ["Paying for a war","When the United States entered World War I in 1917, it needed enormous amounts of money fast. The government sold Liberty Bonds directly to ordinary Americans."],
  ["Everyone a lender","Movie stars held rallies, posters covered cities, and Boy Scouts went door to door selling them. Millions of Americans who had never owned an investment bought bonds, lending billions of dollars to the government."],
  ["A habit that lasted","Liberty Bonds taught a generation what a bond was. During World War II, the government did it again with war bonds. Today, Americans can still buy savings bonds directly from the Treasury."]],
 qs:[{q:"Liberty Bonds were sold to pay for:",choices:["World War I","The Revolutionary War","The moon landing","The interstate highways"],why:"They funded the U.S. effort in World War I."},
     {q:"Who bought most Liberty Bonds?",choices:["Ordinary Americans","Only banks","Only foreign governments","Nobody"],why:"They were marketed to everyone."},
     {q:"Buying a Liberty Bond meant:",choices:["Lending money to the government","Owning part of the government","Paying a tax","Buying stock"],why:"A bond is a loan."}]},
"12-2": {title:"Hamilton's debt", sections:[
  ["A broke new country","After the Revolutionary War, the United States and its states owed huge debts, and many doubted they'd ever be repaid. The young nation's bonds traded far below their face value."],
  ["The plan","Alexander Hamilton, the first Secretary of the Treasury, persuaded Congress in 1790 to have the federal government take over the states' war debts and pay them in full. It was controversial, but it showed lenders that America paid what it owed."],
  ["Credit as strength","Because of that reputation, the United States could borrow at lower rates for generations. It's the same idea as a personal credit score: a record of paying back is worth a great deal."]],
 qs:[{q:"Who was the first U.S. Secretary of the Treasury?",choices:["Alexander Hamilton","George Washington","Benjamin Franklin","Bill Fair"],why:"Hamilton held the post first."},
     {q:"What did Hamilton's 1790 plan do?",choices:["Had the federal government take over and repay state war debts","Cancel all debts","Create the stock market","Ban bonds"],why:"The federal government assumed the states' debts."},
     {q:"Why did paying the debt in full help the country?",choices:["It built a reputation that lowered future borrowing costs","It raised taxes forever","It ended trade","It created inflation"],why:"Good credit makes borrowing cheaper."}]},
"12-3": {title:"Rating the borrowers", sections:[
  ["Railroads and risk","In the early 1900s, investors poured money into railroad bonds but had little information about which railroads were sound. In 1909, John Moody began publishing ratings of railroad bonds."],
  ["Letter grades","Rating agencies now grade bonds with letters, from AAA at the top down to D for default. The grade affects how much interest a borrower must pay: the riskier the borrower, the higher the rate."],
  ["When ratings fail","Ratings are opinions, not guarantees. Before the 2008 financial crisis, many mortgage‑related bonds were rated AAA and then collapsed. The lesson: understand what you own, even if it has a good grade."]],
 qs:[{q:"In 1909, John Moody began rating:",choices:["Railroad bonds","Credit cards","Restaurants","Tulips"],why:"Moody's started with railroad bonds."},
     {q:"A riskier borrower with a lower rating usually must pay:",choices:["A higher interest rate","A lower interest rate","No interest","The same as anyone"],why:"Lenders want more for more risk."},
     {q:"What did the 2008 crisis show about ratings?",choices:["Ratings are opinions and can be wrong","Ratings are always right","Ratings don't exist","Only stocks have ratings"],why:"Many AAA‑rated mortgage bonds collapsed."}]},
"13-1": {title:"The first mutual funds", sections:[
  ["Pooling in Boston","In 1924, the Massachusetts Investors Trust opened in Boston. It let ordinary people pool their money into a professionally managed collection of stocks and redeem their shares when they wanted. It's usually called the first modern American mutual fund."],
  ["Rules after the crash","After the 1929 crash, investors had lost trust. The Investment Company Act of 1940 set rules for funds: they had to disclose what they owned and what they charged."],
  ["A fund for everyone","Today, tens of millions of American households own mutual funds, many through 401(k) plans. The fund made diversification possible for people with only a little money to invest."]],
 qs:[{q:"Which is usually called the first modern American mutual fund?",choices:["The Massachusetts Investors Trust","The Dutch East India Company","Liberty Bonds","Diners Club"],why:"It opened in 1924."},
     {q:"What did the Investment Company Act of 1940 require?",choices:["Funds to disclose holdings and fees","Funds to close","Banks to issue cards","Payday loans"],why:"It set disclosure rules for funds."},
     {q:"What did mutual funds make possible for small investors?",choices:["Diversification","Guaranteed returns","No risk","Free stock"],why:"Pooling lets small investors own many securities."}]},
"13-2": {title:"Bogle's folly", sections:[
  ["A simple idea","John Bogle founded Vanguard in 1975. In 1976, he launched one of the first index funds for ordinary investors. It didn't try to pick winners; it just bought the stocks in the S&P 500 and charged very little."],
  ["Laughed at","Critics mocked it as 'Bogle's folly.' Why would anyone settle for average? The fund raised far less money than hoped at first."],
  ["The last laugh","Bogle's insight was that average, after low costs, beats most experts after high costs. Decades later, index funds hold trillions of dollars, and his idea is one of the most important in modern investing."]],
 qs:[{q:"Who launched one of the first index funds for ordinary investors?",choices:["John Bogle","Benjamin Graham","Warren Buffett","John Moody"],why:"Bogle launched it at Vanguard in 1976."},
     {q:"What did critics call the fund?",choices:["Bogle's folly","Bogle's gold","The Buttonwood fund","The Liberty fund"],why:"They thought matching the market was foolish."},
     {q:"Bogle's key insight was:",choices:["Average returns at low cost beat most high‑cost experts","Picking winners is easy","Fees don't matter","Bonds always beat stocks"],why:"Low costs leave more return for the investor."}]},
"13-3": {title:"Buffett's bet", sections:[
  ["A million‑dollar wager","In 2007, Warren Buffett bet $1 million that a simple S&P 500 index fund would beat a group of hedge funds, picked by professional managers, over the next ten years, 2008 through 2017."],
  ["The result","The index fund won easily. The hedge funds charged high fees, and those fees ate up much of whatever extra the managers earned."],
  ["To charity","Buffett's winnings went to charity. He has said that for most people, a low‑cost S&P 500 index fund is a sensible choice. His bet was a ten‑year lesson in the cost of fees."]],
 qs:[{q:"What did Buffett bet would win over ten years?",choices:["An S&P 500 index fund","A group of hedge funds","Gold","Bitcoin"],why:"He backed the index fund."},
     {q:"Why did the hedge funds lose?",choices:["Their high fees ate their returns","They bought index funds","They were closed","They held only cash"],why:"Fees took much of what the managers earned."},
     {q:"Where did Buffett's winnings go?",choices:["To charity","To a hedge fund","To the government","To his own fund"],why:"The prize went to charity."}]},
"14-1": {title:"Tulip mania", sections:[
  ["A flower craze","In the Netherlands in the 1630s, prices for rare tulip bulbs soared. According to famous accounts, some bulbs sold for as much as a house."],
  ["The pop","In early 1637, buyers suddenly vanished and prices collapsed. Tulip mania became the classic example of a bubble: prices rising because people expect them to keep rising, not because of real value."],
  ["How big was it?","Some modern historians think the old stories exaggerated the damage. Either way, the pattern has repeated many times since, in stocks, houses and other assets. When the only reason to buy is that the price is going up, be careful."]],
 qs:[{q:"Tulip mania took place in:",choices:["The Netherlands in the 1630s","New York in 1929","Babylon","Fresno in 1958"],why:"It happened in the Netherlands."},
     {q:"A bubble is when prices rise because:",choices:["People expect them to keep rising","Profits rise","The government sets them","Bonds pay more"],why:"Expectation, not value, drives a bubble."},
     {q:"What do some modern historians say about tulip mania?",choices:["The old stories may have exaggerated it","It never involved tulips","It lasted 100 years","It made everyone rich"],why:"They question how widespread the damage was."}]},
"14-2": {title:"Eggs and baskets", sections:[
  ["An old proverb","\"Don't put all your eggs in one basket\" is centuries old: drop the basket and you lose everything. Not everyone agreed. In 1894, Mark Twain wrote the opposite: put all your eggs in one basket, and watch that basket. For a single investor who can't watch hundreds of companies, the proverb usually wins."],
  ["Markowitz","In 1952, economist Harry Markowitz published a paper showing mathematically how combining investments that don't move together can lower risk without giving up return. He later shared the Nobel Prize in economics in 1990."],
  ["Same idea, two languages","Whether you call it a proverb or modern portfolio theory, the message is the same: don't let one investment decide your fate."]],
 qs:[{q:"Mark Twain's twist on the proverb was:",choices:["Put all your eggs in one basket, and watch that basket","Never buy eggs","Use two baskets only","Sell the basket"],why:"He flipped the proverb in 1894."},
     {q:"Harry Markowitz showed that combining investments can:",choices:["Lower risk without giving up return","Guarantee profits","Remove all risk","Avoid taxes"],why:"Mixing assets that don't move together smooths the ride."},
     {q:"Markowitz shared the Nobel Prize in economics in:",choices:["1990","1952","1602","2008"],why:"He won in 1990."}]},
"14-3": {title:"Time in the market", sections:[
  ["The temptation","When markets fall, selling feels safe. When they soar, buying feels urgent. Acting on those feelings means selling low and buying high, the opposite of what an investor wants."],
  ["Best days near worst days","Many of the stock market's biggest one‑day gains have come during frightening periods, close to its biggest losses. Investors who sell in a panic often miss the rebound."],
  ["Automatic beats clever","That's why so many experts recommend a boring plan: invest automatically, stay diversified, rebalance on a schedule and ignore the noise. The plan does the thinking when emotions are loudest."]],
 qs:[{q:"Acting on fear and excitement usually leads investors to:",choices:["Sell low and buy high","Sell high and buy low","Avoid all losses","Pay lower fees"],why:"Emotions push the wrong way."},
     {q:"Many of the market's best days happen:",choices:["Close to its worst days","Only in calm years","Never","On holidays"],why:"Big rebounds often follow big drops."},
     {q:"What does the reading recommend?",choices:["An automatic, diversified plan","Trading every day","Selling during every drop","Holding one stock"],why:"A steady plan beats emotional guesses."}]},
"15-1": {title:"Simple can be best", sections:[
  ["Fewer moving parts","Many experts argue that a beginner's portfolio needs only a few low‑cost index funds. Fewer funds means less to track, lower costs and fewer chances to make mistakes."],
  ["Target-date funds","Some investors use a single target‑date fund, named for the year they expect to retire. It holds a mix of stocks and bonds and gradually shifts toward bonds as the date approaches."],
  ["The goal","The best portfolio isn't the cleverest one. It's the one you understand, can afford, and will stick with for decades."]],
 qs:[{q:"Why can fewer funds be better for a beginner?",choices:["Less to track, lower costs, fewer mistakes","More funds are illegal","Index funds can't be combined","Fewer funds always return more"],why:"Simplicity has real advantages."},
     {q:"A target‑date fund:",choices:["Shifts toward bonds as its date approaches","Holds only one stock","Pays a fixed coupon","Is a credit card"],why:"It gets more conservative over time."},
     {q:"According to the reading, the best portfolio is the one:",choices:["You understand and will stick with","With the most funds","With the highest fees","That changes every week"],why:"Staying the course matters most."}]},
"15-2": {title:"Taxes on investments", sections:[
  ["Gains are income","When you sell an investment for more than you paid, the profit is a capital gain, and it's usually taxed. Dividends and bond interest are usually taxed too."],
  ["Holding longer helps","In the U.S., gains on investments held more than one year are long‑term capital gains, usually taxed at lower rates than gains on investments held a year or less. Patience can lower your tax bill."],
  ["Tax-advantaged accounts","Accounts like 401(k)s and IRAs let investments grow without yearly taxes on gains and dividends. That's another reason the course has pushed starting early in those accounts."]],
 qs:[{q:"Profit from selling an investment for more than you paid is a:",choices:["Capital gain","Coupon","Load","Dividend"],why:"That's a capital gain."},
     {q:"In the U.S., gains on investments held more than one year are usually:",choices:["Taxed at lower rates","Taxed at higher rates","Never taxed","Illegal"],why:"Long‑term gains generally get lower rates."},
     {q:"Why do 401(k)s and IRAs help?",choices:["Investments grow without yearly taxes","They guarantee returns","They have no rules","They pay coupons"],why:"Taxes don't slow the compounding each year."}]},
"15-3": {title:"The janitor's fortune", sections:[
  ["A quiet life","Ronald Read worked for decades as a gas station attendant and later a janitor in Brattleboro, Vermont. He lived simply, drove an old car and didn't draw attention to himself."],
  ["The surprise","When he died in 2014, people learned he had built a fortune of about $8 million. He had saved steadily, bought shares in well‑known companies, reinvested his dividends and held on for decades."],
  ["Where it went","He left most of it to his local library and hospital. His story shows that you don't need a big salary to build wealth. You need to spend less than you earn, invest the difference and give compounding time."]],
 qs:[{q:"What did Ronald Read do for a living?",choices:["Gas station attendant and janitor","Hedge fund manager","Bank president","Stockbroker"],why:"He had ordinary jobs all his life."},
     {q:"About how much was his fortune?",choices:["$8 million","$8,000","$800","$8 billion"],why:"About $8 million."},
     {q:"What was the key to his wealth?",choices:["Saving steadily, reinvesting and holding for decades","A lottery win","Payday lending","Day trading"],why:"Patience and compounding."}]}
});

GLOSSARY.push(
 ["Stock","Ownership in a company, divided into shares.",10],["Share","One unit of ownership in a company.",10],["IPO","Initial public offering: a company's first sale of shares to the public.",10],
 ["Stock exchange","A marketplace where shares are bought and sold, such as the NYSE or Nasdaq.",10],["Brokerage","A firm that buys and sells investments for customers.",10],
 ["Market capitalization","Share price times the number of shares; the market's value of a company.",10],["Index","A list tracking a group of stocks, such as the S&P 500.",10],
 ["S&P 500","An index of about 500 large U.S. companies.",10],["Bull market","A period of rising stock prices.",10],["Bear market","A long period of falling stock prices.",10],
 ["Average cost","Total dollars spent on an investment divided by shares owned.",10],
 ["Dividend","A share of profits paid to stockholders.",11],["Dividend yield","Yearly dividend divided by share price.",11],["Total return","Price change plus income, divided by the amount invested.",11],
 ["CAGR","Compound annual growth rate: the steady yearly rate that produces a given result.",11],["Earnings","A company's profit.",11],["EPS","Earnings per share: profit divided by shares.",11],
 ["P/E ratio","Share price divided by earnings per share.",11],
 ["Bond","A loan to a company or government that pays interest and is repaid at maturity.",12],["Face value","The amount a bond repays at maturity, often $1,000.",12],
 ["Coupon","The interest a bond pays, as a percent of face value.",12],["Maturity","The date a bond's face value is repaid.",12],["Yield","The return a bond gives at the price paid.",12],
 ["Current yield","Yearly coupon divided by a bond's price.",12],["Zero‑coupon bond","A bond that pays no interest along the way, only its face value at maturity.",12],
 ["Treasury bond","A bond issued by the U.S. government.",12],["Municipal bond","A bond issued by a state or city.",12],["Corporate bond","A bond issued by a company.",12],
 ["Credit rating","A grade, such as AAA, for how likely a borrower is to repay.",12],["Junk bond","A high‑yield bond rated below investment grade.",12],["Default","Failing to make promised payments on a debt.",12],
 ["Mutual fund","A pool of investors' money invested in many securities.",13],["NAV","Net asset value: a fund's assets minus liabilities, divided by shares.",13],
 ["Index fund","A fund that holds the securities in an index to match its return.",13],["ETF","Exchange‑traded fund: a fund that trades on an exchange like a stock.",13],
 ["Expense ratio","A fund's yearly fee as a percent of the money invested.",13],["Load","A sales fee charged by some mutual funds.",13],
 ["Active management","Picking investments to try to beat the market.",13],["Passive management","Matching an index instead of trying to beat it.",13],["Cap‑weighted","An index that weights each company by its market cap.",13],
 ["Risk","The chance that an investment's return differs from what you expect, including losing money.",14],["Volatility","How much an investment's price swings.",14],
 ["Diversification","Spreading money across many investments to reduce risk.",14],["Asset allocation","The mix of stocks, bonds and cash in a portfolio.",14],
 ["Rebalancing","Trading to bring a portfolio back to its target mix.",14],["Dollar‑cost averaging","Investing a fixed amount on a regular schedule.",14],
 ["Market timing","Trying to buy before rises and sell before falls.",14],["Bubble","Prices rising far above value because people expect them to keep rising.",14],
 ["Portfolio","All of a person's investments together.",15],["Target‑date fund","A fund that shifts from stocks toward bonds as a chosen year approaches.",15],
 ["Capital gain","Profit from selling an investment for more than it cost.",15]
);
