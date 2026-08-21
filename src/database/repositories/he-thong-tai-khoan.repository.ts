import type { QueryResultRow } from 'pg';
import { PostgresClient } from '@database/postgres.client';

/** Bản ghi Tài khoản kế toán kèm trạng thái và điều kiện cho phép hạch toán. */
export interface HeThongTaiKhoanRecord extends QueryResultRow {
  readonly code: string;
  readonly name: string;
  readonly status: string;
  readonly allowed: boolean;
}

/** Cung cấp truy vấn read-only bảng mst_he_thong_tai_khoan theo tenant mặc định. */
export class HeThongTaiKhoanRepository {
  /** Khởi tạo repository bằng PostgreSQL client dùng chung. */
  constructor(private readonly client: PostgresClient) {}

  /** Lấy toàn bộ Tài khoản chưa xóa và cờ cho phép hạch toán của tenant mặc định. */
  async listForDefaultTenant(username: string): Promise<readonly HeThongTaiKhoanRecord[]> {
    return this.client.query<HeThongTaiKhoanRecord>(
      `
        WITH selected_tenant AS (
          SELECT mapping.tenant_id
          FROM public.iam_tai_khoan account
          INNER JOIN public.iam_tai_khoan_tenant mapping
            ON mapping.tai_khoan_id = account.id AND mapping.da_xoa = FALSE
          WHERE (LOWER(account.ten_dang_nhap) = LOWER($1) OR LOWER(account.email) = LOWER($1))
            AND account.da_xoa = FALSE
          ORDER BY mapping.la_tenant_mac_dinh DESC, mapping.ngay_tao ASC
          LIMIT 1
        )
        SELECT
          account.so_tai_khoan AS code,
          account.ten_tai_khoan AS name,
          account.trang_thai AS status,
          account.cho_phep_hach_toan AS allowed
        FROM public.mst_he_thong_tai_khoan account
        INNER JOIN selected_tenant tenant ON tenant.tenant_id = account.tenant_id
        WHERE account.da_xoa = FALSE
        ORDER BY account.trang_thai IN ('HoatDong', 'ACTIVE') DESC, account.so_tai_khoan ASC
      `,
      [username],
    );
  }
}
