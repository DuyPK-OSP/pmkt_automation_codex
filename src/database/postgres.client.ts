import { Pool, type QueryResultRow } from 'pg';
import { requireDatabaseConfig } from '@utils/env.config';

export class PostgresClient {
  private readonly pool: Pool;

  constructor() {
    const config = requireDatabaseConfig();
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl,
      max: 5,
      connectionTimeoutMillis: config.connectionTimeoutMs,
      statement_timeout: config.queryTimeoutMs,
      query_timeout: config.queryTimeoutMs,
    });
  }

  async query<T extends QueryResultRow>(
    sql: string,
    params: readonly unknown[] = [],
  ): Promise<readonly T[]> {
    const result = await this.pool.query<T>(sql, [...params]);
    return result.rows;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async healthCheck(): Promise<boolean> {
    const rows = await this.query<{ readonly connected: boolean }>(
      'SELECT TRUE AS connected',
    );
    return rows[0]?.connected === true;
  }
}
