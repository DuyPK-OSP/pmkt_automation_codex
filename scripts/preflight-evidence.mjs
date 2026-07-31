import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const requestedPaths = process.argv.slice(2);
const specPaths = [];

async function collectTypeScriptFiles(path) {
  const absolutePath = resolve(path);
  const details = await stat(absolutePath);
  if (details.isFile()) {
    if (path.endsWith('.ts')) specPaths.push(path);
    return;
  }
  for (const entry of await readdir(absolutePath)) {
    await collectTypeScriptFiles(`${path}/${entry}`);
  }
}

for (const path of requestedPaths) await collectTypeScriptFiles(path);
await collectTypeScriptFiles('src/helpers');

const uniqueSpecPaths = [...new Set(specPaths)];
if (requestedPaths.length === 0) {
  console.error('Usage: npm run preflight:evidence -- <spec-file> [more-spec-files]');
  process.exitCode = 1;
} else {
  const violations = [];

  for (const specPath of uniqueSpecPaths) {
    const absolutePath = resolve(specPath);
    const source = await readFile(absolutePath, 'utf8');

    if (source.includes('expect.soft(') && /import\s*\{[^}]*\bexpect\b[^}]*\}\s*from\s*['"]@playwright\/test['"]/.test(source)) {
      violations.push(`${specPath}: phải import expect từ @fixtures/base.fixture để bật milestone evidence.`);
    }

    const lines = source.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      if (!lines[index].includes('expect.soft(')) continue;
      const statementStart = lines.slice(Math.max(0, index - 1), index + 1).join(' ');
      if (!/\bawait\s+expect\.soft\(/.test(statementStart)) {
        violations.push(`${specPath}:${index + 1}: expect.soft() bắt buộc phải có await để chụp evidence trước khi UI thay đổi.`);
      }
    }
  }

  if (violations.length > 0) {
    console.error('Evidence preflight FAILED:\n- ' + violations.join('\n- '));
    process.exitCode = 1;
  } else {
    console.log(`Evidence preflight PASSED: ${requestedPaths.length} target(s), ${uniqueSpecPaths.length} file(s) checked.`);
  }
}
