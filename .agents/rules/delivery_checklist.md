# Checklist bàn giao Automation

Sử dụng checklist này trước khi xác nhận công việc automation đã hoàn thành.

## Dọn dẹp code

- Xóa các lệnh `print()`, `console.log()` tạm thời và log dùng để debug.
- Xóa locator, import, biến không sử dụng và code đã bị comment.
- Không để lại các lệnh chờ cố định như `waitForTimeout` hoặc `Thread.sleep`.
- Đảm bảo các mã định danh duy nhất và dữ liệu test được sinh động, có thể truy vết.
- Xác nhận bản ghi `AUTO_` được tạo thành công đã được teardown xóa và có attachment `test-data-cleanup` ghi rõ kết quả.

## Cấu trúc và chất lượng

- Phân tách page object, test, tiện ích và dữ liệu test theo đúng kiến trúc của dự án.
- Flow nghiệp vụ qua nhiều màn hình được đặt trong `src/helpers`; flow/helper không chứa assertion nghiệp vụ và trả kết quả thực tế về spec.
- Khai báo locator trong page object hoặc screen object, không khai báo trực tiếp trong test.
- Mỗi assertion phải có thông báo lỗi rõ ràng và mỗi test phải chạy độc lập.
- Mỗi manual testcase độc lập có một test block riêng, hiển thị rõ ID testcase và có thể chạy riêng.
- Xác minh locator trên giao diện thực tế, không suy đoán từ tên hoặc code cũ.
- File upload phục vụ automation được lưu trong `test-data`, không nằm trong thư mục artifact tạm thời.

## Xác minh

- Sau khi triển khai, chạy phạm vi test nhỏ nhất có liên quan.
- Với UI automation, xác nhận độ ổn định bằng ít nhất hai lần chạy thành công liên tiếp khi môi trường cho phép.
- Chỉ chụp ảnh màn hình khi test thất bại hoặc tại các mốc quan trọng, không chụp liên tục.
- Với `expect.soft()` hoặc testcase còn thay đổi UI sau điểm lỗi, phải chụp và attach evidence ngay tại thời điểm Actual khác Expected; không mặc định dùng screenshot cuối testcase làm bằng chứng chính.
- Trước khi đưa ảnh vào báo cáo, phải mở kiểm tra trực quan để xác nhận ảnh hiển thị đúng trường, giá trị và triệu chứng của bug. Nếu thiếu milestone evidence, trích đúng frame từ Playwright trace/video.
- Ghi nhận các testcase bị bỏ qua, vấn đề đã biết, trở ngại từ môi trường hoặc giới hạn hiện có.

## Bàn giao

- Xóa các file tạm và lưu output vào đúng thư mục quy định của dự án.
- Đảm bảo file cấu hình và file môi trường không chứa thông tin đăng nhập thực tế.
- Tổng hợp kết quả pass, fail, skip và liệt kê các testcase đã triển khai.
- Với `Chạy và report`, xác nhận mỗi testcase đã được xử lý và cập nhật HTML trước khi case kế tiếp chạy; mỗi FAIL đã được phân loại, Product Bug đã deduplicate theo root cause và final consolidation khớp toàn bộ kết quả.
- Với suite nhiều spec, xác nhận mỗi spec có report riêng, không có bug/kết quả bị ghi nhầm report và tổng các report con khớp tổng kết quả suite.
