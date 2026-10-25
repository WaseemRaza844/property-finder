"""Build a dependency-free Pages artifact, excluding imports and backend files."""
import json
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[1]
data = root / 'web/data/listings.json'
assert isinstance(json.loads(data.read_text(encoding='utf-8'))['listings'], list)
shutil.copytree(root / 'web', root / 'dist', dirs_exist_ok=True)
(root / 'dist/.nojekyll').touch()
print('Static build ready in dist/')
