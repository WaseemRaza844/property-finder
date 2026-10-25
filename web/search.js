// Search links are ordinary user-opened URLs. No portal or search engine is scraped.
export const markets = {
  bedminster: {name:'Bedminster, NJ', slug:'Bedminster_NJ', nearby:['Somerville NJ','Bridgewater NJ','Bernardsville NJ','Raritan NJ']},
  easton: {name:'Easton, PA', slug:'Easton_PA', nearby:['Palmer Township PA','Wilson PA','Forks Township PA','Phillipsburg NJ']},
  bethlehem: {name:'Bethlehem, PA', slug:'Bethlehem_PA', nearby:['Allentown PA','Fountain Hill PA','Freemansburg PA','Hellertown PA']},
};
const typeTerms = {multifamily:'("multi family" OR multifamily OR duplex OR triplex)',duplex:'duplex',triplex:'triplex',fourplex:'(fourplex OR "4 unit" OR "four unit")',all:'homes'};
export function buildSearches({market='bedminster',type='multifamily',price='',nearby=false,keywords=''}) {
  const place=markets[market]; if(!place || !typeTerms[type]) throw Error('Choose a supported market and property type');
  if(price !== '' && (!Number.isFinite(Number(price)) || Number(price)<=0)) throw Error('Enter a positive maximum price');
  const location=nearby ? `("${place.name}" OR ${place.nearby.map(t=>`"${t}"`).join(' OR ')})` : `"${place.name}"`;
  const query=`${location} ${typeTerms[type]} for sale${price ? ` under $${Number(price).toLocaleString('en-US')}`:''}${keywords.trim() ? ` ${keywords.trim().slice(0,160)}`:''}`;
  const google=domain=>'https://www.google.com/search?'+new URLSearchParams({q:`site:${domain} ${query}`});
  let realtor=`https://www.realtor.com/realestateandhomes-search/${place.slug}`;
  if(type!=='all') realtor+='/type-multi-family-home';
  if(price) realtor+=`/price-na-${Number(price)}`;
  return [
    {id:'realtor',name:'Realtor.com',url:google('realtor.com/realestateandhomes-detail'),direct:realtor,detail:'Search Google for property pages from Realtor.com.'},
    {id:'redfin',name:'Redfin',url:google('redfin.com'),detail:'Search Google for Redfin property pages.'},
    {id:'homes',name:'Homes.com',url:google('homes.com/property'),detail:'Search Google for property pages from Homes.com.'},
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
    if(!valid || !Number.isFinite(Date.parse(row.saved_at)) || !markets[row.market]) continue;
    unique.set(valid.url,{...valid,title:String(row.title || 'Saved property').slice(0,160),note:String(row.note || '').slice(0,1000),market:row.market,saved_at:row.saved_at});
  }
  return [...unique.values()].slice(0,500);
}
