# Quy tắc report HTML tích lũy và vòng đời bug PMKT

## Phạm vi áp dụng

- Bắt buộc áp dụng khi người dùng yêu cầu `Chạy và report <spec>`, `Chạy và report <suite>` hoặc cập nhật report sau một lần chạy Playwright.
- Chỉ xuất một báo cáo HTML theo `report/templates/report-template.html`; không tạo báo cáo Markdown.
- Mỗi feature chỉ có một file HTML report chuẩn. Không sinh file HTML mới theo timestamp ở các lần chạy sau.
- Số liệu tổng quan phản ánh lần chạy mới nhất; danh sách bug, chỉnh sửa thủ công và audit là dữ liệu tích lũy.

## Ánh Xạ Spec Và Suite Sang Report

- Mỗi file `.spec.ts` sở hữu đúng một report ổn định: `report/<tên-spec-không-gồm-.spec.ts>-report.html`.
- `Chạy và report <spec>` chỉ cập nhật report của spec được chỉ định.
- `Chạy và report <suite>` dùng suite làm phạm vi điều phối: đọc config/runner để xác định toàn bộ spec được chọn, nhưng mỗi spec vẫn cập nhật file HTML riêng của chính nó.
- Không tạo report HTML chung cho suite và không gộp kết quả, bug hoặc lịch sử tester của nhiều spec vào một file.
- Testcase phải được ánh xạ về spec nguồn theo `test.location.file`; kết quả/evidence/bug chỉ được ghi vào report của spec đó.
- Với suite, xử lý lần lượt theo từng spec và từng testcase trong spec. Chỉ chuyển sang testcase/spec kế tiếp sau khi report tương ứng đã cập nhật thành công.
- Final consolidation của suite kiểm tra từng report con và tổng hợp số liệu toàn suite trong nội dung bàn giao; không sinh thêm HTML tổng hợp trừ khi người dùng yêu cầu riêng.

## Quy trình bắt buộc

- Trong `Chạy và report`, file spec được thực thi là contract để đánh giá Expected/Actual. Quy trình phân tích không audit hoặc tranh luận sự khác nhau giữa manual testcase và spec; không dùng manual testcase để nới lỏng, phủ định hoặc sửa assertion trong spec.
- Không phân loại Automation Bug chỉ vì assertion trong spec bị xem là quá chặt, khác casing hoặc ngoài phạm vi manual testcase. Automation Bug chỉ áp dụng khi lỗi kỹ thuật automation khiến contract trong spec chưa được thực thi hoặc đánh giá đáng tin cậy.

1. Chạy preflight, dùng Playwright liệt kê phạm vi rồi chạy tuần tự từng testcase bằng process riêng và `workers=1`.
2. Sau mỗi testcase, đọc JSON/artifacts vừa ghi. PASS/SKIP được cập nhật ngay; FAIL phải thu và phân tích evidence trước khi tiếp tục.
3. Evidence FAIL gồm error, Expected/Actual, screenshot, trace, URL/DOM, console, network, toast/popup/loading và DB/API evidence khi cần. Dùng DevTools MCP kiểm tra sâu nếu evidence tự động chưa đủ.
4. Phân loại thành Product Bug, Automation Bug, Test Data, Environment hoặc Unknown. Runner status không đủ để kết luận Product Bug.
5. Với Product Bug, đối chiếu Business Rule, Expected, Actual và evidence; mô tả hành vi sai cụ thể.
6. Đọc HTML hiện có, tạo fingerprint theo root cause rồi deduplicate. Bug cùng root cause chỉ bổ sung Affected Testcases/evidence, không tạo Bug ID mới.
7. Cập nhật cùng file HTML bằng thao tác ghi an toàn ngay sau testcase; bảo toàn MANUAL BUGS, nội dung tester, evidence và audit. Chỉ sau khi cập nhật thành công mới chạy testcase tiếp theo.
8. Failure của một testcase không dừng các testcase còn lại, trừ blocker đặc biệt có lý do rõ ràng.
9. Sau toàn bộ phạm vi, hợp nhất số liệu và kiểm tra trạng thái, link, evidence, audit, deduplication cùng khả năng mở độc lập trước khi bàn giao final report.

## Cơ Chế Chạy Và Thu Evidence

- Chạy `npm run preflight:evidence -- <spec...>` trước khi chạy; nếu FAIL phải sửa và chạy lại, không được bỏ qua hoặc chạy vòng.
- Dùng Playwright `--list` xác định đúng phạm vi/thứ tự rồi chạy từng testcase bằng process riêng với `--workers=1`. Không truyền `--reporter` trên CLI.
- Custom reporter ghi JSON ngay sau mỗi testcase vào `test-results/run-<timestamp>/case-results/<TC-ID>--<project>--retry-<n>.json` và cập nhật `index.json`.
- Gói FAIL gồm Playwright error, Expected/Actual, screenshot, trace, URL/DOM, console, network metadata, toast/popup/loading và DB/API evidence khi cần. Không lưu credential, cookie, authorization header hoặc payload nhạy cảm.
- Nếu evidence tự động chưa đủ, dùng DevTools MCP kiểm tra DOM, console, network, request/response và trạng thái ứng dụng trước khi phân loại.
- `expect.soft()` phải import `expect` từ `@fixtures/base.fixture` và có `await`; fixture attach screenshot cùng JSON ngay tại mismatch.
- Phải kiểm tra trực quan từng ảnh. Nếu UI tiếp tục thay đổi sau mismatch, không dùng ảnh cuối testcase nếu không còn triệu chứng; trích đúng frame từ trace/video khi cần.
- Một FAIL không dừng phạm vi còn lại. Chỉ dừng khi preflight chưa thể sửa, app/môi trường không truy cập được, runner/config hỏng hoặc tiếp tục có nguy cơ làm sai/hỏng dữ liệu; phải ghi rõ lý do.

## Contract File HTML

- File chuẩn của từng spec là `report/<tên-spec-không-gồm-.spec.ts>-report.html`; lần chạy sau cập nhật đúng file đó.
- HTML phải độc lập, không phụ thuộc tài nguyên ngoài. Evidence ảnh phải chuyển WebP, nhúng Base64 trực tiếp và chỉ nhúng một lần cho mỗi ảnh.
- Không liên kết tới artifact tạm trong `test-results/`, `playwright-report/` hoặc `allure-results/`; bản ảnh rời cần lưu đặt tại `report/evidence/<feature-or-run-id>/` với tên ổn định.
- Giữ nguyên biểu đồ tổng quan, hiệu ứng/tooltip thanh ngang, bộ lọc từng cột, dropdown Tất cả/PASS/FAIL/SKIP/BLOCK và chế độ phóng to ảnh của template. Không thêm section Thông tin kỹ thuật.
- Giữ cơ chế Tester Review, draft, thêm evidence, Tester Reported Bug và Export Reviewed Report; Automation Result luôn read-only.
- Nội dung chỉ lấy từ kết quả chạy thật và artifacts tương ứng; không tự tạo hoặc suy đoán kết quả, tần suất, test data, Expected/Actual hay evidence thiếu.
- Bảng Tổng hợp Bugs gồm: `Bug ID`, `Mức độ`, `Số case ảnh hưởng`, `Tên case ảnh hưởng`, `Tóm tắt bug`; tên case chỉ ghi TC ID.
- Khi nhiều testcase cùng root cause, dùng testcase đầu tiên làm case đại diện cho Pre-condition, Steps, Test Data và Expected; vẫn lưu đầy đủ Affected Testcases.
- Pre-condition và Steps phải khớp manual testcase. Expected/Actual phải cụ thể; không dùng mô tả chung như `chạy TC`, `Hệ thống bị lỗi`, `Không hoạt động` hoặc `Test case failed`.
- FAIL là Actual không khớp Expected sau khi thực hiện được luồng; BLOCK chỉ dùng khi không thể thực hiện hoặc đánh giá do pre-condition/dependency và phải ghi rõ nguyên nhân. Không tô đỏ hoặc highlight Actual trong report.
- Khi có DB verification, report phải thể hiện `giá trị UI → bảng.cột DB` theo `.agents/rules/database_verification_rules.md`.

## Nhận diện bug cũ

- Ưu tiên Bug ID/fingerprint đã lưu trong report.
- Fingerprint gồm: feature + nhóm testcase ảnh hưởng + đối tượng/vị trí lỗi + triệu chứng đã chuẩn hóa.
- Không đưa timestamp, test data động, UUID, stack trace hoặc đường dẫn artifact tạm vào fingerprint.
- Nếu chưa đủ căn cứ xác định cùng bug, không tự gộp; phải ghi nhận là bug mới hoặc nêu rõ cần người dùng xác nhận.

## Vòng đời trạng thái

- Bug mới chưa có trong HTML: thêm vào Tổng hợp Bugs và Chi tiết Bug, trạng thái `Open`.
- Bug cũ tái xuất hiện: giữ Bug ID, chuyển trạng thái `Re-Open`, cập nhật Actual, testcase ảnh hưởng và evidence mới.
- Bug cũ không xuất hiện trong lần chạy: chỉ chuyển `Fixed` khi toàn bộ testcase ảnh hưởng đã thực sự chạy và không còn tái hiện.
- Không chuyển `Fixed` nếu testcase liên quan SKIP, BLOCK, không thuộc phạm vi chạy, không được chọn, hoặc kết quả không đáng tin do lỗi automation/locator/test data/môi trường.
- `Done` chỉ do tester chuyển thủ công sau khi xác nhận bản sửa.
- `Rejected` do tester quản lý. Playwright không tự đổi bug sang `Done` hoặc `Rejected`.
- MANUAL BUGS không bị Playwright tự động thay đổi trạng thái.

## Bảo toàn và audit

- Giữ nguyên chỉnh sửa trực tiếp của tester, MANUAL BUGS, caption/evidence thủ công và toàn bộ audit cũ.
- Mọi thay đổi tự động phải thêm audit với actor `Playwright Automation`, thời gian, run ID, trường thay đổi, giá trị cũ/mới và lý do.
- Khi bug tái xuất hiện, không dùng dữ liệu automation mới để âm thầm xóa nội dung tester đã sửa. Phần dữ liệu chạy mới phải được cập nhật theo contract hoặc lưu lịch sử để truy vết.
- Ghi file theo cơ chế tạm rồi đổi tên để hạn chế hỏng report nếu quá trình ghi thất bại.
- Khi chuẩn bị commit, bao gồm HTML đã cập nhật và evidence rời nếu dự án vẫn cần lưu chúng.

## Final Consolidation

- Kiểm tra `PASS + FAIL + SKIP = tổng test` và tỷ lệ PASS chính xác.
- Mỗi FAIL phải ánh xạ tới bug chi tiết hoặc có giải thích rõ vì sao không phải Product Bug.
- Mỗi bug có đủ bảy phần, link quay lại đầu trang hoạt động và evidence hiển thị đúng.
- HTML không liên kết evidence ngoài file; mọi ảnh cần thiết đã được nhúng WebP Base64.
- Trả đường dẫn HTML cuối cùng cùng tóm tắt PASS/FAIL/SKIP/BLOCK, phân loại failure và blocker nếu có.
- Với suite, thực hiện các kiểm tra trên cho từng spec/report trước, sau đó đối chiếu tổng các report con với tổng testcase của suite và trả danh sách đường dẫn toàn bộ HTML đã cập nhật.

## Cấu trúc bug

- Bug automation mới và MANUAL BUGS dùng cùng cấu trúc bảy trường: Tiêu đề bug, Điều kiện tiên quyết, Các bước tái hiện, Data test, Kết quả mong đợi, Kết quả thực tế, Evidence.
- Form thêm MANUAL BUGS phải giống form sửa bug automation và chỉ gồm đúng bảy trường trên; Mức độ mặc định `Trung bình`, Trạng thái mặc định `Open`.
- Section MANUAL BUGS phải dùng cùng tree, lưới chi tiết, control Mức độ/Trạng thái, nút Sửa và nút Thu gọn/Mở rộng toàn bộ như section Chi tiết Bug automation.
- Khi tester đổi Mức độ tại tree row của bug, cột Mức độ trong bảng Tổng hợp Bugs phải cập nhật ngay và giữ đúng giá trị sau khi lưu/mở lại report.
- Mức độ cho phép: `Rất cao`, `Cao`, `Trung bình`, `Thấp`.
- Trạng thái cho phép: `Open`, `In Progress`, `Fixed`, `Re-Open`, `Done`, `Rejected`.
