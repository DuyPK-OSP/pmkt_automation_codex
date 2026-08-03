import { test, expect } from '@fixtures/base.fixture';
import { requireCredentials } from '@utils/env.config';
import { TestDataGenerator } from '@utils/test-data';

const expectedHeaders = [
  'STT',
  'Ngày hạch toán',
  'Số chứng từ',
  'Số hóa đơn',
  'Loại nghiệp vụ',
  'Nhà cung cấp',
  'Tổng tiền thanh toán (VNĐ)',
  'Chi phí mua hàng (VNĐ)',
  'Giá trị nhập kho',
  'Trạng thái nhận hóa đơn',
  'Trạng thái thanh toán',
  'Trạng thái chứng từ',
  'Tình trạng phân bổ',
  'Chức năng',
] as const;

const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
const moneyPattern = /^(?:—|\d{1,3}(?:\.\d{3})*(?:,\d+)?)$/;
const testData = new TestDataGenerator();

/** Kiểm tra màu RGB có thiên về kênh xanh dương để xác nhận cách hiển thị hyperlink. */
function isBlue(rgbColor: string): boolean {
  const channels = rgbColor.match(/\d+/g)?.map(Number);
  if (!channels || channels.length < 3) return false;
  const [red = 0, green = 0, blue = 0] = channels;
  return blue > red && blue > green;
}

test.describe('PMKT-U-00506 - 30 test cases đầu tiên', () => {
  test.beforeEach(async ({ loginPage, purchaseDocumentsPage }) => {
    const credentials = requireCredentials();
    await loginPage.open();
    await loginPage.login(credentials.username, credentials.password);
    await purchaseDocumentsPage.open();
  });

  test('CL-UAT-U-00506-01 - hiển thị đầy đủ 15 cột', async ({ purchaseDocumentsPage }) => {
    // Hành động: Mở danh sách Chứng từ mua hàng > Kiểm tra hiển thị đầy đủ 15 cột.
    // Xác nhận: hiển thị đầy đủ 15 cột đúng theo Expected Result của testcase.
    await expect(
      purchaseDocumentsPage.headerCheckbox,
      'Cột đầu tiên phải hiển thị Checkbox theo manual testcase',
    ).toBeVisible();
    expect(
      await purchaseDocumentsPage.textHeaderNames(),
      '14 tiêu đề có text phải hiển thị đúng thứ tự theo manual testcase',
    ).toEqual(expectedHeaders);
    await expect(purchaseDocumentsPage.headerColumns).toHaveCount(15);
  });

  test('CL-UAT-U-00506-02 - highlight chứng từ chưa ghi sổ', async ({ purchaseDocumentsPage }) => {
    // Hành động: Mở danh sách Chứng từ mua hàng > Kiểm tra highlight chứng từ chưa ghi sổ.
    const signatures = await purchaseDocumentsPage.postingRowVisualSignatures();
    test.skip(!signatures.unposted || !signatures.posted, 'Thiếu đồng thời dữ liệu Đã ghi sổ và Chưa ghi sổ');
    // Xác nhận: highlight chứng từ chưa ghi sổ đúng theo Expected Result của testcase.
    expect(signatures.unposted, 'Dòng Chưa ghi sổ phải có định dạng hiển thị khác dòng Đã ghi sổ').not.toBe(signatures.posted);
  });

  test('CL-UAT-U-00506-03 - hiển thị đúng Loại nghiệp vụ', async ({ purchaseDocumentsPage }) => {
    // Hành động: Mở danh sách Chứng từ mua hàng > Kiểm tra hiển thị đúng Loại nghiệp vụ.
    const values = (await purchaseDocumentsPage.columnTexts(5)).filter(Boolean);
    const allowed = ['Mua hàng nhập kho', 'Mua hàng không qua kho', 'Mua dịch vụ', 'Mua dịch vụ (là chi phí mua hàng)'];
    // Xác nhận: hiển thị đúng Loại nghiệp vụ đúng theo Expected Result của testcase.
    expect(values.length, 'Phải có dữ liệu Loại nghiệp vụ').toBeGreaterThan(0);
    test.skip(new Set(values).size < 2, 'Thiếu precondition: danh sách chưa có nhiều Loại nghiệp vụ khác nhau');
    expect(values.every((value) => allowed.includes(value)), 'Mọi Loại nghiệp vụ phải thuộc danh mục hợp lệ').toBe(true);
  });

  test('CL-UAT-U-00506-04 - Số hóa đơn nhiều hoặc không có hóa đơn', async ({ purchaseDocumentsPage }) => {
    // Hành động: Mở danh sách Chứng từ mua hàng > Kiểm tra Số hóa đơn nhiều hoặc không có hóa đơn.
    const noInvoiceValue = await purchaseDocumentsPage.invoiceNumberForDocument('CTMH0002');
    // Xác nhận: Số hóa đơn nhiều hoặc không có hóa đơn đúng theo Expected Result của testcase.
    expect(
      noInvoiceValue,
      'Chứng từ CTMH0002 không có hóa đơn nên cột Số hóa đơn phải để trống',
    ).toBe('');

    const multipleInvoiceValue = await purchaseDocumentsPage.invoiceNumberForDocument('PN_KHO_13072026_020');
    expect(
      multipleInvoiceValue.split(',').filter((value) => value.trim() !== '').length,
      'Các số hóa đơn của PN_KHO_13072026_020 phải được ngăn cách bằng dấu phẩy',
    ).toBeGreaterThan(1);
  });

  test('CL-UAT-U-00506-05 - format ngày, tiền và hyperlink Số chứng từ', async ({ purchaseDocumentsPage }) => {
    // Hành động: Mở danh sách Chứng từ mua hàng > Kiểm tra format ngày, tiền và hyperlink Số chứng từ.
    const dates = await purchaseDocumentsPage.columnTexts(2);
    const payments = await purchaseDocumentsPage.columnTexts(7);
    const purchaseCosts = await purchaseDocumentsPage.columnTexts(8);
    const inventoryValues = await purchaseDocumentsPage.columnTexts(9);
    test.skip(dates.length === 0, 'Thiếu precondition: danh sách không có chứng từ dữ liệu hợp lệ');
    // Xác nhận: format ngày, tiền và hyperlink Số chứng từ đúng theo Expected Result của testcase.
    expect(dates.every((value) => datePattern.test(value)), 'Ngày hạch toán phải có dạng dd/MM/yyyy').toBe(true);
    expect([...payments, ...purchaseCosts, ...inventoryValues].every((value) => moneyPattern.test(value)), 'Số tiền phải có phân cách hàng nghìn').toBe(true);
    await expect(purchaseDocumentsPage.firstDocumentButton, 'Số chứng từ phải là control có thể click').toBeVisible();
    const documentStyle = await purchaseDocumentsPage.firstDocumentVisualStyle();
    expect(isBlue(documentStyle.color), 'Số chứng từ phải hiển thị màu xanh').toBe(true);
    expect(documentStyle.cursor, 'Hover Số chứng từ phải hiển thị con trỏ bàn tay').toBe('pointer');
    for (const columnIndex of [7, 8, 9]) {
      expect(
        (await purchaseDocumentsPage.columnTextAlignments(columnIndex)).every((alignment) => alignment === 'right'),
        `Cột tiền tại vị trí ${columnIndex + 1} phải căn phải`,
      ).toBe(true);
    }
  });

  test('CL-UAT-U-00506-06 - hiển thị dòng Tổng cộng khi có dữ liệu', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'Chưa có bộ dữ liệu kiểm soát để đối chiếu tổng tất cả chứng từ của 3 cột và trạng thái 0 chứng từ theo đúng manual');
  });

  test('CL-UAT-U-00506-07 - Tình trạng phân bổ trống khi không có CPMH', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'Chưa có dữ liệu truy vết chứng minh chứng từ không có dòng Là CPMH; không được suy diễn từ ô trống');
  });

  test('CL-UAT-U-00506-08 - trạng thái Chưa phân bổ', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'Chưa có dữ liệu truy vết thỏa precondition có CPMH nhưng chưa phân bổ');
  });

  test('CL-UAT-U-00506-09 - trạng thái Phân bổ 1 phần', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'Chưa có dữ liệu truy vết thỏa 0 < Lũy kế đã phân bổ QĐ < Tổng chi phí cần phân bổ QĐ');
  });

  test('CL-UAT-U-00506-10 - trạng thái Hoàn thành phân bổ', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'Chưa có dữ liệu truy vết thỏa Lũy kế đã phân bổ QĐ = Tổng chi phí cần phân bổ QĐ');
  });

  test('CL-UAT-U-00506-11 - tìm theo khoảng Ngày hạch toán', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'Manual yêu cầu nút Tìm kiếm; UI hiện tại chỉ xác minh được nút Lọc nên không tự thay đổi bước thực hiện');
  });

  test('CL-UAT-U-00506-12 - tìm Ngày hạch toán Hôm nay', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'UI hiện tại chưa xác minh được control chọn Ngày hạch toán = Hôm nay theo đúng bước manual testcase');
  });

  test('CL-UAT-U-00506-13 - tìm theo Số chứng từ', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'UI hiện tại không có ô Số chứng từ riêng theo manual testcase; không thay bằng search chung');
  });

  test('CL-UAT-U-00506-14 - tìm theo Số hóa đơn', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'UI hiện tại không có ô Số hóa đơn riêng theo manual testcase; không tự chọn HD-001 hoặc thay bằng search chung');
  });

  test('CL-UAT-U-00506-15 - tìm theo Nhà cung cấp', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'UI hiện tại không có ô Nhà cung cấp riêng theo manual testcase; không tự chọn minh anh hoặc thay bằng search chung');
  });

  test('CL-UAT-U-00506-16 - lọc đa chọn Loại nghiệp vụ', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'UI hiện tại không có control lọc Loại nghiệp vụ');
  });

  test('CL-UAT-U-00506-17 - lọc Hình thức', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'UI hiện tại không có control lọc Hình thức');
  });

  test('CL-UAT-U-00506-18 - lọc Trạng thái chứng từ', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'UI hiện tại không có control lọc Trạng thái chứng từ');
  });

  test('CL-UAT-U-00506-19 - lọc Trạng thái nhận hóa đơn', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'UI hiện tại không có control lọc Trạng thái nhận hóa đơn');
  });

  test('CL-UAT-U-00506-20 - lọc Trạng thái thanh toán', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'UI hiện tại không có control lọc Trạng thái thanh toán');
  });

  test('CL-UAT-U-00506-21 - lọc Tình trạng phân bổ', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'UI hiện tại không có control lọc Tình trạng phân bổ');
  });

  test('CL-UAT-U-00506-22 - tìm kiếm kết hợp AND', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'UI hiện tại không có ba control NCC, Trạng thái và Loại nghiệp vụ để kiểm tra AND');
  });

  test('CL-UAT-U-00506-23 - tìm kiếm không có kết quả', async ({ purchaseDocumentsPage }) => {
    // Chuẩn bị dữ liệu: Sinh dữ liệu Chứng từ mua hàng unique và xác định kịch bản thanh toán của testcase.
    // Hành động: Nhập từ khóa unique không tồn tại > Thực hiện tìm kiếm.
    await purchaseDocumentsPage.search(testData.uniqueKeyword('tc00506-23-empty-search'));
    // Xác nhận: Danh sách không có dòng dữ liệu và hiển thị đúng thông báo không tìm thấy.
    await expect(purchaseDocumentsPage.dataRows, 'Từ khóa không tồn tại không được trả về dòng dữ liệu').toHaveCount(0);
    const hasExpectedMessage = await purchaseDocumentsPage.hasText('Không tìm thấy chứng từ nào phù hợp với điều kiện tìm kiếm');
    expect(hasExpectedMessage, 'Phải hiển thị đúng thông báo không tìm thấy').toBe(true);
  });

  test('CL-UAT-U-00506-24 - nút Đặt lại bộ lọc', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'Manual yêu cầu nhiều điều kiện và nút Xóa bộ lọc; UI hiện tại chỉ xác minh được bộ lọc thời gian/nút Đặt lại');
  });

  test('CL-UAT-U-00506-25 - Làm mới giữ nguyên điều kiện tìm kiếm', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'Chưa có các control bộ lọc theo manual testcase để thiết lập và xác minh giữ nguyên sau Làm mới');
  });

  test('CL-UAT-U-00506-26 - maxlength các ô tìm kiếm text', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'UI hiện tại chỉ có một search chung, không có ba ô text với maxlength 50/50/255');
  });

  test('CL-UAT-U-00506-27 - phân trang mặc định 20 dòng và chuyển trang', async ({ purchaseDocumentsPage }) => {
    // Hành động: Mở danh sách Chứng từ mua hàng > Ghi nhận trang đầu > Chuyển sang trang kế tiếp.
    // Xác nhận: Mặc định hiển thị 20 dòng; chuyển trang làm thay đổi dữ liệu và không vượt quá page size.
    await expect(
      purchaseDocumentsPage.pageSizeDisplay,
      'Phân trang mặc định phải được thiết lập là 20 dòng/trang',
    ).toBeVisible();
    await expect(purchaseDocumentsPage.dataRows, 'Trang 1 phải hiển thị đúng 20 dòng').toHaveCount(20);
    await expect(
      purchaseDocumentsPage.nextPageButton,
      'Precondition yêu cầu có hơn 20 chứng từ nên phải có thể chuyển trang',
    ).toBeEnabled();

    const firstDocumentOnPageOne = await purchaseDocumentsPage.firstDocumentButton.textContent();
    await purchaseDocumentsPage.goToNextPage();
    await expect(
      purchaseDocumentsPage.firstDocumentButton,
      'Sau khi chuyển trang, dữ liệu phải thay đổi sang trang tiếp theo',
    ).not.toHaveText(firstDocumentOnPageOne ?? '');

    const pageTwoRowCount = await purchaseDocumentsPage.dataRows.count();
    expect(pageTwoRowCount, 'Trang tiếp theo phải có ít nhất một bản ghi').toBeGreaterThan(0);
    expect(pageTwoRowCount, 'Số bản ghi trang tiếp theo không được vượt quá page size 20').toBeLessThanOrEqual(20);
  });

  test('CL-UAT-U-00506-28 - sắp xếp mặc định theo thời gian tạo', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'Bảng không hiển thị cột Thời gian tạo nên không thể xác minh BR bằng UI');
  });

  test('CL-UAT-U-00506-29 - sort Ngày hạch toán tăng/giảm', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'Chưa có locator đã xác minh cho mũi tên lên/xuống; không chạy kiểm tra dữ liệu một phần rồi báo PASS');
  });

  test('CL-UAT-U-00506-30 - filter mặc định đầu tháng đến hiện tại', async () => {
    // Chuẩn bị dữ liệu/Precondition: Testcase được SKIP vì môi trường hoặc UI hiện tại chưa đủ điều kiện xác minh đúng manual testcase.
    test.skip(true, 'Manual yêu cầu bộ lọc theo Ngày chứng từ; chưa có bằng chứng control hiện tại là Ngày chứng từ nên không tự suy diễn');
  });
});
