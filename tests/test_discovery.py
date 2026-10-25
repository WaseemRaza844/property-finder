import json
import tempfile
import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import URLError
from property_finder.discovery import reserve, refresh, property_url, write_json, CAP, search

NOW = datetime(2026, 10, 25, 12, tzinfo=timezone.utc)
URL = 'https://www.redfin.com/PA/Example/home/123'


class DiscoveryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        write_json(self.root / 'config/searches.json', {'markets': [{'id':'easton','towns':['Easton PA']}], 'domains':['redfin.com']})
        write_json(self.root / '.state/search-budget.json', {'month':'','reserved':0,'runs':[]})

    def prepare(self, run='run-1', now=NOW):
        return reserve(self.root, run, now, True)

    def test_only_canonical_individual_property_urls(self):
        self.assertEqual(property_url(URL+'?utm_source=test#info'), URL)
        for url in ['https://redfin.com.evil.example/PA/X/home/1','https://www.redfin.com/city/1',
                    'https://user:secret@www.redfin.com/PA/X/home/1','javascript:alert(1)',
                    'https://www.realtor.com/realestateandhomes-search/Easton_PA']:
            self.assertIsNone(property_url(url))

    def test_missing_key_never_calls_provider(self):
        reserve(self.root,'run-1',NOW,False)
        report=refresh(self.root,'run-1',NOW,requester=lambda *a:self.fail('Unexpected network call'))
        self.assertEqual(report['status'],'not_configured')
        self.assertEqual(report['reserved_requests'],0)

    def test_exa_request_uses_lite_domain_filter_and_private_header(self):
        response=MagicMock()
        response.__enter__.return_value.read.return_value=json.dumps({'results':[{'url':URL,'title':'Test'}]}).encode()
        with patch('property_finder.discovery.build_opener') as opener:
            opener.return_value.open.return_value=response
            result=search('Easton PA duplex for sale','redfin.com','test-secret')
        request=opener.return_value.open.call_args.args[0]
        self.assertEqual(request.full_url,'https://api.exa.ai/search')
        self.assertEqual(request.get_header('X-api-key'),'test-secret')
        body=json.loads(request.data)
        self.assertEqual(body,{'query':'Easton PA duplex for sale','includeDomains':['redfin.com'],
                               'type':'lite','numResults':10,'contents':{'text':{'maxCharacters':16000},'highlights':False}})
        self.assertNotIn('test-secret',request.full_url)
        self.assertNotIn('test-secret',request.data.decode())
        self.assertEqual(result[0]['url'],URL)

    def test_invalid_exa_response_is_rejected(self):
        response=MagicMock()
        response.__enter__.return_value.read.return_value=b'{"results":null}'
        with patch('property_finder.discovery.build_opener') as opener:
            opener.return_value.open.return_value=response
            with self.assertRaises(ValueError):search('test','redfin.com','test-secret')

    def test_dedup_discards_content_and_replay_does_not_spend(self):
        self.prepare(); calls=[]
        def fake(query,domain,key):
            calls.append(domain)
            return [{'url':URL,'title':'Test duplex','content':'Must never be published'},
                    {'url':URL+'?utm_source=x','title':'Test duplex'},
                    {'url':'https://www.homes.com/property/other/123/','title':'Wrong source'},
                    {'url':'https://www.redfin.com/city/1','title':'Market page'}]
        report=refresh(self.root,'run-1',NOW,key='test-key',requester=fake)
        self.assertEqual(len(report['results']),1)
        self.assertNotIn('content',report['results'][0])
        self.assertEqual(len(calls),1)
        refresh(self.root,'run-1',NOW,key='test-key',requester=lambda *a:self.fail('Replayed reservation'))
        plan=self.prepare()
        self.assertEqual(plan['allowance'],0)

    def test_failure_retains_but_never_marks_old_link_fresh(self):
        self.prepare()
        refresh(self.root,'run-1',NOW,key='test',requester=lambda *a:[{'url':URL,'title':'Test'}])
        self.prepare('run-2',NOW+timedelta(days=1))
        def fail(*args): raise URLError('Test failure')
        report=refresh(self.root,'run-2',NOW+timedelta(days=1),key='test',requester=fail)
        self.assertEqual(report['status'],'error')
        self.assertFalse(report['results'][0]['observed_this_run'])
        self.assertEqual(report['last_success_at'],NOW.isoformat())

    def test_budget_cap_and_month_reset(self):
        write_json(self.root / '.state/search-budget.json', {'month':'2026-10','reserved':CAP,'runs':[]})
        self.assertEqual(self.prepare()['status'],'budget_exhausted')
        self.assertEqual(self.prepare('nov',datetime(2026,11,1,tzinfo=timezone.utc))['reserved'],1)

    def test_wrong_run_cannot_consume_another_reservation(self):
        self.prepare()
        with self.assertRaises(ValueError): refresh(self.root,'wrong',NOW,key='test')

    def test_rediscovered_expired_link_starts_new_history(self):
        self.prepare();fake=lambda *a:[{'url':URL,'title':'Test'}]
        refresh(self.root,'run-1',NOW,key='test',requester=fake)
        later=NOW+timedelta(days=7)
        self.prepare('run-2',later)
        report=refresh(self.root,'run-2',later,key='test',requester=fake)
        self.assertEqual(report['results'][0]['first_seen'],later.isoformat())
