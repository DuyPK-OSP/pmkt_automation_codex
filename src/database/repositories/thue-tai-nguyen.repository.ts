import type { QueryResultRow } from 'pg';
import { PostgresClient } from '@database/postgres.client';

/** Bản ghi Thuế tài nguyên dùng để đối chiếu combogrid với bảng mst_thue_tai_nguyen. */
export interface ThueTaiNguyenRecord extends QueryResultRow {
  readonly code: string;
  readonly name: string;
  readonly active: boolean;
}

/** Cung cấp truy vấn read-only bảng mst_thue_tai_nguyen theo tenant mặc định. */
export class ThueTaiNguyenRepository {
  /** Khởi tạo repository bằng PostgreSQL client dùng chung. */
  constructor(private readonly client: PostgresClient) {}

  /** Lấy toàn bộ Thuế tài nguyên chưa xóa của tenant mặc định thuộc tài khoản test. */
  async listForDefaultTenant(username: string): Promise<readonly ThueTaiNguyenRecord[]> {
    return this.client.query<ThueTaiNguyenRecord>(
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
        SELECT catalogue.ma AS code, catalogue.ten AS name, catalogue.trang_thai AS active
        FROM public.mst_thue_tai_nguyen catalogue
        INNER JOIN selected_tenant tenant ON tenant.tenant_id = catalogue.tenant_id
        WHERE catalogue.da_xoa = FALSE
        ORDER BY catalogue.trang_thai DESC, catalogue.ngay_tao ASC, catalogue.id ASC
      `,
      [username],
    );
  }
}
