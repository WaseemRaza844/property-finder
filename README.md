# Property Finder

## Section 8 & Seller Finance investment screener

A **fourth, independent view** called **Section 8 & Seller Finance** analyzes for-sale, $100K-or-less, at-least-2BR candidates already gathered in the affordable workspace. It uses the **same saved Exa results** and does **not** spend additional searches merely because a user switches tabs. Every property card displays asking price, HUD rent benchmark (or user-entered gross rent), modeled monthly cash flow, and **total upfront cash needed**, with the source/assumptions disclosed directly on the card. Cards are sorted by modeled cash flow by default; missing verified rents sort last. You can filter by a $20K–$25K cash budget, a $500 monthly target, and listings that explicitly mention seller financing. Financial assumptions are editable, including down payment, annual rate, closing costs, repairs, initial reserves, property taxes, insurance, and reserves.

**Rent provenance:** FY2027 HUD Fair Market Rents are seeded **only for Muncie/Delaware County, IN (2BR $1,145; 3BR $1,438) and Topeka/Shawnee County, KS (2BR $1,172; 3BR $1,564)**. Source: [HUD USER FY2027](https://www.huduser.gov/portal/datasets/fmr.html), effective October 1, 2026, with public FY2027 summaries at [Muncie](https://fairmarketrentlookup.com/indiana/muncie/) and [Topeka](https://fairmarketrentlookup.com/kansas/topeka/). No rent is invented for unverified ZIPs, other towns, or bedroom counts. Those cards show **Rent needed** and let you enter a researched gross rent; the local override is stored on this device only. HUD FMR is **not** the local PHA's payment standard, approval of contract rent, rent reasonableness, rental income, or evidence of an approved voucher tenant. Small Area FMR ZIP rules, utilities, tenant share, unit condition, and rent reasonableness can change approved terms. Local PHA confirmation is mandatory.

**Conventional what-if defaults:** down payment 25%; interest 7.5%, 30-year amortization; closing costs 3%, initial cash reserves $2,000 and upfront rehab $0; monthly repairs $100, capital reserves $75, insurance $125; annual property tax 1.5%; vacancy 5% and management 10%; $150 gross HUD rent allowance deducted for tenant-paid utilities. These are **illustrative placeholders**, not quotes or empirically measured local expenses. Cash to close = down + closing + upfront repairs + initial reserves. Cash flow = (gross benchmark/entered rent − utility deduction) − debt service − estimated property tax − insurance − repairs − capital reserve − utilities − vacancy − management. Rates, taxes and repair budgets can substantially change the answer. Other omitted costs include PMI, HOA, leasing commissions, lender fees beyond assumed closing costs, inspections, additional utilities, turnover, tax on rental income, and eventual balloon payouts.

**Seller finance:** One of the existing affordable-market query slots alternates toward explicitly advertised seller carry/owner financing every other day, with no additional Exa requests. Only source-supported wording creates the seller-finance flag; the calculator's 15%-down/5%-interest/30-year *seller scenario* is an editable hypothetical, **not** a verified offer. Seller notes may involve balloon payments, non-amortizing terms, or title issues; obtain a written term sheet and legal/title review before treating it as financeable.

The dashboard highlights scenarios that meet an illustrative cash and cash-flow threshold. This **does not** certify Section 8 eligibility, funding, current listing availability, positive cash flow, underwriting eligibility, habitability or guaranteed returns. Final investment diligence requires property inspection, housing-authority rules and payment standards, rental comparables, lender/seller terms, taxes, insurance and local property management quotes.


## Nationwide move-in-ready house search under $100,000

A third, separate dashboard workspace, **Move-in Ready · Under $100K**, searches 33 selected U.S. city markets generally at or above approximately 50,000 people, rather than isolated rural communities. The candidate-market list includes mid-sized urban areas in OH, PA, NY, MI, IN, KS, MO, OK, LA, MS, AL, GA and CO. Population is a **market-selection screening guideline**, not a verified population estimate attached to each property, and does not guarantee neighborhood rental demand or safety.

The listing screen **requires indexed evidence** for an active for-sale status, a numeric asking price of $100,000 or less, and at least two bedrooms. The strict default also requires evidence of single-family housing and explicit current-page condition wording such as "move-in ready", "turnkey" or "recently renovated". A clearly labeled **Include candidates with unverified condition or house type** checkbox reveals otherwise qualified properties for manual review. It does not turn them into verified move-in-ready listings. Manufactured homes, land, auctions, fixer-uppers, sold and pending listings are excluded where identifiable. Indexed source information can be incomplete or outdated; an inspection, contractor estimate and listing-agent confirmation are essential.

The new workspace includes an illustrative **rental cash-flow scenario**. Enter property price, a $20,000/$25,000/$30,000 down payment, assumed rate, expected rent, monthly taxes, insurance, repairs/capital reserve, vacancy and management allowance. The calculator requires the key inputs; it never invents rents or shows a "profitable" badge without information. The illustrative 30-year payment and operating-cost subtraction **omit** closing costs, PMI, HOA/utility expenses, income taxes and certain risks. This is a screening worksheet, not verified positive cash flow or an investment recommendation.

The existing 12-daily-query limit is shared across **four regional, four college-town and four affordable-market searches** (when all three lanes are configured). The budget-pacing logic distributes any smaller remaining daily allowance across those lanes. Adding the third lane **reduces the per-day coverage** of the earlier categories; it does not add paid calls. City presets rotate, so newly configured markets will not immediately contain search results. Reloading the static GitHub Pages site shows the latest committed indexed data; it cannot privately authorize new search queries itself.


## Fresh-first dashboard and discovery timestamps (November 2026)

Quick Look puts up to four most recently first-discovered multifamily properties at the top, with New labels reserved for records first seen by Property Finder within 72 hours. Two older value-comparison slots may follow. Full results default to Newest discovery first. Each card shows First discovered and Last indexed; neither is the original MLS posting date, which is not reliably supplied by the indexed source.

The catalog expands to **169 markets: 48 regional and 88 college-town presets**, adding Columbia (MO), Lincoln (NE), Champaign–Urbana (IL), Charlottesville (VA), Knoxville (TN), Baton Rouge (LA), Lexington (KY), Eugene and Corvallis (OR), Pullman (WA), Moscow (ID), and Logan (UT). Six regional and six college markets still rotate within twelve requests daily; adding markets does not create live daily coverage for every town.

Main-branch pushes now **deploy without running additional paid-quota property searches**. The daily scheduled workflow and explicit manual dispatch still collect properties. The 400-request monthly cap remains unchanged. When the allowance is exhausted, the dashboard shows retained indexed records and a status message rather than claiming a fresh search. Search prompts ask for recently listed or updated sale pages but are dependent on what the search index returns.


## Sticky navigation and expanded U.S. searches

A persistent top navigation offers **Home**, **Top picks**, **All listings**, and **Saved links** from any scroll position. The Home shortcut and brand return to the page introduction without reloading. Theme and text-size selectors remain in the sticky bar. Anchor destinations adjust dynamically to its height so headings are not hidden behind the bar.

The catalog now contains **169 search presets** across **13 categories**: **48 regional markets** and **88 college-town markets**. Regional coverage adds Southern New Jersey, Delaware, Maryland, Central Pennsylvania, South Carolina and Georgia, broadens North Carolina, and retains Central New Jersey, Lehigh Valley, Western Pennsylvania, Ohio and Upstate/Western New York. College-town coverage remains its own workspace and expands nationally to Texas, Oklahoma, Arizona, Georgia, Alabama, South Carolina, Mississippi, Arkansas, Kansas, Iowa, Indiana, Wisconsin, Michigan, Colorado, Florida and more. A university label is a geographic clue, **not evidence of student demand, profitability or positive cash flow**.

The daily GitHub Action still makes **at most twelve searches**: four regional (Bedminster and Easton plus two rotating markets), four rotating college-town and four rotating affordable searches. Every market receives periodic, not daily, search coverage. Indexed observations are kept up to **21 days** to span the expanded rotation; stale listings remain explicitly marked for source verification. Newly added markets do not automatically have property data until their first scheduled/manual collection. No added paid infrastructure is required.


## Separate regional and college-town workspaces

The dashboard has **Regional Markets** and **College Towns** tabs plus matching landing-page shortcuts. Switching tabs replaces the visible listing pool, top picks, region/market choices and counts, and clears filters from the previous workspace. Reloads default to Regional Markets, so a previous college-town filter cannot silently hide ordinary listings. In College Towns, choose a state and then a university-centered market; market banners show university names where known. Results from a single property may be found in multiple source URLs, but results are deduplicated only within the selected workspace.

The nightly 12-request Exa budget is split into **six regional** and **six college-town** discovery requests. Regional daily coverage starts with Bedminster, Easton and Bethlehem, plus three rotating regional markets across Pennsylvania, New Jersey, Delaware, Maryland, Ohio, the Carolinas, Georgia and Upstate/Western New York. Six other college-town markets rotate independently. These are two lanes within the **same GitHub Action**, not separate paid services or live browser searches. A search for a college town asks for nearby *for-sale multifamily properties*, not university pages, dormitories or rental listings. The API is still only a search index, and listing links and investment potential must be confirmed.


## Themes, Upstate New York and college towns

The sticky header includes a **Theme** selector with Clear Light (default), Coastal Blue, Forest, and Slate Dark. Themes use clearer contrast for smaller labels, inputs, property cards, and disclosure panels. Your selection is stored only in this browser. **Explore college towns** switches to a dedicated college-town workspace; the same college-town markets also appear in the guided-search selectors. University names identify nearby institutions, **not guaranteed rental demand, yield, or a university-endorsed property**. Confirm rental regulations, student demand, vacancy, price and availability independently.

The market catalog contains 169 selections across 13 region groups, including 88 nationwide college-town presets and added Southern NJ, Delaware, Maryland, Central PA, South Carolina and Georgia regions. **Only twelve markets are queried per day**, including three daily priority regional markets, three rotating regional markets and six rotating college-town markets. Both lanes rotate their remaining markets on a daily schedule; the catalog may grow independently. Dashboard filters never launch live API requests. Results from unscheduled markets are retained at most four days, and freshness rules may hide them until the next search. The monthly request cap stays at 400; no paid service is added.


### Why reloading the page does not start a search

This site is deployed on **static GitHub Pages**. Browser reloads fetch the latest committed JSON (with cache disabled) and display older for-sale observations, even if 36-hour freshness has passed. No public browser endpoint can safely start an authenticated GitHub Actions run with repository permissions or an API key. Use **Run fresh searches on GitHub** to start a `workflow_dispatch` run manually. If no current results are available, the dashboard falls back to `latest-successful.json` (labeled archived). When even that snapshot is absent, the UI displays an actionable empty state rather than inventing listings. The snapshot and 21-day retention are meant to help with the 8-day regional rotation, not to guarantee current availability.

### College-town context and investment limitations

The college region now includes 88 dedicated market presets across several states, with university names displayed beside listing-group headers when that group contains college-market observations. These are **proximity descriptions, not evidence of investment performance**. Prices, vacancy, property taxes, financing, local lease rules and maintenance costs must be checked individually before drawing cash-flow conclusions. Homes.com is given six dedicated search requests of twelve daily requests; mixed-source queries and cross-site deduplication continue to use verified status as the primary criterion, then prefer Homes.com when comparable evidence exists. A higher share of Homes.com queries does not guarantee live or active Homes.com results.

## Automatic search discovery (Exa Lite)

Automatic discovery collects individual property-page URLs, retrieves Exa Lite's indexed text, extracts supported numeric facts/status evidence, deduplicates links, and retains up to twenty-one days of indexed observations in `web/data/discoveries.json`, plus the last successful snapshot in `web/data/latest-successful.json`. It does not fetch property websites directly, publish raw text/descriptions/photos, invent missing facts, or guarantee live availability. Full licensed listing ingestion remains separate.

The optional **Fresh within 36 hours** view requires an explicit for-sale/active line in the current indexed section, fact retrieval within 36 hours, and either observation in the latest run or a source explicitly not scheduled in the latest rotation. Sold, off-market, pending, contingent, and coming-soon results are hidden. The default **Latest saved for-sale results** view also includes older observations marked for verification; **Include unverified** expands to unknown statuses. Closed results stay hidden. Absence of a sold phrase is never treated as proof of active status. Historical sales/price/tax sections and comparable-home sections do not supply current facts. This conservative parser can omit valid properties; indexed text can lag the real site.

Numbered results group by actual town/ZIP when a usable title/URL supplies it, or by query market/source. Missing town/ZIP have explicit groups. Price, beds, baths, area, units and property type appear at the top. Duplex/triplex/fourplex unit counts follow an explicit source type; other values stay unknown. Sort by price (both directions), town, market, beds, area, units or discovery date; unknown numeric values sort last. Price caps exclude unknown prices. **Require price, beds, area & units** hides incomplete records. Compact rows and collapsible groups reduce scrolling. View preferences stay in this browser.

### Activate the free search API

1. Create your account at https://dashboard.exa.ai and stay on the free Starter plan without enabling PAYG or automatic top-ups. Exa currently advertises $10 of monthly free credits with no payment method required: https://exa.ai/pricing . Review its terms during signup. This integration uses Lite search only, ten results maximum, with up to 16,000 characters of cached index text per result for fact extraction. No extra contents calls, live crawling, summaries, or generated answers are requested. Raw text is discarded after parsing; only facts and a status line up to 120 characters are stored. Provider access does not grant rights to republish entire listing pages.
2. In this repository, Settings → Secrets and variables → Actions → New repository secret: name `EXA_API_KEY`, value your key. Never place the key in a file, browser code, issue, or chat. The old `TAVILY_API_KEY` secret is not used and may be removed. The key is supplied only to the search steps and sent in the `x-api-key` header to `https://api.exa.ai/search`; redirects are blocked.
3. Run **Refresh and deploy Property Finder** on `main`, or wait for 7:30 AM America/New_York. After it finishes, reload the dashboard. New links appear automatically under **Automatic discovery**, without copy/paste. The manual shortlist remains optional and browser-local.

Twelve Lite searches per refresh cover six regional markets (three priority, three rotating) and six independently rotating college towns. Dedicated Homes.com property-path queries rotate within each daily batch. Each query returns up to 10 results. A daily run uses at most 372 requests in a 31-day month, plus four monthly diagnostic requests, leaving 24 requests for manual runs under the unchanged 400-request cap. At published prices of $4/1,000 Lite requests plus $1/1,000 text pages, budget conservatively about $5.21/month for daily runs; the 400-request application cap allows up to 4,000 text results (about $5.60 total). These are estimates, not a provider billing guarantee; check current pricing and keep paid billing/top-ups disabled. The ledger counts **search requests, not dollars or Exa credits**. Reservations are committed before requests; failure to persist prevents requests. Reruns do not spend again; unused reservations are not refunded. There are no retries, pagination, additional extraction requests, or search-mode upgrades. Use a dedicated key; this budget does not know other account usage. The existing monthly ledger is preserved.

Queries are editable in `config/searches.json` (up to twelve queries **per run**; larger catalogs rotate automatically). Dashboard filters operate on saved results; exact mile-radius filtering is not available without verified coordinates. GitHub Pages cannot safely hold an API key or directly launch authenticated workflow requests, so **Run fresh searches on GitHub** opens the workflow for the repository owner. Its results are published back after completion. This is scheduled/manual batch discovery, not an instant browser-to-provider search.

Missing key, exhausted allowance, provider errors, partial success, and no accepted matches have separate visible states. Failed searches keep prior links without updating their last-seen dates. Unexpected internal failures stop deployment. Old links expire twenty-one days after last discovery; rediscovery after expiration begins a new history.

A free, dependency-free property discovery workspace focused on duplexes, triplexes, and multifamily homes. Prepare searches across Realtor.com, Redfin, and Homes.com, then keep promising property links in a browser-local shortlist. Python also supports authorized exports; GitHub Actions retains those imported observations and publishes the site to GitHub Pages.

## Unified search and saved links

Choose a regional or college-town market in one of the 13 categories; a property type; an optional maximum price; and extra keywords. **Prepare searches** generates three Google searches restricted to the property sources. Each link opens results in a new tab. An additional direct Realtor.com link applies the city, broad multifamily category, and price filter. Exact unit type, keywords, and nearby-town expansion are Google search hints, not guaranteed portal filters. Nearby towns are an explicit preset list, not an exact mile radius. Google may return expired listings and general market pages; verify details on the source.

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
3. The **Refresh and deploy Property Finder** workflow builds on main pushes without launching property searches; manual dispatch and the daily 7:30 AM America/New_York schedule collect new results. Scheduled start times may be delayed by GitHub. Manual runs can be started in Actions → workflow → Run workflow on main.
4. The workflow tests, refreshes imports, commits `web/data/listings.json` to main to persist history, builds, and deploys Pages. Branch rules must allow the workflow bot's data commit; otherwise use an approved bot or adjust repository rules. The built-in token needs contents write and Pages/id-token permissions. No personal access token is required.
5. Expected URL after a successful deployment: https://WaseemRaza844.github.io/property-finder/ . This is an expected URL, not proof of deployment.

Source failures are published in the dataset while retained observations remain visible; the Actions summary records the failure. A malformed previous dataset or build failure stops deployment. CI on feature pushes and PRs uploads a preview artifact without publishing or writing to main.

GitHub schedule execution is best effort: jobs may be delayed or dropped, and public schedules disable after 60 days without activity. Scheduled workflows require the workflow on the default branch. See [GitHub's scheduling documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule). Public GitHub Actions and Pages avoid paid APIs; review account limits if visibility or hosting changes.


## Regional coverage and quick picks

The 12 query markets are Bedminster/Somerset County; Easton/eastern Lehigh Valley; Bethlehem/Allentown/western Lehigh Valley; Pittsburgh; Johnstown; Youngstown–Warren; Toledo; Cleveland; Columbus/Central Ohio; Cincinnati; Charlotte; and Raleigh–Durham/Triangle. Town lists are explicit query hints, not complete metro boundaries or exact radii. Region → market → town/ZIP controls organize saved results. Charlotte and the Triangle are starting search areas, not investment recommendations; background: [NC OSBM population estimates](https://www.osbm.nc.gov/blog/2025/05/16/north-carolinas-municipalities-among-fastest-growing-nation).

Six daily API calls are restricted to homes.com/property. Six search across the allowed sources. Homes.com and Realtor.com use property-page path filters to prevent general market catalogs occupying result slots. The provider controls returned coverage; no source is guaranteed. Exact normalized street address (including unit), town, state and ZIP identify cross-source duplicates. If missing, links remain separate. Recent conflicting sold/off-market/pending evidence hides the matched property. Otherwise a current active Homes.com observation is preferred, followed by Realtor.com and Redfin. An unverified Homes.com page does not replace active evidence from another source. Cards use the chosen observation's facts without mixing numbers; alternate source links appear in details. Per-URL observations remain in the four-day published history.

Top picks follow dashboard filters and require indexed active multifamily evidence or at least two units, with up to four newest eligible discoveries followed by two price/unit-count comparisons. A New badge means first indexed in the past 72 hours, not newly posted on MLS. Previously indexed links remain labeled for verification, never falsely marked freshly posted. These are sorting shortcuts, not investment ratings.


## Homes.com coverage investigation

Eight bounded diagnostic searches were run: four domain-only queries returned 40 results but only two accepted property-page matches (the same out-of-market address), and four property-path queries returned 40 accepted property-page matches. None of the second batch supplied usable active-for-sale evidence; off-market/sold/pending pages, rental pages, and out-of-market results dominated. This demonstrates that dedicated path filtering improves retrieval but cannot guarantee fresh active inventory from Exa's index. No diagnostic rows are promoted as active or imported into the property list just to inflate coverage.

Daily rotation uses six Homes.com-only property-page calls and six combined-source calls, with a maximum of twelve reserved requests per run. Query tasks are frozen in the reservation so a run crossing UTC midnight cannot change which sources consume the allowance. Dates use UTC for deterministic rotation. The strict freshness filter keeps 36-hour eligibility. The default shows prior for-sale indexed evidence, clearly labeled as unverified and with its original retrieval time; no timestamps are advanced. Searched-but-missing/failed sources lose eligibility. The monthly four-call diagnostic shares the ledger, bringing a 31-day scheduled month to at most 376 calls. Initial investigation used two four-call batches; the application hard cap remains 400. Search-request caps are not dollar balances; maintain disabled paid billing/top-ups.

Coverage summaries show actual source match counts and recent for-sale results. “NOT LISTED FOR SALE” and “FOR RENT” are explicitly excluded, and multiline Homes.com address titles are normalized before location parsing. No direct Homes.com requests, live crawling, search-mode upgrades, extra contents calls, or raw page-text storage are used.

<!-- Manual affordable-category refresh requested on 2026-11-26; keyword marker deliberately limited to this commit. -->
