# 📋 Báo cáo kiểm thử — Thêm mới chứng từ mua hàng

> **Kết luận:** ✅ Bộ kiểm thử **ĐẠT** — toàn bộ 5/5 testcase vượt qua; không phát hiện bug trong lần chạy này.

## Thông tin lần chạy

| Hạng mục | Chi tiết |
|---|---|
| 🗓️ Thời gian | 31/07/2026, 12:29–12:31 — Asia/Saigon (UTC+7) |
| 🧪 Test suite | `src/tests/mua-hang/chung-tu-mua-hang-them-moi.spec.ts` |
| 🌐 Trình duyệt | Chromium — headed, viewport 1920×1080 |
| ⚙️ Cấu hình | `workers=1` · `retries=0` · reporter `line` |
| ⏱️ Thời lượng | 118,3 giây — khoảng 1 phút 58 giây |

## Tổng quan kết quả

| Tổng test | ✅ PASS | ❌ FAIL | ⏭️ SKIP | Tỷ lệ PASS |
|:---:|:---:|:---:|:---:|:---:|
| **5** | **5** | **0** | **0** | **100%** |

<a id="dieu-huong-nhanh"></a>

### Điều hướng nhanh

- [Kết quả từng test case](#kết-quả-chi-tiết)
- [Tổng hợp nhóm lỗi](#tổng-hợp-nhóm-lỗi)
- [Thông tin kỹ thuật](#thông-tin-kỹ-thuật)

---

## Kết quả chi tiết

| TC ID | Kết quả | Nội dung chính |
|---|---|---|
| `CL-UAT-U-00502-240` | ✅ PASS | Tạo chứng từ mua hàng nhập kho trong nước, không có hóa đơn, chưa thanh toán; kiểm tra chi tiết, Phiếu nhập kho và cleanup. |
| `CL-UAT-U-00502-241` | ✅ PASS | Thanh toán ngay bằng Tiền mặt; kiểm tra Phiếu nhập kho và Phiếu chi tại `Tiền mặt → Chi tiền`, trạng thái `Chưa ghi sổ`. |
| `CL-UAT-U-00502-242` | ✅ PASS | Thanh toán ngay bằng Ủy nhiệm chi; kiểm tra Phiếu nhập kho và chứng từ tại `Tiền gửi → Chi tiền`, trạng thái `Chưa ghi sổ`. |
| `CL-UAT-U-00502-243` | ✅ PASS | Thanh toán ngay bằng Séc tiền mặt; kiểm tra Phiếu nhập kho và chứng từ tại `Tiền gửi → Chi tiền`, trạng thái `Chưa ghi sổ`. |
| `CL-UAT-U-00502-244` | ✅ PASS | Thanh toán ngay bằng Séc chuyển khoản; kiểm tra Phiếu nhập kho và chứng từ tại `Tiền gửi → Chi tiền`, trạng thái `Chưa ghi sổ`. |

[⬆️ Lên đầu](#dieu-huong-nhanh)

---

## Tổng hợp nhóm lỗi

**Không phát hiện bug trong lần chạy này.**

- Không có testcase thất bại hoặc bị bỏ qua.
- Không có nhóm lỗi sản phẩm, lỗi automation hoặc trở ngại môi trường cần ghi nhận.
- Teardown của cả 5 testcase hoàn tất mà không phát sinh assertion lỗi: chứng từ mua hàng nguồn và các chứng từ liên quan được kiểm tra qua UI theo cơ chế cleanup của suite.
- Không tạo thư mục evidence lâu dài vì lần chạy không có lỗi cần ảnh bằng chứng.

[⬆️ Lên đầu](#dieu-huong-nhanh)

---

## Thông tin kỹ thuật

### Lệnh đã chạy

```powershell
npx.cmd playwright test src/tests/mua-hang/chung-tu-mua-hang-them-moi.spec.ts --headed --workers=1 --retries=0 --reporter=line
```

### Artifacts

- Trạng thái runner: `test-results/.last-run.json` ghi nhận `passed`, không có test thất bại.
- Evidence lâu dài: không phát sinh do không có bug.
- Artifacts tạm: `test-results/`, `playwright-report/`, `allure-results/`.
- Báo cáo không liên kết tới artifact tạm hoặc file bị `.gitignore` loại bỏ.

> [!NOTE]
> Báo cáo phản ánh nguyên trạng lần chạy với `retries=0`. Kết quả kiểm tra DB không thuộc phạm vi lần chạy này.

[⬆️ Lên đầu](#dieu-huong-nhanh)
