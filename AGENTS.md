# Hướng dẫn làm việc trong workspace Codex

## Tài nguyên QA Automation

- Sử dụng các skill của repository trong `.agents/skills` khi yêu cầu phù hợp với phần `description` của skill hoặc khi người dùng gọi skill bằng cú pháp `$skill-name`.
- Chỉ đọc các file quy tắc liên quan trước khi triển khai hoặc review code automation:
  - `.agents/rules/automation_rules.md` cho quy ước automation và test data dùng chung.
  - `.agents/rules/database_verification_rules.md` cho expected dữ liệu nghiệp vụ, ánh xạ UI → DB, tenant và query verification.
  - `.agents/rules/pmkt_rules.md` cho nghiệp vụ PMKT, chứng từ phát sinh liên phân hệ và teardown dữ liệu kế toán.
  - `.agents/rules/locator_strategy.md` cho chiến lược lựa chọn locator.
  - `.agents/rules/playwright_rules.md` cho công việc sử dụng Playwright.
  - `.agents/rules/playwright_suite_rules.md` cho việc tạo, sửa, review và chạy Playwright suite.
  - `.agents/rules/report_lifecycle_rules.md` cho report HTML tích lũy, đối chiếu bug cũ/mới và vòng đời Open/Re-Open/Fixed/Done.
- Gọi workflow skill bằng ký hiệu `$` và tên kebab-case, ví dụ `$generate-locator` hoặc `$analyze-flaky-tests`.

## Tương thích với tên công cụ cũ

- Diễn giải các tên công cụ cũ còn tồn tại trong hướng dẫn theo đúng mục đích và sử dụng công cụ Codex tương đương đang có trong phiên làm việc.
- Ánh xạ `view_file` thành lệnh đọc filesystem; `write_to_file`/`replace_file_content` thành `apply_patch`; `run_command`/`command_status` thành lệnh shell và cơ chế chờ kết quả tương ứng.
- Ánh xạ `read_url_content` thành công cụ web hoặc browser đang có.
- Ánh xạ các bước `browser_*` mang tính khái niệm sang browser skill đã được cài đặt và các công cụ thực sự gọi được; không tự tạo hoặc gọi tên công cụ không tồn tại.

## Quy tắc làm việc

- Trao đổi và báo cáo kết quả bằng tiếng Việt ngắn gọn, rõ ràng.
- Bảo toàn trạng thái code hiện tại trên máy. Không chạy các lệnh Git làm thay đổi trạng thái như `git pull`, `git checkout`, `git merge`, `git rebase` hoặc `git reset` nếu người dùng chưa yêu cầu rõ ràng. Được phép kiểm tra Git ở chế độ chỉ đọc.
- Ưu tiên locator semantic ổn định và smart wait; không sử dụng fixed sleep nếu người dùng không yêu cầu rõ ràng.
- Test data phải unique, traceable, deterministic khi dùng seed và không chứa thông tin cá nhân thật.
- Khi manual testcase không cung cấp Test Data cụ thể:
  - Với trường text hoặc number: tự sinh dữ liệu unique, traceable, hợp lệ và phù hợp nghiệp vụ kế toán; phải tôn trọng format, giới hạn và validation của trường.
  - Với trường select hoặc combogrid: chọn giá trị hợp lệ đầu tiên từ dữ liệu UI thực tế; không hardcode option chưa được xác minh.
  - Với loại dữ liệu khác, ràng buộc nghiệp vụ chưa rõ hoặc nhiều lựa chọn có thể làm thay đổi ý nghĩa testcase: phải hỏi người dùng trước khi triển khai.
- Kiểm chứng automation được sinh bằng lệnh test, lint hoặc compile hẹp nhất phù hợp với phạm vi thay đổi.

## Quy tắc bắt buộc về nguồn expected dữ liệu

- Bắt buộc đọc và tuân thủ `.agents/rules/database_verification_rules.md` trước mọi công việc có assertion dữ liệu nghiệp vụ hoặc truy vấn DB.
- Tóm tắt không thay thế rule chi tiết: expected nghiệp vụ phải đối chiếu DB đúng tenant; không dùng API response làm expected; SQL chỉ nằm trong repository riêng theo bảng và query verify phải read-only, parameterized.

## Prompt chuẩn kiểm tra dữ liệu DB

- Sau khi tạo mới thành công qua UI, người dùng có thể nhập:
  - `Sau khi thêm mới thành công, check DB bằng mã vừa tạo và đối chiếu toàn bộ dữ liệu đã nhập.`
  - Khi nhận prompt này, automation phải lấy mã unique do chính testcase tạo, truy vấn đúng tenant và đối chiếu dữ liệu DB sau khi UI báo lưu thành công.
- Khi kiểm tra trực tiếp một bản ghi đã tồn tại, người dùng có thể nhập:
  - `Check DB trực tiếp <module>, mã <mã-bản-ghi>, expected: <dữ liệu kỳ vọng>.`
  - Khi nhận prompt này, chỉ chạy kiểm tra DB read-only; không thực hiện luồng UI và không sửa hoặc xóa dữ liệu.
- Tái sử dụng DB fixture/client và repository theo module; không đặt SQL trực tiếp trong Page Object hoặc file spec.
- Dùng parameterized query, không hardcode thông tin kết nối và không ghi credentials vào log/report.
- Assertion nghiệp vụ đặt trong file spec. Truy vấn phải xác định đúng bản ghi bằng mã unique và `tenant_id` khi bảng có phân tách tenant.

## Quy tắc tạo báo cáo kiểm thử và lưu evidence

- Khi người dùng nhập `Chạy và report <spec>` hoặc `Chạy và report <suite>`, bắt buộc thực hiện trọn workflow trong `.agents/rules/report_lifecycle_rules.md` mà không yêu cầu nhắc lại từng bước.
- Tóm tắt điều phối không thay thế rule chi tiết: preflight trước khi chạy; xử lý tuần tự từng testcase và checkpoint JSON/evidence ngay; sau khi chạy hết một spec mới phân tích/deduplicate toàn bộ failure và cập nhật HTML của spec đó một lần; cuối phạm vi thực hiện final consolidation. Suite có nhiều spec phải tạo/cập nhật report riêng cho từng spec, không gộp thành một HTML suite.
