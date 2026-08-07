import type { QueryResultRow } from 'pg';
import { PostgresClient } from '@database/postgres.client';

/** Bản ghi Đơn vị tính dùng để đối chiếu combogrid với bảng mst_don_vi_tinh. */
export interface DonViTinhRecord extends QueryResultRow {
  readonly code: string;
  readonly name: string;
  readonly active: boolean;
}

/** Cung cấp truy vấn read-only bảng mst_don_vi_tinh theo tenant mặc định. */
export class DonViTinhRepository {
  /** Khởi tạo repository bằng PostgreSQL client dùng chung. */
  constructor(private readonly client: PostgresClient) {}

  /** Lấy toàn bộ Đơn vị tính chưa xóa của tenant mặc định thuộc tài khoản test. */
  async listForDefaultTenant(username: string): Promise<readonly DonViTinhRecord[]> {
    return this.client.query<DonViTinhRecord>(
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
        SELECT catalogue.code, catalogue.ten AS name, catalogue.trang_thai AS active
        FROM public.mst_don_vi_tinh catalogue
        INNER JOIN selected_tenant tenant ON tenant.tenant_id = catalogue.tenant_id
        WHERE catalogue.da_xoa = FALSE
        ORDER BY catalogue.trang_thai DESC, catalogue.ngay_tao ASC, catalogue.id ASC
      `,
      [username],
    );
  }
}
