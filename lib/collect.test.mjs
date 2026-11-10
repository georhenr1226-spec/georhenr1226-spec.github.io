import test from 'node:test';
import assert from 'node:assert/strict';
import {parse} from './collect.mjs';
const row=(id,{chapter='11',date='2026-06-02',industry='Retail',url=`https://www.courtlistener.com/docket/${id}/example/`}={})=>`<tr data-company="example" data-industry="${industry}" data-chapter="${chapter}" data-date="${date}" data-url="${url}"><td>A &amp; B &#39;Co&#39;</td><td>Ch. ${chapter}</td><td>Jun 2</td><td>Delaware</td><td>${industry}</td></tr>`;
const base=Array.from({length:100},(_,i)=>row(i+100)).join('');
test('filters chapter, year and cutoff; deduplicates by docket ID',()=>{
 const result=parse(base+row(100)+row(201,{chapter:'15'})+row(202,{date:'2025-11-01'})+row(203,{date:'2026-11-11'})+row(204,{url:'https://example.com/fake'})+row(205,{industry:'Other'}),new Date('2026-11-10T12:00:00Z'));
 assert.equal(result.filings.length,101);
 assert.equal(new Set(result.filings.map(r=>r.id)).size,101);
 assert.equal(result.filings[0].name,"A & B 'Co'");
 assert.equal(result.filings.find(r=>r.id==='205').industry,'Unclassified');
 assert.equal(result.cutoff,'2026-11-10');
 assert.equal(result.latestFiling,'2026-06-02');
});
test('rejects broken sources rather than publishing zero counts',()=>assert.throws(()=>parse('<html>Unavailable</html>'),/Source format/));
test('caps the dataset at year-end 2026',()=>{
 const result=parse(base+row(206,{date:'2027-01-01'}),new Date('2027-02-01T00:00:00Z'));
 assert.equal(result.filings.length,100);assert.equal(result.cutoff,'2026-12-31');
});
