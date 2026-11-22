"""Build a versioned static site so GitHub Pages/browser caches cannot mix old JS modules."""
import hashlib
import json
import re
import shutil
from pathlib import Path
from sync_markets import sync

root = Path(__file__).resolve().parents[1]
sync(root)
data = root / "web/data/listings.json"
assert isinstance(json.loads(data.read_text(encoding="utf-8"))["listings"], list)

source = root / "web"
dist = root / "dist"
if dist.exists():
    shutil.rmtree(dist)
shutil.copytree(source, dist)
(dist / ".nojekyll").touch()

# One shared version across the entire module graph. Changing markets.js, CSS,
# any imported module, or HTML invalidates the entry script and its imports.
assets = sorted([*source.rglob("*.js"), *source.rglob("*.css"), source / "index.html"])
digest = hashlib.sha256()
for path in assets:
    digest.update(path.relative_to(source).as_posix().encode())
    digest.update(path.read_bytes())
version = digest.hexdigest()[:12]

# Only rewrite relative JavaScript module specifiers, never external links.
module_ref = re.compile(r'(?P<prefix>\\bfrom\\s*|\\bimport\\s*)(?P<quote>["\\\'])(?P<path>\\.?\\.?/[^"\\\']+\\.js)(?P=quote)')
for script in dist.rglob("*.js"):
    code = script.read_text(encoding="utf-8")
    code = module_ref.sub(lambda m: f'{m.group("prefix")}{m.group("quote")}{m.group("path")}?v={version}{m.group("quote")}', code)
    script.write_text(code, encoding="utf-8")

html = dist / "index.html"
page = html.read_text(encoding="utf-8")
page = page.replace('href="styles.css"', f'href="styles.css?v={version}"')
page = page.replace('src="app.js"', f'src="app.js?v={version}"')
page = page.replace('<html lang="en">', f'<html lang="en" data-build="{version}">')
html.write_text(page, encoding="utf-8")
print(f"Static build ready in dist/ (asset version {version})")
