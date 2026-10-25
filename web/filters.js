export function miles(a, b) {
  const rad = n => n * Math.PI / 180;
  const dlat = rad(b[0] - a[0]), dlon = rad(b[1] - a[1]);
  const h = Math.sin(dlat/2)**2 + Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dlon/2)**2;
  return 3958.7613 * 2 * Math.asin(Math.sqrt(Math.min(1,h)));
}
export function filterListings(rows, f) {
  return rows.filter(r => (!f.market || r.market === f.market)
    && (!f.type || (f.type === 'multifamily' ? ['duplex','triplex','fourplex','multifamily'].includes(r.property_type) : r.property_type === f.type))
    && (f.price === '' || (r.price != null && r.price <= Number(f.price)))
    && (!f.radius || (r.latitude != null && r.longitude != null && miles(f.center,[r.latitude,r.longitude]) <= Number(f.radius))))
    .sort((a,b) => f.sort === 'price' ? (a.price ?? Infinity) - (b.price ?? Infinity) : b.first_seen.localeCompare(a.first_seen));
}
export function safeURL(value) {
  try {const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;} catch {return null;}
}
