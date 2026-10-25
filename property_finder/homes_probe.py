"""Four dedicated Homes.com index searches, at most once per month/version.

Uses the same 400-request ledger. Never requests Homes.com directly or stores
raw source text. Reservations must be pushed before refresh is invoked.
"""
import json
import os
import sys
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from pathlib import Path
from .discovery import CAP, search, property_url, write_json
from .listing_facts import extract_facts, current_section
import re

PROBES = [('easton', 'Easton PA duplex for sale Homes.com'),
          ('pittsburgh', 'Pittsburgh PA multifamily for sale Homes.com'),
          ('cleveland', 'Cleveland OH duplex for sale Homes.com'),
          ('charlotte', 'Charlotte NC multifamily for sale Homes.com')]


def reserve(root, run_id, now, has_key):
    ledger_path=root / '.state/search-budget.json'
    ledger=json.loads(ledger_path.read_text(encoding='utf-8'))
    month=now.strftime('%Y-%m')
    if ledger['month'] != month:
        ledger={'month':month,'reserved':0,'runs':[]}
    marker=month+':homes-probe-v1'
    status='not_configured' if not has_key else 'already_done' if marker in ledger['runs'] else 'budget_exhausted' if ledger['reserved']+len(PROBES)>CAP else 'ready'
    if status=='ready':
        ledger['reserved']+=len(PROBES)
        ledger['runs'].append(marker)
    write_json(ledger_path,ledger)
    plan={'run_id':run_id,'status':status,'reserved':ledger['reserved']}
    write_json(root / '.state/active-homes-probe.json',plan)
    return plan


def refresh(root, run_id, now, key, requester=search):
    plan_path=root / '.state/active-homes-probe.json'
    plan=json.loads(plan_path.read_text(encoding='utf-8'))
    if plan['run_id']!=run_id:
        raise ValueError('Probe reservation belongs to another run')
    if plan['status']!='ready':
        return plan
    if not key:
        raise ValueError('Reserved search key is missing')
    write_json(plan_path,dict(plan,status='consumed'))
    reports=[]
    for market,query in PROBES:
        report={'market':market,'query':query,'status':'ok','returned':0,'accepted':0,'results':[]}
        try:
            rows=requester(query,'homes.com',key)
            report['returned']=len(rows[:10])
            for row in rows[:10]:
                if not isinstance(row,dict):continue
                url=property_url(row.get('url'))
                if not url or not url.startswith('https://www.homes.com/'):
                    continue
                report['accepted']+=1
                text=row.get('text') if isinstance(row.get('text'),str) else ''
                # Publish short status labels only, never page text/descriptions.
                labels=[{'offset':m.start(),'label':m.group(0).strip()[:80]} for m in re.finditer(r'(?im)^\s*(?:#{1,6}\s*)?(?:for sale|not listed for sale|off market|pending|sold|active)\s*$',current_section(text))][:5]
                report['results'].append({'url':url,'title':str(row.get('title') or 'Property page')[:200],
                                          'text_characters':len(text),'status_labels':labels,
                                          **extract_facts(row,url,now.isoformat())})
        except (HTTPError,URLError,TimeoutError,OSError,ValueError,TypeError):
            report['status']='error'
        reports.append(report)
    result={'generated_at':now.isoformat(),'reserved_requests':plan['reserved'],'monthly_limit':CAP,'queries':reports}
    write_json(root / 'web/data/homes-diagnostic.json',result)
    return result


if __name__=='__main__':
    root=Path('.')
    now=datetime.now(timezone.utc)
    run_id=os.environ['GITHUB_RUN_ID']
    key=os.environ.get('EXA_API_KEY')
    result=reserve(root,run_id,now,bool(key)) if sys.argv[1]=='reserve' else refresh(root,run_id,now,key)
    print('Homes.com diagnostic:',result.get('status','completed'))
