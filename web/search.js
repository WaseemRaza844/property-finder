// Search links are ordinary user-opened URLs. No portal or search engine is scraped.
import {markets} from './markets.js';
export {markets};
const typeTerms = {multifamily:'("multi family" OR multifamily OR duplex OR triplex)',duplex:'duplex',triplex:'triplex',fourplex:'(fourplex OR "4 unit" OR "four unit")',all:'homes'};
export function buildSearches({market='bedminster',type='multifamily',price='',nearby=false,keywords=''}) {
  const place=markets[market]; if(!place || !typeTerms[type]) throw Error('Choose a supported market and property type');
  if(price !== '' && (!Number.isFinite(Number(price)) || Number(price)<=0)) throw Error('Enter a positive maximum price');
  const location=nearby ? `("${place.city}" OR ${place.nearby.map(t=>`"${t}"`).join(' OR ')})` : `"${place.city}"`;
  const query=`${location} ${typeTerms[type]} for sale${price ? ` under $${Number(price).toLocaleString('en-US')}`:''}${keywords.trim() ? ` ${keywords.trim().slice(0,160)}`:''}`;
  const google=domain=>'https://www.google.com/search?'+new URLSearchParams({q:`site:${domain} ${query}`});
  let realtor=`https://www.realtor.com/realestateandhomes-search/${place.slug}`;
  if(type!=='all') realtor+='/type-multi-family-home';
  if(price) realtor+=`/price-na-${Number(price)}`;
  return [
    {id:'homes',name:'Homes.com',url:google('homes.com/property'),detail:'Preferred source · Search Google for Homes.com property pages.'},
    {id:'redfin',name:'Redfin',url:google('redfin.com'),detail:'Search Google for Redfin property pages.'},
    {id:'realtor',name:'Realtor.com',url:google('realtor.com/realestateandhomes-detail'),direct:realtor,detail:'Search Google for property pages from Realtor.com.'},
  ].map(s=>({...s,query}));
}
export function listingURL(input) {
  try {
    const u=new URL(input.trim());
    if(u.protocol!=='https:' || u.username || u.password) return null;
    const domains=['realtor.com','redfin.com','homes.com'];
    const domain=domains.find(d=>u.hostname===d || u.hostname.endsWith('.'+d));
    if(!domain || u.port || u.pathname==='/' || /\/realestateandhomes-search\//.test(u.pathname)) return null;
    if(domain==='realtor.com' && !u.pathname.startsWith('/realestateandhomes-detail/')) return null;
    if(domain==='redfin.com' && !/\/home\/\d+\/?$/.test(u.pathname)) return null;
    if(domain==='homes.com' && !u.pathname.startsWith('/property/')) return null;
    // Keep source queries that can identify a listing; discard tracking and fragments.
    for(const k of [...u.searchParams.keys()]) if(/^utm_|^(fbclid|gclid)$/i.test(k))u.searchParams.delete(k);
    u.hash='';u.hostname='www.'+domain;u.pathname=u.pathname.replace(/\/$/,'');
    return {url:u.href,source:domain};
  } catch { return null; }
}
export function readSaved(storage) {
  const rows=JSON.parse(storage || '[]');
  if(!Array.isArray(rows)) throw Error('Invalid saved links');
  const unique=new Map();
  for(const row of rows) {
    if(!row || typeof row!=='object') continue;
    const valid=typeof row.url==='string' && listingURL(row.url);
    if(!valid || typeof row.saved_at!=='string' || !Number.isFinite(Date.parse(row.saved_at)) || !markets[row.market]) continue;
    unique.set(valid.url,{...valid,title:String(row.title || 'Saved property').slice(0,160),note:String(row.note || '').slice(0,1000),market:row.market,saved_at:new Date(row.saved_at).toISOString()});
  }
  if(unique.size>500)throw Error('capacity');
  return [...unique.values()];
}
