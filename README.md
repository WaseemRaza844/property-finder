# Property Finder

## Automatic search discovery (Exa Lite)

Automatic discovery collects individual property-page URLs, retrieves Exa Lite's indexed text, extracts supported numeric facts/status evidence, deduplicates links, and saves four days of observations in `web/data/discoveries.json`. It does not fetch property websites directly, publish raw text/descriptions/photos, invent missing facts, or guarantee live availability. Full licensed listing ingestion remains separate.

The default **For-sale evidence only** view requires an explicit for-sale/active line in the current indexed section, fact retrieval within 36 hours, and either observation in the latest run or a source explicitly not scheduled in the latest rotation. Sold, off-market, pending, contingent, and coming-soon results are hidden. Unverified/stale results are accessible only through the review filter; closed results stay hidden even there. Absence of a sold phrase is never treated as proof of active status. Historical sales/price/tax sections and comparable-home sections do not supply current facts. This conservative parser can omit valid properties; indexed text can lag the real site.

Numbered results group by actual town/ZIP when a usable title/URL supplies it, or by query market/source. Missing town/ZIP have explicit groups. Price, beds, baths, area, units and property type appear at the top. Duplex/triplex/fourplex unit counts follow an explicit source type; other values stay unknown. Sort by price (both directions), town, market, beds, area, units or discovery date; unknown numeric values sort last. Price caps exclude unknown prices. **Require price, beds, area & units** hides incomplete records. Compact rows and collapsible groups reduce scrolling. View preferences stay in this browser.

### Activate the free search API

1. Create your account at https://dashboard.exa.ai and stay on the free Starter plan without enabling PAYG or automatic top-ups. Exa currently advertises $10 of monthly free credits with no payment method required: https://exa.ai/pricing . Review its terms during signup. This integration uses Lite search only, ten results maximum, with up to 16,000 characters of cached index text per result for fact extraction. No extra contents calls, live crawling, summaries, or generated answers are requested. Raw text is discarded after parsing; only facts and a status line up to 120 characters are stored. Provider access does not grant rights to republish entire listing pages.
2. In this repository, Settings → Secrets and variables → Actions → New repository secret: name `EXA_API_KEY`, value your key. Never place the key in a file, browser code, issue, or chat. The old `TAVILY_API_KEY` secret is not used and may be removed. The key is supplied only to the search steps and sent in the `x-api-key` header to `https://api.exa.ai/search`; redirects are blocked.
3. Run **Refresh and deploy Property Finder** on `main`, or wait for 7:30 AM America/New_York. After it finishes, reload the dashboard. New links appear automatically under **Automatic discovery**, without copy/paste. The manual shortlist remains optional and browser-local.

Twelve Lite searches per refresh cover twelve markets across five regions: four dedicated Homes.com property-path queries and eight combined-source queries, rotating daily so every market gets a dedicated Homes.com search every three days. Each query returns up to 10 results. A daily run uses at most 372 requests in a 31-day month, plus four monthly diagnostic requests, leaving 24 requests for manual runs under the unchanged 400-request cap. At published prices of $4/1,000 Lite requests plus $1/1,000 text pages, budget conservatively about $5.21/month for daily runs; the 400-request application cap allows up to 4,000 text results (about $5.60 total). These are estimates, not a provider billing guarantee; check current pricing and keep paid billing/top-ups disabled. The ledger counts **search requests, not dollars or Exa credits**. Reservations are committed before requests; failure to persist prevents requests. Reruns do not spend again; unused reservations are not refunded. There are no retries, pagination, additional extraction requests, or search-mode upgrades. Use a dedicated key; this budget does not know other account usage. The existing monthly ledger is preserved.

Queries are editable in `config/searches.json` (maximum twelve). Dashboard filters operate on saved results; exact mile-radius filtering is not available without verified coordinates. GitHub Pages cannot safely hold an API key or directly launch authenticated workflow requests, so **Run fresh searches on GitHub** opens the workflow for the repository owner. Its results are published back after completion. This is scheduled/manual batch discovery, not an instant browser-to-provider search.

Missing key, exhausted allowance, provider errors, partial success, and no accepted matches have separate visible states. Failed searches keep prior links without updating their last-seen dates. Unexpected internal failures stop deployment. Old links expire four days after last discovery; rediscovery after expiration begins a new history.

A free, dependency-free property discovery workspace focused on duplexes, triplexes, and multifamily homes. Prepare searches across Realtor.com, Redfin, and Homes.com, then keep promising property links in a browser-local shortlist. Python also supports authorized exports; GitHub Actions retains those imported observations and publishes the site to GitHub Pages.

## Unified search and saved links

Choose one of twelve markets grouped into Central New Jersey, Lehigh Valley, Western Pennsylvania, Ohio, or North Carolina; a property type; an optional maximum price; and extra keywords. **Prepare searches** generates three Google searches restricted to the property sources. Each link opens results in a new tab. An additional direct Realtor.com link applies the city, broad multifamily category, and price filter. Exact unit type, keywords, and nearby-town expansion are Google search hints, not guaranteed portal filters. Nearby towns are an explicit preset list, not an exact mile radius. Google may return expired listings and general market pages; verify details on the source.

Copy an individual property URL into **Save listing link** with your own label and notes. No external page is fetched, no listing facts are extracted, and saved links do not claim verified prices or availability. Only supported HTTPS property-page URLs are accepted. Tracking parameters/fragments are removed; duplicate links are rejected.

Saved links and search preferences use localStorage on the site's origin in this browser/device. They are not published to GitHub, synced to other devices, or checked by the daily workflow. Saved links remain until removed or browser data is cleared. Export/restore a JSON backup to move them to another device. Removing a link offers Undo. If storage is blocked/full, the page warns that the shortlist lasts only for the current visit. Backup restore accepts at most 500 valid links from a file under 2 MB.

The optional guided-search tools perform **no automated Google or property-portal requests** and need no account or API key. Automatic collection is provided separately by the Exa integration above, which requires a free account and a private Actions secret.

**Current data: no live listing feeds are connected.** Realtor.com, Homes.com, and Redfin are explicitly unconnected. There are no fabricated listing cards, hidden scraping adapters, paid APIs, or requests to property websites. The empty import is a valid, empty export, not a live connection.

## Use the workspace

Filter by market, property type, maximum price, and straight-line radius around Bedminster, Easton, Bethlehem, Pittsburgh, Columbus, Albany, Raleigh, or custom coordinates. Radius filtering excludes unknown coordinates. Address geocoding is not connected. Filters act on the published dataset and do not trigger live website searches. Use **Run a refresh on GitHub** to open the manual workflow (requires repository access).

Price, address, city/state/ZIP, units, beds, baths, area, source links, observed dates, and source-reported status appear on cards. Expand details for taxes, rent, lot size, year built, description, and observed price history. Missing fields stay unknown. Observation dates are not listing dates; retained records do not confirm current availability.

## Authorized data

Only add data you have permission to collect **and publicly redistribute**, such as your own records or an explicitly licensed broker export. This repository and Pages site are public. Never commit private data, credentials, or restricted MLS exports. Website accessibility or a robots.txt rule alone is not authorization.

Place an array in `imports/listings.json`. The committed array is intentionally empty. Record the actual authorization in `config/sources.json` before supplying real records. Schema:

```text
Required: address (street including unit), city, state (2 letters), zip (5 digits), url (HTTPS)
Optional: market, property_type, status, price, beds, baths, units, sqft,
          lot_sqft, year_built, annual_tax, monthly_rent, description,
          latitude and longitude (both or neither)
property_type: duplex | triplex | fourplex | multifamily | single-family | condo
market: use the exact label shown in the UI for matching
```

All numeric fields may be null. Missing status defaults to unknown. Imports are complete observations, not deltas; refreshing a static export confirms only its presence, not listing availability. Remove expired records from the export. Sources are atomic: one invalid row marks the whole source as failed. No network adapter is bundled. Additional adapters must document and enforce authorization; do not add prohibited scraping.

Identity uses normalized street (including unit), city, state and ZIP. Exact normalized addresses merge cross-source links; street abbreviations are intentionally not fuzzy matched to avoid false merges. Conflicting nonempty fields prefer the first configured source. Four-day retention runs from last observation; missing records are labeled previously observed, never automatically sold. Price history retains the latest 30 observations of price changes while a record is retained. A record rediscovered after expiry starts a new history.

## Local verification

Requires Python 3.12+ and Node 22+. No package installation or API keys needed.

```sh
python -m unittest discover -s tests -v
npm test
python -m property_finder.refresh
npm run build
python -m http.server 8000 --directory dist
```

Open http://localhost:8000. The build generates the browser catalog from `config/searches.json` and copies only `web/` into `dist/`. After editing markets, run `python scripts/sync_markets.py` and commit the generated `web/markets.js` too.

## Schedule and deployment

1. Merge the feature PR to `main`.
2. Repository **Settings → Pages → Source → GitHub Actions**. This administration setting may need the repository owner.
3. The **Refresh and deploy Property Finder** workflow runs on main pushes, manual dispatch, and daily at **7:30 AM America/New_York**, with DST handled by GitHub's timezone scheduler. Manual runs can be started in Actions → workflow → Run workflow on main.
4. The workflow tests, refreshes imports, commits `web/data/listings.json` to main to persist history, builds, and deploys Pages. Branch rules must allow the workflow bot's data commit; otherwise use an approved bot or adjust repository rules. The built-in token needs contents write and Pages/id-token permissions. No personal access token is required.
5. Expected URL after a successful deployment: https://WaseemRaza844.github.io/property-finder/ . This is an expected URL, not proof of deployment.

Source failures are published in the dataset while retained observations remain visible; the Actions summary records the failure. A malformed previous dataset or build failure stops deployment. CI on feature pushes and PRs uploads a preview artifact without publishing or writing to main.

GitHub schedule execution is best effort: jobs may be delayed or dropped, and public schedules disable after 60 days without activity. Scheduled workflows require the workflow on the default branch. See [GitHub's scheduling documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule). Public GitHub Actions and Pages avoid paid APIs; review account limits if visibility or hosting changes.


## Regional coverage and quick picks

The 12 query markets are Bedminster/Somerset County; Easton/eastern Lehigh Valley; Bethlehem/Allentown/western Lehigh Valley; Pittsburgh; Johnstown; Youngstown–Warren; Toledo; Cleveland; Columbus/Central Ohio; Cincinnati; Charlotte; and Raleigh–Durham/Triangle. Town lists are explicit query hints, not complete metro boundaries or exact radii. Region → market → town/ZIP controls organize saved results. Charlotte and the Triangle are starting search areas, not investment recommendations; background: [NC OSBM population estimates](https://www.osbm.nc.gov/blog/2025/05/16/north-carolinas-municipalities-among-fastest-growing-nation).

Four daily API calls are restricted to homes.com/property. Eight search across the allowed sources. Homes.com and Realtor.com use property-page path filters to prevent general market catalogs occupying result slots. The provider controls returned coverage; no source is guaranteed. Exact normalized street address (including unit), town, state and ZIP identify cross-source duplicates. If missing, links remain separate. Recent conflicting sold/off-market/pending evidence hides the matched property. Otherwise a current active Homes.com observation is preferred, followed by Realtor.com and Redfin. An unverified Homes.com page does not replace active evidence from another source. Cards use the chosen observation's facts without mixing numbers; alternate source links appear in details. Per-URL observations remain in the four-day published history.

Top picks follow dashboard filters but always require recent explicit for-sale evidence and a source-supported multifamily type or at least two units. Pick up to two lowest positive asking prices, then up to two other properties with the highest known unit counts. Missing required facts, single-family records, closed statuses and stale observations never qualify. Fewer than four valid picks produce fewer cards, with no invented replacements. These are sorting shortcuts, not yield, value, or investment-quality ratings.


## Homes.com coverage investigation

Eight bounded diagnostic searches were run: four domain-only queries returned 40 results but only two accepted property-page matches (the same out-of-market address), and four property-path queries returned 40 accepted property-page matches. None of the second batch supplied usable active-for-sale evidence; off-market/sold/pending pages, rental pages, and out-of-market results dominated. This demonstrates that dedicated path filtering improves retrieval but cannot guarantee fresh active inventory from Exa's index. No diagnostic rows are promoted as active or imported into the property list just to inflate coverage.

Daily rotation uses four Homes.com-only property-page calls and eight combined-source calls, with a maximum of twelve reserved requests per run. Query tasks are frozen in the reservation so a run crossing UTC midnight cannot change which sources consume the allowance. Dates use UTC for deterministic rotation. A previously observed source not scheduled for that market may remain eligible only while its original facts timestamp is within 36 hours; no timestamps are advanced. Searched-but-missing/failed sources lose eligibility. The monthly four-call diagnostic shares the ledger, bringing a 31-day scheduled month to at most 376 calls. Initial investigation used two four-call batches; the application hard cap remains 400. Search-request caps are not dollar balances; maintain disabled paid billing/top-ups.

Coverage summaries show actual source match counts and recent for-sale results. “NOT LISTED FOR SALE” and “FOR RENT” are explicitly excluded, and multiline Homes.com address titles are normalized before location parsing. No direct Homes.com requests, live crawling, search-mode upgrades, extra contents calls, or raw page-text storage are used.
