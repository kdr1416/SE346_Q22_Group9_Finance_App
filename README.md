# Finance App

Một ứng dụng quản lý tài chính cá nhân được xây dựng bằng React Native (Expo) và Supabase.

## Tính năng nổi bật

*   **Quản lý giao dịch**: Ghi chép thu chi hàng ngày.
*   **Ngân sách**: Theo dõi và quản lý ngân sách hàng tháng.
*   **Lọ tiết kiệm (Pots)**: Quản lý các mục tiêu tiết kiệm, tự động tạo giao dịch khi nạp/rút tiền.
*   **Hóa đơn định kỳ**: Theo dõi các khoản thanh toán lặp lại.
*   **Thống kê & Tổng quan**: Xem số dư tổng quát và biểu đồ trực quan.

## Công nghệ sử dụng

*   **Frontend:** React Native, Expo
*   **Backend / Database:** Supabase
*   **Navigation:** React Navigation

## Yêu cầu hệ thống

*   Node.js (phiên bản LTS khuyến nghị)
*   npm hoặc yarn
*   Ứng dụng Expo Go trên điện thoại (hoặc Android Studio / Xcode để chạy máy ảo)

## Cài đặt và khởi chạy

1. **Clone repository và cài đặt dependencies:**

   ```bash
   git clone <repository-url>
   cd finance-app
   npm install
   ```

2. **Cấu hình biến môi trường:**

   Tạo một file `.env` ở thư mục gốc của dự án và thêm thông tin kết nối Supabase của bạn:

   ```env
   --liên hệ admin để lấy thông tin --
   ```

3. **Khởi chạy ứng dụng:**

   ```bash
   npm run start
   ```
   hoặc
   ```bash
   npx expo start
   ```

4. **Chạy trên thiết bị:**
   *   Mở ứng dụng **Expo Go** trên điện thoại và quét mã QR hiển thị trên terminal.
   *   Nhấn phím `a` trong terminal để mở trên Android Emulator.
   *   Nhấn phím `i` trong terminal để mở trên iOS Simulator.
