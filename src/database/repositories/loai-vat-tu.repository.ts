import type { QueryResultRow } from 'pg';
import { PostgresClient } from '@database/postgres.client';

/** Bảy tài khoản hạch toán mặc định được cấu hình cho một Loại vật tư. */
export interface LoaiVatTuDefaultAccountsRecord extends QueryResultRow {
  readonly materialAccount: string | null;
  readonly costOfGoodsAccount: string | null;
  readonly revenueAccount: string | null;
  readonly salesReturnAccount: string | null;
  readonly expenseAccount: string | null;
  readonly discountAccount: string | null;
  readonly priceReductionAccount: string | null;
}

/** Cung cấp truy vấn read-only cho cấu hình Loại vật tư theo tenant mặc định. */
export class LoaiVatTuRepository {
  /** Khởi tạo repository bằng PostgreSQL client dùng chung. */
  constructor(private readonly client: PostgresClient) {}

  /** Lấy cấu hình tài khoản của một Loại vật tư bằng mã nghiệp vụ trong đúng tenant của tài khoản test. */
  async findDefaultAccountsForDefaultTenant(
    username: string,
    materialTypeCode: string,
  ): Promise<LoaiVatTuDefaultAccountsRecord | undefined> {
    const rows = await this.client.query<LoaiVatTuDefaultAccountsRecord>(
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
          CONCAT(material_account.so_tai_khoan, ' - ', material_account.ten_tai_khoan) AS "materialAccount",
          CONCAT(cost_account.so_tai_khoan, ' - ', cost_account.ten_tai_khoan) AS "costOfGoodsAccount",
          CONCAT(revenue_account.so_tai_khoan, ' - ', revenue_account.ten_tai_khoan) AS "revenueAccount",
          CONCAT(return_account.so_tai_khoan, ' - ', return_account.ten_tai_khoan) AS "salesReturnAccount",
          CONCAT(expense_account.so_tai_khoan, ' - ', expense_account.ten_tai_khoan) AS "expenseAccount",
          CONCAT(discount_account.so_tai_khoan, ' - ', discount_account.ten_tai_khoan) AS "discountAccount",
          CONCAT(reduction_account.so_tai_khoan, ' - ', reduction_account.ten_tai_khoan) AS "priceReductionAccount"
        FROM public.mst_loai_vat_tu material_type
        INNER JOIN selected_tenant tenant ON tenant.tenant_id = material_type.tenant_id
        LEFT JOIN public.mst_he_thong_tai_khoan material_account ON material_account.id = material_type.tai_khoan_vat_tu_id
        LEFT JOIN public.mst_he_thong_tai_khoan cost_account ON cost_account.id = material_type.tai_khoan_gia_von_id
        LEFT JOIN public.mst_he_thong_tai_khoan revenue_account ON revenue_account.id = material_type.tai_khoan_doanh_thu_id
        LEFT JOIN public.mst_he_thong_tai_khoan return_account ON return_account.id = material_type.tai_khoan_hang_ban_tra_lai_id
        LEFT JOIN public.mst_he_thong_tai_khoan expense_account ON expense_account.id = material_type.tai_khoan_chi_phi_id
        LEFT JOIN public.mst_he_thong_tai_khoan discount_account ON discount_account.id = material_type.tai_khoan_chiet_khau_id
        LEFT JOIN public.mst_he_thong_tai_khoan reduction_account ON reduction_account.id = material_type.tai_khoan_giam_gia_id
        WHERE material_type.code = $2 AND material_type.da_xoa = FALSE
        LIMIT 1
      `,
      [username, materialTypeCode],
    );
    return rows[0];
  }

  /** Giữ contract cũ cho các testcase Hàng hóa đang sử dụng mã HH. */
  async findGoodsDefaultAccountsForDefaultTenant(
    username: string,
  ): Promise<LoaiVatTuDefaultAccountsRecord | undefined> {
    return this.findDefaultAccountsForDefaultTenant(username, 'HH');
  }
}
