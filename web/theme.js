import { markets } from './markets.js';

const KEY = 'property-finder.theme.v1';
const allowed = new Set(['clear', 'ocean', 'forest', 'dark']);
const select = document.getElementById('theme-select');
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
document.getElementById('browse-college').addEventListener('click', () => {
  const region = document.getElementById('discovery-region');
  region.value = 'College Towns';
  region.dispatchEvent(new Event('change', { bubbles: true }));
  document.getElementById('automatic-workspace').scrollIntoView({ behavior: 'smooth' });
});
