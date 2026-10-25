"""Adapters only read explicitly authorized local JSON exports.

No network requests, cookies, bypasses, or scraping adapters are included.
"""
import json
from pathlib import Path


def ingest(source, root):
    if not source.get('authorization'):
        raise ValueError('Public redistribution authorization is required')
    if source.get('adapter') != 'json_file':
        raise ValueError('Unsupported adapter')
    root = Path(root).resolve()
    path = (root / source['path']).resolve()
    if not path.is_relative_to(root / 'imports'):
        raise ValueError('Imports must stay inside imports/')
    rows = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(rows, list):
        raise ValueError('Expected a JSON array')
    return rows
