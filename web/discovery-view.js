export function selectDiscoveries(rows,f,now=Date.now()){
  return rows.filter(r=>{
    if(['sold','off_market','pending'].includes(r.listing_status))return false;
    if(f.status==='active'&&(r.listing_status!=='active'||!r.observed_this_run||!r.facts_observed_at||!Number.isFinite(Date.parse(r.facts_observed_at))||now-Date.parse(r.facts_observed_at)>36*3600000))return false;
    if(f.market&&!r.markets.includes(f.market)||f.source&&r.source!==f.source||f.town&&`${r.town||''}, ${r.state||''}`!==f.town||f.zip&&r.zip!==f.zip)return false;
    if(f.price!==''&&(r.price==null||r.price>Number(f.price)))return false;
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
  for(const r of rows){const name=by==='town'?(r.town?`${r.town}, ${r.state||''}`:'Town not supplied'):by==='zip'?(r.zip||'ZIP not supplied'):by==='market'?(r.markets[0]||'Unassigned market'):by==='source'?r.source:'All matching properties';if(!groups.has(name))groups.set(name,[]);groups.get(name).push(r);}
  return [...groups].map(([name,items])=>({name,items:items.map(r=>({...r,number:++number}))}));
}
