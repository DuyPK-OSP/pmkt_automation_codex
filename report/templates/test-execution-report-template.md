<a id="top"></a>

# Báo cáo kiểm thử — {{REPORT_TITLE}}

<!--
HỢP ĐỒ DỮ LIỆU VÀ QUY TẮC REPORT MARKDOWN PMKT

A. NGUỒN KẾT QUẢ VÀ QUY TRÌNH
1. Chỉ tạo report sau khi preflight evidence PASS và suite đã được chạy thật.
2. Phải lấy kết quả từ đúng run/case-results/artifacts tương ứng; không tự tạo hoặc
   suy đoán trạng thái, tần suất, Test Data, Expected, Actual hay evidence còn thiếu.
3. Khi chạy suite để report, không truyền --reporter trên CLI vì sẽ thay reporter
   trong config và có thể làm mất JSON kết quả ghi theo từng testcase.
4. Automation Result là READ ONLY: không sửa TC ID, trạng thái, Expected, Actual,
   Bug ID hoặc Automation Evidence để làm đẹp kết quả.
5. Report Markdown và report HTML của cùng lần chạy phải thống nhất số liệu, Bug ID,
   testcase ảnh hưởng, Expected và Actual; chỉ khác cách trình bày/tính tương tác.

B. PHÂN LOẠI KẾT QUẢ
1. PASS: toàn bộ điều kiện kiểm tra của testcase khớp Expected.
2. FAIL: đã thực hiện được luồng nhưng Actual không khớp manual testcase. Phải mô
   tả bug sản phẩm hoặc nêu rõ nếu là lỗi automation chưa được sửa.
3. BLOCK: không thể thực hiện/đánh giá testcase vì tiền điều kiện hoặc testcase phụ
   thuộc bị chặn. Phải ghi rõ case/nguyên nhân chặn; không dùng BLOCK thay cho FAIL.
4. SKIP: testcase chủ động không chạy theo cấu hình/quyết định đã xác định.
5. Lỗi locator, wait, script hoặc test data của automation không được log thành bug
   sản phẩm. Sau khi sửa automation và rerun PASS, phải loại bug automation khỏi report.
6. PASS + FAIL + SKIP + BLOCK phải bằng TOTAL; mọi tỷ lệ phải khớp số lượng.

C. GỘP BUG VÀ CASE ĐẠI DIỆN
1. Chỉ gộp các testcase có cùng triệu chứng hoặc cùng root cause hợp lý. Nếu root
   cause chưa được xác nhận, phải ghi rõ đó là suy luận.
2. Với nhiều testcase cùng một bug, dùng testcase đầu tiên làm case đại diện để log
   Chi tiết Bug. Danh sách đầy đủ testcase ảnh hưởng vẫn nằm trong Tổng hợp Bugs.
3. Pre-Condition, Steps, Test Data và Expected trong Chi tiết Bug phải lấy nhất quán
   từ chính testcase đại diện; tuyệt đối không trộn dữ liệu của nhiều testcase.
4. Pre-Condition và Steps phải lấy đúng manual testcase. Không dùng nội dung chung
   như "chạy TC", "thực hiện theo testcase" hoặc "quan sát assertion".

D. EXPECTED, ACTUAL VÀ KIỂM TRA DB
1. Expected phải lấy từ manual testcase; nhiều kết quả phải đánh số 1, 2, 3.
2. Actual phải ghi giá trị/hành vi quan sát thật và từng mục phải tương ứng với
   Expected; không cần highlight hoặc tô đỏ khác biệt.
3. Khi testcase có kiểm tra DB, phải ghi đúng dữ liệu UI đã hiển thị/đã nhập và giá
   trị DB thực tế. Không tự suy diễn giá trị mặc định hoặc coi NULL tương đương 0.
4. Sai khác định dạng tương đương về giá trị như UI nhập 5 và DB lưu 5.0000 không
   được coi là lỗi; mọi sai khác nghiệp vụ khác phải thể hiện rõ Expected/Actual.

E. EVIDENCE
1. Evidence phải được mở kiểm tra trực quan trước khi đưa vào report, nhìn rõ trường,
   giá trị Actual và đúng triệu chứng bug.
2. Ưu tiên ảnh chụp đúng thời điểm mismatch. Không dùng screenshot cuối testcase
   nếu UI đã thay đổi và ảnh không còn thể hiện bug; khi cần phải lấy đúng frame trace/video.
3. Chỉ liên kết evidence lâu dài bằng đường dẫn tương đối dưới ./evidence/...; mọi
   file phải tồn tại và không bị .gitignore loại bỏ.
4. Không liên kết tới test-results/, playwright-report/ hoặc allure-results/ vì đây
   là artifacts tạm thời.
5. Tên ảnh phải ổn định, có nghĩa và gắn được với Bug ID/testcase đại diện.

F. CẤU TRÚC RIÊNG CỦA MARKDOWN
1. Chỉ gồm: tiêu đề, Tổng quan kết quả, Tổng hợp Bugs và Chi tiết Bug.
2. Không sinh các section: Kết luận, Thông tin lần chạy, Điều hướng nhanh, Kết quả
   chi tiết từng testcase, Thông tin kỹ thuật hoặc Tester Review.
3. Mỗi bug có đúng bảng bảy dòng theo template và link Lên đầu sau section.
4. Link Bug ID phải trỏ tới heading Markdown tự sinh từ heading chỉ chứa Bug ID;
   không dùng thẻ <a id> thủ công cho bug vì có thể mở file source trong Preview.
5. Không có dữ liệu phải ghi N/A. Không ghi credentials hoặc thông tin cá nhân thật.
6. Bảo toàn mọi chỉnh sửa thủ công ngoài phạm vi được người dùng yêu cầu.
-->

## Tổng quan kết quả

| Tổng test | PASS | FAIL | SKIP | BLOCK | Tỷ lệ PASS | Automation Bugs |
|---:|---:|---:|---:|---:|---:|---:|
| **{{TOTAL_COUNT}}** | **{{PASS_COUNT}}** | **{{FAIL_COUNT}}** | **{{SKIP_COUNT}}** | **{{BLOCK_COUNT}}** | **{{PASS_PERCENT}}%** | **{{AUTOMATION_BUG_COUNT}}** |

<!--
Quy tắc Tổng quan:
- TOTAL_COUNT là tổng testcase do runner ghi nhận.
- Các count lấy từ kết quả thật, không suy ra từ nội dung testcase.
- PASS_PERCENT = PASS_COUNT / TOTAL_COUNT × 100, làm tròn nhất quán.
- AUTOMATION_BUG_COUNT là số Bug ID automation duy nhất trong báo cáo.
-->

## Tổng hợp Bugs

> Nếu không phát hiện bug, ghi: **Không phát hiện bug trong lần chạy này** và xóa
> toàn bộ block bug mẫu bên dưới.

| Bug ID | Mức độ | Số case ảnh hưởng | Tên case ảnh hưởng | Tóm tắt bug |
|---|:---:|---:|---|---|
| [{{BUG_ID_01}}](#{{BUG_ID_LOWERCASE_01}}) | {{SEVERITY_01}} | {{AFFECTED_COUNT_01}} | {{TC_ID_01}}, {{TC_ID_02}} | {{BUG_SUMMARY_01}} |
| {{REPEAT_FOR_REMAINING_BUGS}} | | | | |

<!--
Quy tắc từng cột của bảng Tổng hợp Bugs:
- Bug ID: text link tới đúng anchor của section Chi tiết Bug; ID phải duy nhất.
- Mức độ: Critical/High/Medium/Low hoặc nhãn tiếng Việt đã được xác nhận.
- Số case ảnh hưởng: số TC ID duy nhất liên quan đến bug.
- Tên case ảnh hưởng: chỉ ghi TC ID, không ghi Scenario hoặc mô tả dài.
- Tóm tắt bug: một câu nêu sai khác chính; không ghi chung chung "test fail" hay
  "assertion failed".
-->

[Lên đầu](#top)

---

## Chi tiết Bug

<!--
Sao chép nguyên block từ BUG START đến BUG END cho mỗi bug.
Mỗi bug bắt buộc có đúng bảy dòng thông tin trong bảng chi tiết.
-->

<!-- BUG START -->
### {{BUG_ID_01}}

> 🤖 **AUTOMATION DETECTED · READ ONLY** · {{SEVERITY_01}} · Tái hiện {{FREQUENCY_01}}

| Hạng mục | Nội dung |
|---|---|
| **Tiêu đề bug** | {{BUG_TITLE_01}} |
| **Điều kiện tiên quyết** | **Case đại diện: `{{REPRESENTATIVE_TC_ID}}`**<br>{{PRECONDITION_FROM_MANUAL_TESTCASE}} |
| **Các bước tái hiện** | 1. {{ACTUAL_STEP_1_FROM_MANUAL_TESTCASE}}<br>2. {{ACTUAL_STEP_2_FROM_MANUAL_TESTCASE}}<br>3. {{REMAINING_ACTUAL_STEPS}} |
| **Data test** | {{ACTUAL_TEST_DATA_OR_NA}} |
| **Kết quả mong đợi** | 1. {{EXPECTED_1_FROM_REPRESENTATIVE_TESTCASE}}<br>2. {{EXPECTED_2_IF_ANY}} |
| **Kết quả thực tế** | 1. {{ACTUAL_1_CORRESPONDING_TO_EXPECTED_1}}<br>2. {{ACTUAL_2_CORRESPONDING_TO_EXPECTED_2}} |
| **Bằng chứng** | [Xem ảnh evidence](./evidence/{{FEATURE_OR_RUN_ID}}/{{BUG_ID_01}}-{{REPRESENTATIVE_TC_ID}}.webp) |

<!--
Quy tắc bảy dòng Chi tiết Bug:
- Tiêu đề bug: nêu đối tượng/chức năng, hành vi thực tế và điểm không khớp; không
  lặp Bug ID trong nội dung.
- Điều kiện tiên quyết: lấy đúng cột Pre-Condition của testcase đại diện, gồm quyền,
  trạng thái dữ liệu và màn hình ban đầu thực sự cần cho luồng.
- Các bước tái hiện: lấy đúng cột Test Steps, giữ thứ tự và đúng tên tab/trường/nút,
  hành động click/nhập/chọn/nhấn phím/lưu. Không dùng câu "thực hiện theo testcase",
  "chạy TC" hoặc "quan sát assertion".
- Data test: ghi đúng dữ liệu dùng trong lần chạy, unique/traceable khi được sinh;
  không phát sinh dữ liệu thì ghi N/A.
- Kết quả mong đợi: lấy đúng Expected Result của testcase đại diện. Có nhiều kết quả
  thì đánh số 1, 2, 3 theo đúng thứ tự kiểm tra.
- Kết quả thực tế: ghi giá trị/hành vi quan sát thật. Mỗi mục 1, 2, 3 phải tương ứng
  với Expected; không cần highlight hoặc tô đỏ khác biệt.
- Bằng chứng: ảnh đúng thời điểm mismatch, nhìn rõ trường, Actual và triệu chứng.
  Không dùng ảnh cuối testcase nếu UI đã thay đổi và không còn thể hiện bug.
- Nếu bug ảnh hưởng nhiều testcase: chỉ dùng testcase đầu tiên làm case đại diện
  cho nội dung chi tiết; không trộn dữ liệu từ nhiều testcase.
-->

[Lên đầu](#top)

<!-- BUG END -->

---

<!--
CHECKLIST TRƯỚC KHI BÀN GIAO
[ ] PASS + FAIL + SKIP + BLOCK = TOTAL_COUNT.
[ ] PASS_PERCENT được tính đúng.
[ ] Mỗi FAIL được ánh xạ tới một bug hoặc có giải thích rõ nếu không phải bug.
[ ] Mỗi Bug ID xuất hiện đúng một lần trong Tổng hợp Bugs và có anchor hợp lệ.
[ ] Mỗi bug có đủ bảy dòng bắt buộc và dùng đúng case đại diện.
[ ] Pre-Condition và Steps khớp manual testcase của case đại diện.
[ ] Expected và Actual cụ thể, tương ứng từng mục; không suy đoán dữ liệu.
[ ] Tần suất và số case ảnh hưởng lấy từ kết quả thật.
[ ] Từng ảnh đã được mở kiểm tra trực quan và thể hiện đúng bug.
[ ] Mọi link ./evidence/... tồn tại, dùng đường dẫn tương đối và không bị .gitignore.
[ ] Không còn link tới artifacts tạm hoặc credentials/PII.
[ ] Có link Lên đầu sau Tổng hợp Bugs và sau từng Chi tiết Bug.
[ ] Giữ nguyên chỉnh sửa thủ công ngoài phạm vi được yêu cầu.
-->
