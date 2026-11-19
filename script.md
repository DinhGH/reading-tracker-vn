# Kịch bản Thuyết trình Chi tiết (DiiD Reading Tracker)

## I. Mở đầu (0:00 - 1:00)

"Xin chào các thầy cô và ban tuyển dụng. Tên tôi là [Tên của bạn]. Hôm nay, tôi rất vui được giới thiệu dự án 'DiiD' - hệ thống theo dõi thói quen đọc tin tức trên trình duyệt. Mục tiêu của dự án là giúp người dùng không chỉ quản lý những gì mình đã đọc, mà còn phân tích sâu hơn về sở thích thông qua sức mạnh của AI."

## II. Demo Trực tiếp (1:00 - 4:00)

"Để bắt đầu, tôi sẽ demo cách hệ thống hoạt động thực tế:"

1. **Chrome Extension (Thu thập)**:
   "Tôi đang mở trang VnExpress. Ngay lập tức, extension của tôi phát hiện bài báo. Các bạn có thể thấy ở popup, hệ thống đã bắt đầu đếm thời gian (Event: PAGE_ENTER). Nếu tôi chuyển tab qua lại, hệ thống sẽ tự động cập nhật trạng thái ACTIVE/INACTIVE để đảm bảo thời gian đọc thực tế được ghi nhận chính xác, chứ không phải thời gian mở tab ảo."

2. **Dashboard (Thống kê)**:
   "Bây giờ, chúng ta nhìn vào Dashboard của hệ thống. Đây là nơi toàn bộ dữ liệu được đồng bộ về. Bạn có thể thấy danh sách các bài báo tôi vừa đọc được liệt kê theo thời gian thực."

3. **AI Integration (Phân tích)**:
   "Điểm thú vị nhất là phần AI. Với bài báo này, hệ thống tự động tóm tắt nội dung chính chỉ trong 3 câu ngắn gọn. Đồng thời, dựa trên nội dung, AI đã phân loại bài báo vào mục 'Technology' với độ chính xác cao. Nhìn vào biểu đồ sở thích (Topic Domain Chart), tôi có thể thấy cái nhìn tổng quan về các chủ đề tôi quan tâm nhất trong tuần qua."

## III. Điểm nhấn Kỹ thuật (4:00 - 6:00)

"Về mặt kỹ thuật, tôi đã chú trọng vào 3 yếu tố:"

- **Cơ chế Event**: "Tôi lưu trữ dữ liệu dưới dạng chuỗi sự kiện thay vì bản ghi tổng hợp. Điều này cho phép tôi dựng lại chính xác timeline đọc của người dùng."
- **AI Integration**: "Tôi sử dụng API để tóm tắt và phân loại chủ đề một cách tự động, giúp tối ưu hóa dữ liệu thô thành thông tin có giá trị."
- **Tính ổn định**: "Hệ thống có cơ chế lưu đệm trên extension, đảm bảo dữ liệu không bị mất ngay cả khi người dùng mất kết nối Internet hoặc đóng trình duyệt đột ngột."

## IV. Kết luận & Q&A (6:00 - 7:00)

"Dự án này là minh chứng cho khả năng kết hợp giữa kỹ thuật Full-stack và AI để giải quyết các vấn đề nhỏ nhưng thiết thực hàng ngày. Cảm ơn các thầy cô đã theo dõi. Tôi rất sẵn lòng trả lời các câu hỏi về giải pháp của mình."
