import { mkdir, rm } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifactDirectories = ['allure-results', 'playwright-report', 'test-results'];

for (const directory of artifactDirectories) {
  const target = resolve(workspaceRoot, directory);
  const targetRelativeToWorkspace = relative(workspaceRoot, target);

  if (targetRelativeToWorkspace !== directory || targetRelativeToWorkspace.startsWith('..')) {
    throw new Error(`Từ chối xóa đường dẫn ngoài workspace: ${target}`);
  }

  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  console.log(`Đã làm sạch: ${directory}/`);
}

console.log('Hoàn tất làm sạch artifacts kiểm thử.');
