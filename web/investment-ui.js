import {underwrite,dealEligibility,money} from './underwriting.js';
const $=id=>document.getElementById(id);
const controls=['budget','target','financing','down','interest','closing','rehab','reserves','tax','insurance','maintenance','utilities','filter','sort'];
const KEY='property-finder.investment-rent-overrides.v1';
let overrides={};
try{overrides=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{overrides={};}
export function dealSettings(){
 const number=id=>Number($('inv-'+id)?.value);
 const seller=$('inv-financing').value==='seller';
 return {cashBudget:number('budget'),targetCashFlow:number('target'),
   downPercent:number('down'),sellerDownPercent:number('down'),
   annualInterest:number('interest'),sellerInterest:number('interest'),
   closingPercent:number('closing'),upfrontRepairs:number('rehab'),
   initialReserves:number('reserves'),propertyTaxPercent:number('tax'),
   insuranceMonthly:number('insurance'),repairsMonthly:number('maintenance'),
   capexMonthly:0,utilityAllowance:number('utilities'),sellerVerified:false,
   termYears:30,sellerTermYears:30,loanType:seller?'seller':'conventional'};
}
export function analyzeInvestment(r){
 const settings=dealSettings();
 const o=Object.prototype.hasOwnProperty.call(overrides,r.url)?{rentOverride:overrides[r.url]}:{};
 return underwrite(r,{...settings,...o},settings.loanType);
}
export function rankInvestment(rows){
 const sorted=rows.map(r=>({r,deal:analyzeInvestment(r)}));
 const preference=$('inv-filter').value;
 const settings=dealSettings();
 const filtered=sorted.filter(({r,deal})=>{
  if(!deal)return false;
  if(preference==='budget')return deal.budgetPass;
  if(preference==='target')return dealEligibility(deal,{budget:settings.cashBudget,target:settings.targetCashFlow})==='scenario-passes-not-verified';
  if(preference==='seller')return Boolean(r.seller_finance_evidence);
  return true;
 });
 const sort=$('inv-sort').value;
 filtered.sort((a,b)=>{
  if(sort==='newest')return Date.parse(b.r.first_seen)-Date.parse(a.r.first_seen);
  if(sort==='cashneeded')return a.deal.cashToClose-b.deal.cashToClose;
  const va=a.deal.cashFlow,vb=b.deal.cashFlow;
  if(va===null)return vb===null?0:1;
  if(vb===null)return -1;
  return vb-va||a.deal.cashToClose-b.deal.cashToClose;
 });
 return filtered.map(x=>x.r);
}
const metric=(name,value)=>{const c=document.createElement('div');c.className='inv-metric';const t=document.createElement('small');t.textContent=name;const b=document.createElement('strong');b.textContent=value;c.append(t,b);return c;};
export function dealBox(r){
 const deal=analyzeInvestment(r);
 const el=document.createElement('div');el.className='inv-deal';
 if(!deal){el.textContent='Insufficient property price evidence';return el;}
 const metrics=document.createElement('div');metrics.className='inv-metrics';
 metrics.append(metric('Asking price',money(deal.price)),
  metric('Gross rent / HUD FMR',deal.rentGross===null?'Unknown':money(deal.rentGross)+'/mo'),
  metric('Cash flow / month',deal.cashFlow===null?'Unknown':money(deal.cashFlow)+'/mo'),
  metric('Total cash needed',money(deal.cashToClose)));
 el.append(metrics);
 const status=document.createElement('p');status.className='inv-evidence';
 const verdict=dealEligibility(deal,{budget:dealSettings().cashBudget,target:dealSettings().targetCashFlow});
 status.textContent=verdict==='scenario-passes-not-verified'?'Modeled target met — assumptions only, NOT a verified profitable deal':
 verdict==='over-budget'?'Over your entered cash budget':
 verdict==='below-target'?'Below target under current assumptions':
 verdict==='rent-unavailable'?'Rent benchmark unavailable — enter locally verified rent':'Needs verification';
 el.append(status);
 const details=document.createElement('details');details.className='inv-breakdown';
 const summary=document.createElement('summary');summary.textContent='View expense breakdown & rent assumptions';details.append(summary);
 const needed=document.createElement('p');needed.className='inv-detail';
 needed.textContent=(deal.rentGross===null?'Gross monthly rent needed for target: '+money(deal.rentNeeded)+'. ':'')+
  (deal.benchmark?deal.benchmark.source+' (gross FMR; not approved voucher rent). ':'')+
  (deal.sellerEvidence?'Source mentions "'+deal.sellerEvidence+'"; terms unverified. ':'No verified seller-finance terms. ')+
  'Financing, local PHA rent, utility allowance, taxes and repairs require confirmation.';
 details.append(needed);
 const breakdown=document.createElement('p');breakdown.className='inv-detail';
 breakdown.textContent='Down payment '+money(deal.down)+' · Closing '+money(deal.closing)+
  ' · Mortgage P&I '+money(deal.monthlyDebt)+'/mo · Tax '+money(deal.monthlyTax)+
  '/mo · Other monthly fixed costs '+money(deal.nonRentCosts-deal.monthlyDebt-deal.monthlyTax)+
  ' · Variable vacancy/management '+(deal.variableCosts===null?'unknown':money(deal.variableCosts))+
  '. These are modeled assumptions, not verified bills.';
 details.append(breakdown);el.append(details);
 const wrap=document.createElement('label');wrap.className='inv-rent-entry';
 wrap.textContent='Override gross monthly rent ($): ';
 const input=document.createElement('input');input.type='number';input.min='1';input.placeholder='Enter verified rent estimate';
 input.value=Object.prototype.hasOwnProperty.call(overrides,r.url)?String(overrides[r.url]):'';
 input.addEventListener('change',()=>{
  const v=Number(input.value);
  if(input.value.trim()!==''&&Number.isFinite(v)&&v>0&&v<100000)overrides[r.url]=v;
  else delete overrides[r.url];
  try{localStorage.setItem(KEY,JSON.stringify(overrides));}catch{}
  document.dispatchEvent(new Event('investment-updated'));
 });
 wrap.append(input);el.append(wrap);
 return el;
}
export function initInvestments(){
 for(const name of controls){const input=$('inv-'+name);input.addEventListener('change',()=>{
  if(name==='financing'){
   const seller=input.value==='seller';
   $('inv-down').value=seller?'15':'25';
   $('inv-interest').value=seller?'5':'7.5';
  }
  document.dispatchEvent(new Event('investment-updated'));
 });}
}
export function investmentSummary(rows){
 const target=dealSettings().targetCashFlow,budget=dealSettings().cashBudget;
 const cases=rows.map(analyzeInvestment).filter(Boolean);
 const known=cases.filter(d=>d.cashFlow!==null);
 const passing=cases.filter(d=>d.cashToClose<=budget&&d.cashFlow!==null&&d.cashFlow>=target);
 return rows.length+' indexed sale candidates · '+known.length+' have a HUD FMR benchmark or user-entered rent · '+passing.length+' meet the illustrative budget and monthly target, pending verification. Never treat FMR as approved Section 8 rent.';
}
