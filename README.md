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

## Reviewed industry enrichment

The current review batch adds 260 classifications: 3 debtor-specific SEC SIC mappings (high editorial confidence) and 257 documented corporate-group mappings (medium). Group industries describe the group, not the standalone legal debtor. The public review register in data/industry-reviews.json records exact docket ID, expected name/date/court, evidence sources, method and review date. Changed identities are not enriched. Newly provided source labels supersede group inferences. Collection refreshes reapply the reviewed mappings; new companies are not automatically researched.

The Industry view control supports enhanced labels, debtor evidence plus original labels, and original source labels. All charts and CSV exports follow the selected view. Every row retains its original source industry. Expand the classification evidence in a row to inspect its basis. Source classifications outside this review batch remain unreviewed.
