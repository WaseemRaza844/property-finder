import {filterListings, safeURL} from './filters.js';
import './search-app.js';
import './discovery-ui.js';
const $ = id => document.getElementById(id);
const money = value => value == null ? 'Not provided' : new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
const date = value => new Date(value).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
const day = value => new Date(value).toLocaleDateString('en-CA',{timeZone:'America/New_York'});
function el(tag, text, cls) { const node = document.createElement(tag); if(text != null) node.textContent = text; if(cls) node.className = cls; return node; }
let data;
function renderCard(r) {
  const card = el('article',null,'listing');
  const top = el('div',null,'listing-top'); top.append(el('strong',money(r.price),'listing-price'),el('span',r.observed_this_run ? r.property_type : 'Previously observed','status')); card.append(top);
  card.append(el('h3',r.address),el('div',`${r.city}, ${r.state} ${r.zip}`,'listing-location'));
  const facts = el('div',null,'listing-facts');
  for(const [key,label] of [['units','units'],['beds','beds'],['baths','baths'],['sqft','sq ft']]) facts.append(el('span',`${r[key] ?? '—'} ${label}`));
  card.append(facts,el('p',`Status: ${r.status} · First seen ${date(r.first_seen)} · Last seen ${date(r.last_seen)} `,'muted'));
  const links = el('div',null,'listing-links');
  for(const s of r.sources) { const url=safeURL(s.url); if(url){ const a=el('a',`View on ${s.name} ↗`); a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a); } }
  card.append(links);
  const details=el('details'); details.append(el('summary','More property details'));
  const dl=el('dl');
  for(const [label,value] of [['Property type',r.property_type],['Market',r.market || 'Not provided'],['Year built',r.year_built ?? 'Not provided'],['Lot size',r.lot_sqft == null ? 'Not provided' : `${r.lot_sqft} sq ft`],['Annual tax',money(r.annual_tax)],['Monthly rent',money(r.monthly_rent)]]) dl.append(el('dt',label),el('dd',value));
  details.append(dl,el('p',r.description || 'No additional description supplied.'),el('p',`Observed prices: ${r.price_history.map(p=>`${money(p.price)} (${date(p.at)})`).join(' → ')}`),el('p','Availability is unverified. A retained observation is not confirmation that a property remains for sale.','muted'));card.append(details);return card;
}
function render() {
  if(!data) return;
  const center = $('center').value === 'custom' ? [Number($('lat').value),Number($('lon').value)] : $('center').value.split(',').map(Number);
  if($('radius').value && $('center').value === 'custom' && (!$('lat').value || !$('lon').value)) { $('feedback').textContent='Enter both latitude and longitude to apply a custom radius.'; return; }
  const f=Object.fromEntries(['market','type','price','radius','sort'].map(k=>[k,$(k).value])); f.center=center;
  const rows=filterListings(data.listings,f);
  $('results').replaceChildren(...rows.map(renderCard));$('result-count').textContent=rows.length;$('empty').hidden=rows.length>0;
  $('empty-message').textContent=data.listings.length ? 'No saved properties match these filters. Try another market, a wider radius, or a higher price limit.' : 'No listings have been imported yet. Connect an authorized source to begin building your watchlist.';
  $('feedback').textContent=`${rows.length} matching properties${f.radius ? '; listings with unknown coordinates excluded' : ''}.`;
}
$('filters').addEventListener('submit', e=>{e.preventDefault();render();});
$('filters').addEventListener('reset',()=>setTimeout(()=>{setCenter();render();},0));
function setCenter(){ const custom=$('center').value==='custom'; for(const key of ['lat','lon']){$(key).disabled=!custom;$(key).required=custom && Boolean($('radius').value);} }
$('center').addEventListener('change',setCenter);$('radius').addEventListener('change',setCenter);
try {
  const response=await fetch('data/listings.json',{cache:'no-store'});if(!response.ok) throw Error('Dataset unavailable');
  data=await response.json();if(!Array.isArray(data.listings)||!Array.isArray(data.sources)||!Number.isFinite(Date.parse(data.generated_at)))throw Error('Invalid dataset');
  $('total').textContent=data.listings.length;$('new-count').textContent=data.listings.filter(r=>day(r.first_seen)===day(new Date())).length;
  $('connected').textContent=`${data.sources.filter(s=>s.status==='ok' && s.count > 0).length} / ${data.sources.length}`;
  $('updated').textContent=date(data.generated_at);const stale=Date.now()-Date.parse(data.generated_at)>36*3600000;
  $('freshness').textContent=stale?'Refresh is overdue · data may be stale':'Eastern time · latest import check';
  for(const s of data.sources){const card=el('article',null,'source-card');card.append(el('h3',s.name),el('span',s.status==='ok'?'Import checked':s.status==='error'?'Import error':'Not connected',`status ${s.status}`),el('p',s.note),el('p',`${s.count} records this run`));$('source-grid').append(card);}
  render();
} catch(error) { $('feedback').textContent='Listing data could not be loaded. Please retry later; no source status can be verified.';$('updated').textContent='Unavailable';$('freshness').textContent='Refresh status unknown';$('results').replaceChildren();$('empty').hidden=false;$('empty-message').textContent='The saved dataset is unavailable. This is not confirmation that there are no listings.'; }
