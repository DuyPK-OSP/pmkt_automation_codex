import { PostgresClient } from '@database/postgres.client';
import { NganhNgheRepository } from '@database/repositories/nganh-nghe.repository';
import { KhoRepository } from '@database/repositories/kho.repository';
import { NhomVatTuRepository } from '@database/repositories/nhom-vat-tu.repository';
import { DonViTinhRepository } from '@database/repositories/don-vi-tinh.repository';
import { HeThongTaiKhoanRepository } from '@database/repositories/he-thong-tai-khoan.repository';
import { ThueTaiNguyenRepository } from '@database/repositories/thue-tai-nguyen.repository';
import { VatTuRepository } from '@database/repositories/vat-tu.repository';
import { DonViQuyDoiVatTuRepository } from '@database/repositories/don-vi-quy-doi-vat-tu.repository';

/** Điểm truy cập tập trung tới database client và các repository theo module. */
export class DatabaseContext {
  readonly nganhNghe: NganhNgheRepository;
  readonly kho: KhoRepository;
  readonly nhomVatTu: NhomVatTuRepository;
  readonly donViTinh: DonViTinhRepository;
  readonly heThongTaiKhoan: HeThongTaiKhoanRepository;
  readonly thueTaiNguyen: ThueTaiNguyenRepository;
  readonly vatTu: VatTuRepository;
  readonly donViQuyDoiVatTu: DonViQuyDoiVatTuRepository;
  private readonly client: PostgresClient;

  /** Khởi tạo PostgreSQL client và các repository dùng chung trong một test context. */
  constructor() {
    this.client = new PostgresClient();
    this.nganhNghe = new NganhNgheRepository(this.client);
    this.kho = new KhoRepository(this.client);
    this.nhomVatTu = new NhomVatTuRepository(this.client);
    this.donViTinh = new DonViTinhRepository(this.client);
    this.heThongTaiKhoan = new HeThongTaiKhoanRepository(this.client);
    this.thueTaiNguyen = new ThueTaiNguyenRepository(this.client);
    this.vatTu = new VatTuRepository(this.client);
    this.donViQuyDoiVatTu = new DonViQuyDoiVatTuRepository(this.client);
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
