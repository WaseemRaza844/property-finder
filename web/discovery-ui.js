import {listingURL,markets} from './search.js';
import {selectDiscoveries,groupDiscoveries,topPicks,scopedDiscoveries,isNewDiscovery} from './discovery-view.js';
import {populateMarkets} from './market-controls.js';
const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const date=x=>x?new Date(x).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Not supplied';
const ageLabel=x=>{
 const t=Date.parse(x);if(!Number.isFinite(t))return 'First discovered: unknown';
 return 'First discovered '+new Date(t).toLocaleDateString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',year:'numeric'});
};
const money=n=>n==null?'Price not supplied':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const states={not_configured:'Setup needed: add EXA_API_KEY.',budget_exhausted:'Search allowance reached.',already_reserved:'This run has already reserved its searches.',consumed:'Search reservation already used.',error:'Searches failed; retained records are not treated as active.',partial:'Some searches failed; coverage is incomplete.',ok:'Search completed.'};
const controls=['region','market','source','keyword','town','zip','status','sort','group','price','complete','compact'];let data, scope='regional';
const control=k=>$(k==='status'?'discovery-status-filter':'discovery-'+k);
function filters(){return Object.fromEntries(controls.map(k=>[k,control(k).type==='checkbox'?control(k).checked:control(k).value]));}
function localityOptions(){
 const f=filters(),rows=scopedDiscoveries(data.results,scope).filter(r=>(!f.region||r.markets.some(m=>markets[m]?.region===f.region))&&(!f.market||r.markets.includes(f.market))&&(!$('discovery-college-state').value||scope!=='college'||r.markets.some(m=>markets[m]?.college_region===$('discovery-college-state').value))&&(!$('discovery-affordable-state').value||scope!=='affordable'||r.markets.some(m=>markets[m]?.towns?.[0].endsWith(' '+$('discovery-affordable-state').value))));
 for(const [key,values,label] of [['town',[...new Set(rows.filter(r=>r.town).map(r=>`${r.town}, ${r.state||''}`))].sort(),'All towns'],['zip',[...new Set(rows.map(r=>r.zip).filter(Boolean))].sort(),'All ZIP codes']]){const n=control(key),value=n.value;n.replaceChildren(new Option(label,''));for(const v of values)n.add(new Option(v,v));if(values.includes(value))n.value=value;}
}
function card(r){
 const article=el('article',null,'property-result'),body=el('div',null,'result-body'),top=el('div',null,'result-top');
 if(isNewDiscovery(r))top.append(el('span','NEW · first found recently','discovery-new-badge'));
 top.append(el('strong',money(r.price),'result-price'),el('span',r.listing_status==='active'?(Date.now()-Date.parse(r.facts_observed_at)>36*3600000?'Previously listed · verify':'Indexed as for sale'):'Status unverified',r.listing_status==='active'?'status ok':'status'),el('span',r.source==='homes.com'?'Homes.com · preferred':r.source,'source-label'));
 const title=el('h3'),a=el('a',r.title+' ↗');a.href=listingURL(r.url).url;a.target='_blank';a.rel='noopener noreferrer';title.append(a);
 const facts=el('div',null,'property-facts');for(const [v,label] of [[r.units,'units'],[r.beds,'beds'],[r.baths,'baths'],[r.sqft,'sq ft']]){const fact=el('span');fact.append(el('b',v==null?'—':Number(v).toLocaleString('en-US')),document.createTextNode(' '+label));facts.append(fact);}
 if(r.markets?.some(id=>markets[id]?.region==='Move-in Ready Under $100K')){
   body.append(el('p',r.condition_evidence?`Indexed condition wording: ${r.condition_evidence} · Inspect before purchase`:'Move-in condition unverified · Inspection required','discovery-dates'));
 }
 body.append(top,title,el('p',`${r.town||'Town not supplied'}${r.state?', '+r.state:''} · ZIP ${r.zip||'not supplied'} · ${r.property_type||'Type not supplied'}`,'result-location'),el('p',ageLabel(r.first_seen)+' · Last indexed '+date(r.facts_observed_at),'discovery-dates'),facts);
 const details=el('details',null,'result-details');details.append(el('summary','Source & observation details'),el('p',`${r.source} · Search market: ${r.markets.map(m=>markets[m]?.name||m).join(', ')}`),el('p',`Facts retrieved ${date(r.facts_observed_at)} · First found ${date(r.first_seen)} · Last found ${date(r.last_seen)}`),el('p',r.status_evidence?`Indexed status evidence: “${r.status_evidence}”`:'No explicit current-status evidence supplied.'),el('p','Facts come from Exa’s indexed snapshot, not a live listing feed. Confirm them on the source. Missing values stay unknown. Historical sales and comparable-home sections are excluded from extraction.'));
 if(r.alternates?.length){const links=el('p','Also discovered on: ');for(const other of r.alternates){const link=el('a',`${other.source} (${other.status||'unverified'}) ↗ `);link.href=listingURL(other.url).url;link.target='_blank';link.rel='noopener noreferrer';links.append(link);}details.append(links);}
 if(r.not_searched_this_run)details.append(el('p','This source was not scheduled for this market in the latest rotation. The displayed observation is less than 36 hours old; its retrieval date has not been advanced.'));
 if(r.markets?.some(id=>markets[id]?.region==='Move-in Ready Under $100K')&&Number.isFinite(r.price)&&r.price<=100000){
   const scenario=el('button','Use asking price in rental scenario','button secondary');
   scenario.type='button';
   scenario.addEventListener('click',()=>{$('aff-price').value=String(r.price);computeCashflow();$('affordable-finances').scrollIntoView({behavior:'smooth'});});
   body.append(scenario);
 }
 body.append(details);article.append(el('span',String(r.number).padStart(2,'0'),'result-number'),body);return article;
}
function render(){if(!data)return;const f={...filters(),scope,collegeState:$('discovery-college-state').value,affordableState:$('discovery-affordable-state').value,affordableUnverified:$('affordable-unverified').checked},sourceRows=scopedDiscoveries(data.results,scope),rows=selectDiscoveries(data.results,f),groups=groupDiscoveries(rows,f.group),excluded=sourceRows.filter(r=>['sold','off_market','pending'].includes(r.listing_status)).length;
 const picks=topPicks(data.results,f);$('top-picks').replaceChildren(...picks.map(r=>{const item=el('div',null,'pick-item');item.append(el('p',r.pick_reason,'pick-reason'),card(r));return item;}));$('picks-empty').hidden=picks.length>0;$('picks-empty').textContent='No matching indexed properties yet. Check the full list and available review filters.';
 const newest=rows.filter(r=>isNewDiscovery(r));
 $('discovery-count').textContent=`${newest.length} first discovered in last 72 hours · ${rows.length} matches · ${sourceRows.length} saved in ${scope==='regional'?'regional':scope==='college'?'college-town':'under-$100K'} workspace · ${excluded} closed/pending hidden`;
 $('review-discovery').hidden = rows.length > 0 || f.status === 'review' || sourceRows.length === 0;
 $('discovery-results').className=f.compact?'organized-results compact-results':'organized-results';
 $('discovery-results').replaceChildren(...groups.map(g=>{const section=el('details',null,'result-group');section.open=true;const summary=el('summary');summary.append(el('strong',f.group==='market'?(markets[g.name]?.name||g.name):g.name));
  if(scope==='college'){
    const universities=[...new Set(g.items.flatMap(r=>r.markets||[]).filter(id=>markets[id]?.region==='College Towns').flatMap(id=>(markets[id].university||'').split(';').map(v=>v.trim()).filter(Boolean)))];
    if(universities.length){const names=el('span',universities.slice(0,3).join(' · '),'group-universities');names.title=universities.join(' · ')+' · Nearby university, not verified rental yield';summary.append(names);}
  }
  summary.append(el('span',`${g.items.length} properties`,'group-count'));const list=el('div',null,'result-group-items');list.append(...g.items.map(card));section.append(summary,list);return section;}));
 $('discovery-empty').hidden=rows.length>0;$('discovery-empty').textContent=f.status==='active'?'No fresh matches within 36 hours. Choose Latest saved results or Review unverified properties.':f.status==='latest'?'No stored for-sale matches. Change market, reset filters, or review unverified properties.':'No matches. Try Reset filters or another market.';
 // Workspace scope is intentionally not restored from older saved filters.
}
function refreshMarketOptions() {
 const region=control('region');
 region.replaceChildren(new Option('All regions',''));
 for(const r of [...new Set(Object.values(markets).filter(m=>!['College Towns','Move-in Ready Under $100K'].includes(m.region)).map(m=>m.region))])region.add(new Option(r,r));
 const states=[...new Set(Object.values(markets).filter(m=>m.region==='College Towns').map(m=>m.college_region).filter(Boolean))].sort();
 const state=$('discovery-college-state');state.replaceChildren(new Option('All states',''));
 for(const name of states)state.add(new Option(name,name));
 const affordableStates=[...new Set(Object.values(markets).filter(m=>m.region==='Move-in Ready Under $100K').map(m=>m.towns[0].split(' ').at(-1)))].sort();
 const affordable=$('discovery-affordable-state');affordable.replaceChildren(new Option('All states',''));
 for(const name of affordableStates)affordable.add(new Option(name,name));
 refreshMarketSelect();
}
function refreshMarketSelect() {
 const select=control('market'),previous=select.value;
 select.replaceChildren(new Option('All markets',''));
 const items=Object.values(markets).filter(m=>scope==='college'?m.region==='College Towns'&&(!$('discovery-college-state').value||m.college_region===$('discovery-college-state').value):scope==='affordable'?m.region==='Move-in Ready Under $100K'&&(!$('discovery-affordable-state').value||m.towns[0].endsWith(' '+$('discovery-affordable-state').value)):!['College Towns','Move-in Ready Under $100K'].includes(m.region)&&(!control('region').value||m.region===control('region').value));
 for(const m of items)select.add(new Option(m.name,m.id));
 if(items.some(m=>m.id===previous))select.value=previous;
}
function switchScope(next,scroll=false) {
 scope=['college','affordable'].includes(next)?next:'regional';
 for(const k of controls){const n=control(k);if(n.type==='checkbox')n.checked=k==='compact';else n.value=k==='status'?'latest':k==='sort'?'newest':k==='group'?'town':'';}
 $('discovery-college-state').value='';
 $('discovery-affordable-state').value='';
 $('affordable-unverified').checked=false;
 $('affordable-unverified-label').hidden=scope!=='affordable';
 $('affordable-state-label').hidden=scope!=='affordable';
 $('affordable-finances').hidden=scope!=='affordable';
 $('review-discovery').textContent=scope==='affordable'?'Review condition-unverified candidates':'Review unverified properties';
 $('discovery-complete-label').hidden=scope==='affordable';
 control('price').value=scope==='affordable'?'100000':'';
 control('price').readOnly=scope==='affordable';
 $('regional-region-label').hidden=scope!=='regional';
 $('college-state-label').hidden=scope!=='college';
 $('mode-regional').classList.toggle('is-active',scope==='regional');
 $('mode-college').classList.toggle('is-active',scope==='college');
 $('mode-affordable').classList.toggle('is-active',scope==='affordable');
 $('mode-regional').setAttribute('aria-pressed',String(scope==='regional'));
 $('mode-college').setAttribute('aria-pressed',String(scope==='college'));
 $('mode-affordable').setAttribute('aria-pressed',String(scope==='affordable'));
 $('picks-heading').textContent=scope==='college'?'New college-town discoveries':scope==='affordable'?'Move-in ready · Under $100K':'New regional discoveries';
 $('discovery-heading').textContent=scope==='college'?'College-town property listings':scope==='affordable'?'Affordable rental house candidates':'Regional property listings';
 $('mode-description').textContent=scope==='college'?'Student-oriented university markets nationwide · Listings are not rental-yield guarantees.':scope==='affordable'?'City populations approximately 50,000+ · 2+ bedrooms · asking price at most $100K · condition explicitly stated unless review enabled. Cash flow is not verified.':'NJ · PA · Delaware · Maryland · Ohio · North/South Carolina · Georgia · Upstate NY';
 refreshMarketOptions();
 if(data)localityOptions();
 render();
 if(scroll)$('automatic-workspace').scrollIntoView({behavior:'smooth'});
}
$('mode-regional').onclick=()=>switchScope('regional');
$('mode-college').onclick=()=>switchScope('college');
$('mode-affordable').onclick=()=>switchScope('affordable');
$('browse-regional').onclick=()=>switchScope('regional',true);
$('browse-college').onclick=()=>switchScope('college',true);
$('browse-affordable').onclick=()=>switchScope('affordable',true);
$('discovery-college-state').addEventListener('change',()=>{control('market').value='';refreshMarketSelect();localityOptions();render();});
$('discovery-affordable-state').addEventListener('change',()=>{control('market').value='';refreshMarketSelect();localityOptions();render();});
$('affordable-unverified').addEventListener('change',render);

for(const k of controls)control(k).addEventListener(['keyword','price'].includes(k)?'input':'change',()=>{if(k==='region'){refreshMarketSelect();control('town').value='';control('zip').value='';}if(['region','market'].includes(k))localityOptions();render();});
$('review-discovery').onclick=()=>{if(scope==='affordable'){$('affordable-unverified').checked=true;}else{control('status').value='review';}render();};
$('collapse-groups').onclick=()=>document.querySelectorAll('.result-group').forEach(n=>n.open=false);$('expand-groups').onclick=()=>document.querySelectorAll('.result-group').forEach(n=>n.open=true);
$('reset-discovery').onclick=()=>{refreshMarketOptions();for(const k of controls){const n=control(k);if(n.type==='checkbox')n.checked=k==='compact';else n.value=k==='status'?'latest':k==='sort'?'price':k==='group'?'town':'';}if(scope==='affordable'){control('price').value='100000';control('price').readOnly=true; $('affordable-unverified').checked=false;}localityOptions();render();};
// Local-only cash-flow scenario: refuse to produce a number until key inputs exist.
const financialInputs=['price','down','rate','rent','tax','insurance','repairs','vacancy','management'].map(id=>$('aff-'+id));
function computeCashflow(){
 const [price,down,rate,rent,tax,insurance,repairs,vacancy,management]=financialInputs.map(n=>n.value.trim()===''?NaN:Number(n.value));
 const output=$('aff-cashflow');
 if([price,down,rate,rent,tax,insurance,repairs,vacancy,management].some(x=>!Number.isFinite(x))||price<=0||price>100000||down>=price||down<0||rent<=0||[tax,insurance,repairs,vacancy,management,rate].some(x=>x<0)||vacancy>100||management>100){
   output.textContent='Enter valid asking price, rent, taxes, insurance, repairs and financing assumptions before estimating cash flow.';return;
 }
 const principal=price-down,monthlyRate=rate/1200,months=360;
 const payment=monthlyRate===0?principal/months:principal*monthlyRate/(1-Math.pow(1+monthlyRate,-months));
 const expenses=tax+insurance+repairs+rent*(vacancy+management)/100;
 const estimate=rent-payment-expenses;
 output.textContent=`Illustrative monthly net before omitted costs: ${money(Math.round(estimate))}. Mortgage P&I: ${money(Math.round(payment))}; entered operating expenses/reserves: ${money(Math.round(expenses))}. Not verified rental cash flow or a purchase recommendation.`;
}
for(const input of financialInputs)input.addEventListener('input',computeCashflow);
computeCashflow();
try{const response=await fetch('data/discoveries.json',{cache:'no-store'});if(!response.ok)throw Error();let raw=await response.json();if(!Array.isArray(raw.results)||!Array.isArray(raw.queries))throw Error();
 if(raw.results.length===0){try{const snapshot=await fetch('data/latest-successful.json',{cache:'no-store'});if(snapshot.ok){const saved=await snapshot.json();if(Array.isArray(saved.results)&&saved.results.length){raw={...raw,results:saved.results,showing_saved_snapshot:true,snapshot_at:saved.generated_at};}}}catch{ /* No snapshot yet. */ }}
 data={...raw,results:raw.results.filter(r=>r&&typeof r.title==='string'&&listingURL(r.url)&&Array.isArray(r.markets)&&Number.isFinite(Date.parse(r.first_seen))&&Number.isFinite(Date.parse(r.last_seen)))};
 for(const [key,values] of [['town',[...new Set(data.results.filter(r=>r.town).map(r=>`${r.town}, ${r.state||''}`))].sort()],['zip',[...new Set(data.results.map(r=>r.zip).filter(Boolean))].sort()]])for(const v of values){const o=el('option',v);o.value=v;$('discovery-'+key).append(o);}
 refreshMarketOptions();

 localityOptions();
 switchScope('regional');
 $('discovery-status').textContent=`${data.showing_saved_snapshot?'Showing archived results · ':''}${states[data.status]||'Status unknown.'} ${data.results.length} saved indexed results · Last successful search: ${date(data.last_success_at||data.snapshot_at)} · Budget: ${data.reserved_requests}/${data.monthly_limit}. Verify status on the source.`;
 $('discovery-source-coverage').textContent=['homes.com','realtor.com','redfin.com'].map(source=>`${source}: ${data.queries.reduce((n,q)=>n+(q.source_counts?.[source]||0),0)} property-page matches this run; ${selectDiscoveries(data.results,{source,status:'active',price:''}).length} recent for-sale results`).join(' · ');
 $('discovery-reports').replaceChildren(...data.queries.map(q=>el('p',`${markets[q.market]?.name||q.market} · ${q.domain}: ${q.status==='ok'?`${q.accepted} property-page matches from ${q.returned??'unknown'} returned results (${Object.entries(q.source_counts||{}).map(([s,n])=>`${s}: ${n}`).join(', ')||'source breakdown unavailable'})`:q.note||q.status}`)));render();
}catch{$('discovery-status').textContent='Search data could not be loaded. Status is unknown; reload after deployment finishes.';$('picks-empty').textContent='Picks are unavailable because search data could not be loaded.';}
