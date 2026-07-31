import { PostgresClient } from '@database/postgres.client';
import { NganhNgheRepository } from '@database/repositories/nganh-nghe.repository';

export class DatabaseContext {
  readonly nganhNghe: NganhNgheRepository;
  private readonly client: PostgresClient;

  constructor() {
    this.client = new PostgresClient();
    this.nganhNghe = new NganhNgheRepository(this.client);
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  async healthCheck(): Promise<boolean> {
    return this.client.healthCheck();
  }
}
