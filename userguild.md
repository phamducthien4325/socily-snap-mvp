# Hướng Dẫn Sử Dụng Socily (Phiên Bản SNAP MVP)

Chào mừng bạn đến với hướng dẫn sử dụng Socily phiên bản mới nhất, đã được tối ưu cho kiến trúc đồ thị và mô phỏng theo dữ liệu Stanford SNAP.

## 0. Khởi chạy hệ thống

### Bước 1: Đảm bảo Docker đang chạy (FalkorDB)
```bash
docker-compose up -d
```

### Bước 2: Khởi động Backend
```bash
cd backend
npm run dev
# Server chạy tại http://localhost:5000
```

### Bước 3: Khởi động Frontend
```bash
cd frontend
npm run dev
# Giao diện tại http://localhost:5173
```

### Bước 4: Đăng nhập
- **Username**: `user0`, `user107`, `user348`, hoặc bất kỳ `userX` (X = 0 → 3962)
- **Password**: `123456` (chung cho tất cả)

## 1. Giới thiệu chức năng chính
- **Group (Riêng tư)**: Bạn có thể tạo các hội nhóm riêng tư cho gia đình, bạn bè hoặc đồng nghiệp. Mọi bài đăng trong Group sẽ được bảo mật, chỉ có những ai đã tham gia Group mới nhìn thấy.
- **Smart Feed**: Bảng tin thông minh tổng hợp bài viết public và bài viết từ các Group mà bạn tham gia. Bạn không cần lo lắng bị người ngoài nhìn thấy bài đăng cá nhân trong nhóm.
- **Gợi Ý Kết Bạn (Quick Match)**: Tính năng này phân tích các mối quan hệ (Bạn chung) và thuộc tính (Features) để tìm ra những người dùng phù hợp nhất để kết nối.

## 2. Cách tạo và quản lý Group
1. Từ thanh điều hướng (Left Sidebar) hoặc (TopNav), nhấn vào nút **"Tạo Group"**.
2. Nhập **Tên Group** và **Mô tả**.
3. Group sẽ được tạo ở chế độ riêng tư (Private). Bạn có thể truy cập Group từ danh sách bên trái.
4. Ở trong trang Group, các thành viên có thể đăng bài viết và bình luận.

## 3. Smart Feed (Bảng tin thông minh)
1. Khi đăng nhập, trang Home Feed sẽ hiển thị bài viết từ:
   - **Bạn bè** (người bạn follow) — bài viết public
   - **Groups** mà bạn tham gia — bài viết được gắn nhãn group
   - **Bài viết của chính bạn**
2. Bài viết được sắp xếp theo thuật toán **Time Decay** — bài mới hơn được ưu tiên hơn.
3. Bạn có thể Like, Comment, Share trực tiếp trên Feed.

## 4. Gợi ý và Khám phá (Suggestions)
1. Truy cập tab **Suggestions (Khám phá)** từ thanh bên hoặc thanh điều hướng.
2. Hệ thống sẽ hiển thị danh sách người dùng được đề xuất kết bạn, kèm theo **Lý do đề xuất**:
   - 👥 **Bạn bè chung**: Ví dụ "2 bạn bè chung"
   - 🎯 **Điểm chung (Shared Features)**: Ví dụ "Điểm chung: feat_14, feat_127, feat_55"
   - 📊 **Adamic-Adar Score**: Chỉ số đánh giá độ hiếm của các bạn chung
3. Bạn có thể kết nối ngay lập tức bằng nút **"Kết nối"**.

## 5. Giao diện Cá Nhân (Profile)
1. Trong trang Profile, bạn sẽ thấy:
   - Thông tin cá nhân (Username, Name, Role)
   - Số lượng Posts, Followers, Following
2. Tab **"Features"** hiển thị các thông tin phân loại nhân khẩu học (demographic features) rút trích từ dữ liệu SNAP.
3. *Lưu ý*: Hiện tại tính năng thêm/sửa Feature bằng tay đã bị vô hiệu hóa vì các Features được nạp trực tiếp từ dataset.

## 6. Trang Group
1. Click vào tên Group ở sidebar trái để truy cập trang Group.
2. Trang Group hiển thị:
   - Tên, mô tả, số thành viên
   - Danh sách bài viết trong Group
   - Nội quy Group (Rules)
3. Chỉ thành viên Group mới thấy bài viết — quyền truy cập được đảm bảo bởi FalkorDB graph query.

## 7. Dữ liệu SNAP
- Hệ thống sử dụng tập dữ liệu **ego-Facebook** từ Stanford SNAP Network Dataset.
- **3,963 người dùng** thực tế với **170,174 quan hệ** bạn bè.
- Các **Features** (đặc điểm nhân khẩu học) và **Circles** (nhóm kín) được nạp trực tiếp từ dataset.

## 8. Các tính năng đang phát triển (Work in Progress)
- [x] ~~Sửa lỗi Encoding tiếng Việt~~: Đã hoàn thành — Sửa double-encoded UTF-8 trên 10 file JSX.
- [ ] **Admin Dashboard (Graph)**: Giao diện trực quan hoá mạng lưới kết nối đồ thị.
- [x] ~~Data Ingestion Script~~: Đã hoàn thành — Script nạp dữ liệu từ `.edges`, `.feat`, `.circles`.
- [x] ~~Gợi ý kết bạn có giải thích~~: Đã hoàn thành — Hiển thị lý do đề xuất.
