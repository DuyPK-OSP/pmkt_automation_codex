import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const artifactRoot = resolve(root, 'test-results/artifacts/xoa-vat-tu');
const outputPath = resolve(root, 'report/xoa-vat-tu-report.html');
const runId = 'xoa-vat-tu-20260816';
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function results() {
  if (!existsSync(artifactRoot)) return [];
  return readdirSync(artifactRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).flatMap((entry) => {
    const dir = join(artifactRoot, entry.name, `run-${runId}`, 'case-results');
    const indexPath = join(dir, 'index.json');
    if (!existsSync(indexPath)) return [];
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    return (index.caseResults ?? []).map((item) => {
      const file = join(dir, item.file);
      const record = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
      const id = /^TC-DeleteVatTu-\d+/.exec(record.title ?? '')?.[0] ?? entry.name;
      return { id, title: record.title ?? entry.name, status: item.status, durationMs: record.durationMs ?? 0 };
    });
  }).sort((a, b) => a.id.localeCompare(b.id, 'en'));
}

function findFile(base, name) {
  const queue = [base];
  while (queue.length) {
    const current = queue.shift();
    if (!existsSync(current)) continue;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const target = join(current, entry.name);
      if (entry.isDirectory()) queue.push(target);
      else if (entry.name === name) return target;
    }
  }
}

async function webp(path) {
  if (!path) return '';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const source = `data:image/png;base64,${readFileSync(path).toString('base64')}`;
  const data = await page.evaluate(async (url) => {
    const image = new Image(); image.src = url; await image.decode();
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', 0.82);
  }, source);
  await browser.close();
  return data;
}

const items = [...new Map(results().map((item) => [item.id, item])).values()];
const counts = Object.fromEntries(['PASS', 'FAIL', 'SKIP'].map((status) => [status, items.filter((item) => item.status === status).length]));
const evidence = await webp(findFile(join(artifactRoot, 'TC-DeleteVatTu-003'), '02-failure-screenshot.png'));
const bugCases = items.filter((item) => item.status === 'FAIL' && /Xác nhận|confirm/i.test(item.title)).map((item) => item.id);
if (items.some((item) => item.id === 'TC-DeleteVatTu-003' && item.status === 'FAIL') && !bugCases.includes('TC-DeleteVatTu-003')) bugCases.push('TC-DeleteVatTu-003');
const nonProduct = new Map([
  ['TC-DeleteVatTu-007', 'Automation Bug: assertion phân biệt chữ hoa “Vật Tư”, trong khi UI trả đúng thông báo nghiệp vụ với “vật tư”.'],
]);
const existingBugCases = items.some((item) => item.id === 'TC-DeleteVatTu-009' && item.status === 'FAIL') ? ['TC-DeleteVatTu-009'] : [];
const rows = items.map((item) => `<tr><td>${esc(item.id)}</td><td>${esc(item.title)}</td><td>${item.status}</td><td>${item.status === 'FAIL' ? ((bugCases.includes(item.id) || existingBugCases.includes(item.id)) ? 'Product Bug' : esc(nonProduct.get(item.id) ?? 'Đang phân tích')) : '—'}</td><td>${(item.durationMs / 1000).toFixed(2)}s</td></tr>`).join('');
const styles = readFileSync(resolve(root, 'report/templates/report-template.html'), 'utf8').match(/<style>[\s\S]*?<\/style>/)?.[0] ?? '';
const total = items.length;
const rate = total ? (counts.PASS * 100 / total).toFixed(2) : '0.00';
const bug = (bugCases.length || existingBugCases.length) ? `<h2>Tổng hợp Bugs</h2><div class="table-wrap"><table><thead><tr><th>Bug ID</th><th>Mức độ</th><th>Số case ảnh hưởng</th><th>Testcase</th><th>Tóm tắt</th></tr></thead><tbody>${bugCases.length ? `<tr><td><a href="#BUG-XVT-001">BUG-XVT-001</a></td><td>Trung bình</td><td>${bugCases.length}</td><td>${bugCases.join(', ')}</td><td>Nút xác nhận trên popup xóa hiển thị “Xóa” thay vì “Xác nhận”.</td></tr>` : ''}${existingBugCases.length ? `<tr><td><a href="#BUG-DSVT-004">BUG-DSVT-004</a></td><td>Cao</td><td>1</td><td>TC-DeleteVatTu-009</td><td>Thông báo khi mất kết nối không đúng Expected lỗi hệ thống.</td></tr>` : ''}</tbody></table></div><h2>Chi tiết Bug</h2>${bugCases.length ? `<section id="BUG-XVT-001"><h3>BUG-XVT-001 — Nút xác nhận xóa sai nhãn</h3><table class="bug-detail-table"><tbody><tr><th>Tiêu đề bug</th><td>Nút xác nhận trên popup xóa hiển thị “Xóa” thay vì “Xác nhận”</td></tr><tr><th>Điều kiện tiên quyết</th><td>Người dùng có quyền xóa; tồn tại Vật tư riêng của testcase và chưa phát sinh tham chiếu.</td></tr><tr><th>Các bước tái hiện</th><td>Mở Danh mục → Vật tư; tìm bản ghi; nhấn biểu tượng xóa và quan sát popup xác nhận.</td></tr><tr><th>Data test</th><td>Mã unique do testcase TC-DeleteVatTu-003 tạo và đối chiếu đúng tenant.</td></tr><tr><th>Kết quả mong đợi</th><td>Popup có nút “Xác nhận” và nút “Hủy”.</td></tr><tr><th>Kết quả thực tế</th><td>Popup hiển thị nút “Xóa” thay cho “Xác nhận”; nội dung cảnh báo, tên vật tư và nút “Hủy” vẫn đúng.</td></tr><tr><th>Evidence</th><td>${evidence ? `<img class="evidence" src="${evidence}" alt="BUG-XVT-001 evidence">` : 'Chưa có ảnh phù hợp'}</td></tr></tbody></table><p><a href="#top">↑ Quay lại đầu trang</a></p></section>` : ''}${existingBugCases.length ? `<section id="BUG-DSVT-004"><h3>BUG-DSVT-004 — Thông báo lỗi kết nối không đúng Expected</h3><table class="bug-detail-table"><tbody><tr><th>Tiêu đề bug</th><td>Khi request xóa bị ngắt, UI hiển thị thông báo mất kết nối thay vì lỗi hệ thống</td></tr><tr><th>Điều kiện tiên quyết</th><td>Người dùng có quyền xóa; request DELETE được giả lập mất kết nối.</td></tr><tr><th>Các bước tái hiện</th><td>Tạo vật tư; chặn request xóa; thực hiện xóa và quan sát notification.</td></tr><tr><th>Data test</th><td>Mã unique do TC-DeleteVatTu-009 tạo; bản ghi được DB xác nhận vẫn tồn tại.</td></tr><tr><th>Kết quả mong đợi</th><td>“Có lỗi xảy ra, vui lòng thử lại”.</td></tr><tr><th>Kết quả thực tế</th><td>“Mất kết nối mạng. Vui lòng kiểm tra đường truyền và thử lại.”</td></tr><tr><th>Evidence</th><td>Playwright error và runtime evidence ghi nhận chính xác Actual; ảnh cuối testcase không được sử dụng vì toast đã biến mất.</td></tr></tbody></table><p><a href="#top">↑ Quay lại đầu trang</a></p></section>` : ''}` : '';
const document = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Xóa vật tư - Test Report</title>${styles}<style>.evidence{max-width:100%;cursor:zoom-in}.checkpoint{padding:12px;border:1px solid #f59e0b;border-radius:8px;background:#fffbeb}.filters input{width:100%;box-sizing:border-box}.lightbox{display:none;position:fixed;inset:0;background:#000c;z-index:99;align-items:center;justify-content:center}.lightbox.open{display:flex}.lightbox img{max-width:95vw;max-height:95vh}</style></head><body><div class="shell"><main class="report"><h1 id="top">Báo cáo kiểm thử — Xóa Vật tư</h1><p class="checkpoint">Đã hoàn tất ${total}/12 testcase — PASS ${counts.PASS}, FAIL ${counts.FAIL}, SKIP ${counts.SKIP}.</p><h2>Thông tin kiểm thử</h2><section class="run-info"><div class="run-info-item"><span>Môi trường</span><strong>PMKT Staging</strong></div><div class="run-info-item"><span>Ngày</span><strong>16/08/2026</strong></div><div class="run-info-item"><span>Tổng TCs đã chạy</span><strong>${total}</strong></div></section><h2>Tổng quan kết quả</h2><section class="result-charts"><div class="donut-wrap"><div class="donut" style="--pass-end:${rate}%;--fail-end:100%;--skip-end:100%"><div class="donut-center"><strong>${rate}%</strong><span>PASS RATE</span></div></div></div><div class="bar-chart">${['PASS','FAIL','SKIP'].map((s) => `<div class="bar-row" title="${s}: ${counts[s]}"><strong>${s}</strong><div class="bar-track"><div class="bar-value bar-${s.toLowerCase()}" style="--target:${total ? counts[s] * 100 / total : 0}%"></div></div><span>${counts[s]}</span></div>`).join('')}</div></section><h2>Kết quả chi tiết</h2><select id="status"><option>Tất cả</option><option>PASS</option><option>FAIL</option><option>SKIP</option><option>BLOCK</option></select><div class="table-wrap"><table id="results"><thead><tr><th>TC ID</th><th>Tên testcase</th><th>Trạng thái</th><th>Phân loại</th><th>Thời lượng</th></tr><tr class="filters"><th><input data-col="0" placeholder="Lọc TC ID"></th><th><input data-col="1" placeholder="Lọc tên"></th><th></th><th><input data-col="3" placeholder="Lọc phân loại"></th><th><input data-col="4" placeholder="Lọc thời lượng"></th></tr></thead><tbody>${rows}</tbody></table></div>${bug}<h2>MANUAL BUGS</h2><p>Chưa có bug tester ghi nhận.</p></main></div><div class="lightbox"><img alt="Evidence phóng to"></div><script>const rows=[...document.querySelectorAll('#results tbody tr')],filter=document.querySelector('#status'),inputs=[...document.querySelectorAll('.filters input')];function applyFilters(){rows.forEach(r=>{const statusOk=filter.value==='Tất cả'||r.cells[2].textContent===filter.value;const columnsOk=inputs.every(i=>r.cells[Number(i.dataset.col)].textContent.toLowerCase().includes(i.value.toLowerCase()));r.hidden=!(statusOk&&columnsOk)})}filter.onchange=applyFilters;inputs.forEach(i=>i.oninput=applyFilters);const box=document.querySelector('.lightbox'),zoom=box.querySelector('img');document.querySelectorAll('.evidence').forEach(i=>i.onclick=()=>{zoom.src=i.src;box.classList.add('open')});box.onclick=()=>box.classList.remove('open');</script></body></html>`;
writeFileSync(outputPath, document, 'utf8');
console.log(`Updated ${outputPath}: ${total}/12, PASS ${counts.PASS}, FAIL ${counts.FAIL}, SKIP ${counts.SKIP}.`);
