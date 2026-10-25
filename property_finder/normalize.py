import hashlib
import math
import re
from urllib.parse import urlsplit, urlunsplit

TYPES = {'duplex', 'triplex', 'fourplex', 'multifamily', 'single-family', 'condo'}


def number(value, low=0, high=1e12):
    if value is None or value == '':
        return None
    n = float(str(value).replace(',', '').replace('$', ''))
    if not math.isfinite(n) or not low <= n <= high:
        raise ValueError('Number outside valid range')
    return int(n) if n.is_integer() else n


def normalize(raw, source):
    address = str(raw.get('address', '')).strip()
    city = str(raw.get('city', '')).strip()
    state = str(raw.get('state', '')).strip().upper()
    postal = str(raw.get('zip', '')).strip()
    if not address or not city or not re.fullmatch(r'[A-Z]{2}', state) or not re.fullmatch(r'\d{5}', postal):
        raise ValueError('Street, city, state, and five-digit ZIP required')
    url = urlsplit(str(raw.get('url', '')))
    if url.scheme != 'https' or not url.hostname or url.username or url.password:
        raise ValueError('Valid HTTPS listing URL required')
    kind = str(raw.get('property_type', 'multifamily')).lower()
    if kind not in TYPES:
        raise ValueError('Unknown property type')
    # Preserve unit identifiers; do not merge distinct units or ZIP codes.
    key = '|'.join(re.sub(r'[^a-z0-9]', '', s.lower()) for s in [address, city, state, postal])
    row = dict(id=hashlib.sha256(key.encode()).hexdigest()[:20], address=address,
               city=city, state=state, zip=postal, market=str(raw.get('market', '')),
               property_type=kind, status=str(raw.get('status', 'unknown')),
               description=str(raw.get('description', '')), sources=[{
                   'id': source['id'], 'name': source['name'],
                   'url': urlunsplit((url.scheme, url.netloc, url.path, url.query, ''))}])
    for field in ['price', 'beds', 'baths', 'units', 'sqft', 'lot_sqft', 'year_built', 'annual_tax', 'monthly_rent']:
        row[field] = number(raw.get(field))
    row['latitude'] = number(raw.get('latitude'), -90, 90)
    row['longitude'] = number(raw.get('longitude'), -180, 180)
    if (row['latitude'] is None) != (row['longitude'] is None):
        raise ValueError('Coordinates must be supplied as a pair')
    return row
