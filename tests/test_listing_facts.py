import unittest
from property_finder.listing_facts import extract_facts, location

URL='https://www.redfin.com/PA/Easton/1-Test-St-18042/home/123'
AT='2026-10-25T12:00:00+00:00'


class FactsTests(unittest.TestCase):
    def facts(self,text,title='1 Test St, Easton, PA 18042'):
        return extract_facts({'title':title,'text':text},URL,AT)

    def test_current_facts_and_historical_sale_are_separate(self):
        row=self.facts('For sale\n$425,000\n4 beds\n2.5 baths\n2,400 sq ft\nProperty type: Duplex\nPrice history\nSold for $200,000\n9 beds')
        self.assertEqual(row['listing_status'],'active')
        self.assertEqual((row['price'],row['beds'],row['baths'],row['sqft'],row['units']),(425000,4,2.5,2400,2))
        self.assertEqual((row['town'],row['state'],row['zip']),('Easton','PA','18042'))

    def test_sold_off_market_pending_override_for_sale(self):
        for text in ['SOLD on Oct 1, 2026\nFor sale\n$500,000','OFF MARKET\nFor sale nearby','Pending\nFor sale','Active under contract\nFor sale']:
            with self.subTest(text=text):self.assertNotEqual(self.facts(text)['listing_status'],'active')
        self.assertEqual(self.facts('For sale','1 Test St | Sold')['listing_status'],'sold')

    def test_unknown_is_not_assumed_active(self):
        row=self.facts('Discover nearby homes.\nProperty history\nSold on Oct 1\n$500,000\n5 beds')
        self.assertEqual(row['listing_status'],'unknown')
        self.assertIsNone(row['price']);self.assertIsNone(row['beds'])

    def test_comparables_do_not_supply_facts(self):
        row=self.facts('For sale\nSimilar homes\n$900,000\n8 beds\n4 units')
        self.assertIsNone(row['price']);self.assertIsNone(row['beds']);self.assertIsNone(row['units'])

    def test_url_location_and_missing_fields(self):
        row=location('Property page','https://www.realtor.com/realestateandhomes-detail/1-Test-St_Bethlehem_PA_18018_M123')
        self.assertEqual(row,{'town':'Bethlehem','state':'PA','zip':'18018'})
        self.assertIsNone(self.facts('For sale')['units'])
