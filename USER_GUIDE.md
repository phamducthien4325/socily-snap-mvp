# Socily — Hướng dẫn sử dụng

## 1. Đăng nhập

- Truy cập `http://localhost:5173`
- Nhập **Tên đăng nhập** và **Mật khẩu**
- Tài khoản mẫu: `elenar` / `password123` (hoặc `davidc`, `mayap`, `sarahk`, `alexm`, `lisaw`, `tomn`)
- Tài khoản admin: `admin` / `password123`

## 2. Home Feed (Smart Feed)

### Thuật toán đề xuất nội dung
Trang chủ không chỉ hiển thị bài viết mới nhất mà sử dụng thuật toán **Ranking** để ưu tiên những nội dung phù hợp nhất với bạn:
- **Interest Relevance**: Dựa trên mức độ quan tâm của bạn với các thẻ (tags) của bài viết.
- **Affinity**: Mức độ thân thiết với tác giả (dựa trên số lần bạn đã like/comment bài của họ).
- **Time Decay**: Bài viết càng mới thì điểm càng cao.
- **Badge 🔥 Recommended**: Xuất hiện ở những bài viết có điểm số phù hợp rất cao.

### Xem bài viết
- Sau khi đăng nhập, bạn sẽ thấy danh sách bài viết.
- Mỗi bài viết hiển thị:
  - **Community badge** (ví dụ 📁 Full Stack Hub) — cho biết bài viết thuộc cộng đồng nào.
  - **Tags** (ví dụ #React #Node.js #Python) — các chủ đề liên quan, lấy tự động từ Community.
  - **Nút Like** ❤️ — click để thích/bỏ thích. **Khi bạn like, hệ thống tự động tăng trọng số sở thích của bạn** cho các tag liên quan (+1.0).
  - **Nút Comment** 💬 — click để mở phần bình luận, gõ và gửi. Mỗi comment tăng trọng số sở thích (+2.0).
  - **Nút Share** 🔄 — chia sẻ bài viết. Mỗi share tăng trọng số sở thích (+3.0).

### Tạo bài viết mới
1. Nhấn nút **"+ Create"** trên thanh điều hướng → chuyển đến trang tạo bài viết.
2. Nhấn **"Chọn cộng đồng"** → chọn cộng đồng phù hợp (bắt buộc).
3. Nhập **Tiêu đề** (tối đa 300 ký tự) và **Nội dung** (tối đa 2000 ký tự).
4. Chọn loại bài viết qua 3 tab:
   - **📝 Văn bản**: Bài viết thuần văn bản.

5. Nhấn **"Đăng bài"** để đăng.

## 3. Suggested Connections (Gợi ý kết bạn)

- Nằm ở sidebar bên phải.
- Sử dụng **Hybrid Score** kết hợp 3 thuật toán:
  - **Common Neighbors**: Đếm số bạn chung
  - **Adamic-Adar**: Ưu tiên bạn chung "hiếm"
  - **Interest Dot Product**: So sánh trọng số sở thích chung
- Mỗi gợi ý hiển thị:
  - ⚡ **Score** — điểm tổng hợp
  - **Shared interests** — các sở thích chung (dạng tag)
  - 👥 **Bạn chung** — số lượng bạn chung
  - 📐 **AA** — điểm Adamic-Adar
- Nhấn **"Connect"** để follow người đó.
- Danh sách hỗ trợ **cuộn vô hạn** (infinite scroll).

## 4. Profile & My Interests

- Vào **Profile** từ menu trái hoặc thanh navigation trên.
- Phần **"My Interests"** hiển thị:
  - Danh sách sở thích được xếp hạng theo **trọng số (weight)** giảm dần.
  - Thanh progress bar trực quan.
  - Nguồn gốc: 📌 Khai báo / 🤖 Hành vi / 🔀 Kết hợp
- **Thêm sở thích**: Gõ tên sở thích vào ô → nhấn **"Thêm"** (weight +10.0).
- Bảng quy đổi trọng số:
  - 📌 Khai báo trực tiếp: **+10.0**
  - ❤️ Like: **+1.0**
  - 💬 Comment: **+2.0**
  - 🔄 Share: **+3.0**

## 5. Graph Visualization (Admin)

- Truy cập từ **Dashboard** (yêu cầu tài khoản admin).
- Trực quan hóa mạng lưới quan hệ dưới dạng đồ thị.
- Chạy truy vấn Cypher trực tiếp.
- Xem thống kê: nodes, edges, density.

## 6. Communities

### Tạo Community mới (Multi-step Wizard)
Nhấn **"Tạo Community"** từ thanh điều hướng trên hoặc trang Discover để mở wizard 3 bước:

**Bước 1 — Chọn chủ đề**:
- Chọn 1 trong 29 chủ đề có emoji (VD: 🎮 Games, 💻 Technology, 🎨 Art...).
- Chủ đề giúp hệ thống gợi ý community cho người dùng có cùng sở thích.
- Nhấn **"Next"** để tiếp tục.

**Bước 2 — Loại community**:
- Chọn loại quyền truy cập:
  - 🌐 **Public**: Ai cũng có thể xem, đăng bài và bình luận.
  - 🔒 **Private**: Chỉ thành viên được duyệt mới xem và đăng bài.
- Nhấn **"Next"** để tiếp tục.

**Bước 3 — Thông tin community**:
- Nhập **Tên community** (tối đa 21 ký tự) — bắt buộc.
- Nhập **Mô tả** — giới thiệu về community.
- Nhập **Tags** (phân cách bằng dấu phẩy, VD: `technology, programming, react`).
- Xem **Live Preview** bên phải hiển thị "r/tên_community" với mô tả.
- Nhấn **"Create Community"** để hoàn tất.

### Khám phá Communities
- Mỗi Community có các **Interest/Tag liên kết** (ví dụ: "Data & AI" → AI, Python, Machine Learning).
- Khi bạn đăng bài vào Community → bài viết tự động thừa kế tags từ Community.
- Khi ai đó tương tác với bài viết → trọng số Interest tự động cập nhật.
- Vào trang **Discover** để xem community được gợi ý dựa trên sở thích của bạn.

## 7. Phát sinh Dữ Liệu Lớn (Dành cho Developer)

- **Mục đích**: Chạy kịch bản tạo dữ liệu ảo với số lượng lớn (hàng chục ngàn users, bài viết, lượt follows và likes) để kiểm tra khả năng chịu tải và tốc độ xử lý của FalkorDB.
- **Cách chạy**: 
  1. Mở terminal vào thư mục `backend`.
  2. Cài đặt thư viện: `npm install @faker-js/faker`
  3. Chạy lệnh: `node massiveSeeder.js`
  4. Script sẽ tự động xóa sạch dữ liệu cũ và chèn 5000 users, 20000 posts, hàng nghìn tương tác... bằng phương pháp Bulk Insert vào database.

## 8. Trang cá nhân (User Profile)

- Truy cập thông qua đường dẫn `/profile/:username` hoặc click vào tên/avatar của người dùng.
- Hiển thị 3 tab chính:
  - **Posts**: Lịch sử bài viết của người dùng.
  - **Interests**: Biểu đồ sở thích và điểm số quan tâm.
  - **Connections**: Tóm tắt mạng lưới kết nối (chưa hoàn thiện toàn bộ).

## 9. Quản lý hệ thống (Admin Management)

- Truy cập từ menu **Management** (chỉ dành cho tài khoản Admin).
- **Users**: Xem danh sách người dùng, số lượng bài viết, có thể Cấm (Ban) hoặc Xóa (Delete) tài khoản.
- **Posts**: Xem danh sách toàn bộ bài viết trên hệ thống và Xóa các bài viết vi phạm.

---

## ⚠️ Tính năng đang phát triển

| Tính năng | Trạng thái |
|---|---|
| Quản lý Community (sửa, xóa, mời thành viên) | 🔧 Đang phát triển |
| Onboarding chọn sở thích cho user mới | 🔧 Đang phát triển |
| Xóa/chỉnh sửa bài viết | 🔧 Đang phát triển |
| Trang Thông báo (Notifications) | ✅ Hoàn thành |

### Giao diện Cộng đồng (Community Interface)
Sau khi tạo, bạn sẽ được chuyển đến trang Cộng đồng với giao diện chuẩn Reddit:
- **Banner & Avatar**: Nhận diện cộng đồng bằng hình nền đặc trưng và biểu tượng Emoji (phù hợp với chủ đề cộng đồng).
- **Khu vực Main Feed**:
  - Dùng thanh **Sắp xếp** để xem bài viết theo các tiêu chí: *Tốt nhất*, *Mới nhất*, *Nóng nhất*, *Top*.
  - Các bài viết hiển thị trực quan bao gồm ảnh (nếu có) và link đính kèm.
- **Khu vực Sidebar**: 
  - **About**: Xem thông tin tổng quan, số lượng thành viên thực tế, thời gian tạo và thống kê tuần qua.
  - **Rules**: Nhấn vào các quy định (được tạo bởi người sáng lập lúc tạo cộng đồng) để mở rộng/thu gọn và đọc chi tiết (giúp nắm rõ nội quy trước khi đăng bài).
  - **Chủ đề (Tags)**: Xem các từ khóa chủ đề mà cộng đồng hướng tới.
- **Thao tác**: Nhấn nút **Tham gia / Đã tham gia** để gia nhập hoặc rời khỏi cộng đồng. Khi tham gia, hệ thống sẽ ưu tiên hiển thị bài viết của cộng đồng này trên bảng tin cá nhân (Feed) của bạn. Nhấn **Tạo bài viết** để bắt đầu thảo luận. Nếu bạn là người tạo cộng đồng, bạn sẽ thấy thêm chức năng **Mod Tools** và các biểu tượng chỉnh sửa chuyên biệt.

## 10. Thông báo (Notifications)

- Truy cập từ tab **"Notifications"** trên thanh điều hướng phía trên.
- **Các loại thông báo**: Hệ thống tự động tạo thông báo khi có ai đó:
  - 👤 **Follow** bạn (connection)
  - ❤️ **Like** bài viết của bạn
  - 💬 **Comment** trên bài viết của bạn
  - 👥 **Mời** bạn vào cộng đồng
- **Lọc thông báo**: Sử dụng 3 tab filter:
  - **Tất cả**: Hiển thị tất cả thông báo
  - **Chưa đọc**: Chỉ hiển thị thông báo chưa đọc (có dấu chấm cam bên trái)
  - **Đã đọc**: Chỉ hiển thị thông báo đã đọc
- **Thao tác**:
  - Click vào thông báo → đánh dấu đã đọc và chuyển đến liên kết liên quan
  - Nút ✓ → đánh dấu đã đọc mà không chuyển trang
  - Nút 🗑️ → xoá thông báo
  - Nút **"Đọc tất cả"** → đánh dấu tất cả thông báo đã đọc
- **Lưu ý**: Khi chuyển giữa tab Notifications và các tab khác (Home Feed, Profile...), **chỉ phần nội dung chính thay đổi**, layout (thanh điều hướng, sidebar) giữ nguyên — không bị re-render toàn bộ trang.

`Cập nhật: 2026-05-07`

