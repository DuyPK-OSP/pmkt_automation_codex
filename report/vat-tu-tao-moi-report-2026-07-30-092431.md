# Báo cáo kết quả automation `vat-tu-tao-moi.spec.ts`

## 1. Thông tin thực thi

- Chức năng: Thêm mới Danh mục Vật tư
- File chạy: `src/tests/danh-muc/vat-tu-tao-moi.spec.ts`
- Thời gian chạy: 30/07/2026, khoảng 09:21:55–09:24:17
- Lệnh chạy: `npm run test:vat-tu-tao-moi:headed`
- Framework: Playwright + TypeScript
- Browser: Chromium, headed mode, viewport 1920x1080
- Worker: 1
- Tổng thời lượng: khoảng 2,4 phút
- Phạm vi: TC01–TC08, TC14, TC15 và TC33

## 2. Tổng quan kết quả

| Kết quả | Số testcase | Tỷ lệ |
|---|---:|---:|
| PASS | 3 | 27,3% |
| FAIL | 8 | 72,7% |
| SKIP | 0 | 0% |
| **Tổng** | **11** | **100%** |

Kết luận lần chạy: **FAILED**.

## 3. Kết quả chi tiết

| TC ID | Kết quả | Thời lượng | Kết quả thực tế |
|---|---|---:|---|
| `CL-UAT-U-00106-01` | FAIL | 3,9 giây | Popup có đủ nhóm lựa chọn nhưng mô tả `Bán thành phẩm` không khớp chính xác manual testcase. |
| `CL-UAT-U-00106-02` | PASS | 12,7 giây | Multiple select Nhóm vật tư hoạt động đúng. |
| `CL-UAT-U-00106-03` | FAIL | 15,3 giây | Không tìm thấy Đơn vị tính ngừng hoạt động `Binh — Bình` trong dropdown sau 10 giây. |
| `CL-UAT-U-00106-04` | FAIL | 15,8 giây | Tài khoản doanh thu không hiển thị ba header theo BR5; dòng tài khoản không có trạng thái và không tìm thấy tài khoản ngừng hoạt động. |
| `CL-UAT-U-00106-05` | FAIL | 15,8 giây | Tài khoản hàng bán trả lại có cùng sai khác combogrid theo BR5. |
| `CL-UAT-U-00106-06` | FAIL | 16,0 giây | Tài khoản chi phí có cùng sai khác combogrid theo BR5. |
| `CL-UAT-U-00106-07` | FAIL | 16,1 giây | Tài khoản chiết khấu có cùng sai khác combogrid theo BR5. |
| `CL-UAT-U-00106-08` | FAIL | 15,8 giây | Tài khoản giảm giá có cùng sai khác combogrid theo BR5. |
| `CL-UAT-U-00106-14` | PASS | 5,8 giây | Form Hàng hóa hiển thị đầy đủ tab và trường theo testcase. |
| `CL-UAT-U-00106-15` | PASS | 5,4 giây | Dropdown Loại hàng hóa đặc trưng hoạt động đúng. |
| `CL-UAT-U-00106-33` | FAIL | 8,4 giây | Tạo vật tư thành công nhưng thông báo thực tế khác expected. |

## 4. Phân nhóm sai khác

### Nhóm 1 — Mô tả Bán thành phẩm không khớp

- Ảnh hưởng: TC01.
- Expected: `Sản phẩm đầu ra của một công đoạn sản xuất nhất định`.
- Actual: nội dung UI không chứa đúng nguyên văn expected.
- Đề xuất: xác nhận wording chuẩn với BA/PO trước khi sửa sản phẩm hoặc testcase.

### Nhóm 2 — Đơn vị tính ngừng hoạt động không xuất hiện

- Ảnh hưởng: TC03.
- Expected: dropdown hiển thị và cho chọn `Binh — Bình` ở trạng thái ngừng hoạt động.
- Actual: không tìm thấy phần tử sau timeout 10 giây.
- Đề xuất: xác nhận business rule có cho phép chọn dữ liệu ngừng hoạt động khi tạo mới hay không.

### Nhóm 3 — Combogrid tài khoản không đúng BR5

- Ảnh hưởng: TC04–TC08.
- Các trường ảnh hưởng: Tài khoản doanh thu, hàng bán trả lại, chi phí, chiết khấu và giảm giá.
- Expected header: `Số tài khoản`, `Tên tài khoản`, `Trạng thái`.
- Actual header: danh sách rỗng `[]`.
- Dòng tài khoản hoạt động chỉ hiển thị mã và tên, không chứa trạng thái `Hoạt động`.
- Không tìm thấy tài khoản ngừng hoạt động `1112 — Ngoại tệ`.
- Đề xuất: tạo một defect chung cho component combogrid và liên kết năm testcase bị ảnh hưởng.

### Nhóm 4 — Thông báo tạo mới khác testcase

- Ảnh hưởng: TC33.
- Expected: `Thêm mới thành công`.
- Actual: `Thêm mới vật tư thành công`.
- Vật tư đã được tạo: `AUTO_TC33_1785378249897`.
- Đánh giá: luồng tạo mới thành công; testcase thất bại tại assertion nội dung thông báo.
- Đề xuất: xác nhận wording chuẩn trước khi sửa testcase hoặc ghi nhận defect UI.

## 5. Đánh giá automation

- Không phát hiện lỗi đăng nhập, browser crash hoặc lỗi môi trường.
- Không có testcase bị skip.
- TC04–TC08 lặp lại cùng một biểu hiện qua assertion helper dùng chung, phù hợp để quản lý dưới một defect component.
- Screenshot, video, trace và DOM error context đã được sinh cho cả tám testcase thất bại.
- Kết quả nhất quán với lần chạy trước; không có dấu hiệu lỗi ngẫu nhiên trong batch này.

## 6. Evidence

- Playwright HTML report: `playwright-report/`
- Playwright failure artifacts: `test-results/`
- Allure raw results: `allure-results/`
- Last-run status: `test-results/.last-run.json`
- Automation spec: `src/tests/danh-muc/vat-tu-tao-moi.spec.ts`
- Assertion helper: `src/helpers/vat-tu-assertion.helper.ts`

## 7. Kết luận

Lần chạy có **3/11 testcase PASS** và **8/11 testcase FAIL**. Chức năng tạo vật tư tối thiểu đã thực hiện thành công, nhưng nội dung thông báo không khớp testcase. Nhóm ảnh hưởng lớn nhất là combogrid tài khoản, làm thất bại đồng thời năm testcase. Cần ưu tiên xác nhận BR5 và tạo defect chung cho component này.
