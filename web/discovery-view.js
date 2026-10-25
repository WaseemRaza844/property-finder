import {markets} from './markets.js';
const closed=r=>['sold','off_market','pending'].includes(r.listing_status);
const fresh=(r,now)=>r.observed_this_run&&Number.isFinite(Date.parse(r.facts_observed_at))&&now-Date.parse(r.facts_observed_at)<=36*3600000;
const norm=s=>s.toLowerCase().replace(/[.]/g,'').replace(/\b(street|avenue|road|drive|boulevard|lane|court|place|apartment|suite)\b/g,w=>({street:'st',avenue:'ave',road:'rd',drive:'dr',boulevard:'blvd',lane:'ln',court:'ct',place:'pl',apartment:'unit',suite:'unit'}[w])).replace(/\s+/g,' ').trim();
export function propertyIdentity(r){
 // Require an explicit street address and full locality. Never fuzzy-match titles.
 if(/,\s*(?:unit\b|apt\b|apartment\b|suite\b|#)/i.test(r.title||''))return r.url;
 const street=/^\s*(\d+[A-Za-z]?(?:-\d+)?\s+[^,|]{2,100}),/.exec(r.title||'')?.[1];
 return street&&r.town&&r.state&&/^\d{5}$/.test(r.zip||'')?`${norm(street)}|${norm(r.town)}|${r.state}|${r.zip}`:r.url;
}
export function uniqueProperties(rows,now=Date.now(),source=''){
 const groups=new Map();for(const r of rows){const key=propertyIdentity(r);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
 const rank={'homes.com':0,'redfin.com':1,'realtor.com':2};
 return [...groups.values()].flatMap(group=>{
  // Current contradictory closed evidence suppresses the entire matched property.
  if(group.some(r=>closed(r)&&fresh(r,now)))return [];
  const choices=group.filter(r=>!closed(r)&&(!source||r.source===source)).sort((a,b)=>Number(b.listing_status==='active'&&fresh(b,now))-Number(a.listing_status==='active'&&fresh(a,now))||(rank[a.source]??9)-(rank[b.source]??9)||b.last_seen.localeCompare(a.last_seen));
  if(!choices.length)return [];const chosen=choices[0];
  return [{...chosen,markets:[...new Set(group.flatMap(r=>r.markets))],alternates:group.filter(r=>r.url!==chosen.url).map(r=>({url:r.url,source:r.source,status:r.listing_status}))}];
 });
}
export function selectDiscoveries(rows,f,now=Date.now()){
  return uniqueProperties(rows,now,f.source).filter(r=>{
    if(['sold','off_market','pending'].includes(r.listing_status))return false;
    if(f.status==='active'&&(r.listing_status!=='active'||!r.observed_this_run||!r.facts_observed_at||!Number.isFinite(Date.parse(r.facts_observed_at))||now-Date.parse(r.facts_observed_at)>36*3600000))return false;
    if(f.market&&!r.markets.includes(f.market)||f.source&&r.source!==f.source||f.town&&`${r.town||''}, ${r.state||''}`!==f.town||f.zip&&r.zip!==f.zip)return false;
    if(f.region&&!r.markets.some(m=>markets[m]?.region===f.region))return false;
    if(f.price!=null&&f.price!==''&&(r.price==null||r.price>Number(f.price)))return false;
    if(f.complete&&['price','beds','sqft','units'].some(k=>r[k]==null))return false;
    return !f.keyword||`${r.title} ${r.town||''} ${r.zip||''} ${r.property_type||''}`.toLowerCase().includes(f.keyword.toLowerCase());
  }).sort((a,b)=>{
    const sorts={price:['price',1],price_desc:['price',-1],beds:['beds',-1],sqft:['sqft',-1],units:['units',-1]};
    if(sorts[f.sort]){const [k,d]=sorts[f.sort];if(a[k]==null&&b[k]!=null)return 1;if(b[k]==null&&a[k]!=null)return -1;if(a[k]!=null&&b[k]!=null&&a[k]!==b[k])return d*(a[k]-b[k]);}
    if(f.sort==='town'){const d=(a.town||'~').localeCompare(b.town||'~');if(d)return d;}
    if(f.sort==='market'){const d=(a.markets[0]||'~').localeCompare(b.markets[0]||'~');if(d)return d;}
    return b.first_seen.localeCompare(a.first_seen)||a.url.localeCompare(b.url);
  });
}
export function groupDiscoveries(rows,by){
  const groups=new Map();let number=0;
  for(const r of rows){const name=by==='region'?(markets[r.markets[0]]?.region||'Unassigned region'):by==='town'?(r.town?`${r.town}, ${r.state||''}`:'Town not supplied'):by==='zip'?(r.zip||'ZIP not supplied'):by==='market'?(r.markets[0]||'Unassigned market'):by==='source'?r.source:'All matching properties';if(!groups.has(name))groups.set(name,[]);groups.get(name).push(r);}
  return [...groups].map(([name,items])=>({name,items:items.map(r=>({...r,number:++number}))}));
}
export function topPicks(rows,f={},now=Date.now()){
 const eligible=selectDiscoveries(rows,{...f,status:'active'},now).filter(r=>r.units>=2||['duplex','triplex','fourplex','multifamily'].includes(r.property_type));
 const selected=[],used=new Set();
 for(const [key,label] of [['price','Lowest price'],['units','Most units']]){
  const ranked=eligible.filter(r=>Number.isFinite(r[key])&&r[key]>0&&(key!=='units'||r.units>=2)).sort((a,b)=>(key==='price'?a.price-b.price:b.units-a.units)||a.url.localeCompare(b.url));
  let count=0;for(const r of ranked){if(used.has(r.url))continue;selected.push({...r,pick_reason:`${label} · ${++count}`,number:selected.length+1});used.add(r.url);if(count===2)break;}
 }
 return selected;
}
