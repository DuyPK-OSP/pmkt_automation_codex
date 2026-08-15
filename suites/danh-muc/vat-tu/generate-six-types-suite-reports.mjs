import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

/** Sửa report Dịch vụ đã sinh: bỏ section ngoài template và chuẩn hóa SKIP phụ thuộc thành BLOCK có nguyên nhân. */
if(process.argv.includes('--repair-service-report')){
 const target=path.join(process.cwd(),'report/them-moi-vat-tu-dich-vu-report.html'),temporary=`${target}.tmp`;
 let html=fs.readFileSync(target,'utf8');
 html=html.replace(/<h2>Chi tiết kết quả<\/h2>[\s\S]*?(?=<section id="tester-bugs")/,'');
 html=html.replace('<div>SKIP · 7</div><div>BLOCK · 0</div>','<div>SKIP · 0</div><div>BLOCK · 7</div>');
 html=html.replace(/(<div class="bar-row"[^>]*data-tooltip="SKIP:[^"]*"[\s\S]*?<strong>SKIP<\/strong>[\s\S]*?--target:)3\.72(%[\s\S]*?<span>)7(<\/span><\/div>)/,'$10$20$3');
 html=html.replace(/--skip-end:100%/,'--skip-end:96.28%');
 html=html.replace('<strong>PMKT Tendoo — Công ty Demo Staging</strong>','<strong>PMKT Tendoo — Công ty Demo Staging<br><a href="https://pmkt-staging.ospgroup.vn" target="_blank" rel="noopener noreferrer">https://pmkt-staging.ospgroup.vn</a></strong>');
 if(!/<strong>BLOCK<\/strong>/.test(html.match(/<div class="bar-chart">[\s\S]*?<\/section>/)?.[0]||''))html=html.replace('<div class="bar-value bar-skip" style="--target:0%"></div></div><span>0</span></div></div></section>','<div class="bar-value bar-skip" style="--target:0%"></div></div><span>0</span></div><div class="bar-row" tabindex="0"><strong>BLOCK</strong><div class="bar-track"><div class="bar-value bar-block" style="--target:3.72%"></div></div><span>7</span></div></div></section>');
 const reasons=JSON.stringify(['7 case TC_PMKT-U-00106-368 đến TC_PMKT-U-00106-374: bị chặn bởi TC_PMKT-U-00106-367 vì không hiển thị nút (+) Thêm nhanh Đơn vị tính.']);
 html=html.replace(/<script id="block-reason-summary" type="application\/json">[\s\S]*?<\/script>/g,'');
 html=html.replace('<body>',`<body><script id="block-reason-summary" type="application/json">${reasons}</script>`);
 html=html.replace(/<script>\(\(\)=>\{const t=document\.querySelector\('#detail-table'\)[\s\S]*?<\/script>(?=<\/body>)/,'');
 fs.writeFileSync(temporary,html,'utf8');fs.renameSync(temporary,target);process.exit(0);
}

const root=process.cwd(), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const configs=[
 ['hh','Hàng hóa','them-moi-vat-tu-hang-hoa-report.html'],['dv','Dịch vụ','them-moi-vat-tu-dich-vu-report.html'],
 ['nvl','Nguyên vật liệu','them-moi-vat-tu-nguyen-vat-lieu-report.html'],['ccdc','Công cụ, dụng cụ','them-moi-vat-tu-cong-cu-dung-cu-report.html'],
 ['tp','Thành phẩm','them-moi-vat-tu-thanh-pham-report.html'],['btp','Bán thành phẩm','them-moi-vat-tu-ban-thanh-pham-report.html']];
const curatedGroups={dv:[
 ['DV-01','Trung bình',[331],'Nội dung mô tả thẻ Bán thành phẩm không đúng testcase'],
 ['DV-02','Thấp',[338,344,517],'Thông báo bắt buộc Mã và Tên dùng tên trường mở rộng, khác nội dung đặc tả'],
 ['DV-03','Trung bình',[364,405,418,431,444,457],'Phím Up/Down không di chuyển dòng đang chọn trong combogrid'],
 ['DV-04','Trung bình',[367],'Không hiển thị nút thêm nhanh Đơn vị tính dù tài khoản có đủ quyền'],
 ['DV-05','Cao',[396,397,398,399,409,410,411,412,422,423,424,425,435,436,437,438,448,449,450,451],'Tài khoản ngừng hoạt động 1113 có trong DB nhưng không xuất hiện khi tìm chính xác'],
 ['DV-06','Cao',[471,472,473,474,478,479],'Dropdown Thuế tiêu thụ đặc biệt thiếu cấu trúc cột và hành vi với dữ liệu ngừng hoạt động'],
 ['DV-07','Trung bình',[490,491],'Tab Đơn vị tính khác không hiển thị cột/control STT theo đặc tả'],
 ['DV-08','Trung bình',[493,494,495],'Validation Đơn vị tính khác chỉ viền đỏ, không hiển thị thông báo lỗi']
]};
const manualFile=path.join(root,'testcases/pmkt-test/testcases/PMKT-E-00093_DanhMucDungChung/PMKT-U-00106_VatTu/TaoMoi/PMKT-U-00106_VatTu_DichVu_TaoMoi.md');
/** Đọc đúng nội dung manual testcase để bảy trường chi tiết bug giữ nguyên nghiệp vụ. */
function readManualCases(){const rows=new Map();for(const line of fs.readFileSync(manualFile,'utf8').split(/\r?\n/)){if(!/^\| \*\*TC_PMKT-U-00106-\d+\*\* \|/.test(line))continue;const c=line.split('|').slice(1,-1).map(x=>x.trim());rows.set(Number(c[0].match(/00106-(\d+)/)?.[1]),{pre:c[4],steps:c[5],data:c[6],expected:c[7],actual:c[10]})}return rows}
const template=fs.readFileSync(path.join(root,'report/templates/report-template.html'),'utf8');
const browser=await chromium.launch({headless:true}), page=await browser.newPage();
async function webp(file){if(!file)return null;const url='file:///'+file.replaceAll('\\','/');await page.goto(url);return page.evaluate(()=>{const i=document.querySelector('img'),c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext('2d').drawImage(i,0,0);return c.toDataURL('image/webp',.78)});}
for(const [key,label,out] of configs){
 const dir=path.join(root,'.suite-analysis',key,'case-results');if(!curatedGroups[key]||!fs.existsSync(path.join(dir,'index.json')))continue;const idx=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8'));
 const cases=idx.caseResults.map(x=>JSON.parse(fs.readFileSync(path.join(dir,x.file),'utf8')));
 const byNumber=new Map(cases.map(c=>[Number(c.testCaseId.match(/00106-(\d+)/)?.[1]),c])),manual=readManualCases();
 const covered=new Set(curatedGroups[key].flatMap(x=>x[2])),unclassified=cases.filter(x=>x.status==='FAIL'&&!covered.has(Number(x.testCaseId.match(/00106-(\d+)/)?.[1])));if(unclassified.length)throw new Error(`FAIL chưa phân loại: ${unclassified.map(x=>x.testCaseId).join(', ')}`);
 const total=idx.totalCompleted, rate=(idx.pass*100/total).toFixed(2), duration=cases.reduce((n,c)=>n+(c.durationMs||0),0), pct=n=>(n*100/total).toFixed(2);
 const bugs=[];for(const [id,severity,numbers,message] of curatedGroups[key]){const items=numbers.map(n=>byNumber.get(n)).filter(Boolean),representative=numbers[0],tc=items[0],m=manual.get(representative)||{};const a=(tc.attachments||[]).find(x=>/mismatch-test-01$|failure-screenshot$/.test(x.name));let file=a?.path?.replace(`test-results/run-${idx.runId}/case-results`,dir);if(file&&!path.isAbsolute(file))file=path.join(root,file);const evidence=file&&fs.existsSync(file)?await webp(file):null;bugs.push({id,severity,message,items,m,evidence})}
 const bugRows=bugs.map(b=>`<tr><td><a href="#${b.id.toLowerCase()}">${b.id}</a></td><td>${esc(b.severity)}</td><td><strong>${b.items.length}</strong></td><td>${esc(b.items.map(x=>x.testCaseId.match(/TC_PMKT-U-00106-\d+/)?.[0]).join(', '))}</td><td>${esc(b.message)}</td></tr>`).join('');
 const format=s=>esc(s||'N/A').replaceAll('&lt;br&gt;','<br>');
 const details=bugs.map(b=>`<section id="${b.id.toLowerCase()}" data-automation-bug><h3>${b.id} — ${esc(b.message)}</h3><div class="source-badge auto">🤖 AUTOMATION DETECTED</div><div class="table-wrap"><table class="bug-detail-table"><tbody><tr><th>Tiêu đề bug</th><td>${esc(b.message)}</td></tr><tr><th>Điều kiện tiên quyết</th><td>${format(b.m.pre)}</td></tr><tr><th>Các bước tái hiện</th><td>${format(b.m.steps)}</td></tr><tr><th>Data test</th><td>${format(b.m.data)}</td></tr><tr><th>Kết quả mong đợi</th><td>${format(b.m.expected)}</td></tr><tr><th>Kết quả thực tế</th><td>${format(b.m.actual||b.items[0].errors?.[0]?.message?.split('\n')[0])}</td></tr><tr><th>Bằng chứng</th><td>${b.evidence?`<button class="evidence" onclick="openEvidence(this.querySelector('img'))"><img src="${b.evidence}" alt="Evidence ${b.id}"></button>`:'Không có ảnh milestone phù hợp cho nhóm này; Actual được lấy từ JSON và manual testcase đã cập nhật.'}</td></tr></tbody></table></div><a href="#top">↑ Quay lại đầu trang</a></section>`).join('');
 const rows=cases.map(c=>`<tr><td>${esc(c.testCaseId.match(/TC_PMKT-U-00106-\d+/)?.[0]||c.testCaseId)}</td><td>${esc(c.title)}</td><td>${esc(c.status)}</td><td>${(c.durationMs/1000).toFixed(2)}s</td><td>${esc(c.status==='FAIL'?(c.errors?.[0]?.message||'').split('\n')[0]:'')}</td></tr>`).join('');
 const main=`<main class="report"><h1 id="top">Báo cáo kiểm thử — Thêm mới Vật tư — ${esc(label)}</h1><h2>Thông tin kiểm thử</h2><section class="run-info"><div class="run-info-item"><span>Môi trường</span><strong>PMKT Tendoo — Công ty Demo Staging</strong></div><div class="run-info-item"><span>Tài khoản test</span><strong>demo@pmkt.vn</strong></div><div class="run-info-item"><span>Ngày</span><strong>13/08/2026</strong></div><div class="run-info-item"><span>Tổng TCs</span><strong>${total}</strong></div><div class="run-info-item"><span>Tổng thời gian</span><strong>${(duration/60000).toFixed(2)} phút</strong></div></section><h2>Tổng quan kết quả</h2><section class="result-charts"><div class="donut-wrap"><div class="donut" style="--pass-end:${pct(idx.pass)}%;--fail-end:${pct(idx.pass+idx.fail)}%;--skip-end:100%"><div class="donut-center"><strong>${rate}%</strong><span>PASS RATE</span></div></div><div class="chart-legend"><div>PASS · ${idx.pass}</div><div>FAIL · ${idx.fail}</div><div>SKIP · ${idx.skip}</div><div>BLOCK · 0</div></div></div><div class="bar-chart">${[['PASS',idx.pass,'pass'],['FAIL',idx.fail,'fail'],['SKIP',idx.skip,'skip']].map(([s,n,c])=>`<div class="bar-row" tabindex="0" data-tooltip="${s}: ${n}/${total}"><strong>${s}</strong><div class="bar-track"><div class="bar-value bar-${c}" style="--target:${pct(n)}%"></div></div><span>${n}</span></div>`).join('')}</div></section><h2 id="bug-summary">Tổng hợp Bugs</h2><div class="table-wrap"><table id="bug-summary-table"><thead><tr><th>Bug ID</th><th>Mức độ</th><th>Số case ảnh hưởng</th><th>Tên case ảnh hưởng</th><th>Tóm tắt bug</th></tr></thead><tbody>${bugRows}</tbody></table></div><h2>Chi tiết Bug</h2>${details}<h2>Chi tiết kết quả</h2><div class="detail-filter-bar"><label>Trạng thái <select id="status-filter"><option>Tất cả</option><option>PASS</option><option>FAIL</option><option>SKIP</option><option>BLOCK</option></select></label><span class="detail-filter-count"></span></div><div class="table-wrap"><table id="detail-table"><thead><tr><th>Testcase</th><th>Tên testcase</th><th>Trạng thái</th><th>Thời lượng</th><th>Actual/Error</th></tr><tr class="column-filters">${Array.from({length:5},(_,i)=>`<th><input class="column-filter" data-col="${i}" placeholder="Lọc cột"></th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><section id="tester-bugs" class="tester-bugs"><h2>MANUAL BUGS</h2><p id="no-tester-bugs">Các bug manual và lịch sử review được bảo toàn trong review-seed bên dưới.</p></section><a href="#top">↑ Quay lại đầu trang</a></main>`;
 const toolbarMain=main.replace('<h2>Thông tin kiểm thử</h2>',`<section class="review-toolbar"><button class="review-btn primary" id="log-new-bug">🐞 Add Bug</button><button class="review-btn" id="save-draft" disabled>💾 Save</button><button class="review-btn primary" id="export-reviewed">📦 Export</button><button class="review-btn" id="back-to-top">↑ On top</button></section><div hidden><strong id="automation-bug-count">${bugs.length}</strong></div><h2>Thông tin kiểm thử</h2>`);
 let base=fs.existsSync(path.join(root,'report',out))?fs.readFileSync(path.join(root,'report',out),'utf8'):template;
 const seed=base.match(/<script id="review-seed"[^>]*>[\s\S]*?<\/script>/)?.[0]||template.match(/<script id="review-seed"[^>]*>[\s\S]*?<\/script>/)[0];
 base=template.replace(/<title>[\s\S]*?<\/title>/,`<title>Báo cáo kiểm thử — Thêm mới Vật tư — ${esc(label)}</title>`).replace(/<main class="report">[\s\S]*?<\/main>/,toolbarMain).replace(/<script id="review-seed"[^>]*>[\s\S]*?<\/script>/,seed);
 base=base.replaceAll('<div class="table-wrap"><table class="bug-detail-table">','<div class="table-wrap bug-detail-wrap"><table class="bug-detail-table">');
 for(const bug of bugs)base=base.replace(`id="${bug.id.toLowerCase()}" data-automation-bug`,`id="${bug.id.toLowerCase()}" data-automation-bug data-severity="${esc(bug.severity)}"`);
 base=base.replace('<strong>13/08/2026</strong>','<strong>14/08/2026</strong>');
 base=base.replace('</body>',`<script>(()=>{const t=document.querySelector('#detail-table'),f=[...document.querySelectorAll('.column-filter')],s=document.querySelector('#status-filter'),c=document.querySelector('.detail-filter-count');function run(){let n=0;for(const r of t.tBodies[0].rows){const ok=f.every(x=>r.cells[+x.dataset.col].textContent.toLowerCase().includes(x.value.toLowerCase()))&&(s.value==='Tất cả'||r.cells[2].textContent.trim()===s.value);r.classList.toggle('filtered-out',!ok);if(ok)n++}c.textContent=n+'/${total} testcase'}f.forEach(x=>x.oninput=run);s.onchange=run;run()})()</script></body>`);
 const target=path.join(root,'report',out),temporary=`${target}.tmp`;
 fs.writeFileSync(temporary,base);
 fs.renameSync(temporary,target);
}
await browser.close();
