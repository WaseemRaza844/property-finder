"""Tavily search discovery. Never fetches or scrapes property websites.

Only titles, canonical property URLs, query-market labels and observation dates
are stored. Snippets, images, answers, prices and raw page content are discarded.
"""
import argparse
import json
import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
from urllib.request import Request, build_opener, HTTPRedirectHandler

CAP = 400
DOMAINS = ('realtor.com', 'redfin.com', 'homes.com')


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, newurl):
        return None


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix('.tmp')
    tmp.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
    tmp.replace(path)


def property_url(value):
    if not isinstance(value, str):
        return None
    try:
        u = urlsplit(value.strip())
        if u.scheme != 'https' or u.username or u.password or u.port:
            return None
        domain = next((d for d in DOMAINS if u.hostname in (d, 'www.' + d)), None)
        patterns = {'realtor.com': r'^/realestateandhomes-detail/[^/]+/?$',
                    'redfin.com': r'^/.+/home/\d+/?$',
                    'homes.com': r'^/property/[^/]+/[^/]+/?$'}
        if not domain or not re.fullmatch(patterns[domain], u.path):
            return None
        query = [(k, v) for k, v in parse_qsl(u.query) if not re.match(r'utm_|^(gclid|fbclid)$', k, re.I)]
        return urlunsplit(('https', 'www.' + domain, u.path.rstrip('/'), urlencode(query), ''))
    except ValueError:
        return None


def queries(root):
    config = json.loads((root / 'config/searches.json').read_text(encoding='utf-8'))
    result = []
    for market in config['markets']:
        for domain in config['domains']:
            if domain not in DOMAINS:
                raise ValueError('Unsupported search domain')
            places = ' OR '.join('"' + t + '"' for t in market['towns'])
            result.append({'market': market['id'], 'domain': domain,
                           'query': f'({places}) (multifamily OR "multi family" OR duplex OR triplex OR fourplex) homes for sale'})
    if not 1 <= len(result) <= 9:
        raise ValueError('At most nine basic queries per run')
    return result


def reserve(root, run_id, now, has_key):
    """Called and committed to main BEFORE requests, including failed attempts."""
    path = root / '.state/search-budget.json'
    ledger = json.loads(path.read_text(encoding='utf-8'))
    month = now.strftime('%Y-%m')
    if ledger['month'] != month:
        ledger = {'month': month, 'reserved': 0, 'runs': []}
    count = len(queries(root))
    status = 'ready'
    if not has_key:
        status = 'not_configured'
    elif run_id in ledger['runs']:
        status = 'already_reserved'
    elif ledger['reserved'] + count > CAP:
        status = 'budget_exhausted'
    else:
        ledger['reserved'] += count
        ledger['runs'].append(run_id)
    write_json(path, ledger)
    plan = {'run_id': run_id, 'status': status, 'allowance': count if status == 'ready' else 0,
            'reserved': ledger['reserved'], 'monthly_limit': CAP}
    write_json(root / '.state/active-search.json', plan)
    return plan


def search(query, domain, key):
    request = Request('https://api.tavily.com/search', method='POST',
                      headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'},
                      data=json.dumps({'query': query, 'include_domains': [domain],
                                       'search_depth': 'basic', 'auto_parameters': False,
                                       'max_results': 10, 'include_answer': False,
                                       'include_raw_content': False, 'include_images': False}).encode())
    # No retries or redirects: one authorized endpoint, bounded credit use.
    with build_opener(NoRedirect).open(request, timeout=35) as response:
        data = json.loads(response.read(2000000))
    if not isinstance(data, dict) or not isinstance(data.get('results'), list):
        raise ValueError('Invalid search response')
    return data['results']


def refresh(root, run_id, now=None, key=None, requester=search):
    now = now or datetime.now(timezone.utc)
    output = root / 'web/data/discoveries.json'
    prior = json.loads(output.read_text(encoding='utf-8')) if output.exists() else {'results': []}
    plan = json.loads((root / '.state/active-search.json').read_text(encoding='utf-8'))
    if plan['run_id'] != run_id:
        raise ValueError('Reservation belongs to another run')
    tasks = queries(root)
    old = {r['url']: r for r in prior['results'] if datetime.fromisoformat(r['last_seen']) > now - timedelta(days=4)}
    seen, reports = {}, []
    if plan['status'] == 'ready' and not key:
        raise ValueError('Reserved search key is missing')
    if plan['allowance'] and plan['allowance'] != len(tasks):
        raise ValueError('Search configuration changed after reservation')
    if plan['status'] == 'ready':
        write_json(root / '.state/active-search.json', dict(plan, status='consumed', allowance=0))
        for task in tasks:
            report = {'market': task['market'], 'domain': task['domain'], 'status': 'ok', 'accepted': 0}
            try:
                rows = requester(task['query'], task['domain'], key)
                if not isinstance(rows, list):
                    raise ValueError('Invalid search result array')
                for row in rows[:10]:
                    if not isinstance(row, dict):
                        continue
                    url = property_url(row.get('url'))
                    # Validate provider domain restrictions locally as well.
                    if not url or urlsplit(url).hostname != 'www.' + task['domain']:
                        continue
                    if url not in seen:
                        seen[url] = {'url': url, 'source': task['domain'],
                                     'title': str(row.get('title') or 'Property page')[:200],
                                     'markets': [], 'first_seen': old.get(url, {}).get('first_seen', now.isoformat()),
                                     'last_seen': now.isoformat(), 'observed_this_run': True}
                    if task['market'] not in seen[url]['markets']:
                        seen[url]['markets'].append(task['market'])
                    report['accepted'] += 1
            except HTTPError as error:
                report.update(status='error', note=f'Search provider returned HTTP {error.code}; no retry attempted')
            except (URLError, TimeoutError, OSError, ValueError, TypeError):
                report.update(status='error', note='Search request failed; no retry attempted')
            reports.append(report)
    for url, row in old.items():
        if url not in seen:
            seen[url] = dict(row, observed_this_run=False)
    status = plan['status']
    if status == 'ready':
        errors = sum(r['status'] == 'error' for r in reports)
        status = 'error' if errors == len(reports) else 'partial' if errors else 'ok'
    data = {'generated_at': now.isoformat(), 'last_success_at': now.isoformat() if status == 'ok' else prior.get('last_success_at'),
            'provider': 'Tavily', 'status': status, 'reserved_credits': plan['reserved'], 'monthly_limit': CAP,
            'retention_days': 4, 'queries': reports,
            'results': sorted(seen.values(), key=lambda r: r['first_seen'], reverse=True)}
    write_json(output, data)
    return data


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['reserve', 'refresh'])
    parser.add_argument('--root', default='.')
    args = parser.parse_args()
    root = Path(args.root)
    run_id = os.environ.get('GITHUB_RUN_ID')
    if not run_id:
        parser.error('Set GITHUB_RUN_ID to a unique local run identifier, or run through GitHub Actions')
    key = os.environ.get('TAVILY_API_KEY')
    if args.action == 'reserve':
        report = reserve(root, run_id, datetime.now(timezone.utc), bool(key))
    else:
        report = refresh(root, run_id, key=key)
    print('Search status:', report['status'])
