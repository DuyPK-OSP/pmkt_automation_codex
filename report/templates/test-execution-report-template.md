# 📋 Báo cáo kiểm thử — {{TÊN_TÍNH_NĂNG}}

> **Kết luận:** {{BIỂU_TƯỢNG_KẾT_LUẬN}} Bộ kiểm thử **{{ĐẠT_HOẶC_CHƯA_ĐẠT}}** — {{TÓM_TẮT_KẾT_QUẢ_VÀ_RỦI_RO_CHÍNH}}.

## Thông tin lần chạy

| Hạng mục | Chi tiết |
|---|---|
| 🗓️ Thời gian | {{DD/MM/YYYY, HH:mm–HH:mm — TIMEZONE}} |
| 🧪 Test suite | `{{ĐƯỜNG_DẪN_FILE_TEST}}` |
| 🌐 Trình duyệt | {{TRÌNH_DUYỆT}} — {{HEADED_HOẶC_HEADLESS}} |
| ⚙️ Cấu hình | `workers={{N}}` · `retries={{N}}` · reporter `{{REPORTER}}` |
| ⏱️ Thời lượng | {{THỜI_LƯỢNG_GIÂY}} giây — khoảng {{THỜI_LƯỢNG_DỄ_ĐỌC}} |

## Tổng quan kết quả

| Tổng test | ✅ PASS | ❌ FAIL | ⏭️ SKIP | Tỷ lệ PASS |
|:---:|:---:|:---:|:---:|:---:|
| **{{TOTAL}}** | **{{PASS}}** | **{{FAIL}}** | **{{SKIP}}** | **{{PASS_RATE}}%** |

<a id="dieu-huong-nhanh"></a>

### Điều hướng nhanh

- [Kết quả từng test case](#kết-quả-chi-tiết)
- [Tổng hợp nhóm lỗi](#tổng-hợp-nhóm-lỗi)
- [{{BUG_ID_01}} — {{TIÊU_ĐỀ_NGẮN}}](#{{ANCHOR_BUG_01}})
- {{LẶP_LẠI_LINK_CHO_CÁC_BUG_CÒN_LẠI}}

---

## Kết quả chi tiết

| TC ID | Kết quả | Nội dung chính |
|---|---|---|
| `{{TC_ID_01}}` | {{✅ PASS / ❌ FAIL / ⏭️ SKIP}} | {{MÔ_TẢ_KẾT_QUẢ_NGẮN_GỌN}} |
| `{{TC_ID_02}}` | {{✅ PASS / ❌ FAIL / ⏭️ SKIP}} | {{MÔ_TẢ_KẾT_QUẢ_NGẮN_GỌN}} |
| {{LẶP_LẠI_CHO_TOÀN_BỘ_TEST_CASE}} | | |

[⬆️ Lên đầu](#dieu-huong-nhanh)

---

## Tổng hợp nhóm lỗi

> Nếu không có lỗi, ghi rõ **Không phát hiện bug trong lần chạy này** và xóa các section bug mẫu bên dưới.

| Bug | Mức độ | Test ảnh hưởng | Tần suất | Mô tả ngắn |
|---|:---:|:---:|:---:|---|
| `{{BUG_ID_01}}` | {{🔴 High / 🟡 Medium / 🟢 Low}} | {{SỐ_TC}} | {{X/Y}} | {{MÔ_TẢ_NGẮN}} |
| {{LẶP_LẠI_CHO_CÁC_BUG_CÒN_LẠI}} | | | | |

### 1. {{TÊN_NHÓM_LỖI_01}} — {{SỐ_TEST}} test

- {{TÓM_TẮT_TRIỆU_CHỨNG}}
- {{PHẠM_VI_ẢNH_HƯỞNG}}
- {{NHẬN_ĐỊNH_ROOT_CAUSE_NẾU_CÓ; PHẢI_GHI_RÕ_LÀ_SUY_LUẬN}}

### 2. {{TÊN_NHÓM_LỖI_02}} — {{SỐ_TEST}} test

- {{TÓM_TẮT_NHÓM_LỖI}}

[⬆️ Lên đầu](#dieu-huong-nhanh)

---

## Chi tiết lỗi

<!-- Sao chép toàn bộ block BUG bên dưới cho mỗi bug. Không gộp các triệu chứng khác root cause. -->

<a id="{{ANCHOR_BUG_01}}"></a>

### {{BUG_ID_01}} — {{TIÊU_ĐỀ_BUG}}

> {{🔴 / 🟡 / 🟢}} **{{SEVERITY}}** · {{PHÂN_LOẠI}} · Tái hiện **{{X/Y}}**

#### Thông tin chung của bug

| Thuộc tính | Giá trị |
|---|---|
| Test case | {{DANH_SÁCH_TC_ID}} |
| Module | {{ĐƯỜNG_DẪN_MODULE}} |
| Phân loại | {{FUNCTIONAL / UI / DATA / CONTENT / PERFORMANCE / ...}} |
| Mức độ đề xuất | {{🔴 High / 🟡 Medium / 🟢 Low}} |
| Trạng thái | {{🔵 Open / 🟠 Confirming / 🟣 Blocked / 🟢 Closed}} |

#### Điều kiện ban đầu

- {{TÀI_KHOẢN_VÀ_QUYỀN}}
- {{TRẠNG_THÁI_MÀN_HÌNH}}
- {{PRECONDITION_DỮ_LIỆU}}

#### Các bước tái hiện

1. {{BƯỚC_1}}
2. {{BƯỚC_2}}
3. {{BƯỚC_3}}
4. {{BỔ_SUNG_CÁC_BƯỚC_CÒN_LẠI}}

#### So sánh kết quả

| Hạng mục | Expected | Actual |
|---|---|---|
| {{HẠNG_MỤC_01}} | {{KẾT_QUẢ_MONG_ĐỢI}} | {{KẾT_QUẢ_THỰC_TẾ}} |
| {{HẠNG_MỤC_02_NẾU_CÓ}} | {{KẾT_QUẢ_MONG_ĐỢI}} | {{KẾT_QUẢ_THỰC_TẾ}} |

{{MÔ_TẢ_THÊM_VỀ_ẢNH_HƯỞNG_HOẶC_ĐIỂM_FAIL_CHÍNH}}

#### Tần suất bug

- **{{X/Y_LẦN}} ({{PHẦN_TRĂM}}%)** trong lần chạy này.
- {{THÔNG_TIN_RETRY_HOẶC_CÁC_BIẾN_THỂ_ĐÃ_KIỂM_TRA}}

#### Dữ liệu test

| Trường dữ liệu | Giá trị |
|---|---|
| {{TÊN_TRƯỜNG_01}} | `{{GIÁ_TRỊ_01}}` |
| {{TÊN_TRƯỜNG_02}} | `{{GIÁ_TRỊ_02}}` |

> Nếu không có dữ liệu test, thay bảng bằng: “Không có dữ liệu nhập; testcase chỉ kiểm tra {{NỘI_DUNG}}.”

#### Ảnh bằng chứng

![{{BUG_ID_01}}](./evidence/{{FEATURE_OR_RUN_ID}}/{{BUG_ID_01}}-{{TC_ID}}.png)

*Ảnh {{SỐ_THỨ_TỰ}} — {{CHÚ_THÍCH_ẢNH_NÊU_RÕ_TRIỆU_CHỨNG}}*  
[🔍 Mở ảnh gốc](./evidence/{{FEATURE_OR_RUN_ID}}/{{BUG_ID_01}}-{{TC_ID}}.png)

{{DANH_SÁCH_LINK_ẢNH_BỔ_SUNG_NẾU_BUG_ẢNH_HƯỞNG_NHIỀU_TC}}

[⬆️ Lên đầu](#dieu-huong-nhanh)

---

## Thông tin kỹ thuật

### Lệnh đã chạy

```powershell
{{LỆNH_TEST_ĐẦY_ĐỦ_KHÔNG_CHỨA_CREDENTIALS}}
```

### Artifacts

- Evidence lâu dài: `report/evidence/{{FEATURE_OR_RUN_ID}}/`
- Artifacts tạm: `test-results/`, `playwright-report/`, `allure-results/`

> [!NOTE]
> Báo cáo phản ánh nguyên trạng lần chạy với `retries={{N}}`. Không sửa expected hoặc automation chỉ để làm thay đổi kết quả báo cáo.

<!--
CHECKLIST TRƯỚC KHI DELIVER — xóa comment này khỏi report thành phẩm nếu cần:
[ ] Tổng PASS + FAIL + SKIP = TOTAL
[ ] PASS_RATE được tính đúng
[ ] Mỗi test case xuất hiện đúng một lần trong bảng kết quả
[ ] Mỗi bug có đủ 7 phần bắt buộc
[ ] Tần suất ghi theo dữ liệu thực, không suy đoán
[ ] Không chứa credentials hoặc PII thật
[ ] Ảnh cần giữ đã copy vào report/evidence/<feature-or-run-id>/
[ ] Không còn link từ report tới test-results/, playwright-report/ hoặc allure-results/
[ ] Tất cả link ảnh tồn tại và không bị .gitignore
[ ] Có link Lên đầu sau bảng kết quả, phần tổng hợp và từng bug
[ ] Giữ nguyên các chỉnh sửa thủ công ngoài phạm vi được yêu cầu
-->
