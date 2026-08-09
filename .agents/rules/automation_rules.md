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
- File spec chỉ chứa import, hook, `test.describe`/`test` và các bước test script cụ thể. Không khai báo function, data factory, parser, flow hoặc DB verifier dùng chung trong file spec; phải tách chúng sang `helpers`, `test-data`, `utils` hoặc lớp phù hợp rồi gọi từ testcase.
- Assertion helper có mục đích kiểm chứng rõ ràng được phép đặt trong `src/helpers` để giữ spec thuần test script; helper không được che giấu ID, steps hoặc Expected Result riêng của từng manual testcase.
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
  - Xóa code đã bị vô hiệu hóa bằng comment (`//`, `/* */`); không áp dụng cho chú thích giải thích luồng testcase theo quy tắc bên dưới
  - Xóa locator / biến không sử dụng (unused code)

### 3.1. Quy tắc chú thích cho toàn bộ code

- Áp dụng BẮT BUỘC cho **mọi file code**: spec, Page Object, locator, test data, cleanup, fixture, helper/flow, database, reporter, utils, config, script và custom tooling. Khi sinh hoặc sửa code, agent phải tự bổ sung/cập nhật chú thích trong cùng thay đổi, không chờ người dùng yêu cầu.
- Dùng tiếng Việt ngắn gọn và đúng nghiệp vụ PMKT; giữ nguyên thuật ngữ kỹ thuật như fixture, locator, retry, tenant, reporter, cleanup khi cần.
- JSDoc bắt buộc cho class, interface/type có ràng buộc, function/method và exported API dùng chung; đồng thời áp dụng cho constructor/private helper có lifecycle, side effect, fallback, retry hoặc thuật toán không hiển nhiên.
- Comment đặt ngay trước cụm code cần giải thích và phải làm rõ ít nhất một ý: nghiệp vụ gì, tại sao cần làm, chạy khi nào, tác động tới đâu hoặc dữ liệu trả về có ý nghĩa gì.

| Loại code | Nội dung chú thích bắt buộc |
|---|---|
| **Spec** | `Chuẩn bị dữ liệu:` cho data/precondition; `Hành động:` mô tả flow bằng dấu `>`; `Xác nhận:` đặt trước assertion, tách `UI/API/DB` khi cần. Case SKIP chỉ ghi đúng precondition, không tạo flow giả. |
| **Page Object / Locator** | JSDoc nêu ý nghĩa nghiệp vụ của method, tham số và kết quả trả về khi chưa rõ; không đưa Expected Result vào Page Object. |
| **Cleanup / Fixture** | Tài nguyên được theo dõi/cung cấp, phần setup trước `use()`, teardown sau `use()`, điều kiện xóa an toàn và tác động cascade. |
| **Helper / Flow** | Mục đích luồng, input/output, module liên phân hệ và side effect; assertion nghiệp vụ thuộc spec, trừ assertion helper dùng chung có chủ đích rõ ràng. |
| **Database** | Mục đích query, tenant/khóa nghiệp vụ, read-only hay mutation, parameterized query và dữ liệu trả về. |
| **Reporter** | Lifecycle hook, thời điểm ghi artifact/index, cách chuẩn hóa status, attachment và retry. |
| **Utils / Config / Test data / Script** | Contract, format dữ liệu, fallback, retry, parsing, seed, side effect hoặc workaround không hiển nhiên. |

Ví dụ chuẩn:

```typescript
// Chuẩn bị dữ liệu: Sinh Ngành nghề có mã unique để tránh trùng khi chạy lại testcase.
// Hành động: Truy cập > Mở form Thêm mới > Nhập dữ liệu > Nhấn nút Lưu.
// Xác nhận trong DB: Bản ghi có đúng Mã, Tên, Diễn giải và Trạng thái.

/** Mở form Thêm mới Ngành nghề và chờ popup sẵn sàng thao tác. */
async openCreateDialog(): Promise<void> {
  // implementation
}

// Đăng ký mã để fixture cleanup sau khi testcase kết thúc; dữ liệu chưa bị xóa tại đây.
industryCleanup.register(data.code);
```

- Không comment từng dòng, import, phép gán hoặc câu lệnh hiển nhiên; không lặp lại tên hàm, không dùng comment chung chung như `xử lý dữ liệu`, không thêm `Nhóm 1/2`, và không giữ code bị vô hiệu hóa bằng comment.
- Khi logic thay đổi, comment liên quan phải được cập nhật trong cùng thay đổi; comment sai hoặc lỗi thời được xem là lỗi code.
- Trước khi bàn giao, kiểm tra mọi file đã thay đổi: đủ JSDoc cần thiết; lifecycle/side effect/workaround đúng vị trí; không có comment thừa/sai vị trí; comment không làm đổi logic, dữ liệu hoặc Expected Result.

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

### 6.0. Nguồn expected cho dữ liệu nghiệp vụ

- Mọi expected liên quan đến dữ liệu nghiệp vụ phải lấy từ hoặc đối chiếu trực tiếp với database đúng tenant. Phạm vi bao gồm dữ liệu form, danh mục, dropdown, combogrid, giá trị mặc định, trạng thái, quan hệ, điều kiện lọc và dữ liệu sau thao tác tạo/sửa/xóa.
- Nghiêm cấm dùng API response làm nguồn expected cho assertion dữ liệu. API chỉ được dùng để đồng bộ hoặc chờ hoàn tất thao tác kỹ thuật; payload API không quyết định kết quả PASS/FAIL của dữ liệu.
- Sau thao tác ghi dữ liệu qua UI, testcase phải truy vấn bằng khóa unique do chính testcase tạo và xác nhận các trường, trạng thái, quan hệ hoặc ảnh hưởng dữ liệu được manual testcase yêu cầu.
- Với testcase thêm mới thành công, phạm vi verify DB phải bao phủ toàn bộ trường trên UI có ánh xạ lưu trữ, không chỉ các trường người dùng chủ động nhập/chọn. Phải kiểm tra cả trường tự động điền, checkbox, trạng thái, dữ liệu bảng con và giá trị hệ thống phát sinh như ID, tenant, cờ xóa hoặc thứ tự dòng khi có.
- Với testcase chỉ nhập các trường bắt buộc, trước khi lưu phải đọc và lưu lại toàn bộ giá trị mặc định thực tế đang hiển thị trên UI của các trường không nhập. Sau khi lưu, đối chiếu từng giá trị đó với DB; không được tự hardcode hoặc suy diễn default từ API, code ứng dụng hay một testcase khác.
- Phải phân biệt placeholder với giá trị thực. Nội dung gợi ý như `Chọn`, `Chọn...`, `Chọn kho mặc định` không phải dữ liệu đã chọn và phải được chuẩn hóa tương ứng `NULL`/rỗng khi đối chiếu DB.
- Trước assertion phải chuẩn hóa có chủ đích các khác biệt biểu diễn giữa UI và DB, gồm label combogrid, enum, number/decimal, boolean, chuỗi rỗng/`NULL` và quy ước thứ tự zero-based. Không được thay expected chỉ để làm testcase PASS; mọi quy tắc chuẩn hóa phải dựa trên contract hoặc dữ liệu chạy thực tế đã được xác minh.
- Dùng cơ chế polling có timeout để chờ transaction ghi dữ liệu hoàn tất rồi mới đọc bản ghi; không dùng fixed sleep. Mismatch UI mềm như nội dung toast không được ngăn phần verify DB tiếp tục khi testcase cần thu thập đồng thời cả kết quả UI và DB.
- Chỉ kết luận một testcase đã verify DB đầy đủ khi lần chạy thực tế đã đi xuyên qua toàn bộ DB assertions của chính testcase đó. Không suy luận kết quả từ testcase tương tự hoặc từ lần chạy đã dừng trước phần kiểm tra DB.
- Mỗi bảng DB phải có repository riêng; không tạo repository tổng hợp chứa query của nhiều bảng nghiệp vụ khác ownership.
- SQL chỉ nằm trong repository. Page Object không truy vấn DB; helper chỉ điều phối/ánh xạ; assertion nghiệp vụ nằm trong spec.
- Query dùng để verify phải read-only, parameterized và xác định đúng `tenant_id`; không hardcode tenant, credential hoặc thông tin kết nối.
- Với dropdown/combogrid dùng virtual scroll hoặc lazy-load, phải search/filter bằng khóa nghiệp vụ ổn định và unique (ưu tiên mã) để bản ghi được render vào DOM trước khi assert hoặc chọn. Không coi tập option đang render ban đầu là toàn bộ dữ liệu UI.
- Chỉ phân loại là lỗi dữ liệu UI khi DB xác nhận bản ghi thuộc đúng tenant nhưng UI vẫn không trả về option sau khi tìm chính xác theo mã/tên. Ảnh chụp danh sách ban đầu chưa qua tìm kiếm không phải evidence đầy đủ cho lỗi thiếu dữ liệu.

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
