import test from 'node:test';
import assert from 'node:assert/strict';
import {filterListings,miles,safeURL} from '../web/filters.js';
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
