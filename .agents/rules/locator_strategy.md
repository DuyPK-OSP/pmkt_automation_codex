---
trigger: always_on
---

# Chiến Lược Chọn Locator (Áp Dụng Mọi Framework)

> Độ ổn định và khả năng đọc hiểu của locator quyết định sức khỏe của một automation framework.
> Nguyên tắc cốt lõi: KHÔNG BAO GIỜ chọn element dựa trên cấu trúc DOM gắn với styling. Hãy xây dựng locator dựa trên thuộc tính có ngữ nghĩa.

## 1. Bản Đồ Ưu Tiên (Master Priority Map)

Thứ tự ưu tiên từ cao đến thấp:

1. Thuộc tính Accessibility / Aria (semantic, hỗ trợ screen reader)
2. Thuộc tính test chuyên dụng (`data-testid`, `data-test`, `data-qa`)
3. Thuộc tính định danh chính (`id`, `resource-id`, `name`)
4. Hàm semantic riêng framework (Playwright: `getByRole`, `getByLabel`...)
5. CSS Selector
6. XPath (lựa chọn cuối cùng)

## 2. Quy Tắc Ổn Định (Stability Rules)

Mọi locator phải đảm bảo:
- Chỉ match **đúng 1 element** duy nhất trên trang (unique in scope).
- Sống sót qua thay đổi giao diện — không bị ảnh hưởng khi DOM thay đổi layout (thêm/bớt div wrapper, đổi flexbox).

**NGHIÊM CẤM sử dụng:**
- CSS class name động / hash tạm thời (ví dụ: `css-1n2xyz-btn`)
- Chuỗi `nth-child`, `nth-of-type` khi có lựa chọn tốt hơn
- ID tự sinh bởi framework (auto-generated IDs)
- XPath tuyệt đối dựa trên vị trí (ví dụ: `//div[3]/div[2]/form/button`)

## 3. Quy Trình Xác Minh Locator

Trước khi đưa locator vào code, phải kiểm tra:

1. Locator có match **đúng 1 element** trong DOM không?
2. Element match có phải là thành phần người dùng tương tác được không? (không phải shadow DOM overlay)
3. Reload / navigate lại trang — locator có còn đúng không?
4. Thử trên nhiều trạng thái trang (loading, loaded, có data, không data) — locator có ổn định không?

## 4. Locator Profile Cho Nhiều Môi Trường

Áp dụng khi các môi trường có cùng luồng nghiệp vụ nhưng DOM hoặc thuộc tính định danh khác nhau.

### 4.1. Kiến trúc bắt buộc

- Giữ một bộ spec, helper/flow và Page Object với interface nghiệp vụ dùng chung.
- Tách locator mapping khỏi hành vi Page Object thành các profile có cùng contract.
- Mỗi màn hình hoặc component có Page Object phải tổ chức thành cặp file cùng tên và cùng thư mục: `<ten-man>.page.ts` chứa hành vi nghiệp vụ, `<ten-man>.locators.ts` chứa locator mapping.
- Quy tắc cặp file vẫn áp dụng khi màn hình hiện tại chỉ có ít locator, nhằm giữ cấu trúc nhất quán và tránh phải refactor import khi mở rộng màn chi tiết sau này.
- Page Object chỉ được import file locator riêng cùng cặp; không import trực tiếp locator hoặc factory dùng chung từ phân hệ khác.
- File `<ten-man>.locators.ts` được phép tái sử dụng interface/factory locator chung ở lớp bên dưới để tránh trùng code, nhưng phải giữ điểm mở rộng riêng cho màn hình đó.
- Khi bổ sung locator mới, ưu tiên cập nhật file `.locators.ts`; không khai báo locator trực tiếp trong `.page.ts` hoặc spec.
- Không tạo Page Object, helper hoặc spec thứ hai nếu khác biệt chỉ nằm ở locator.
- Profile phải được chọn từ cấu hình môi trường, ví dụ `LOCATOR_PROFILE`; không rẽ nhánh theo URL trực tiếp trong spec.
- Locator không được khai báo inline trong spec để xử lý khác biệt môi trường.

### 4.2. Profile tham chiếu và profile data-testid

- `current`: locator phải được inspect và xác minh trực tiếp trên DOM của UI tham chiếu.
- `testid`: dùng `getByTestId()` hoặc cơ chế tương đương theo locator contract đã thống nhất với dev.
- Không được báo profile `testid` PASS nếu `data-testid` chưa tồn tại trên DOM thật hoặc testcase chưa được chạy xác minh.
- Trước khi có DOM mới, trạng thái của profile `testid` phải là `scaffold/chờ xác minh DOM`, kèm danh sách contract cần dev triển khai.
- Nếu tên `data-testid` thực tế khác contract, ưu tiên thống nhất lại contract với dev; nếu nghiệp vụ không đổi thì chỉ cập nhật mapping, không sửa testcase.

### 4.3. Quy tắc data-testid contract

- Tên đề xuất: `<module>-<screen>-<element>-<purpose>`.
- Phải unique trong scope phù hợp, ổn định và mô tả vai trò nghiệp vụ.
- Không chứa CSS class, vị trí, timestamp, database ID hoặc dữ liệu cá nhân.
- Với danh sách động, dùng một test ID ổn định cho loại row/component và lọc bằng khóa nghiệp vụ unique; không sinh test ID theo số thứ tự dòng.
- Dev phải thông báo cho QA khi xóa hoặc đổi test ID đã nằm trong contract.

### 4.4. Quy trình migration

1. Chạy và inspect luồng trên UI tham chiếu.
2. Lập inventory element và locator hiện tại theo Page Object/component.
3. Sinh `data-testid` contract và mapping hai profile có cùng interface.
4. Xác minh profile `current` bằng typecheck và test thật ở headed mode.
5. Khi DOM mới được bàn giao, inspect lại, đối chiếu contract và cập nhật mapping.
6. Chạy smoke test theo module, các testcase bị ảnh hưởng và regression liên quan.

Nếu luồng thao tác, validation hoặc Expected Result thay đổi, phải phân loại là thay đổi chức năng và đánh giá lại spec; không xử lý như thay đổi locator đơn thuần.

## 5. Locator Theo Framework

Chi tiết locator cho từng framework xem tại:
- Playwright: `.agents/rules/playwright_rules.md` (Section 3)

Khi thứ tự ưu tiên chung khác với rule riêng của framework, rule riêng của framework được ưu tiên; với Playwright áp dụng đúng thứ tự tại `playwright_rules.md`.
