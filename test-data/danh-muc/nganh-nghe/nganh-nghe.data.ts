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

export function createTc36IndustryData(now = new Date()): IndustryTestData {
  const { timestamp, suffix } = uniqueParts(now);
  return {
    code: `AUTO_TC36_${timestamp}_${suffix}`,
    name: `Điều hướng bàn phím TC36 ${timestamp}`,
    description: `Dữ liệu kiểm tra Escape TC36 ${timestamp}`,
  };
}

export function createTc39IndustryData(now = new Date()): IndustryTestData {
  const { timestamp, suffix } = uniqueParts(now);
  return {
    code: `AUTO_TC39_${timestamp}_${suffix}`,
    name: `Hủy thêm mới TC39 ${timestamp}`,
    description: `Dữ liệu không được lưu TC39 ${timestamp}`,
  };
}

export function createTc40IndustryData(now = new Date()): IndustryTestData {
  const { timestamp, suffix } = uniqueParts(now);
  return {
    code: `AUTO_TC40_${timestamp}_${suffix}`,
    name: `Đóng popup TC40 ${timestamp}`,
    description: `Dữ liệu phải được giữ khi hủy xác nhận TC40 ${timestamp}`,
  };
}

export function createTc41IndustryData(now = new Date()): IndustryTestData {
  const { timestamp } = uniqueParts(now);
  return {
    code: '',
    name: `Công nghệ thông tin TC41 ${timestamp}`,
  };
}

export function createTc42IndustryData(): IndustryTestData {
  return { code: 'IT', name: '' };
}

export function createTc43IndustryData(): IndustryTestData {
  return { code: '', name: '' };
}

export function createTc44IndustryData(): IndustryTestData {
  return {
    code: 'AUTO_TC44_'.padEnd(51, 'X'),
    name: 'Test',
  };
}

export function createTc45IndustryData(): IndustryTestData {
  return {
    code: 'IT',
    name: 'Công nghệ thông tin',
    description: 'AUTO_TC45_'.padEnd(501, 'D'),
  };
}

export function createTc46IndustryData(): IndustryTestData {
  return {
    code: 'IT',
    name: 'AUTO_TC46_'.padEnd(251, 'N'),
  };
}

export function createTc47IndustryData(): IndustryTestData {
  return {
    code: 'IT',
    name: 'Công nghệ thông tin 2',
  };
}

export function createTc49IndustryData(now = new Date()): IndustryTestData {
  const { timestamp, suffix } = uniqueParts(now);
  return {
    code: `AUTO_TC49_${timestamp}_${suffix}`,
    name: '',
  };
}

export function createTc53IndustryData(now = new Date()): IndustryTestData {
  const { timestamp, suffix } = uniqueParts(now);
  return {
    code: `AUTO_TC53_${timestamp}_${suffix}`,
    name: `Ngành nghề trạng thái mặc định TC53 ${timestamp}`,
    description: `Đối chiếu toàn bộ dữ liệu DB TC53 ${timestamp}`,
  };
}
