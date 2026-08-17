# Quy Tắc Đối Chiếu Dữ Liệu Nghiệp Vụ Với Database

> Áp dụng cho mọi assertion dữ liệu nghiệp vụ và thao tác kiểm tra DB trong automation.

## 1. Nguồn Expected

- Mọi expected liên quan đến dữ liệu nghiệp vụ phải lấy từ hoặc đối chiếu trực tiếp với database đúng tenant. Phạm vi gồm dữ liệu form, danh mục, dropdown, combogrid, giá trị mặc định, trạng thái, quan hệ, điều kiện lọc và dữ liệu sau tạo/sửa/xóa.
- Không dùng API response làm nguồn expected. API chỉ phục vụ đồng bộ hoặc chờ thao tác kỹ thuật hoàn tất; payload API không quyết định PASS/FAIL dữ liệu.
- Expected của từng trường là giá trị thực tế đọc trên UI ngay trước khi Lưu; Actual là giá trị đọc từ đúng cột DB sau khi lưu. Không suy diễn từ trường liên quan, API, payload hoặc code ứng dụng.
- Với thao tác ghi dữ liệu qua UI, truy vấn bằng khóa unique do testcase tạo và kiểm tra toàn bộ trường, trạng thái, quan hệ hoặc ảnh hưởng mà manual testcase yêu cầu.
- Testcase thêm mới phải kiểm tra mọi trường UI có ánh xạ lưu trữ, gồm trường tự điền, read-only, checkbox, trạng thái, bảng con, ID, tenant, cờ xóa và thứ tự dòng khi có.
- Với case chỉ nhập trường bắt buộc, đọc và lưu giá trị mặc định thực tế trên UI trước khi Lưu rồi đối chiếu từng giá trị với DB.

## 2. Chuẩn Hóa Và Ánh Xạ

- Giữ nguyên khác biệt nghiệp vụ giữa `NULL`, chuỗi rỗng, `0` và `false`; không chuyển kiểu hoặc dùng fallback làm mất khác biệt này.
- Chỉ chuẩn hóa cách biểu diễn tương đương, như UI `5` với DB `5.0000`, dấu phân cách trong nhãn mã–tên hoặc enum DB ánh xạ đúng nhãn UI.
- Placeholder như `Chọn`, `Chọn...`, `Chọn kho mặc định` không phải giá trị đã chọn và phải ánh xạ về `NULL`/rỗng theo contract.
- Mỗi assertion phải chỉ rõ `Thông tin UI → bảng.cột DB`. Nếu chưa xác định được cột hoặc contract lưu trữ, phải làm rõ; không bỏ qua âm thầm.
- Dùng polling có timeout để chờ transaction hoàn tất; không dùng fixed sleep. Mismatch UI mềm không được ngăn verify DB khi testcase cần thu cả hai kết quả.
- Chỉ kết luận verify DB đầy đủ khi lần chạy thực tế đã đi qua toàn bộ DB assertions của chính testcase.

## 3. Kiến Trúc Và An Toàn Query

- Mỗi bảng DB có một repository riêng; không gộp các bảng khác ownership vào repository tổng hợp.
- SQL chỉ nằm trong repository. Page Object chỉ xử lý UI; helper điều phối/ánh xạ; assertion nghiệp vụ nằm trong spec.
- Query verify phải read-only, parameterized, xác định đúng `tenant_id`; không hardcode tenant, credential hoặc connection string và không ghi dữ liệu nhạy cảm vào log/report.

## 4. Dropdown Và Combogrid

- Với virtual scroll hoặc lazy-load, phải search/filter bằng khóa nghiệp vụ ổn định và unique, ưu tiên mã, để bản ghi render vào DOM trước khi assert/chọn.
- Chỉ phân loại lỗi dữ liệu UI khi DB xác nhận bản ghi thuộc đúng tenant nhưng UI vẫn không trả option sau khi tìm chính xác theo mã/tên. Screenshot danh sách ban đầu chưa tìm kiếm không đủ làm evidence.

## 5. Prompt Chuẩn

- `Sau khi thêm mới thành công, check DB bằng mã vừa tạo và đối chiếu toàn bộ dữ liệu đã nhập.`: lấy mã unique do testcase tạo, truy vấn đúng tenant sau khi UI báo lưu thành công và đối chiếu toàn bộ dữ liệu.
- `Check DB trực tiếp <module>, mã <mã-bản-ghi>, expected: <dữ liệu kỳ vọng>.`: chỉ chạy query read-only; không thực hiện UI và không sửa/xóa dữ liệu.
