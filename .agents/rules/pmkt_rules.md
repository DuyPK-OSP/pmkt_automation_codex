# Quy Tắc Automation Riêng Cho PMKT

> Áp dụng cho các testcase thuộc hệ thống PMKT và bổ sung cho các quy tắc automation dùng chung.

## 1. Kiểm Tra Chứng Từ Phát Sinh Liên Phân Hệ

- Khi Expected Result quy định hệ thống tự sinh chứng từ hoặc bản ghi ở phân hệ khác, testcase phải mở đúng phân hệ đích và kiểm tra bản ghi phát sinh; không được chỉ dừng ở toast thành công của chứng từ nguồn.
- Phải đối chiếu bằng mã/số chứng từ unique do chính testcase tạo, không tìm theo dữ liệu chung hoặc chỉ kiểm tra danh sách có bản ghi bất kỳ.
- Với mỗi chứng từ phát sinh, tối thiểu phải kiểm tra sự tồn tại và trạng thái theo manual testcase; kiểm tra thêm trường nghiệp vụ đặc trưng khi Expected Result có nêu.
- Bản đồ màn hình nghiệp vụ hiện tại:
  - Phiếu nhập kho: `Kho → Phiếu nhập kho`.
  - Phiếu chi tiền mặt: `Tiền mặt → Chi tiền`.
  - Ủy nhiệm chi, Séc tiền mặt và Séc chuyển khoản: `Tiền gửi → Chi tiền`.
- Bản đồ trên là quy ước của PMKT hiện tại. Khi UI thay đổi, phải xác minh lại trên browser thật trước khi cập nhật locator hoặc route.

## 2. Cleanup Chứng Từ PMKT Liên Quan

- Khi testcase tạo chứng từ nguồn và PMKT tự sinh chứng từ liên quan, teardown phải quản lý cả chứng từ nguồn và các chứng từ phát sinh đó.
- Trước khi xóa chứng từ nguồn, teardown phải xác nhận trên UI rằng từng chứng từ liên quan cần kiểm soát đang tồn tại.
- Sau khi xóa chứng từ nguồn, teardown phải xác nhận trên UI rằng từng chứng từ liên quan đã được xóa cascade hoặc không còn xuất hiện trên danh sách tương ứng.
- Khi cần xác minh hoặc cleanup chứng từ liên phân hệ, được phép mở đúng danh sách liên quan nhưng không cần redirect trở lại màn hình ban đầu sau khi cleanup hoàn tất.
- Nếu hệ thống không cho xóa cascade, teardown phải ghi nhận rõ chứng từ còn tồn tại và lý do UI trả về; không được báo cleanup thành công giả.
- Attachment `test-data-cleanup` phải ghi rõ mã chứng từ nguồn, mã từng chứng từ liên quan, loại chứng từ, kết quả cleanup và phương thức xác minh.
- Cleanup chỉ xử lý các mã unique đã được testcase hiện tại đăng ký sau khi lưu thành công; tuyệt đối không xóa theo từ khóa chung hoặc theo toàn bộ tiền tố `AUTO_`.

## 3. Checklist PMKT Khi Bàn Giao

- Nếu testcase sinh chứng từ liên phân hệ, xác nhận đúng bản ghi tại phân hệ đích bằng mã/số chứng từ unique và kiểm tra trạng thái theo Expected Result.
- Với luồng mua hàng, kiểm tra đúng vị trí: Phiếu nhập kho tại `Kho → Phiếu nhập kho`, Phiếu chi tại `Tiền mặt → Chi tiền`, và Ủy nhiệm chi/Séc tại `Tiền gửi → Chi tiền`.
- Xác nhận teardown đã kiểm tra chứng từ liên quan tồn tại trước cleanup và không còn trên UI sau khi xóa chứng từ nguồn.
- Xác nhận attachment `test-data-cleanup` ghi đủ chứng từ nguồn, chứng từ liên quan, loại chứng từ và kết quả cleanup.
