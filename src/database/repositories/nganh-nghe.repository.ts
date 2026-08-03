import type { QueryResultRow } from 'pg';
import { PostgresClient } from '@database/postgres.client';

/** Bản ghi Ngành nghề ánh xạ từ bảng mst_nganh_nghe, gồm khóa tenant và trạng thái xóa mềm. */
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

/** Cung cấp truy vấn read-only để tìm Ngành nghề theo mã và tenant. */
export class NganhNgheRepository {
  /** Khởi tạo repository bằng PostgreSQL client dùng chung. */
  constructor(private readonly client: PostgresClient) {}

  /** Tìm bản ghi Ngành nghề mới nhất bằng cặp tenant_id và Mã ngành nghề. */
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

  /** Tìm bản ghi Ngành nghề mới nhất theo mã unique để xác định tenant của dữ liệu vừa tạo. */
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
