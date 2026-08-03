import type { Locator, Page } from '@playwright/test';

export interface NganhNgheLocatorMap {
  readonly industryEntry: Locator;
  readonly addButton: Locator;
  readonly createDialog: Locator;
  readonly codeInput: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly statusSwitch: Locator;
  readonly saveButton: Locator;
  readonly saveAndContinueButton: Locator;
  readonly closeButton: Locator;
  readonly successAlert: Locator;
  readonly row: (code: string) => Locator;
}

export function createNganhNgheLocatorMap(page: Page): NganhNgheLocatorMap {
  const createDialog = page.getByRole('dialog', { name: 'Thêm mới ngành nghề' });
  return {
    industryEntry: page.getByText('Ngành nghề', { exact: true }),
    addButton: page.getByText('Thêm mới', { exact: true }),
    createDialog,
    codeInput: createDialog.locator('#ma'),
    nameInput: createDialog.locator('#ten'),
    descriptionInput: createDialog.locator('#moTa'),
    statusSwitch: createDialog.getByRole('switch'),
    saveButton: createDialog.getByRole('button', { name: 'Lưu', exact: true }),
    saveAndContinueButton: createDialog.getByRole('button', { name: 'Lưu và tiếp tục', exact: true }),
    closeButton: createDialog.getByRole('button', { name: 'Close', exact: true }),
    successAlert: page.getByRole('alert').filter({ hasText: 'Thêm mới ngành nghề thành công' }),
    row: (code) => page.getByRole('table').first().getByRole('row').filter({
      has: page.getByRole('button', { name: code, exact: true }),
    }),
  };
}
