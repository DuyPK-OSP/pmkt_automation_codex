# Quy Tắc Chung cho QA Automation

> Áp dụng cho mọi tác vụ automation testing, bất kể framework (Playwright, Selenium, Appium).

## 0. Tôn Trọng Tuyệt Đối Manual Test Case

- Bắt buộc bám sát nguyên văn **Pre-condition, Test Steps, Test Data và Expected Result** của manual test case.
- Không tự thêm, đổi tên, mở rộng hoặc suy diễn yêu cầu mà test case không nêu.
- Không biến giả định kỹ thuật, accessible name, DOM attribute hoặc cách triển khai UI thành expected result nghiệp vụ.
- Mỗi assertion phải truy ngược được tới một nội dung cụ thể trong manual test case.
- Ví dụ: test case ghi `Checkbox` thì xác minh element là checkbox; không tự đổi expected result thành text hoặc accessible name `Select all`.
- Khi test case mơ hồ hoặc khác UI/dữ liệu thực tế, phải ghi nhận điểm khác biệt và xin xác nhận; không tự sửa nghĩa của test case.
- Khi thiếu pre-condition, đánh dấu `SKIP/BLOCKED` với lý do rõ ràng; không tự suy diễn pre-condition nghiệp vụ.
- Khi manual testcase không cung cấp Test Data cụ thể, áp dụng quy ước của repository:
  - Trường text/number: tự sinh dữ liệu unique, traceable, hợp lệ và phù hợp nghiệp vụ kế toán.
  - Trường select/combogrid: lấy option hợp lệ đầu tiên từ UI thực tế sau khi locator và dữ liệu đã được xác minh.
  - Các loại dữ liệu khác hoặc ràng buộc chưa rõ: hỏi người dùng trước khi triển khai.
- Trước khi chạy, phải thực hiện kiểm tra traceability: từng bước và từng assertion trong script tương ứng trực tiếp với manual test case.

## 1. Kiến Trúc & Framework

- Bắt buộc sử dụng mô hình **Page Object Model (POM)**.
- Phân tách rõ ràng:
  - **Page classes:** Khai báo locators + methods tương tác UI
  - **Test classes:** Chứa logic kiểm thử + assertions
  - **Test data:** Tách riêng khỏi code chức năng (JSON, DataProvider, Utils)
- Assertions chỉ đặt trong Test classes, KHÔNG đặt trong Page classes.

### 1.1. Phân tách Page Object, Flow/Helper và Spec

- **Page Object** chỉ chứa locator và hành vi UI thuộc phạm vi một màn hình hoặc một component rõ ràng; không điều phối toàn bộ testcase qua nhiều màn hình.
- **Flow/Helper** đặt trong thư mục `src/helpers` và dùng để điều phối các thao tác lặp lại qua nhiều Page Object.
- Flow/Helper không chứa assertion nghiệp vụ. Flow/Helper phải trả dữ liệu thực tế đã thu thập về cho file spec kiểm tra.
- **Spec/Test class** chịu trách nhiệm mô tả testcase, gọi flow/helper và thực hiện toàn bộ assertion nghiệp vụ theo Expected Result của manual testcase.
- Không chuyển flow nghiệp vụ nhiều màn hình vào Page Object chỉ để làm ngắn file spec.

## 2. Sinh Dữ Liệu Test (Test Data)

- Tất cả trường yêu cầu unique (Email, Username, Mã KH...) **phải sinh động**, không hardcode.
- Sử dụng UUID, Timestamp hoặc thư viện Faker.
- Dữ liệu phải **traceable** — nhìn vào DB biết ngay test nào tạo ra:
  ```
  Format: [prefix]_[testName]_[timestamp]_[random]
  Ví dụ:  auto_createCustomer_20260402_A3F2@test.com
  ```
- Hỗ trợ chạy parallel: mỗi test method có data riêng biệt, không conflict.

## 3. Chất Lượng Code

- Không logic trùng lặp — tạo helper methods cho các hành động lặp đi lặp lại.
- Code phải đơn giản, dễ đọc, dễ bảo trì.
- Trước khi deliver code:
  - Xóa toàn bộ `console.log`, `System.out.println`, `print()` sinh ra khi debug
  - Xóa code bị comment (`//`, `/* */`)
  - Xóa locator / biến không sử dụng (unused code)

## 4. Quản Lý File & Thư Mục

- KHÔNG tự động xóa file source khi chưa xác nhận với user.
- Kiểm tra cấu trúc thư mục hiện có trước khi tạo file mới — tránh duplicate.
- Đặt file đúng thư mục theo kiến trúc project (xem `plan/automation/0_project_architecture`).
- Ảnh, tài liệu và các file upload dùng làm đầu vào cho automation phải đặt trong thư mục `test-data` ở thư mục gốc repository; không đặt trong `test-results`, `playwright-report` hoặc thư mục artifact tạm thời.

## 5. Quy Tắc Đặt Tên

### Java

| Thành phần | Quy tắc | Ví dụ |
|---|---|---|
| Page class | PascalCase + hậu tố `Page` | `LoginPage.java`, `CartPage.java` |
| Test class | PascalCase + hậu tố `Test` | `LoginTest.java`, `CartTest.java` |
| Test method | Bắt đầu bằng `test` + mô tả hành vi | `testLoginWithValidCredentials()` |
| Locator biến | lowerCamelCase + hậu tố mô tả element | `loginButton`, `usernameInput` |
| Utils class | PascalCase + mô tả chức năng | `DataGenerator.java`, `WaitHelper.java` |

### TypeScript / Playwright

| Thành phần | Quy tắc | Ví dụ |
|---|---|---|
| Page class | PascalCase + hậu tố `Page` | `LoginPage.ts`, `CartPage.ts` |
| Test file | kebab-case + `.spec.ts` | `login.spec.ts`, `cart.spec.ts` |
| Test block | `test('mô tả hành vi')` | `test('đăng nhập thành công')` |
| Locator biến | lowerCamelCase hoặc readonly | `readonly loginButton` |
| Utils | PascalCase hoặc kebab-case | `DataGenerator.ts`, `data-generator.ts` |

## 6. Assertions (Kiểm Tra Kết Quả)

- Mỗi test case **BẮT BUỘC** có ít nhất 1 assertion ở cuối.
- Nên có assertion xen kẽ ở các bước quan trọng.
- Assert phải mô tả rõ expected behavior:
  ```java
  // Java/TestNG
  Assert.assertTrue(dashboardPage.isDisplayed(), "Dashboard phải hiển thị sau khi đăng nhập");
  ```
  ```typescript
  // Playwright
  await expect(page.getByText('Đăng nhập thành công')).toBeVisible();
  ```

## 7. Tính Độc Lập Của Test (Test Independence)

- Mỗi test case phải **độc lập** — không phụ thuộc kết quả test khác.
- Mỗi manual testcase độc lập phải tương ứng với một test block riêng, có đúng ID testcase trong tên test.
- Không gộp nhiều manual testcase vào cùng một `test()` hoặc một luồng kiểm tra chung.
- Không sinh các test block độc lập bằng vòng lặp/data-driven nếu cách này làm ẩn ID, bước thực hiện, Expected Result hoặc khiến việc chạy riêng từng testcase khó theo dõi.
- Có thể dùng chung Page Object, flow/helper và test data factory, nhưng mỗi test block vẫn phải tự setup, thực thi, assertion và teardown độc lập.
- Setup/teardown rõ ràng (`@BeforeMethod/@AfterMethod` hoặc `beforeEach/afterEach`).
- Không chia sẻ state giữa các test methods.
- Bản ghi được tạo bởi automation phải dùng mã có tiền tố `AUTO_` và được cleanup trong teardown sau khi test hoàn tất, kể cả khi test fail.
- Cleanup chỉ được xóa đúng bản ghi đã được testcase hiện tại tạo thành công; không tìm kiếm hoặc xóa hàng loạt theo tiền tố.
- Việc chụp evidence và thu thập log lỗi phải hoàn tất trước cleanup để không làm mất trạng thái phục vụ điều tra.
- Cleanup không điều hướng hoặc tải lại trang nếu có thể hoàn thành trên màn hình hiện tại. Chỉ mở màn hình khác khi quy tắc nghiệp vụ của dự án hoặc testcase yêu cầu; không cần redirect trở lại màn hình ban đầu sau khi cleanup hoàn tất.
