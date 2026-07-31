<a id="top"></a>

# Playwright E2E Framework 🚀

Framework QA Automation cho PMKT, sử dụng **Playwright Test** và **TypeScript**. Repository hỗ trợ kiểm thử UI, đối chiếu PostgreSQL, teardown dữ liệu và sinh báo cáo kèm evidence.

# Nội dung

- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Cài đặt](#cài-đặt)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
- [Prompt gen script automation](#prompt-gen-script-automation)
- [Chạy test và tạo báo cáo](#chạy-test-và-tạo-báo-cáo)
- [Quy ước chính](#quy-ước-chính)

# Cấu trúc thư mục

```powershell
codex-testing-kit/
├── .agents/
│   ├── rules/                      # Quy tắc QA và automation
│   └── skills/                     # Codex skills/workflows
├── .github/                        # Pipeline CI/CD
├── plans/                          # Kế hoạch và kiến trúc automation
├── src/
│   ├── cleanup/                    # Teardown dữ liệu test
│   ├── database/                   # PostgreSQL client và repositories
│   ├── fixtures/                   # Fixtures UI, authentication và DB
│   ├── helpers/                    # Flow/helper dùng chung
│   ├── pages/                      # Page Objects
│   ├── tests/                      # Automation specs theo module
│   └── utils/                      # Env, logger, wait và utilities
├── test-data/                      # Test data và file upload đầu vào
├── testcases/                      # Manual testcases đầu vào
├── report/
│   ├── evidence/                   # Evidence cần lưu lâu dài
│   └── templates/                  # Mẫu báo cáo kiểm thử
├── .env.example                    # Mẫu cấu hình UI và DB
├── AGENTS.md                       # Hướng dẫn làm việc cho Codex
├── package.json                    # Dependencies và npm scripts
├── playwright.config.ts            # Cấu hình Playwright
├── task.md                         # Tiến độ workflow và auto-heal
└── tsconfig.json                   # Cấu hình TypeScript
```

Các thư mục `node_modules/`, `test-results/`, `playwright-report/` và `allure-results/` là artifacts tạm, không thuộc source cần commit.

⬆️ [Lên đầu](#top)

# Cài đặt

Yêu cầu:

- Node.js 20+
- npm 10+

```powershell
# Chạy các lệnh sau trong cửa sổ terminal
npm install
npm ci
npx playwright install chromium
Copy-Item .env.example .env
```

Sau khi sao chép, cập nhật `.env` bằng thông tin của môi trường cần kiểm thử.

⬆️ [Lên đầu](#top)

# Cấu hình môi trường

```powershell
# Ứng dụng và tài khoản automation
APP_URL=https://your-pmkt-environment.example
TEST_USERNAME=your-test-username
TEST_PASSWORD=your-test-password
HEADLESS=true

# Timeout, đơn vị mili giây
TEST_TIMEOUT_MS=60000
EXPECT_TIMEOUT_MS=10000
ACTION_TIMEOUT_MS=15000
NAVIGATION_TIMEOUT_MS=30000

# PostgreSQL
DB_HOST=your-postgresql-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-username
DB_PASSWORD=your-database-password
```

| Nhóm biến | Mục đích |
|---|---|
| `APP_URL`, `TEST_USERNAME`, `TEST_PASSWORD` | URL và tài khoản chạy automation UI |
| `HEADLESS` | `false` khi phát triển/debug; `true` khi chạy headless hoặc CI |
| `*_TIMEOUT_MS` | Timeout testcase, assertion, action và navigation |
| `DB_*` | Kết nối PostgreSQL cho testcase kiểm tra DB |

> [!IMPORTANT]
> Chỉ commit `.env.example` với placeholder. Không commit `.env`, không hardcode credentials và không ghi password/connection string vào log hoặc báo cáo.

Để dùng file cấu hình khác, ví dụ `.env.staging`:

```powershell
$env:ENV_FILE='.env.staging'
npm test
```

⬆️ [Lên đầu](#top)

# Prompt gen script automation

### 1. Tạo mới qua UI rồi đối chiếu DB

Thay `<đường-dẫn-file-tcs>` bằng file manual testcase:

```powershell
$generate-automation-from-testcases
manual testcase: <đường-dẫn-file-tcs>

Agent tự chạy hết 6 bước, tự fix đến khi hết lỗi code.
Sau khi thêm mới thành công, check DB bằng mã vừa tạo và đối chiếu toàn bộ dữ liệu đã nhập. # Nếu không cần check DB thì bỏ qua dòng này
```

Agent sẽ tự động:

1. Sinh mã `AUTO_` unique và traceable.
2. Thực hiện đúng luồng UI của manual testcase.
3. Chỉ truy vấn DB sau khi UI xác nhận lưu thành công.
4. Tìm bản ghi bằng mã vừa tạo và đúng `tenant_id`.
5. Đối chiếu dữ liệu UI với các cột DB tương ứng.
6. Cleanup đúng bản ghi testcase đã tạo sau khi hoàn tất assertion/evidence.
7. Typecheck và chạy xác minh ổn định hai lần.

SQL được đặt trong repository của module; assertion nghiệp vụ được đặt trong file spec. Nếu chưa xác định được bảng, agent sẽ đọc metadata trước khi triển khai.

### 2. Kiểm tra trực tiếp bản ghi có sẵn

```powershell
Check DB trực tiếp <module>, mã <mã-bản-ghi>, expected: <dữ liệu kỳ vọng>.
```

Luồng này chỉ truy vấn read-only, không chạy UI và không sửa hoặc xóa dữ liệu DB.

⬆️ [Lên đầu](#top)

# Chạy test và tạo báo cáo

## Chạy test bằng npm

```powershell
# Kiểm tra lỗi TypeScript mà không sinh file build
npm run typecheck

# Liệt kê toàn bộ testcase Playwright được phát hiện
npm run test:list

# Chạy danh sách Chứng từ mua hàng với browser hiển thị
npm run test:purchase-list:headed

# Chạy bộ testcase Thêm mới Vật tư với browser hiển thị
npm run test:vat-tu-tao-moi:headed

# Chạy toàn bộ test suite theo cấu hình mặc định
npm test
```

## Chạy test trực tiếp bằng Playwright CLI

```powershell
# Liệt kê toàn bộ testcase
npx playwright test --list

# Chạy toàn bộ suite
npx playwright test

# Chạy một file spec
npx playwright test src/tests/danh-muc/vat-tu-tao-moi.spec.ts

# Chạy một file spec với browser hiển thị
npx playwright test src/tests/danh-muc/vat-tu-tao-moi.spec.ts --headed

# Chạy testcase theo ID hoặc tên
npx playwright test src/tests/danh-muc/vat-tu-tao-moi.spec.ts --grep "CL-UAT-U-00106-32"

# Chạy tuần tự bằng một worker và không retry
npx playwright test <đường-dẫn-file-spec> --workers=1 --retries=0

# Xác minh độ ổn định hai lần liên tiếp
npx playwright test <đường-dẫn-file-spec> --repeat-each=2 --retries=0

# Mở HTML report sau khi chạy
npx playwright show-report playwright-report
```

Khi phát triển hoặc debug locator, ưu tiên `--headed` với viewport `1920x1080`. Chỉ dùng headless sau khi testcase đã PASS ổn định hoặc khi chạy CI.

## Prompt chạy và report

```powershell
Chạy và report <đường-dẫn-file-spec>
```

Ví dụ:

```powershell
Chạy và report src/tests/danh-muc/vat-tu-tao-moi.spec.ts
```

Agent sẽ:

- Chạy toàn bộ spec và thu thập PASS, FAIL, SKIP, thời lượng cùng artifacts.
- Phân tích lỗi và gom nhóm theo triệu chứng/root cause hợp lý.
- Mở kiểm tra trực quan screenshot trước khi lưu làm evidence.
- Lưu evidence lâu dài trong `report/evidence/<feature-or-run-id>/`.
- Tạo báo cáo từ `report/templates/test-execution-report-template.md`.
- Kiểm tra số liệu, bug mapping, liên kết evidence và `.gitignore` trước khi bàn giao.

Tên báo cáo:

```powershell
report/<feature>-report-YYYY-MM-DD-HHmmss.md
```

Artifacts tạm trong `test-results/`, `playwright-report/` và `allure-results/` không được dùng làm liên kết lâu dài trong báo cáo.

⬆️ [Lên đầu](#top)

# Quy ước chính

| Nội dung | Quy ước |
|---|---|
| Kiến trúc | Page Object Model; flow/helper tách khỏi spec |
| Locator | Ưu tiên semantic locator; không đoán locator từ tài liệu |
| Wait | Dùng auto-wait/web-first assertion; không dùng fixed sleep |
| Test data | Unique, traceable, deterministic khi dùng seed; không chứa PII thật |
| DB | Parameterized query, đúng tenant; không đặt SQL trong Page Object/spec |
| Assertion | Đặt trong file spec và truy vết được về Expected Result |
| Cleanup | Chỉ xóa đúng dữ liệu `AUTO_` do testcase hiện tại tạo |
| Báo cáo | Dùng template chuẩn và evidence có đường dẫn tương đối hợp lệ |

Chi tiết quy tắc làm việc nằm trong [AGENTS.md](./AGENTS.md) và `.agents/rules/`.

⬆️ [Lên đầu](#top)
