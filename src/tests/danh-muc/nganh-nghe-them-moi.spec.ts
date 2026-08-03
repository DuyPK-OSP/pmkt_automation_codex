import { test, expect } from '@fixtures/base.fixture';
import { createTc50IndustryData, createTc51IndustryData } from '@test-data/nganh-nghe.data';
import { requireCredentials } from '@utils/env.config';

test.describe('PMKT-U-00123 - Thêm mới Ngành nghề', () => {
  test.beforeEach(async ({ loginPage }) => {
    const credentials = requireCredentials();
    await loginPage.open();
    await loginPage.login(credentials.username, credentials.password);
  });

  test('CL-UAT-U-00123-50 - Thêm mới thành công bằng nút Lưu và đối chiếu DB', async ({
    industryPage,
    industryCleanup,
    db,
  }) => {
    const data = createTc50IndustryData();

    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();
    await expect(industryPage.locators.statusSwitch, 'Trạng thái mặc định phải là Hoạt động').toBeChecked();
    await industryPage.fillIndustry(data);
    await industryPage.save();

    await expect(
      industryPage.locators.successAlert,
      'Phải hiển thị thông báo Thêm mới ngành nghề thành công',
    ).toBeVisible();
    industryCleanup.register(data.code);
    await expect(industryPage.locators.createDialog, 'Popup phải đóng sau khi lưu').toBeHidden();
    await expect(industryPage.industryRow(data.code), 'Bản ghi vừa tạo phải hiển thị trên danh sách').toBeVisible();

    const record = await db.nganhNghe.findLatestByUniqueCode(data.code);
    expect(record, `DB phải tồn tại bản ghi ${data.code}`).not.toBeNull();
    expect(record).toMatchObject({
      ma: data.code,
      ten: data.name,
      moTa: data.description,
      trangThai: true,
      daXoa: false,
    });
  });

  test('CL-UAT-U-00123-51 - Thêm mới thành công bằng nút Lưu và thêm mới và đối chiếu DB', async ({
    industryPage,
    industryCleanup,
    db,
  }) => {
    const data = createTc51IndustryData();

    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();
    await industryPage.fillIndustry(data);
    await industryPage.saveAndContinue();

    await expect(
      industryPage.locators.successAlert,
      'Phải hiển thị thông báo thêm mới ngành nghề thành công',
    ).toBeVisible();
    industryCleanup.register(data.code);
    await expect(industryPage.locators.createDialog, 'Popup thêm mới phải được giữ mở').toBeVisible();
    await expect(industryPage.locators.codeInput, 'Mã ngành nghề phải được reset về rỗng').toHaveValue('');
    await expect(industryPage.locators.nameInput, 'Tên ngành nghề phải được reset về rỗng').toHaveValue('');
    await expect(industryPage.locators.descriptionInput, 'Diễn giải phải được reset về rỗng').toHaveValue('');
    await expect.soft(
      industryPage.locators.codeInput,
      'Focus phải trở lại trường Mã ngành nghề',
    ).toBeFocused();
    await expect(industryPage.industryRow(data.code), 'Bản ghi vừa tạo phải hiển thị trên danh sách').toBeVisible();

    const record = await db.nganhNghe.findLatestByUniqueCode(data.code);
    expect(record, `DB phải tồn tại bản ghi ${data.code}`).not.toBeNull();
    expect(record).toMatchObject({
      ma: data.code,
      ten: data.name,
      moTa: null,
      trangThai: true,
      daXoa: false,
    });
  });
});
