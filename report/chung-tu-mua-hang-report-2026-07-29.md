# Báo cáo kết quả automation vat-tu-tao-moi.spec.ts — 29/07/2026

## 1. Thông tin thực thi

- **Chức năng:** Thêm mới Danh mục Vật tư
- **Phạm vi:** `CL-UAT-U-00106-01` đến `CL-UAT-U-00106-08`
- **Ngày chạy:** 29/07/2026
- **Framework:** Playwright + TypeScript
- **Browser:** Chromium, headed mode
- **Viewport:** 1920 × 1080
- **Cấu hình ổn định:** `workers=1`, `repeat-each=2`, `retries=0`
- **Ứng dụng kiểm thử:** `http://18.141.17.116`
- **Trạng thái kỹ thuật:** TypeScript typecheck PASS; không còn lỗi code hoặc locator đã biết

## 2. Tổng quan

| Kết quả | Số testcase | Tỷ lệ |
|---|---:|---:|
| PASS | 1 | 12,5% |
| FAIL sản phẩm | 7 | 87,5% |
| SKIP | 0 | 0% |
| **Tổng** | **8** | **100%** |

> Các testcase được chạy lặp hai lần để xác nhận tính ổn định. Trạng thái FAIL bên dưới là sai khác giữa UI thực tế và Expected Result, không phải lỗi code automation.

## 3. Kết quả chi tiết

| TC ID | Kết quả | Stability | Kết quả thực tế |
|---|---|---:|---|
| `CL-UAT-U-00106-01` | FAIL sản phẩm | 0/2 | Popup có đủ 6 lựa chọn nhưng mô tả “Bán thành phẩm” trên UI có thêm dấu chấm cuối câu so với testcase. |
| `CL-UAT-U-00106-02` | PASS | 2/2 | Cả 6 loại vật tư có dropdown Nhóm vật tư; tìm theo mã/tên và chọn đồng thời nhóm hoạt động/ngừng hoạt động thành công. |
| `CL-UAT-U-00106-03` | FAIL sản phẩm | 0/2 | Tìm/chọn đơn vị hoạt động thành công; đơn vị `Binh — Bình` ở trạng thái ngừng hoạt động không xuất hiện trong dropdown. |
| `CL-UAT-U-00106-04` | FAIL sản phẩm | 0/2 | Tài khoản doanh thu hoạt động được phép hạch toán tìm/chọn thành công; grid thiếu header BR5, thiếu trạng thái trên dòng và không hiển thị tài khoản ngừng hoạt động. |
| `CL-UAT-U-00106-05` | FAIL sản phẩm | 0/2 | Tài khoản hàng bán trả lại tìm/chọn theo số hiệu và tên thành công; grid thiếu header BR5, thiếu trạng thái trên dòng và không hiển thị tài khoản ngừng hoạt động. |
| `CL-UAT-U-00106-06` | FAIL sản phẩm | 0/2 | Tài khoản chi phí tìm/chọn theo số hiệu và tên thành công; grid thiếu header BR5, thiếu trạng thái trên dòng và không hiển thị tài khoản ngừng hoạt động. |
| `CL-UAT-U-00106-07` | FAIL sản phẩm | 0/2 | Tài khoản chiết khấu tìm/chọn theo số hiệu và tên thành công; grid thiếu header BR5, thiếu trạng thái trên dòng và không hiển thị tài khoản ngừng hoạt động. |
| `CL-UAT-U-00106-08` | FAIL sản phẩm | 0/2 | Tài khoản giảm giá tìm/chọn theo số hiệu và tên thành công; grid thiếu header BR5, thiếu trạng thái trên dòng và không hiển thị tài khoản ngừng hoạt động. |

## 4. Lượt chạy gần nhất: TCS 06–08

- Tổng số lượt: **6** (`3 testcase × 2 lần`).
- Kết quả: **6 FAIL**.
- Cả ba control đều mở được combogrid, tìm được tài khoản hoạt động theo số hiệu/tên và chọn được giá trị hợp lệ.
- Cả sáu lượt cùng thất bại ổn định tại ba expected:
  1. Không có các header `Số tài khoản`, `Tên tài khoản`, `Trạng thái` theo BR5.
  2. Dòng option chỉ hiển thị `<Số tài khoản> — <Tên tài khoản>`, không hiển thị trạng thái.
  3. Tài khoản ngừng hoạt động `1112 — Ngoại tệ` không xuất hiện trong combogrid.

## 5. Nhóm lỗi đề xuất

### DEFECT-01 — Sai khác nội dung mô tả loại vật tư

- **Ảnh hưởng:** TCS 01.
- **Actual:** Mô tả “Bán thành phẩm” có thêm dấu chấm cuối câu.
- **Expected:** Nội dung khớp testcase.

### DEFECT-02 — Dropdown không hiển thị dữ liệu ngừng hoạt động

- **Ảnh hưởng:** TCS 03.
- **Actual:** Đơn vị tính ngừng hoạt động không xuất hiện.
- **Expected:** Dữ liệu hoạt động và ngừng hoạt động đều hiển thị/chọn được.

### DEFECT-03 — Các combogrid tài khoản không đúng BR5 và thiếu dữ liệu ngừng hoạt động

- **Ảnh hưởng:** TCS 04–08.
- **Control:** Tài khoản doanh thu, hàng bán trả lại, chi phí, chiết khấu, giảm giá.
- **Actual:** Không có header; dòng không có trạng thái; tài khoản ngừng hoạt động không xuất hiện.
- **Expected:** Có ba cột `Số tài khoản`, `Tên tài khoản`, `Trạng thái`; hiển thị/chọn được tài khoản hoạt động hợp lệ và tài khoản ngừng hoạt động.

## 6. Evidence

- Playwright artifacts: `test-results/`
- Mỗi lần FAIL có screenshot, video, trace và `error-context.md` tương ứng.
- Nhật ký triển khai và auto-heal: `task.md`
- Automation spec: `src/tests/danh-muc/vat-tu-tao-moi.spec.ts`
- Page Object: `src/pages/vat-tu.page.ts`

## 7. Kết luận

Automation cho TCS 01–08 đã được tạo và xác minh kỹ thuật. TCS 02 PASS ổn định 2/2; bảy testcase còn lại FAIL do UI không khớp Expected Result. Các lỗi của TCS 04–08 có cùng biểu hiện và nên được đánh giá như một lỗi dùng chung của component combogrid tài khoản trước khi retest.
