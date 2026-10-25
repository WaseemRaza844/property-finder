"""Conservative facts from Exa's indexed text; never a live availability check."""
import re
from urllib.parse import unquote, urlsplit


def location(title, url):
    state = town = postal = None
    parsed = urlsplit(url)
    parts = unquote(parsed.path).strip('/').split('/')
    if parsed.hostname.endswith('redfin.com') and len(parts) >= 3 and re.fullmatch('[A-Z]{2}', parts[0]):
        state, town = parts[0], parts[1].replace('-', ' ')
        zips = re.findall(r'(?:-|_)(\d{5})(?=$|[-_])', parts[2])
        postal = zips[-1] if zips else None
    if 'realtor.com' in parsed.hostname and parts:
        address = parts[-1].split('_')
        if len(address) >= 4 and re.fullmatch('[A-Z]{2}', address[-3]) and re.fullmatch(r'\d{5}', address[-2]):
            town, state, postal = address[-4].replace('-', ' '), address[-3], address[-2]
    match = re.search(r',\s*([A-Za-z][A-Za-z .\x27-]{1,45}?),?\s+([A-Z]{2})\s+(\d{5})(?:\D|$)', title)
    if match:
        town, state, postal = match.groups()
    return {'town': town, 'state': state, 'zip': postal}


def current_section(text):
    # Historical sales, comparable homes, and recommendations cannot supply facts.
    return re.split(r'(?im)^\s*(?:#{1,6}\s*)?(?:sale and tax history|price history|property history|sale history|tax history|nearby homes|similar homes|recently sold homes|home history)\b', text[:24000], maxsplit=1)[0][:12000]


def extract_facts(row, url, at):
    title = str(row.get('title') or 'Property page')[:200]
    text = row.get('text') if isinstance(row.get('text'), str) else ''
    section = current_section(text)
    header = title + '\n' + section[:4000]
    lines = [re.sub(r'^[#*\s]+', '', line).strip() for line in header.splitlines()]
    negative = [
        ('off_market', r'^(?:this (?:home|property) is\s+)?(?:off[ -]market|not (?:currently )?for sale|listing (?:removed|withdrawn)|withdrawn|expired|not available)\b'),
        ('sold', r'^(?:this (?:home|property) (?:was|is)\s+)?(?:sold(?:\s+on|\s+for|\s+[a-z]{3,9}\s+\d|\s*[-:—]|\s*$)|recently sold)\b'),
        ('pending', r'^(?:status\s*[:|-]?\s*)?(?:pending|contingent|under contract|active under contract|coming soon)\b'),
    ]
    status, evidence = 'unknown', None
    title_status = re.search(r'(?:[|—]\s*)(sold|off[ -]market|pending|contingent)\b', title, re.I)
    if title_status:
        word = title_status.group(1).lower()
        status = 'sold' if word == 'sold' else 'off_market' if word.startswith('off') else 'pending'
        evidence = title[:120]
    # Title status and explicit current-status lines override positive wording.
    for label, pattern in negative if status == 'unknown' else []:
        hit = next((line for line in lines if re.search(pattern, line, re.I) or re.search(r'\b(?:status|listing status)\s*[:|-]\s*' + ('sold' if label == 'sold' else 'off[ -]market' if label == 'off_market' else 'pending|under contract'), line, re.I)), None)
        if hit:
            status, evidence = label, hit[:120]
            break
    if status == 'unknown':
        hit = next((line for line in lines if re.match(r'^(?:(?:listing )?status\s*[:|-]?\s*)?(?:for sale|active(?: listing)?|new listing|back on (?:the )?market)\b', line, re.I)), None)
        if hit:
            status, evidence = 'active', hit[:120]
    facts = {'listing_status': status, 'status_basis': 'Exa indexed text' if evidence else 'No explicit current status found',
             'status_evidence': evidence, 'facts_observed_at': at, 'price': None, 'beds': None, 'baths': None,
             'sqft': None, 'units': None, 'property_type': None, **location(title, url)}
    # Exclude generic title/metadata from numbers; use only the current page section.
    price = re.search(r'(?im)^\s*(?:#{1,6}\s*)?(?:(?:list(?:ing)? price|price|for sale)\s*[:|-]?\s*)?\$\s*([\d,]+)(?:\.00)?\s*(?:$|\n|\|)', section)
    if price:
        amount = int(price.group(1).replace(',', ''))
        if 10000 <= amount <= 100000000:
            facts['price'] = amount
    for key, pattern in [('beds', r'\b(\d{1,2}(?:\.5)?)\s*(?:beds?|bd|bedrooms?)\b'),
                         ('baths', r'\b(\d{1,2}(?:\.5)?)\s*(?:baths?|ba|bathrooms?)\b'),
                         ('sqft', r'\b(\d[\d,]{2,6})\s*(?:sq\.?\s*ft\.?|sqft|square feet)\b'),
                         ('units', r'\b(\d{1,3})[ -]+(?:units?|family|families)\b')]:
        match = re.search(pattern, section, re.I)
        if match:
            n = float(match.group(1).replace(',', ''))
            facts[key] = int(n) if n.is_integer() else n
    types = [('single-family', r'\bsingle[ -]family\b'), ('duplex', r'\bduplex\b'),
             ('triplex', r'\btriplex\b'), ('fourplex', r'\b(?:fourplex|quadplex)\b'),
             ('multifamily', r'\b(?:multi[ -]?family|apartment building)\b')]
    type_text = title + '\n' + section[:4000]
    explicit = re.search(r'(?i)(?:property type|home type)\s*[:\n|-]?\s*([^\n|]{1,60})', section)
    if explicit:
        type_text = explicit.group(1)
    for label, pattern in types:
        if re.search(pattern, type_text, re.I):
            facts['property_type'] = label
            break
    if facts['units'] is None:
        facts['units'] = {'duplex': 2, 'triplex': 3, 'fourplex': 4, 'single-family': 1}.get(facts['property_type'])
    if facts['property_type'] is None and facts['units'] and facts['units'] > 1:
        facts['property_type'] = {2:'duplex',3:'triplex',4:'fourplex'}.get(facts['units'], 'multifamily')
    return facts
