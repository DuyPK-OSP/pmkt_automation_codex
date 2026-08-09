import type { QueryResultRow } from 'pg';
import { PostgresClient } from '@database/postgres.client';

/** Dòng Đơn vị quy đổi đã lưu của một Vật tư. */
export interface DonViQuyDoiVatTuRecord extends QueryResultRow {
  readonly unit: string;
  readonly ratio: string;
  readonly operation: string;
  readonly description: string | null;
  readonly order: number;
}

/** Cung cấp truy vấn read-only bảng mst_don_vi_quy_doi_vat_tu. */
export class DonViQuyDoiVatTuRepository {
  /** Khởi tạo repository bằng PostgreSQL client dùng chung. */
  constructor(private readonly client: PostgresClient) {}

  /** Lấy các dòng quy đổi theo Mã vật tư unique trong đúng tenant mặc định. */
  async listByMaterialCodeForDefaultTenant(
    username: string,
    materialCode: string,
  ): Promise<readonly DonViQuyDoiVatTuRecord[]> {
    return this.client.query<DonViQuyDoiVatTuRecord>(
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
          CONCAT(unit.code, ' — ', unit.ten) AS unit,
          conversion.ty_le_quy_doi::text AS ratio,
          CASE conversion.phep_tinh
            WHEN 'Nhan' THEN 'Nhân'
            WHEN 'Chia' THEN 'Chia'
            ELSE conversion.phep_tinh
          END AS operation,
          conversion.mo_ta AS description,
          conversion.thu_tu AS "order"
        FROM public.mst_don_vi_quy_doi_vat_tu conversion
        INNER JOIN public.mst_vat_tu material
          ON material.id = conversion.vat_tu_id AND material.tenant_id = conversion.tenant_id
        INNER JOIN selected_tenant tenant ON tenant.tenant_id = conversion.tenant_id
        INNER JOIN public.mst_don_vi_tinh unit ON unit.id = conversion.don_vi_tinh_id
        WHERE material.ma = $2 AND material.da_xoa = FALSE
        ORDER BY conversion.thu_tu ASC, conversion.id ASC
      `,
      [username, materialCode],
    );
  }
}
