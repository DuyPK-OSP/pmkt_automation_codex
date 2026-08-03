import type { Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import type { Logger } from '@utils/logger';

export interface PurchaseDocumentAutoFilledValues {
  readonly supplierName: string;
  readonly deliveryPerson: string;
  readonly address: string;
  readonly description: string;
  readonly creditDays: string;
  readonly dueDate: string;
  readonly itemName: string;
  readonly inventoryAccount: string;
  readonly payableAccount: string;
  readonly unit: string;
  readonly amount: string;
  readonly accountingDate: string;
  readonly documentDate: string;
  readonly warehouse: string;
  readonly department: string;
}

export class ChungTuMuaHangThemMoiPage extends BasePage {
  readonly dialog: Locator;
  readonly addButton: Locator;
  readonly saveButton: Locator;
  readonly businessType: Locator;
  readonly purchaseMethod: Locator;
  readonly immediatePayment: Locator;
  readonly currency: Locator;
  readonly discountType: Locator;

  /** Khởi tạo Page Object và các locator dùng chung của màn hình. */
  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.dialog = page.getByRole('dialog').filter({ hasText: 'Thêm chứng từ mua hàng' });
    this.addButton = page.getByRole('button', { name: 'Thêm mới', exact: true });
    this.saveButton = this.dialog.getByRole('button', { name: 'Lưu', exact: true });
    this.businessType = this.dialog.locator('#loaiNghiepVu').locator('..');
    this.purchaseMethod = this.dialog.locator('#hinhThuc').locator('..');
    this.immediatePayment = this.dialog.locator('#thanhToanNgay');
    this.currency = this.dialog.locator('#loaiTienId').locator('..');
    this.discountType = this.dialog.locator('#loaiChietKhau').locator('..');
  }

  /** Mở màn hình Chứng từ mua hàng và chờ dữ liệu sẵn sàng thao tác. */
  async open(): Promise<void> {
    await this.navigate('/purchase/chung-tu-mua-hang');
    await this.page.getByRole('table').waitFor({ state: 'visible' });
    await this.page.locator('.ant-spin-spinning').waitFor({ state: 'hidden' }).catch(() => undefined);
    await this.addButton.waitFor({ state: 'visible' });
    await this.addButton.click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  /** Mở dropdown và trả về toàn bộ Trạng thái hóa đơn đang khả dụng. */
  async invoiceStatusOptions(): Promise<string[]> {
    const input = this.dialog.locator('#trangThaiHoaDon');
    await input.click();
    const labels = await this.page.locator('[role="option"][aria-label]').evaluateAll((options) =>
      options.map((option) => option.getAttribute('aria-label') ?? '').filter(Boolean),
    );
    await input.press('Escape');
    return labels;
  }

  /** Chọn Trạng thái hóa đơn theo nhãn hiển thị. */
  async selectInvoiceStatus(label: string): Promise<void> {
    const input = this.dialog.locator('#trangThaiHoaDon');
    await input.click();
    const labels = await this.page.locator('[role="option"][aria-label]').evaluateAll((options) =>
      options.map((option) => option.getAttribute('aria-label') ?? '').filter(Boolean),
    );
    const optionIndex = labels.indexOf(label);
    if (optionIndex < 0) throw new Error(`Không tìm thấy trạng thái hóa đơn: ${label}`);
    await input.press('Home');
    for (let index = 0; index < optionIndex; index += 1) await input.press('ArrowDown');
    await input.press('Enter');
  }

  /** Bật Thanh toán ngay, chọn hình thức thanh toán và chờ tab chứng từ chi tương ứng. */
  async selectImmediatePayment(type: 'Tiền mặt' | 'Ủy nhiệm chi' | 'Séc tiền mặt' | 'Séc chuyển khoản'): Promise<void> {
    await this.dialog.locator('#thanhToanNgay').check();
    const input = this.dialog.locator('#hinhThucThanhToan');
    await input.click();
    if (type === 'Séc tiền mặt' || type === 'Séc chuyển khoản') {
      await input.press('End');
      await input.press('ArrowUp');
      await input.press('Enter');
      if (type === 'Séc tiền mặt') {
        await input.click();
        await input.press('Home');
        for (let index = 0; index < 3; index += 1) await input.press('ArrowDown');
        await input.press('Enter');
      }
    } else {
      await input.press('Home');
      if (type === 'Ủy nhiệm chi') await input.press('ArrowDown');
      await input.press('Enter');
    }
    await this.dialog.getByRole('tab', { name: type === 'Tiền mặt' ? 'Phiếu chi' : type, exact: true }).waitFor();
  }

  /** Điền thông tin chứng từ thanh toán ngay và trả về tab cùng các giá trị thực tế đã chọn. */
  async fillImmediatePayment(paymentTabName: string, documentNumber: string): Promise<Readonly<{ tab: string; values: string[] }>> {
    const paymentTab = this.dialog.getByRole('tab', { name: paymentTabName, exact: true });
    const tab = (await paymentTab.innerText()).trim();
    await paymentTab.click();
    const panelId = await paymentTab.getAttribute('aria-controls');
    if (!panelId) throw new Error(`Không xác định được panel thanh toán ${tab}`);
    const panel = this.dialog.locator(`#${panelId}`);
    if (paymentTabName !== 'Phiếu chi') {
      const cashAccountLabel = panel.getByText(/^TK Tiền/).first();
      const cashAccount = cashAccountLabel.locator('..').locator('..').getByRole('combobox');
      await this.chooseCombobox(cashAccount, '112');
    }
    const comboboxes = panel.getByRole('combobox');
    const values: string[] = [];
    for (let index = 0; index < await comboboxes.count(); index += 1) {
      const input = comboboxes.nth(index);
      const current = (await input.locator('..').innerText()).trim();
      if (current && !/chọn/i.test(current)) {
        values.push(current);
        continue;
      }
      await input.click();
      await input.press('ArrowDown');
      await input.press('Enter');
      const selected = (await input.locator('..').innerText()).trim();
      if (selected) values.push(selected);
    }
    const bankAccountLabel = panel.getByText(/^Tài khoản chi/).first();
    if (await bankAccountLabel.count() > 0) {
      const bankAccount = bankAccountLabel.locator('..').locator('..').getByRole('combobox');
      if (/chọn/i.test(await bankAccount.locator('..').innerText())) {
        await this.chooseCombobox(bankAccount, '1');
        values.push((await bankAccount.locator('..').innerText()).trim());
      }
    }
    await panel.locator('#soChungTuPhieuChi').fill(documentNumber);
    return { tab, values };
  }

  /** Tìm và chọn Nhà cung cấp theo mã. */
  async chooseSupplier(code: string): Promise<void> {
    await this.chooseSearchable('Chọn nhà cung cấp', code);
  }

  /** Trả về Nhân viên mua hàng được hệ thống tự động điền. */
  async employeeValue(): Promise<string> {
    return this.headerFieldValue('Nhân viên mua hàng');
  }

  /** Trả về Điều khoản thanh toán được hệ thống tự động điền. */
  async paymentTermValue(): Promise<string> {
    return this.headerFieldValue('Điều khoản thanh toán');
  }

  /** Nhập Số chứng từ mua hàng. */
  async enterDocumentNumber(documentNumber: string): Promise<void> {
    await this.dialog.locator('#soChungTu').fill(documentNumber);
  }

  /** Chọn Vật tư hợp lệ đầu tiên và trả về tên Vật tư thực tế. */
  async chooseFirstItem(): Promise<string> {
    return this.chooseMatchingSearchable('Mã hàng', 'VT');
  }

  /** Nhập chi tiết số lượng, đơn giá, lô, hạn dùng; trả về Kho và Đơn vị đã chọn. */
  async enterDetail(quantity: string, unitPrice: string, lot: string, expiry: string): Promise<Readonly<{ warehouse: string; department: string }>> {
    const row = this.detailRow();
    const comboboxes = row.getByRole('combobox');
    const warehouse = await this.chooseMatchingCombobox(comboboxes.nth(4), 'K');
    const department = await this.chooseMatchingCombobox(comboboxes.nth(6), 'Công ty');
    await this.dialog.locator('#chiTiet_0_soLuong').fill(quantity);
    await this.dialog.locator('#chiTiet_0_donGia').fill(unitPrice);
    await this.dialog.locator('#chiTiet_0_soLo').fill(lot);
    await this.dialog.locator('#chiTiet_0_hanSuDung').fill(expiry);
    await this.dialog.locator('#chiTiet_0_hanSuDung').press('Tab');
    return { warehouse, department };
  }

  /** Thu thập toàn bộ giá trị được hệ thống tự động điền trên chứng từ mua hàng. */
  async autoFilledValues(): Promise<PurchaseDocumentAutoFilledValues> {
    const rowComboboxes = this.detailRow().getByRole('combobox');
    return {
      supplierName: await this.dialog.locator('#tenNhaCungCap').first().inputValue(),
      deliveryPerson: await this.dialog.locator('#nguoiGiaoHang').inputValue(),
      address: await this.dialog.locator('#diaChi').first().inputValue(),
      description: await this.dialog.locator('#dienGiai').inputValue(),
      creditDays: await this.optionalInputValue('#soNgayDuocNo'),
      dueDate: await this.optionalInputValue('#hanThanhToan'),
      itemName: await this.dialog.locator('#chiTiet_0_tenHang').inputValue(),
      inventoryAccount: await rowComboboxes.nth(1).locator('..').innerText(),
      payableAccount: await rowComboboxes.nth(2).locator('..').innerText(),
      unit: await rowComboboxes.nth(3).locator('..').innerText(),
      amount: await this.dialog.locator('#chiTiet_0_thanhTien').inputValue(),
      accountingDate: await this.dialog.locator('#ngayHachToan').inputValue(),
      documentDate: await this.dialog.locator('#ngayChungTu').inputValue(),
      warehouse: await rowComboboxes.nth(4).locator('..').innerText(),
      department: await rowComboboxes.nth(6).locator('..').innerText(),
    };
  }

  /** Nhấn Lưu để tạo Chứng từ mua hàng. */
  async save(): Promise<void> {
    await this.saveButton.click();
  }

  /** Trả về dòng chi tiết hàng hóa đầu tiên của chứng từ. */
  private detailRow(): Locator {
    return this.dialog.locator('tr:has(#chiTiet_0_soLuong)');
  }

  /** Tìm và chọn một giá trị combobox theo placeholder và từ khóa. */
  private async chooseSearchable(placeholder: string, query: string): Promise<void> {
    const placeholderElement = this.dialog.getByText(placeholder, { exact: true }).first();
    const input = placeholderElement.locator('..').getByRole('combobox');
    await this.chooseCombobox(input, query);
  }

  /** Nhập từ khóa và chọn kết quả đầu tiên trong combobox. */
  private async chooseCombobox(input: Locator, query: string): Promise<void> {
    await input.fill(query);
    await input.press('ArrowDown');
    await input.press('Enter');
  }

  /** Tìm, chọn và trả về giá trị thực tế của combobox theo placeholder. */
  private async chooseMatchingSearchable(placeholder: string, query: string): Promise<string> {
    const placeholderElement = this.dialog.getByText(placeholder, { exact: true }).first();
    const input = placeholderElement.locator('..').getByRole('combobox');
    return this.chooseMatchingCombobox(input, query);
  }

  /** Chọn một giá trị combobox và trả về nội dung thực tế sau khi chọn. */
  private async chooseMatchingCombobox(input: Locator, query: string): Promise<string> {
    const id = await input.getAttribute('id');
    await this.chooseCombobox(input, query);
    if (!id) return '';
    return (await this.dialog.locator(`#${id}`).locator('..').innerText()).trim();
  }

  /** Trả về giá trị đang hiển thị của một trường combobox tại phần đầu chứng từ. */
  private async headerFieldValue(label: string): Promise<string> {
    const field = this.dialog.getByText(label, { exact: true }).locator('..').locator('..');
    const input = field.getByRole('combobox');
    const id = await input.getAttribute('id');
    if (!id) return '';
    return (await this.dialog.locator(`#${id}`).locator('..').innerText()).trim();
  }

  /** Trả về giá trị input nếu trường tồn tại; trả về chuỗi rỗng nếu không có trường. */
  private async optionalInputValue(selector: string): Promise<string> {
    const input = this.dialog.locator(selector);
    return await input.count() > 0 ? input.first().inputValue() : '';
  }
}
