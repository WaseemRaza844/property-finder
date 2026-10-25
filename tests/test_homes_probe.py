import json
import tempfile
import unittest
from pathlib import Path
from datetime import datetime,timezone
from property_finder.discovery import write_json,CAP
from property_finder.homes_probe import reserve,refresh

NOW=datetime(2026,10,25,tzinfo=timezone.utc)


class HomesProbeTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
        write_json(self.root / '.state/search-budget.json',{'month':'2026-10','reserved':39,'runs':[]})

    def test_reservation_is_bounded_and_monthly(self):
        self.assertEqual(reserve(self.root,'one',NOW,True)['reserved'],43)
        self.assertEqual(reserve(self.root,'two',NOW,True)['status'],'already_done')
        write_json(self.root / '.state/search-budget.json',{'month':'2026-10','reserved':CAP-3,'runs':[]})
        self.assertEqual(reserve(self.root,'three',NOW,True)['status'],'budget_exhausted')

    def test_requests_only_homes_and_discards_raw_content(self):
        reserve(self.root,'one',NOW,True)
        def fake(query,domain,key):
            self.assertEqual(domain,'homes.com')
            return [{'url':'https://www.homes.com/property/123-main-st-easton-pa/abc/','title':'123 Main St, Easton, PA 18042','text':'For Sale\nPRIVATE RAW TEXT\n$200,000\n4 beds\n2 units'},
                    {'url':'https://www.homes.com/easton-pa/multi-family-homes-for-sale/','title':'Market page'},
                    {'url':'https://www.redfin.com/PA/X/home/1','title':'Wrong source'}]
        report=refresh(self.root,'one',NOW,'test',fake)
        self.assertEqual(len(report['queries']),4)
        self.assertEqual(report['queries'][0]['accepted'],1)
        self.assertNotIn('PRIVATE RAW TEXT',json.dumps(report))
        refresh(self.root,'one',NOW,'test',lambda *a:self.fail('Replay'))
        with self.assertRaises(ValueError):refresh(self.root,'wrong',NOW,'test',fake)
