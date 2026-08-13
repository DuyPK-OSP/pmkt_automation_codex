import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { chromium } from 'playwright';

const runId='20260813T042343Z', runDir=resolve('test-results',`run-${runId}`,'case-results');
const template=(await readFile(resolve('report/templates/report-template.html'),'utf8')).split(/\r?\n/);
// Chỉ giữ phần <head>; nội dung <body> của report mẫu chứa tiêu đề Nguyên vật liệu và phải được thay toàn bộ.
const prefix=template.slice(0,30).join('\n');
const emptyReviewSeed='<script id="review-seed" type="application/json">{"version":1,"reviews":{},"testerBugs":[],"savedAt":null,"directEdits":{},"editAudit":[]}</script>';
const suffix=template.slice(109).join('\n').replace(/<script id="review-seed" type="application\/json">[\s\S]*?<\/script>/,emptyReviewSeed);
const defs=[
 ['vat-tu-hang-hoa-create-flow','them-moi-vat-tu-hang-hoa','Hàng hóa','VTHH'],
 ['vat-tu-nguyen-vat-lieu-create-flow','them-moi-vat-tu-nguyen-vat-lieu','Nguyên vật liệu','VTNVL'],
 ['vat-tu-cong-cu-dung-cu-create-flow','them-moi-vat-tu-cong-cu-dung-cu','Công cụ, dụng cụ','VTCCDC'],
 ['vat-tu-thanh-pham-create-flow','them-moi-vat-tu-thanh-pham','Thành phẩm','VTTP'],
 ['vat-tu-ban-thanh-pham-create-flow','them-moi-vat-tu-ban-thanh-pham','Bán thành phẩm','VTBTP'],
];
const index=JSON.parse(await readFile(resolve(runDir,'index.json'),'utf8'));
const jsonFiles=index.cases?.map(x=>x.file) ?? index.results?.map(x=>x.file) ?? [];
let all=[];
for(const file of jsonFiles){try{all.push(JSON.parse(await readFile(resolve(runDir,file),'utf8')))}catch{}}
if(all.length!==25){
 const {readdir}=await import('node:fs/promises');
 all=[]; for(const f of await readdir(runDir)){if(f.startsWith('TC')&&f.endsWith('.json'))all.push(JSON.parse(await readFile(resolve(runDir,f),'utf8')))}
}
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const duration=ms=>`${Math.floor(ms/60000)} phút ${((ms%60000)/1000).toFixed(2).replace('.',',')} giây`;
const browser=await chromium.launch({headless:true}), imagePage=await browser.newPage();
async function webpData(path){
 const png=`data:image/png;base64,${(await readFile(path)).toString('base64')}`;
 return imagePage.evaluate(async src=>{const img=new Image();img.src=src;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;canvas.getContext('2d').drawImage(img,0,0);return canvas.toDataURL('image/webp',.86)},png);
}
const bugKinds=[
 ['missing','thiếu trường Loại hàng hóa đặc trưng','Form thiếu trường Loại hàng hóa đặc trưng','Form phải hiển thị trường Loại hàng hóa đặc trưng.','Form thực tế không có trường Loại hàng hóa đặc trưng.'],
 ['vat','DB phải lưu Giá trị thuế GTGT','DB không lưu Giá trị thuế GTGT đúng như UI','DB phải lưu Giá trị thuế GTGT bằng 0 đúng như UI.','UI hiển thị Giá trị thuế GTGT = 0 nhưng DB lưu NULL.'],
 ['conversion','DB phải lưu Mô tả quy đổi','DB không lưu Mô tả quy đổi đúng như UI','DB phải lưu đúng Mô tả quy đổi được sinh trên UI.','UI sinh Mô tả quy đổi nhưng DB lưu NULL.'],
];
for(const [project,slug,name,prefixId] of defs){
 const cases=all.filter(x=>x.project===project).sort((a,b)=>a.source.line-b.source.line);
 const pass=cases.filter(x=>x.status==='PASS').length, fail=cases.filter(x=>x.status==='FAIL').length;
 const bugs=bugKinds.map(([kind,needle,title,expected,actual],i)=>({kind,needle,title,expected,actual,id:`BUG-${prefixId}-CF-${i+1}`,cases:cases.filter(c=>(c.errors??[]).some(e=>e.message.includes(needle)))})).filter(b=>b.cases.length);
 const evidenceDir=resolve('report/evidence',`${slug}-report`); await mkdir(evidenceDir,{recursive:true});
 for(const bug of bugs){const c=bug.cases[0];const png=(c.attachments??[]).find(a=>a.contentType==='image/png'&&(bug.kind==='missing'?a.name.includes('mismatch-test-01'):bug.kind==='vat'?a.name.includes('tax-ui-values'):a.name.includes('mismatch-test')));if(png){bug.ev=resolve(png.path);bug.evName=`${bug.id}-${c.testCaseId.split('---')[0]}.png`;await copyFile(bug.ev,resolve(evidenceDir,bug.evName));bug.data=await webpData(bug.ev)}}
 const pct=(pass/cases.length*100).toFixed(2), totalMs=cases.reduce((s,c)=>s+c.durationMs,0);
 const rows=bugs.map(b=>`<tr><td><a href="#${b.id.toLowerCase()}">${b.id}</a></td><td>Cao</td><td><div class="affected-count"><strong>${b.cases.length}</strong></div></td><td>${b.cases.map(c=>esc(c.testCaseId.split('---')[0])).join(', ')}</td><td>${esc(b.title)}</td></tr>`).join('');
 const details=bugs.map(b=>`<section id="${b.id.toLowerCase()}" data-automation-bug class="bug-collapsed"><h3>${b.id} — ${esc(b.title)}</h3><button class="review-btn collapse-btn bug-section-toggle" type="button" aria-expanded="false">Mở rộng</button><div class="source-badge auto">🤖 AUTOMATION DETECTED<span class="readonly-note">READ ONLY</span></div><div class="table-wrap bug-detail-wrap"><table class="bug-detail-table"><tbody><tr><th>Tiêu đề bug</th><td>${esc(b.title)}</td></tr><tr><th>Điều kiện tiên quyết</th><td>Đăng nhập PMKT Tendoo và mở form Thêm mới ${esc(name)}.</td></tr><tr><th>Các bước tái hiện</th><td><ol><li>Thực hiện luồng thêm mới theo testcase ${esc(b.cases[0].testCaseId.split('---')[0])}.</li><li>Lưu dữ liệu và đối chiếu DB đúng tenant.</li></ol></td></tr><tr><th>Data test</th><td>Dữ liệu unique do testcase tạo trong lần chạy ${runId}.</td></tr><tr><th>Kết quả mong đợi</th><td>${esc(b.expected)}</td></tr><tr><th>Kết quả thực tế</th><td>${esc(b.actual)}</td></tr><tr><th>Bằng chứng</th><td>${b.data?`<button class="evidence"><img src="${b.data}" alt="Bằng chứng ${b.id}"></button>`:'Không có ảnh phù hợp.'}</td></tr></tbody></table></div></section>`).join('\n');
 const main=`<body><div class="shell"><main class="report"><h1 id="top">Báo cáo kiểm thử — Thêm mới Vật tư — ${esc(name)}</h1><h2>Thông tin kiểm thử</h2><section class="run-info"><div class="run-info-item"><span>Môi trường</span><strong>PMKT Tendoo — Công ty Demo Staging</strong></div><div class="run-info-item"><span>Tài khoản test</span><strong>demo@pmkt.vn</strong></div><div class="run-info-item"><span>Ngày</span><strong>13/08/2026</strong></div><div class="run-info-item"><span>Tổng TCs</span><strong>${cases.length}</strong></div><div class="run-info-item"><span>Tổng thời gian</span><strong>${duration(totalMs)}</strong></div></section><section class="review-toolbar"><button class="review-btn primary" id="log-new-bug">🐞 Add Bug</button><button class="review-btn" id="save-draft" disabled>💾 Save</button><button class="review-btn primary" id="export-reviewed">📦 Export</button><button class="review-btn" id="back-to-top">↑ On top</button></section><h2>Tổng quan kết quả</h2><section class="summary-layout"><div class="result-charts"><div class="donut-wrap"><div class="donut" style="--pass-end:${pct}%;--fail-end:100%;--skip-end:100%"><div class="donut-center"><strong>${pct}%</strong><span>PASS RATE</span></div></div><div class="chart-legend"><div>PASS · ${pass}</div><div>FAIL · ${fail}</div><div>SKIP · 0</div><div>BLOCK · 0</div></div></div><div class="bar-chart"><div class="bar-row"><strong>PASS</strong><div class="bar-track"><div class="bar-value bar-pass" style="--target:${pct}%"></div></div><span>${pass}</span></div><div class="bar-row"><strong>FAIL</strong><div class="bar-track"><div class="bar-value bar-fail" style="--target:${(fail/cases.length*100).toFixed(2)}%"></div></div><span>${fail}</span></div></div></div><aside class="review-summary"><div class="bug-count-card"><span>🤖 AUTOMATION BUGS</span><strong id="automation-bug-count">${bugs.length}</strong></div></aside></section><div class="section-heading-actions"><h2 id="bug-summary">Tổng hợp Bugs</h2><button class="review-btn collapse-btn" type="button">Thu gọn</button></div><div class="table-wrap"><table id="bug-summary-table"><thead><tr><th>Bug ID</th><th>Mức độ</th><th>Số case ảnh hưởng</th><th>Tên case ảnh hưởng</th><th>Tóm tắt bug</th></tr></thead><tbody>${rows}</tbody></table></div><h2>Chi tiết Bug</h2>${details}<section id="tester-bugs" class="tester-bugs"><h2>MANUAL BUGS</h2><p id="no-tester-bugs">Chưa có bug tester ghi nhận.</p></section></main></div>`;
 const shims='<div hidden><button id="restore-draft"></button><strong id="tester-bug-count">0</strong><strong id="review-progress-percent">0%</strong><span id="review-progress-count"></span><div><div id="review-progress-value"></div></div></div>';
 let html=prefix.replace(/<title>.*<\/title>/,`<title>Báo cáo kiểm thử — ${name}</title>`)+`\n${main}\n${shims}\n`+suffix;
 html=html.replace('</body>',`<script id="automation-run-meta" type="application/json">${JSON.stringify({runId,project})}</script></body>`);
 await writeFile(resolve('report',`${slug}-report.html`),html,'utf8');
}
await browser.close();
console.log(`Generated 5 HTML reports from run ${runId} using report/templates/report-template.html`);
