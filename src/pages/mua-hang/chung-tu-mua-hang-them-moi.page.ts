import type { Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import type { Logger } from '@utils/logger';
import {
  createChungTuMuaHangThemMoiLocatorMap,
  type ChungTuMuaHangThemMoiLocatorMap,
} from './chung-tu-mua-hang-them-moi.locators';

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
  readonly locators: ChungTuMuaHangThemMoiLocatorMap;
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
    this.locators = createChungTuMuaHangThemMoiLocatorMap(page);
    this.dialog = this.locators.dialog;
    this.addButton = this.locators.addButton;
    this.saveButton = this.locators.saveButton;
    this.businessType = this.locators.businessType;
    this.purchaseMethod = this.locators.purchaseMethod;
    this.immediatePayment = this.locators.immediatePayment;
    this.currency = this.locators.currency;
    this.discountType = this.locators.discountType;
  }

  /** Mở màn hình Chứng từ mua hàng và chờ dữ liệu sẵn sàng thao tác. */
  async open(): Promise<void> {
    await this.navigate('/purchase/chung-tu-mua-hang');
    await this.locators.table.waitFor({ state: 'visible' });
    await this.locators.loadingSpinner.waitFor({ state: 'hidden' }).catch(() => undefined);
    await this.addButton.waitFor({ state: 'visible' });
    await this.addButton.click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  /** Mở dropdown và trả về toàn bộ Trạng thái hóa đơn đang khả dụng. */
  async invoiceStatusOptions(): Promise<string[]> {
    const input = this.locators.invoiceStatusInput;
    await input.click();
    const labels = await this.locators.invoiceStatusOptions.evaluateAll((options) =>
      options.map((option) => option.getAttribute('aria-label') ?? '').filter(Boolean),
    );
    await input.press('Escape');
    return labels;
  }

  /** Chọn Trạng thái hóa đơn theo nhãn hiển thị. */
  async selectInvoiceStatus(label: string): Promise<void> {
    const input = this.locators.invoiceStatusInput;
    await input.click();
    const labels = await this.locators.invoiceStatusOptions.evaluateAll((options) =>
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
    await this.locators.immediatePayment.check();
    const input = this.locators.immediatePaymentTypeInput;
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
    await this.locators.paymentTab(type === 'Tiền mặt' ? 'Phiếu chi' : type).waitFor();
  }

  /** Điền thông tin chứng từ thanh toán ngay và trả về tab cùng các giá trị thực tế đã chọn. */
  async fillImmediatePayment(paymentTabName: string, documentNumber: string): Promise<Readonly<{ tab: string; values: string[] }>> {
    const paymentTab = this.locators.paymentTab(paymentTabName);
    const tab = (await paymentTab.innerText()).trim();
    await paymentTab.click();
    const panelId = await paymentTab.getAttribute('aria-controls');
    if (!panelId) throw new Error(`Không xác định được panel thanh toán ${tab}`);
    const panel = this.locators.paymentPanel(panelId);
    if (paymentTabName !== 'Phiếu chi') {
      const cashAccount = this.locators.paymentCashAccountCombobox(panel);
      await this.chooseCombobox(cashAccount, '112');
    }
    const comboboxes = this.locators.paymentComboboxes(panel);
    const values: string[] = [];
    for (let index = 0; index < await comboboxes.count(); index += 1) {
      const input = comboboxes.nth(index);
      const current = (await this.locators.controlParent(input).innerText()).trim();
      if (current && !/chọn/i.test(current)) {
        values.push(current);
        continue;
      }
      await input.click();
      await input.press('ArrowDown');
      await input.press('Enter');
      const selected = (await this.locators.controlParent(input).innerText()).trim();
      if (selected) values.push(selected);
    }
    const bankAccountLabel = this.locators.bankAccountLabel(panel);
    if (await bankAccountLabel.count() > 0) {
      const bankAccount = this.locators.paymentBankAccountCombobox(panel);
      if (/chọn/i.test(await this.locators.controlParent(bankAccount).innerText())) {
        await this.chooseCombobox(bankAccount, '1');
        values.push((await this.locators.controlParent(bankAccount).innerText()).trim());
      }
    }
    await this.locators.paymentDocumentNumberInput(panel).fill(documentNumber);
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
    await this.locators.documentNumberInput.fill(documentNumber);
  }

  /** Chọn Vật tư hợp lệ đầu tiên và trả về tên Vật tư thực tế. */
  async chooseFirstItem(): Promise<string> {
    return this.chooseMatchingSearchable('Mã hàng', 'VT');
  }

  /** Nhập chi tiết số lượng, đơn giá, lô, hạn dùng; trả về Kho và Đơn vị đã chọn. */
  async enterDetail(quantity: string, unitPrice: string, lot: string, expiry: string): Promise<Readonly<{ warehouse: string; department: string }>> {
    const comboboxes = this.locators.detailRowComboboxes;
    const warehouse = await this.chooseMatchingCombobox(comboboxes.nth(4), 'K');
    const department = await this.chooseMatchingCombobox(comboboxes.nth(6), 'Công ty');
    await this.locators.quantityInput.fill(quantity);
    await this.locators.unitPriceInput.fill(unitPrice);
    await this.locators.lotInput.fill(lot);
    await this.locators.expiryInput.fill(expiry);
    await this.locators.expiryInput.press('Tab');
    return { warehouse, department };
  }

  /** Thu thập toàn bộ giá trị được hệ thống tự động điền trên chứng từ mua hàng. */
  async autoFilledValues(): Promise<PurchaseDocumentAutoFilledValues> {
    const rowComboboxes = this.locators.detailRowComboboxes;
    return {
      supplierName: await this.locators.supplierNameInput.inputValue(),
      deliveryPerson: await this.locators.deliveryPersonInput.inputValue(),
      address: await this.locators.addressInput.inputValue(),
      description: await this.locators.descriptionInput.inputValue(),
      creditDays: await this.optionalInputValue(this.locators.creditDaysInput),
      dueDate: await this.optionalInputValue(this.locators.dueDateInput),
      itemName: await this.locators.itemNameInput.inputValue(),
      inventoryAccount: await this.locators.controlParent(rowComboboxes.nth(1)).innerText(),
      payableAccount: await this.locators.controlParent(rowComboboxes.nth(2)).innerText(),
      unit: await this.locators.controlParent(rowComboboxes.nth(3)).innerText(),
      amount: await this.locators.amountInput.inputValue(),
      accountingDate: await this.locators.accountingDateInput.inputValue(),
      documentDate: await this.locators.documentDateInput.inputValue(),
      warehouse: await this.locators.controlParent(rowComboboxes.nth(4)).innerText(),
      department: await this.locators.controlParent(rowComboboxes.nth(6)).innerText(),
    };
  }

  /** Nhấn Lưu để tạo Chứng từ mua hàng. */
  async save(): Promise<void> {
    await this.saveButton.click();
  }

  /** Trả về dòng chi tiết hàng hóa đầu tiên của chứng từ. */
  private detailRow(): Locator {
    return this.locators.detailRow;
  }

  /** Tìm và chọn một giá trị combobox theo placeholder và từ khóa. */
  private async chooseSearchable(placeholder: string, query: string): Promise<void> {
    const input = this.locators.searchableCombobox(placeholder);
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
    const input = this.locators.searchableCombobox(placeholder);
    return this.chooseMatchingCombobox(input, query);
  }

  /** Chọn một giá trị combobox và trả về nội dung thực tế sau khi chọn. */
  private async chooseMatchingCombobox(input: Locator, query: string): Promise<string> {
    const id = await input.getAttribute('id');
    await this.chooseCombobox(input, query);
    if (!id) return '';
    return (await this.locators.controlContainerById(id).innerText()).trim();
  }

  /** Trả về giá trị đang hiển thị của một trường combobox tại phần đầu chứng từ. */
  private async headerFieldValue(label: string): Promise<string> {
    const input = this.locators.headerCombobox(label);
    const id = await input.getAttribute('id');
    if (!id) return '';
    return (await this.locators.controlContainerById(id).innerText()).trim();
  }

  /** Trả về giá trị input nếu trường tồn tại; trả về chuỗi rỗng nếu không có trường. */
  private async optionalInputValue(input: Locator): Promise<string> {
    return await input.count() > 0 ? input.first().inputValue() : '';
  }
}
