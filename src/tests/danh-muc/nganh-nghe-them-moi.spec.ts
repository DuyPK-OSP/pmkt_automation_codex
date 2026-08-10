import { test, expect } from '@fixtures/base.fixture';
import {
  createTc36IndustryData,
  createTc39IndustryData,
  createTc40IndustryData,
  createTc41IndustryData,
  createTc42IndustryData,
  createTc43IndustryData,
  createTc44IndustryData,
  createTc45IndustryData,
  createTc46IndustryData,
  createTc47IndustryData,
  createTc49IndustryData,
  createTc50IndustryData,
  createTc51IndustryData,
  createTc53IndustryData,
} from '@test-data/danh-muc/nganh-nghe/nganh-nghe.data';
import { requireCredentials } from '@utils/env.config';

test.describe('PMKT-U-00123 - Thêm mới Ngành nghề', () => {
  // Mỗi testcase đăng nhập lại để bảo đảm độc lập, không dùng chung trạng thái phiên từ testcase trước.
  test.beforeEach(async ({ loginPage }) => {
    const credentials = requireCredentials();
    await loginPage.open();
    await loginPage.login(credentials.username, credentials.password);
  });

  test('CL-UAT-U-00123-32 - popup thêm mới hiển thị đúng layout', async ({ industryPage }) => {
    // Hành động: Truy cập Danh mục Ngành nghề > Mở form Thêm mới.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();

    const ui = await industryPage.getCreateDialogUiState();
    const dialogCenterX = ui.dialogBox.x + ui.dialogBox.width / 2;

    // Xác nhận: Popup hiển thị đúng tiêu đề, kích thước, vị trí, overlay và nút đóng.
    await expect(industryPage.locators.createDialog, 'Popup Thêm mới ngành nghề phải hiển thị').toBeVisible();
    expect(ui.title, 'Title popup phải là Thêm mới ngành nghề').toBe('Thêm mới ngành nghề');
    expect(ui.dialogBox.width, 'Popup phải có kích thước medium phù hợp').toBeGreaterThanOrEqual(550);
    expect(ui.dialogBox.width, 'Popup không được rộng quá kích thước medium').toBeLessThanOrEqual(800);
    expect(Math.abs(dialogCenterX - ui.viewport.width / 2), 'Popup phải căn giữa hoặc ở vị trí phù hợp theo chiều ngang').toBeLessThanOrEqual(50);
    expect(ui.dialogBox.y, 'Popup không được tràn phía trên viewport').toBeGreaterThanOrEqual(0);
    expect(ui.dialogBox.y + ui.dialogBox.height, 'Popup phải nằm trọn trong viewport').toBeLessThanOrEqual(ui.viewport.height);
    expect(ui.hasDimmedOverlay, 'Background overlay phải được làm tối').toBe(true);
    await expect(industryPage.locators.closeButton, 'Phải có nút đóng X ở góc trên bên phải').toBeVisible();
  });

  test('CL-UAT-U-00123-33 - form fields hiển thị đúng thứ tự và thuộc tính', async ({ industryPage }) => {
    // Hành động: Truy cập Danh mục Ngành nghề > Mở form Thêm mới.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();

    const ui = await industryPage.getCreateDialogUiState();
    const [code, name, description] = ui.fields;

    // Xác nhận: Các trường Mã, Tên, Diễn giải hiển thị đúng thứ tự và đúng thuộc tính quy định.
    expect(ui.fields.map((field) => field.id), 'Thứ tự field phải là Mã → Tên → Diễn giải').toEqual(['ma', 'ten', 'moTa']);
    expect(code?.label, 'Label Mã ngành nghề phải hiển thị rõ ràng').toContain('Mã ngành nghề');
    expect(code?.required, 'Mã ngành nghề phải có required marker').toBe(true);
    expect(code?.tagName, 'Mã ngành nghề phải là text input').toBe('input');
    expect(code?.maxLength, 'Mã ngành nghề phải giới hạn 50 ký tự').toBe(50);
    expect(code?.placeholder, 'Mã ngành nghề phải có placeholder gợi ý').not.toBe('');
    expect(name?.label, 'Label Tên ngành nghề phải hiển thị rõ ràng').toContain('Tên ngành nghề');
    expect(name?.required, 'Tên ngành nghề phải có required marker').toBe(true);
    expect(name?.tagName, 'Tên ngành nghề phải là text input').toBe('input');
    expect(name?.maxLength, 'Tên ngành nghề phải giới hạn 250 ký tự').toBe(250);
    expect(name?.placeholder, 'Tên ngành nghề phải có placeholder gợi ý').not.toBe('');
    expect(description?.label, 'Label Diễn giải phải hiển thị rõ ràng').toContain('Diễn giải');
    expect(description?.required, 'Diễn giải không được có required marker').toBe(false);
    expect(description?.tagName, 'Diễn giải phải là textarea').toBe('textarea');
    expect(description?.maxLength, 'Diễn giải phải giới hạn 500 ký tự').toBe(500);
    expect(description?.placeholder, 'Diễn giải phải có placeholder gợi ý').not.toBe('');
    expect(code!.y < name!.y && name!.y < description!.y, 'Các field phải hiển thị đúng thứ tự từ trên xuống').toBe(true);
  });

  test('CL-UAT-U-00123-34 - action buttons hiển thị đúng thứ tự và styling', async ({ industryPage }) => {
    // Hành động: Truy cập Danh mục Ngành nghề > Mở form Thêm mới.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();

    const ui = await industryPage.getCreateDialogUiState();
    const cancel = ui.buttons.find((button) => button.text === 'Hủy');
    const save = ui.buttons.find((button) => button.text === 'Lưu');
    const saveAndCreate = ui.buttons.find((button) => button.text === 'Lưu và thêm mới' || button.text === 'Lưu và tiếp tục');

    // Xác nhận: Các nút hiển thị đúng tên, thứ tự và kiểu trình bày primary/secondary.
    await expect(industryPage.locators.cancelButton, 'Nút Hủy phải hiển thị').toBeVisible();
    await expect(industryPage.locators.saveButton, 'Nút Lưu phải hiển thị').toBeVisible();
    await expect.soft(industryPage.locators.expectedSaveAndCreateButton, 'Nút Lưu và thêm mới phải hiển thị').toBeVisible();
    await expect(industryPage.locators.closeButton, 'Biểu tượng đóng X phải hiển thị').toBeVisible();
    expect(cancel, 'Phải thu thập được styling nút Hủy').toBeDefined();
    expect(save, 'Phải thu thập được styling nút Lưu').toBeDefined();
    expect(saveAndCreate, 'Phải thu thập được styling action Lưu và thêm mới').toBeDefined();
    expect(cancel!.x < save!.x && save!.x < saveAndCreate!.x, 'Thứ tự nút phải là Hủy → Lưu → Lưu và thêm mới').toBe(true);
    expect(
      ['rgba(0, 0, 0, 0)', 'rgb(255, 255, 255)'],
      'Nút Hủy phải có nền transparent hoặc trắng của styling secondary',
    ).toContain(cancel!.backgroundColor);
    expect(cancel!.borderColor, 'Nút Hủy phải có border của styling secondary').not.toBe('rgba(0, 0, 0, 0)');
    expect(save!.backgroundColor, 'Nút Lưu và action Lưu và thêm mới phải cùng styling primary').toBe(saveAndCreate!.backgroundColor);
    expect(saveAndCreate!.backgroundColor, 'Nút Lưu và thêm mới phải có styling primary').not.toBe('rgba(0, 0, 0, 0)');
  });

  test('CL-UAT-U-00123-35 - focus tự động vào Mã ngành nghề khi mở popup', async ({ industryPage }) => {
    // Hành động: Truy cập Danh mục Ngành nghề > Mở form Thêm mới > Nhập ký tự vào trường đang focus.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();

    // Xác nhận: Focus tự động đặt tại Mã ngành nghề và có thể nhập dữ liệu ngay.
    await expect(industryPage.locators.createDialog, 'Popup thêm mới phải hiển thị').toBeVisible();
    await expect(industryPage.locators.codeInput, 'Focus phải tự động ở field Mã ngành nghề').toBeFocused();
    await industryPage.locators.codeInput.pressSequentially('A');
    await expect(industryPage.locators.codeInput, 'Có thể nhập dữ liệu ngay sau khi popup mở').toHaveValue('A');
  });

  test('CL-UAT-U-00123-36 - keyboard navigation trong popup thêm mới', async ({ industryPage }) => {
    // Chuẩn bị dữ liệu: Sinh dữ liệu hợp lệ để kiểm tra thao tác đóng form bằng phím Escape.
    const data = createTc36IndustryData();

    // Hành động: Truy cập > Mở form Thêm mới > Dùng Tab và Shift+Tab di chuyển giữa các trường, nút.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();

    // Xác nhận: Focus di chuyển đúng thứ tự khi nhấn Tab và di chuyển ngược khi nhấn Shift+Tab.
    await industryPage.locators.codeInput.focus();
    await expect(industryPage.locators.codeInput, 'Bắt đầu kiểm tra Tab tại Mã ngành nghề').toBeFocused();
    await industryPage.pressTab();
    await expect(industryPage.locators.nameInput, 'Tab từ Mã phải chuyển đến Tên').toBeFocused();
    await industryPage.pressTab();
    await expect(industryPage.locators.descriptionInput, 'Tab từ Tên phải chuyển đến Diễn giải').toBeFocused();
    await industryPage.pressTab();
    await expect.soft(
      await industryPage.locators.saveButton.evaluate((element) => element === document.activeElement),
      'Tab từ Diễn giải phải chuyển đến Lưu',
    ).toBe(true);
    await industryPage.locators.saveButton.focus();
    await industryPage.pressTab();
    await expect.soft(
      await industryPage.locators.saveAndContinueButton.evaluate((element) => element === document.activeElement),
      'Tab từ Lưu phải chuyển đến action Lưu và thêm mới',
    ).toBe(true);
    await industryPage.locators.saveAndContinueButton.focus();
    await industryPage.pressTab();
    await expect.soft(
      await industryPage.locators.cancelButton.evaluate((element) => element === document.activeElement),
      'Tab tiếp theo phải chuyển đến Hủy',
    ).toBe(true);
    await industryPage.locators.cancelButton.focus();
    await industryPage.pressShiftTab();
    await expect.soft(
      await industryPage.locators.saveAndContinueButton.evaluate((element) => element === document.activeElement),
      'Shift+Tab phải di chuyển ngược về action Lưu và thêm mới',
    ).toBe(true);
    await industryPage.locators.saveAndContinueButton.focus();
    await industryPage.pressShiftTab();
    await expect.soft(
      await industryPage.locators.saveButton.evaluate((element) => element === document.activeElement),
      'Shift+Tab tiếp theo phải di chuyển ngược về Lưu',
    ).toBe(true);

    // Hành động: Focus nút Hủy > Nhấn Enter.
    await industryPage.locators.cancelButton.focus();
    await industryPage.pressEnter();

    // Xác nhận: Phím Enter thực thi nút đang focus và đóng form.
    await expect(industryPage.locators.createDialog, 'Enter phải thực hiện action của nút đang focus').toBeHidden();

    // Hành động: Mở lại form > Nhập dữ liệu > Nhấn Escape.
    await industryPage.openCreateDialog();
    await industryPage.fillIndustry(data);
    await industryPage.pressEscape();

    // Xác nhận: Phím Escape hiển thị popup xác nhận hủy khi form đã có dữ liệu.
    await expect(industryPage.locators.cancelConfirmationDialog, 'Escape phải hiển thị popup xác nhận hủy').toBeVisible();
  });

  test('CL-UAT-U-00123-39 - Hủy đóng popup và reset dữ liệu', async ({ industryPage }) => {
    // Chuẩn bị dữ liệu: Sinh dữ liệu Ngành nghề dùng để kiểm tra thao tác Hủy.
    const data = createTc39IndustryData();

    // Hành động: Truy cập > Mở form Thêm mới > Nhập dữ liệu > Nhấn nút Hủy.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();
    await industryPage.fillIndustry(data);
    await industryPage.cancelCreate();

    // Xác nhận: Form đóng không cần xác nhận và dữ liệu đã nhập không được lưu.
    const confirmationVisible = await industryPage.locators.cancelConfirmationDialog.isVisible();
    await expect.soft(
      confirmationVisible,
      'Nút Hủy phải đóng popup ngay, không hiển thị xác nhận theo testcase',
    ).toBe(false);
    // Nếu UI thực tế mở popup xác nhận, đóng popup để tiếp tục đối chiếu các kết quả còn lại của testcase.
    if (confirmationVisible) await industryPage.confirmCancelCreate();
    await expect(industryPage.locators.createDialog, 'Popup thêm mới phải đóng sau khi Hủy').toBeHidden();
    await expect(industryPage.industryRow(data.code), 'Dữ liệu đã nhập không được lưu').toBeHidden();

    // Hành động: Mở lại form Thêm mới.
    await industryPage.openCreateDialog();

    // Xác nhận: Các trường được reset về rỗng; Hủy form rỗng phải đóng ngay, không hỏi xác nhận.
    await expect(industryPage.locators.codeInput, 'Mã ngành nghề phải được reset').toHaveValue('');
    await expect(industryPage.locators.nameInput, 'Tên ngành nghề phải được reset').toHaveValue('');
    await expect(industryPage.locators.descriptionInput, 'Diễn giải phải được reset').toHaveValue('');
    await industryPage.cancelCreate();
    await expect(industryPage.locators.cancelConfirmationDialog, 'Form trống không được hiển thị xác nhận hủy').toBeHidden();
    await expect(industryPage.locators.createDialog, 'Form trống phải đóng ngay khi Hủy').toBeHidden();
  });

  test('CL-UAT-U-00123-40 - icon X hiển thị xác nhận khi đã nhập dữ liệu', async ({ industryPage }) => {
    // Chuẩn bị dữ liệu: Sinh dữ liệu Ngành nghề dùng để kiểm tra cảnh báo thay đổi chưa lưu.
    const data = createTc40IndustryData();

    // Hành động: Truy cập > Mở form Thêm mới > Nhập dữ liệu > Nhấn biểu tượng X.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();
    await industryPage.fillIndustry(data);
    await industryPage.closeCreate();

    // Xác nhận: Hiển thị popup cảnh báo với đầy đủ nội dung và hai lựa chọn Xác nhận/Hủy.
    await expect(industryPage.locators.cancelConfirmationDialog, 'Phải hiển thị popup xác nhận hủy').toBeVisible();
    await expect(industryPage.locators.cancelConfirmationMessage, 'Popup phải hiển thị đúng câu hỏi xác nhận').toBeVisible();
    await expect.soft(industryPage.locators.unsavedChangesMessage, 'Popup phải cảnh báo Các thay đổi sẽ không được lưu.').toBeVisible();
    await expect(industryPage.locators.confirmCancelButton, 'Phải có nút Xác nhận').toBeVisible();
    await expect(industryPage.locators.keepEditingButton, 'Phải có nút Hủy').toBeVisible();

    // Hành động: Chọn Hủy trên popup xác nhận để tiếp tục chỉnh sửa.
    await industryPage.keepEditing();

    // Xác nhận: Popup xác nhận đóng, form Thêm mới vẫn mở và dữ liệu được giữ nguyên.
    await expect(industryPage.locators.cancelConfirmationDialog, 'Hủy xác nhận phải đóng popup xác nhận').toBeHidden();
    await expect(industryPage.locators.createDialog, 'Hủy xác nhận phải giữ popup thêm mới').toBeVisible();
    await expect(industryPage.locators.codeInput, 'Dữ liệu Mã phải được giữ nguyên').toHaveValue(data.code);
    await expect(industryPage.locators.nameInput, 'Dữ liệu Tên phải được giữ nguyên').toHaveValue(data.name);
    await expect(industryPage.locators.descriptionInput, 'Dữ liệu Diễn giải phải được giữ nguyên').toHaveValue(data.description!);

    // Hành động: Nhấn X lần nữa > Chọn Xác nhận hủy dữ liệu.
    await industryPage.closeCreate();
    await industryPage.confirmCancelCreate();

    // Xác nhận: Các popup đều đóng và dữ liệu bị hủy không xuất hiện trong danh sách.
    await expect(industryPage.locators.cancelConfirmationDialog, 'Xác nhận phải đóng popup xác nhận').toBeHidden();
    await expect(industryPage.locators.createDialog, 'Xác nhận phải đóng popup thêm mới').toBeHidden();
    await expect(industryPage.industryRow(data.code), 'Dữ liệu bị hủy không được lưu').toBeHidden();
  });

  test('CL-UAT-U-00123-41 - validate thiếu Mã ngành nghề bắt buộc', async ({ page, industryPage }) => {
    // Chuẩn bị dữ liệu: Chỉ sinh Tên ngành nghề, để trống trường Mã và theo dõi request tạo mới.
    const data = createTc41IndustryData();
    let createRequestCount = 0;
    page.on('request', (request) => {
      const isCreateRequest = request.method() === 'POST' && /nganh-nghe/i.test(request.url());
      if (isCreateRequest) createRequestCount += 1;
    });

    // Hành động: Truy cập > Mở form Thêm mới > Nhập Tên, bỏ trống Mã > Nhấn nút Lưu.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();
    await industryPage.locators.nameInput.fill(data.name);
    await industryPage.save();

    // Xác nhận: Trường Mã báo lỗi bắt buộc, được highlight đỏ, form vẫn mở và không gửi API.
    await expect(industryPage.locators.codeRequiredError, 'Phải hiển thị MSG_NN_001 tại field Mã ngành nghề').toBeVisible();
    await expect(industryPage.locators.codeInput, 'Mã ngành nghề phải có trạng thái invalid').toHaveAttribute('aria-invalid', 'true');
    expect(await industryPage.isCodeInputHighlightedAsError(), 'Field Mã ngành nghề phải được highlight đỏ').toBe(true);
    expect(createRequestCount, 'Không được gửi API tạo mới khi thiếu Mã ngành nghề').toBe(0);
    await expect(industryPage.locators.createDialog, 'Popup thêm mới phải vẫn mở').toBeVisible();
  });

  test('CL-UAT-U-00123-42 - validate thiếu Tên ngành nghề bắt buộc', async ({ page, industryPage }) => {
    // Chuẩn bị dữ liệu: Chỉ sinh Mã ngành nghề, để trống trường Tên và theo dõi request tạo mới.
    const data = createTc42IndustryData();
    let createRequestCount = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && /nganh-nghe/i.test(request.url())) createRequestCount += 1;
    });

    // Hành động: Truy cập > Mở form Thêm mới > Nhập Mã, bỏ trống Tên > Nhấn nút Lưu.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();
    await industryPage.locators.codeInput.fill(data.code);
    await industryPage.save();

    // Xác nhận: Trường Tên báo lỗi bắt buộc, được highlight đỏ, form vẫn mở và không gửi API.
    await expect(industryPage.locators.nameRequiredError, 'Phải hiển thị MSG_NN_002 tại field Tên ngành nghề').toBeVisible();
    await expect(industryPage.locators.nameInput, 'Tên ngành nghề phải có trạng thái invalid').toHaveAttribute('aria-invalid', 'true');
    expect(await industryPage.isNameInputHighlightedAsError(), 'Field Tên ngành nghề phải được highlight đỏ').toBe(true);
    expect(createRequestCount, 'Không được gửi API tạo mới khi thiếu Tên ngành nghề').toBe(0);
    await expect(industryPage.locators.createDialog, 'Popup thêm mới phải vẫn mở').toBeVisible();
  });

  test('CL-UAT-U-00123-43 - validate thiếu cả Mã và Tên ngành nghề', async ({ page, industryPage }) => {
    // Chuẩn bị dữ liệu: Để trống cả Mã và Tên ngành nghề, đồng thời theo dõi request tạo mới.
    const data = createTc43IndustryData();
    let createRequestCount = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && /nganh-nghe/i.test(request.url())) createRequestCount += 1;
    });

    // Hành động: Truy cập > Mở form Thêm mới > Để trống Mã và Tên > Nhấn nút Lưu.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();
    await industryPage.fillIndustry(data);
    await industryPage.save();

    // Xác nhận: Cả hai trường báo lỗi, focus về trường Mã và không gửi API tạo mới.
    await expect(industryPage.locators.codeRequiredError, 'Phải hiển thị MSG_NN_001 tại field Mã ngành nghề').toBeVisible();
    await expect(industryPage.locators.nameRequiredError, 'Phải hiển thị MSG_NN_002 tại field Tên ngành nghề').toBeVisible();
    expect(await industryPage.isCodeInputHighlightedAsError(), 'Field Mã ngành nghề phải được highlight đỏ').toBe(true);
    expect(await industryPage.isNameInputHighlightedAsError(), 'Field Tên ngành nghề phải được highlight đỏ').toBe(true);
    await expect.soft(industryPage.locators.codeInput, 'Focus phải chuyển đến field lỗi đầu tiên').toBeFocused();
    expect(createRequestCount, 'Không được gửi API tạo mới khi thiếu cả Mã và Tên').toBe(0);
  });

  test('CL-UAT-U-00123-44 - validate Mã vượt quá 50 ký tự', async ({ page, industryPage }) => {
    // Chuẩn bị dữ liệu: Sinh Mã ngành nghề dài 51 ký tự và theo dõi request tạo mới.
    const data = createTc44IndustryData();
    let createRequestCount = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && /nganh-nghe/i.test(request.url())) createRequestCount += 1;
    });

    // Hành động: Truy cập > Mở form Thêm mới > Nhập Mã vượt giới hạn cho phép.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();
    await industryPage.fillIndustry(data);
    const actualCode = await industryPage.locators.codeInput.inputValue();
    // Xác nhận: UI nhận đủ dữ liệu boundary và hiển thị lỗi thay vì âm thầm cắt chuỗi.
    await expect.soft(actualCode, 'Phải nhập được chuỗi boundary 51 ký tự').toBe(data.code);
    if (actualCode.length === data.code.length) {
      await industryPage.save();
      await expect(industryPage.locators.codeMaxLengthError, 'Phải hiển thị lỗi Mã vượt quá 50 ký tự').toBeVisible();
      expect(await industryPage.isCodeInputHighlightedAsError(), 'Field Mã phải được highlight đỏ').toBe(true);
    } else {
      await expect.soft(
        await industryPage.locators.codeMaxLengthError.isVisible(),
        'UI phải hiển thị lỗi Mã vượt quá 50 ký tự theo testcase',
      ).toBe(true);
    }
    // Xác nhận API: Không gửi request tạo mới khi Mã vượt quá maxlength.
    expect(createRequestCount, 'Không được gửi API khi Mã vượt quá maxlength').toBe(0);
  });

  test('CL-UAT-U-00123-45 - validate Diễn giải vượt quá 500 ký tự', async ({ page, industryPage }) => {
    // Chuẩn bị dữ liệu: Sinh Diễn giải dài 501 ký tự và theo dõi request tạo mới.
    const data = createTc45IndustryData();
    let createRequestCount = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && /nganh-nghe/i.test(request.url())) createRequestCount += 1;
    });

    // Hành động: Truy cập > Mở form Thêm mới > Nhập Diễn giải vượt giới hạn cho phép.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();
    await industryPage.fillIndustry(data);
    const actualDescription = await industryPage.locators.descriptionInput.inputValue();
    // Xác nhận: UI nhận đủ dữ liệu boundary và hiển thị lỗi thay vì âm thầm cắt chuỗi.
    await expect.soft(actualDescription, 'Phải nhập được chuỗi boundary 501 ký tự').toBe(data.description!);
    if (actualDescription.length === data.description!.length) {
      await industryPage.save();
      await expect(industryPage.locators.descriptionMaxLengthError, 'Phải hiển thị lỗi Diễn giải vượt quá 500 ký tự').toBeVisible();
      expect(await industryPage.isDescriptionInputHighlightedAsError(), 'Field Diễn giải phải được highlight đỏ').toBe(true);
    } else {
      await expect.soft(
        await industryPage.locators.descriptionMaxLengthError.isVisible(),
        'UI phải hiển thị lỗi Diễn giải vượt quá 500 ký tự theo testcase',
      ).toBe(true);
    }
    // Xác nhận API: Không gửi request tạo mới khi Diễn giải vượt quá maxlength.
    expect(createRequestCount, 'Không được gửi API khi Diễn giải vượt quá maxlength').toBe(0);
  });

  test('CL-UAT-U-00123-46 - validate Tên vượt quá 250 ký tự', async ({ page, industryPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên ngành nghề dài 251 ký tự và theo dõi request tạo mới.
    const data = createTc46IndustryData();
    let createRequestCount = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && /nganh-nghe/i.test(request.url())) createRequestCount += 1;
    });

    // Hành động: Truy cập > Mở form Thêm mới > Nhập Tên vượt giới hạn cho phép.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();
    await industryPage.fillIndustry(data);
    const actualName = await industryPage.locators.nameInput.inputValue();
    // Xác nhận: UI nhận đủ dữ liệu boundary và hiển thị lỗi thay vì âm thầm cắt chuỗi.
    await expect.soft(actualName, 'Phải nhập được chuỗi boundary 251 ký tự').toBe(data.name);
    if (actualName.length === data.name.length) {
      await industryPage.save();
      await expect(industryPage.locators.nameMaxLengthError, 'Phải hiển thị lỗi Tên vượt quá 250 ký tự').toBeVisible();
      expect(await industryPage.isNameInputHighlightedAsError(), 'Field Tên phải được highlight đỏ').toBe(true);
    } else {
      await expect.soft(
        await industryPage.locators.nameMaxLengthError.isVisible(),
        'UI phải hiển thị lỗi Tên vượt quá 250 ký tự theo testcase',
      ).toBe(true);
    }
    // Xác nhận API: Không gửi request tạo mới khi Tên vượt quá maxlength.
    expect(createRequestCount, 'Không được gửi API khi Tên vượt quá maxlength').toBe(0);
  });

  test('CL-UAT-U-00123-47 - validate Mã ngành nghề bị trùng lặp', async ({ page, industryPage, db }) => {
    // Chuẩn bị dữ liệu: Dùng mã IT đã tồn tại trong DB và theo dõi request tạo mới.
    const data = createTc47IndustryData();
    const existingRecord = await db.nganhNghe.findLatestByUniqueCode(data.code);
    test.skip(
      !existingRecord || existingRecord.daXoa,
      'Thiếu precondition: chưa có ngành nghề đang tồn tại với mã IT trong hệ thống',
    );
    let createRequestCount = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && /nganh-nghe/i.test(request.url())) createRequestCount += 1;
    });

    // Hành động: Truy cập > Mở form Thêm mới > Nhập Mã đã tồn tại > Nhấn nút Lưu.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();
    await industryPage.fillIndustry(data);
    await industryPage.save();

    // Xác nhận: Hiển thị lỗi trùng mã, highlight trường Mã, giữ form mở và không gửi API tạo mới.
    await expect.soft(
      industryPage.locators.duplicateCodeError,
      'Phải hiển thị MSG_NN_003 khi mã IT đã tồn tại',
    ).toBeVisible();
    await expect.soft(
      await industryPage.isCodeInputHighlightedAsError(),
      'Field Mã phải được highlight đỏ',
    ).toBe(true);
    await expect(industryPage.locators.createDialog, 'Popup phải giữ mở khi mã bị trùng').toBeVisible();
    await expect.soft(createRequestCount, 'Không được gửi API tạo mới khi mã IT đã tồn tại').toBe(0);
  });

  test('CL-UAT-U-00123-49 - real-time validation khi blur Mã ngành nghề', async ({ page, industryPage }) => {
    // Chuẩn bị dữ liệu: Sinh Mã hợp lệ và theo dõi request tạo mới.
    const data = createTc49IndustryData();
    let createRequestCount = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && /nganh-nghe/i.test(request.url())) createRequestCount += 1;
    });

    // Hành động: Truy cập > Mở form Thêm mới > Focus trường Mã > Chuyển sang trường Tên khi Mã còn trống.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();
    await industryPage.locators.codeInput.focus();
    await industryPage.locators.nameInput.click();

    // Xác nhận: Validation bắt buộc xuất hiện ngay khi người dùng rời khỏi trường Mã.
    await expect.soft(
      industryPage.locators.codeRequiredError,
      'Khi blur Mã đang trống phải hiển thị validation ngay',
    ).toBeVisible();

    // Hành động: Nhập lại Mã hợp lệ.
    await industryPage.locators.codeInput.fill(data.code);

    // Xác nhận: Validation biến mất và không có request tạo mới được gửi đi.
    await expect(
      industryPage.locators.codeRequiredError,
      'Validation Mã bắt buộc phải biến mất khi nhập dữ liệu hợp lệ',
    ).toBeHidden();
    expect(createRequestCount, 'Real-time validation không được gửi API tạo mới').toBe(0);
  });

  test('CL-UAT-U-00123-50 - Thêm mới thành công bằng nút Lưu và đối chiếu DB', async ({
    industryPage,
    industryCleanup,
    db,
  }) => {
    // Chuẩn bị dữ liệu: Sinh Ngành nghề có mã unique để tránh trùng khi chạy lại testcase.
    const data = createTc50IndustryData();

    // Hành động: Truy cập Danh mục Ngành nghề > Mở form Thêm mới.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();

    // Xác nhận: Trạng thái mặc định của Ngành nghề là Hoạt động.
    await expect(industryPage.locators.statusSwitch, 'Trạng thái mặc định phải là Hoạt động').toBeChecked();

    // Hành động: Nhập dữ liệu > Nhấn nút Lưu.
    await industryPage.fillIndustry(data);
    await industryPage.save();

    // Xác nhận trên UI: Lưu thành công > Form đóng > Bản ghi mới xuất hiện trong danh sách.
    await expect(
      industryPage.locators.successAlert,
      'Phải hiển thị thông báo Thêm mới ngành nghề thành công',
    ).toBeVisible();

    // Đăng ký mã để fixture cleanup sau khi testcase kết thúc; dữ liệu chưa bị xóa tại đây.
    industryCleanup.register(data.code);
    await expect(industryPage.locators.createDialog, 'Popup phải đóng sau khi lưu').toBeHidden();
    await expect(industryPage.industryRow(data.code), 'Bản ghi vừa tạo phải hiển thị trên danh sách').toBeVisible();

    // Xác nhận trong DB: Bản ghi có đúng Mã, Tên, Diễn giải, Trạng thái và chưa bị xóa.
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
    // Chuẩn bị dữ liệu: Sinh Ngành nghề có mã unique để tránh trùng khi chạy lại testcase.
    const data = createTc51IndustryData();

    // Hành động: Truy cập > Mở form Thêm mới > Nhập dữ liệu > Nhấn nút Lưu và thêm mới.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();
    await industryPage.fillIndustry(data);
    await industryPage.saveAndContinue();

    // Xác nhận trên UI: Lưu thành công > Form vẫn mở và được reset > Focus trở về trường Mã
    // > Bản ghi mới xuất hiện trong danh sách.
    await expect(
      industryPage.locators.successAlert,
      'Phải hiển thị thông báo thêm mới ngành nghề thành công',
    ).toBeVisible();
    // Đăng ký mã để fixture cleanup sau khi testcase kết thúc; dữ liệu chưa bị xóa tại đây.
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

    // Xác nhận trong DB: Bản ghi có đúng Mã, Tên, Diễn giải, Trạng thái và chưa bị xóa.
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

  test('CL-UAT-U-00123-53 - trạng thái mặc định Đang hoạt động và đối chiếu toàn bộ dữ liệu DB', async ({
    industryPage,
    industryCleanup,
    db,
  }) => {
    // Chuẩn bị dữ liệu: Sinh Ngành nghề có mã unique để đối chiếu chính xác trên UI và DB.
    const data = createTc53IndustryData();

    // Hành động: Truy cập Danh mục Ngành nghề > Mở form Thêm mới.
    await industryPage.openFromCatalogue();
    await industryPage.openCreateDialog();

    // Xác nhận: Trạng thái mặc định được bật mà người dùng không cần lựa chọn.
    await expect(
      industryPage.locators.statusSwitch,
      'Trạng thái phải mặc định bật mà không cần người dùng lựa chọn',
    ).toBeChecked();
    // Hành động: Nhập toàn bộ dữ liệu > Nhấn nút Lưu.
    await industryPage.fillIndustry(data);
    await industryPage.save();

    // Xác nhận trên UI: Lưu thành công > Form đóng > Bản ghi hiển thị trạng thái Đang hoạt động.
    await expect(
      industryPage.locators.successAlert,
      'Phải hiển thị thông báo thêm mới ngành nghề thành công',
    ).toBeVisible();
    // Đăng ký mã để fixture cleanup sau khi testcase kết thúc; dữ liệu chưa bị xóa tại đây.
    industryCleanup.register(data.code);
    await expect(industryPage.locators.createDialog, 'Popup phải đóng sau khi lưu thành công').toBeHidden();
    const createdRow = industryPage.industryRow(data.code);
    await expect(createdRow, 'Bản ghi vừa tạo phải hiển thị trên danh sách').toBeVisible();
    await expect.soft(
      createdRow,
      'Bản ghi vừa tạo phải hiển thị trạng thái Đang hoạt động',
    ).toContainText('Đang hoạt động');

    // Xác nhận trong DB: Tìm đúng tenant theo mã unique và đối chiếu toàn bộ dữ liệu đã nhập.
    const createdRecordLookup = await db.nganhNghe.findLatestByUniqueCode(data.code);
    expect(createdRecordLookup, `DB phải tồn tại bản ghi vừa tạo với mã ${data.code}`).not.toBeNull();
    const record = await db.nganhNghe.findByCode(createdRecordLookup!.tenantId, data.code);
    expect(record, `DB phải tìm đúng bản ghi ${data.code} theo tenant_id`).not.toBeNull();
    expect(record).toMatchObject({
      tenantId: createdRecordLookup!.tenantId,
      ma: data.code,
      ten: data.name,
      moTa: data.description,
      trangThai: true,
      daXoa: false,
    });
  });
});
