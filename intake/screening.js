export const REVIEWED='2026-11-22';
export const SOURCES={
 seven:{label:'U.S. Courts · Chapter 7',url:'https://www.uscourts.gov/court-programs/bankruptcy/bankruptcy-basics/chapter-7-bankruptcy-basics'},
 thirteen:{label:'U.S. Courts · Chapter 13',url:'https://www.uscourts.gov/court-programs/bankruptcy/bankruptcy-basics/chapter-13-bankruptcy-basics'},
 eleven:{label:'U.S. Courts · Chapter 11',url:'https://www.uscourts.gov/court-programs/bankruptcy/bankruptcy-basics/chapter-11-bankruptcy-basics'},
 twelve:{label:'U.S. Courts · Chapter 12',url:'https://www.uscourts.gov/court-programs/bankruptcy/bankruptcy-basics/chapter-12-bankruptcy-basics'},
 eligibility:{label:'11 U.S.C. § 109 · Who may be a debtor',url:'https://uscode.house.gov/us/usc/t11/s109/'},
 means:{label:'U.S. Trustee · Means testing',url:'https://www.justice.gov/ust/means-testing'},
 counseling:{label:'U.S. Trustee · Credit counseling',url:'https://www.justice.gov/ust/credit-counseling-debtor-education-information'}
};
export const REFERRALS={lawyer:'https://www.americanbar.org/groups/legal_services/flh-home/',aid:'https://www.lsc.gov/about-lsc/what-legal-aid/i-need-legal-help'};
export const isPerson=a=>['individual','joint','sole'].includes(a.profile);
export const isBusiness=a=>['llc','partnership','nonprofit'].includes(a.profile);
export const hasBusiness=a=>isBusiness(a)||a.profile==='sole';
const arr=v=>Array.isArray(v)?v:[];
export function amount(v){return v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;}
export function budget(a){const income=amount(a.income),expenses=amount(a.expenses);return income===null||expenses===null?null:income-expenses;}
const check=(a,k,allowed,errors)=>{if(!allowed.includes(a[k]))errors.push(k);};
export function validateStep(step,a){
 const errors=[],yn=['yes','no','unsure'];
 if(step===0)check(a,'profile',['individual','joint','sole','llc','partnership','nonprofit','special'],errors);
 if(step===1){check(a,'nexus',yn,errors);if(a.nexus!=='no'&&!a.state)errors.push('state');check(a,'moved',yn,errors);if(a.profile==='special')check(a,'specialKind',['municipality','regulated','foreign','other'],errors);}
 if(step===2)check(a,'goal',hasBusiness(a)?['continue','close','unsure']:['relief','protect','unsure'],errors);
 if(step===3){check(a,'debtNature',['consumer','business','mixed','unsure'],errors);if(!arr(a.debtTypes).length)errors.push('debtTypes');if(hasBusiness(a))check(a,'guarantee',yn,errors);}
 if(step===4){check(a,'regular',['yes','variable','no','unsure'],errors);if(isPerson(a)&&(!a.household||+a.household<1||+a.household>20))errors.push('household');}
 if(step===5){check(a,'property',['home','other','none','unsure'],errors);check(a,'arrears',yn,errors);check(a,'assets',yn,errors);}
 if(step===6&&!arr(a.urgency).length)errors.push('urgency');
 if(step===7){check(a,'farm',['farmer','fisher','no','unsure'],errors);check(a,'foreign',yn,errors);check(a,'transfers',yn,errors);if(hasBusiness(a))check(a,'singleProperty',yn,errors);}
 if(step===8){check(a,'prior',['recent','older','no','unsure'],errors);check(a,'dismissed',yn,errors);if(isPerson(a))check(a,'counseling',yn,errors);}
 for(const k of step===3?['secured','unsecured']:step===4?['income','expenses','averageIncome']:[]){if(a[k]!==undefined&&a[k]!==''&&(amount(a[k])===null||Number(a[k])>1e12))errors.push(k);}
 if(step===6&&a.deadline){const d=new Date(a.deadline+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(a.deadline)||!Number.isFinite(d.getTime()))errors.push('deadline');}
 return errors;
}
export function screen(a){
 const person=isPerson(a),business=isBusiness(a),cash=budget(a),flags=[],questions=[],cards=[];
 const urgent=Boolean(a.deadline)||arr(a.urgency).some(v=>v!=='none'&&v!=='unsure');
 const specialist=a.profile==='special'||a.nexus==='no'||a.nexus==='unsure'||a.foreign==='yes';
 const incomplete=Array.from({length:9},(_,i)=>validateStep(i,a)).flat().length>0;
 const add=(id,status,reason)=>cards.push({id,status,reason});
 const farm=['farmer','fisher'].includes(a.farm);
 if(urgent)flags.push({title:'Speak with an attorney promptly',text:'You reported a deadline, collection action or a near-term business risk'+(a.deadline?' with a date of '+a.deadline:'')+'. Ask counsel about deadlines and any available protection. Completing this intake does not file a case, stop a sale or create an automatic stay.'});
 if(a.dismissed==='yes'||a.prior==='recent')flags.push({title:'Prior-case timing needs review',text:'Give counsel the case numbers, filing dates, discharge dates and dismissal orders. Prior cases can affect a new filing, discharge and the automatic stay. A recent dismissal is not automatically a bar; its reason matters.'});
 if(a.transfers==='yes')questions.push('Review recent asset transfers, insider payments and new borrowing before taking further financial action.');
 if(a.moved==='yes'||a.moved==='unsure')questions.push('Confirm venue and the exemption rules that apply after a move or change in business location.');
 if(arr(a.debtTypes).some(v=>['tax','support','student','fines'].includes(v)))questions.push('Determine how taxes, support, education debt and fines are treated. Some debts can survive bankruptcy or require separate proceedings.');
 if(a.assets!=='no'||a.property!=='none')questions.push('Value property and liens, and analyze exemptions and liquidation exposure. Property protection is not determined by this screen.');
 if(isPerson(a)&&a.counseling!=='yes')questions.push('Confirm approved pre-filing credit counseling and any applicable exception before filing.');
 if(hasBusiness(a)&&a.guarantee!=='no')questions.push('Review personal guarantees and co-debtors separately. A business filing does not automatically resolve an owner’s personal liability.');
 if(specialist){
  add('special','Specialist review first',a.specialKind==='municipality'?'A municipal debtor needs a Chapter 9 analysis, including state authorization. This individual-and-business screen cannot determine that route.':a.specialKind==='regulated'?'Banks, insurers and certain regulated businesses have special eligibility restrictions and may need a different resolution process.':'U.S. connections, foreign proceedings or a specialized entity need a jurisdiction-specific review. Counsel may consider Chapter 15 or another process when appropriate.');
  questions.unshift('Confirm the debtor’s legal identity, U.S. eligibility and any specialized or cross-border proceeding.');
 }
 if(farm){add('12','Focused attorney review','You identified a family farming or fishing operation. Ask about Chapter 12. Regular annual income, ownership, debt ceilings and the required business-income and business-debt proportions all need verification.');questions.push('Bring farm or fishing income, operating-debt records and ownership documents for a Chapter 12 analysis.');}
 if(person){
  const plan=a.regular==='yes'||a.regular==='variable';
  add('7','Potential route to explore',a.goal==='protect'||a.arrears==='yes'?'Chapter 7 may address eligible debts, but it does not provide a repayment plan to cure secured-loan arrears. Discuss means testing and property exposure before choosing it.':'Chapter 7 may offer a liquidation-based route for eligible debts. Income alone does not decide eligibility: a full means-test analysis, exemptions and case history need review.');
  add('13',plan?'Potential route to explore':'Income review needed',plan?'Your reported income makes a repayment-plan discussion relevant. Counsel must verify regular income, qualifying debt limits, plan feasibility and treatment of secured debts.':'Chapter 13 requires regular income and a feasible repayment plan. Your answers do not establish that requirement; review income sources and timing with counsel.');
  if(a.profile==='sole'||amount(a.secured)!==null&&amount(a.unsecured)!==null&&amount(a.secured)+amount(a.unsecured)>2000000)add('11','Complex-case alternative','Individual Chapter 11 may be worth comparing when a business, complex assets or debt limits make a simpler route unsuitable. Cost, feasibility and any small-business election need separate analysis.');
 }else if(business){
  add('11','Potential route to explore','Chapter 11 can provide a business-reorganization or court-supervised sale process. An attorney must assess feasibility, financing and creditor treatment. Subchapter V is an election within Chapter 11, not a separate chapter.');
  add('7','Potential wind-down route','Chapter 7 may be considered for an orderly trustee-administered liquidation. A corporation or partnership does not receive a Chapter 7 discharge; owners’ guarantees and tax responsibilities need separate review.');
  add('13','Not available to this entity','Chapter 13 is for individuals, including eligible sole proprietors. An LLC, corporation, partnership or nonprofit entity cannot use an owner’s individual Chapter 13 as its own case.');
  if(a.singleProperty==='yes')questions.push('Assess the single-asset-real-estate rules; a qualifying SARE debtor cannot elect Subchapter V.');
  else questions.push('Assess Subchapter V requirements, current debt ceilings, business-debt proportions, ownership restrictions and whether the debtor is a single-asset-real-estate business.');
 }
 let focus='An attorney-led comparison',why='Some key facts are uncertain. A bankruptcy attorney can help assess the missing details and compare filing with non-bankruptcy options.';
 if(!incomplete&&!specialist){
  if(farm){focus='A Chapter 12 discussion';why='A family farming or fishing operation can call for a specialized restructuring analysis before comparing other chapters.';}
  else if(business){focus=a.goal==='close'?'Compare Chapter 7 with a negotiated wind-down':a.goal==='continue'?'A Chapter 11 discussion':'Compare business reorganization and a wind-down';why=a.goal==='close'?'You want to wind down the business. Compare trustee liquidation, a Chapter 11 sale and alternatives outside bankruptcy.':a.goal==='continue'?'You want to preserve flexibility for the business. Reorganization requires a viable plan and attorney review; it is not guaranteed by this screen.':'You have not settled on a business outcome. Review viability, available cash, creditor pressure and personal guarantees before choosing a direction.';}
  else if(person&&a.regular==='yes'&&(a.goal==='protect'||a.arrears==='yes')&&cash!==null&&cash>0){focus='Compare Chapter 13 with Chapter 7';why='You reported regular income, money remaining in your estimated budget and a property-protection concern. Those facts make a repayment-plan comparison useful, but they do not establish plan feasibility or eligibility.';}
  else if(person&&a.goal==='relief'&&a.arrears==='no'&&cash!==null&&cash<=0){focus='A Chapter 7 means-test discussion';why='You reported a debt-relief goal and no money remaining in your estimated monthly budget. That makes a liquidation-based option worth examining; your budget is not the statutory means test.';}
 }
 if(specialist){focus='Specialist bankruptcy counsel';why='Your situation falls outside a standard individual or domestic-business screen. Establish the applicable legal process before choosing a chapter.';}
 if(incomplete){focus='Complete the intake before comparing chapters';why='Some required answers are missing. Any chapter information below is general and should not be treated as a personalized screening result.';}
 if(cash!==null&&cash<=0&&a.regular!=='no')questions.push('Reconcile your estimated budget and income. A negative budget does not itself establish Chapter 7 eligibility or rule out a later feasible plan.');
 questions.push('Verify filing-date debt limits and the legal classification of secured, unsecured, contingent and disputed obligations.','Compare debt negotiation, counseling and other non-bankruptcy options, along with fees and likely consequences.');
 // Keep jurisdiction-specific cases from receiving ordinary chapter fit labels.
 if(specialist)for(const card of cards)if(card.id!=='special'){card.status='Subject to specialist review';}
 const priority=specialist?'special':farm?'12':business&&a.goal!=='close'?'11':business?'7':person&&focus.includes('13')?'13':'7';
 cards.sort((x,y)=>(y.id===priority)-(x.id===priority));
 return {focus,why,cards,flags,questions:[...new Set(questions)],urgent,cash,incomplete,reviewedAt:REVIEWED};
}
