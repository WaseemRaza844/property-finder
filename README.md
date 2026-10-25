# Property Finder

A free, dependency-free property discovery workspace focused on duplexes, triplexes, and multifamily homes. Python validates authorized exports; GitHub Actions retains observations and publishes a responsive static site to GitHub Pages.

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
