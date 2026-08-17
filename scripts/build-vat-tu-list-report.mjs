import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const artifactRoot = resolve(root, 'test-results/artifacts/danh-sach-vat-tu');
const outputPath = resolve(root, 'report/danh-sach-vat-tu-report.html');
const templatePath = resolve(root, 'report/templates/report-template.html');

/** Escape nội dung lấy từ runner/manual testcase trước khi đưa vào HTML độc lập. */
function html(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

/** Đọc kết quả mới nhất của từng testcase từ các output process độc lập. */
function readCaseResults() {
  if (!existsSync(artifactRoot)) return [];
  return readdirSync(artifactRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const caseDir = join(artifactRoot, entry.name);
      const runDir = join(caseDir, 'run-danh-muc-vat-tu-20260815', 'case-results');
      const indexPath = join(runDir, 'index.json');
      if (!existsSync(indexPath)) return null;
      const index = JSON.parse(readFileSync(indexPath, 'utf8'));
      const item = index.caseResults?.[0];
      if (!item) return null;
      const recordPath = join(runDir, item.file);
      const record = existsSync(recordPath) ? JSON.parse(readFileSync(recordPath, 'utf8')) : {};
      return { id: entry.name, status: item.status, title: record.title ?? entry.name, durationMs: record.durationMs ?? 0 };
    })
    .filter(Boolean)
    .sort((left, right) => left.id.localeCompare(right.id, 'en'));
}

const bugDefinitions = [
  {
    id: 'BUG-DSVT-001', cases: ['TC-DanhSachVatTu-003'], severity: 'Trung bình',
    title: 'Tiêu đề cột Phương pháp tính giá không đúng đặc tả',
    preconditions: 'Người dùng có quyền xem danh sách vật tư; hệ thống có dữ liệu vật tư.',
    steps: 'Mở Danh mục > Vật tư và quan sát tiêu đề các cột Data Grid.', testData: 'N/A',
    expected: 'Cột hiển thị “Phương pháp tính giá vốn”.', actual: 'Cột hiển thị “Phương pháp tính giá”.', evidenceCase: 'TC-DanhSachVatTu-003', evidenceName: 'test-failed-1.png',
  },
  {
    id: 'BUG-DSVT-002', cases: ['TC-DanhSachVatTu-003'], severity: 'Trung bình',
    title: 'Cột Mã vật tư căn trái thay vì căn giữa',
    preconditions: 'Người dùng có quyền xem danh sách vật tư; hệ thống có dữ liệu vật tư.',
    steps: 'Mở Danh mục > Vật tư và quan sát căn lề cột Mã vật tư.', testData: 'N/A',
    expected: 'Dữ liệu cột Mã vật tư căn giữa.', actual: 'Dữ liệu cột Mã vật tư căn trái.', evidenceCase: 'TC-DanhSachVatTu-003', evidenceName: 'test-failed-1.png',
  },
  {
    id: 'BUG-DSVT-003', cases: ['TC-DanhSachVatTu-004'], severity: 'Trung bình',
    title: 'Empty state danh sách vật tư hiển thị sai thông báo',
    preconditions: 'Danh sách vật tư không có dữ liệu và người dùng đang ở màn hình danh sách.',
    steps: 'Mở màn hình danh sách khi API trả danh sách rỗng.', testData: 'N/A',
    expected: 'Hiển thị “Không có dữ liệu” ở giữa lưới.', actual: 'Hiển thị “Không có vật tư nào trong hệ thống”.', evidenceCase: 'TC-DanhSachVatTu-004', evidenceName: 'test-failed-1.png',
  },
  {
    id: 'BUG-DSVT-004', cases: ['TC-DanhSachVatTu-005'], severity: 'Cao',
    title: 'Lỗi tải danh sách không hiển thị đúng cảnh báo và nút Thử lại',
    preconditions: 'Giả lập mất kết nối khi tải danh sách vật tư.',
    steps: 'Mở màn hình danh sách trong lúc request bị ngắt kết nối.', testData: 'N/A',
    expected: 'Hiển thị “Lỗi hệ thống khi tải dữ liệu” và nút “Thử lại”.', actual: 'Hiển thị toast “Mất kết nối mạng. Vui lòng kiểm tra đường truyền và thử lại.”; không có nút “Thử lại”.', evidenceCase: 'TC-DanhSachVatTu-005', evidenceName: 'test-failed-1.png',
  },
  {
    id: 'BUG-DSVT-005', cases: ['TC-DanhSachVatTu-011'], severity: 'Trung bình',
    title: 'Placeholder ô tìm kiếm nhanh không đúng đặc tả',
    preconditions: 'Người dùng đang ở màn hình danh sách vật tư.',
    steps: 'Quan sát ô tìm kiếm nhanh phía trên Data Grid.', testData: 'N/A',
    expected: 'Placeholder là “Nhập từ khóa tìm kiếm…”.', actual: 'Placeholder là “Tìm kiếm...”.', evidenceCase: 'TC-DanhSachVatTu-011', evidenceName: 'test-failed-1.png',
  },
  {
    id: 'BUG-DSVT-006', cases: ['TC-DanhSachVatTu-015', 'TC-DanhSachVatTu-016', 'TC-DanhSachVatTu-017', 'TC-DanhSachVatTu-018', 'TC-DanhSachVatTu-019', 'TC-DanhSachVatTu-020'], severity: 'Cao',
    title: 'Các tiêu đề cột thiếu control mở bộ lọc',
    preconditions: 'Người dùng đang ở màn hình danh sách vật tư.',
    steps: 'Quan sát và thao tác control bộ lọc tại các tiêu đề cột có hỗ trợ lọc.', testData: 'N/A',
    expected: 'Có control mở popup gồm Ghim, sắp xếp, lọc theo giá trị/điều kiện và các nút Bỏ lọc/Lọc.', actual: 'Các tiêu đề cột không có control mở bộ lọc; các testcase phụ thuộc bị SKIP.', evidenceCase: 'TC-DanhSachVatTu-015', evidenceName: 'test-failed-1.png',
  },
  {
    id: 'BUG-DSVT-007', cases: ['TC-DanhSachVatTu-127'], severity: 'Trung bình',
    title: 'Danh sách vật tư mặc định hiển thị 10 dòng thay vì 20 dòng',
    preconditions: 'Hệ thống có ít nhất 25 bản ghi vật tư.',
    steps: 'Mở màn hình danh sách vật tư và quan sát số dòng trên trang đầu.', testData: 'Dataset AUTO_LIST_MSV2XG7I gồm 110 vật tư.',
    expected: 'Trang đầu mặc định hiển thị 20 dòng.', actual: 'Trang đầu chỉ hiển thị 10 dòng và dropdown đang chọn “10 / trang”.', evidenceCase: 'TC-DanhSachVatTu-127', evidenceName: 'test-failed-1.png',
  },
  {
    id: 'BUG-DSVT-008', cases: ['TC-DanhSachVatTu-138', 'TC-DanhSachVatTu-139', 'TC-DanhSachVatTu-140'], severity: 'Trung bình',
    title: 'Các nhãn thao tác hàng loạt không đúng đặc tả',
    preconditions: 'Người dùng đang ở danh sách vật tư và chưa chọn dòng nào.',
    steps: 'Chọn checkbox của dòng, mở menu thao tác hàng loạt rồi mở popup xác nhận xóa.', testData: 'Các vật tư thuộc dataset AUTO_LIST_MSV2XG7I.',
    expected: 'Nút hiển thị “Hành động hàng loạt”; menu hiển thị “Xóa hàng loạt”; popup dùng nút “Xác nhận”.', actual: 'Nút hiển thị “Chức năng hàng loạt”; menu và nút xác nhận đều hiển thị “Xóa”.', evidenceCase: 'TC-DanhSachVatTu-140', evidenceName: '01-mismatch-test-01.png',
  },
];

/** Tìm screenshot milestone đã được kiểm tra trực quan trong artifact của testcase. */
function findEvidence(caseId, fileName) {
  const base = join(artifactRoot, caseId);
  const queue = [base];
  while (queue.length) {
    const current = queue.shift();
    if (!existsSync(current)) continue;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const target = join(current, entry.name);
      if (entry.isDirectory()) queue.push(target);
      if (entry.isFile() && entry.name === fileName) return target;
    }
  }
  return undefined;
}

/** Chuyển screenshot sang WebP Base64 bằng Chromium để report không phụ thuộc file ngoài. */
async function toWebPDataUrl(browser, filePath) {
  const page = await browser.newPage();
  const source = `data:image/png;base64,${readFileSync(filePath).toString('base64')}`;
  const result = await page.evaluate(async (url) => {
    const image = new Image(); image.src = url; await image.decode();
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', 0.82);
  }, source);
  await page.close();
  return result;
}

const results = readCaseResults();
// Các case SKIP do thiếu control bộ lọc được bổ sung vào cùng root cause thay vì tạo bug mới.
bugDefinitions.find((bug) => bug.id === 'BUG-DSVT-006').cases = [
  'TC-DanhSachVatTu-015',
  ...results.filter((item) => ['FAIL', 'SKIP'].includes(item.status) && /^TC-DanhSachVatTu-(?:0(?:1[6-9]|[2-9]\d)|1(?:0\d|1[0-2]|2[0-6]))$/.test(item.id)).map((item) => item.id),
];
const browser = await chromium.launch({ headless: true });
const evidenceCache = new Map();
for (const bug of bugDefinitions) {
  const evidencePath = findEvidence(bug.evidenceCase, bug.evidenceName);
  if (evidencePath && !evidenceCache.has(evidencePath)) evidenceCache.set(evidencePath, await toWebPDataUrl(browser, evidencePath));
  bug.evidence = evidencePath ? evidenceCache.get(evidencePath) : '';
}
await browser.close();

const counts = Object.fromEntries(['PASS', 'FAIL', 'SKIP'].map((status) => [status, results.filter((item) => item.status === status).length]));
const total = results.length;
const passRate = total ? (counts.PASS * 100 / total).toFixed(2) : '0.00';
const duration = results.reduce((sum, item) => sum + item.durationMs, 0);
const styles = readFileSync(templatePath, 'utf8').match(/<style>[\s\S]*?<\/style>/)?.[0] ?? '';
const productBugCases = new Set(bugDefinitions.flatMap((bug) => bug.cases));
const nonProductFailures = new Map([
  ['TC-DanhSachVatTu-141', 'Automation Bug/Test Data: TC140 đã xóa AUTO_LIST_MSV2XG7I_109 và _110 nhưng TC141 tiếp tục chọn hai mã cố định này.'],
]);
const resultRows = results.map((item) => {
  const classification = item.status !== 'FAIL' ? '—' : productBugCases.has(item.id) ? 'Product Bug' : nonProductFailures.get(item.id) ?? 'Unknown';
  return `<tr><td>${html(item.id)}</td><td>${html(item.title)}</td><td>${html(item.status)}</td><td>${html(classification)}</td><td>${(item.durationMs / 1000).toFixed(2)}s</td></tr>`;
}).join('');
const bugRows = bugDefinitions.map((bug) => `<tr><td><a href="#${bug.id}">${bug.id}</a></td><td>${bug.severity}</td><td>${bug.cases.length}</td><td>${bug.cases.join(', ')}</td><td>${html(bug.title)}</td></tr>`).join('');
const bugSections = bugDefinitions.map((bug) => `<section id="${bug.id}" data-automation-bug><h3>${bug.id} — ${html(bug.title)}</h3><div class="source-badge auto">🤖 AUTOMATION DETECTED</div><table class="bug-detail-table"><tbody>${[['Tiêu đề bug', bug.title], ['Điều kiện tiên quyết', bug.preconditions], ['Các bước tái hiện', bug.steps], ['Data test', bug.testData], ['Kết quả mong đợi', bug.expected], ['Kết quả thực tế', bug.actual]].map(([key,value]) => `<tr><th>${key}</th><td>${html(value)}</td></tr>`).join('')}<tr><th>Evidence</th><td>${bug.evidence ? `<img class="evidence" src="${bug.evidence}" alt="${html(bug.id)} evidence">` : 'Không có screenshot phù hợp'}</td></tr></tbody></table><p><a href="#top">↑ Quay lại đầu trang</a></p></section>`).join('');

const document = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Danh sách vật tư - Test Report</title>${styles}<style>.status-filter{padding:8px;margin:8px 0}.filters input{width:100%;box-sizing:border-box}.evidence{max-width:100%;cursor:zoom-in}.checkpoint{padding:10px;border:1px solid #f59e0b;background:#fffbeb;border-radius:8px}.lightbox{display:none;position:fixed;inset:0;z-index:9999;background:#000c;align-items:center;justify-content:center}.lightbox.open{display:flex}.lightbox img{max-width:95vw;max-height:95vh}</style></head><body><div class="shell"><main class="report"><h1 id="top">Báo cáo kiểm thử Danh sách vật tư</h1><p class="checkpoint">Checkpoint đang chạy: đã hoàn tất ${total}/141 testcase. Các testcase chưa chạy không được tính vào số liệu bên dưới.</p><h2>Thông tin kiểm thử</h2><section class="run-info"><div class="run-info-item"><span>Môi trường</span><strong>PMKT Staging</strong></div><div class="run-info-item"><span>Ngày</span><strong>15/08/2026</strong></div><div class="run-info-item"><span>Tổng TCs đã chạy</span><strong>${total}</strong></div><div class="run-info-item"><span>Tổng thời gian</span><strong>${(duration/1000).toFixed(2)}s</strong></div></section><h2>Tổng quan kết quả</h2><section class="result-charts"><div class="donut-wrap"><div class="donut" style="--pass-end:${passRate}%;--fail-end:${(Number(passRate)+counts.FAIL*100/Math.max(total,1)).toFixed(2)}%;--skip-end:100%"><div class="donut-center"><strong>${passRate}%</strong><span>PASS RATE</span></div></div></div><div class="bar-chart">${['PASS','FAIL','SKIP'].map(status=>`<div class="bar-row" title="${status}: ${counts[status]}"><strong>${status}</strong><div class="bar-track"><div class="bar-value bar-${status.toLowerCase()}" style="--target:${(counts[status]*100/Math.max(total,1)).toFixed(2)}%"></div></div><span>${counts[status]}</span></div>`).join('')}</div></section><h2>Kết quả chi tiết</h2><select id="status-filter" class="status-filter"><option>Tất cả</option><option>PASS</option><option>FAIL</option><option>SKIP</option><option>BLOCK</option></select><div class="table-wrap"><table id="results"><thead><tr><th>TC ID</th><th>Tên testcase</th><th>Trạng thái</th><th>Phân loại/Giải thích</th><th>Thời lượng</th></tr><tr class="filters"><th><input data-col="0" placeholder="Lọc TC ID"></th><th><input data-col="1" placeholder="Lọc tên"></th><th></th><th><input data-col="3" placeholder="Lọc phân loại"></th><th></th></tr></thead><tbody>${resultRows}</tbody></table></div><h2>Tổng hợp Bugs</h2><div class="table-wrap"><table><thead><tr><th>Bug ID</th><th>Mức độ</th><th>Số case ảnh hưởng</th><th>Tên case ảnh hưởng</th><th>Tóm tắt bug</th></tr></thead><tbody>${bugRows}</tbody></table></div><h2>Chi tiết Bug</h2>${bugSections}<h2>MANUAL BUGS</h2><p>Chưa có bug tester ghi nhận.</p></main></div><div class="lightbox" id="lightbox"><img alt="Evidence phóng to"></div><script>const rows=[...document.querySelectorAll('#results tbody tr')],status=document.getElementById('status-filter'),inputs=[...document.querySelectorAll('.filters input')];function filter(){rows.forEach(row=>{const statusOk=status.value==='Tất cả'||row.cells[2].textContent===status.value;const textOk=inputs.every(input=>row.cells[Number(input.dataset.col)].textContent.toLowerCase().includes(input.value.toLowerCase()));row.hidden=!(statusOk&&textOk)})}status.onchange=filter;inputs.forEach(input=>input.oninput=filter);const box=document.getElementById('lightbox'),zoom=box.querySelector('img');document.querySelectorAll('.evidence').forEach(image=>image.onclick=()=>{zoom.src=image.src;box.classList.add('open')});box.onclick=()=>box.classList.remove('open');</script></body></html>`;
writeFileSync(outputPath, document, 'utf8');
console.log(`Updated ${outputPath}: ${total} cases, ${counts.PASS} PASS, ${counts.FAIL} FAIL, ${counts.SKIP} SKIP.`);
