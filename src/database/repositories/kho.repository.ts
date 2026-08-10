import type { QueryResultRow } from 'pg';
import { PostgresClient } from '@database/postgres.client';

/** Bản ghi Kho dùng để đối chiếu dữ liệu combogrid với nguồn chuẩn trong database. */
export interface KhoRecord extends QueryResultRow {
  readonly id: string;
  readonly tenantId: string;
  readonly code: string;
  readonly name: string;
  readonly active: boolean;
  readonly createdAt: Date;
}

/** Cung cấp truy vấn read-only cho danh mục Kho theo tenant mặc định của tài khoản test. */
export class KhoRepository {
  /** Khởi tạo repository bằng PostgreSQL client dùng chung. */
  constructor(private readonly client: PostgresClient) {}

  /** Lấy toàn bộ Kho chưa xóa thuộc tenant mặc định của tài khoản đăng nhập. */
  async listForDefaultTenant(username: string): Promise<readonly KhoRecord[]> {
    return this.client.query<KhoRecord>(
      `
        WITH selected_tenant AS (
          SELECT mapping.tenant_id
          FROM public.iam_tai_khoan account
          INNER JOIN public.iam_tai_khoan_tenant mapping
            ON mapping.tai_khoan_id = account.id
           AND mapping.da_xoa = FALSE
          WHERE (LOWER(account.ten_dang_nhap) = LOWER($1) OR LOWER(account.email) = LOWER($1))
            AND account.da_xoa = FALSE
          ORDER BY mapping.la_tenant_mac_dinh DESC, mapping.ngay_tao ASC
          LIMIT 1
        )
        SELECT
          kho.id,
          kho.tenant_id AS "tenantId",
          kho.ma_kho AS code,
          kho.ten_kho AS name,
          kho.trang_thai AS active,
          kho.ngay_tao AS "createdAt"
        FROM public.mst_kho kho
        INNER JOIN selected_tenant tenant ON tenant.tenant_id = kho.tenant_id
        WHERE kho.da_xoa = FALSE
        ORDER BY kho.trang_thai DESC, kho.ngay_tao ASC, kho.id ASC
      `,
      [username],
    );
  }

  /** Tìm một Kho chưa xóa theo mã và tenant mặc định của tài khoản. */
  async findByCodeForDefaultTenant(username: string, code: string): Promise<KhoRecord | null> {
    const records = await this.client.query<KhoRecord>(
      `
        WITH selected_tenant AS (
          SELECT mapping.tenant_id
          FROM public.iam_tai_khoan account
          INNER JOIN public.iam_tai_khoan_tenant mapping
            ON mapping.tai_khoan_id = account.id
           AND mapping.da_xoa = FALSE
          WHERE (LOWER(account.ten_dang_nhap) = LOWER($1) OR LOWER(account.email) = LOWER($1))
            AND account.da_xoa = FALSE
          ORDER BY mapping.la_tenant_mac_dinh DESC, mapping.ngay_tao ASC
          LIMIT 1
        )
        SELECT
          kho.id,
          kho.tenant_id AS "tenantId",
          kho.ma_kho AS code,
          kho.ten_kho AS name,
          kho.trang_thai AS active,
          kho.ngay_tao AS "createdAt"
        FROM public.mst_kho kho
        INNER JOIN selected_tenant tenant ON tenant.tenant_id = kho.tenant_id
        WHERE kho.da_xoa = FALSE
          AND LOWER(kho.ma_kho) = LOWER($2)
        LIMIT 1
      `,
      [username, code],
    );
    return records[0] ?? null;
  }
}
