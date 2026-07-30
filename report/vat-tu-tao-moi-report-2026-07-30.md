# Báo cáo kết quả automation vat-tu-tao-moi.spec.ts — 30/07/2026

## 1. Thông tin thực thi

- Chức năng: Thêm mới Danh mục Vật tư
- File chạy: `src/tests/danh-muc/vat-tu-tao-moi.spec.ts`
- Thời gian kết thúc: 30/07/2026 08:33
- Framework: Playwright + TypeScript
- Browser: Chromium
- Phạm vi: TC01–TC08, TC14, TC15 và TC33

## 2. Tổng quan

| Kết quả | Số testcase | Tỷ lệ |
|---|---:|---:|
| PASS | 3 | 27,3% |
| FAIL | 8 | 72,7% |
| SKIP | 0 | 0% |
| **Tổng** | **11** | **100%** |

Các testcase PASS: TC02, TC14 và TC15.

## 3. Kết quả chi tiết

| TC ID | Kết quả | Phân loại | Kết quả thực tế |
|---|---|---|---|
| `CL-UAT-U-00106-01` | FAIL | Lỗi sản phẩm/yêu cầu lệch | Popup có đủ 6 lựa chọn nhưng mô tả “Bán thành phẩm” không khớp chính xác testcase; sai khác được ghi nhận ở dấu chấm cuối câu. |
| `CL-UAT-U-00106-02` | PASS | — | Dropdown Nhóm vật tư hiển thị và cho phép chọn dữ liệu hoạt động/ngừng hoạt động. |
| `CL-UAT-U-00106-03` | FAIL | Lỗi sản phẩm | Danh mục có đơn vị `Binh — Bình` ngừng hoạt động nhưng dropdown Đơn vị tính chính không hiển thị giá trị này. |
| `CL-UAT-U-00106-04` | FAIL | Lỗi sản phẩm | Combogrid Tài khoản doanh thu không có ba header theo BR5. |
| `CL-UAT-U-00106-05` | FAIL | Lỗi sản phẩm | Combogrid Tài khoản hàng bán trả lại không có ba header theo BR5. |
| `CL-UAT-U-00106-06` | FAIL | Lỗi sản phẩm | Combogrid Tài khoản chi phí không có ba header theo BR5. |
| `CL-UAT-U-00106-07` | FAIL | Lỗi sản phẩm | Combogrid Tài khoản chiết khấu không có ba header theo BR5. |
| `CL-UAT-U-00106-08` | FAIL | Lỗi sản phẩm | Combogrid Tài khoản giảm giá không có ba header theo BR5. |
| `CL-UAT-U-00106-14` | PASS | — | Form thông tin chính của Hàng hóa hiển thị đúng. |
| `CL-UAT-U-00106-15` | PASS | — | Dropdown Loại hàng hóa đặc trưng hoạt động đúng. |
| `CL-UAT-U-00106-33` | FAIL | Lệch nội dung thông báo | Thêm mới thành công nhưng UI hiển thị `Thêm mới vật tư thành công`, trong khi testcase mong đợi `Thêm mới thành công`. |

## 4. Nhóm lỗi đề xuất

### DEFECT-01 — Mô tả Bán thành phẩm không khớp testcase

- Ảnh hưởng: TC01.
- Actual: nội dung trên UI có sai khác dấu chấm cuối câu.
- Expected: mô tả khớp chính xác nội dung testcase.

### DEFECT-02 — Đơn vị tính ngừng hoạt động không xuất hiện

- Ảnh hưởng: TC03.
- Actual: không tìm thấy `Binh — Bình` trong dropdown Đơn vị tính chính.
- Expected: dữ liệu hoạt động và ngừng hoạt động đều hiển thị/chọn được.

### DEFECT-03 — Combogrid tài khoản không đúng BR5

- Ảnh hưởng: TC04–TC08.
- Các trường: Tài khoản doanh thu, hàng bán trả lại, chi phí, chiết khấu và giảm giá.
- Actual: không hiển thị các header của grid.
- Expected: có các cột `Số tài khoản`, `Tên tài khoản`, `Trạng thái`.
- Khuyến nghị: ghi nhận một bug dùng chung cho component combogrid, liệt kê năm trường bị ảnh hưởng.

### DEFECT-04 — Nội dung thông báo thêm mới không khớp testcase

- Ảnh hưởng: TC33.
- Actual: `Thêm mới vật tư thành công`.
- Expected theo testcase: `Thêm mới thành công`.
- Chức năng thêm mới vẫn thành công; cần xác nhận wording chuẩn trước khi sửa testcase hoặc ghi bug sản phẩm.

## 5. Đánh giá automation

- Không phát hiện dấu hiệu lỗi locator, lỗi script hoặc lỗi môi trường trong lần chạy này.
- Các module vừa refactor (`test-data`, utility và assertion helper) được nạp và thực thi bình thường.
- TC04–TC08 cùng thất bại tại assertion dùng chung, phù hợp với biểu hiện lỗi của một component dùng chung.

## 6. Evidence

- Playwright artifacts: `test-results/`
- Allure raw results: `allure-results/`
- Automation spec: `src/tests/danh-muc/vat-tu-tao-moi.spec.ts`
- Assertion helper: `src/helpers/vat-tu-assertion.helper.ts`

## 7. Kết luận

Lần chạy có 3/11 testcase PASS và 8/11 testcase FAIL. Các lỗi hiện tại chủ yếu là sai khác sản phẩm so với Expected Result. TC33 đã tạo dữ liệu thành công và chỉ thất bại do nội dung thông báo; TC04–TC08 nên được quản lý như một lỗi component dùng chung.
