import {listingURL,markets} from './search.js';
import {selectDiscoveries,groupDiscoveries,topPicks} from './discovery-view.js';
import {populateMarkets} from './market-controls.js';
const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const date=x=>x?new Date(x).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Not supplied';
const money=n=>n==null?'Price not supplied':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const states={not_configured:'Setup needed: add EXA_API_KEY.',budget_exhausted:'Search allowance reached.',already_reserved:'This run has already reserved its searches.',consumed:'Search reservation already used.',error:'Searches failed; retained records are not treated as active.',partial:'Some searches failed; coverage is incomplete.',ok:'Search completed.'};
const controls=['region','market','source','keyword','town','zip','status','sort','group','price','complete','compact'];let data;
const control=k=>$(k==='status'?'discovery-status-filter':'discovery-'+k);
function filters(){return Object.fromEntries(controls.map(k=>[k,control(k).type==='checkbox'?control(k).checked:control(k).value]));}
function localityOptions(){
 const f=filters(),rows=data.results.filter(r=>(!f.region||r.markets.some(m=>markets[m]?.region===f.region))&&(!f.market||r.markets.includes(f.market)));
 for(const [key,values,label] of [['town',[...new Set(rows.filter(r=>r.town).map(r=>`${r.town}, ${r.state||''}`))].sort(),'All towns'],['zip',[...new Set(rows.map(r=>r.zip).filter(Boolean))].sort(),'All ZIP codes']]){const n=control(key),value=n.value;n.replaceChildren(new Option(label,''));for(const v of values)n.add(new Option(v,v));if(values.includes(value))n.value=value;}
}
function card(r){
 const article=el('article',null,'property-result'),body=el('div',null,'result-body'),top=el('div',null,'result-top');
 top.append(el('strong',money(r.price),'result-price'),el('span',r.listing_status==='active'?'Indexed as for sale':'Status unverified',r.listing_status==='active'?'status ok':'status'),el('span',r.source==='homes.com'?'Homes.com · preferred':r.source,'source-label'));
 const title=el('h3'),a=el('a',r.title+' ↗');a.href=listingURL(r.url).url;a.target='_blank';a.rel='noopener noreferrer';title.append(a);
 const facts=el('div',null,'property-facts');for(const [v,label] of [[r.units,'units'],[r.beds,'beds'],[r.baths,'baths'],[r.sqft,'sq ft']]){const fact=el('span');fact.append(el('b',v==null?'—':Number(v).toLocaleString('en-US')),document.createTextNode(' '+label));facts.append(fact);}
 body.append(top,title,el('p',`${r.town||'Town not supplied'}${r.state?', '+r.state:''} · ZIP ${r.zip||'not supplied'} · ${r.property_type||'Type not supplied'}`,'result-location'),facts);
 const details=el('details',null,'result-details');details.append(el('summary','Source & observation details'),el('p',`${r.source} · Search market: ${r.markets.map(m=>markets[m]?.name||m).join(', ')}`),el('p',`Facts retrieved ${date(r.facts_observed_at)} · First found ${date(r.first_seen)} · Last found ${date(r.last_seen)}`),el('p',r.status_evidence?`Indexed status evidence: “${r.status_evidence}”`:'No explicit current-status evidence supplied.'),el('p','Facts come from Exa’s indexed snapshot, not a live listing feed. Confirm them on the source. Missing values stay unknown. Historical sales and comparable-home sections are excluded from extraction.'));
 if(r.alternates?.length){const links=el('p','Also discovered on: ');for(const other of r.alternates){const link=el('a',`${other.source} (${other.status||'unverified'}) ↗ `);link.href=listingURL(other.url).url;link.target='_blank';link.rel='noopener noreferrer';links.append(link);}details.append(links);}
 if(r.not_searched_this_run)details.append(el('p','This source was not scheduled for this market in the latest rotation. The displayed observation is less than 36 hours old; its retrieval date has not been advanced.'));
 body.append(details);article.append(el('span',String(r.number).padStart(2,'0'),'result-number'),body);return article;
}
function render(){if(!data)return;const f=filters(),rows=selectDiscoveries(data.results,f),groups=groupDiscoveries(rows,f.group),excluded=data.results.filter(r=>['sold','off_market','pending'].includes(r.listing_status)).length;
 const picks=topPicks(data.results,f);$('top-picks').replaceChildren(...picks.map(r=>{const item=el('div',null,'pick-item');item.append(el('p',r.pick_reason,'pick-reason'),card(r));return item;}));$('picks-empty').hidden=picks.length>0;$('picks-empty').textContent='No multifamily picks with recent for-sale evidence match your filters yet. Picks appear only when the source supplies the required price or unit count.';
 $('discovery-count').textContent=`${rows.length} matching properties · ${groups.length} groups · ${excluded} sold/off-market/pending hidden. Missing prices are excluded when a price cap is set.`;
 $('discovery-results').className=f.compact?'organized-results compact-results':'organized-results';
 $('discovery-results').replaceChildren(...groups.map(g=>{const section=el('details',null,'result-group');section.open=true;const summary=el('summary');summary.append(el('strong',f.group==='market'?(markets[g.name]?.name||g.name):g.name),el('span',`${g.items.length} properties`,'group-count'));const list=el('div',null,'result-group-items');list.append(...g.items.map(card));section.append(summary,list);return section;}));
 $('discovery-empty').hidden=rows.length>0;$('discovery-empty').textContent=f.status==='active'?'No recent results have explicit for-sale evidence matching these filters. Sold, off-market, pending, stale, and unknown-status links are excluded. Review unverified results with the Status filter if needed.':'No results match these filters.';
 try{localStorage.setItem('property-finder.discovery-view.v2',JSON.stringify(f));}catch{}
}
for(const k of controls)control(k).addEventListener(['keyword','price'].includes(k)?'input':'change',()=>{if(k==='region'){populateMarkets(control('market'),control('region').value,'All markets');control('town').value='';control('zip').value='';}if(['region','market'].includes(k))localityOptions();render();});
$('collapse-groups').onclick=()=>document.querySelectorAll('.result-group').forEach(n=>n.open=false);$('expand-groups').onclick=()=>document.querySelectorAll('.result-group').forEach(n=>n.open=true);
$('reset-discovery').onclick=()=>{populateMarkets(control('market'),'','All markets');for(const k of controls){const n=control(k);if(n.type==='checkbox')n.checked=k==='compact';else n.value=k==='status'?'active':k==='sort'?'price':k==='group'?'town':'';}localityOptions();render();};
try{const response=await fetch('data/discoveries.json',{cache:'no-store'});if(!response.ok)throw Error();const raw=await response.json();if(!Array.isArray(raw.results)||!Array.isArray(raw.queries))throw Error();
 data={...raw,results:raw.results.filter(r=>r&&typeof r.title==='string'&&listingURL(r.url)&&Array.isArray(r.markets)&&Number.isFinite(Date.parse(r.first_seen))&&Number.isFinite(Date.parse(r.last_seen)))};
 for(const [key,values] of [['town',[...new Set(data.results.filter(r=>r.town).map(r=>`${r.town}, ${r.state||''}`))].sort()],['zip',[...new Set(data.results.map(r=>r.zip).filter(Boolean))].sort()]])for(const v of values){const o=el('option',v);o.value=v;$('discovery-'+key).append(o);}
 try{const saved=JSON.parse(localStorage.getItem('property-finder.discovery-view.v2')||'null');if(saved)for(const k of controls){const n=control(k);if(n.type==='checkbox')n.checked=Boolean(saved[k]);else if(typeof saved[k]==='string'&& (n.tagName!=='SELECT'||[...n.options].some(o=>o.value===saved[k])))n.value=saved[k];}}catch{}
 populateMarkets(control('market'),control('region').value,'All markets');
 localityOptions();
 $('discovery-status').textContent=`${states[data.status]||'Status unknown.'} Last complete search: ${date(data.last_success_at)}. Usage: ${data.reserved_requests} / ${data.monthly_limit} Lite requests. Indexed for-sale evidence is not a live availability guarantee.`;
 $('discovery-source-coverage').textContent=['homes.com','realtor.com','redfin.com'].map(source=>`${source}: ${data.queries.reduce((n,q)=>n+(q.source_counts?.[source]||0),0)} property-page matches this run; ${selectDiscoveries(data.results,{source,status:'active',price:''}).length} recent for-sale results`).join(' · ');
 $('discovery-reports').replaceChildren(...data.queries.map(q=>el('p',`${markets[q.market]?.name||q.market} · ${q.domain}: ${q.status==='ok'?`${q.accepted} property-page matches from ${q.returned??'unknown'} returned results (${Object.entries(q.source_counts||{}).map(([s,n])=>`${s}: ${n}`).join(', ')||'source breakdown unavailable'})`:q.note||q.status}`)));render();
}catch{$('discovery-status').textContent='Search data could not be loaded. Status is unknown; reload after deployment finishes.';$('picks-empty').textContent='Picks are unavailable because search data could not be loaded.';}
