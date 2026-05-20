# Kịch bản quay video báo cáo tiến độ

## 1. Mở đầu

- Nội dung nói:
  - “Kính chào thầy/cô, em là [Họ tên] / Nhóm [Tên nhóm]. Hôm nay em xin báo cáo tiến độ dự án phần mềm ứng dụng quản lý tài chính cá nhân.”
  - “Đề tài của chúng em là ứng dụng quản lý tài chính cá nhân, giúp người dùng theo dõi thu chi, ngân sách, hóa đơn và mục tiêu tiết kiệm.”
- Hướng dẫn quay:
  - Quay mặt em hoặc bắt đầu với slide tiêu đề.
  - Nếu có thể, mở đầu bằng một slide/bảng nhỏ ghi rõ “Báo cáo tiến độ dự án” và tên nhóm.

## 2. Giới thiệu đề tài và mục tiêu dự án

- Nội dung nói:
  - “Dự án này thực hiện một ứng dụng quản lý tài chính cá nhân trên điện thoại.”
  - “Mục tiêu chính gồm:
    1. Quản lý giao dịch thu chi.
    2. Theo dõi ngân sách theo tháng.
    3. Quản lý hóa đơn định kỳ.
    4. Quản lý mục tiêu tiết kiệm (pots).
    5. Đồng bộ dữ liệu với Supabase để giữ dữ liệu người dùng.”
- Hướng dẫn quay:
  - Cho thấy giao diện `OverviewScreen` hoặc slide tóm tắt mục tiêu.
  - Hiển thị sơ đồ hoặc phần mô tả ngắn nếu có slide.

## 3. Cấu trúc app và công nghệ đã dùng

- Nội dung nói:
  - “App được xây dựng bằng Expo React Native.
  - Các thành phần chính gồm: `Login` / `Register`, `Overview`, `Transactions`, `Budgets`, `Pots`, `Profile`.
  - Dữ liệu được lưu và đồng bộ với Supabase.
  - Ứng dụng sử dụng các module hook để tách riêng logic: `useAuth`, `useTransactions`, `useBudgets`, `useBills`, `usePots`, `useOverview`.”
- Hướng dẫn quay:
  - Nếu có thể, mở `App.js` nhanh để cho thấy cấu trúc router.
  - Nếu không dùng slide, vẫn có thể giải thích bằng camera và chuyển sang Overview.

## 4. Các chức năng đã hoàn thành

- Nội dung nói:
  - “Đến thời điểm hiện tại, nhóm em đã hoàn thành các chức năng sau:”
    - “Đăng nhập và đăng ký người dùng qua Supabase.”
    - “Dashboard tổng quan tài chính.”
    - “Quản lý giao dịch: thêm, sửa, xóa.”
    - “Quản lý ngân sách theo tháng và hiển thị breakdown chi tiêu.”
    - “Quản lý hóa đơn tháng và đánh dấu đã trả.”
    - “Quản lý mục tiêu tiết kiệm (pots) với nạp/rút và hoàn thành mục tiêu.”
    - “Đồng bộ dữ liệu với Supabase cho hầu hết chức năng chính.”
- Hướng dẫn quay:
  - Quay slide/ghi chú danh sách chức năng hoàn thành.
  - Con mồi: chuyển nhanh qua từng màn hình app đã làm xong.

## 5. Demo chức năng từng màn hình

### 5.1 Demo `Overview`
- Nói:
  - “Đây là màn hình Tổng quan. Ở đây người dùng thấy ngay số dư hiện tại, tổng thu, tổng chi, các hóa đơn tháng này và ngân sách, giao dịch mới nhất.”
- Quay màn hình:
  - Mở `OverviewScreen`.
  - Tô đậm phần `totalBalance`, `income`, `expenses`.
  - Di chuyển đến phần `Hóa đơn tháng này`, `Ngân sách`, `Giao dịch gần đây`.

### 5.2 Demo `Transactions`
- Nói:
  - “Đây là màn hình Giao dịch. Người dùng có thể lọc theo loại, thêm giao dịch mới, sửa hoặc xóa giao dịch.”
- Quay màn hình:
  - Mở `TransactionsScreen`.
  - Chọn một filter category.
  - Nhấn nút `+` để mở form thêm giao dịch.
  - Điền mẫu nhanh và lưu.
  - Chỉnh sửa một giao dịch có thể chỉnh sửa và lưu.

### 5.3 Demo `Budgets`
- Nói:
  - “Đây là màn hình Ngân sách. App hiển thị ngân sách theo tháng, tổng thu/chi và chẩn đoán chi tiêu thực tế.”
- Quay màn hình:
  - Mở `BudgetsScreen`.
  - Chỉ vào selector tháng.
  - Hiển thị tổng `totalIncome` và `totalExpense`.
  - Mở modal thêm/sửa ngân sách.

### 5.4 Demo `Pots`
- Nói:
  - “Đây là màn hình Lọ tiết kiệm. Người dùng có thể tạo mục tiêu, nạp/rút tiền và hoàn thành mục tiêu.”
- Quay màn hình:
  - Mở `PotsScreen`.
  - Chỉ vào tổng đã tiết kiệm và tiến độ %.
  - Thêm một lọ mới hoặc mở lọ hiện có.
  - Thực hiện nạp tiền / rút tiền nếu có dữ liệu.

### 5.5 Demo `Bills`
- Nói:
  - “Đây là tính năng quản lý hóa đơn. App tổ chức hóa đơn theo tháng, cho biết tổng chưa trả và đã trả.”
- Quay màn hình:
  - Mở `BillsScreen` từ Overview bằng nút `Xem tất cả`.
  - Chỉ vào bộ lọc tháng và tính năng toggle đã thanh toán.
  - Thêm/hủy hoặc sửa hóa đơn nếu có thể.

### 5.6 Demo `Profile`
- Nói:
  - “Đây là phần hồ sơ. Người dùng xem thông tin account và có thể đăng xuất.”
- Quay màn hình:
  - Mở `ProfileScreen`.
  - Chỉ vào tên, email và các nút `Chỉnh sửa hồ sơ`, `Đổi mật khẩu`, `Đăng xuất`.

## 6. Phần đang làm

- Nội dung nói:
  - “Hiện tại nhóm em đang tập trung hoàn thiện những phần sau:”
    - “Hoàn thiện UI/UX và layout một số màn hình.”
    - “Xử lý validation form nhập liệu kỹ hơn.”
    - “Tối ưu dữ liệu Supabase, đồng bộ trạng thái giữa các hook.”
    - “Thêm tính năng lọc/sắp xếp giao dịch hoặc báo cáo chi tiết hơn.”
- Hướng dẫn quay:
  - Quay nhanh phần app hoặc slide `Đang làm`.
  - Nếu có task list, có thể cho thầy/cô xem.

## 7. Khó khăn gặp phải

- Nội dung nói:
  - “Nhóm em gặp một số khó khăn như sau:”
    - “Tích hợp xác thực và profile user với Supabase.”
    - “Đồng bộ trạng thái giữa nhiều hook và màn hình.”
    - “Xây dựng logic tính toán ngân sách và tổng quan chính xác.”
    - “Quản lý dữ liệu hóa đơn và giao dịch liên quan với các action tự động.”
- Hướng dẫn quay:
  - Có thể hiển thị slide `Khó khăn gặp phải`.
  - Nếu muốn, mở một vài đoạn mã hoặc màn hình lỗi để minh họa.

## 8. Nội dung muốn xin góp ý

- Nội dung nói:
  - “Em xin thầy/cô góp ý ở các điểm sau:”
    - “Cấu trúc dữ liệu Supabase hiện tại đã hợp lý chưa?”
    - “Logic tính toán tổng quan và ngân sách đã đúng chưa?”
    - “UX thao tác thêm/sửa giao dịch, hóa đơn, tiết kiệm có ổn không?”
    - “Có nên bổ sung chức năng báo cáo/thống kê nào nữa không?”
- Hướng dẫn quay:
  - Slide hoặc văn bản hỏi rõ các điểm này.
  - Quay gọn phần app nếu muốn nhấn mạnh.

## 9. Lời kết

- Nội dung nói:
  - “Em xin cảm ơn thầy/cô đã xem báo cáo. Em rất mong nhận được góp ý để nhóm em tiếp tục hoàn thiện dự án.”
  - “Em xin kính chúc thầy/cô sức khỏe và thành công.”
- Hướng dẫn quay:
  - Kết thúc video bằng máy quay mặt em hoặc slide `Cảm ơn`.

## 10. Ghi chú khi quay

- Giữ giọng nói tự nhiên, chậm rãi và lịch sự.
- Không cần quá dài dòng, mỗi đoạn chỉ cần rõ ý.
- Nếu lỡ bấm sai, dừng lại nhẹ nhàng và nói lại nội dung.
- Nên chuẩn bị sẵn dữ liệu demo để không bị chờ load quá lâu.
- Nếu được, có thể kèm phụ đề đơn giản hoặc caption cho từng phần.
