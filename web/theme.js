import { markets } from './markets.js';

const KEY = 'property-finder.theme.v1';
const allowed = new Set(['clear', 'ocean', 'forest', 'dark']);
const select = document.getElementById('theme-select');
const fontSelect = document.getElementById('font-select');
const FONT_KEY = 'property-finder.font-size.v1';
const fontSizes = new Set(['normal','large','extra']);
let saved = 'clear';
try { saved = localStorage.getItem(KEY) || 'clear'; } catch { /* Storage may be unavailable. */ }
function applyTheme(theme) {
  const chosen = allowed.has(theme) ? theme : 'clear';
  document.documentElement.dataset.theme = chosen;
  select.value = chosen;
  try { localStorage.setItem(KEY, chosen); } catch { /* Theme works for this visit. */ }
}
applyTheme(saved);
select.addEventListener('change', () => applyTheme(select.value));
document.getElementById('market-total').textContent = Object.keys(markets).length;
document.getElementById('region-total').textContent = new Set(Object.values(markets).map(m => m.region)).size;


let currentFont = 'normal';
try { currentFont = localStorage.getItem(FONT_KEY) || 'normal'; } catch {}
function applyFont(value) {
  const next = fontSizes.has(value) ? value : 'normal';
  document.documentElement.dataset.fontSize = next;
  fontSelect.value = next;
  try { localStorage.setItem(FONT_KEY, next); } catch {}
}
applyFont(currentFont);
fontSelect.addEventListener('change', () => applyFont(fontSelect.value));


// Keep in-page anchor targets visible below the responsive sticky header.
const stickyHeader = document.getElementById('site-header');
if (stickyHeader) {
 const updateHeaderOffset = () => document.documentElement.style.setProperty(
   '--sticky-header-height', `${Math.ceil(stickyHeader.getBoundingClientRect().height + 14)}px`);
 updateHeaderOffset();
 if (typeof ResizeObserver !== 'undefined') new ResizeObserver(updateHeaderOffset).observe(stickyHeader);
 else window.addEventListener('resize', updateHeaderOffset);
}
