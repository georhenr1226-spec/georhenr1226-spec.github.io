export const SOURCE = 'https://startupstumbles.com/chapter-11-watch/';
const decode = s => s.replace(/&#x([\da-f]+);/gi, (_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&quot;/g,'"').replace(/&apos;|&#039;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ');
const plain = s => decode(s.replace(/<[^>]*>/g,'').trim());
export function parse(html, now = new Date()) {
  const cutoff = now.toISOString().slice(0,10) < '2026-12-31' ? now.toISOString().slice(0,10) : '2026-12-31';
  const filings = [], seen = new Set();
  for (const row of html.matchAll(/<tr\s+([^>]*data-company[^>]*)>([\s\S]*?)<\/tr>/gi)) {
    const attrs = Object.fromEntries([...row[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
    if(attrs['data-chapter'] !== '11' || !/^2026-\d\d-\d\d$/.test(attrs['data-date']) || attrs['data-date']>cutoff) continue;
    const url=attrs['data-url'];
    if(!/^https:\/\/(www\.)?courtlistener.com\/docket\/\d+\//.test(url||'')) continue;
    const id=url.match(/\/docket\/(\d+)/)[1];
    if(seen.has(id)) continue;
    const cells=[...row[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>plain(m[1]));
    if(cells.length<5 || !cells[0]) continue;
    seen.add(id);
    filings.push({id,name:cells[0],date:attrs['data-date'],court:cells[3],industry:attrs['data-industry']==='Other'?'Unclassified':attrs['data-industry']||'Unclassified',sourceIndustry:attrs['data-industry']||'Other',url});
  }
  if(filings.length<100) throw new Error('Source format or coverage changed; retaining the last successful snapshot.');
  filings.sort((a,b)=>b.date.localeCompare(a.date)||a.name.localeCompare(b.name));
  const refresh=html.match(/Last refresh:\s*([^<]+)/i);
  return {year:2026,collectedAt:now.toISOString(),cutoff,source:SOURCE,sourceUpdated:refresh?plain(refresh[1]):null,latestFiling:filings[0].date,filings};
}
export async function collect(){
  const response=await fetch(SOURCE,{signal:AbortSignal.timeout(18000),headers:{'User-Agent':'Chapter11Atlas/1.0 (public filing metadata dashboard)'}});
  if(!response.ok) throw new Error(`Source returned ${response.status}`);
  return parse(await response.text());
}
