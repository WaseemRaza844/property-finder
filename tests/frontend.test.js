import test from 'node:test';
import assert from 'node:assert/strict';
import {filterListings,miles,safeURL} from '../web/filters.js';
import {buildSearches,listingURL,readSaved} from '../web/search.js';
const rows=[
  {id:'a',market:'Central New Jersey',property_type:'duplex',price:400000,latitude:40.6807,longitude:-74.649,first_seen:'2026-10-25'},
  {id:'b',market:'Central Ohio',property_type:'triplex',price:200000,latitude:39.9612,longitude:-82.9988,first_seen:'2026-10-24'},
  {id:'c',market:'Central New Jersey',property_type:'single-family',price:null,latitude:null,longitude:null,first_seen:'2026-10-23'}
];
const base={market:'',type:'',price:'',radius:'',sort:'newest',center:[40.6807,-74.649]};
test('market, type, price and radius combine',()=>{
  assert.deepEqual(filterListings(rows,{...base,market:'Central New Jersey',type:'multifamily',price:'450000',radius:'20'}).map(r=>r.id),['a']);
  assert.equal(filterListings(rows,{...base,price:'300000'}).length,1);
  assert.equal(filterListings(rows,{...base,radius:'20'}).length,1);
  assert.equal(filterListings(rows,{...base,type:'triplex'})[0].id,'b');
});
test('sort puts unknown prices last and leaves input untouched',()=>{
  assert.deepEqual(filterListings(rows,{...base,sort:'price'}).map(r=>r.id),['b','a','c']);assert.equal(rows[0].id,'a');
});
test('distance and safe links',()=>{
  assert.equal(miles([40,-74],[40,-74]),0);assert.ok(miles([40,-74],[41,-74])>69);
  assert.equal(safeURL('javascript:alert(1)'),null);assert.equal(safeURL('https://user:password@example.com'),null);assert.equal(safeURL('https://example.com/'),'https://example.com/');
});
test('search queries encode shared criteria and nearby towns without claiming radius',()=>{
  const links=buildSearches({market:'easton',type:'duplex',price:'500000',nearby:true,keywords:'separate utilities & parking'});
  assert.equal(links.length,3);
  for(const link of links){const u=new URL(link.url);assert.equal(u.hostname,'www.google.com');const q=u.searchParams.get('q');assert.match(q,/Easton, PA/);assert.match(q,/Phillipsburg NJ/);assert.match(q,/duplex/);assert.match(q,/under \$500,000/);assert.match(q,/separate utilities & parking/);}
  assert.equal(links[0].direct,'https://www.realtor.com/realestateandhomes-search/Easton_PA/type-multi-family-home/price-na-500000');
  assert.throws(()=>buildSearches({market:'unknown'}));assert.throws(()=>buildSearches({price:'NaN'}));
});
test('saved links validate domains, remove tracking, and retain identifying queries',()=>{
  assert.equal(listingURL('https://redfin.com.evil.example/PA/home/1'),null);
  assert.equal(listingURL('https://user:pass@www.redfin.com/PA/home/1'),null);
  assert.equal(listingURL('javascript:alert(1)'),null);
  assert.equal(listingURL('https://www.realtor.com/realestateandhomes-search/Easton_PA'),null);
  assert.equal(listingURL('https://www.homes.com/property/test/?utm_source=google&id=1#info').url,'https://www.homes.com/property/test?id=1');
});
test('backup restoration rejects invalid data and deduplicates saved properties',()=>{
  const r={url:'https://www.redfin.com/PA/test/home/1',title:'Test property',market:'easton',saved_at:'2026-10-25T00:00:00Z'};
  assert.equal(readSaved(JSON.stringify([r,r,null,{...r,url:'https://evil.example/'}])).length,1);
  assert.equal(readSaved(JSON.stringify([{...r,market:'unsupported'}])).length,0);
  assert.throws(()=>readSaved('{}'));
});
