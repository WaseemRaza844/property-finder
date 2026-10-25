from datetime import datetime, timedelta


def merge_history(previous, incoming, now, days=4):
    """Retain four days since last observation. Missing never means sold."""
    combined = {}
    for row in incoming:
        key = row['id']
        if key in combined:
            target = combined[key]
            target['sources'] += [s for s in row['sources'] if s not in target['sources']]
            for field, value in row.items():
                if target.get(field) is None and value is not None:
                    target[field] = value
        else:
            combined[key] = dict(row)
    old = {r['id']: r for r in previous
           if datetime.fromisoformat(r['last_seen']) > now - timedelta(days=days)}
    result = []
    for key, row in combined.items():
        prior = old.get(key, {})
        row.update(first_seen=prior.get('first_seen', now.isoformat()), last_seen=now.isoformat(), observed_this_run=True)
        changes = list(prior.get('price_history', []))
        if not changes or changes[-1]['price'] != row['price']:
            changes.append({'at': now.isoformat(), 'price': row['price']})
        row['price_history'] = changes[-30:]
        result.append(row)
    for key, row in old.items():
        if key not in combined and datetime.fromisoformat(row['last_seen']) > now - timedelta(days=days):
            result.append(dict(row, observed_this_run=False))
    return sorted(result, key=lambda r: r['first_seen'], reverse=True)
