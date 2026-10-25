import test from 'node:test';
import assert from 'node:assert/strict';
import {filterListings,miles,safeURL} from '../web/filters.js';
import {buildSearches,listingURL,readSaved} from '../web/search.js';
import {selectDiscoveries,groupDiscoveries,uniqueProperties,topPicks,propertyIdentity} from '../web/discovery-view.js';
import {markets} from '../web/markets.js';
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
  assert.equal(links[0].id,'homes');
  assert.equal(links.find(s=>s.id==='realtor').direct,'https://www.realtor.com/realestateandhomes-search/Easton_PA/type-multi-family-home/price-na-500000');
  assert.throws(()=>buildSearches({market:'unknown'}));assert.throws(()=>buildSearches({price:'NaN'}));
});
test('catalog supports twelve markets across five regions and every guided search',()=>{
 assert.equal(Object.keys(markets).length,12);assert.equal(new Set(Object.values(markets).map(m=>m.region)).size,5);
 for(const market of Object.keys(markets))assert.equal(buildSearches({market})[0].id,'homes');
});
const discoveryNow=Date.parse('2026-10-25T12:00:00Z');
const fact={title:'123 Main Street, Easton, PA 18042',town:'Easton',state:'PA',zip:'18042',markets:['easton'],listing_status:'active',observed_this_run:true,facts_observed_at:'2026-10-25T12:00:00Z',first_seen:'2026-10-25',last_seen:'2026-10-25',units:2,price:200000,beds:4,sqft:2000};
test('exact cross-source addresses prefer active Homes.com without blending facts or apartments',()=>{
 const red={...fact,url:'https://www.redfin.com/PA/example/home/1',source:'redfin.com'};
 const homes={...fact,title:'123 Main St, Easton, PA 18042',url:'https://www.homes.com/property/example/abc',source:'homes.com',price:210000,beds:null};
 const unit={...homes,title:'123 Main St Unit 2, Easton, PA 18042',url:homes.url+'2'};
 const grouped=uniqueProperties([red,homes,unit],discoveryNow);assert.equal(grouped.length,2);assert.equal(grouped[0].source,'homes.com');assert.equal(grouped[0].price,210000);assert.equal(grouped[0].beds,null);assert.equal(grouped[0].alternates.length,1);
 assert.notEqual(propertyIdentity(unit),propertyIdentity(homes));
 assert.notEqual(propertyIdentity({...homes,title:'123 Main St, Unit 2, Easton, PA 18042',url:'unit2'}),propertyIdentity(homes));
 assert.equal(uniqueProperties([red,{...homes,listing_status:'unknown'}],discoveryNow)[0].source,'redfin.com');
 assert.equal(uniqueProperties([red,{...homes,listing_status:'sold'}],discoveryNow).length,0);
 assert.equal(uniqueProperties([red,homes],discoveryNow,'redfin.com')[0].source,'redfin.com');
});
test('region filters follow market catalog and regional grouping remains available',()=>{
 const ohio={...fact,url:'oh',markets:['cleveland'],source:'homes.com'};
 const pa={...fact,url:'pa',source:'redfin.com'};
 const found=selectDiscoveries([ohio,pa],{region:'Ohio',status:'active',price:''},discoveryNow);
 assert.deepEqual(found.map(r=>r.url),['oh']);assert.equal(groupDiscoveries(found,'region')[0].name,'Ohio');
});
test('top picks select two cheapest and two other highest-unit multifamily properties only',()=>{
 const input=[2,3,8,10,1].map((units,i)=>({...fact,title:`${i+1} Main St, Easton, PA 18042`,url:String(i),source:'homes.com',units,price:(i+1)*100000}));
 input.push({...fact,title:'99 Main St, Easton, PA 18042',url:'sold',source:'homes.com',price:1,units:99,listing_status:'sold'});
 input.push({...fact,title:'98 Main St, Easton, PA 18042',url:'stale',source:'homes.com',price:1,units:98,facts_observed_at:'2026-10-01'});
 const picks=topPicks(input,{},discoveryNow);assert.deepEqual(picks.map(r=>r.url),['0','1','3','2']);assert.equal(new Set(picks.map(r=>r.url)).size,4);assert.equal(picks[2].pick_reason,'Most units · 1');
 assert.deepEqual(topPicks(input,{region:'Ohio'},discoveryNow),[]);
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
  assert.equal(readSaved(JSON.stringify([{...r,saved_at:2026}])).length,0);
  const many=Array.from({length:501},(_,i)=>({...r,url:`https://www.redfin.com/PA/test/home/${i}`}));
  assert.throws(()=>readSaved(JSON.stringify(many)),/capacity/);
  assert.equal(readSaved(JSON.stringify(many.slice(0,500))).length,500);
});
test('discovery defaults hide closed, unknown, stale, and unobserved results',()=>{
 const now=Date.parse('2026-10-25T12:00:00Z'),row={url:'https://www.redfin.com/PA/Easton/1/home/1',title:'Duplex',markets:['easton'],first_seen:'2026-10-25T10:00:00Z',facts_observed_at:'2026-10-25T11:00:00Z',listing_status:'active',observed_this_run:true,price:400000,town:'Easton',state:'PA',zip:'18042'};
 const f={status:'active',price:'',sort:'price'};
 assert.equal(selectDiscoveries([row,{...row,url:row.url+'2',listing_status:'sold'},{...row,url:row.url+'3',listing_status:'unknown'},{...row,url:row.url+'4',observed_this_run:false},{...row,url:row.url+'5',facts_observed_at:'2026-10-20T00:00:00Z'}],f,now).length,1);
 assert.equal(selectDiscoveries([{...row,url:row.url+'2',listing_status:'sold'},{...row,url:row.url+'3',listing_status:'unknown'}],{...f,status:'review'},now).length,1);
 assert.equal(selectDiscoveries([row],{...f,zip:'99999'},now).length,0);
});
test('numeric discovery sort places unknowns last and groups number consecutively',()=>{
 const row={title:'Test',markets:['easton'],first_seen:'2026-10-25',town:'Easton',state:'PA',zip:'18042'};
 const rows=[{...row,url:'a',price:null},{...row,url:'b',price:500000},{...row,url:'c',price:300000,town:'Bethlehem',zip:'18018'}];
 const sorted=selectDiscoveries(rows,{status:'review',price:'',sort:'price_desc'});
 assert.deepEqual(sorted.map(r=>r.url),['b','c','a']);
 const groups=groupDiscoveries(sorted,'town');assert.deepEqual(groups.flatMap(g=>g.items.map(r=>r.number)),[1,2,3]);
 assert.equal(groupDiscoveries(sorted,'zip').length,2);
 assert.equal(selectDiscoveries(rows,{status:'review',price:'400000'}).length,1);
});
