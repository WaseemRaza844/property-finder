import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from .sources import ingest
from .normalize import normalize
from .history import merge_history


def refresh(root, now=None):
    root = Path(root)
    now = now or datetime.now(timezone.utc)
    output = root / 'web/data/listings.json'
    previous = json.loads(output.read_text(encoding='utf-8')) if output.exists() else {}
    incoming, statuses = [], []
    for source in json.loads((root / 'config/sources.json').read_text(encoding='utf-8')):
        status = {'id': source['id'], 'name': source['name'], 'status': 'not_connected', 'count': 0, 'note': source.get('note', '')}
        if source.get('enabled'):
            try:
                rows = ingest(source, root)
                # Atomic source batch: invalid exports never appear partly healthy.
                batch = [normalize(row, source) for row in rows]
                incoming.extend(batch)
                status.update(status='ok', count=len(batch), note='Import checked; no records supplied' if not batch else 'Authorized export imported')
            except (ValueError, OSError, KeyError, TypeError) as error:
                status.update(status='error', note='Import failed validation; inspect the authorized export')
        statuses.append(status)
    data = {'generated_at': now.isoformat(), 'retention_days': 4, 'sources': statuses,
            'listings': merge_history(previous.get('listings', []), incoming, now)}
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
    temporary.replace(output)
    return data


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', default='.')
    args = parser.parse_args()
    report = refresh(args.root)
    print(f"Published {len(report['listings'])} retained listings; source status included.")
    errors = sum(s['status'] == 'error' for s in report['sources'])
    summary = f"Refresh completed: {len(report['listings'])} retained properties, {errors} source errors. See the published source status."
    print(summary)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as stream:
            stream.write(summary + '\n')
