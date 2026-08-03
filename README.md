<a id="top"></a>

# Playwright E2E Framework 🚀

Framework QA Automation cho PMKT, sử dụng **Playwright Test** và **TypeScript**. Repository hỗ trợ kiểm thử UI, đối chiếu PostgreSQL, teardown dữ liệu và sinh báo cáo kèm evidence.

# 📚 Nội dung

- [Cấu trúc thư mục](#cau-truc-thu-muc)
- [Cài đặt](#cai-dat)
- [Cấu hình môi trường](#cau-hinh-moi-truong)
- [Chiến lược locator đa môi trường](#locator-da-moi-truong)
  - [Nguyên tắc kiến trúc](#nguyen-tac-locator-profile)
  - [Hai locator profile](#hai-locator-profile)
  - [Prompt triển khai locator profile](#prompt-trien-khai-locator-profile)
- [Prompt tạo script automation](#prompt-tao-script-automation)
  - [Tạo mới qua UI rồi đối chiếu DB](#tao-moi-ui-doi-chieu-db)
  - [Kiểm tra trực tiếp bản ghi có sẵn](#kiem-tra-truc-tiep-db)
- [Chạy test và tạo báo cáo](#chay-test-va-tao-bao-cao)
  - [Chạy test bằng npm](#chay-test-bang-npm)
  - [Chạy test trực tiếp bằng Playwright CLI](#chay-test-playwright-cli)
  - [Làm sạch dữ liệu kiểm thử](#lam-sach-du-lieu-kiem-thu)
  - [Prompt chạy và report](#prompt-chay-va-report)
  - [Khôi phục report khi suite chạy dở](#khoi-phuc-report-chay-do)
- [Quy ước chính](#quy-uoc-chinh)

<a id="cau-truc-thu-muc"></a>

# 🗂️ Cấu trúc thư mục

```powershell
pmkt_automation_codex/
├── .agents/
│   ├── rules/                      # Quy tắc QA và automation
│   └── skills/                     # Codex skills/workflows
├── .github/                        # Pipeline CI/CD
├── plans/                          # Kế hoạch và kiến trúc automation
├── report/
│   ├── evidence/                   # Evidence cần lưu lâu dài
│   └── templates/                  # Mẫu báo cáo kiểm thử
├── scripts/                        # Công cụ kiểm tra trước khi chạy và dọn dẹp kết quả tạm
├── src/
│   ├── cleanup/                    # Teardown dữ liệu tạo ra khi chạy test
│   ├── database/                   # PostgreSQL client và repositories
│   ├── fixtures/                   # Fixtures UI, authentication và DB
│   ├── helpers/                    # Flow/helper dùng chung
│   ├── pages/                      # Page Objects được nhóm theo phân hệ
│   ├── reporters/                  # Reporter ghi kết quả riêng từng testcase
│   ├── tests/                      # Automation specs được nhóm theo phân hệ
│   └── utils/                      # Env, logger, wait và utilities
├── test-data/                      # Test data và file upload đầu vào
├── testcases/                      # Manual testcases đầu vào
├── .env.example                    # Mẫu cấu hình UI và DB
├── AGENTS.md                       # Hướng dẫn làm việc cho Codex
├── package.json                    # Dependencies và npm scripts
├── playwright.config.ts            # Cấu hình Playwright
└── tsconfig.json                   # Cấu hình TypeScript
```

Các thư mục `.gstack/`, `node_modules/`, `test-results/`, `playwright-report/`, `allure-results/` và `allure-report/` là dữ liệu công cụ hoặc artifacts tạm, không thuộc source cần commit.

⬆️ [Lên đầu](#top)

<a id="cai-dat"></a>

# 🛠️ Cài đặt

Yêu cầu:

- Node.js 20+
- npm 10+

```powershell
# Sau khi clone Repo về, chạy các lệnh sau trong cửa sổ terminal (chỉ cần làm 1 lần)
npm install
npm ci
npx playwright install chromium
Copy-Item .env.example .env
```

Sau khi sao chép, cập nhật `.env` bằng thông tin của môi trường cần kiểm thử (Xem phần Cấu hình môi trường bên dưới).

⬆️ [Lên đầu](#top)

<a id="cau-hinh-moi-truong"></a>

# ⚙️ Cấu hình môi trường

```powershell
# Ứng dụng và tài khoản automation
APP_URL=https://your-pmkt-environment.example
TEST_USERNAME=your-test-username
TEST_PASSWORD=your-test-password
HEADLESS=true
LOCATOR_PROFILE=current

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

<a id="locator-da-moi-truong"></a>

# 🧭 Chiến lược locator đa môi trường

Áp dụng khi các môi trường giữ nguyên thiết kế và luồng nghiệp vụ nhưng được phát triển bởi các đội khác nhau nên cấu trúc DOM hoặc locator có thể khác nhau. Đây là phương án kiến trúc cần triển khai theo từng module, không có nghĩa profile `testid` đã chạy được trước khi dev gắn các thuộc tính tương ứng vào DOM thật.

<a id="nguyen-tac-locator-profile"></a>

## 🧩 Nguyên tắc kiến trúc

- Giữ **một bộ spec, helper/flow và Page Object** dùng chung.
- Page Object chỉ công khai các hành vi nghiệp vụ như `save()`, `chooseSupplier()` hoặc `findDocument()`; testcase không biết locator bên dưới thuộc môi trường nào.
- Tách locator ra thành các profile có cùng interface; không tạo Page Object thứ hai chỉ vì DOM khác nhau.
- Chọn profile bằng cấu hình môi trường, dự kiến qua `LOCATOR_PROFILE`; không hardcode URL hoặc điều kiện môi trường trong spec.
- Khi luồng nghiệp vụ thay đổi thật sự, xử lý như thay đổi chức năng, không che giấu bằng locator profile.

```text
Testcase / Helper
        ↓
Một Page Object và interface nghiệp vụ
        ↓
Locator profile
   ├── current: locator đã xác minh trên UI tham chiếu
   └── testid: locator contract dùng data-testid
```

<a id="hai-locator-profile"></a>

## 🗺️ Hai locator profile

| Profile | Mục đích | Trạng thái xác minh |
|---|---|---|
| `current` | Dùng locator đã inspect trực tiếp trên môi trường tham chiếu hiện tại | Phải chạy test thật và xác minh PASS |
| `testid` | Dùng `getByTestId()` theo contract bàn giao cho dev | Chỉ được xác nhận PASS khi DOM thật đã có `data-testid` |

Contract `data-testid` phải unique, ổn định, không phụ thuộc CSS, vị trí, timestamp hoặc ID dữ liệu. Quy ước tên đề xuất:

```text
<module>-<screen>-<element>-<purpose>
```

Ví dụ: `purchase-document-create-save-button`. Khi nhận môi trường mới, agent inspect DOM thật, đối chiếu contract, cập nhật locator mapping và chạy regression; không viết lại testcase nếu luồng nghiệp vụ không đổi.

<a id="prompt-trien-khai-locator-profile"></a>

## 💬 Prompt triển khai locator profile

Thay các giá trị trong dấu `<...>` rồi gửi nguyên prompt sau:

```text
Triển khai locator đa môi trường cho <module-hoặc-file-spec>.

- Dùng <URL-tham-chiếu> làm UI tham chiếu và inspect DOM thật.
- Giữ nguyên một bộ spec, helper/flow và Page Object với interface nghiệp vụ dùng chung.
- Tách locator mapping thành hai profile: current và testid.
- Chọn locator profile bằng biến LOCATOR_PROFILE.
- Không nhân đôi Page Object chỉ vì locator hoặc cấu trúc DOM khác nhau.
- Sinh data-testid contract và danh sách test ID cần bàn giao cho dev.
- Chạy typecheck, chạy xác minh profile current và tự fix đến khi hết lỗi code.
- Chỉ đánh dấu profile testid PASS khi data-testid đã tồn tại và được xác minh trên DOM thật.
- Nếu DOM chưa có data-testid, ghi rõ trạng thái chờ dev triển khai; không báo PASS hoặc suy đoán locator.
```

Thông tin đăng nhập và cấu hình môi trường tiếp tục lấy từ `.env`; không đưa credentials trực tiếp vào prompt hoặc source code.

⬆️ [Lên đầu](#top)

<a id="prompt-tao-script-automation"></a>

# 🤖 Prompt tạo script automation

<a id="tao-moi-ui-doi-chieu-db"></a>

### 🆕 1. Tạo mới qua UI rồi đối chiếu DB

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

<a id="kiem-tra-truc-tiep-db"></a>

### 🔍 2. Kiểm tra trực tiếp bản ghi có sẵn

```powershell
Check DB trực tiếp <module>, mã <mã-bản-ghi>, expected: <dữ liệu kỳ vọng>.
```

Luồng này chỉ truy vấn read-only, không chạy UI và không sửa hoặc xóa dữ liệu DB.

⬆️ [Lên đầu](#top)

<a id="chay-test-va-tao-bao-cao"></a>

# 🧪 Chạy test và tạo báo cáo

<a id="chay-test-bang-npm"></a>

## 📦 Chạy test bằng npm

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

<a id="chay-test-playwright-cli"></a>

## 🎭 Chạy test trực tiếp bằng Playwright CLI

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

<a id="lam-sach-du-lieu-kiem-thu"></a>

## 🧹 Làm sạch dữ liệu kiểm thử (khi đã lưu report xong)

Sau khi đã tạo report và lưu evidence cần thiết, chạy lệnh sau để xóa nhanh nội dung của `allure-results/`, `playwright-report/` và `test-results/`:

```powershell
npm run clean:test-artifacts
# Nếu chưa lưu report thì đừng dại dột chạy lệnh này!!!
```

Lệnh giữ lại ba thư mục rỗng để lần chạy tiếp theo có thể sử dụng ngay. Không ảnh hưởng đến report và evidence lâu dài trong `report/`.

<a id="prompt-chay-va-report"></a>

## 📊 Prompt chạy và report

```powershell
Chạy và report <đường-dẫn-file-spec>
```

Ví dụ:

```powershell
Chạy và report src/tests/danh-muc/vat-tu-tao-moi.spec.ts
```

Agent sẽ:

- Chạy preflight evidence trước; tự sửa mọi `expect.soft()` thiếu `await` hoặc import sai fixture rồi mới chạy suite.
- Chạy toàn bộ spec và thu thập PASS, FAIL, SKIP, thời lượng cùng artifacts.
- Phân tích lỗi và gom nhóm theo triệu chứng/root cause hợp lý.
- Mở kiểm tra trực quan screenshot trước khi lưu làm evidence.
- Lưu evidence lâu dài trong `report/evidence/<feature-or-run-id>/`.
- Tạo báo cáo từ `report/templates/test-execution-report-template.md`.
- Kiểm tra số liệu, bug mapping, liên kết evidence và `.gitignore` trước khi bàn giao.

Quy tắc evidence tự động:

- `expect.soft()` phải được import từ `@fixtures/base.fixture` và luôn có `await`.
- Khi soft assertion mismatch, fixture tự attach screenshot và JSON lỗi ngay tại thời điểm đó.
- Khi testcase kết thúc, custom reporter ghi ngay kết quả riêng vào:

```text
test-results/run-<timestamp>/case-results/<TC-ID>--<project>--retry-<n>.json
```

- `index.json` trong cùng thư mục được cập nhật sau từng testcase để report cuối có thể tổng hợp kết quả đã hoàn thành.
- Không thêm `--reporter` khi cần cơ chế này vì CLI sẽ thay thế danh sách reporter trong `playwright.config.ts`.
- Có thể kiểm tra thủ công trước khi chạy bằng:

```powershell
npm run preflight:evidence -- <đường-dẫn-file-spec>
```

<a id="khoi-phuc-report-chay-do"></a>

## ♻️ Khôi phục report khi suite chạy dở

Nếu suite bị treo hoặc dừng giữa chừng, các testcase đã hoàn thành vẫn có JSON và evidence riêng trong thư mục run. Dùng prompt:

```powershell
Khôi phục và tạo report từ kết quả chạy dở trong test-results/run-<run-id>.
```

Ví dụ:

```powershell
Khôi phục và tạo report từ kết quả chạy dở trong test-results/run-20260731T104156Z.
```

Agent sẽ tổng hợp các JSON đã hoàn thành, xác định testcase chưa có kết quả hoặc bị treo, kiểm tra evidence và tạo báo cáo với trạng thái **INCOMPLETE/BLOCKED**. Số liệu PASS, FAIL và SKIP chỉ tính trên các testcase đã có kết quả; không cần chạy lại những testcase đã hoàn thành.

Tên báo cáo:

```powershell
report/<feature>-report-YYYY-MM-DD-HHmmss.md
```

Artifacts tạm trong `test-results/`, `playwright-report/` và `allure-results/` không được dùng làm liên kết lâu dài trong báo cáo.

⬆️ [Lên đầu](#top)

<a id="quy-uoc-chinh"></a>

# 📌 Quy ước chính

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
