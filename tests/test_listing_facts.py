import unittest
from property_finder.listing_facts import extract_facts, location

URL='https://www.redfin.com/PA/Easton/1-Test-St-18042/home/123'
AT='2026-10-25T12:00:00+00:00'


class FactsTests(unittest.TestCase):
    def facts(self,text,title='1 Test St, Easton, PA 18042'):
        return extract_facts({'title':title,'text':text},URL,AT)

    def test_homes_multiline_title_and_not_listed_label(self):
        title='1334 W 70th St \n       \n Cleveland, OH \n 44102'
        row=self.facts('NOT LISTED FOR SALE\n$112,000\n5 beds\n2 units',title)
        self.assertEqual(row['listing_status'],'off_market')
        self.assertEqual((row['town'],row['state'],row['zip']),('Cleveland','OH','44102'))
        self.assertEqual(self.facts('FOR RENT\n2 beds')['listing_status'],'off_market')
        self.assertIsNone(self.facts('117 Old NC Highway 345 Unit 301\n2 beds')['units'])

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

    def test_all_labeled_unavailable_statuses_override_for_sale(self):
        for label in ['Listing status:','Status:','Listing Status —']:
            for value in ['Contingent','Coming soon','Not for sale','Off market','Sold','Pending','Under contract','Withdrawn','Expired']:
                with self.subTest(label=label,value=value):
                    self.assertNotEqual(self.facts('For sale\n'+label+' '+value)['listing_status'],'active')

    def test_ampersand_history_is_not_current_evidence(self):
        row=self.facts('For sale\n$425,000\nSale & Tax History\nSold on Oct 1, 2020\n$200,000\n9 beds')
        self.assertEqual(row['listing_status'],'active')
        self.assertEqual(row['price'],425000)
        self.assertIsNone(row['beds'])

    def test_comparables_do_not_supply_facts(self):
        row=self.facts('For sale\nSimilar homes\n$900,000\n8 beds\n4 units')
        self.assertIsNone(row['price']);self.assertIsNone(row['beds']);self.assertIsNone(row['units'])

    def test_url_location_and_missing_fields(self):
        row=location('Property page','https://www.realtor.com/realestateandhomes-detail/1-Test-St_Bethlehem_PA_18018_M123')
        self.assertEqual(row,{'town':'Bethlehem','state':'PA','zip':'18018'})
        self.assertIsNone(self.facts('For sale')['units'])

    def test_lot_area_and_unit_ranges_are_not_exact_home_facts(self):
        row=self.facts('For sale\n10,001 sq ft lot\nProperty type: Multi-Family (2-4 units)')
        self.assertIsNone(row['sqft']);self.assertIsNone(row['units'])
        self.assertIsNone(self.facts('For sale\n10,001 sq ft (Lot Size)')['sqft'])
        row=self.facts('For sale\nLot size:\n10,001 sq ft\nLiving area:\n2,400 sq ft\n2 to 4 units')
        self.assertEqual(row['sqft'],2400);self.assertIsNone(row['units'])

    def test_estimated_value_is_not_an_asking_price(self):
        self.assertIsNone(self.facts('For sale\nRedfin Estimate:\n$500,000')['price'])
