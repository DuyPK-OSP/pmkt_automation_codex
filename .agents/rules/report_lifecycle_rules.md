# Quy tắc report HTML tích lũy và vòng đời bug PMKT

## Phạm vi áp dụng

- Bắt buộc áp dụng khi người dùng yêu cầu `Chạy và report <spec>` hoặc cập nhật report sau một lần chạy Playwright.
- Chỉ xuất một báo cáo HTML theo `report/templates/report-template.html`; không tạo báo cáo Markdown.
- Mỗi feature chỉ có một file HTML report chuẩn. Không sinh file HTML mới theo timestamp ở các lần chạy sau.
- Số liệu tổng quan phản ánh lần chạy mới nhất; danh sách bug, chỉnh sửa thủ công và audit là dữ liệu tích lũy.

## Quy trình bắt buộc

1. Chạy preflight và suite theo quy tắc workspace; thu kết quả và evidence thật.
2. Phân loại FAIL thành lỗi sản phẩm hoặc lỗi automation/locator/test data/môi trường. Runner status không đủ để tự kết luận bug sản phẩm.
3. Xác định chính xác phạm vi testcase đã chạy, testcase SKIP/BLOCK và testcase không được chọn.
4. Lập danh sách bug sản phẩm của lần chạy, gom nhóm theo triệu chứng/root cause hợp lý và tạo fingerprint ổn định.
5. Đọc file HTML chuẩn hiện có, bao gồm automation bugs, MANUAL BUGS, trạng thái, nội dung tester đã sửa, evidence và audit.
6. Đối chiếu bug mới với bug cũ rồi áp dụng vòng đời bên dưới.
7. Cập nhật cùng file HTML bằng thao tác ghi an toàn; không xóa hoặc ghi đè dữ liệu tester ngoài phần cần cập nhật.
8. Kiểm tra lại số liệu, trạng thái, link, evidence, audit và khả năng mở độc lập trước khi bàn giao.

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

## Cấu trúc bug

- Bug automation mới và MANUAL BUGS dùng cùng cấu trúc bảy trường: Tiêu đề bug, Điều kiện tiên quyết, Các bước tái hiện, Data test, Kết quả mong đợi, Kết quả thực tế, Evidence.
- Form thêm MANUAL BUGS phải giống form sửa bug automation và chỉ gồm đúng bảy trường trên; Mức độ mặc định `Trung bình`, Trạng thái mặc định `Open`.
- Section MANUAL BUGS phải dùng cùng tree, lưới chi tiết, control Mức độ/Trạng thái, nút Sửa và nút Thu gọn/Mở rộng toàn bộ như section Chi tiết Bug automation.
- Khi tester đổi Mức độ tại tree row của bug, cột Mức độ trong bảng Tổng hợp Bugs phải cập nhật ngay và giữ đúng giá trị sau khi lưu/mở lại report.
- Mức độ cho phép: `Rất cao`, `Cao`, `Trung bình`, `Thấp`.
- Trạng thái cho phép: `Open`, `In Progress`, `Fixed`, `Re-Open`, `Done`, `Rejected`.
