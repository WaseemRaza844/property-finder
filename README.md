# Property Finder

## Automatic search discovery (Tavily)

Automatic discovery collects individual property-page URLs and short search-result titles, deduplicates links, and saves four days of observations in `web/data/discoveries.json`. It does not fetch property websites, copy snippets/descriptions/photos, infer prices, or confirm availability. Market labels are query matches, not verified geography. Search coverage is incomplete and can include stale/sold/unrelated properties. Full licensed listing ingestion remains separate.

### Activate the free search API

1. Create your account at https://app.tavily.com and keep the **Researcher/free** plan. Tavily currently advertises 1,000 free credits/month, no card, and stops requests when free credits run out: https://www.tavily.com/pricing . Review its terms during signup: https://www.tavily.com/terms . This integration uses basic search only, no generated answers/extraction/crawling. Provider access does not grant rights to republish entire listing pages.
2. In this repository, Settings → Secrets and variables → Actions → New repository secret: name `TAVILY_API_KEY`, value your key. Never place the key in a file, browser code, issue, or chat. Do not enable paid/PAYG billing for a zero-cost project.
3. Run **Refresh and deploy Property Finder** on `main`, or wait for 7:30 AM America/New_York. After it finishes, reload the dashboard. New links appear automatically under **Automatic discovery**, without copy/paste. The manual shortlist remains optional and browser-local.

Nine basic searches per refresh cover three markets × three sites, up to 10 results each. A daily run uses at most 279 basic credits in a 31-day month. The app reserves at most 400 credits per UTC calendar month, including manual and failed requests. Reservations are committed to `.state/search-budget.json` before any requests; failure to persist prevents requests. Reruns of the same workflow ID do not spend again. Unused reservations are deliberately not refunded. Active reservations are consumed before requests to prevent local replay. There are no retries, additional pages, or automatically selected advanced searches. Use a dedicated key; this budget does not know usage from other applications on your Tavily account. The free provider plan is the final account-level cost boundary.

Queries are editable in `config/searches.json` (maximum nine). Dashboard market/source/title filters operate on saved results. GitHub Pages cannot safely hold an API key or directly launch authenticated workflow requests, so **Run fresh searches on GitHub** opens the workflow for the repository owner. Its results are published back to the dashboard when the run finishes. This is scheduled/manual batch discovery, not an instant browser-to-provider search. Price/radius filters are not applied to these search discoveries because their values are unknown.

Missing key, exhausted allowance, provider errors, partial success, and no accepted matches have separate visible states. Failed searches keep prior links without updating their last-seen dates. Unexpected internal failures stop deployment. Old links expire four days after last discovery; rediscovery after expiration begins a new history.

A free, dependency-free property discovery workspace focused on duplexes, triplexes, and multifamily homes. Prepare searches across Realtor.com, Redfin, and Homes.com, then keep promising property links in a browser-local shortlist. Python also supports authorized exports; GitHub Actions retains those imported observations and publishes the site to GitHub Pages.

## Unified search and saved links

Choose Bedminster NJ, Easton PA, or Bethlehem PA; a property type; an optional maximum price; and extra keywords. **Prepare searches** generates three Google searches restricted to the property sources. Each link opens results in a new tab. An additional direct Realtor.com link applies the city, broad multifamily category, and price filter. Exact unit type, keywords, and nearby-town expansion are Google search hints, not guaranteed portal filters. Nearby towns are an explicit preset list, not an exact mile radius. Google may return expired listings and general market pages; verify details on the source.

Copy an individual property URL into **Save listing link** with your own label and notes. No external page is fetched, no listing facts are extracted, and saved links do not claim verified prices or availability. Only supported HTTPS property-page URLs are accepted. Tracking parameters/fragments are removed; duplicate links are rejected.

Saved links and search preferences use localStorage on the site's origin in this browser/device. They are not published to GitHub, synced to other devices, or checked by the daily workflow. Saved links remain until removed or browser data is cleared. Export/restore a JSON backup to move them to another device. Removing a link offers Undo. If storage is blocked/full, the page warns that the shortlist lasts only for the current visit. Backup restore accepts at most 500 valid links from a file under 2 MB.

The optional guided-search tools perform **no automated Google or property-portal requests** and need no account or API key. Automatic collection is provided separately by the Tavily integration above, which requires a free account and a private Actions secret.

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

Open http://localhost:8000. The build copies only `web/` into `dist/`.

## Schedule and deployment

1. Merge the feature PR to `main`.
2. Repository **Settings → Pages → Source → GitHub Actions**. This administration setting may need the repository owner.
3. The **Refresh and deploy Property Finder** workflow runs on main pushes, manual dispatch, and daily at **7:30 AM America/New_York**, with DST handled by GitHub's timezone scheduler. Manual runs can be started in Actions → workflow → Run workflow on main.
4. The workflow tests, refreshes imports, commits `web/data/listings.json` to main to persist history, builds, and deploys Pages. Branch rules must allow the workflow bot's data commit; otherwise use an approved bot or adjust repository rules. The built-in token needs contents write and Pages/id-token permissions. No personal access token is required.
5. Expected URL after a successful deployment: https://WaseemRaza844.github.io/property-finder/ . This is an expected URL, not proof of deployment.

Source failures are published in the dataset while retained observations remain visible; the Actions summary records the failure. A malformed previous dataset or build failure stops deployment. CI on feature pushes and PRs uploads a preview artifact without publishing or writing to main.

GitHub schedule execution is best effort: jobs may be delayed or dropped, and public schedules disable after 60 days without activity. Scheduled workflows require the workflow on the default branch. See [GitHub's scheduling documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule). Public GitHub Actions and Pages avoid paid APIs; review account limits if visibility or hosting changes.
