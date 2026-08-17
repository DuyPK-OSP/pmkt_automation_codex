import type { DatabaseContext } from '@database/database.context';
import type { DonViQuyDoiVatTuRecord } from '@database/repositories/don-vi-quy-doi-vat-tu.repository';
import type { VatTuDatabaseType } from '@database/repositories/vat-tu.repository';
import { expect } from '@fixtures/base.fixture';
import { expectedVatRateLabel, normalizeCatalogueLabel, openMaterialDetailTabIfVisible, readMaterialDetailConversionRows, readMaterialDetailFieldText, readMaterialDetailNumber } from '@helpers/vat-tu-detail.helper';
import type { MaterialType, VatTuPage } from '@pages/danh-muc/vat-tu.page';
import { requireCredentials } from '@utils/env.config';

const materialTypeCodes: Readonly<Record<MaterialType, VatTuDatabaseType>> = {
  'Hàng hóa': 'HangHoa',
  'Dịch vụ': 'DichVu',
  'Nguyên vật liệu': 'NguyenVatLieu',
  'Công cụ, dụng cụ': 'CongCuDungCu',
  'Thành phẩm': 'ThanhPham',
  'Bán thành phẩm': 'BanThanhPham',
};

async function expectNullableTextField(
  vatTuPage: VatTuPage,
  code: string,
  label: string,
  expected: string | null,
): Promise<void> {
  await expect.soft(vatTuPage.materialDetailControl(code, label, 'textbox'), `${label} phải khớp DB`).toHaveValue(expected ?? '');
}

async function expectNullableNumberById(
  vatTuPage: VatTuPage,
  code: string,
  id: string,
  expected: string | number | null,
): Promise<void> {
  const actual = await readMaterialDetailNumber(vatTuPage, code, id);
  await expect.soft(actual, `${id} phải khớp giá trị số trong DB`).toBe(expected === null ? null : Number(expected));
}

async function expectSelectionOrEmpty(
  vatTuPage: VatTuPage,
  code: string,
  label: string,
  expected: string | null,
): Promise<void> {
  if (expected) {
    await expectCatalogueValueInField(vatTuPage, code, label, expected);
  } else {
    await expect.soft(vatTuPage.materialDetailControl(code, label, 'combobox'), `${label} phải rỗng như DB`).toHaveValue('');
  }
}

async function expectCatalogueValueInField(
  vatTuPage: VatTuPage,
  code: string,
  label: string,
  expected: string,
): Promise<void> {
  const actual = await readMaterialDetailFieldText(vatTuPage, code, label);
  await expect.soft(actual, `${label} phải khớp danh mục DB`).toContain(normalizeCatalogueLabel(expected));
}

export async function verifyMaterialDetailAgainstDatabase(
  vatTuPage: VatTuPage,
  db: DatabaseContext,
  code: string,
  materialType: MaterialType,
  mode: 'detail' | 'edit' = 'detail',
): Promise<void> {
  const credentials = requireCredentials();
  const records = await db.vatTu.findByCodeForDefaultTenant(credentials.username, code);
  expect(records, `DB phải trả về đúng một Vật tư loại ${materialType}`).toHaveLength(1);
  const record = records[0]!;
  expect(record.materialType, 'Tính chất Vật tư trong DB phải đúng testcase').toBe(materialType);
  const conversions = await db.donViQuyDoiVatTu.listByMaterialCodeForDefaultTenant(credentials.username, code);

  await vatTuPage.openFromDanhMuc();
  await vatTuPage.searchMaterial(code);
  await vatTuPage.openMaterialDetails(code);
  await expect(vatTuPage.materialDetailHeading(code), 'Popup Chi tiết phải mở đúng mã lấy từ DB').toBeVisible();
  if (mode === 'edit') await vatTuPage.openMaterialEdit(code);

  await expect.soft(vatTuPage.materialDetailControlById(code, 'loaiVatTu')).toHaveValue(materialTypeCodes[materialType]);
  await expect.soft(vatTuPage.materialDetailControlById(code, 'ma')).toHaveValue(record.code);
  await expect.soft(vatTuPage.materialDetailControlById(code, 'ten')).toHaveValue(record.name);
  await expect.soft(vatTuPage.materialDetailControlById(code, 'anhId')).toHaveValue(record.imageId ?? '');
  if (record.imageId) await expect.soft(vatTuPage.materialDetailImage(code), 'Ảnh Vật tư phải hiển thị đúng bản ghi đã lưu').toBeVisible();
  else await expect.soft(vatTuPage.materialDetailImage(code), 'Không có ảnh trong DB thì Chi tiết không được hiển thị thumbnail').toBeHidden();
  await expectSelectionOrEmpty(vatTuPage, code, 'Đơn vị tính chính', record.mainUnit);
  for (const group of record.groups) {
    await expectCatalogueValueInField(vatTuPage, code, 'Nhóm vật tư', group);
  }
  if (record.groups.length === 0) {
    await expect.soft(vatTuPage.materialDetailControl(code, 'Nhóm vật tư', 'combobox')).toHaveValue('');
  }
  await expectNullableTextField(vatTuPage, code, 'Tên vật tư khi mua', record.purchaseName);
  await expectNullableTextField(vatTuPage, code, 'Tên vật tư khi bán', record.saleName);
  await expectNullableTextField(vatTuPage, code, 'Mô tả', record.description);
  if (record.active) await expect.soft(vatTuPage.materialDetailStatusSwitch(code)).toBeChecked();
  else await expect.soft(vatTuPage.materialDetailStatusSwitch(code)).not.toBeChecked();
  const reducedTax = vatTuPage.materialDetailControlById(code, 'giamThueTheoQuyDinh');
  if (record.reducedTax) await expect.soft(reducedTax).toBeChecked();
  else await expect.soft(reducedTax).not.toBeChecked();

  const specialGoodsType = vatTuPage.materialDetailControlById(code, 'loaiHangHoaDacTrung');
  if (materialType === 'Hàng hóa' || materialType === 'Dịch vụ') {
    await expectSelectionOrEmpty(vatTuPage, code, 'Loại hàng hóa đặc trưng', record.specialGoodsType);
  } else {
    await expect.soft(specialGoodsType, `Loại ${materialType} không có trường Loại hàng hóa đặc trưng`).toBeHidden();
  }

  if (materialType !== 'Dịch vụ') {
    await expectNullableNumberById(vatTuPage, code, 'thoiHanBaoHanh', record.warrantyPeriod);
    if (record.warrantyUnit) {
      await expect.soft(
        vatTuPage.materialDetailText(code, record.warrantyUnit),
        'Đơn vị thời hạn bảo hành phải khớp DB',
      ).toBeVisible();
    }
  }

  const expectedTabs = materialType === 'Dịch vụ'
    ? ['Hạch toán ngầm định', 'Thông tin thuế', 'Đơn vị tính khác']
    : ['Hạch toán ngầm định', 'Thông tin kho', 'Thông tin thuế', 'Đơn vị quy đổi'];
  await expect.soft(vatTuPage.materialDetailTabs(code), 'Các tab Chi tiết phải khớp đầy đủ cấu trúc form Thêm mới').toHaveText(expectedTabs);

  await expect.soft(vatTuPage.materialDetailTab(code, 'Hạch toán ngầm định')).toBeVisible();
  const hasAccountingTab = await openMaterialDetailTabIfVisible(vatTuPage, code, 'Hạch toán ngầm định');
  const accountFields: readonly [string, string | null][] = materialType === 'Dịch vụ'
    ? [
      ['Tài khoản doanh thu', record.revenueAccount],
      ['Tài khoản chiết khấu', record.discountAccount],
      ['Tài khoản giảm giá', record.priceReductionAccount],
      ['Tài khoản hàng bán trả lại', record.salesReturnAccount],
      ['Tài khoản chi phí', record.expenseAccount],
    ]
    : [
      ['Tài khoản vật tư', record.materialAccount],
      ['Tài khoản doanh thu', record.revenueAccount],
      ['Tài khoản giá vốn', record.costOfGoodsAccount],
      ['Tài khoản chiết khấu', record.discountAccount],
      ['Tài khoản giảm giá', record.priceReductionAccount],
      ['Tài khoản hàng bán trả lại', record.salesReturnAccount],
      ['Tài khoản chi phí', record.expenseAccount],
    ];
  if (hasAccountingTab) {
    for (const [label, expected] of accountFields) await expectSelectionOrEmpty(vatTuPage, code, label, expected);
  }

  if (materialType !== 'Dịch vụ') {
    await expect.soft(vatTuPage.materialDetailTab(code, 'Thông tin kho')).toBeVisible();
    const hasInventoryTab = await openMaterialDetailTabIfVisible(vatTuPage, code, 'Thông tin kho');
    if (hasInventoryTab) {
      await expectSelectionOrEmpty(vatTuPage, code, 'Kho mặc định', record.warehouse);
      await expectSelectionOrEmpty(vatTuPage, code, 'Phương pháp tính giá', record.pricingMethod);
      await expectNullableNumberById(vatTuPage, code, 'tonToiThieu', record.minimumStock);
      await expectNullableNumberById(vatTuPage, code, 'tonToiDa', record.maximumStock);
      const trackLot = vatTuPage.materialDetailControlById(code, 'theoDoiLo');
      const trackBarcode = vatTuPage.materialDetailControlById(code, 'theoDoiMaVach');
      if (record.trackLot) await expect.soft(trackLot).toBeChecked(); else await expect.soft(trackLot).not.toBeChecked();
      if (record.trackBarcode) await expect.soft(trackBarcode).toBeChecked(); else await expect.soft(trackBarcode).not.toBeChecked();
    }
  }

  await expect.soft(vatTuPage.materialDetailTab(code, 'Thông tin thuế')).toBeVisible();
  const hasTaxTab = await openMaterialDetailTabIfVisible(vatTuPage, code, 'Thông tin thuế');
  if (hasTaxTab) {
    await expectSelectionOrEmpty(vatTuPage, code, 'Thuế suất GTGT mặc định', expectedVatRateLabel(record.defaultVatRate));
    await expectNullableNumberById(vatTuPage, code, 'giaTriThueSuatGtgt', record.defaultVatValue);
    await expectSelectionOrEmpty(vatTuPage, code, 'Thuế tiêu thụ đặc biệt', record.exciseTax);
    if (materialType !== 'Dịch vụ') {
      await expectNullableNumberById(vatTuPage, code, 'thueNhapKhau', record.importTax);
      await expectNullableNumberById(vatTuPage, code, 'thueXuatKhau', record.exportTax);
      await expectSelectionOrEmpty(vatTuPage, code, 'Thuế tài nguyên', record.resourceTax);
    }
  }

  if (materialType === 'Dịch vụ') {
    await expect.soft(vatTuPage.materialDetailTab(code, 'Đơn vị tính khác')).toBeVisible();
    const hasAlternativeUnitTab = await openMaterialDetailTabIfVisible(vatTuPage, code, 'Đơn vị tính khác');
    if (hasAlternativeUnitTab) {
      const actualUnits = normalizeCatalogueLabel(
        await vatTuPage.materialDetailTabPanel(code, 'Đơn vị tính khác').innerText(),
      );
      for (const unit of record.alternativeUnits) {
        await expect.soft(
          actualUnits,
          'Đơn vị tính khác phải khớp DB',
        ).toContain(normalizeCatalogueLabel(unit));
      }
    }
  } else {
    await expect.soft(vatTuPage.materialDetailTab(code, 'Đơn vị quy đổi')).toBeVisible();
    const hasConversionTab = await openMaterialDetailTabIfVisible(vatTuPage, code, 'Đơn vị quy đổi');
    if (hasConversionTab) await verifyConversionRows(vatTuPage, code, conversions);
  }

  if (mode === 'detail') {
    await expect.soft(
      await vatTuPage.materialDetailControls(code).evaluateAll((controls) => controls.every((control) => control.hasAttribute('disabled'))),
      'Tất cả control dữ liệu trên màn Chi tiết phải readonly/disabled',
    ).toBe(true);
  }
}

async function verifyConversionRows(
  vatTuPage: VatTuPage,
  code: string,
  conversions: readonly DonViQuyDoiVatTuRecord[],
): Promise<void> {
  const normalizedRows = await readMaterialDetailConversionRows(vatTuPage, code);
  for (const conversion of conversions) {
    const unit = normalizeCatalogueLabel(conversion.unit);
    const rowIndex = normalizedRows.findIndex((row) => row.includes(unit));
    await expect.soft(rowIndex, 'Đơn vị quy đổi phải khớp DB').toBeGreaterThanOrEqual(0);
    if (rowIndex < 0) continue;
    const rowValue = normalizedRows[rowIndex]!;
    await expect.soft(rowValue, 'Tỷ lệ quy đổi phải khớp DB').toContain(String(Number(conversion.ratio)));
    await expect.soft(rowValue, 'Phép tính quy đổi phải khớp DB').toContain(conversion.operation);
    if (conversion.description) await expect.soft(rowValue, 'Mô tả quy đổi phải khớp DB').toContain(conversion.description);
  }
}
