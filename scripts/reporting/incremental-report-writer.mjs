import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const idSelector = (value) => String(value).replace(/[^A-Za-z0-9_-]/g, '-');
const plain = (value) => String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/** Đọc bug registry và evidence đã nhúng để deduplicate/bảo toàn giữa nhiều lần chạy. */
export function readReportBugRegistry(reportPath) {
  const absolute = resolve(reportPath);
  if (!existsSync(absolute)) return [];
  const document = readFileSync(absolute, 'utf8');
  const match = document.match(/<script type="application\/json" id="automated-bug-registry">([\s\S]*?)<\/script>/);
  if (!match) {
    let statusMap = {};
    try { statusMap = JSON.parse(document.match(/<script id="qa-team-annotations"[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? '{}').bugStatuses ?? {}; } catch {}
    return [...document.matchAll(/<section id="([^"]+)"([^>]*)>([\s\S]*?)<\/section>/g)]
      .filter((sectionMatch) => sectionMatch[2].includes('data-automation-bug') || /^BUG[-_]/i.test(plain(sectionMatch[3].match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1])))
      .map((sectionMatch) => {
      const sectionId = sectionMatch[1];
      const body = sectionMatch[3];
      const heading = plain(body.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1]);
      const bugId = heading.match(/^\S+/)?.[0] ?? sectionId;
      const summaryRow = document.match(new RegExp(`<tr>\\s*<td><a href="#${sectionId}">[\\s\\S]*?<\\/tr>`))?.[0] ?? '';
      const cells = [...summaryRow.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((item) => plain(item[1]));
      const fields = Object.fromEntries([...body.matchAll(/<tr>\s*<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/g)].map((item) => [plain(item[1]), plain(item[2])]));
      return {
        id: bugId,
        status: (statusMap[sectionId] ?? plain(body.match(/Trạng thái:\s*<\/strong>\s*([^<]+)/)?.[1])) || 'Open',
        severity: cells[1] ?? 'Trung bình',
        summary: fields['Tiêu đề bug'] ?? heading.replace(/^\S+\s*[—-]\s*/, ''),
        preconditions: fields['Điều kiện tiên quyết'] ?? '', steps: fields['Các bước tái hiện'] ?? '', testData: fields['Data test'] ?? '',
        expected: fields['Kết quả mong đợi'] ?? '', actual: fields['Kết quả thực tế'] ?? '',
        deduplicationKey: `legacy:${bugId}`,
        affectedTestcases: [...new Set((cells[3]?.match(/(?:TC|CL)[A-Za-z0-9_-]+/g) ?? []))],
        ...(body.match(/<img[^>]+src="(data:image\/webp;base64,[^"]+)"/)?.[1] ? { evidenceData: body.match(/<img[^>]+src="(data:image\/webp;base64,[^"]+)"/)?.[1] } : {}),
      };
      });
  }
  try {
    return JSON.parse(match[1].replaceAll('\\u003c', '<')).map((bug) => {
      const section = document.match(new RegExp(`<section[^>]+id="${idSelector(bug.id)}"[\\s\\S]*?<\\/section>`))?.[0] ?? '';
      const evidenceData = section.match(/<img[^>]+src="(data:image\/webp;base64,[^"]+)"/)?.[1];
      return { status: 'Open', ...bug, ...(evidenceData ? { evidenceData } : {}) };
    });
  } catch { return []; }
}

async function imageData(path) {
  if (!path || !existsSync(path)) return '';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const source = `data:image/png;base64,${readFileSync(path).toString('base64')}`;
  const result = await page.evaluate(async (url) => {
    const image = new Image(); image.src = url; await image.decode();
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', 0.82);
  }, source);
  await browser.close();
  return result;
}

function preserve(oldDocument, pattern, fallback) {
  return oldDocument?.match(pattern)?.[0] ?? fallback;
}

/** Dựng lại Automation Result từ toàn bộ template, đồng thời bảo toàn MANUAL BUGS/review/audit. */
export async function updateIncrementalReport({ reportPath, specPath, runId, expectedTotal, cases, bugs }) {
  const absoluteReport = resolve(reportPath);
  const oldDocument = existsSync(absoluteReport) ? readFileSync(absoluteReport, 'utf8') : '';
  const template = readFileSync(resolve('report/templates/report-template.html'), 'utf8');
  for (const bug of bugs) if (!bug.evidenceData && bug.evidencePath) bug.evidenceData = await imageData(resolve(bug.evidencePath));

  const counts = Object.fromEntries(['PASS', 'FAIL', 'SKIP'].map((status) => [status, cases.filter((item) => item.status === status).length]));
  const total = cases.length;
  const percent = (value) => total ? (value * 100 / total).toFixed(2) : '0.00';
  const durationMs = cases.reduce((sum, item) => sum + item.durationMs, 0);
  // Với failure không phải Product Bug, hiển thị nguyên nhân cụ thể để người đọc biết precondition/setup/teardown nào thất bại.
  const rows = cases.map((item) => {
    const classification = item.analysis?.classification ?? '—';
    const analysisDetail = item.status === 'FAIL' && item.analysis?.summary ? ` — ${item.analysis.summary}` : '';
    return `<tr><td>${esc(item.id)}</td><td>${esc(item.title)}</td><td>${item.status}</td><td>${esc(`${classification}${analysisDetail}`)}</td><td>${(item.durationMs / 1000).toFixed(2)}s</td></tr>`;
  }).join('');
  const bugRows = bugs.map((bug) => `<tr><td><a href="#${idSelector(bug.id)}">${esc(bug.id)}</a></td><td>${esc(bug.severity)}</td><td><div class="affected-count"><strong>${bug.affectedTestcases.length}</strong></div></td><td>${esc(bug.affectedTestcases.join(', '))}</td><td>${esc(bug.summary)}</td></tr>`).join('');
  const details = bugs.map((bug) => `<section id="${idSelector(bug.id)}" data-automation-bug data-severity="${esc(bug.severity ?? 'N/A')}" data-status="${esc(bug.status ?? 'Open')}" class="bug-collapsed"><h3>${esc(bug.id)} — ${esc(bug.summary)}</h3><button class="review-btn collapse-btn bug-section-toggle" type="button" aria-expanded="false">Mở rộng</button><div class="source-badge auto">🤖 AUTOMATION DETECTED<span class="readonly-note">READ ONLY</span></div><p><strong>Trạng thái:</strong> ${esc(bug.status ?? 'Open')}</p><div class="table-wrap bug-detail-wrap"><table class="bug-detail-table"><tbody><tr><th>Tiêu đề bug</th><td>${esc(bug.summary)}</td></tr><tr><th>Điều kiện tiên quyết</th><td>${esc(bug.preconditions ?? 'Điều kiện của testcase tại thời điểm chạy.')}</td></tr><tr><th>Các bước tái hiện</th><td>${esc(bug.steps ?? `Thực hiện testcase ${bug.affectedTestcases[0]} theo spec.`)}</td></tr><tr><th>Data test</th><td>${esc(bug.testData ?? 'Dữ liệu unique do testcase quản lý.')}</td></tr><tr><th>Kết quả mong đợi</th><td>${esc(bug.expected)}</td></tr><tr><th>Kết quả thực tế</th><td>${esc(bug.actual)}</td></tr><tr><th>Bằng chứng</th><td><div class="bug-detail-evidence">${bug.evidenceData ? `<button class="evidence" type="button"><img src="${bug.evidenceData}" alt="Bằng chứng ${esc(bug.id)}"></button>` : `<span class="bug-detail-empty">${esc(bug.evidenceNote ?? 'Không có screenshot phù hợp; xem error/runtime evidence.')}</span>`}</div></td></tr></tbody></table></div><p><a href="#top">↑ Quay lại đầu trang</a></p></section>`).join('');
  const registry = JSON.stringify(bugs.map(({ evidenceData, ...bug }) => bug)).replaceAll('<', '\\u003c');

  const automation = `<h2>Thông tin kiểm thử</h2><section class="run-info"><div class="run-info-item"><span>Môi trường</span><strong>PMKT Staging</strong></div><div class="run-info-item"><span>Tài khoản test</span><strong>Theo cấu hình môi trường</strong></div><div class="run-info-item"><span>Ngày</span><strong>${new Date().toLocaleDateString('vi-VN')}</strong></div><div class="run-info-item"><span>Tổng TCs</span><strong>${total}/${expectedTotal}</strong></div><div class="run-info-item"><span>Tổng thời gian</span><strong>${(durationMs / 1000).toFixed(2)}s</strong></div></section><section class="review-toolbar"><button class="review-btn primary" id="log-new-bug">🐞 Add Bug</button><button class="review-btn" id="save-draft" disabled>💾 Save</button><button class="review-btn primary" id="export-reviewed">📦 Export</button><button class="review-btn" id="back-to-top">↑ On top</button></section><h2>Tổng quan kết quả</h2><section class="summary-layout"><div class="result-charts"><div class="donut-wrap"><div class="donut" style="--pass-end:${percent(counts.PASS)}%;--fail-end:${percent(counts.PASS + counts.FAIL)}%;--skip-end:100%"><div class="donut-center"><strong>${percent(counts.PASS)}%</strong><span>PASS RATE</span></div></div><div class="chart-legend"><div>PASS · ${counts.PASS}</div><div>FAIL · ${counts.FAIL}</div><div>SKIP · ${counts.SKIP}</div><div>BLOCK · 0</div></div></div><div class="bar-chart">${['PASS', 'FAIL', 'SKIP', 'BLOCK'].map((status) => { const value = counts[status] ?? 0; return `<div class="bar-row" tabindex="0" data-tooltip="${status}: ${value}"><strong>${status}</strong><div class="bar-track"><div class="bar-value bar-${status.toLowerCase()}" style="--target:${percent(value)}%"></div></div><span>${value}</span></div>`; }).join('')}</div></div><aside class="review-summary"><div class="bug-count-card"><span>🤖 AUTOMATION BUGS</span><strong id="automation-bug-count">${bugs.length}</strong></div></aside></section><div class="section-heading-actions"><h2>Kết quả chi tiết</h2></div><div class="detail-filter-bar"><label>Trạng thái <select id="pipeline-status" class="column-filter"><option>Tất cả</option><option>PASS</option><option>FAIL</option><option>SKIP</option><option>BLOCK</option></select></label><span class="detail-filter-count">${total} testcase</span></div><div class="table-wrap"><table id="pipeline-results"><thead><tr><th>TC ID</th><th>Tên testcase</th><th>Trạng thái</th><th>Phân loại</th><th>Thời lượng</th></tr><tr class="column-filters"><th><input class="column-filter" data-col="0"></th><th><input class="column-filter" data-col="1"></th><th></th><th><input class="column-filter" data-col="3"></th><th><input class="column-filter" data-col="4"></th></tr></thead><tbody>${rows}</tbody></table></div><div class="section-heading-actions"><h2 id="bug-summary">Tổng hợp Bugs</h2><button class="review-btn collapse-btn" type="button">Thu gọn</button></div><div class="table-wrap"><table id="bug-summary-table"><thead><tr><th>Bug ID</th><th>Mức độ</th><th>Số case ảnh hưởng</th><th>Tên case ảnh hưởng</th><th>Tóm tắt bug</th></tr></thead><tbody>${bugRows}</tbody></table></div><div class="section-heading-actions"><h2>Chi tiết Bug</h2><button class="review-btn collapse-btn" type="button">Thu gọn</button></div>${details}<script type="application/json" id="automated-bug-registry">${registry}</script><script>(()=>{const rows=[...document.querySelectorAll('#pipeline-results tbody tr')],status=document.getElementById('pipeline-status'),inputs=[...document.querySelectorAll('#pipeline-results .column-filter')];function filter(){rows.forEach(row=>{const statusOk=status.value==='Tất cả'||row.cells[2].textContent===status.value;const columnsOk=inputs.every(input=>row.cells[Number(input.dataset.col)].textContent.toLowerCase().includes(input.value.toLowerCase()));row.classList.toggle('filtered-out',!(statusOk&&columnsOk))})}status.onchange=filter;inputs.forEach(input=>input.oninput=filter)})()</script>`;

  // Giữ bảng kết quả và bộ lọc theo contract của report; không loại bỏ chúng sau khi render.
  const finalAutomation = automation;
  const oldTester = preserve(oldDocument, /<section id="tester-bugs"[\s\S]*?(?=<\/main>)/, template.match(/<section id="tester-bugs"[\s\S]*?(?=<\/main>)/)?.[0] ?? '');
  const oldSeed = preserve(oldDocument, /<script id="review-seed"[\s\S]*?<\/script>/, template.match(/<script id="review-seed"[\s\S]*?<\/script>/)?.[0] ?? '');
  const oldAnnotations = preserve(oldDocument, /<script id="qa-team-annotations"[\s\S]*?<\/script>/, template.match(/<script id="qa-team-annotations"[\s\S]*?<\/script>/)?.[0] ?? '');
  let annotations = {};
  try { annotations = JSON.parse(oldAnnotations.match(/>([\s\S]*?)<\/script>/)?.[1] ?? '{}'); } catch {}
  annotations.bugStatuses = { ...(annotations.bugStatuses ?? {}), ...Object.fromEntries(bugs.map((bug) => [idSelector(bug.id), bug.status ?? 'Open'])) };
  const mergedAnnotations = `<script id="qa-team-annotations" type="application/json">${JSON.stringify(annotations).replaceAll('<', '\\u003c')}</script>`;
  let document = template.replaceAll('{{REPORT_TITLE}}', `Báo cáo kiểm thử — ${basename(specPath, '.spec.ts')}`);
  document = document.replace(/(<h1 id="top">[\s\S]*?<\/h1>)[\s\S]*?(<section id="tester-bugs")/, `$1${finalAutomation}$2`);
  document = document.replace(/<section id="tester-bugs"[\s\S]*?(?=<\/main>)/, oldTester);
  document = document.replace(/<script id="review-seed"[\s\S]*?<\/script>/, oldSeed);
  document = document.replace(/<script id="qa-team-annotations"[\s\S]*?<\/script>/, mergedAnnotations);
  document = document.replace(/<script id="automation-run-meta"[\s\S]*?<\/script>/, `<script id="automation-run-meta" type="application/json">${JSON.stringify({ runId, project: basename(specPath, '.spec.ts') }).replaceAll('<', '\\u003c')}</script>`);
  writeFileSync(absoluteReport, document, 'utf8');
}
