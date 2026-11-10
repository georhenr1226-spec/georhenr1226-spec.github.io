const $=id=>document.getElementById(id);
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt=new Intl.NumberFormat('en-US');
const date=s=>new Date(s+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
let dataset=null,filtered=[],page=1,loadId=0;
const size=20;
const state={search:'',industry:'',month:'',court:''};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function matches(r,{ignoreIndustry=false,ignoreMonth=false}={}){return (!state.search||r.name.toLowerCase().includes(state.search.toLowerCase()))&&(!state.industry||ignoreIndustry||r.industry===state.industry)&&(!state.month||ignoreMonth||r.date.slice(0,7)===state.month)&&(!state.court||r.court===state.court);}
function countBy(rows,key){const counts={};for(const r of rows){const k=key(r);counts[k]=(counts[k]||0)+1;}return counts;}
function setOptions(id,values){const el=$(id),selected=el.value;el.length=1;for(const value of values){const option=document.createElement('option');option.value=value;option.textContent=value;el.append(option);}el.value=values.includes(selected)?selected:'';state[id]=el.value;}
function init(data){
 dataset=data;
 setOptions('industry',[...new Set(data.filings.map(r=>r.industry))].sort((a,b)=>(a==='Unclassified')-(b==='Unclassified')||a.localeCompare(b)));
 setOptions('court',[...new Set(data.filings.map(r=>r.court))].sort());
 const limit=+data.cutoff.slice(5,7);$('month').length=1;
 for(let i=0;i<limit;i++){const opt=document.createElement('option');opt.value=`2026-${String(i+1).padStart(2,'0')}`;opt.textContent=`${months[i]} 2026${i===limit-1?' · through '+date(data.cutoff):''}`;$('month').append(opt);}
 $('month').value=state.month;$('window').textContent=`January — ${new Date(data.cutoff+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',timeZone:'UTC'})} 2026`;
 document.querySelector('.chart-hint').textContent=`Select a bar to filter that month. ${months[limit-1]} is ${data.cutoff==='2026-12-31'?'complete':'through '+date(data.cutoff)}.`;
 render();
}
async function load(){
 const request=++loadId;$('refresh').disabled=true;$('data-status').textContent='Checking public source…';
 try{
  const response=await fetch('/api/filings',{signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('Source unavailable');
  const data=await response.json();if(!data.filings?.length)throw Error('Empty data');if(request!==loadId)return;
  init(data);$('data-status').textContent=`Source checked ${new Date(data.collectedAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} · Latest indexed filing ${date(data.latestFiling)} · Selected districts`;
 }catch{
  if(request!==loadId)return;
  if(!dataset){try{const response=await fetch('/data/filings.json');if(!response.ok)throw Error();init(await response.json());}catch{$('data-status').textContent='Data could not be loaded. Please try Refresh data.';return;}}
  $('data-status').textContent=`Saved snapshot · Collected ${date(dataset.collectedAt.slice(0,10))} · Latest filing ${date(dataset.latestFiling)} · Live source unavailable`;
 }finally{if(request===loadId)$('refresh').disabled=false;}
}
function select(key,value){state[key]=state[key]===value?'':value;$(key).value=state[key];page=1;render();}
function render(){
 if(!dataset)return;
 filtered=dataset.filings.filter(r=>matches(r));
 const sort=$('sort').value;filtered.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='oldest'?a.date.localeCompare(b.date)||a.name.localeCompare(b.name):b.date.localeCompare(a.date)||a.name.localeCompare(b.name));
 const classified=new Set(filtered.filter(r=>r.industry!=='Unclassified').map(r=>r.industry)),unknown=filtered.filter(r=>r.industry==='Unclassified').length;
 $('total').textContent=fmt.format(filtered.length);$('latest').textContent=filtered.length?date(filtered.reduce((max,r)=>r.date>max?r.date:max,'2026-01-01')):'—';$('industries').textContent=classified.size;$('unknown').textContent=filtered.length?`${Math.round(unknown/filtered.length*100)}%`:'—';$('unknown-note').textContent=`${fmt.format(unknown)} records without an industry label`;
 $('total-note').textContent=Object.values(state).some(Boolean)?'Matching current filters':'Chapter 11 debtor cases';
 renderMonthly();renderIndustry();renderHeat();renderTable();
}
function renderMonthly(){
 const rows=dataset.filings.filter(r=>matches(r,{ignoreMonth:true})),counts=countBy(rows,r=>r.date.slice(0,7)),limit=+dataset.cutoff.slice(5,7),max=Math.max(1,...Object.values(counts));
 $('monthly-chart').innerHTML=Array.from({length:limit},(_,i)=>{const key=`2026-${String(i+1).padStart(2,'0')}`,n=counts[key]||0;return `<button class="month-bar ${state.month===key?'active':''} ${i===limit-1?'partial':''}" data-month="${key}" aria-pressed="${state.month===key}" aria-label="${months[i]} 2026: ${n} tracked filings${i===limit-1?', through '+date(dataset.cutoff):''}. Filter this month." title="${months[i]}: ${fmt.format(n)} filings"><span class="bar-value">${fmt.format(n)}</span><span class="bar-fill" style="height:${n/max*185}px"></span><span class="month-label">${months[i]}</span></button>`;}).join('');
 $('monthly-chart').querySelectorAll('button').forEach(el=>el.onclick=()=>select('month',el.dataset.month));
 $('trend-note').textContent='Month selection does not hide other months';
}
function renderIndustry(){
 const rows=dataset.filings.filter(r=>matches(r,{ignoreIndustry:true})),counts=countBy(rows,r=>r.industry),industries=[...new Set(dataset.filings.map(r=>r.industry))].sort((a,b)=>(a==='Unclassified')-(b==='Unclassified')||(counts[b]||0)-(counts[a]||0)||a.localeCompare(b)),max=Math.max(1,...Object.values(counts));
 $('industry-chart').innerHTML=industries.map(ind=>{const n=counts[ind]||0;return `<button class="industry-row ${state.industry===ind?'active':''} ${ind==='Unclassified'?'unknown':''}" data-industry="${esc(ind)}" aria-pressed="${state.industry===ind}" aria-label="${esc(ind)}: ${n} filings. Filter industry."><span class="industry-label"><span>${esc(ind)}</span><b>${fmt.format(n)} <span class="subtle">/ ${rows.length?Math.round(n/rows.length*100):0}%</span></b></span><span class="industry-track"><span class="industry-fill" style="width:${n/max*100}%"></span></span></button>`;}).join('');
 $('industry-chart').querySelectorAll('button').forEach(el=>el.onclick=()=>select('industry',el.dataset.industry));
}
function renderHeat(){
 const rows=dataset.filings.filter(r=>matches(r,{ignoreIndustry:true,ignoreMonth:true})),counts=countBy(rows,r=>r.industry+'|'+r.date.slice(0,7)),max=Math.max(1,...Object.values(counts)),industries=[...new Set(dataset.filings.map(r=>r.industry))].sort((a,b)=>(a==='Unclassified')-(b==='Unclassified')||a.localeCompare(b)),limit=+dataset.cutoff.slice(5,7);
 $('heatmap').style.gridTemplateColumns=`135px repeat(${limit},minmax(48px,1fr))`;
 let html='<span></span>'+months.slice(0,limit).map((m,i)=>`<span class="heat-label heat-month">${m}${i===limit-1?'*':''}</span>`).join('');
 for(const industry of industries){html+=`<span class="heat-label">${esc(industry)}</span>`;for(let i=0;i<limit;i++){const month=`2026-${String(i+1).padStart(2,'0')}`,n=counts[industry+'|'+month]||0,t=n?Math.sqrt(n/max):0,selected=state.month===month&&state.industry===industry;html+=`<button class="heat-cell ${selected?'selected':''}" data-month="${month}" data-industry="${esc(industry)}" style="background:color-mix(in srgb,var(--heat-high) ${Math.round(t*100)}%,var(--heat-low));color:var(--heat-text)" aria-label="${esc(industry)}, ${months[i]} 2026: ${n} filings. Filter industry and month." aria-pressed="${selected}" title="${esc(industry)} · ${months[i]}: ${n}">${n||'–'}</button>`;}}
 $('heatmap').innerHTML=html;$('heatmap').querySelectorAll('button').forEach(el=>el.onclick=()=>{const same=state.industry===el.dataset.industry&&state.month===el.dataset.month;state.industry=same?'':el.dataset.industry;state.month=same?'':el.dataset.month;$('industry').value=state.industry;$('month').value=state.month;page=1;render();});
}
function renderTable(){
 const pages=Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,pages);const start=(page-1)*size,rows=filtered.slice(start,start+size);
 $('record-count').textContent=fmt.format(filtered.length);$('results-note').textContent=`${fmt.format(filtered.length)} of ${fmt.format(dataset.filings.length)} indexed Chapter 11 cases · ${Object.values(state).some(Boolean)?'Filters applied':'All tracked records'}`;
 $('records').innerHTML=rows.length?rows.map(r=>`<tr><td>${esc(r.name)}</td><td><span class="tag ${r.industry==='Unclassified'?'unclassified':''}">${esc(r.industry)}</span></td><td>${date(r.date)}</td><td>${esc(r.court)}</td><td><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open court docket for ${esc(r.name)}">Docket ↗</a></td></tr>`).join(''):'<tr><td colspan="5" class="empty">No tracked filings match these filters. Try another month, industry or search.</td></tr>';
 $('page-note').textContent=filtered.length?`${fmt.format(start+1)}–${fmt.format(Math.min(start+size,filtered.length))} of ${fmt.format(filtered.length)} · Page ${page} of ${pages}`:'0 results';$('prev').disabled=page===1;$('next').disabled=page===pages;$('export').disabled=!filtered.length;
}
for(const id of ['search','industry','month','court'])$(id).addEventListener(id==='search'?'input':'change',()=>{state[id]=$(id).value.trim();page=1;render();});
$('sort').onchange=()=>{page=1;render();};$('prev').onclick=()=>{page--;renderTable();};$('next').onclick=()=>{page++;renderTable();};
$('reset').onclick=()=>{for(const key in state){state[key]='';$(key).value='';}page=1;render();};$('refresh').onclick=load;
$('export').onclick=()=>{const cell=v=>'"'+String(v).replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';const csv=[['Debtor','Chapter','Filing date','Industry','Source industry','Court','Public docket','Collection date','Metadata source'],...filtered.map(r=>[r.name,11,r.date,r.industry,r.sourceIndustry,r.court,r.url,dataset.collectedAt,dataset.source])].map(row=>row.map(cell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='chapter-11-2026-filtered.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
// Render the bundled snapshot promptly while the public collector is checked.
fetch('/data/filings.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{if(!dataset)init(data);}).catch(()=>{});
load();
