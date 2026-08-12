import { Pool, type QueryResultRow } from 'pg';
import { requireDatabaseConfig } from '@utils/env.config';

/** Quản lý pool PostgreSQL và thực thi parameterized query theo cấu hình môi trường. */
export class PostgresClient {
  private readonly pool: Pool;

  /** Tạo pool một connection cho mỗi worker và áp dụng timeout truy vấn/kết nối. */
  constructor() {
    const config = requireDatabaseConfig();
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl,
      max: 1,
      connectionTimeoutMillis: config.connectionTimeoutMs,
      statement_timeout: config.queryTimeoutMs,
      query_timeout: config.queryTimeoutMs,
    });
  }

  /** Thực thi parameterized query và trả về các row; không nội suy tham số trực tiếp vào SQL. */
  async query<T extends QueryResultRow>(
    sql: string,
    params: readonly unknown[] = [],
  ): Promise<readonly T[]> {
    const result = await this.pool.query<T>(sql, [...params]);
    return result.rows;
  }

  /** Đóng pool kết nối database sau khi fixture hoặc test context kết thúc. */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /** Kiểm tra khả năng kết nối database bằng truy vấn read-only SELECT TRUE. */
  async healthCheck(): Promise<boolean> {
    const rows = await this.query<{ readonly connected: boolean }>(
      'SELECT TRUE AS connected',
    );
    return rows[0]?.connected === true;
  }
}
