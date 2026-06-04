# 💰 Finance App — Ứng dụng Quản lý Tài chính Sinh viên

Một ứng dụng di động quản lý tài chính cá nhân và tài chính nhóm dành cho sinh viên Việt Nam, được tích hợp trí tuệ nhân tạo (AI). Dự án sử dụng **React Native (Expo)** cho phần giao diện di động và **Supabase** cho hệ thống cơ sở dữ liệu cùng các tác vụ máy chủ (Edge Functions).

---

## 🚀 Tính năng nổi bật

### 1. Quản lý Tài chính Cá nhân
*   **Ghi chép giao dịch (Transactions)**: Ghi lại các khoản thu chi hàng ngày nhanh chóng, phân loại theo danh mục tiện lợi.
*   **Quản lý Ngân sách (Budgets)**: Thiết lập hạn mức chi tiêu theo từng danh mục (Ăn uống, Học tập, Đi lại...) giúp kiểm soát dòng tiền, tự động tính toán số dư đã sử dụng.
*   **Lọ tiết kiệm (Pots)**: Đặt mục tiêu tích luỹ (Ví dụ: mua laptop, đóng học phí). Tích hợp nạp tiền vào lọ và tự động tạo giao dịch chi tiêu tương ứng.
*   **Hóa đơn định kỳ (Bills)**: Theo dõi các khoản thanh toán cố định hàng tháng (Tiền nhà, tiền điện, net), đánh dấu trạng thái đã thanh toán theo từng tháng.

### 2. Quỹ Nhóm & Cộng đồng (Group Funds)
*   **Tạo/Tham gia quỹ**: Tạo quỹ nhóm mới hoặc tham gia bằng Mã mời (Invite Code) 6 ký tự.
*   **Phân quyền thành viên**: Phân chia vai trò rõ ràng gồm Chủ quỹ (`owner`), Quản trị viên quỹ (`admin`), và Thành viên (`member`).
*   **Thu quỹ (Payment Requests)**: Chủ quỹ tạo yêu cầu đóng quỹ (chia đều số tiền). Thành viên nộp tiền và gửi minh chứng xác nhận, chủ quỹ phê duyệt để tăng số dư.
*   **Chi quỹ (Group Expenses)**: Thành viên đề xuất các khoản chi tiêu của nhóm. Chỉ có Chủ quỹ/Admin mới được quyền duyệt chi tiêu để thực hiện trừ tiền khỏi số dư quỹ.
*   **Lịch sử hoạt động (Activity Logs)**: Ghi lại từng thao tác tạo yêu cầu, nộp tiền, chi quỹ của các thành viên công khai và minh bạch.

### 3. Tính năng Trí tuệ Nhân tạo (AI Features)
*   **AI Hậu kiểm & Kiểm duyệt bài đăng (AI Post Moderation)**:
    *   Tự động phân tích nội dung bài viết ngay sau khi đăng bằng mô hình **Google Gemini 2.5 Flash** (chạy ngầm bất đồng bộ qua Edge Function).
    *   Phân loại rủi ro theo 3 cấp độ: `approved` (chấp nhận), `flagged` (nghi ngờ - cần duyệt thủ công), và `rejected` (vi phạm - tự động ẩn bài và gửi thông báo vi phạm).
*   **Bản tin Tài chính AI (AI News Feed)**:
    *   Hệ thống tự động cào tin từ nguồn RSS Kinh tế của các báo lớn (VnExpress, Tuổi Trẻ).
    *   AI chấm điểm nổi bật, tóm tắt bài viết thành các đoạn ngắn cô đọng và phân loại chủ đề (Chứng khoán, Crypto, Bất động sản...).
    *   Gộp 5 bài tin nổi bật nhất thành **1 Bản tin tổng hợp (HTML Bulletin)** vào lúc 7:00 & 19:00 hàng ngày, giảm loãng bảng tin.
    *   Người dùng có bộ lọc **"Tin AI"** để tùy chọn ẩn hoặc hiện bản tin này trên bảng tin cộng đồng.

---

## 🛠️ Công nghệ sử dụng
*   **Frontend**: React Native, Expo, React Navigation, React Native Render HTML, TenTap Editor.
*   **Backend & DB**: Supabase (PostgreSQL, Row-Level Security RLS, Database Triggers & Functions).
*   **Serverless**: Supabase Edge Functions (Deno runtime).
*   **AI Service**: Google Gemini API (`gemini-2.5-flash`).

---

## 🔒 Cơ chế Bảo mật API & Cơ sở dữ liệu

Dự án áp dụng các tiêu chuẩn bảo mật khắt khe nhằm chống gian lận số dư và lộ thông tin:

### 1. Bảo mật API Keys và Row-Level Security (RLS)
*   **Public Key an toàn**: Theo thiết kế của Supabase, `EXPO_PUBLIC_SUPABASE_URL` và `EXPO_PUBLIC_SUPABASE_ANON_KEY` (hoặc `EXPO_PUBLIC_SUPABASE_KEY`) là các biến môi trường công khai được nhúng vào client app.
*   **Cơ chế RLS**: Hàng rào bảo mật thực sự nằm ở cơ chế **Row-Level Security (RLS)** trên cơ sở dữ liệu Supabase, đảm bảo người dùng chỉ truy cập và chỉnh sửa được dữ liệu được phân quyền (ví dụ: giao dịch cá nhân của chính mình).
*   **Bảo vệ Service Role Key**: Khóa quản trị `SUPABASE_SERVICE_ROLE_KEY` tuyệt đối không được đưa vào ứng dụng di động để tránh lộ lọt, chỉ cấu hình trên Dashboard Supabase cho các tác vụ server.

### 2. Quản lý Số dư ở Cấp độ Database (Server-side Balance Management)
*   Toàn bộ tính toán cộng/trừ số dư của Quỹ Nhóm đều do **PostgreSQL Database Triggers** xử lý tự động khi giao dịch đóng tiền được xác nhận hoặc chi tiêu được duyệt.
*   Chính sách bảo mật RLS và trigger bảo vệ cột ngăn chặn việc client gọi API trực tiếp để sửa đổi trái phép số dư hoặc thông tin chủ quỹ.

---

## 💻 Cài đặt & Khởi chạy ứng dụng

### 1. Cài đặt dependencies:
```bash
git clone <repository-url>
cd finance-app
npm install
```

### 2. Cấu hình biến môi trường (`.env`):
Tạo file `.env` tại thư mục gốc của `finance-app` từ mẫu `.env.example` và điền thông tin Supabase của bạn:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key
```
*(Liên hệ admin để lấy thông tin kết nối mẫu).*

### 3. Khởi chạy ứng dụng Expo:
```bash
npm run start
```
*   Quét mã QR bằng ứng dụng **Expo Go** trên điện thoại Android/iOS của bạn để trải nghiệm.
*   Nhấn `a` để mở máy ảo Android, nhấn `i` để mở máy ảo iOS.
