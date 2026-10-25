import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from property_finder.normalize import normalize
from property_finder.history import merge_history
from property_finder.sources import ingest
from property_finder.refresh import refresh

SOURCE = {'id': 'test', 'name': 'Test authorized export'}
# Synthetic data lives only in tests, never the public dataset.
RAW = {'address':'1 Test Street', 'city':'Testville', 'state':'NJ', 'zip':'00000',
       'price':'$400,000', 'url':'https://example.com/property/1', 'property_type':'duplex'}
NOW = datetime(2026, 10, 25, 12, tzinfo=timezone.utc)


class PipelineTests(unittest.TestCase):
    def row(self, **changes):
        return normalize(dict(RAW, **changes), SOURCE)

    def test_normalizes_and_keeps_unknowns(self):
        row = self.row()
        self.assertEqual(row['price'], 400000)
        self.assertIsNone(row['units'])

    def test_rejects_bad_data(self):
        for change in [{'price':'NaN'}, {'latitude':91,'longitude':1}, {'url':'javascript:alert(1)'}, {'zip':''}, {'latitude':40}]:
            with self.subTest(change=change), self.assertRaises(ValueError): self.row(**change)

    def test_identity_and_dedup(self):
        a = self.row()
        b = normalize(dict(RAW, address='1 TEST STREET'), {'id':'other','name':'Other'})
        merged=merge_history([], [a,b], NOW)
        self.assertEqual(len(merged),1)
        self.assertEqual(len(merged[0]['sources']),2)
        self.assertNotEqual(a['id'],self.row(address='1 Test Street Unit 2')['id'])

    def test_history_and_retention(self):
        old=merge_history([], [self.row()], NOW)
        updated=merge_history(old, [self.row(price=390000)], NOW+timedelta(days=1))
        self.assertEqual(updated[0]['first_seen'],NOW.isoformat())
        self.assertEqual(len(updated[0]['price_history']),2)
        retained=merge_history(updated, [], NOW+timedelta(days=4))
        self.assertFalse(retained[0]['observed_this_run'])
        self.assertEqual(merge_history(updated, [], NOW+timedelta(days=5)),[])
        self.assertEqual(old[0]['price_history'][0]['price'],400000)

    def test_import_authorization_and_path(self):
        with tempfile.TemporaryDirectory() as d:
            for src in [{'adapter':'json_file','path':'imports/a.json'}, {'adapter':'json_file','path':'../secret','authorization':'yes'}]:
                with self.assertRaises(ValueError): ingest(src,d)

    def test_failure_preserves_observations_and_reports_error(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            (root/'imports').mkdir(); (root/'config').mkdir()
            source=dict(SOURCE,enabled=True,adapter='json_file',path='imports/data.json',authorization='Approved test')
            (root/'config/sources.json').write_text(json.dumps([source]))
            path=root/'imports/data.json';path.write_text(json.dumps([RAW]))
            refresh(root,NOW)
            path.write_text('invalid')
            data=refresh(root,NOW+timedelta(days=1))
            self.assertEqual(data['sources'][0]['status'],'error')
            self.assertFalse(data['listings'][0]['observed_this_run'])
            self.assertEqual(len(data['listings']),1)

    def test_empty_is_successful_not_live_feed(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'imports').mkdir();(root/'config').mkdir()
            (root/'imports/data.json').write_text('[]')
            (root/'config/sources.json').write_text(json.dumps([dict(SOURCE,enabled=True,adapter='json_file',path='imports/data.json',authorization='Approved')]))
            data=refresh(root,NOW)
            self.assertEqual(data['listings'],[])
            self.assertEqual(data['sources'][0]['count'],0)


if __name__ == '__main__': unittest.main()
