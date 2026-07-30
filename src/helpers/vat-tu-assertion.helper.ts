import { expect, test } from '@fixtures/base.fixture';
import type { VatTuPage } from '@pages/vat-tu.page';
import { accountingAccountCoverage } from '@utils/vat-tu-test.util';

export async function verifyAccountingAccountCombobox(
  vatTuPage: VatTuPage,
  fieldLabel: string,
): Promise<void> {
  const accounts = await vatTuPage.openFromDanhMucAndCollectAccounts();
  const coverage = accountingAccountCoverage(accounts);
  test.skip(
    coverage === undefined,
    'Thiếu precondition: Hệ thống tài khoản chưa có đồng thời tài khoản hoạt động được phép hạch toán và tài khoản ngừng hoạt động',
  );
  if (!coverage) return;

  await vatTuPage.openMaterialTypePopup();
  await vatTuPage.selectMaterialType('Hàng hóa');
  await vatTuPage.openDefaultAccountingTab();
  await vatTuPage.openAccountingAccountDropdown(fieldLabel);

  const columnHeaders = (await vatTuPage.accountingAccountColumnHeaders.allTextContents())
    .map((header) => header.trim())
    .filter(Boolean);
  expect.soft(
    columnHeaders,
    `Combogrid ${fieldLabel} phải có đúng các cột theo BR5`,
  ).toEqual(['Số tài khoản', 'Tên tài khoản', 'Trạng thái']);

  await vatTuPage.searchAccountingAccount(fieldLabel, coverage.activeAllowed.code);
  await expect(
    vatTuPage.accountingAccountOption(coverage.activeAllowed.label),
    'Tài khoản hoạt động, cho phép hạch toán phải tìm được theo số hiệu',
  ).toBeVisible();
  const activeRowText = await vatTuPage
    .accountingAccountOptionRow(coverage.activeAllowed.label)
    .innerText();
  expect.soft(
    activeRowText,
    'Dòng tài khoản hoạt động phải hiển thị trạng thái Hoạt động',
  ).toContain('Hoạt động');

  await vatTuPage.searchAccountingAccount(fieldLabel, coverage.activeAllowed.name);
  await expect(
    vatTuPage.accountingAccountOption(coverage.activeAllowed.label),
    `${fieldLabel} phải tìm được theo tên tài khoản`,
  ).toBeVisible();
  await vatTuPage.selectAccountingAccount(fieldLabel, coverage.activeAllowed);
  await expect(
    vatTuPage.selectedAccountingAccount(fieldLabel, coverage.activeAllowed.label),
    'Phải chọn được tài khoản hoạt động có Cho phép hạch toán = Có',
  ).toBeVisible();

  await vatTuPage.openAccountingAccountDropdown(fieldLabel);
  await vatTuPage.searchAccountingAccount(fieldLabel, coverage.inactive.code);
  await expect(
    vatTuPage.accountingAccountOption(coverage.inactive.label),
    'Tài khoản ngừng hoạt động phải hiển thị',
  ).toBeVisible();
  const inactiveRowText = await vatTuPage
    .accountingAccountOptionRow(coverage.inactive.label)
    .innerText();
  expect.soft(
    inactiveRowText,
    'Dòng tài khoản ngừng hoạt động phải hiển thị trạng thái Ngừng hoạt động',
  ).toContain('Ngừng hoạt động');
  await vatTuPage.selectAccountingAccount(fieldLabel, coverage.inactive);
  await expect(
    vatTuPage.selectedAccountingAccount(fieldLabel, coverage.inactive.label),
    'Phải chọn được tài khoản ngừng hoạt động',
  ).toBeVisible();

  await vatTuPage.openAccountingAccountDropdown(fieldLabel);
  await vatTuPage.selectAccountingAccount(fieldLabel, coverage.activeAllowed);
  await expect(
    vatTuPage.selectedAccountingAccount(fieldLabel, coverage.activeAllowed.label),
    `Phải chọn được một ${fieldLabel} hợp lệ`,
  ).toBeVisible();
}
