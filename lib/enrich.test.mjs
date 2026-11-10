import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {enrichRecord,enrichDataset} from './enrich.mjs';
const book=JSON.parse(readFileSync(new URL('../data/industry-reviews.json',import.meta.url)));
const data=JSON.parse(readFileSync(new URL('../data/filings.json',import.meta.url)));
test('reviews refer to unique guarded identities and real evidence',()=>{
 assert.equal(new Set(book.reviews.map(r=>r.id)).size,book.reviews.length);
 for(const review of book.reviews){
  assert.ok(review.expectedName && review.expectedCourt && review.expectedDate);
  assert.ok(review.evidenceIds.length);
  for(const id of review.evidenceIds)assert.match(book.sources[id].url,/^https:\/\//);
  assert.equal(review.confidence,review.scope==='Debtor'?'High':'Medium');
  if(review.scope==='Group')assert.equal(review.code,undefined);
 }
});
test('high confidence codes apply only to the reviewed legal debtor',()=>{
 const row=data.filings.find(r=>r.name==='Karyopharm Therapeutics Inc.');
 const r=enrichRecord(row);assert.equal(r.industry,'Pharmaceuticals');assert.equal(r.classification.code,'2834');
 for(const change of [{name:'Different Therapeutics Inc.'},{date:'2026-10-01'},{court:'Delaware'},{id:'unknown'}]){
  const changed=enrichRecord({...row,...change});assert.equal(changed.industry,'Unclassified');assert.equal(changed.classification,undefined);
 }
});
test('group evidence is explicitly scoped and does not overwrite a new source label',()=>{
 const row=data.filings.find(r=>r.name==='KPT Texas LLC');const r=enrichRecord(row);
 assert.equal(r.classification.scope,'Group');assert.equal(r.classification.confidence,'Medium');assert.equal(r.originalIndustry,'Unclassified');
 const changed=enrichRecord({...row,sourceIndustry:'Real Estate'});assert.equal(changed.industry,'Real Estate');assert.equal(changed.classification,undefined);
});
test('enrichment changes no case counts or dates, retains originals and is idempotent',()=>{
 const once=enrichDataset(data),twice=enrichDataset(once);
 assert.deepEqual(once,twice);assert.equal(once.filings.length,data.filings.length);
 assert.deepEqual(once.filings.map(r=>[r.id,r.name,r.date,r.court,r.sourceIndustry]),data.filings.map(r=>[r.id,r.name,r.date,r.court,r.sourceIndustry]));
 assert.equal(once.classificationReview.enriched,260);assert.equal(once.classificationReview.direct,3);
});
