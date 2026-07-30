# Playwright E2E Framework 🚀

Framework Web UI E2E dùng Playwright Test và TypeScript

## 📂 Cấu Trúc Thư Mục Chính

```text
codex-testing-kit/
├── .agents/
│   ├── rules/                       # Quy tắc QA và automation dùng chung
│   └── skills/                      # Các Codex skills/workflows của repository
├── .github/
│   └── workflows/
│       └── playwright.yml           # Pipeline chạy Playwright trên GitHub Actions
├── plans/
│   └── automation/                  # Quy trình Automation Testing 6 bước
│       ├── 01_context_and_roleplay/
│       ├── 02_analysis_and_ui_recon/
│       ├── 03_pom_design/
│       ├── 04_test_data_strategy/
│       ├── 05_script_generation/
│       ├── 06_review_and_refactor/
│       └── project_architecture/
├── src/
│   ├── fixtures/                    # Fixtures dùng chung và authentication
│   ├── pages/                       # Base Page và Page Objects
│   │   ├── chung-tu-mua-hang.page.ts
│   │   └── vat-tu.page.ts
│   ├── tests/
│   │   ├── auth/                    # Login happy path và validation tests
│   │   ├── danh-muc/
│   │   │   └── vat-tu-tao-moi.spec.ts
│   │   └── mua-hang/
│   │       └── chung-tu-mua-hang.spec.ts
│   └── utils/                       # Env, logger, waits, screenshot và test data
├── test-data/
│   ├── users.data.ts                # Dữ liệu cho data-driven tests
│   └── vat-tu.data.ts               # Expected data của module Vật tư
├── report/                           # Báo cáo kết quả thực thi theo từng file spec
├── .env.example                     # Mẫu biến môi trường, không chứa secret thật
├── .gitignore
├── AGENTS.md                        # Chỉ dẫn cấp repository cho Codex
├── LICENSE
├── package.json                     # Dependencies và npm scripts
├── package-lock.json                # Dependency lock file
├── playwright.config.ts             # Cấu hình Playwright, browser và reporters
├── task.md                          # Checklist scaffold và kết quả xác minh
├── tsconfig.json                    # TypeScript strict-mode configuration
└── README.md
```

Các thư mục `node_modules/`, `playwright-report/`, `allure-results/` và `test-results/` được sinh khi cài đặt hoặc chạy test nên không liệt kê trong cấu trúc source và không commit lên Git.

Locator nằm trong Page Object; test chỉ chứa hành vi và assertion; ưu tiên locator semantic; không dùng fixed sleep. CI cần repository variable `APP_URL` và secrets `TEST_USERNAME`, `TEST_PASSWORD`.

Quy ước test data: tất cả file trong `test-data/` sử dụng TypeScript với tên `*.data.ts`; export dữ liệu có kiểu rõ ràng và import qua alias `@test-data/*`.

Quy ước báo cáo: mỗi file `*.spec.ts` có báo cáo riêng trong `report/`, đặt tên `<spec-name>-report-YYYY-MM-DD.md`. Nếu chạy nhiều lần trong cùng ngày, thêm thời gian `HHmmss` để không ghi đè lịch sử.

## Cài đặt

Yêu cầu Node.js 20+ và npm 10+. Java runtime chỉ cần khi sinh hoặc mở Allure report.

```powershell
npm install
npx playwright install chromium
Copy-Item .env
```

Điền `TEST_USERNAME` và `TEST_PASSWORD` trong `.env`. File `.env` đã bị ignore và không được commit thông tin đăng nhập thật.

## Chạy test và report

```powershell
npm run typecheck
npm run test:list
npm run test:login:headed
npm run test:purchase-list:headed
npm run test:vat-tu-tao-moi:headed
npm test
```

- HTML report: `npm run report:html`
- Allure tùy chọn: `npm run report:allure:generate`, sau đó `npm run report:allure:open`
- Environment khác: đặt `ENV_FILE=.env.staging`; danh sách biến nằm trong `.env.example`
