import {readFile,writeFile} from 'node:fs/promises';
import {collect,parse} from '../lib/collect.mjs';
const data=process.argv[2]?parse(await readFile(process.argv[2],'utf8')):await collect();
await writeFile(new URL('../data/filings.json',import.meta.url),JSON.stringify(data));
console.log(JSON.stringify({records:data.filings.length,latest:data.latestFiling,industries:[...new Set(data.filings.map(f=>f.industry))],months:[...new Set(data.filings.map(f=>f.date.slice(0,7)))]}));
