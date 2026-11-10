# Chapter 11 Atlas

Live: https://my-first-website-mu-two.vercel.app/

Interactive 2026 US Chapter 11 filing monitor. Filter by industry, month, court and debtor name. Select chart bars or heatmap cells, browse source-linked dockets and export filtered CSV data.

## Data and limits

Metadata source: [Startup Stumbles — Chapter 11 Watch](https://startupstumbles.com/chapter-11-watch/), which links individual records to public CourtListener dockets. Selected-district coverage, **not a nationwide census**. Records are debtor dockets, not unique restructurings. Affiliates count separately. Source industry labels are retained; Other is displayed as Unclassified, without guessing. Labels and underlying records have not all been independently verified.

Only Chapter 11 filing dates in 2026 through the collection date are included. Chapter 15, future dates and duplicate docket IDs are excluded. The latest month is partial. Missing records do not imply no filings.

The serverless endpoint collects public metadata on visits, with a six-hour Vercel edge cache. No paid data provider, PACER login, background scheduled job or document storage. If collection fails, the UI identifies the dated bundled snapshot. Refresh does not bypass the shared cache. Unexpectedly small results are rejected to avoid presenting a broken source as zero filings.

## Maintenance

- Preview using any static server; without the API, the page uses the dated snapshot.
- For full local preview, use Vercel CLI with Node 22 or later.
- Run `npm test` for chapter/date filters, deduplication, entity decoding, industry mapping and failure safeguards.
- Run `npm run snapshot` to update the saved public dataset. Review counts before committing.
- Push to main to deploy to Vercel automatically.

Never commit secrets. CSV exports include source URLs and collection times and protect names against spreadsheet formula execution.
