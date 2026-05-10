# Socily SNAP MVP

Chào mừng bạn đến với dự án **Socily SNAP MVP**! Đây là một nguyên mẫu mạng xã hội được xây dựng dựa trên kiến trúc Đồ thị (Graph Architecture) sử dụng FalkorDB, với Backend là Node.js/Express và Frontend là React/Vite. Dự án tập trung vào việc mô phỏng các tương tác mạng xã hội (bạn bè, bài viết, bình luận, tương tác, gợi ý kết bạn) với hiệu suất cao nhờ vào cơ sở dữ liệu đồ thị.

## Yêu cầu hệ thống (Prerequisites)

Để chạy dự án này trên máy của bạn, hãy đảm bảo bạn đã cài đặt các phần mềm sau:

- **Node.js**: Phiên bản 18.x trở lên.
- **Docker** và **Docker Compose**: Để chạy cơ sở dữ liệu đồ thị FalkorDB.
- **Git** (Tuỳ chọn nhưng khuyên dùng).

---

## Hướng dẫn cài đặt và chạy dự án

Dự án bao gồm 3 thành phần chính cần được khởi động: Cơ sở dữ liệu (Database), Server (Backend), và Client (Frontend). Vui lòng làm theo trình tự dưới đây.

### Bước 1: Khởi động Cơ sở dữ liệu FalkorDB

Mở terminal tại thư mục gốc của dự án (`socily-snap-mvp`) và chạy lệnh sau để khởi tạo container FalkorDB:

```bash
docker-compose up -d
```

Lệnh này sẽ tải image FalkorDB về và chạy ở background tại cổng `6379`.

### Bước 2: Cài đặt và chạy Backend (Server)

1. Mở một terminal mới và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt các gói thư viện cần thiết:
   ```bash
   npm install
   ```
3. **Cấu hình môi trường (Environment Variables):**
   Copy file `.env.example` thành `.env` và tùy chỉnh nếu cần thiết (lưu ý: dự án yêu cầu JWT_SECRET để chạy được tính năng đăng nhập).
   ```bash
   cp .env.example .env
   ```
4. **Khởi tạo dữ liệu mẫu (Seed Database):** Đối với người dùng chạy dự án lần đầu, dự án sử dụng tập dữ liệu thực tế SNAP (ego-Facebook) để mô phỏng mạng lưới. Hãy chạy file seeder bằng lệnh sau:
   ```bash
   node scripts/ingest_snap.js
   ```
   *(Quá trình này sẽ tự động kết nối với FalkorDB, đọc dữ liệu từ thư mục `snap_dataset` ở gốc dự án và tạo sẵn toàn bộ dữ liệu mẫu bao gồm cả tài khoản admin: `admin` / `admin123`. Bạn chỉ cần đợi đến khi terminal báo thành công).*
4. Khởi động server backend ở chế độ phát triển:
   ```bash
   npm run dev
   ```

Server sẽ chạy, thông thường tại cổng `5000` (hoặc cổng được định nghĩa trong file `.env`).

### Bước 3: Cài đặt và chạy Frontend (Client)

1. Mở một terminal mới khác và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói thư viện cần thiết:
   ```bash
   npm install
   ```
3. Khởi động ứng dụng React bằng Vite:
   ```bash
   npm run dev
   ```

Vite sẽ cung cấp cho bạn một đường dẫn (thường là `http://localhost:5173`). Bạn có thể mở đường dẫn này trên trình duyệt để sử dụng ứng dụng.

---

## Cấu trúc thư mục chính

- `docker-compose.yml`: File cấu hình Docker để chạy cơ sở dữ liệu FalkorDB.
- `backend/`: Chứa mã nguồn của Server (Node.js, Express, cấu hình kết nối FalkorDB).
- `frontend/`: Chứa mã nguồn của Client (Giao diện người dùng bằng React, Vite, TailwindCSS/CSS thuần).

## Công nghệ sử dụng

- **Database:** FalkorDB (Cơ sở dữ liệu đồ thị)
- **Backend:** Node.js, Express.js
- **Frontend:** React.js, Vite
- **Real-time:** Socket.io (Hỗ trợ thông báo/nhắn tin thời gian thực)

Chúc bạn có những trải nghiệm tuyệt vời với Socily! Nếu có bất kỳ câu hỏi nào, vui lòng tham khảo mã nguồn hoặc các file markdown liên quan trong dự án.
