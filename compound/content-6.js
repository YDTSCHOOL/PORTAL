/* Weeks 21-25: Tax brackets; Insurance; Cars and homes; Charity, goals and a long-term plan; Capstone */
/* Simplified brackets for this course, shaped like the real federal brackets for a single filer. */
const BRK = [[0,12000,10],[12000,48000,12],[48000,100000,22],[100000,190000,24]];
const BRK_TXT = "10% on the first $12,000; 12% from $12,000 to $48,000; 22% from $48,000 to $100,000; 24% from $100,000 to $190,000";
function bTax(x){let t=0,lines=[];for(const [lo,hi,r] of BRK){if(x>lo){const part=Math.min(x,hi)-lo;t+=part*r/100;lines.push(`${r}% × ${$m(part)} = ${$m(r2(part*r/100))}`)}}return{t,lines}}
const bRate = x => (BRK.find(b=>x>b[0]&&x<=b[1])||BRK[BRK.length-1])[2];
const brTable = () => `<div class="board"><h4>Course tax brackets (single filer, simplified)</h4><table><tr><th>Taxable income</th><th>Rate on that slice</th></tr>${BRK.map(b=>`<tr><td>${$m(b[0])} – ${$m(b[1])}</td><td>${b[2]}%</td></tr>`).join("")}</table></div>`;

Object.assign(G, {
/* ---- Week 21: Tax brackets ---- */
tx_taxable(rng){const g=R(30,120)*1000+R(0,9)*100,d=pick(rng,[14600,15000,16000]),k=pick(rng,[0,0,2000,3000,4000]);
  return{q:`His income is ${$m(g)}.${k?` He put ${$m(k)} into a traditional 401(k), which isn't taxed this year.`:""} He takes a standard deduction of ${$m(d)}. What is his taxable income?`,ans:g-k-d,unit:"$",hint:`Taxable income = income${k?" − pre‑tax savings":""} − deduction.`,steps:[`${$m(g)}${k?` − ${$m(k)}`:""} − ${$m(d)} = ${$m(g-k-d)}`]}},
tx_bracket(rng){const x=R(15,180)*1000+R(0,9)*100,b=bTax(x);
  return{q:`Using the course brackets (${BRK_TXT}), how much tax is owed on taxable income of ${$m(x)}?`,ans:b.t,unit:"$",tol:.001,hint:`Each slice of income is taxed at its own rate. Fill the brackets from the bottom up.`,steps:[...b.lines,`Total: ${$m(r2(b.t))}`]}},
tx_marginal(rng){const x=R(5,185)*1000+R(1,9)*100;
  return{q:`Using the course brackets (${BRK_TXT}), what is the marginal tax rate for someone with taxable income of ${$m(x)}?`,ans:bRate(x),unit:"%",abs:0,tol:0,hint:`The marginal rate is the rate on the next dollar earned: the bracket his top dollar falls in.`,steps:[`${$m(x)} falls in the ${bRate(x)}% bracket`]}},
tx_effective(rng){const x=R(20,180)*1000,b=bTax(x);
  return{q:`On taxable income of ${$m(x)}, the tax owed is ${$m(r2(b.t))}. What is the effective tax rate? (Two decimals.)`,ans:r2(b.t)/x*100,unit:"%",abs:.006,hint:`Effective rate = total tax ÷ taxable income.`,steps:[`${$m(r2(b.t))} ÷ ${$m(x)} = ${nf(r2(b.t)/x*100,2)}%`]}},
tx_raise(rng){const x=pick(rng,[47000,46500,99000,98000,47500]),ra=R(2,6)*1000,a=bTax(x).t,b=bTax(x+ra).t;
  return{q:`His taxable income goes from ${$m(x)} to ${$m(x+ra)} after a raise, crossing into a higher bracket. Using the course brackets (${BRK_TXT}), how much more tax does he owe?`,ans:b-a,unit:"$",tol:.001,hint:`Only the dollars above the bracket line are taxed at the higher rate. The rest of his income is taxed the same as before.`,steps:[`Tax before: ${$m(r2(a))}`,`Tax after: ${$m(r2(b))}`,`Extra tax: ${$m(r2(b-a))}`,`He keeps ${$m(r2(ra-(b-a)))} of the ${$m(ra)} raise`]}},
tx_ded_credit(rng){const amt=pick(rng,[500,1000,2000]),r=pick(rng,[12,22,24]),k=R(0,1);
  return k===0?{q:`He's in the ${r}% bracket. A ${$m(amt)} tax deduction lowers his taxable income. How much tax does it save him?`,ans:amt*r/100,unit:"$",hint:`A deduction saves the deduction × your marginal rate.`,steps:[`${$m(amt)} × ${r/100} = ${$m(amt*r/100)}`]}
   :{q:`He's in the ${r}% bracket. How much more does a ${$m(amt)} tax credit save him than a ${$m(amt)} tax deduction?`,ans:amt-amt*r/100,unit:"$",hint:`A credit cuts the tax itself dollar for dollar. A deduction only saves your marginal rate on it.`,steps:[`Credit saves ${$m(amt)}`,`Deduction saves ${$m(amt)} × ${r/100} = ${$m(amt*r/100)}`,`Difference: ${$m(amt-amt*r/100)}`]}},
tx_refund(rng){const owed=R(20,120)*50,w=Math.round(owed*R(70,130)/100/10)*10;
  return{q:`His tax for the year comes to ${$m(owed)}. His employer withheld ${$m(w)} from his paychecks. What is his refund? (Negative if he owes more.)`,ans:w-owed,unit:"$",abs:.01,tol:0,hint:`Refund = withheld − tax owed.`,steps:[`${$m(w)} − ${$m(owed)} = ${$m(w-owed)}`,w>=owed?"Refund.":"He owes the difference by Tax Day."]}},
tx_mc(rng){const k=R(0,5);const Q=[
  ["A raise pushes part of his income into a higher bracket. What happens?","Only the dollars above the line are taxed at the higher rate",["Only the dollars above the line are taxed at the higher rate","All his income is taxed at the higher rate","He takes home less than before the raise","Nothing changes"]],
  ["The rate on your next dollar of income is your:","Marginal tax rate",["Marginal tax rate","Effective tax rate","Sales tax","Interest rate"]],
  ["Total tax ÷ taxable income is your:","Effective tax rate",["Effective tax rate","Marginal tax rate","Bracket","Deduction"]],
  ["Which saves more: a $1,000 credit or a $1,000 deduction?","The credit",["The credit","The deduction","They're always equal","Neither saves anything"]],
  ["A system where higher incomes pay higher rates on their top dollars is called:","Progressive",["Progressive","Flat","Regressive","Fixed"]],
  ["When is the usual deadline to file a federal income tax return?","April 15",["April 15","January 1","July 4","December 31"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`Think about how brackets slice up income.`,steps:[`${Q[1]}.`]}},

/* ---- Week 22: Insurance ---- */
in_year(rng){const m=R(40,400)+pick(rng,[0,.5]),k=pick(rng,[0,0,1]);
  return{q:`An insurance policy costs ${$m(m)} a month${k?", or he can pay once a year and get 5% off the yearly total":""}. ${k?"How much does he pay for the year if he pays once?":"How much does it cost for a year?"}`,ans:m*12*(k?0.95:1),unit:"$",hint:`Twelve monthly premiums make a year.${k?" Then take 5% off.":""}`,steps:[`${$m(m)} × 12 = ${$m(r2(m*12))}`,...(k?[`× 0.95 = ${$m(r2(m*12*.95))}`]:[])]}},
in_deduct(rng){const d=pick(rng,[250,500,1000,2000]),c=R(3,80)*100;
  return{q:`His car insurance has a ${$m(d)} deductible. After an accident, the repair costs ${$m(c)}. How much does the insurance company pay?`,ans:Math.max(c-d,0),unit:"$",hint:`He pays the deductible first. Insurance pays the rest (or nothing, if the repair is smaller than the deductible).`,steps:[`${$m(c)} − ${$m(d)} = ${$m(Math.max(c-d,0))}${c<d?" (repair is under the deductible, so insurance pays $0)":""}`]}},
in_coins(rng){const d=pick(rng,[500,1000,1500,2000]),co=pick(rng,[10,20,30]),mx=pick(rng,[4000,5000,6000]),b=R(10,400)*100,you=Math.min(b<=d?b:d+(b-d)*co/100,mx);
  return{q:`His health plan has a ${$m(d)} deductible, then ${co}% coinsurance, with an out‑of‑pocket maximum of ${$m(mx)}. He gets a medical bill of ${$m(b)}. How much does he pay?`,ans:you,unit:"$",hint:`He pays the whole deductible, then ${co}% of the rest. But never more than the out‑of‑pocket maximum.`,steps:b<=d?[`The bill is under the deductible: he pays all ${$m(b)}`]:[`Deductible: ${$m(d)}`,`Coinsurance: ${co}% × ${$m(b-d)} = ${$m(r2((b-d)*co/100))}`,`Total: ${$m(r2(d+(b-d)*co/100))}`,...(d+(b-d)*co/100>mx?[`Capped at the maximum: ${$m(mx)}`]:[])]}},
in_compare(rng){const pa=R(15,40)*10,da=pick(rng,[3000,4000,5000]),pb=pa+R(8,25)*10,db=pick(rng,[500,1000]),e=R(0,60)*100,ya=pa*12+Math.min(e,da),yb=pb*12+Math.min(e,db);
  return{q:`Plan A costs ${$m(pa)} a month with a ${$m(da)} deductible. Plan B costs ${$m(pb)} a month with a ${$m(db)} deductible. He expects ${$m(e)} of medical bills this year (assume he pays bills up to the deductible and the plan pays the rest). How much cheaper is plan A for the year? (Negative if plan B is cheaper.)`,ans:yb-ya,unit:"$",abs:.01,tol:0,hint:`For each plan: 12 premiums + what he pays of the bills (up to the deductible).`,steps:[`A: ${$m(pa*12)} + ${$m(Math.min(e,da))} = ${$m(ya)}`,`B: ${$m(pb*12)} + ${$m(Math.min(e,db))} = ${$m(yb)}`,`B − A = ${$m(yb-ya)}`]}},
in_expected(rng){const p=pick(rng,[.5,1,2,5]),l=R(5,200)*1000;
  return{q:`An insurer estimates that ${p}% of homes like his will have a fire costing ${$m(l)} this year. What is the expected loss per home, the starting point for the premium?`,ans:l*p/100,unit:"$",hint:`Expected loss = chance × cost.`,steps:[`${p}% × ${$m(l)} = ${$m(r2(l*p/100))}`]}},
in_life(rng){const inc=R(35,120)*1000,m=pick(rng,[8,10,12]),s=R(0,15)*5000;
  return{q:`A common rule of thumb says a parent's life insurance should replace about ${m} times his yearly income. He earns ${$m(inc)} and already has ${$m(s)} saved toward this need. How much coverage should he buy?`,ans:inc*m-s,unit:"$",hint:`${m} × income, minus what's already saved.`,steps:[`${m} × ${$m(inc)} = ${$m(inc*m)}`,`− ${$m(s)} = ${$m(inc*m-s)}`]}},
in_mc(rng){const k=R(0,6);const Q=[
  ["The monthly or yearly price of an insurance policy is the:","Premium",["Premium","Deductible","Claim","Copay"]],
  ["The amount you pay before insurance starts paying is the:","Deductible",["Deductible","Premium","Policy limit","Coinsurance"]],
  ["Choosing a higher deductible usually:","Lowers your premium",["Lowers your premium","Raises your premium","Has no effect","Cancels the policy"]],
  ["Which risk is best handled with insurance?","A rare event that would be very costly",["A rare event that would be very costly","A $5 broken pencil","Buying groceries","Monthly rent"]],
  ["Renter's insurance mainly covers:","Your belongings",["Your belongings","The landlord's building","Your car","Your job"]],
  ["Term life insurance:","Covers a set number of years at a low cost",["Covers a set number of years at a low cost","Lasts forever and builds big savings","Pays for car repairs","Covers only health bills"]],
  ["Insurance works because:","Many people pay small premiums to cover the few who have big losses",["Many people pay small premiums to cover the few who have big losses","The government pays everyone","Losses never happen","Premiums are refunded every year"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`Think about who pays what, and when.`,steps:[`${Q[1]}.`]}},

/* ---- Week 23: Cars and homes ---- */
car_otd(rng){const p=R(8,45)*500,t=6,f=R(2,8)*50;
  return{q:`A car's price is ${$m(p)}. Michigan sales tax is ${t}%, and title and registration fees are ${$m(f)}. What is the out‑the‑door cost?`,ans:p*(1+t/100)+f,unit:"$",hint:`Add the sales tax to the price, then add the fees.`,steps:[`Tax: ${$m(p)} × 0.06 = ${$m(p*.06)}`,`${$m(p)} + ${$m(p*.06)} + ${$m(f)} = ${$m(r2(p*1.06+f))}`]}},
car_depr(rng){const p=R(16,50)*1000,d=pick(rng,[12,15,18,20]),n=pick(rng,[2,3,4,5]),v=p*Math.pow(1-d/100,n);
  return{q:`A new car costs ${$m(p)} and loses about ${d}% of its value each year. What is it worth after ${n} years?`,ans:v,unit:"$",tol:.002,hint:`Each year it keeps ${100-d}% of the year before: multiply by ${nf(1-d/100,2)} once per year.`,steps:[`${$m(p)} × ${nf(1-d/100,2)}<sup>${n}</sup>`,`= ${$m(r2(v))}`]}},
car_gas(rng){const mi=R(8,18)*1000,mpg=R(20,40),g=R(280,420)/100;
  return{q:`He drives ${mi.toLocaleString()} miles a year in a car that gets ${mpg} miles per gallon. Gas costs ${$m(g)} a gallon. How much does he spend on gas in a year?`,ans:mi/mpg*g,unit:"$",tol:.002,hint:`Gallons = miles ÷ mpg. Then multiply by the price per gallon.`,steps:[`${mi.toLocaleString()} ÷ ${mpg} = ${nf(mi/mpg,2)} gallons`,`× ${$m(g)} = ${$m(r2(mi/mpg*g))}`]}},
car_own(rng){const pay=R(20,55)*10,ins=R(80,200),gas=R(80,220),mt=R(30,100),mi=R(8,18)*1000,yr=(pay+ins+gas+mt)*12;
  return{q:`His car costs ${$m(pay)} a month for the loan, ${$m(ins)} for insurance, ${$m(gas)} for gas, and about ${$m(mt)} for maintenance. He drives ${mi.toLocaleString()} miles a year. What does the car cost per mile? (Two decimals.)`,ans:yr/mi,unit:"$",abs:.006,hint:`Find the yearly total, then divide by miles driven.`,steps:[`Monthly: ${$m(pay+ins+gas+mt)}`,`Yearly: ${$m(yr)}`,`÷ ${mi.toLocaleString()} miles = ${$m(r2(yr/mi))} a mile`]}},
home_pmt(rng){const pr=R(15,45)*10000,d=pick(rng,[5,10,20]),a=pick(rng,[5.5,6,6.5,7]),L=pr*(1-d/100),p=loanPay(L,a,360);
  return{q:`A home costs ${$m(pr)}. He puts ${d}% down and takes a 30‑year mortgage at ${a}% for the rest. What is the monthly principal and interest payment?`,ans:p,unit:"$",tol:.003,hint:`Loan = price − down payment. Then use the payment formula with n = 360.`,steps:[`Loan: ${$m(pr)} × ${nf(1-d/100,2)} = ${$m(L)}`,`r = ${nf(a/1200,6)}, n = 360`,`PMT = ${$m(r2(p))}`]}},
home_int(rng){const L=R(15,45)*10000,a=pick(rng,[5.5,6,6.5,7]),y=pick(rng,[15,30]),p=r2(loanPay(L,a,y*12));
  return{q:`A ${$m(L)} mortgage at ${a}% for ${y} years has a monthly payment of ${$m(p)}. How much interest is paid over the whole loan?`,ans:p*y*12-L,unit:"$",tol:.002,hint:`Total of all payments minus the amount borrowed.`,steps:[`${$m(p)} × ${y*12} = ${$m(r2(p*y*12))}`,`− ${$m(L)} = ${$m(r2(p*y*12-L))}`]}},
home_afford(rng){const s=R(40,150)*1000;
  return{q:`Many lenders want total housing costs at or below 28% of gross monthly income. He earns ${$m(s)} a year. What is the most he should spend on housing each month?`,ans:s/12*.28,unit:"$",hint:`Monthly gross × 0.28.`,steps:[`${$m(s)} ÷ 12 = ${$m(r2(s/12))}`,`× 0.28 = ${$m(r2(s/12*.28))}`]}},
home_piti(rng){const p=R(90,260)*10,tx=R(20,90)*100,ins=R(9,30)*100;
  return{q:`His mortgage payment is ${$m(p)} a month. Property taxes are ${$m(tx)} a year and homeowner's insurance is ${$m(ins)} a year. What is his total monthly housing cost?`,ans:p+(tx+ins)/12,unit:"$",tol:.002,hint:`Turn the yearly costs into monthly amounts, then add the mortgage payment.`,steps:[`Taxes: ${$m(tx)} ÷ 12 = ${$m(r2(tx/12))}`,`Insurance: ${$m(ins)} ÷ 12 = ${$m(r2(ins/12))}`,`Total: ${$m(r2(p+(tx+ins)/12))}`]}},
big_mc(rng){const k=R(0,5);const Q=[
  ["A new car usually loses value fastest:","In its first few years",["In its first few years","After 15 years","Never","Only when it's sold"]],
  ["Which usually costs less overall?","A reliable used car bought with a solid down payment",["A reliable used car bought with a solid down payment","A new car on a 7‑year loan","Leasing a new car every 2 years forever","Any car with the lowest monthly payment"]],
  ["A 15‑year mortgage compared with a 30‑year one has:","Higher payments but much less total interest",["Higher payments but much less total interest","Lower payments and less interest","The same total interest","No interest"]],
  ["Beyond the mortgage, homeowners also pay:","Property taxes, insurance and repairs",["Property taxes, insurance and repairs","Nothing else","Only rent","A landlord's fees"]],
  ["Renting can make more sense than buying when:","You may move within a few years",["You may move within a few years","You plan to stay 30 years","Prices never change","You want to do your own repairs"]],
  ["Shopping for a car loan before visiting the dealer helps because:","You know your rate and budget before you negotiate",["You know your rate and budget before you negotiate","Dealers can't offer loans","It raises the car's price","It lowers your credit score"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`Think about the total cost, not just the monthly payment.`,steps:[`${Q[1]}.`]}},

/* ---- Week 24: Charity, goals and a long-term plan ---- */
gl_monthly(rng){const g=R(5,60)*1000,y=pick(rng,[3,5,8,10]),a=pick(rng,[3,4,5,6]),r=a/1200,n=y*12,d=g*r/(Math.pow(1+r,n)-1);
  return{q:`He wants ${$m(g)} in ${y} years for a goal. His savings earn ${a}% a year, compounded monthly. How much must he save at the end of each month? Use D = goal × r ÷ ((1 + r)<sup>n</sup> − 1).`,ans:d,unit:"$",tol:.003,hint:`This is the regular‑deposit formula from week 3, solved for the deposit. r = APR ÷ 12, n = months.`,steps:[`r = ${nf(r,6)}, n = ${n}`,`(1 + r)<sup>${n}</sup> − 1 = ${nf(Math.pow(1+r,n)-1,5)}`,`D = ${$m(g)} × ${nf(r,6)} ÷ ${nf(Math.pow(1+r,n)-1,5)} = ${$m(r2(d))}`]}},
gl_lump(rng){const g=R(10,100)*1000,y=pick(rng,[5,10,15,20]),a=pick(rng,[5,6,7]),pv=g/Math.pow(1+a/100,y);
  return{q:`How much would he need to invest today, at ${a}% a year, to have ${$m(g)} in ${y} years?`,ans:pv,unit:"$",tol:.002,hint:`Present value: goal ÷ (1 + r)<sup>n</sup>.`,steps:[`${$m(g)} ÷ ${nf(1+a/100,2)}<sup>${y}</sup> = ${$m(r2(pv))}`]}},
gl_future_cost(rng){const c=R(5,60)*1000,i=pick(rng,[2,3,4]),y=pick(rng,[5,10,20,30]),f=c*Math.pow(1+i/100,y);
  return{q:`Something costs ${$m(c)} today. With ${i}% inflation each year, about what will it cost in ${y} years?`,ans:f,unit:"$",tol:.002,hint:`Prices compound with inflation, just like interest.`,steps:[`${$m(c)} × ${nf(1+i/100,2)}<sup>${y}</sup> = ${$m(r2(f))}`]}},
ch_give(rng){const inc=R(30,150)*1000,p=pick(rng,[2,5,10,15]);
  return{q:`He decides to give ${p}% of his yearly income of ${$m(inc)} to charity. How much is that per month?`,ans:inc*p/100/12,unit:"$",tol:.002,hint:`Find the yearly amount first, then divide by 12.`,steps:[`${$m(inc)} × ${p/100} = ${$m(inc*p/100)} a year`,`÷ 12 = ${$m(r2(inc*p/100/12))} a month`]}},
ch_deduct(rng){const g=R(10,100)*100,r=pick(rng,[22,24]);
  return{q:`He itemizes his deductions and is in the ${r}% bracket. He gives ${$m(g)} to a qualified charity. How much does the deduction lower his tax?`,ans:g*r/100,unit:"$",hint:`A deduction saves the amount × your marginal rate.`,steps:[`${$m(g)} × ${r/100} = ${$m(g*r/100)}`,`The gift really costs him ${$m(g-g*r/100)}`]}},
rt_nest(rng){const s=R(30,120)*1000,ss=R(0,30)*1000,need=s-ss;
  return{q:`He expects to need ${$m(s)} a year in retirement, and Social Security should cover ${$m(ss)} of it. Using the 4% rule (withdraw 4% of savings a year), how big a nest egg does he need?`,ans:need/.04,unit:"$",hint:`Find the yearly gap, then divide by 0.04 (the same as multiplying by 25).`,steps:[`Gap: ${$m(s)} − ${$m(ss)} = ${$m(need)}`,`${$m(need)} ÷ 0.04 = ${$m(need/.04)}`]}},
rt_early(rng){const d=R(10,40)*25,a=7,r=a/1200,y1=pick(rng,[40,45]),y2=y1-pick(rng,[10,15]),f1=d*(Math.pow(1+r,y1*12)-1)/r,f2=d*(Math.pow(1+r,y2*12)-1)/r;
  return{q:`Two savers each invest ${$m(d)} a month at 7% (compounded monthly) until 65. One starts ${y1} years before retirement, the other ${y2} years before. How much more does the early starter have at 65?`,ans:f1-f2,unit:"$",tol:.003,hint:`Use FV = D × ((1 + r)<sup>n</sup> − 1) ÷ r for each, with r = 0.07 ÷ 12.`,steps:[`${y1} years: ${$m(r2(f1))}`,`${y2} years: ${$m(r2(f2))}`,`Difference: ${$m(r2(f1-f2))}`]}},
gl_mc(rng){const k=R(0,5);const Q=[
  ["Which goal is most useful for planning?","Save $3,000 for a used laptop by next June",["Save $3,000 for a used laptop by next June","Have more money someday","Be rich","Spend less, maybe"]],
  ["The 4% rule suggests a retiree can withdraw about:","4% of savings in the first year, adjusted for inflation",["4% of savings in the first year, adjusted for inflation","40% a year","Everything at once","Nothing until 90"]],
  ["Why plan for inflation in long‑term goals?","Prices will likely be much higher in the future",["Prices will likely be much higher in the future","Prices always fall","Inflation only affects stocks","It lowers taxes"]],
  ["Before giving to a charity, a smart giver:","Checks how the charity uses its money",["Checks how the charity uses its money","Gives to anyone who calls","Pays in gift cards","Never asks questions"]],
  ["Starting retirement savings 10 years earlier usually:","Makes a much bigger difference than saving a little more later",["Makes a much bigger difference than saving a little more later","Makes no difference","Costs more in the end","Is against the rules"]],
  ["A will is important because it:","Says who receives your property and who cares for your children",["Says who receives your property and who cares for your children","Lowers your credit score","Is only for the very rich","Pays your bills"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`Think long term.`,steps:[`${Q[1]}.`]}},

/* ---- Week 25: Capstone ---- */
cap_life(rng){const s=R(45,90)*1000,p=pick(rng,[10,12,15]),y=pick(rng,[35,40,45]),r=.07/12,d=s*p/100/12,f=d*(Math.pow(1+r,y*12)-1)/r;
  return{q:`In your plan, you earn ${$m(s)} a year and save ${p}% of it for retirement each month for ${y} years at 7% (compounded monthly). Ignoring raises, how much will you have?`,ans:f,unit:"$",tol:.003,hint:`Monthly deposit = salary × ${p}% ÷ 12. Then use the regular‑deposit formula.`,steps:[`Deposit: ${$m(s)} × ${p/100} ÷ 12 = ${$m(r2(d))}`,`r = ${nf(r,6)}, n = ${y*12}`,`FV = ${$m(r2(f))}`]}},
cap_check(rng){const inc=R(4,9)*1000,h=Math.round(inc*R(22,38)/100/10)*10,car=R(20,60)*10,cc=pick(rng,[0,0,150,300]),sv=Math.round(inc*R(5,20)/100/10)*10;
  return{q:`Your plan's month: gross pay ${$m(inc)}, housing ${$m(h)}, car costs ${$m(car)}, credit card interest ${$m(cc)}, retirement savings ${$m(sv)}. What percent of gross pay goes to housing? (One decimal.)`,ans:h/inc*100,unit:"%",abs:.06,hint:`Housing ÷ gross pay. Compare it with the 28% guideline.`,steps:[`${$m(h)} ÷ ${$m(inc)} = ${nf(h/inc*100,1)}%`,h/inc>.28?"Above the 28% guideline.":"Within the 28% guideline."]}},
cap_mc(rng){const k=R(0,6);const Q=[
  ["In what order should a first plan usually tackle these?","Emergency fund, high‑interest debt, employer match, then more investing",["Emergency fund, high‑interest debt, employer match, then more investing","Investing, then emergency fund, then debt","New car, then savings","Debt last"]],
  ["Your raise is $4,000. What does your plan say?","Send part or all of it to savings before lifestyle creep",["Send part or all of it to savings before lifestyle creep","Spend it all","Lease a nicer car","Take a bigger loan"]],
  ["Why review your plan once a year?","Income, goals and prices change",["Income, goals and prices change","Plans expire legally","Banks require it","It lowers taxes automatically"]],
  ["Which insurance matters most for a young single worker with no kids?","Health, auto and renter's insurance",["Health, auto and renter's insurance","A large whole life policy","Pet insurance only","No insurance at all"]],
  ["A plan's biggest enemy is usually:","Not following it",["Not following it","Compound interest","Index funds","Writing it down"]],
  ["Of everything in this course, what matters most for long‑term wealth?","Spending less than you earn, starting early and staying patient",["Spending less than you earn, starting early and staying patient","Picking hot stocks","Borrowing as much as possible","Waiting to start until you're older"]],
  ["Which helps a plan run automatically?","Automatic transfers to savings on payday",["Automatic transfers to savings on payday","Checking your balance once a year","Paying bills late","Using only cash"]]][k];
  return{q:Q[0],choices:shuffle(rng,Q[2]),correctText:Q[1],hint:`Use everything you've learned in the course.`,steps:[`${Q[1]}.`]}}
});

/* ================= Week 21 ================= */
const W21 = {title:"How income tax brackets work", sub:"Brackets, rates, deductions and credits", days:[
 {title:"From income to taxable income", desc:"What gets taxed", steps:[
  {h:"Not every dollar is taxed", t:`<p>Income tax isn't figured on everything you earn. First you subtract pre‑tax savings, like a traditional 401(k), and then a <b>deduction</b>. Most people take the <b>standard deduction</b>, a fixed amount set each year.</p><div class="formula">Taxable income = income − pre‑tax savings − deduction</div>`,
   b:()=>work("Income $55,000",["Traditional 401(k): $3,000","Standard deduction: $15,000 (the real amount changes yearly)","Taxable income: $37,000"])},
  {h:"Brackets", t:`<p>The U.S. income tax is <b>progressive</b>: income is cut into slices, and each slice has its own rate. This course uses simplified brackets shaped like the real ones for a single filer. Real numbers change every year.</p>`,
   b:()=>brTable()},
  {h:"Filling the buckets", t:`<p>Picture buckets. Your first dollars fill the 10% bucket, then the 12% bucket, and so on. Each dollar is taxed at the rate of the bucket it lands in.</p>`,
   b:()=>{const b=bTax(37000);return work("Taxable income $37,000",[...b.lines,`Total: ${$m(r2(b.t))}`])}}
 ], practice:["tx_taxable","tx_bracket","tx_taxable","tx_mc","tx_bracket","tx_taxable","tx_bracket","tx_mc","tx_bracket","tx_taxable"]},
 {title:"Marginal and effective rates", desc:"Two rates every taxpayer has", steps:[
  {h:"Marginal rate", t:`<p>Your <b>marginal rate</b> is the rate on your next dollar: the bracket your top dollar falls in. It's the rate that matters for decisions like a raise or a deduction.</p>`,
   b:()=>work("Taxable income $37,000",["Top dollar falls in the 12% bracket","Marginal rate: 12%"])},
  {h:"Effective rate", t:`<p>Your <b>effective rate</b> is your total tax divided by your taxable income. Because lower slices are taxed at lower rates, it's always below your marginal rate.</p><div class="formula">Effective rate = total tax ÷ taxable income</div>`,
   b:()=>{const b=bTax(37000);return work("$37,000 taxable",[`Tax: ${$m(r2(b.t))}`,`${nf(b.t,2)} ÷ 37,000 = ${nf(b.t/37000*100,2)}%`,`Marginal 12%, effective about ${nf(b.t/37000*100,1)}%`])}},
  {h:"The raise myth", t:`<p>Some people fear a raise will "push them into a higher bracket" and cost them money. It can't. Only the dollars <b>above</b> the bracket line are taxed at the higher rate.</p>`,
   b:()=>{const a=bTax(47000).t,b=bTax(50000).t;return work("Raise from $47,000 to $50,000 taxable",[`Tax before: ${$m(r2(a))}`,`Tax after: ${$m(r2(b))}`,`Extra tax: ${$m(r2(b-a))} on a $3,000 raise`],`He keeps ${$m(r2(3000-(b-a)))}`)}}
 ], practice:["tx_marginal","tx_effective","tx_raise","tx_mc","tx_marginal","tx_effective","tx_raise","tx_marginal","tx_effective","tx_raise"]},
 {title:"Deductions, credits and refunds", desc:"Lowering the bill and settling up", steps:[
  {h:"Deduction vs. credit", t:`<p>A <b>deduction</b> lowers your taxable income, so it saves you your marginal rate times the deduction. A <b>credit</b> lowers your tax itself, dollar for dollar. A credit is worth more.</p>`,
   b:()=>work("$1,000 in the 22% bracket",["Deduction saves: $1,000 × 0.22 = $220","Credit saves: $1,000"])},
  {h:"Tax Day", t:`<p>After the year ends, you file a tax return (Form 1040) using your W‑2 from week 4. You compare the tax you really owe with what was withheld.</p><div class="formula">Refund = withheld − tax owed</div><p>A negative number means you owe the difference, usually by April 15.</p>`,
   b:()=>work("Two workers",["A: owed $3,200, withheld $3,500 → $300 refund","B: owed $3,200, withheld $2,900 → owes $300"])},
  {h:"Keep good records", t:`<p>Save your W‑2s, 1099s and receipts for deductions. Free filing options exist for many taxpayers. When things get complicated, a tax professional can help.</p>`,
   b:()=>work("A tax folder",["W‑2 from each job","1099s for interest or freelance work","Receipts for charitable gifts","Last year's return"])}
 ], practice:["tx_ded_credit","tx_refund","tx_mc","tx_ded_credit","tx_refund","tx_bracket","tx_ded_credit","tx_refund","tx_mc","tx_ded_credit"]},
 {quiz:true, title:"Week 21 quiz", desc:`10 questions, ${PASS_MARK}% opens week 22`, steps:[
  {h:"Before the quiz", t:`<p>10 questions from this week. No hints, one try each. You need ${PASS_MARK}% to open week 22.</p>`,
   b:()=>brTable()}
 ], quizFrom:["tx_taxable","tx_bracket","tx_marginal","tx_effective","tx_raise","tx_ded_credit","tx_refund","tx_mc","tx_bracket","tx_mc","tx_effective"]}
]};

/* ================= Week 22 ================= */
const W22 = {title:"Insurance and managing risk", sub:"Paying a little to protect against a lot", days:[
 {title:"How insurance works", desc:"Premiums, deductibles and claims", steps:[
  {h:"Sharing risk", t:`<p>Insurance pools money from many people so the few who suffer a big loss can be paid. You pay a <b>premium</b>; if something covered happens, you file a <b>claim</b>.</p>`,
   b:()=>work("1,000 homes",["Each year, about 1 has a $200,000 fire","Expected loss: $200,000 ÷ 1,000 = $200 a home","Premium: about $200 plus the insurer's costs and profit"])},
  {h:"The deductible", t:`<p>The <b>deductible</b> is what you pay before insurance pays. A higher deductible means a lower premium, because you're taking on more of the small losses yourself.</p>`,
   b:()=>work("$1,000 deductible, $3,800 repair",["You pay: $1,000","Insurance pays: $2,800"])},
  {h:"What to insure", t:`<p>Insure against losses you <b>couldn't afford</b>: a car crash, a house fire, a big medical bill. Small losses you can cover yourself, from your emergency fund. That's why a healthy emergency fund lets you choose higher deductibles and lower premiums.</p>`,
   b:()=>work("Worth insuring?",["$40,000 hospital stay: yes","Liability if you injure someone with your car: yes (required by law)","$30 phone case: no","Extended warranty on a $50 gadget: usually no"])}
 ], practice:["in_year","in_deduct","in_expected","in_mc","in_year","in_deduct","in_expected","in_deduct","in_mc","in_year"]},
 {title:"Health insurance", desc:"Deductibles, coinsurance and choosing a plan", steps:[
  {h:"Cost sharing", t:`<p>Health plans share costs with you in layers: first the <b>deductible</b>, then <b>coinsurance</b> (a percent of the rest), up to an <b>out‑of‑pocket maximum</b>. After the maximum, the plan pays 100% of covered costs for the year.</p>`,
   b:()=>work("$1,000 deductible, 20% coinsurance, $5,000 max; a $9,000 bill",["Deductible: $1,000","20% of the other $8,000: $1,600","You pay: $2,600 (under the $5,000 max)"])},
  {h:"Comparing plans", t:`<p>A cheap premium with a high deductible can be best for someone who rarely sees a doctor. A higher premium with a low deductible can be best for someone with steady bills. Compare the <b>total yearly cost</b>: premiums plus what you'd likely pay in bills.</p>`,
   b:()=>work("Expected bills: $1,500",["Plan A: $250/mo, $4,000 deductible → $3,000 + $1,500 = $4,500","Plan B: $340/mo, $500 deductible → $4,080 + $500 = $4,580","Plan A wins, barely"])},
  {h:"Through work", t:`<p>Many people get health insurance through their employer, who usually pays a large share of the premium. Your share comes out of your paycheck, often before taxes, which you saw on pay stubs in week 4.</p>`,
   b:()=>work("A typical paycheck line",["Health insurance (pre‑tax): −$95","Lowers taxable pay, like a traditional 401(k)"])}
 ], practice:["in_coins","in_compare","in_mc","in_coins","in_compare","in_coins","in_mc","in_compare","in_coins","in_compare"]},
 {title:"Protecting a family", desc:"Life, disability, property and liability", steps:[
  {h:"Life insurance", t:`<p>If someone depends on your income, life insurance replaces it if you die. <b>Term life</b> covers a set number of years at a low price. <b>Whole life</b> lasts forever and costs far more. For most young families, term is the simple, affordable choice.</p>`,
   b:()=>work("Rule of thumb: about 10 × income",["Income $60,000","Coverage: about $600,000","A healthy 30‑year‑old can often get this as term insurance for a modest monthly premium"])},
  {h:"Disability insurance", t:`<p>Your ability to earn is your biggest asset when you're young. <b>Disability insurance</b> replaces part of your income if illness or injury keeps you from working. Many employers offer it.</p>`,
   b:()=>work("Why it matters",["40 years × $60,000 = $2.4 million of future earnings","An injury could stop that income","Disability insurance protects part of it"])},
  {h:"Property and liability", t:`<p><b>Auto insurance</b> is required by law in every state but New Hampshire, and Michigan has its own no‑fault rules. <b>Homeowner's</b> or <b>renter's</b> insurance covers your things. <b>Liability</b> coverage protects you if you're responsible for someone else's injury or damage.</p>`,
   b:()=>work("A young worker's insurance",["Health: through work","Auto: required","Renter's: cheap, covers belongings","Life: once someone depends on you"])}
 ], practice:["in_life","in_mc","in_expected","in_life","in_deduct","in_mc","in_life","in_coins","in_mc","in_life"]},
 {quiz:true, title:"Week 22 quiz", desc:`10 questions, ${PASS_MARK}% opens week 23`, steps:[
  {h:"Before the quiz", t:`<p>10 questions from this week. No hints, one try each. You need ${PASS_MARK}% to open week 23.</p>`,
   b:()=>`<div class="board"><h4>From this week</h4><table><tr><td>Insurer pays</td><td>loss − deductible</td></tr><tr><td>Health bill</td><td>deductible + coinsurance, up to the max</td></tr><tr><td>Expected loss</td><td>chance × cost</td></tr><tr><td>Yearly plan cost</td><td>premiums + your share of bills</td></tr></table></div>`}
 ], quizFrom:["in_year","in_deduct","in_coins","in_compare","in_expected","in_life","in_mc","in_coins","in_deduct","in_mc","in_compare"]}
]};

/* ================= Week 23 ================= */
const W23 = {title:"Big purchases: cars and homes", sub:"The two largest things most people ever buy", days:[
 {title:"Buying a car", desc:"Out‑the‑door price and depreciation", steps:[
  {h:"The real price", t:`<p>The sticker price is only the start. Add sales tax (6% in Michigan) and fees for title and registration to get the <b>out‑the‑door</b> price.</p>`,
   b:()=>work("A $14,000 used car",["Sales tax: $14,000 × 0.06 = $840","Fees: $200","Out the door: $15,040"])},
  {h:"Depreciation", t:`<p>Cars lose value every year, and new cars lose it fastest. A car that loses 15% a year keeps 85% of its value each year.</p><div class="formula">Value = price × (1 − rate)<sup>years</sup></div>`,
   b:()=>{const y=[0,1,2,3,4,5,6,7,8];return `<div class="board"><h4>$30,000 car, 15% a year</h4>${barChart(y.map(t=>30000*Math.pow(.85,t)),y.map(String),kFmt)}<div class="cap">After 5 years: about $13,300.</div></div>`}},
  {h:"New or used?", t:`<p>Buying a reliable car that's a few years old lets the first owner absorb the steepest depreciation. Pair it with a solid down payment and a short loan (week 7), and you'll spend far less over time.</p>`,
   b:()=>work("The car‑buying checklist",["Set the budget from your plan, not the dealer's","Get a loan rate from a bank or credit union first","Have a mechanic inspect a used car","Negotiate the out‑the‑door price, not the monthly payment"])}
 ], practice:["car_otd","car_depr","big_mc","car_otd","car_depr","car_otd","big_mc","car_depr","car_otd","car_depr"]},
 {title:"The cost of driving", desc:"Gas, insurance, maintenance and cost per mile", steps:[
  {h:"Beyond the payment", t:`<p>The loan payment is only one cost. Insurance, gas, maintenance and repairs often add up to more than the payment itself.</p>`,
   b:()=>work("A month of car costs",["Loan: $290","Insurance: $140","Gas: $150","Maintenance: $60","Total: $640"])},
  {h:"Fuel costs", t:`<div class="formula">Yearly gas = miles ÷ mpg × price per gallon</div><p>A car with better gas mileage can save hundreds of dollars a year.</p>`,
   b:()=>work("12,000 miles at $3.50 a gallon",["25 mpg: 480 gallons → $1,680","35 mpg: 343 gallons → $1,200","Savings: $480 a year"])},
  {h:"Cost per mile", t:`<p>Divide the yearly cost of the car by the miles you drive. It's a powerful number: it tells you what each trip really costs.</p>`,
   b:()=>work("$640 a month, 12,000 miles a year",["$640 × 12 = $7,680","÷ 12,000 = $0.64 a mile","A 20‑mile round trip costs about $12.80"])}
 ], practice:["car_gas","car_own","big_mc","car_gas","car_own","car_gas","car_own","big_mc","car_gas","car_own"]},
 {title:"Buying a home", desc:"Down payments, mortgages and total housing cost", steps:[
  {h:"How much house?", t:`<p>Many lenders want total housing costs at or below about <b>28% of gross monthly income</b>. That includes the mortgage payment, property taxes and homeowner's insurance.</p>`,
   b:()=>work("Income $84,000 a year",["Monthly gross: $7,000","28%: $1,960 a month for housing"])},
  {h:"The mortgage", t:`<p>A home loan works just like the loans in week 7, only bigger and longer. Over 30 years, the interest can add up to more than the house's price.</p>`,
   b:()=>{const L=270000,p=r2(loanPay(L,6.5,360)),p15=r2(loanPay(L,6.5,180));return work("$300,000 home, 10% down, 6.5%",["Loan: $270,000",`30 years: ${$m(p)} a month, ${$m(Math.round(p*360-L))} interest`,`15 years: ${$m(p15)} a month, ${$m(Math.round(p15*180-L))} interest`])}},
  {h:"The whole monthly cost", t:`<p>Add property taxes and insurance (often paid monthly through the lender) to the mortgage payment. Then budget for repairs: a common rule is about 1% of the home's value each year.</p>`,
   b:()=>work("Monthly housing",["Mortgage: $1,707","Property tax: $4,800 ÷ 12 = $400","Insurance: $1,500 ÷ 12 = $125","Total: $2,232, plus savings for repairs"])}
 ], practice:["home_afford","home_pmt","home_int","home_piti","big_mc","home_pmt","home_afford","home_piti","home_int","home_pmt"]},
 {quiz:true, title:"Week 23 quiz", desc:`10 questions, ${PASS_MARK}% opens week 24`, steps:[
  {h:"Before the quiz", t:`<p>10 questions from this week. No hints, one try each. You need ${PASS_MARK}% to open week 24.</p>`,
   b:()=>`<div class="board"><h4>From this week</h4><table><tr><td>Out the door</td><td>price + 6% tax + fees</td></tr><tr><td>Car value</td><td>price × (1 − rate)<sup>years</sup></td></tr><tr><td>Gas</td><td>miles ÷ mpg × price</td></tr><tr><td>Housing limit</td><td>28% of gross monthly pay</td></tr></table></div>`}
 ], quizFrom:["car_otd","car_depr","car_gas","car_own","home_pmt","home_int","home_afford","home_piti","big_mc","car_depr","home_pmt"]}
]};

/* ================= Week 24 ================= */
const W24 = {title:"Charity, goals and a long‑term plan", sub:"Turning wishes into numbers, and giving with purpose", days:[
 {title:"Setting goals", desc:"Specific targets and what it takes to reach them", steps:[
  {h:"Goals with numbers", t:`<p>"Save more" isn't a plan. A useful goal says <b>how much</b> and <b>by when</b>: "$6,000 for a car in three years." Then the math tells you exactly what to do each month.</p>`,
   b:()=>work("Short, medium and long",["Short (under a year): a laptop","Medium (1 to 10 years): a car, a wedding, a down payment","Long (10+ years): retirement, children's education"])},
  {h:"Saving for a goal", t:`<p>To find the monthly deposit that reaches a goal, turn the regular‑deposit formula around:</p><div class="formula">D = goal × r ÷ ((1 + r)<sup>n</sup> − 1)</div>`,
   b:()=>{const r=.04/12,d=6000*r/(Math.pow(1+r,36)-1);return work("$6,000 in 3 years at 4%",[`r = ${nf(r,6)}, n = 36`,`D = ${$m(r2(d))} a month`],`Without interest it would take $166.67`)}},
  {h:"Plan for inflation", t:`<p>Long‑term goals must account for rising prices. Something that costs $20,000 today will likely cost much more in 20 years.</p><div class="formula">Future cost = cost today × (1 + inflation)<sup>years</sup></div>`,
   b:()=>work("$20,000 today, 3% inflation",["10 years: about $26,900","20 years: about $36,100","30 years: about $48,500"])}
 ], practice:["gl_monthly","gl_future_cost","gl_lump","gl_mc","gl_monthly","gl_future_cost","gl_lump","gl_monthly","gl_mc","gl_future_cost"]},
 {title:"Giving", desc:"Charity in a budget, and the tax side", steps:[
  {h:"Giving as a line in the plan", t:`<p>Many people make charitable giving part of their budget, deciding on a percent of income and setting it aside each payday, just like savings.</p>`,
   b:()=>work("$60,000 income, giving 5%",["Yearly: $3,000","Monthly: $250, set aside on payday"])},
  {h:"Giving wisely", t:`<p>Before giving, check how a charity uses its money. Look for clear reports on its programs and costs. Be careful with phone and email requests: scammers pretend to be charities, especially after disasters.</p>`,
   b:()=>work("Questions to ask",["What does the charity actually do?","How much reaches the programs?","Is it a registered nonprofit?","Did I reach out to them, or did they pressure me?"])},
  {h:"The tax side", t:`<p>Gifts to qualified charities can be deducted if you itemize deductions instead of taking the standard deduction. A deduction saves your marginal rate times the gift, so the gift costs you a bit less than its full amount.</p>`,
   b:()=>work("$1,000 gift, 22% bracket, itemizing",["Tax saved: $220","Real cost of the gift: $780","Most people take the standard deduction, so check before counting on this"])}
 ], practice:["ch_give","ch_deduct","gl_mc","ch_give","ch_deduct","tx_ded_credit","ch_give","ch_deduct","gl_mc","ch_give"]},
 {title:"The long run", desc:"Retirement targets and the power of starting early", steps:[
  {h:"How much is enough?", t:`<p>One common guide is the <b>4% rule</b>: in retirement, withdraw about 4% of your savings in the first year and adjust for inflation after that. Turned around, it says how much you need.</p><div class="formula">Nest egg ≈ yearly need ÷ 0.04 = yearly need × 25</div>`,
   b:()=>work("Need $60,000 a year",["Social Security covers $24,000","Gap: $36,000","Nest egg: $36,000 × 25 = $900,000"])},
  {h:"Start early", t:`<p>You saw it in week 1, and it's still the most important lesson: time does most of the work.</p>`,
   b:()=>{const r=.07/12,f=n=>300*(Math.pow(1+r,n*12)-1)/r;return work("$300 a month at 7% until 65",[`Start at 25 (40 years): ${$m(Math.round(f(40)))}`,`Start at 35 (30 years): ${$m(Math.round(f(30)))}`,`Start at 45 (20 years): ${$m(Math.round(f(20)))}`])}},
  {h:"Protecting the plan", t:`<p>Long‑term plans also need protection: insurance from week 22, an emergency fund, and, once you have a family, a <b>will</b> that says who receives your property and who would care for your children.</p>`,
   b:()=>work("The long‑run checklist",["Retirement savings on autopilot","Emergency fund","Right insurance","A will, once others depend on you","Review the plan every year"])}
 ], practice:["rt_nest","rt_early","gl_mc","rt_nest","rt_early","gl_lump","rt_nest","rt_early","gl_mc","rt_nest"]},
 {quiz:true, title:"Week 24 quiz", desc:`10 questions, ${PASS_MARK}% opens week 25`, steps:[
  {h:"Before the quiz", t:`<p>10 questions from this week. No hints, one try each. You need ${PASS_MARK}% to open the capstone.</p>`,
   b:()=>`<div class="board"><h4>From this week</h4><table><tr><td>Goal deposit</td><td>goal × r ÷ ((1 + r)<sup>n</sup> − 1)</td></tr><tr><td>Present value</td><td>goal ÷ (1 + r)<sup>n</sup></td></tr><tr><td>Future cost</td><td>cost × (1 + inflation)<sup>n</sup></td></tr><tr><td>Nest egg</td><td>yearly need × 25</td></tr></table></div>`}
 ], quizFrom:["gl_monthly","gl_lump","gl_future_cost","ch_give","ch_deduct","rt_nest","rt_early","gl_mc","gl_monthly","rt_nest","gl_mc"]}
]};

/* ================= Week 25: Capstone ================= */
const W25 = {title:"Capstone: a lifetime financial plan", sub:"Everything in one plan, from first paycheck to retirement", days:[
 {title:"Your first paycheck plan", desc:"Income, taxes and the monthly budget", steps:[
  {h:"The capstone", t:`<p>This week you'll pull the whole course together into one plan for your financial life. Start where real life starts: your first full‑time paycheck.</p>`,
   b:()=>work("The plan's five parts",["1. Paycheck and budget","2. Protection: emergency fund and insurance","3. Debt: avoid it, or pay it down fast","4. Big purchases: car and home","5. Investing for the long run"])},
  {h:"From salary to budget", t:`<p>Take home pay after the 401(k), taxes and FICA (weeks 4 and 21). Then build the month: savings first, housing within the guidelines, and everything else within what's left (week 5).</p>`,
   b:()=>{const g=5000,c=g*.06,tx=g-c,f=tx*.1,st=tx*.0425,fi=g*.0765,n=g-c-f-st-fi;return work("$60,000 salary, 6% to a 401(k)",[`Monthly gross: ${$m(g)}`,`Take‑home: about ${$m(Math.round(n))}`,`Housing at 28% of gross: up to $1,400`,`401(k) with employer match: building every month`])}},
  {h:"Protection first", t:`<p>Before investing beyond the match: an emergency fund of 3 to 6 months, the insurance you need, and no high‑interest debt. This is the foundation that keeps one bad month from becoming a crisis.</p>`,
   b:()=>work("Foundation checklist",["Emergency fund: 3 to 6 months of essentials","Health, auto and renter's insurance","No credit card balance carried","Credit score growing month by month"])}
 ], practice:["pj_net_month","cap_check","r503020","ef_target","pj_net_month","cap_check","pj_left","cap_mc","pj_net_month","cap_check"]},
 {title:"Big decisions", desc:"Debt, cars, homes and taxes over time", steps:[
  {h:"Debt", t:`<p>Use credit like a tool, not a crutch. Pay cards in full, borrow for big purchases only with a plan, and pay high‑rate debt first (weeks 6 to 8).</p>`,
   b:()=>work("Debt rules for the plan",["Card: paid in full monthly","Car: used, solid down payment, 4 years or less","Never a payday loan","Credit score: protected"])},
  {h:"Home", t:`<p>Buy a home when you're likely to stay several years, have a down payment and an emergency fund, and can keep housing near 28% of gross income (week 23).</p>`,
   b:()=>{const p=r2(loanPay(240000,6.5,360));return work("Age 30: $300,000 home, 20% down",["Loan: $240,000 at 6.5%",`Payment: ${$m(p)}`,"Plus taxes, insurance and repairs"])}},
  {h:"Taxes over a lifetime", t:`<p>Pre‑tax retirement savings lower your taxes now; Roth‑style accounts grow tax‑free for later. Raises are always worth taking: only the dollars above a bracket line are taxed at the higher rate (week 21).</p>`,
   b:()=>work("Every raise",["Part to savings (beat lifestyle creep)","Part to giving or goals","The rest to living"])}
 ], practice:["home_pmt","car_depr","tx_bracket","cap_mc","home_afford","cc_payoff","tx_raise","home_pmt","cap_mc","car_own"]},
 {title:"The long run", desc:"Investing, retirement and keeping the plan alive", steps:[
  {h:"Investing", t:`<p>Low‑cost, diversified index funds, an allocation that fits your age, automatic monthly investing, and a yearly rebalance (weeks 10 to 15).</p>`,
   b:()=>{const r=.07/12,d=60000*.15/12,f=d*(Math.pow(1+r,480)-1)/r;return work("Saving 15% of $60,000 for 40 years",[`Monthly: ${$m(d)}`,`At 7%: about ${$m(Math.round(f))}`,"Raises and the employer match would make it bigger"])}},
  {h:"Is it enough?", t:`<p>Check your projected nest egg against your need, using the 4% rule and remembering inflation (week 24). If it falls short, the fixes are the same as always: save more, start earlier, keep costs low.</p>`,
   b:()=>work("The check",["Need in today's dollars: $40,000 a year beyond Social Security","× 25 = $1,000,000","Adjust for inflation over 40 years: much more","So keep raising your savings rate as your pay grows"])},
  {h:"Your plan, your choices", t:`<p>You now know more about money than most adults. The math was the easy part. The hard part is the habits: spend less than you earn, avoid expensive debt, invest early and patiently, protect what you build, and review the plan every year.</p>`,
   b:()=>work("The whole course in five rules",["Spend less than you earn","Avoid expensive debt","Start investing early, keep costs low","Protect what you build","Review the plan every year"])}
 ], practice:["cap_life","rt_nest","pj2_future","cap_mc","cap_life","gl_future_cost","er_long","cap_life","cap_mc","rt_nest"]},
 {quiz:true, title:"Final exam", desc:`10 questions from the whole course, ${PASS_MARK}% completes it`, steps:[
  {h:"Before the final", t:`<p>Ten questions from across the whole course. No hints, one try each. You need ${PASS_MARK}% to complete Compound.</p>`,
   b:()=>`<div class="board"><h4>The course in one table</h4><table><tr><td>Money and time</td><td>compound interest, present value</td></tr><tr><td>Earning and borrowing</td><td>paychecks, budgets, loans, credit</td></tr><tr><td>Investing</td><td>stocks, bonds, funds, diversification</td></tr><tr><td>Business</td><td>profit, statements, break‑even</td></tr><tr><td>A plan for life</td><td>taxes, insurance, big purchases, goals</td></tr></table></div>`}
 ], quizFrom:["ci_amount","net_pay","ln_pmt","cs_util_total","port_ret","er_long","be_units","tx_bracket","home_pmt","cap_life","cap_mc","rt_nest"]}
]};
addWeek(21,W21); addWeek(22,W22); addWeek(23,W23); addWeek(24,W24); addWeek(25,W25);

Object.assign(DIVES, {
"21-1": {title:"The first income tax", sections:[
  ["Paying for a war","The United States first taxed income during the Civil War. The Revenue Act of 1861 created a federal income tax to help pay for the war. It was ended in 1872."],
  ["The Sixteenth Amendment","In 1895, the Supreme Court ruled that a later income tax was unconstitutional. To settle the question, the Sixteenth Amendment was ratified in 1913, giving Congress the clear power to tax incomes."],
  ["Small at first","The 1913 income tax applied only to a small share of Americans, those with high incomes. It grew into today's tax, paid by most working people, during the two World Wars."]],
 qs:[{q:"The first federal income tax was created to pay for:",choices:["The Civil War","World War II","The moon landing","The first railroads"],why:"The Revenue Act of 1861."},
     {q:"Which amendment gave Congress clear power to tax incomes?",choices:["The Sixteenth","The First","The Nineteenth","The Twenty‑first"],why:"It was ratified in 1913."},
     {q:"In 1913, the income tax applied to:",choices:["Only a small share of high earners","Every worker","Only children","Only businesses"],why:"It started small."}]},
"21-2": {title:"The first Form 1040", sections:[
  ["Four pages","The first Form 1040, in 1913, was just a few pages long, including its instructions."],
  ["Low rates","Most filers paid a 1% tax, with extra surtaxes on high incomes bringing the top rate to 7%."],
  ["Growing complexity","Today the tax code runs thousands of pages, and the 1040 comes with many schedules and forms. Still, the basic idea is the one you learned this week: income, minus deductions, taxed by brackets, minus credits."]],
 qs:[{q:"What was the top income tax rate in 1913?",choices:["7%","70%","1%","50%"],why:"A 1% base tax plus surtaxes up to 6%."},
     {q:"The 1913 Form 1040 was about:",choices:["A few pages, including instructions","Thousands of pages","One sentence","Fifty pages"],why:"It was short."},
     {q:"Which basic idea from this week still applies to today's 1040?",choices:["Income minus deductions, taxed by brackets, minus credits","Everyone pays the same dollar amount","Only sales are taxed","There are no deductions"],why:"The structure is the same."}]},
"21-3": {title:"Why April 15?", sections:[
  ["March first","When the modern income tax began, returns were due March 1. The deadline later moved to March 15."],
  ["The move to April","In 1955, the deadline moved to April 15, where it has stayed. One reason was to give taxpayers and the government more time to handle increasingly complicated returns."],
  ["When it moves","If April 15 falls on a weekend or holiday, the deadline moves to the next business day. You can ask for an extension to file, but any tax you owe is still due by the deadline."]],
 qs:[{q:"Since 1955, the usual federal tax deadline has been:",choices:["April 15","March 1","January 1","June 30"],why:"It moved to April 15 in 1955."},
     {q:"What happens if April 15 is on a weekend?",choices:["The deadline moves to the next business day","Taxes are canceled","It moves back a week","Nothing; you file on Sunday"],why:"It shifts to the next business day."},
     {q:"An extension gives you more time to:",choices:["File, but not to pay","Pay, but not to file","Skip taxes entirely","Change your income"],why:"Payment is still due on time."}]},
"22-1": {title:"Insurance in a coffee house", sections:[
  ["Ships and coffee","In the 1680s, Edward Lloyd ran a coffee house in London where sailors, merchants and ship owners gathered to swap news about voyages."],
  ["Sharing the risk","Wealthy men there began agreeing to cover part of a ship's losses in exchange for a fee. Each signed his name under the deal, which is said to be where the word underwriter comes from."],
  ["Lloyd's of London","That gathering grew into Lloyd's of London, still one of the world's best‑known insurance markets. It insures everything from ships to satellites."]],
 qs:[{q:"Lloyd's of London began in:",choices:["A coffee house","A bank","A church","A palace"],why:"Edward Lloyd's coffee house in the 1680s."},
     {q:"The first deals there insured mostly:",choices:["Ships and their cargo","Cars","Phones","Homes in America"],why:"It served merchants and ship owners."},
     {q:"Where does the word underwriter come from, according to the reading?",choices:["Signing your name under the deal","Writing under water","A type of pen","A tax form"],why:"Backers signed below the terms."}]},
"22-2": {title:"Franklin's fire company", sections:[
  ["Fire in the city","Wooden cities burned easily, and a single fire could ruin a family. Benjamin Franklin helped organize Philadelphia's first volunteer fire company."],
  ["Insurance for homes","In 1752, Franklin helped found the Philadelphia Contributionship, one of the first successful property insurance companies in America. Members paid in, and those whose homes burned were paid from the pool."],
  ["Lower risk, lower premium","The company inspected houses and charged more for riskier ones. Today's insurers still do the same: lower risk means lower premiums, which rewards people for being careful."]],
 qs:[{q:"Benjamin Franklin helped found a property insurance company in:",choices:["1752","1913","1609","1955"],why:"The Philadelphia Contributionship, 1752."},
     {q:"How were members paid after a fire?",choices:["From the pool everyone paid into","By the king","By their neighbors directly","They weren't"],why:"That's how insurance pools work."},
     {q:"Why did the company inspect houses?",choices:["To charge more for riskier ones","To sell them","To raise all premiums","For fun"],why:"Premiums matched the risk."}]},
"22-3": {title:"The law of large numbers", sections:[
  ["Unpredictable alone","No one can predict whether your house will burn this year. That's what makes a loss frightening for one family."],
  ["Predictable together","But across a million houses, the number of fires each year is quite steady. Mathematicians call this the law of large numbers: the larger the group, the closer the results come to the average."],
  ["Why insurers can promise","That steadiness lets an insurer set premiums that cover the expected losses, plus its costs. Your uncertainty becomes its fairly predictable business. That's the expected‑loss math from this week."]],
 qs:[{q:"The law of large numbers says that in a large group:",choices:["Results come closer to the average","Anything can happen","Losses always rise","Everyone has a loss"],why:"Large groups behave predictably."},
     {q:"Why can insurers set premiums?",choices:["Losses across many policies are fairly predictable","They know who will have a fire","The government sets them","They never pay claims"],why:"Pooling makes losses steady."},
     {q:"For a single family, a fire is:",choices:["Unpredictable and could be devastating","Certain","Impossible","Always small"],why:"That's why insurance helps."}]},
"23-1": {title:"Driving off the lot", sections:[
  ["The steepest drop","New cars typically lose a large share of their value in the first few years. Some of it vanishes the moment the car becomes \"used.\""],
  ["Who pays for it","The first owner absorbs that drop. A buyer of a well‑kept three‑year‑old car gets most of the car's useful life for a much lower price."],
  ["Upside down","Buyers who put little money down on a long loan can owe more than the car is worth. If the car is totaled or must be sold, they still owe the difference. A bigger down payment and a shorter loan prevent this."]],
 qs:[{q:"When do new cars usually lose value fastest?",choices:["In the first few years","After 20 years","Never","Only in winter"],why:"Depreciation is steepest early."},
     {q:"Owing more on a car than it's worth is called being:",choices:["Upside down","Right side up","Fully insured","Amortized"],why:"The loan is bigger than the value."},
     {q:"What helps prevent being upside down?",choices:["A bigger down payment and a shorter loan","A longer loan","No down payment","Buying a new car every year"],why:"You owe less, sooner."}]},
"23-2": {title:"Houses for everyone", sections:[
  ["After the war","When millions of soldiers came home after World War II, there weren't nearly enough homes. Young families lived with parents or in crowded apartments."],
  ["Levittown","Starting in 1947 on Long Island, New York, builder William Levitt used assembly‑line methods to build thousands of nearly identical houses quickly and cheaply. The development became known as Levittown."],
  ["Help with mortgages","The GI Bill helped veterans get home loans with little or no down payment. Combined with mass‑produced houses, it helped make home ownership common for millions of American families."]],
 qs:[{q:"Levittown was built starting in:",choices:["1947","1847","1997","1913"],why:"Construction began in 1947."},
     {q:"How did Levitt build so many homes so cheaply?",choices:["Assembly‑line methods","Gold bricks","Government workers only","Imported houses"],why:"The same idea as Ford's assembly line."},
     {q:"The GI Bill helped veterans by:",choices:["Making home loans easier to get","Giving free houses to everyone","Banning mortgages","Raising rent"],why:"Low or no down payment loans."}]},
"23-3": {title:"The housing bubble", sections:[
  ["Prices only go up?","In the early 2000s, U.S. home prices rose quickly. Many people believed prices would keep rising, and lenders made risky loans to buyers who couldn't really afford them."],
  ["The crash","Beginning around 2007, prices fell. Borrowers with little equity found themselves owing more than their homes were worth, and millions of homes went into foreclosure."],
  ["The lessons","Borrow what you can comfortably repay, not the most a lender offers. Keep housing costs within your budget. And remember tulip mania from week 14: no price goes up forever."]],
 qs:[{q:"When did U.S. home prices begin to fall in the crash?",choices:["Around 2007","1929","1975","2020"],why:"The decline began around 2007."},
     {q:"What made the crash worse?",choices:["Risky loans to buyers who couldn't afford them","Too many renters","Low home prices","Too much saving"],why:"Many borrowers couldn't keep paying."},
     {q:"The reading's main lesson for borrowers:",choices:["Borrow what you can comfortably repay","Borrow the most a lender offers","Prices always rise","Never own a home"],why:"Affordability, not approval, is the limit."}]},
"24-1": {title:"Libraries for everyone", sections:[
  ["From poverty to steel","Andrew Carnegie came to America as a poor boy from Scotland and became one of the richest men in the world through the steel industry."],
  ["The Gospel of Wealth","In 1889, he wrote an essay arguing that the rich have a duty to use their fortunes for the public good during their lifetimes."],
  ["2,500 libraries","Carnegie paid for more than 2,500 public libraries around the world, many of them in small American towns. He believed that giving people the chance to learn was the best gift, because it helped them help themselves."]],
 qs:[{q:"Andrew Carnegie made his fortune in:",choices:["Steel","Software","Oil","Cars"],why:"He built a steel empire."},
     {q:"About how many libraries did Carnegie fund?",choices:["More than 2,500","About 25","Exactly 100","None"],why:"More than 2,500 worldwide."},
     {q:"Why did Carnegie favor libraries?",choices:["They help people help themselves","They make money","They were cheap","He collected books"],why:"Learning creates opportunity."}]},
"24-2": {title:"The Giving Pledge", sections:[
  ["A promise","In 2010, Warren Buffett and Bill and Melinda Gates started the Giving Pledge, inviting the world's wealthiest people to promise to give the majority of their wealth to charity."],
  ["Hundreds have signed","Since then, people from many countries have signed. The pledge is a public promise, not a legal contract."],
  ["At any size","Giving isn't only for billionaires. A steady percent of a regular paycheck, given carefully, adds up over a lifetime, and many people find it one of the most meaningful parts of their plan."]],
 qs:[{q:"The Giving Pledge began in:",choices:["2010","1889","1955","2001"],why:"Buffett and the Gateses started it in 2010."},
     {q:"Signers promise to give:",choices:["The majority of their wealth","Exactly $1 million","Nothing","Only their houses"],why:"More than half."},
     {q:"Is the pledge a legal contract?",choices:["No, it's a public promise","Yes, enforced by courts","Yes, by the IRS","Only in some states"],why:"It's a moral commitment."}]},
"24-3": {title:"Social Security in your plan", sections:[
  ["Paid in all your life","The FICA taxes on every paycheck (week 4) fund Social Security. After about ten years of work, you qualify for retirement benefits."],
  ["Full retirement age","For people born in 1960 or later, full retirement age is 67. You can start benefits as early as 62 for a smaller monthly check, or wait until 70 for a larger one."],
  ["A floor, not the whole house","Social Security was designed to replace only part of a worker's income. That's why the 4% rule in this week's lesson subtracts it first: your savings fill the rest of the gap."]],
 qs:[{q:"What funds Social Security?",choices:["FICA taxes on paychecks","Sales tax","Stock dividends","Property taxes"],why:"Payroll taxes fund it."},
     {q:"Full retirement age for people born in 1960 or later is:",choices:["67","55","62","80"],why:"It's 67."},
     {q:"Social Security was designed to:",choices:["Replace part of a worker's income","Replace all income","Pay off mortgages","Fund businesses"],why:"Savings must fill the gap."}]},
"25-1": {title:"The marshmallow test", sections:[
  ["One now or two later","In famous experiments at Stanford in the 1960s and 1970s, psychologist Walter Mischel offered young children a choice: one marshmallow now, or two if they could wait alone for several minutes."],
  ["What followed","Early follow‑ups suggested that children who waited did better years later. Later, larger studies found the link was weaker once family background was considered. Waiting is easier when you trust that the reward will really come."],
  ["Making waiting easier","Children who waited often used tricks, like looking away or singing. Adults can do the same with money: automatic savings, keeping temptations out of sight, and goals with clear numbers make patience much easier."]],
 qs:[{q:"Who led the marshmallow experiments?",choices:["Walter Mischel","Benjamin Graham","Luca Pacioli","Andrew Carnegie"],why:"At Stanford, in the 1960s and 70s."},
     {q:"What did later, larger studies find?",choices:["The link was weaker once background was considered","Waiting guarantees success","Marshmallows are unhealthy","Nobody can wait"],why:"Results were more modest."},
     {q:"Which money habit works like the children's tricks?",choices:["Automatic savings that keep money out of sight","Checking your card balance hourly","Carrying lots of cash","Shopping when bored"],why:"Remove the temptation."}]},
"25-2": {title:"Franklin's 200-year gift", sections:[
  ["A strange will","When Benjamin Franklin died in 1790, he left about £1,000 each to Boston and Philadelphia, with unusual instructions: lend it to young tradesmen at interest and let it grow for 200 years."],
  ["Compounding for centuries","Part of the money could be spent after 100 years; the rest kept growing. By 1990, the funds had grown to millions of dollars, which were used for education and community projects."],
  ["The point","Franklin wanted to show what patient compounding could do. It's the lesson that opened this course in week 1, and it closes it now: time is the most powerful ingredient in any financial plan."]],
 qs:[{q:"How much did Franklin leave each city?",choices:["About £1,000","About £1 million","Nothing","A house"],why:"About £1,000 each to Boston and Philadelphia."},
     {q:"For how long did he want the money to grow?",choices:["200 years","2 years","20 years","2,000 years"],why:"Two centuries."},
     {q:"What was Franklin trying to show?",choices:["The power of patient compounding","That cities waste money","That loans are bad","How to avoid taxes"],why:"Time makes money grow."}]},
"25-3": {title:"A plan on one page", sections:[
  ["Short beats long","The most useful financial plans fit on one page: income, savings rate, debt rules, insurance, investments and goals. A plan you can read in a minute is a plan you'll actually use."],
  ["Write it down","People who write down specific goals and review them tend to follow through more than those who just think about them. Writing forces you to choose real numbers."],
  ["Review every year","Once a year, update the plan: new income, new goals, new prices. Small yearly adjustments keep a plan alive for a lifetime. You've now built every piece you need."]],
 qs:[{q:"According to the reading, the most useful plans:",choices:["Fit on one page","Are hundreds of pages","Are never written down","Change every day"],why:"Short plans get used."},
     {q:"Why write goals down?",choices:["It forces you to choose real numbers","It's required by law","It raises your credit score","It lowers taxes"],why:"Specific numbers drive action."},
     {q:"How often should you review the plan?",choices:["Once a year","Never","Every hour","Only at retirement"],why:"Yearly updates keep it current."}]}
});

GLOSSARY.push(
 ["Progressive tax","A tax where higher slices of income are taxed at higher rates.",21],["Tax bracket","A range of income taxed at a set rate.",21],
 ["Taxable income","Income left after pre‑tax savings and deductions.",21],["Standard deduction","A fixed amount most taxpayers subtract from income before tax.",21],
 ["Marginal tax rate","The tax rate on your next dollar of income.",21],["Effective tax rate","Total tax divided by taxable income.",21],
 ["Tax credit","An amount subtracted directly from the tax you owe.",21],["Itemized deductions","Listing specific deductions instead of taking the standard deduction.",21],["Form 1040","The federal individual income tax return.",21],
 ["Premium","The price paid for insurance coverage.",22],["Deductible","What you pay before insurance pays.",22],["Claim","A request for payment from an insurance company.",22],
 ["Coinsurance","The percent of costs you pay after the deductible.",22],["Out‑of‑pocket maximum","The most you pay in a year for covered health costs.",22],
 ["Term life insurance","Life insurance for a set number of years.",22],["Disability insurance","Insurance that replaces part of your income if you can't work.",22],
 ["Liability insurance","Coverage if you're responsible for someone else's injury or damage.",22],["Expected loss","Chance of a loss times its cost.",22],
 ["Out‑the‑door price","A car's price including taxes and fees.",23],["Upside down","Owing more on a loan than the item is worth.",23],
 ["Cost per mile","The yearly cost of a car divided by miles driven.",23],["Down payment (home)","Cash paid toward a home, lowering the mortgage.",23],
 ["Property tax","A yearly tax on the value of real estate.",23],["Foreclosure","When a lender takes a home after the borrower stops paying.",23],
 ["Financial goal","A specific amount of money needed by a specific date.",24],["4% rule","A guide that retirees can withdraw about 4% of savings in the first year.",24],
 ["Nest egg","Savings built up for retirement.",24],["Will","A legal document saying who receives your property after death.",24],
 ["Social Security","A government program, funded by payroll taxes, that pays retirement and other benefits.",24],["Full retirement age","The age for full Social Security benefits: 67 for those born in 1960 or later.",24],
 ["Financial plan","A written plan for income, spending, saving, protection and goals.",25]
);
