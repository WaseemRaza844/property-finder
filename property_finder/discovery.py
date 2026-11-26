"""Exa Lite search discovery. Never fetches or scrapes property websites.

Structured facts and a short current-status evidence line are extracted from
Exa's cached index text. Raw text, descriptions, images and answers are discarded.
"""
import argparse
import calendar
import json
import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
from urllib.request import Request, build_opener, HTTPRedirectHandler
from .listing_facts import extract_facts, clean_title

CAP = 400
RETENTION_DAYS = 21  # Preserve the catalog's multi-week market rotation; older data is unverified.
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


def queries(root, now=None):
    now = now or datetime.now(timezone.utc)
    config = json.loads((root / 'config/searches.json').read_text(encoding='utf-8'))
    result = []
    domain_sets = [config['domains']] if config.get('query_mode') == 'combined' else config['domains']
    all_markets = config['markets']
    # Two independent six-query discovery lanes: regional + college towns.
    # Three local priority regions get daily coverage; three additional regions
    # and six college markets rotate. This preserves the free 12-query budget.
    def rotate(pool, slots):
        if not pool or slots <= 0:
            return []
        if len(pool) <= slots:
            return list(pool)
        start = (now.toordinal() * slots) % len(pool)
        return [pool[(start + offset) % len(pool)] for offset in range(slots)]

    if len(all_markets) > 12:
        regional = [m for m in all_markets if m.get('region') != 'College Towns']
        college = [m for m in all_markets if m.get('region') == 'College Towns']
        priority_ids = {'bedminster', 'easton', 'bethlehem'}
        priority = [m for m in regional if m['id'] in priority_ids]
        other_regions = [m for m in regional if m['id'] not in priority_ids]
        if college:
            regional_slots = 6
            college_slots = 6
            active_markets = (priority[:regional_slots]
                              + rotate(other_regions, regional_slots - len(priority[:regional_slots]))
                              + rotate(college, college_slots))
        else:
            active_markets = priority[:6] + rotate(other_regions, 12-len(priority[:6]))
    else:
        active_markets = all_markets
    for index, market in enumerate(active_markets):
        selected = ['homes.com'] if config.get('query_mode') == 'homes_priority' and (index + now.toordinal()) % 2 == 0 else [config['domains']] if config.get('query_mode') == 'homes_priority' else domain_sets
        for domain in selected:
            allowed = domain if isinstance(domain, list) else [domain]
            if not allowed or any(d not in DOMAINS for d in allowed):
                raise ValueError('Unsupported search domain')
            result.append({'market': market['id'], 'scope': 'college' if market.get('region') == 'College Towns' else 'regional', 'domain': domain,
                           'query': f'Active multifamily duplex triplex fourplex properties currently for sale near {market["name"] if "name" in market else market["towns"][0]}. Nearby towns: {", ".join(market["towns"])}. Prefer newly listed or recently updated individual Homes.com property pages where available. Exclude sold, off-market, pending and rental listings.'})
            if domain == 'homes.com':
                result[-1]['query'] = f'Multifamily duplex triplex properties for sale in {market["towns"][0]}. Prefer newly listed or recently updated for-sale listings. Exclude rentals, sold and off-market homes.'
            if market.get('region') == 'College Towns':
                college_name = market.get('university', '')
                result[-1]['query'] = (f'Multifamily duplex triplex fourplex investment properties for sale '
                                       f'in {market["towns"][0]} near {college_name}. '
                                       'Prioritize recently listed and updated individual property sale pages, not campus buildings, university pages, '
                                       'student dormitories, rental advertisements or sold properties.')
    if not 1 <= len(result) <= 12:
        raise ValueError('At most twelve Lite queries per run')
    return result


def reserve(root, run_id, now, has_key):
    """Called and committed to main BEFORE requests, including failed attempts."""
    path = root / '.state/search-budget.json'
    ledger = json.loads(path.read_text(encoding='utf-8'))
    month = now.strftime('%Y-%m')
    if ledger['month'] != month:
        ledger = {'month': month, 'reserved': 0, 'runs': []}
    tasks = queries(root, now)
    remaining = max(0, CAP - ledger['reserved'])
    days_left = calendar.monthrange(now.year, now.month)[1] - now.day + 1
    # Keep at least some searches available on every remaining scheduled day,
    # rather than spending twelve per run and going dark at month end.
    # When enough monthly quota remains, the usual twelve-query split is used.
    target = min(len(tasks), remaining // max(days_left, 1))
    if remaining and target == 0:
        target = 1
    if 0 < target < len(tasks):
        regional = [t for t in tasks if t.get('scope') != 'college']
        college = [t for t in tasks if t.get('scope') == 'college']
        if regional and college:
            n_college = min(len(college), target // 2)
            n_regional = min(len(regional), target - n_college)
            n_college = min(len(college), target - n_regional)
            def subset(pool, n):
                start = (now.toordinal() * max(n, 1)) % len(pool)
                return [pool[(start + i) % len(pool)] for i in range(n)]
            tasks = subset(regional, n_regional) + subset(college, n_college)
        else:
            tasks = tasks[:target]
    count = len(tasks)
    status = 'ready'
    if not has_key:
        status = 'not_configured'
    elif count == 0:
        status = 'budget_exhausted'
    elif run_id in ledger['runs']:
        status = 'already_reserved'
    elif ledger['reserved'] + count > CAP:
        status = 'budget_exhausted'
    else:
        ledger['reserved'] += count
        ledger['runs'].append(run_id)
    write_json(path, ledger)
    plan = {'run_id': run_id, 'status': status, 'allowance': count if status == 'ready' else 0,
            'reserved': ledger['reserved'], 'monthly_limit': CAP, 'tasks': tasks}
    write_json(root / '.state/active-search.json', plan)
    return plan


def search(query, domain, key):
    # Domain paths keep market catalogs from crowding out individual properties.
    domains = domain if isinstance(domain, list) else [domain]
    domains = [{'homes.com':'homes.com/property','realtor.com':'realtor.com/realestateandhomes-detail'}.get(d,d) for d in domains]
    request = Request('https://api.exa.ai/search', method='POST',
                      headers={'x-api-key': key, 'Content-Type': 'application/json'},
                      data=json.dumps({'query': query, 'includeDomains': domains,
                                       'type': 'lite', 'numResults': 10,
                                       'contents': {'text': {'maxCharacters': 16000}, 'highlights': False}}).encode())
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
    tasks = plan.get('tasks') or queries(root, now)
    old = {r['url']: r for r in prior['results'] if datetime.fromisoformat(r['last_seen']) > now - timedelta(days=RETENTION_DAYS)}
    seen, reports = {}, []
    if plan['status'] == 'ready' and not key:
        raise ValueError('Reserved search key is missing')
    if plan['allowance'] and plan['allowance'] != len(tasks):
        raise ValueError('Search configuration changed after reservation')
    if plan['status'] == 'ready':
        write_json(root / '.state/active-search.json', dict(plan, status='consumed', allowance=0))
        for task in tasks:
            allowed = task['domain'] if isinstance(task['domain'], list) else [task['domain']]
            report = {'market': task['market'], 'domain': ', '.join(allowed), 'status': 'ok', 'returned':0, 'accepted': 0, 'source_counts':{}}
            try:
                rows = requester(task['query'], task['domain'], key)
                if not isinstance(rows, list):
                    raise ValueError('Invalid search result array')
                report['returned'] = len(rows[:10])
                for row in rows[:10]:
                    if not isinstance(row, dict):
                        continue
                    url = property_url(row.get('url'))
                    # Validate provider domain restrictions locally as well.
                    if not url or urlsplit(url).hostname not in ['www.' + d for d in allowed]:
                        continue
                    if url not in seen:
                        seen[url] = {'url': url, 'source': urlsplit(url).hostname.removeprefix('www.'),
                                     'title': clean_title(row.get('title')),
                                     'markets': [], 'first_seen': old.get(url, {}).get('first_seen', now.isoformat()),
                                     'last_seen': now.isoformat(), 'observed_this_run': True,
                                     **extract_facts(row, url, now.isoformat())}
                    if task['market'] not in seen[url]['markets']:
                        seen[url]['markets'].append(task['market'])
                    report['accepted'] += 1
                    source = urlsplit(url).hostname.removeprefix('www.')
                    report['source_counts'][source] = report['source_counts'].get(source,0)+1
            except HTTPError as error:
                report.update(status='error', note=f'Search provider returned HTTP {error.code}; no retry attempted')
            except (URLError, TimeoutError, OSError, ValueError, TypeError):
                report.update(status='error', note='Search request failed; no retry attempted')
            reports.append(report)
    for url, row in old.items():
        if url not in seen:
            # Preserve a genuinely recent observation when its source was not
            # scheduled today; a searched-but-missing/failed source is excluded.
            searched = any(t['market'] in row['markets'] and row['source'] in (t['domain'] if isinstance(t['domain'],list) else [t['domain']]) for t in tasks)
            excluded = searched or row.get('search_excluded', not (row.get('observed_this_run') or row.get('not_searched_this_run')))
            seen[url] = dict(row, observed_this_run=False, search_excluded=excluded,
                             not_searched_this_run=plan['status']=='ready' and not searched and not excluded)
    status = plan['status']
    if status == 'ready':
        errors = sum(r['status'] == 'error' for r in reports)
        status = 'error' if errors == len(reports) else 'partial' if errors else 'ok'
    data = {'generated_at': now.isoformat(), 'last_success_at': now.isoformat() if status == 'ok' else prior.get('last_success_at'),
            'provider': 'Exa', 'status': status, 'reserved_requests': plan['reserved'], 'monthly_limit': CAP,
            'retention_days': RETENTION_DAYS, 'queries': reports,
            'results': sorted(seen.values(), key=lambda r: r['first_seen'], reverse=True)}
    write_json(output, data)
    # Last successful nonempty dataset remains available when scheduled queries
    # fail, exhaust free credits, or retained four-day observations expire.
    # This is explicitly historical, never a claim of current availability.
    if status in ('ok', 'partial') and any(r.get('accepted', 0) for r in reports) and data['results']:
        write_json(root / 'web/data/latest-successful.json', {
            'generated_at': now.isoformat(),
            'results': data['results']
        })
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
    key = os.environ.get('EXA_API_KEY')
    if args.action == 'reserve':
        report = reserve(root, run_id, datetime.now(timezone.utc), bool(key))
    else:
        report = refresh(root, run_id, key=key)
    print('Search status:', report['status'])
