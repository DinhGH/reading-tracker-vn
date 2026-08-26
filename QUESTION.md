**1. Người dùng mở đồng thời nhiều tab**

- **Vấn đề:** Tránh việc tính trùng lặp thời gian đọc thực tế trên tất cả các tab đang mở cùng lúc.
- **Giải pháp:**
- Mỗi tab khi mở sẽ tự khởi tạo một instance Content Script độc lập với một `session_id` riêng biệt.
- Chỉ tab nào đang có `document.visibilityState === 'visible'` và đang nhận focus của người dùng mới được kích hoạt bộ đếm `Active Reading Time` và phát event `PAGE_ACTIVE`.
- Các tab chạy ngầm ở chế độ nền (background tabs) sẽ giữ nguyên trạng thái `PAGE_INACTIVE` và không tăng thời gian đọc thực tế.

---

**2. Người dùng chuyển liên tục giữa các tab**

- **Vấn đề:** Khi người dùng đổi tab nhanh (Alt+Tab hoặc click chuột liên tục), extension có thể phát sinh bão request (event spamming) gây nghẽn mạng và quá tải server.
- **Giải pháp:**
- Áp dụng kỹ thuật **Debounce / Throttle** (độ trễ khoảng 500ms – 1000ms) khi lắng nghe sự kiện `visibilitychange`.
- Chỉ khi người dùng dừng lại ở một tab quá thời gian debounce, trạng thái `PAGE_ACTIVE` mới chính thức được ghi nhận và gửi về server.

---

**3. Người dùng mở tab nhưng không thao tác trong thời gian dài (Idle State)**

- **Vấn đề:** Tab vẫn mở và hiển thị trên màn hình nhưng người dùng đã rời khỏi bàn máy tính hoặc không đọc.
- **Giải pháp:**
- Content Script thiết lập một bộ đếm thời gian rảnh (Idle Timer) với ngưỡng 30 giây.
- Lắng nghe các tương tác: `scroll`, `mousemove`, `keydown`, `click`. Mỗi khi có thao tác, timer sẽ được reset về 0.
- Nếu sau 30 giây không phát hiện thao tác nào, extension tự động chuyển trạng thái sang `PAGE_INACTIVE`, tạm dừng cộng dồn active time. Khi người dùng thao tác trở lại, hệ thống gửi event `PAGE_ACTIVE` và tiếp tục đếm.

---

**4. Người dùng đóng Chrome đột ngột nên không phát sinh `PAGE_LEAVE**`

- **Vấn đề:** Trình duyệt bị tắt ngang (End Task, crash, tắt máy), event `PAGE_LEAVE` không thể gửi bằng HTTP Fetch thông thường.
- **Giải pháp kết hợp (Client + Server):**
- **Phía Client:** Lắng nghe sự kiện `pagehide` / `beforeunload` và sử dụng **`navigator.sendBeacon()`** để gửi tín hiệu `PAGE_LEAVE`. Trình duyệt luôn ưu tiên hoàn thành request này kể cả khi tab đã đóng.
- **Phía Server (Cơ chế bọc lót):** Chạy một **Cron Job** định kỳ mỗi 1–2 phút quét các session chưa có `end_time`. Nếu một session không nhận thêm bất kỳ heartbeat/event nào sau 5 phút, server tự động đánh dấu session đó là `COMPLETED` và lấy timestamp của event cuối cùng làm thời điểm kết thúc.

---

**5. Extension gửi cùng một event nhiều lần**

- **Vấn đề:** Do mạng chập chờn hoặc retry khiến cùng 1 event bị gửi trùng, dẫn đến sai lệch số liệu thống kê.
- **Giải pháp:**
- **Idempotency Key:** Phía Extension tự sinh ra một mã định danh duy nhất `event_id` (UUID v4) cho mỗi event ngay lúc khởi tạo.
- **Phía Database:** Đặt ràng buộc `PRIMARY KEY` (hoặc `UNIQUE INDEX`) trên cột `id` của bảng `Event`. Khi server nhận dữ liệu, nếu `event_id` đã tồn tại thì sẽ bỏ qua hoặc trả về kết quả thành công mà không insert trùng bản ghi.

---

**6. Mất kết nối Internet trong thời gian Extension đang hoạt động**

- **Vấn đề:** Mất mạng làm các event bị thất lạc, không gửi được về server.
- **Giải pháp:**
- **Offline Queue:** Khi gọi API gửi event thất bại, Extension tự động đẩy payload vào hàng đợi lưu trữ trong `chrome.storage.local`.
- **Tự động gửi bù:** Lắng nghe sự kiện `window.addEventListener('online')` (hoặc background polling mỗi 30s). Khi phát hiện có kết nối Internet trở lại, Extension sẽ tuần tự xả toàn bộ event trong hàng đợi lên server và xóa cache cục bộ sau khi nhận phản hồi thành công.

---

**7. Website thay đổi cấu trúc HTML làm chức năng lấy nội dung bài báo không chính xác**

- **Vấn đề:** Báo điện tử đổi tên class/id của thẻ bài viết khiến các CSS selector cố định bị hỏng (trả về nội dung rỗng).
- **Giải pháp:**
- **Cơ chế bóc tách dự phòng (Fallback DOM Parsing):** Không phụ thuộc 100% vào CSS selector cố định. Nếu selector chính thất bại, extension tự động chuyển sang thuật toán Heuristic (tương tự thư viện _Mozilla Readability_) để quét thẻ `<article>`, `<main>` hoặc gom các thẻ `<p>` có mật độ chữ cao nhất.
- **Remote Config:** Lưu cấu hình CSS selectors trên Server hoặc file json từ xa. Khi báo đổi giao diện, chỉ cần cập nhật selector trên server/config mà không cần người dùng phải cập nhật lại Extension.

---

**8. AI: Tóm tắt và Phân loại bài báo**

- **Tóm tắt (Câu 6):** Sử dụng Google Gemini API với prompt kỹ thuật (System Instruction) yêu cầu tóm tắt 3-5 câu, tập trung vào nội dung chính, loại bỏ quảng cáo. Sử dụng kỹ thuật Few-shot prompting để tăng chất lượng.
- **Phân loại (Câu 7):** Sử dụng mô hình Classification tích hợp trong Gemini hoặc tập luật từ khóa dựa trên nội dung bài viết. Trả về nhãn cùng với độ tin cậy (`confidence score`).
- **Phân tích sở thích (Câu 8):** Tính toán dựa trên tần suất đọc của từng `category` trong lịch sử phiên đọc của `session_id`. Áp dụng trọng số (weight) cao hơn cho các bài đọc có `total_active_time` lớn.
- **Dự đoán (Câu 9):** Sử dụng hồi quy tuyến tính (Linear Regression) đơn giản dựa trên dữ liệu lịch sử về độ dài bài viết (`char_count`) và tốc độ đọc trung bình của người dùng, kết hợp với sở thích về chủ đề.
