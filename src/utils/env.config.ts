import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), process.env.ENV_FILE ?? '.env') });

function positiveInteger(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (rawValue === undefined) return fallback;
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} phải là số nguyên dương.`);
  return value;
}

function booleanValue(name: string, fallback: boolean): boolean {
  const rawValue = process.env[name];
  if (rawValue === undefined) return fallback;
  if (rawValue === 'true') return true;
  if (rawValue === 'false') return false;
  throw new Error(`${name} chỉ chấp nhận true hoặc false.`);
}

export const env = Object.freeze({
  baseUrl: process.env.APP_URL ?? 'http://18.141.17.116',
  username: process.env.TEST_USERNAME,
  password: process.env.TEST_PASSWORD,
  headless: booleanValue('HEADLESS', true),
  isCI: process.env.CI === 'true',
  testTimeoutMs: positiveInteger('TEST_TIMEOUT_MS', 60_000),
  expectTimeoutMs: positiveInteger('EXPECT_TIMEOUT_MS', 10_000),
  actionTimeoutMs: positiveInteger('ACTION_TIMEOUT_MS', 15_000),
  navigationTimeoutMs: positiveInteger('NAVIGATION_TIMEOUT_MS', 30_000),
});

export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly username: string;
  readonly password: string;
  readonly ssl: boolean;
  readonly connectionTimeoutMs: number;
  readonly queryTimeoutMs: number;
}

export function requireCredentials(): Readonly<{ username: string; password: string }> {
  if (!env.username || !env.password) {
    throw new Error('Thiếu TEST_USERNAME hoặc TEST_PASSWORD. Hãy cấu hình qua biến môi trường hoặc file .env.');
  }
  return { username: env.username, password: env.password };
}

export function requireDatabaseConfig(): DatabaseConfig {
  const requiredVariables = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'] as const;
  const missingVariables = requiredVariables.filter((name) => !process.env[name]);
  if (missingVariables.length > 0) {
    throw new Error(`Thiếu cấu hình database: ${missingVariables.join(', ')}.`);
  }

  return {
    host: process.env.DB_HOST!,
    port: positiveInteger('DB_PORT', 5432),
    database: process.env.DB_NAME!,
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    ssl: booleanValue('DB_SSL', false),
    connectionTimeoutMs: positiveInteger('DB_CONNECTION_TIMEOUT_MS', 10_000),
    queryTimeoutMs: positiveInteger('DB_QUERY_TIMEOUT_MS', 10_000),
  };
}
