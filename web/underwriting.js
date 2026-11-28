// Conservative, inspectable rental underwriting. This is a screening tool,
// never a lender quote or a housing-authority rent determination.
export const BENCHMARK_YEAR=2027;
// FY27 metro/county HUD FMR gross-rent benchmarks; these are NOT local PHA
// payment standards or approved contract rents. Only directly verified markets
// are populated. Never synthesize an FMR for other places.
const BENCHMARKS={
  'Muncie|IN':{2:1145,3:1438,source:'HUD FY2027 Muncie/Delaware County FMR'},
  'Topeka|KS':{2:1172,3:1564,source:'HUD FY2027 Topeka/Shawnee County FMR'}
};
export function rentBenchmark(r){
  const key=[r.town?.trim(),r.state].join('|');
  const entry=BENCHMARKS[key],beds=Number(r.beds);
  const bedrooms=Number.isInteger(beds)?beds:null;
  return entry&&entry[bedrooms] ? {gross:entry[bedrooms],source:entry.source,year:BENCHMARK_YEAR,kind:'area-fmr-not-approval'} : null;
}
export const DEFAULTS={
  cashBudget:25000,targetCashFlow:500,
  downPercent:25,closingPercent:3,closingFixed:0,upfrontRepairs:0,initialReserves:2000,
  annualInterest:7.5,termYears:30,
  propertyTaxPercent:1.5,insuranceMonthly:125,
  repairsMonthly:100,capexMonthly:75,
  vacancyPercent:5,managementPercent:10,utilitiesMonthly:0,
  utilityAllowance:150,
  sellerDownPercent:15,sellerInterest:5,sellerTermYears:30,sellerBalloonYears:5,
  sellerVerified:false
};
const nonneg=n=>Number.isFinite(Number(n))&&Number(n)>=0;
export const money=n=>Number.isFinite(n)?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n):'—';
export function mortgagePayment(principal,rate,years){
 if(!nonneg(principal)||!nonneg(rate)||!nonneg(years)||years<=0)return null;
 if(!rate)return principal/(12*years);
 const r=rate/1200,n=years*12;
 return principal*r/(1-Math.pow(1+r,-n));
}
export function underwrite(r,overrides={},mode='conventional'){
 const x={...DEFAULTS,...overrides},price=Number(r.price);
 if(!Number.isFinite(price)||price<=0)return null;
 const seller=mode==='seller';
 const downPct=Number(seller?x.sellerDownPercent:x.downPercent);
 const rate=Number(seller?x.sellerInterest:x.annualInterest);
 const years=Number(seller?x.sellerTermYears:x.termYears);
 const validate=[x.closingPercent,x.closingFixed,x.upfrontRepairs,x.initialReserves,x.propertyTaxPercent,x.insuranceMonthly,x.repairsMonthly,x.capexMonthly,x.vacancyPercent,x.managementPercent,x.utilitiesMonthly,x.utilityAllowance];
 if(!validate.every(nonneg)||!nonneg(downPct)||!nonneg(rate)||!nonneg(years)||years<=0||downPct>100||Number(x.vacancyPercent)+Number(x.managementPercent)>=100)return null;
 const down=price*downPct/100;
 const closing=price*Number(x.closingPercent)/100+Number(x.closingFixed);
 const cashToClose=down+closing+Number(x.upfrontRepairs)+Number(x.initialReserves);
 const monthlyDebt=mortgagePayment(price-down,rate,years);
 const benchmark=rentBenchmark(r);
 const rent=overrides.rentOverride!==undefined&&overrides.rentOverride!==''?Number(overrides.rentOverride):benchmark?.gross;
 const provenance=overrides.rentOverride!==undefined&&overrides.rentOverride!==''?'User-entered rent':'FY2027 HUD area FMR gross benchmark';
 const rentKnown=Number.isFinite(rent)&&rent>0;
 const effectiveRent=rentKnown?Math.max(0,rent-Number(x.utilityAllowance)):null;
 const monthlyTax=price*Number(x.propertyTaxPercent)/1200;
 const nonRentCosts=monthlyDebt+monthlyTax+Number(x.insuranceMonthly)+Number(x.repairsMonthly)+Number(x.capexMonthly)+Number(x.utilitiesMonthly);
 const variableCosts=rentKnown?effectiveRent*(Number(x.vacancyPercent)+Number(x.managementPercent))/100:null;
 const cashFlow=rentKnown?effectiveRent-nonRentCosts-variableCosts:null;
 const rentNeeded=(Number(x.targetCashFlow)+nonRentCosts)/(1-(Number(x.vacancyPercent)+Number(x.managementPercent))/100)+Number(x.utilityAllowance);
 return {price,mode,down,cashToClose,closing,monthlyDebt,monthlyTax,benchmark,provenance,
  rentGross:rentKnown?rent:null,effectiveRent,cashFlow,nonRentCosts,variableCosts,
  rentNeeded:Number.isFinite(rentNeeded)?rentNeeded:null,
  budgetPass:cashToClose<=Number(x.cashBudget),
  cashFlowPass:cashFlow!==null&&cashFlow>=Number(x.targetCashFlow),
  sellerEvidence:r.seller_finance_evidence||null,
  sellerTermsVerified:seller&&x.sellerVerified===true,
  assumptionsOnly:true};
}
export function dealEligibility(d,{budget=25000,target=500}={}){
 if(!d)return 'missing-price';
 if(d.cashToClose>budget)return 'over-budget';
 if(d.cashFlow===null)return 'rent-unavailable';
 if(d.cashFlow<target)return 'below-target';
 return 'scenario-passes-not-verified';
}
