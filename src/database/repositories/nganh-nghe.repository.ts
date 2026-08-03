import type { QueryResultRow } from 'pg';
import { PostgresClient } from '@database/postgres.client';

export interface NganhNgheRecord extends QueryResultRow {
  readonly id: string;
  readonly tenantId: string;
  readonly ma: string;
  readonly ten: string;
  readonly moTa: string | null;
  readonly trangThai: boolean;
  readonly daXoa: boolean;
  readonly ngayTao: Date;
  readonly ngayCapNhat: Date | null;
  readonly nguoiTao: string | null;
  readonly nguoiCapNhat: string | null;
  readonly phienBan: number;
}

export class NganhNgheRepository {
  constructor(private readonly client: PostgresClient) {}

  async findByCode(tenantId: string, code: string): Promise<NganhNgheRecord | null> {
    const rows = await this.client.query<NganhNgheRecord>(
      `
        SELECT
          id,
          tenant_id AS "tenantId",
          ma,
          ten,
          mo_ta AS "moTa",
          trang_thai AS "trangThai",
          da_xoa AS "daXoa",
          ngay_tao AS "ngayTao",
          ngay_cap_nhat AS "ngayCapNhat",
          nguoi_tao AS "nguoiTao",
          nguoi_cap_nhat AS "nguoiCapNhat",
          phien_ban AS "phienBan"
        FROM public.mst_nganh_nghe
        WHERE tenant_id = $1
          AND ma = $2
        ORDER BY ngay_tao DESC
        LIMIT 1
      `,
      [tenantId, code],
    );

    return rows[0] ?? null;
  }

  async findLatestByUniqueCode(code: string): Promise<NganhNgheRecord | null> {
    const rows = await this.client.query<NganhNgheRecord>(
      `
        SELECT
          id,
          tenant_id AS "tenantId",
          ma,
          ten,
          mo_ta AS "moTa",
          trang_thai AS "trangThai",
          da_xoa AS "daXoa",
          ngay_tao AS "ngayTao",
          ngay_cap_nhat AS "ngayCapNhat",
          nguoi_tao AS "nguoiTao",
          nguoi_cap_nhat AS "nguoiCapNhat",
          phien_ban AS "phienBan"
        FROM public.mst_nganh_nghe
        WHERE ma = $1
        ORDER BY ngay_tao DESC
        LIMIT 1
      `,
      [code],
    );
    return rows[0] ?? null;
  }

}
