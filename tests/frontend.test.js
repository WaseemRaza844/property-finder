import test from 'node:test';
import assert from 'node:assert/strict';
import {filterListings,miles,safeURL} from '../web/filters.js';
import {buildSearches,listingURL,readSaved} from '../web/search.js';
import {selectDiscoveries,groupDiscoveries,uniqueProperties,topPicks,propertyIdentity,scopedDiscoveries,isNewDiscovery} from '../web/discovery-view.js';
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
test('catalog includes upstate New York and dedicated college-town choices',()=>{
 assert.equal(Object.keys(markets).length,169);assert.equal(new Set(Object.values(markets).map(m=>m.region)).size,14);
 assert.equal(markets.buffalo.region,'Upstate & Western New York');
 assert.equal(markets['college-ithaca'].region,'College Towns');
 assert.match(markets['college-ithaca'].university,/Cornell/);
 assert.equal(Object.values(markets).filter(m=>m.region==='College Towns').length,88);
 assert.match(markets['college-bethlehem'].university,/Lehigh/);
 assert.equal(markets['south-jersey-camden'].region,'Southern New Jersey');
 assert.equal(markets['delaware-wilmington'].region,'Delaware');
 assert.equal(markets['maryland-harford'].region,'Maryland');
 assert.equal(markets['georgia-atlanta'].region,'Georgia');
 assert.equal(markets['south-carolina-upstate'].region,'South Carolina');
 assert.equal(markets['central-pa-harrisburg'].region,'Central Pennsylvania');
 assert.match(markets['college-college-station'].university,/Texas A&M/);
 assert.match(markets['college-norman'].university,/University of Oklahoma/);
 assert.match(markets['college-tempe'].university,/Arizona State/);
 assert.match(markets['college-columbia-mo'].university,/Missouri/);
 assert.match(markets['college-lincoln-ne'].university,/Nebraska/);
 assert.match(markets['college-charlottesville'].university,/Virginia/);
 assert.equal(Object.values(markets).filter(m=>m.region==='Move-in Ready Under $100K').length,33);
 assert.equal(markets['affordable-canton'].scope,'affordable');
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
 const reviewable=uniqueProperties([{...red,listing_status:'unknown'},{...homes,listing_status:'sold',observed_this_run:false}],discoveryNow);
 assert.equal(reviewable[0].source,'redfin.com');assert.equal(reviewable[0].alternates[0].status,'sold');
 assert.equal(uniqueProperties([red,homes],discoveryNow,'redfin.com')[0].source,'redfin.com');
 assert.equal(uniqueProperties([red,{...homes,source:'realtor.com'}],discoveryNow)[0].source,'realtor.com');
});
test('region filters follow market catalog and regional grouping remains available',()=>{
 const ohio={...fact,url:'oh',markets:['cleveland'],source:'homes.com'};
 const pa={...fact,url:'pa',source:'redfin.com'};
 const found=selectDiscoveries([ohio,pa],{region:'Ohio',status:'active',price:''},discoveryNow);
 assert.deepEqual(found.map(r=>r.url),['oh']);assert.equal(groupDiscoveries(found,'region')[0].name,'Ohio');
});
test('top picks elevate recent indexed multifamily listings, not perpetually lowest prices',()=>{
 const input=[2,3,8,10,1].map((units,i)=>({...fact,title:`${i+1} Main St, Easton, PA 18042`,url:String(i),source:'homes.com',units,price:(i+1)*100000}));
 input.push({...fact,title:'99 Main St, Easton, PA 18042',url:'sold',source:'homes.com',price:1,units:99,listing_status:'sold'});
 input.push({...fact,title:'98 Main St, Easton, PA 18042',url:'stale',source:'homes.com',price:1,units:98,facts_observed_at:'2026-10-01'});
 const picks=topPicks(input,{},discoveryNow);assert.deepEqual(picks.map(r=>r.url),['0','1','2','3']);assert.equal(new Set(picks.map(r=>r.url)).size,4);assert.equal(picks[2].pick_reason,'New discovery');
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
 assert.equal(selectDiscoveries([{...row,observed_this_run:false,not_searched_this_run:true}],f,now).length,1);
 assert.equal(selectDiscoveries([{...row,observed_this_run:false,not_searched_this_run:true,facts_observed_at:'2026-10-20T00:00:00Z'}],f,now).length,0);
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

test('saved for-sale observations remain visible after 36 hours, but are not called fresh',()=>{
 const old={...fact,source:'homes.com',url:'https://www.homes.com/property/test/abc',facts_observed_at:'2026-10-20T10:00:00Z'};
 assert.equal(selectDiscoveries([old],{status:'active'},discoveryNow).length,0);
 assert.equal(selectDiscoveries([old],{status:'latest'},discoveryNow).length,1);
 assert.equal(selectDiscoveries([{...old,listing_status:'sold'}],{status:'latest'},discoveryNow).length,0);
 assert.equal(topPicks([old],{status:'latest'},discoveryNow).length,1);
});

test('regional and college workspaces never mix listings or top picks',()=>{
 const common={...fact,price:225000,units:2,listing_status:'active'};
 const regional={...common,url:'https://www.redfin.com/PA/Easton/example/home/444',markets:['easton'],title:'55 Regional St, Easton, PA 18042'};
 const college={...common,url:'https://www.homes.com/property/ithaca/test',markets:['college-ithaca'],title:'22 Campus St, Ithaca, NY 14850',town:'Ithaca',state:'NY',zip:'14850'};
 assert.deepEqual(scopedDiscoveries([regional,college],'regional').map(x=>x.url),[regional.url]);
 assert.deepEqual(scopedDiscoveries([regional,college],'college').map(x=>x.url),[college.url]);
 assert.deepEqual(selectDiscoveries([regional,college],{scope:'regional',status:'latest'}).map(x=>x.url),[regional.url]);
 assert.deepEqual(selectDiscoveries([regional,college],{scope:'college',status:'latest'}).map(x=>x.url),[college.url]);
 assert.deepEqual(topPicks([regional,college],{scope:'regional',status:'latest'},discoveryNow).map(x=>x.url),[regional.url]);
 assert.deepEqual(topPicks([regional,college],{scope:'college',status:'latest'},discoveryNow).map(x=>x.url),[college.url]);
 assert.equal(selectDiscoveries([regional,college],{scope:'college',collegeState:'New York',status:'latest'}).length,1);
 assert.equal(selectDiscoveries([regional,college],{scope:'college',collegeState:'Ohio',status:'latest'}).length,0);
});

test('new-first picks do not label rediscovered old links as new MLS listings',()=>{
 const older={...fact,source:'homes.com',url:'https://www.homes.com/property/older/aaa',title:'1 Older St, Easton, PA 18042',first_seen:'2026-10-01T08:00:00Z',last_seen:'2026-10-25T11:00:00Z',price:100000};
 const today={...fact,source:'homes.com',url:'https://www.homes.com/property/new/bbb',title:'3 Newer St, Easton, PA 18042',first_seen:'2026-10-25T10:00:00Z',price:450000};
 assert.equal(isNewDiscovery(older,discoveryNow),false);
 assert.equal(isNewDiscovery(today,discoveryNow),true);
 assert.deepEqual(topPicks([older,today],{status:'latest'},discoveryNow).map(x=>x.url),[today.url,older.url]);
 assert.equal(topPicks([older,today],{status:'latest'},discoveryNow)[0].pick_reason,'New discovery');
 assert.deepEqual(selectDiscoveries([older,today],{status:'latest',sort:'newest'},discoveryNow).map(x=>x.url),[today.url,older.url]);
 assert.deepEqual(selectDiscoveries([older,today],{status:'latest',sort:'price'},discoveryNow).map(x=>x.url),[older.url,today.url]);
});

test('same property from a newly discovered source retains original first-seen date',()=>{
 const earlier={...fact,source:'redfin.com',url:'https://www.redfin.com/PA/example/home/202',first_seen:'2026-10-01T12:00:00Z'};
 const later={...fact,source:'homes.com',url:'https://www.homes.com/property/new-source/abc',first_seen:'2026-10-25T10:00:00Z'};
 const matches=uniqueProperties([earlier,later],discoveryNow);
 assert.equal(matches.length,1);
 assert.equal(matches[0].source,'homes.com');
 assert.equal(matches[0].first_seen,earlier.first_seen);
 assert.equal(isNewDiscovery(matches[0],discoveryNow),false);
});

test('affordable workspace isolates verified 2+ bed sub-100k houses',()=>{
 const common={...fact,source:'homes.com',listing_status:'active',price:89000,beds:3,units:1,
   property_type:'single-family',condition_evidence:'move-in ready',markets:['affordable-canton']};
 const home={...common,url:'https://www.homes.com/property/canton/a',title:'12 Bright St, Canton, OH 44702'};
 const expensive={...home,url:'https://www.homes.com/property/canton/b',title:'14 Bright St, Canton, OH 44702',price:101000};
 const oneBed={...home,url:'https://www.homes.com/property/canton/c',title:'16 Bright St, Canton, OH 44702',beds:1};
 const unknown={...home,url:'https://www.homes.com/property/canton/d',title:'18 Bright St, Canton, OH 44702',condition_evidence:null};
 const multifamily={...home,url:'https://www.homes.com/property/canton/e',title:'20 Bright St, Canton, OH 44702',property_type:'duplex'};
 const closed={...home,url:'https://www.homes.com/property/canton/f',title:'22 Bright St, Canton, OH 44702',listing_status:'sold'};
 const rows=[home,expensive,oneBed,unknown,multifamily,closed];
 const selected=selectDiscoveries(rows,{scope:'affordable',status:'latest',sort:'newest'},discoveryNow);
 assert.deepEqual(selected.map(r=>r.url),[home.url]);
 assert.equal(scopedDiscoveries(rows,'regional').length,0);
 assert.equal(scopedDiscoveries(rows,'college').length,0);
 assert.deepEqual(selectDiscoveries(rows,{scope:'affordable',status:'latest',affordableUnverified:true},discoveryNow).map(r=>r.url).sort(),[home.url,unknown.url].sort());
 assert.deepEqual(topPicks(rows,{scope:'affordable',status:'latest'},discoveryNow).map(r=>r.url),[home.url]);
 assert.deepEqual(selectDiscoveries(rows,{scope:'affordable',status:'latest',affordableState:'OH'},discoveryNow).map(r=>r.url),[home.url]);
 assert.equal(selectDiscoveries(rows,{scope:'affordable',status:'latest',affordableState:'PA'},discoveryNow).length,0);
});
