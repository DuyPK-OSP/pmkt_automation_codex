import { randomUUID } from 'node:crypto';

export interface IndustryTestData {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
}

function uniqueParts(now: Date): Readonly<{ timestamp: string; suffix: string }> {
  const timestamp = now.toISOString().replace(/\D/g, '').slice(0, 14);
  const suffix = randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
  return { timestamp, suffix };
}

export function createTc50IndustryData(now = new Date()): IndustryTestData {
  const { timestamp, suffix } = uniqueParts(now);
  return {
    code: `AUTO_TC50_${timestamp}_${suffix}`,
    name: `Công nghệ thông tin tự động ${timestamp}`,
    description: `Ngành nghề về công nghệ thông tin - TC50 - ${timestamp}`,
  };
}

export function createTc51IndustryData(now = new Date()): IndustryTestData {
  const { timestamp, suffix } = uniqueParts(now);
  return {
    code: `AUTO_TC51_${timestamp}_${suffix}`,
    name: `Công nghệ thông tin tự động TC51 ${timestamp}`,
  };
}
