import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { readReportBugRegistry, updateIncrementalReport } from './incremental-report-writer.mjs';

const [reportPath, specPath, expectedArgument] = process.argv.slice(2);
if (!reportPath || !specPath || !expectedArgument) throw new Error('Usage: node migrate-report-to-template.mjs <report> <spec> <expected-total>');
const document = readFileSync(reportPath, 'utf8');
const table = document.match(/<table id="(?:results|pipeline-results)"[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)?.[1]
  ?? document.match(/<section id="current-run-checkpoint"[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)?.[1];
if (!table) throw new Error(`Không tìm thấy bảng kết quả trong ${reportPath}.`);
const plain = (value) => String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const cases = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((row) => {
  const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => plain(cell[1]));
  if (cells.length < 3) return null;
  const durationMs = Number.parseFloat(cells.at(-1)) * 1000 || 0;
  const classification = cells.length >= 5 ? cells[3] : '';
  return { id: cells[0], title: cells[1], status: cells[2], durationMs, ...(classification && classification !== '—' ? { analysis: { classification } } : {}) };
}).filter(Boolean);
if (!cases.length) throw new Error(`Không đọc được testcase từ ${reportPath}.`);
await updateIncrementalReport({ reportPath, specPath, runId: `migrated-${basename(specPath, '.spec.ts')}`, expectedTotal: Number(expectedArgument), cases, bugs: readReportBugRegistry(reportPath) });
console.log(`Migrated ${reportPath}: ${cases.length} testcase.`);
