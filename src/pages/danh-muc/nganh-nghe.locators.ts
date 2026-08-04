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
  readonly expectedSaveAndCreateButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;
  readonly cancelConfirmationDialog: Locator;
  readonly cancelConfirmationMessage: Locator;
  readonly unsavedChangesMessage: Locator;
  readonly confirmCancelButton: Locator;
  readonly keepEditingButton: Locator;
  readonly codeRequiredError: Locator;
  readonly nameRequiredError: Locator;
  readonly codeMaxLengthError: Locator;
  readonly nameMaxLengthError: Locator;
  readonly descriptionMaxLengthError: Locator;
  readonly duplicateCodeError: Locator;
  readonly successAlert: Locator;
  readonly row: (code: string) => Locator;
  readonly deleteButton: (code: string) => Locator;
  readonly deleteConfirmationDialog: Locator;
  readonly confirmDeleteButton: Locator;
}

export function createNganhNgheLocatorMap(page: Page): NganhNgheLocatorMap {
  const createDialog = page.getByRole('dialog', { name: 'Thêm mới ngành nghề' });
  const cancelConfirmationDialog = page.getByRole('dialog').filter({
    hasText: 'Bạn có chắc chắn muốn hủy thao tác thêm mới không?',
  }).last();
  const deleteConfirmationDialog = page.getByRole('dialog').filter({ hasText: /xóa/i }).last();
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
    expectedSaveAndCreateButton: createDialog.getByRole('button', { name: 'Lưu và thêm mới', exact: true }),
    cancelButton: createDialog.getByRole('button', { name: 'Hủy', exact: true }),
    closeButton: createDialog.getByRole('button', { name: 'Close', exact: true }),
    cancelConfirmationDialog,
    cancelConfirmationMessage: cancelConfirmationDialog.locator('.ant-modal-confirm-title'),
    unsavedChangesMessage: cancelConfirmationDialog
      .getByText('Các thay đổi sẽ không được lưu.', { exact: true }).first(),
    confirmCancelButton: cancelConfirmationDialog.getByRole('button', { name: 'Xác nhận', exact: true }),
    keepEditingButton: cancelConfirmationDialog.getByRole('button', { name: 'Hủy', exact: true }),
    codeRequiredError: createDialog.getByText('Mã ngành nghề không được để trống', { exact: true }),
    nameRequiredError: createDialog.getByText('Tên ngành nghề không được để trống', { exact: true }),
    codeMaxLengthError: createDialog.getByText('Mã ngành nghề không được vượt quá 50 ký tự', { exact: true }),
    nameMaxLengthError: createDialog.getByText('Tên ngành nghề không được vượt quá 250 ký tự', { exact: true }),
    descriptionMaxLengthError: createDialog.getByText('Diễn giải không được vượt quá 500 ký tự', { exact: true }),
    duplicateCodeError: createDialog.getByText('Mã ngành nghề đã tồn tại trong hệ thống', { exact: true }),
    successAlert: page.getByRole('alert').filter({ hasText: 'Thêm mới ngành nghề thành công' }),
    row: (code) => page.getByRole('table').first().getByRole('row').filter({
      has: page.getByRole('button', { name: code, exact: true }),
    }),
    deleteButton: (code) => page.getByRole('table').first().getByRole('row').filter({
      has: page.getByRole('button', { name: code, exact: true }),
    }).getByRole('button').last(),
    deleteConfirmationDialog,
    confirmDeleteButton: deleteConfirmationDialog
      .getByRole('button', { name: /xác nhận|xóa/i }).last(),
  };
}
