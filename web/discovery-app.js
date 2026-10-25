import {listingURL, markets} from './search.js';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const date=x=>x?new Date(x).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Not yet';
const states={not_configured:'Setup needed: add the EXA_API_KEY repository secret to enable automatic searches.',budget_exhausted:'Application search allowance reached. Automatic searches resume next month; recent links remain below.',already_reserved:'This workflow run has already reserved its searches. No additional requests were sent.',consumed:'This search reservation has already been used. No additional requests were sent.',error:'All search requests failed. Retained links may be stale; see the source status below.',partial:'Some searches failed. Results below include retained discoveries from earlier runs.',ok:'Automatic search completed.'};
let data;
function render(){
  if(!data)return;
  const market=$('discovery-market').value,source=$('discovery-source').value,word=$('discovery-keyword').value.trim().toLowerCase();
  const rows=data.results.filter(r=>(!market||r.markets.includes(market))&&(!source||r.source===source)&&(!word||r.title.toLowerCase().includes(word)));
  $('discovery-count').textContent=`${rows.length} matching saved discoveries · ${data.results.length} retained overall`;
  $('discovery-results').replaceChildren(...rows.map(r=>{const card=el('article',null,'saved-card'),heading=el('h3'),a=el('a',r.title+' ↗');a.href=listingURL(r.url).url;a.target='_blank';a.rel='noopener noreferrer';heading.append(a);card.append(el('span',r.source,'status'),heading,el('p',r.markets.map(m=>markets[m]?.name||m).join(' · '),'muted'),el('p',`First discovered ${date(r.first_seen)} · Last found ${date(r.last_seen)}`,'muted'),el('p',r.observed_this_run?'Found in the latest search.':'Previously found; not rediscovered in this run.','muted'),el('p','Price, unit count, exact location, and availability unverified.'));return card;}));
  $('discovery-empty').hidden=rows.length>0;
  $('discovery-empty').textContent=data.status==='not_configured'?'Automatic collection is ready to configure. No live API search has run yet.':data.results.length?'No saved discoveries match these filters.':'No individual property links are saved. This does not mean the market has no listings; check search status and coverage.';
}
for(const id of ['discovery-market','discovery-source','discovery-keyword'])$(id).addEventListener(id==='discovery-keyword'?'input':'change',render);
try{
  const response=await fetch('data/discoveries.json',{cache:'no-store'});if(!response.ok)throw Error();
  const raw=await response.json();if(!Array.isArray(raw.results)||!Array.isArray(raw.queries))throw Error();
  data={...raw,results:raw.results.filter(r=>r&&typeof r.title==='string'&&listingURL(r.url)&&Array.isArray(r.markets)&&Number.isFinite(Date.parse(r.first_seen))&&Number.isFinite(Date.parse(r.last_seen)))};
  $('discovery-status').textContent=`${states[data.status]||'Search status unknown.'} Last complete search: ${date(data.last_success_at)}. Reserved this month: ${data.reserved_requests} / ${data.monthly_limit} Lite search requests.`;
  $('discovery-reports').replaceChildren(...data.queries.map(q=>el('p',`${markets[q.market]?.name||q.market} · ${q.domain}: ${q.status==='ok'?`${q.accepted} property-page matches`:q.note||q.status}`)));
  render();
}catch{$('discovery-status').textContent='Automatic search data could not be loaded. Status is unknown; reload the page after the deployment finishes.';}
