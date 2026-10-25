import {markets} from './markets.js';
export const regions=[...new Set(Object.values(markets).map(m=>m.region))];
export function populateMarkets(select,region='',allLabel=''){
 const previous=select.value;select.replaceChildren();
 if(allLabel)select.add(new Option(allLabel,''));
 for(const name of regions){if(region&&name!==region)continue;const group=document.createElement('optgroup');group.label=name;
  for(const [id,m] of Object.entries(markets))if(m.region===name)group.append(new Option(m.name,id));select.append(group);
 }
 if([...select.options].some(o=>o.value===previous))select.value=previous;
}
for(const id of ['discovery-region','search-region']){const select=document.getElementById(id);for(const r of regions)select.add(new Option(r,r));}
populateMarkets(document.getElementById('discovery-market'),'','All markets');
for(const id of ['search-market','save-market'])populateMarkets(document.getElementById(id));
populateMarkets(document.getElementById('saved-market'),'','All saved markets');
