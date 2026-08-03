import { PostgresClient } from '@database/postgres.client';
import { NganhNgheRepository } from '@database/repositories/nganh-nghe.repository';

/** Điểm truy cập tập trung tới database client và các repository theo module. */
export class DatabaseContext {
  readonly nganhNghe: NganhNgheRepository;
  private readonly client: PostgresClient;

  /** Khởi tạo PostgreSQL client và các repository dùng chung trong một test context. */
  constructor() {
    this.client = new PostgresClient();
    this.nganhNghe = new NganhNgheRepository(this.client);
  }

  /** Đóng pool kết nối database sau khi fixture hoặc test context kết thúc. */
  async close(): Promise<void> {
    await this.client.close();
  }

  /** Kiểm tra khả năng kết nối database bằng truy vấn read-only SELECT TRUE. */
  async healthCheck(): Promise<boolean> {
    return this.client.healthCheck();
  }
}
