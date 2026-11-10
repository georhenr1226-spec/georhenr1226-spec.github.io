import reviewBook from '../data/industry-reviews.json' with {type:'json'};
export const originalIndustry = record => record.sourceIndustry && record.sourceIndustry !== 'Other' ? record.sourceIndustry : 'Unclassified';
const reviews = new Map(reviewBook.reviews.map(review=>[review.id,review]));
export function enrichRecord(record){
  const base=originalIndustry(record);
  const result={...record,industry:base,originalIndustry:base};
  delete result.classification;
  const review=reviews.get(String(record.id));
  // Never carry an old review onto a changed debtor identity, date, or court.
  if(!review || review.expectedName!==record.name || review.expectedDate!==record.date || review.expectedCourt!==record.court) return result;
  // A newly supplied industry supersedes a group inference; direct debtor evidence takes priority.
  if(review.scope==='Group' && base!=='Unclassified') return result;
  const {expectedName,expectedDate,expectedCourt,id,evidenceIds,...classification}=review;
  const evidence=evidenceIds.map(id=>reviewBook.sources[id]);
  if(evidence.some(source=>!source || !/^https:\/\//.test(source.url))) return result;
  return {...result,industry:review.industry,classification:{...classification,reviewedAt:reviewBook.reviewedAt,evidence}};
}
export function enrichDataset(data){
  const filings=data.filings.map(enrichRecord);
  return {...data,filings,classificationReview:{version:reviewBook.version,reviewedAt:reviewBook.reviewedAt,enriched:filings.filter(r=>r.classification).length,direct:filings.filter(r=>r.classification?.scope==='Debtor').length,group:filings.filter(r=>r.classification?.scope==='Group').length}};
}
