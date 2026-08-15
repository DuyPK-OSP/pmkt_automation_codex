import type { QueryResultRow } from 'pg';
import { PostgresClient } from '@database/postgres.client';

/** Toàn bộ trường lưu trên mst_vat_tu cùng nhãn danh mục để đối chiếu dữ liệu UI. */
export interface VatTuRecord extends QueryResultRow {
  readonly id: string;
  readonly tenantId: string;
  readonly code: string;
  readonly name: string;
  readonly purchaseName: string | null;
  readonly saleName: string | null;
  readonly materialType: string;
  readonly mainUnit: string | null;
  readonly alternativeUnits: readonly string[];
  readonly imageId: string | null;
  readonly specialGoodsType: string | null;
  readonly warrantyPeriod: number | null;
  readonly warrantyUnit: string | null;
  readonly active: boolean;
  readonly description: string | null;
  readonly resourceTax: string | null;
  readonly exciseTax: string | null;
  readonly importTax: string | null;
  readonly exportTax: string | null;
  readonly warehouse: string | null;
  readonly pricingMethod: string | null;
  readonly minimumStock: string | null;
  readonly maximumStock: string | null;
  readonly trackLot: boolean;
  readonly trackBarcode: boolean;
  readonly groups: readonly string[];
  readonly materialAccount: string | null;
  readonly costOfGoodsAccount: string | null;
  readonly revenueAccount: string | null;
  readonly salesReturnAccount: string | null;
  readonly discountAccount: string | null;
  readonly expenseAccount: string | null;
  readonly priceReductionAccount: string | null;
  readonly reducedTax: boolean;
  readonly defaultVatRate: string | null;
  readonly defaultVatValue: string | null;
  readonly deleted: boolean;
}

export type VatTuDatabaseType =
  | 'HangHoa'
  | 'DichVu'
  | 'NguyenVatLieu'
  | 'CongCuDungCu'
  | 'ThanhPham'
  | 'BanThanhPham';

export interface VatTuDeletionState extends QueryResultRow {
  readonly code: string;
  readonly deleted: boolean;
}

/** Các khóa DB hợp lệ dùng để dựng payload API setup Vật tư, không dùng làm expected nghiệp vụ. */
export interface VatTuApiSeed extends QueryResultRow {
  readonly materialType: 'HangHoa' | 'DichVu';
  readonly mainUnitId: string;
  readonly specialGoodsType: string | null;
  readonly materialAccountId: string | null;
  readonly costOfGoodsAccountId: string | null;
  readonly revenueAccountId: string;
  readonly salesReturnAccountId: string;
  readonly discountAccountId: string;
  readonly expenseAccountId: string;
  readonly priceReductionAccountId: string;
}

/** Định danh Vật tư automation dùng để cleanup chính xác từng bản ghi. */
export interface VatTuIdentity extends QueryResultRow {
  readonly id: string;
  readonly code: string;
  readonly updatedAt: string;
}

/** Một dòng dữ liệu Vật tư theo đúng các cột được trình bày trên màn hình danh sách. */
export interface VatTuListRecord extends QueryResultRow {
  readonly code: string;
  readonly name: string;
  readonly materialType: string;
  readonly groups: string | null;
  readonly mainUnit: string | null;
  readonly trackLot: boolean;
  readonly pricingMethod: string | null;
  readonly warehouse: string | null;
  readonly active: boolean;
}

/** Cung cấp truy vấn read-only bảng mst_vat_tu theo mã unique và tenant mặc định. */
export class VatTuRepository {
  /** Khởi tạo repository bằng PostgreSQL client dùng chung. */
  constructor(private readonly client: PostgresClient) {}

  /** Lấy seed read-only từ Vật tư đang hoạt động của đúng tenant cho payload setup API Hàng hóa/Dịch vụ. */
  async findApiSeedsForDefaultTenant(username: string): Promise<readonly VatTuApiSeed[]> {
    return this.client.query<VatTuApiSeed>(
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
        SELECT DISTINCT ON (material.loai_vat_tu)
          material.loai_vat_tu AS "materialType",
          material.don_vi_tinh_id AS "mainUnitId",
          material.loai_hang_hoa_dac_trung AS "specialGoodsType",
          material.tai_khoan_vat_tu_id AS "materialAccountId",
          material.tai_khoan_gia_von_id AS "costOfGoodsAccountId",
          material.tai_khoan_doanh_thu_id AS "revenueAccountId",
          material.tai_khoan_hang_ban_tra_lai_id AS "salesReturnAccountId",
          material.tai_khoan_chiet_khau_id AS "discountAccountId",
          material.tai_khoan_chi_phi_id AS "expenseAccountId",
          material.tai_khoan_giam_gia_id AS "priceReductionAccountId"
        FROM public.mst_vat_tu material
        INNER JOIN selected_tenant tenant ON tenant.tenant_id = material.tenant_id
        WHERE material.loai_vat_tu IN ('HangHoa', 'DichVu')
          AND material.don_vi_tinh_id IS NOT NULL
          AND material.tai_khoan_doanh_thu_id IS NOT NULL
          AND material.tai_khoan_hang_ban_tra_lai_id IS NOT NULL
          AND material.tai_khoan_chiet_khau_id IS NOT NULL
          AND material.tai_khoan_chi_phi_id IS NOT NULL
          AND material.tai_khoan_giam_gia_id IS NOT NULL
          AND (material.loai_vat_tu <> 'HangHoa' OR (
            material.tai_khoan_vat_tu_id IS NOT NULL AND material.tai_khoan_gia_von_id IS NOT NULL
          ))
        ORDER BY material.loai_vat_tu, material.ngay_tao DESC
      `,
      [username],
    );
  }

  /** Đọc đúng các ID chưa xóa theo danh sách mã do fixture quản lý; query parameterized và đúng tenant. */
  async findActiveIdentitiesByCodesForDefaultTenant(
    username: string,
    codes: readonly string[],
  ): Promise<readonly VatTuIdentity[]> {
    if (codes.length === 0) return [];
    return this.client.query<VatTuIdentity>(
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
          material.id,
          material.ma AS code,
          TO_CHAR(material.ngay_cap_nhat AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "updatedAt"
        FROM public.mst_vat_tu material
        INNER JOIN selected_tenant tenant ON tenant.tenant_id = material.tenant_id
        WHERE material.da_xoa = FALSE AND material.ma = ANY($2::text[])
        ORDER BY material.ma
      `,
      [username, [...codes]],
    );
  }

  /** Lấy mã của một Vật tư đang tồn tại trong tenant mặc định để chuẩn bị testcase trùng mã. */
  async findFirstExistingCodeForDefaultTenant(username: string): Promise<string | undefined> {
    const rows = await this.client.query<{ readonly code: string }>(
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
        SELECT material.ma AS code
        FROM public.mst_vat_tu material
        INNER JOIN selected_tenant tenant ON tenant.tenant_id = material.tenant_id
        WHERE material.da_xoa = FALSE
        ORDER BY material.ngay_tao ASC, material.id ASC
        LIMIT 1
      `,
      [username],
    );
    return rows[0]?.code;
  }

  /** Đọc danh sách Vật tư theo đúng tenant, thứ tự mặc định và điều kiện tìm kiếm của Data Grid. */
  async listForDefaultTenant(
    username: string,
    search = '',
    limit = 10,
  ): Promise<readonly VatTuListRecord[]> {
    return this.client.query<VatTuListRecord>(
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
          material.ma AS code,
          material.ten AS name,
          CASE material.loai_vat_tu
            WHEN 'HangHoa' THEN 'Hàng hóa'
            WHEN 'DichVu' THEN 'Dịch vụ'
            WHEN 'NguyenVatLieu' THEN 'Nguyên vật liệu'
            WHEN 'CongCuDungCu' THEN 'Công cụ dụng cụ'
            WHEN 'ThanhPham' THEN 'Thành phẩm'
            WHEN 'BanThanhPham' THEN 'Bán thành phẩm'
            ELSE material.loai_vat_tu
          END AS "materialType",
          NULLIF((
            SELECT STRING_AGG(material_group.ten, ', ' ORDER BY selected_group.ordinality)
            FROM UNNEST(material.nhom_vat_tu_ids) WITH ORDINALITY selected_group(id, ordinality)
            INNER JOIN public.mst_nhom_vat_tu material_group ON material_group.id = selected_group.id
          ), '') AS groups,
          main_unit.ten AS "mainUnit",
          material.theo_doi_lo AS "trackLot",
          CASE material.phuong_phap_tinh_gia
            WHEN 'NhapTruocXuatTruoc' THEN 'Nhập trước xuất trước'
            WHEN 'BinhQuanGiaQuyenCuoiKy' THEN 'Bình quân gia quyền cuối kỳ'
            WHEN 'DichDanh' THEN 'Đích danh'
            ELSE material.phuong_phap_tinh_gia
          END AS "pricingMethod",
          CASE WHEN warehouse.id IS NULL THEN NULL ELSE CONCAT(warehouse.ma_kho, ' — ', warehouse.ten_kho) END AS warehouse,
          material.trang_thai AS active
        FROM public.mst_vat_tu material
        INNER JOIN selected_tenant tenant ON tenant.tenant_id = material.tenant_id
        LEFT JOIN public.mst_don_vi_tinh main_unit ON main_unit.id = material.don_vi_tinh_id
        LEFT JOIN public.mst_kho warehouse ON warehouse.id = material.kho_mac_dinh_id
        WHERE material.da_xoa = FALSE
          AND ($2 = '' OR LOWER(material.ma) LIKE '%' || LOWER($2) || '%' OR LOWER(material.ten) LIKE '%' || LOWER($2) || '%')
        ORDER BY material.trang_thai DESC, material.ngay_tao DESC, material.id DESC
        LIMIT $3
      `,
      [username, search.trim(), limit],
    );
  }

  /** Tìm đúng một Vật tư chưa xóa theo mã unique trong tenant mặc định của tài khoản test. */
  async findByCodeForDefaultTenant(username: string, code: string): Promise<readonly VatTuRecord[]> {
    return this.client.query<VatTuRecord>(
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
          material.id,
          material.tenant_id AS "tenantId",
          material.ma AS code,
          material.ten AS name,
          material.ten_mua AS "purchaseName",
          material.ten_ban AS "saleName",
          CASE material.loai_vat_tu
            WHEN 'HangHoa' THEN 'Hàng hóa'
            WHEN 'DichVu' THEN 'Dịch vụ'
            WHEN 'NguyenVatLieu' THEN 'Nguyên vật liệu'
            WHEN 'CongCuDungCu' THEN 'Công cụ, dụng cụ'
            WHEN 'ThanhPham' THEN 'Thành phẩm'
            WHEN 'BanThanhPham' THEN 'Bán thành phẩm'
            ELSE material.loai_vat_tu
          END AS "materialType",
          CASE WHEN main_unit.id IS NULL THEN NULL ELSE CONCAT(main_unit.code, ' — ', main_unit.ten) END AS "mainUnit",
          COALESCE((
            SELECT ARRAY_AGG(CONCAT(alternative_unit.code, ' — ', alternative_unit.ten) ORDER BY selected_unit.ordinality)
            FROM UNNEST(material.don_vi_tinh_khac_ids) WITH ORDINALITY selected_unit(id, ordinality)
            INNER JOIN public.mst_don_vi_tinh alternative_unit ON alternative_unit.id = selected_unit.id
          ), ARRAY[]::text[]) AS "alternativeUnits",
          material.anh_id AS "imageId",
          material.loai_hang_hoa_dac_trung AS "specialGoodsType",
          material.thoi_han_bao_hanh AS "warrantyPeriod",
          CASE material.don_vi_thoi_gian
            WHEN 'Ngay' THEN 'Ngày'
            WHEN 'Thang' THEN 'Tháng'
            WHEN 'Nam' THEN 'Năm'
            ELSE material.don_vi_thoi_gian
          END AS "warrantyUnit",
          material.trang_thai AS active,
          material.mo_ta AS description,
          CASE WHEN resource_tax.id IS NULL THEN NULL ELSE CONCAT(resource_tax.ma, ' — ', resource_tax.ten) END AS "resourceTax",
          CASE WHEN excise_tax.id IS NULL THEN NULL ELSE CONCAT(excise_tax.ma, ' — ', excise_tax.ten) END AS "exciseTax",
          material.thue_nhap_khau::text AS "importTax",
          material.thue_xuat_khau::text AS "exportTax",
          CASE WHEN warehouse.id IS NULL THEN NULL ELSE CONCAT(warehouse.ma_kho, ' — ', warehouse.ten_kho) END AS warehouse,
          CASE material.phuong_phap_tinh_gia
            WHEN 'NhapTruocXuatTruoc' THEN 'Nhập trước xuất trước'
            WHEN 'BinhQuanGiaQuyenCuoiKy' THEN 'Bình quân gia quyền cuối kỳ'
            WHEN 'DichDanh' THEN 'Đích danh'
            ELSE material.phuong_phap_tinh_gia
          END AS "pricingMethod",
          material.ton_toi_thieu::text AS "minimumStock",
          material.ton_toi_da::text AS "maximumStock",
          material.theo_doi_lo AS "trackLot",
          material.theo_doi_ma_vach AS "trackBarcode",
          COALESCE((
            SELECT ARRAY_AGG(CONCAT(material_group.ma, ' — ', material_group.ten) ORDER BY selected_group.ordinality)
            FROM UNNEST(material.nhom_vat_tu_ids) WITH ORDINALITY selected_group(id, ordinality)
            INNER JOIN public.mst_nhom_vat_tu material_group ON material_group.id = selected_group.id
          ), ARRAY[]::text[]) AS groups,
          CASE WHEN material_account.id IS NULL THEN NULL ELSE CONCAT(material_account.so_tai_khoan, ' — ', material_account.ten_tai_khoan) END AS "materialAccount",
          CASE WHEN cost_account.id IS NULL THEN NULL ELSE CONCAT(cost_account.so_tai_khoan, ' — ', cost_account.ten_tai_khoan) END AS "costOfGoodsAccount",
          CASE WHEN revenue_account.id IS NULL THEN NULL ELSE CONCAT(revenue_account.so_tai_khoan, ' — ', revenue_account.ten_tai_khoan) END AS "revenueAccount",
          CASE WHEN return_account.id IS NULL THEN NULL ELSE CONCAT(return_account.so_tai_khoan, ' — ', return_account.ten_tai_khoan) END AS "salesReturnAccount",
          CASE WHEN discount_account.id IS NULL THEN NULL ELSE CONCAT(discount_account.so_tai_khoan, ' — ', discount_account.ten_tai_khoan) END AS "discountAccount",
          CASE WHEN expense_account.id IS NULL THEN NULL ELSE CONCAT(expense_account.so_tai_khoan, ' — ', expense_account.ten_tai_khoan) END AS "expenseAccount",
          CASE WHEN reduction_account.id IS NULL THEN NULL ELSE CONCAT(reduction_account.so_tai_khoan, ' — ', reduction_account.ten_tai_khoan) END AS "priceReductionAccount",
          material.giam_thue_theo_quy_dinh AS "reducedTax",
          material.thue_suat_gtgt_mac_dinh AS "defaultVatRate",
          material.gia_tri_thue_suat_gtgt::text AS "defaultVatValue",
          material.da_xoa AS deleted
        FROM public.mst_vat_tu material
        INNER JOIN selected_tenant tenant ON tenant.tenant_id = material.tenant_id
        LEFT JOIN public.mst_don_vi_tinh main_unit ON main_unit.id = material.don_vi_tinh_id
        LEFT JOIN public.mst_thue_tai_nguyen resource_tax ON resource_tax.id = material.thue_tn_id
        LEFT JOIN public.mst_thue_tieu_thu_db excise_tax ON excise_tax.id = material.thue_ttdb_id
        LEFT JOIN public.mst_kho warehouse ON warehouse.id = material.kho_mac_dinh_id
        LEFT JOIN public.mst_he_thong_tai_khoan material_account ON material_account.id = material.tai_khoan_vat_tu_id
        LEFT JOIN public.mst_he_thong_tai_khoan cost_account ON cost_account.id = material.tai_khoan_gia_von_id
        LEFT JOIN public.mst_he_thong_tai_khoan revenue_account ON revenue_account.id = material.tai_khoan_doanh_thu_id
        LEFT JOIN public.mst_he_thong_tai_khoan return_account ON return_account.id = material.tai_khoan_hang_ban_tra_lai_id
        LEFT JOIN public.mst_he_thong_tai_khoan discount_account ON discount_account.id = material.tai_khoan_chiet_khau_id
        LEFT JOIN public.mst_he_thong_tai_khoan expense_account ON expense_account.id = material.tai_khoan_chi_phi_id
        LEFT JOIN public.mst_he_thong_tai_khoan reduction_account ON reduction_account.id = material.tai_khoan_giam_gia_id
        WHERE material.ma = $2 AND material.da_xoa = FALSE
      `,
      [username, code],
    );
  }

  /** Đọc trạng thái xóa mềm của đúng Vật tư, gồm cả bản ghi đã xóa, theo tenant mặc định. */
  async findDeletionStateByCodeForDefaultTenant(username: string, code: string): Promise<readonly VatTuDeletionState[]> {
    return this.client.query<VatTuDeletionState>(
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
        SELECT material.ma AS code, material.da_xoa AS deleted
        FROM public.mst_vat_tu material
        INNER JOIN selected_tenant tenant ON tenant.tenant_id = material.tenant_id
        WHERE material.ma = $2
      `,
      [username, code],
    );
  }
}
