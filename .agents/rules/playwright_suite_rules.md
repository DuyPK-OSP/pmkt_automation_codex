# Quy Chuẩn Tạo Và Quản Lý Playwright Suite

> Áp dụng khi tạo, sửa, review hoặc chạy suite gồm một hay nhiều file `.spec.ts`.

## 1. Vai Trò Của Suite

- Suite chỉ xác định phạm vi và thứ tự điều phối các spec; không chứa testcase, assertion, locator, business flow hoặc test data.
- Mỗi manual testcase vẫn thuộc đúng một test block trong một spec. Không chuyển testcase vào config/runner để tạo suite.
- Mỗi spec sở hữu report HTML riêng theo `.agents/rules/report_lifecycle_rules.md`; suite không sở hữu report HTML chung.
- Chỉ tạo suite khi cần chạy lặp lại một nhóm spec có cùng mục tiêu nghiệp vụ, release scope, smoke/regression scope hoặc lifecycle setup/teardown chung.
- Không tạo suite mới nếu một suite hiện có đã bao phủ chính xác cùng phạm vi và mục đích.

## 2. Mô Hình Suite Được Hỗ Trợ

| Mô hình | Cách chọn | Yêu cầu |
|---|---|---|
| Một suite gồm một spec | `specs` chứa một phần tử | `testCases` rỗng/không có để chạy toàn spec |
| Một suite gồm nhiều spec | `specs` chứa nhiều phần tử | Thứ tự mảng là thứ tự điều phối |
| Một suite chọn TC cụ thể từ nhiều spec | Mỗi spec khai báo mảng `testCases` | TC ID phải unique và thuộc đúng spec |
| Nhiều suite theo mục đích khác nhau | Mỗi suite có manifest JSON riêng | Được phép chồng lấn spec/TC nếu mục tiêu khác nhau và được mô tả rõ |

- Ví dụ mục đích suite hợp lệ: smoke, regression, release, business flow, critical path, module hoặc defect verification.
- Runner dùng thứ tự phần tử trong `specs` để điều phối tuần tự.
- Một spec hoặc testcase có thể thuộc nhiều suite. Việc chạy suite nào không làm thay đổi ownership report: report vẫn thuộc spec.

## 3. Cấu Trúc Và Đặt Tên

```text
suites/
├── manifests/
│   ├── _templates/
│   └── <phan-he>/<chuc-nang>/<suite-name>.json
├── schemas/suite-manifest.schema.json
└── ...                              # lifecycle đặc biệt đã tồn tại nếu có
```

- `<phan-he>`, `<chuc-nang>` và `<suite-name>` dùng kebab-case; không dùng timestamp, tên người hoặc tên môi trường.
- Manifest bắt buộc nằm trong cây chức năng, ví dụ `suites/manifests/danh-muc/vat-tu/smoke.json`.
- Một chức năng có thể chứa nhiều manifest như `smoke.json`, `regression.json`, `critical-path.json` và `release.json`.
- Dùng `suites/manifests/_templates/suite.manifest.template.json` và schema tại `suites/schemas/suite-manifest.schema.json`.
- Schema là nguồn quy chuẩn duy nhất cho cấu trúc manifest; runner phải validate bằng chính schema này trước khi kiểm tra file spec và TC ID thực tế.
- Không đặt source test, Page Object, helper hoặc test data trong cây manifest.

## 4. Contract JSON Manifest

- `name` là kebab-case; `description`, `purpose` và `specs` mô tả rõ mục đích/phạm vi.
- `specs[].path` phải là đường dẫn tường minh dưới `src/tests/` và kết thúc `.spec.ts`; không dùng glob hoặc regex.
- `specs[].testCases` rỗng/không có nghĩa là chạy toàn spec; nếu có thì chỉ chứa TC ID unique, không chứa regex hoặc title tự nhiên.
- `specs[].report` ánh xạ report riêng của spec theo `report/<tên-spec>-report.html`.
- `execution.workers` luôn là `1`; `retries` mặc định `0`; `headed` chỉ là mặc định chạy và có thể được CLI ghi đè.
- Không hardcode URL, tenant, credential hoặc connection string trong manifest.
- Runner dùng reporter từ `playwright.config.ts`, ghi artifact ở root và không tạo report HTML chung cho suite.

## 5. Tổ Chức Theo Chức Năng

- Cây thư mục phải phản ánh phân hệ → chức năng → mục đích chạy; không gom mọi manifest vào một thư mục phẳng.
- Không tạo thư mục rỗng để dự phòng. Tạo nhánh chức năng khi xuất hiện suite đầu tiên.
- Có thể thêm README ở cấp chức năng khi cần mô tả shared lifecycle, nhưng JSON manifest vẫn là nguồn phạm vi thực thi duy nhất.
- Khi thêm/xóa/đổi tên spec hoặc TC ID, cập nhật mọi manifest liên quan trong cùng thay đổi.

## 6. Tạo Suite

1. Kiểm tra suite hiện có để tránh trùng mục đích/phạm vi.
2. Xác định danh sách spec và thứ tự nghiệp vụ từ yêu cầu; không đoán hoặc tự mở rộng scope.
3. Sao chép JSON template vào đúng cây chức năng, đổi tên và khai báo `specs`/`testCases`.
4. Không tạo config/runner riêng; dùng `npm run suite:run -- <manifest>`.
5. Chỉ thêm npm alias riêng khi suite được chạy thường xuyên trong CI hoặc bởi team; alias vẫn phải gọi runner chung với manifest.
6. Chạy quality gate trước khi bàn giao.

## 7. Chạy Và Report Suite

- `Chạy và report <suite>` phải preflight toàn bộ spec đã chọn, sau đó xử lý theo thứ tự spec → testcase.
- Mỗi testcase chạy bằng process Playwright riêng với `--workers=1`; cập nhật report của đúng spec trước khi chạy case tiếp theo.
- FAIL không dừng suite nếu không có blocker đặc biệt theo `report_lifecycle_rules.md`.
- Không tạo HTML suite. Final consolidation trả danh sách report con và tổng số liệu toàn suite trong phần bàn giao.
- Runner chạy thuần là `scripts/run-playwright-suite.mjs`. Luồng `Chạy và report` bắt buộc dùng runner chuẩn `scripts/run-and-report.mjs` qua `npm run suite:report -- <manifest>`; không nhân bản runner theo từng suite.

## 8. Quality Gate

Trước khi bàn giao suite:

1. Chạy `npm run typecheck`.
2. Chạy `npm run suite:run -- <manifest> --list` và xác nhận không thiếu/thừa spec hoặc testcase.
3. Validate JSON theo schema và kiểm tra mapping spec → TC ID → report.
4. Đối chiếu danh sách TC thực tế từ `--list` với manifest; không chấp nhận TC thiếu, thừa hoặc trùng ID.
5. Chạy preflight cho toàn bộ spec.
6. Chạy phạm vi hẹp nhất phù hợp; khi có môi trường, xác minh headed trước rồi mới dùng headless/CI.
7. Xác nhận artifact được ghi ở root, reporter JSON hoạt động và không có report suite chung.
8. Xác nhận setup/teardown không xóa dữ liệu ngoài các khóa suite/testcase đã đăng ký.

## 9. Nghiêm Cấm

- Manifest chọn spec bằng wildcard/regex hoặc đường dẫn ngoài `src/tests`.
- Dùng project name như tên spec để giả lập thứ tự chạy.
- Khai báo regex/title tự nhiên thay cho TC ID trong `testCases`.
- Đặt assertion, locator, test data hoặc business flow trong manifest/runner.
- Gộp kết quả nhiều spec vào một report HTML.
- Dùng retry để che flaky test hoặc dùng parallel khi chưa bảo đảm isolation.
- Tạo config hoặc runner riêng cho từng suite khi JSON manifest và runner chuẩn đã đáp ứng.
