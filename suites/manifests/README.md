# Playwright Suite Manifests

Mỗi suite được khai báo bằng một file JSON và tổ chức theo cây chức năng:

```text
suites/manifests/
├── _templates/
├── danh-muc/
│   ├── vat-tu/
│   ├── kho/
│   └── nganh-nghe/
├── mua-hang/
├── ban-hang/
├── tien-mat/
├── tien-gui/
└── release/
```

Không tạo sẵn thư mục rỗng. Khi có suite đầu tiên của chức năng, tạo đúng nhánh bằng tên kebab-case và đặt manifest tại:

```text
suites/manifests/<phan-he>/<chuc-nang>/<suite-name>.json
```

Một chức năng có thể có nhiều suite theo mục đích:

```text
suites/manifests/danh-muc/vat-tu/smoke.json
suites/manifests/danh-muc/vat-tu/regression.json
suites/manifests/danh-muc/vat-tu/critical-path.json
```

Sao chép `_templates/suite.manifest.template.json`, cập nhật nội dung rồi chạy:

```powershell
npm run suite:run -- suites/manifests/<phan-he>/<chuc-nang>/<suite-name>.json --list
npm run suite:run -- suites/manifests/<phan-he>/<chuc-nang>/<suite-name>.json --headed
npm run suite:run -- suites/manifests/<phan-he>/<chuc-nang>/<suite-name>.json
```

## Chạy và report liên tục

```powershell
npm run suite:report -- suites/manifests/<phan-he>/<chuc-nang>/<suite-name>.json
npm run spec:report -- src/tests/<phan-he>/<feature>.spec.ts
```

Hai lệnh dùng chung `scripts/run-and-report.mjs`. Runner preflight toàn bộ phạm vi, chạy mỗi testcase bằng một process Playwright, ghi PASS ngay; với FAIL sẽ thu evidence, gọi Codex Analyzer ở chế độ read-only, deduplicate Product Bug và cập nhật report của đúng spec trước khi chạy testcase kế tiếp. Cấp quyền lâu dài cho hai prefix npm trên để không xuất hiện hộp xác nhận giữa các testcase.

Codex Analyzer dùng `--approve-for-me` trong sandbox read-only để các kiểm tra DevTools MCP cần thiết không tạo hộp xác nhận giữa pipeline. Trước mỗi testcase, runner đọc bug cũ từ report: bug tái hiện chuyển `Re-Open`; bug chỉ chuyển `Fixed` khi toàn bộ affected testcase đã chạy và PASS; `Done` vẫn do tester xác nhận thủ công.

`testCases` rỗng hoặc không khai báo nghĩa là chạy toàn bộ spec. Khi có giá trị, runner chỉ chọn đúng các TC ID trong mảng.

## Prompt chuẩn tạo suite

Dùng cú pháp thống nhất:

```text
Tạo suite <tên-suite>, mục đích <purpose>, gồm <phạm-vi-spec/testcase>.
```

Các giá trị `purpose` được hỗ trợ: `smoke`, `regression`, `critical-path`, `release`, `business-flow`, `defect-verification`, `custom`.

Một suite gồm một spec:

```text
Tạo suite vat-tu-smoke, mục đích smoke, gồm toàn bộ spec them-moi-vat-tu-hang-hoa.spec.ts.
```

Một suite gồm nhiều spec:

```text
Tạo suite vat-tu-regression, mục đích regression, gồm toàn bộ các spec Hàng hóa, Dịch vụ và Nguyên vật liệu.
```

Một suite chọn TC cụ thể từ nhiều spec:

```text
Tạo suite vat-tu-critical, mục đích critical-path, gồm:
- them-moi-vat-tu-hang-hoa.spec.ts: TC_001, TC_002
- them-moi-vat-tu-dich-vu.spec.ts: TC_101
- them-moi-vat-tu-nguyen-vat-lieu.spec.ts: TC_201, TC_202
```

Có thể dùng dạng rút gọn khi mục đích đã rõ từ tên và phạm vi:

```text
Tạo suite <tên-suite>: <danh sách spec hoặc TC>.
```

Khi nhận prompt, agent phải kiểm tra suite hiện có để tránh trùng mục đích/phạm vi; xác minh spec và TC ID; tạo manifest từ template trong đúng cây chức năng; ánh xạ report riêng cho từng spec; validate bằng `suite-manifest.schema.json`; chạy suite với `--list`; rồi chạy typecheck trước khi bàn giao. Nếu không thể xác định chắc chắn `purpose`, phân hệ, chức năng hoặc phạm vi testcase thì phải hỏi lại người dùng.
