# Hướng dẫn làm việc trong workspace Codex

## Tài nguyên QA Automation

- Sử dụng các skill của repository trong `.agents/skills` khi yêu cầu phù hợp với phần `description` của skill hoặc khi người dùng gọi skill bằng cú pháp `$skill-name`.
- Chỉ đọc các file quy tắc liên quan trước khi triển khai hoặc review code automation:
  - `.agents/rules/automation_rules.md` cho quy ước automation và test data dùng chung.
  - `.agents/rules/pmkt_rules.md` cho nghiệp vụ PMKT, chứng từ phát sinh liên phân hệ và teardown dữ liệu kế toán.
  - `.agents/rules/locator_strategy.md` cho chiến lược lựa chọn locator.
  - `.agents/rules/playwright_rules.md` cho công việc sử dụng Playwright.
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

## Quy tắc tạo báo cáo kiểm thử và lưu evidence

- Khi người dùng nhập `Chạy và report <đường-dẫn-file-spec>`, BẮT BUỘC tự động thực hiện trọn quy trình sau mà không yêu cầu người dùng nhắc lại từng bước:
  1. Chạy toàn bộ file spec được chỉ định bằng test runner và cấu hình phù hợp của repository.
  2. Thu thập kết quả thực tế gồm PASS, FAIL, SKIP, thời lượng và artifacts.
  3. Phân tích lỗi, gom nhóm các test có cùng triệu chứng hoặc cùng root cause hợp lý; phải ghi rõ nếu nhận định root cause chỉ là suy luận.
  4. Sao chép các screenshot cần lưu lâu dài vào `report/evidence/<feature-or-run-id>/` và đặt tên theo bug/testcase.
  5. Tạo file báo cáo mới theo `report/templates/test-execution-report-template.md`.
  6. Kiểm tra số liệu, nội dung bug, link điều hướng, link evidence và trạng thái `.gitignore` trước khi bàn giao.
  7. Trả lại đường dẫn file báo cáo hoàn chỉnh và tóm tắt kết quả chạy.
- BẮT BUỘC sử dụng `report/templates/test-execution-report-template.md` làm mẫu nền mỗi khi tạo báo cáo kết quả chạy test. Phải giữ thứ tự các section, dashboard kết quả, điều hướng, các trường chi tiết bug, chú thích evidence và link quay lại đầu trang.
- Nội dung báo cáo phải được tổng hợp từ kết quả chạy thật và artifacts tương ứng. KHÔNG tự tạo hoặc suy đoán kết quả, tần suất, test data, Expected/Actual hay evidence còn thiếu.
- Đặt tên báo cáo có ý nghĩa và kèm timestamp của lần chạy, ví dụ `report/<feature>-report-YYYY-MM-DD-HHmmss.md`.
- Xem `test-results/`, `playwright-report/` và `allure-results/` là artifacts tạm thời. Báo cáo cần đưa lên Git KHÔNG ĐƯỢC liên kết tới file nằm trong các thư mục này.
- Với mỗi báo cáo cần lưu screenshot lâu dài, chỉ sao chép các evidence liên quan vào `report/evidence/<feature-or-run-id>/` và sử dụng tên file ổn định, có ý nghĩa.
- Ưu tiên screenshot được attach ngay tại thời điểm mismatch. Với `expect.soft()` hoặc testcase tiếp tục thay đổi UI sau điểm lỗi, không dùng screenshot cuối testcase nếu nó không còn hiển thị triệu chứng; khi chưa có milestone evidence, phải trích đúng frame từ trace/video.
- Bắt buộc mở kiểm tra trực quan từng ảnh trước khi đưa vào báo cáo, xác nhận ảnh thể hiện đúng trường, giá trị Actual và nội dung bug.
- Liên kết evidence trong báo cáo Markdown bằng đường dẫn tương đối dưới `./evidence/...`; phải kiểm tra mọi file được liên kết đều tồn tại trước khi bàn giao.
- Khi chuẩn bị thay đổi để commit, phải bao gồm cả file báo cáo Markdown và thư mục `report/evidence/` tương ứng.
- Trước khi bàn giao báo cáo, BẮT BUỘC kiểm tra:
  - Tổng `PASS + FAIL + SKIP` bằng tổng số test.
  - Tỷ lệ PASS được tính đúng.
  - Mỗi test FAIL được ánh xạ tới một bug chi tiết hoặc có giải thích rõ nếu không phải lỗi sản phẩm.
  - Mỗi bug có đủ bảy phần bắt buộc trong template.
  - Có link quay lại đầu trang sau từng phần chi tiết chính.
  - Tất cả đường dẫn evidence hợp lệ và không bị `.gitignore` loại bỏ.
- Bảo toàn các chỉnh sửa thủ công trong báo cáo hiện có. Chỉ cập nhật đúng phần người dùng yêu cầu, trừ khi người dùng yêu cầu viết lại toàn bộ file.
