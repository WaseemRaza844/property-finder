import {markets,buildSearches,listingURL,readSaved} from './search.js';
import {populateMarkets} from './market-controls.js';
const $=id=>document.getElementById(id);
const element=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const KEY='property-finder.saved-links.v1', SETTINGS='property-finder.search.v1';
let saved=[], storageAvailable=true, undo=null;
document.getElementById('search-region').onchange=()=>{populateMarkets($('search-market'),$('search-region').value);build();};
function message(text){$('save-feedback').textContent=text;}
try {saved=readSaved(localStorage.getItem(KEY));} catch {storageAvailable=false;message('Browser storage could not be read. Saved links will last only for this visit; export a backup before leaving.');}
try {const settings=JSON.parse(localStorage.getItem(SETTINGS)||'null');if(settings && markets[settings.market]){ $('search-market').value=settings.market;if(['multifamily','duplex','triplex','fourplex','all'].includes(settings.type))$('search-type').value=settings.type;$('search-price').value=settings.price||'';$('search-nearby').checked=Boolean(settings.nearby);$('search-keywords').value=String(settings.keywords||'').slice(0,160);}}catch{/* Defaults remain usable if preferences are unavailable. */}
function settings(){return {market:$('search-market').value,type:$('search-type').value,price:$('search-price').value,nearby:$('search-nearby').checked,keywords:$('search-keywords').value};}
function link(text,url,cls){const a=element('a',text,cls);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function build(){
  try{
    const s=settings(), searches=buildSearches(s);
    $('search-links').replaceChildren(...searches.map(source=>{const card=element('article',null,'search-card');card.append(element('span','READY TO OPEN','eyebrow'),element('h3',source.name),element('p',source.detail),link(`Search ${source.name} ↗`,source.url,'button secondary'));if(source.direct)card.append(link('Or browse Realtor.com directly ↗',source.direct,'direct-link'));return card;}));
    $('query-preview').textContent=searches[0].query;
    $('save-market').value=s.market;
    $('search-feedback').textContent=`Search links prepared for ${markets[s.market].name}. Open a source below; results appear in a new tab.`;
    $('nearby-towns').textContent=s.nearby ? 'Nearby towns included: '+markets[s.market].nearby.join(' · ')+'. This is a town list, not an exact radius.' : 'Searching the selected city. Enable nearby towns to broaden the query.';
    try{localStorage.setItem(SETTINGS,JSON.stringify(s));}catch{/* Search links still work without storage. */}
  }catch(e){$('search-feedback').textContent=e.message;}
}
function persist(){
  try{if(!storageAvailable)throw Error();localStorage.setItem(KEY,JSON.stringify(saved));return true;}catch{storageAvailable=false;message('Saved for this visit only: browser storage is unavailable. Export your links before leaving.');return false;}
}
async function updateSaved(update, success){
  const transaction=()=>{
    try{
      // Re-read within the cross-tab lock so another tab's newer links survive.
      const latest=storageAvailable ? readSaved(localStorage.getItem(KEY)) : saved;
      const next=update(latest);
      saved=readSaved(JSON.stringify(next));
      const durable=persist();render();if(durable)message(typeof success==='function'?success():success);
    }catch(error){message(error.message==='capacity'?'This operation would exceed 500 saved links. Export a backup and make room first; no links were imported.':'Could not update saved links. Reload the page and try again.');}
  };
  if(navigator.locks)await navigator.locks.request(KEY,transaction);else transaction();
}
window.addEventListener('storage',e=>{
  if(e.key!==KEY && e.key!==null)return;
  try{saved=readSaved(e.newValue);render();message('Shortlist updated from another tab.');}catch{message('Could not read a shortlist update from another tab. Export your current links before reloading.');}
});
function render(){
  const selected=$('saved-market').value;
  const rows=saved.filter(r=>!selected || r.market===selected).sort((a,b)=>b.saved_at.localeCompare(a.saved_at));
  $('saved-count').textContent=saved.length;$('saved-empty').hidden=rows.length>0;
  $('saved-empty').replaceChildren(element('h3',saved.length ? 'No saved links for this market.' : 'Your shortlist is ready for its first link.'),element('p',saved.length ? 'Choose another saved market, or save a property link below your search.' : 'Open a search above, copy a property’s page link, then save it here.'));
  $('saved-links').replaceChildren(...rows.map(row=>{const card=element('article',null,'saved-card');const title=element('h3');title.append(link(row.title+' ↗',row.url));card.append(element('span',row.source,'status'),title,element('p',`${markets[row.market].name} · Saved ${new Date(row.saved_at).toLocaleDateString()}`,'muted'),element('p',row.note||'No notes added.'),element('p','User-saved link · price and availability unverified','muted'));const remove=element('button','Remove','reset');remove.type='button';remove.setAttribute('aria-label','Remove '+row.title);remove.onclick=async()=>{await updateSaved(latest=>{undo=latest.find(r=>r.url===row.url)||row;return latest.filter(r=>r.url!==row.url);},'Link removed. Use Undo to restore it.');$('undo-save').hidden=false;};card.append(remove);return card;}));
  $('export-links').disabled=!saved.length;
}
$('search-form').addEventListener('submit',e=>{e.preventDefault();build();});
$('search-form').addEventListener('reset',()=>setTimeout(()=>{populateMarkets($('search-market'));$('search-market').value='bedminster';build();},0));
$('save-link-form').addEventListener('submit',async e=>{
  e.preventDefault();const valid=listingURL($('listing-url').value);
  if(!valid){message('Use an HTTPS property link from Realtor.com, Redfin, or Homes.com. Search pages and other domains are not supported.');return;}
  const title=$('listing-title').value.trim()||'Saved property';
  const row={...valid,title,note:$('listing-note').value.trim(),market:$('save-market').value,saved_at:new Date().toISOString()};
  await updateSaved(latest=>{
    if(latest.some(r=>r.url===row.url)){message('That link is already saved.');return latest;}
    return [row,...latest];
  },()=>saved.some(r=>r.url===row.url && r.saved_at===row.saved_at)?'Listing link saved in this browser.':'That link is already saved.');
  $('save-link-form').reset();$('save-market').value=settings().market;
});
$('saved-market').addEventListener('change',render);
$('undo-save').onclick=async()=>{const row=undo;if(row)await updateSaved(latest=>latest.some(r=>r.url===row.url)?latest:[row,...latest],'Link restored.');undo=null;$('undo-save').hidden=true;};
$('export-links').onclick=()=>{const blob=new Blob([JSON.stringify(saved,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=element('a');a.href=url;a.download='property-finder-saved-links.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import-links').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2000000)throw Error();const imported=readSaved(await file.text());if(!imported.length)throw Error();await updateSaved(latest=>[...latest,...imported],()=>`Backup restored; ${saved.length} links in your watchlist.`);}catch(error){message(error.message==='capacity'?'Backup exceeds the 500-link capacity. No links were imported.':'Could not restore that file. Choose a Property Finder JSON backup under 2 MB.');}e.target.value='';});
build();render();
