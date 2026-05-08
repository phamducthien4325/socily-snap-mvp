# Lịch sử phát triển hệ thống (System Development History)

*File này chỉ được thêm nội dung, không được sửa đổi nội dung cũ.*

## [2026-05-02] - Phiên phát triển Admin & Real-time Notifications
- **Phát triển**: 
  - Triển khai chức năng Trang cá nhân (User Profile) hiển thị Posts, Interests và Connections.
  - Xây dựng hệ thống thông báo thời gian thực (Real-time Notifications) sử dụng Socket.IO kết hợp FalkorDB, bắt sự kiện Like, Comment, Follow.
  - Hoàn thiện giao diện và API quản lý Admin (Admin Management), cho phép xem danh sách người dùng, bài viết, và thực hiện cấm (ban) hoặc xóa tài khoản.
  - Phân quyền (RBAC) với JWT payload kiểm tra `role: 'admin'`.
- **Hoạt động bảo trì**:
  - Sửa lỗi template literal backticks (`) bị escape sai trong các file `posts.js`, `users.js`, `admin.js`, và `AdminManagement.jsx`.
  - Khởi tạo script `seedAdmin.js` để seed dữ liệu tài khoản admin ban đầu.
- **Tài liệu**: Cập nhật `USER_GUIDE.md` và `HIGHLIGHTS.md` phản ánh các tính năng mới.

## [2026-05-03] - Tối ưu hóa truy vấn Feed (Smart Feed Optimization)
- **Phát triển / Sửa lỗi**:
  - Gặp lỗi `Get posts error: SimpleError: Query timed out` và `ECONNREFUSED ::1:6379` khi tải Feed bài viết.
  - Phân tích nguyên nhân: Truy vấn Cypher cũ quét toàn bộ `(u:User)-[:POSTED]->(p:Post)` trong hệ thống rồi tính toán điểm phức tạp cho mọi bài viết, gây ra hiện tượng Time Out và làm sập hoặc treo kết nối FalkorDB.
  - Cách khắc phục: Tối ưu hoá truy vấn tại API `GET /api/posts` bằng cách giới hạn lấy 100 bài viết gần nhất trước (`ORDER BY p.timestamp DESC LIMIT 100`), sau đó mới tính điểm Affinity và Interest Relevance. Truy vấn đã nhẹ hơn rất nhiều, phản hồi nhanh và khắc phục được lỗi treo kết nối cơ sở dữ liệu.
  - Cập nhật UI: Đã tạo và tích hợp Component `Avatar` dùng chung (`Avatar.jsx`) cho tất cả các trang (`Feed.jsx`, `TopNav.jsx`, `LeftSidebar.jsx`, `Profile.jsx`, `Notifications.jsx`). Khắc phục lỗi text URL rác bị tràn ra ngoài do trước đó chỉ in thẳng avatar URL thành chuỗi thay vì hiển thị thẻ `<img>`.
  - Thiết kế lại layout: Tinh chỉnh giao diện thanh Left Sidebar hiển thị bám sát lề trái màn hình, xóa bỏ bo góc và thêm nút ẩn/hiện (Hamburger Menu) trên thanh điều hướng tương tự như cách hoạt động của nền tảng Reddit. Khung `main-content` cũng được dỡ bỏ giới hạn width và tuỳ chỉnh padding để mở rộng không gian trải nghiệm.
  - Tách luồng Tạo bài viết (Create Post): 
    - Đưa nút `+ Create` lên thanh điều hướng (TopNav).
    - Tạo trang riêng biệt `CreatePost.jsx` (route `/submit`) chuyên dùng cho việc đăng bài, mang lại không gian rộng rãi để soạn thảo.
    - Tại trang `Feed`, nút tạo bài viết cũ được thay thế bằng một thanh input giả lập, khi click vào sẽ tự động chuyển hướng sang trang `/submit` (giống cơ chế của Reddit).
    - Hoàn thiện trang `CreatePost.jsx`: Thêm trường tiêu đề (300 ký tự), bộ đếm ký tự (2000 cho nội dung), tìm kiếm cộng đồng trong dropdown, thông báo lỗi trực quan, nút Hủy/Đăng bài, hiển thị tên người đăng, phần quy tắc đăng bài, auto-focus, click-outside-to-close, và hiệu ứng animation mượt mà.

## [2026-05-03] - Hoàn thiện Create Post: Thêm Ảnh & Liên kết
- **Phát triển**:
  - Xóa thanh "Create Post" giả lập trên trang Feed (thanh input redirect), chỉ giữ nút `+ Create` trên TopNav.
  - Hoàn thiện trang `CreatePost.jsx` với 3 tab đầy đủ:
    - **Tab Văn bản**: Soạn nội dung bài viết thuần văn bản (giữ nguyên).
    - **Tab Ảnh & Video**: Cho phép người dùng dán URL ảnh, hiển thị preview ảnh trực tiếp, phát hiện lỗi URL không hợp lệ, thêm mô tả ảnh tùy chọn.
    - **Tab Liên kết**: Cho phép người dùng dán URL liên kết, hiển thị preview với hostname tự động parse, thêm mô tả liên kết tùy chọn.
  - Cập nhật backend API `POST /api/posts`:
    - Mở rộng node `Post` trong FalkorDB để lưu trữ 2 thuộc tính mới: `imageUrl` và `linkUrl`.
    - Sử dụng cơ chế dynamic `SET` clause để chỉ lưu khi user cung cấp giá trị (tránh lưu thuộc tính rỗng vào graph).
  - Cập nhật API `GET /api/posts` (Smart Feed) trả về `imageUrl` và `linkUrl` từ FalkorDB.
  - Cập nhật `Feed.jsx` hiển thị ảnh đính kèm (với border-radius, max-height, error handling) và liên kết đính kèm (với hover effect, hostname display) trong mỗi bài viết.
- **Điểm nổi bật FalkorDB**: Thuộc tính linh hoạt trên node — Không cần migration schema, chỉ cần thêm `SET p.imageUrl = $imageUrl` vào câu lệnh Cypher là node Post có thêm thuộc tính mới ngay lập tức. Thể hiện tính schema-free của graph database.

## [2026-05-04] - Thiết kế lại form Tạo Community đa bước (Multi-step Wizard)
- **Phát triển**:
  - Chuyển đổi form tạo cộng đồng (Community) thành Multi-step wizard gồm 3 bước giống với nền tảng Reddit.
  - Xóa code Inline Modal trong `Discover.jsx` và tách logic ra thành Component riêng `CreateCommunityModal.jsx` với bộ State phức tạp để quản lý flow người dùng.
  - Cấu trúc các bước:
    - Bước 1: Chọn Topic (Chủ đề) thông qua Grid-layout.
    - Bước 2: Nhập Tên và Mô tả có hiển thị Live Preview giả lập định dạng "r/tên-cộng-đồng".
    - Bước 3: Tích hợp lựa chọn Radio (Public, Restricted, Private) và Toggle switch tự thiết kế để đánh dấu nội dung Người Lớn (18+).
  - Tích hợp Component mới vào `Discover.jsx` và đồng thời hiển thị trên thanh `TopNav.jsx` để người dùng có thể kích hoạt form từ bất kỳ đâu.
- **Backend**:
  - Sửa đổi Cypher Query trong API `POST /api/communities` để chấp nhận và lưu trữ thêm các Node properties: `type` (loại riêng tư) và `isAdult` (giới hạn độ tuổi) vào FalkorDB. Lợi dụng tính schema-free của Graph DB giúp update rất nhẹ nhàng.

## [2026-05-05] - Sửa lại thứ tự Multi-step Community Wizard theo mẫu Reddit
- **Phát triển**:
  - Sửa lại hoàn toàn thứ tự 3 bước của Modal tạo Community theo đúng ảnh mẫu từ Reddit:
    - **Bước 1**: Chọn Topic (chủ đề) — Grid các chip có emoji (🎌 Anime & Cosplay, 🎨 Art, 💻 Technology...). Thêm 29 topics đầy đủ bao gồm cả "Adult Content" và "Mature Topics".
    - **Bước 2**: Chọn loại Community (Public / Restricted / Private) với Custom Radio Button + Toggle switch Mature (18+). Tự động bật Mature khi chọn topic người lớn. Thêm thông báo cảnh báo đỏ và policy notice.
    - **Bước 3**: Nhập tên Community (giới hạn 21 ký tự) + Mô tả + Tags (phân cách bằng dấu phẩy) + Preview Card bên phải hiển thị live "r/communityname".
  - Viết lại toàn bộ CSS với namespace `ccm-` (Create Community Modal) để tránh xung đột với styles khác.
  - Thêm animations: `ccmFadeIn` cho overlay, `ccmSlideIn` cho modal, `ccmRadioIn` cho radio button.
  - Cải thiện UX: Click overlay để đóng modal, reset state khi đóng, auto-add topic vào tags.
- **Điểm nổi bật FalkorDB**: Tags được lưu vào đồ thị qua quan hệ `(Community)-[:RELATED_TO]->(Interest)`, tận dụng graph traversal để gợi ý community cho user dựa trên sở thích (`HAS_INTEREST → Interest ← RELATED_TO Community`).

## [2026-05-05] - Thiết kế lại giao diện trang Community (Community Page Redesign)
- **Phát triển**:
  - Viết lại toàn bộ Component `Community.jsx` để mô phỏng chính xác giao diện của Reddit.
  - Sử dụng bố cục 2 cột (Main Content + Sidebar phải) thay vì 1 cột như trước đây.
  - Thay đổi phong cách thiết kế với tông màu xanh lá (Green palette) đặc trưng.
  - Cập nhật luồng render giao diện: Ẩn thanh Sidebar bên phải mặc định của hệ thống (`RightSidebar` trong `App.jsx`) khi ở trang Community để tránh xung đột sidebar.
  - Cấu trúc giao diện mới:
    - **Banner**: Hình nền có pattern nổi bật.
    - **Header**: Avatar cộng đồng (dùng Emoji nếu chọn Topic có Emoji), tên cộng đồng, và các nút thao tác như `Tạo bài viết`, `Tham gia`, `Mod Tools`.
    - **Feed Area**: Thanh công cụ sắp xếp bài viết (Best, New, Hot, Top) và danh sách bài viết thiết kế dạng Card. Cải thiện hiển thị link và image trong Card bài viết.
    - **Sidebar**:
      - **About Card**: Hiển thị mô tả, ngày tạo, loại cộng đồng (Public/Private), số lượng thành viên/bài viết, và các nút điều hướng (Mod, Rules).
      - **Rules Card**: Accordion liệt kê các quy định của cộng đồng (tương tự Reddit Rules panel).
      - **Tags Card**: Hiển thị danh sách các tag của cộng đồng.
- **Tính thẩm mỹ**: Áp dụng triệt để các token thiết kế (CSS Variables) để đảm bảo tính nhất quán (Consistent Design System) cho trang.

## [2026-05-05] - Role Management, Community Invitations, and Real-time Chat
- **Phát triển Backend (FalkorDB & Socket.IO)**:
  - Tích hợp `Socket.IO` vào `server.js` để xử lý sự kiện `send_message` và `receive_message`.
  - Thiết kế cấu trúc đồ thị cho Chat: Tạo Node `Conversation` và `Message`, liên kết người dùng bằng quan hệ `PARTICIPATES_IN`, gán tin nhắn qua `IN_CONVERSATION` và `SENT`.
  - Cập nhật Router `communities.js` bổ sung các API phân quyền: `GET /members`, `POST /kick`, `POST /ban` (Sử dụng quan hệ mới `BANNED_FROM` để cấm tham gia).
  - Xây dựng API gợi ý mời bạn bè (`GET /invite-suggestions`) bằng thuật toán Graph: `MATCH (u:User)-[:FOLLOWS]->(f:User) WHERE NOT (f)-[:BELONGS_TO]->(c)`.
- **Phát triển Frontend**:
  - Tạo Component `ModTools.jsx` dành cho Admin/Moderator thực hiện Kick hoặc Ban thành viên trong cộng đồng.
  - Xây dựng Component `InviteModal.jsx` hiển thị danh sách bạn bè chưa gia nhập cộng đồng và cho phép thao tác mời nhanh.
  - Tích hợp Component `ChatDrawer.jsx` cung cấp giao diện nhắn tin trực tiếp (1-1) mọi lúc trên hệ thống thông qua biểu tượng Message ở `TopNav`.
- **Điểm nổi bật FalkorDB**: Sử dụng sức mạnh truy vấn quan hệ (`WHERE NOT ()-[:BELONGS_TO]->()`) để lọc ra bạn bè chung chưa vào group cực kỳ nhanh chóng mà không cần JOIN phức tạp như SQL.

## [2026-05-05] - Tái cấu trúc thành MVP Graph DB Showcase
- **Phát triển**:
  - Cắt giảm các tính năng không cốt lõi (Chat, Notifications, Mod Tools, Media Upload) để tập trung hoàn toàn vào việc thể hiện sức mạnh của Graph Database (FalkorDB).
  - Loại bỏ Socket.IO ra khỏi hệ thống backend, chuyển đổi mô hình về thuần REST API cho mục đích đơn giản hóa và dễ trình diễn hiệu suất.
  - Lược bỏ chức năng tạo bài viết đa phương tiện (Ảnh/Link) và lược bỏ tuỳ chọn người lớn/giới hạn khi tạo cộng đồng để UI trở nên tinh gọn.
- **Mục tiêu**:
  - Tạo ra một phiên bản MVP tối giản nhưng mạnh mẽ, đóng vai trò như một dự án giáo dục (Educational Showcase) để chứng minh ưu thế của Graph Database trong các bài toán Recommendation, Pathfinding, và Analytics so với SQL/NoSQL.

## [2026-05-05] - Mở rộng hiển thị thống kê Graph Dashboard
- **Phát triển**:
  - Cập nhật API `GET /api/graph/stats` (file `graph.js`) trong backend để tự động tính toán và trả về thêm dữ liệu thống kê cho số lượng Bài viết (Posts) và các Edge liên quan như lượt Thích (LIKED), Tạo bài (POSTED) và Đăng trong cộng đồng (POSTED_IN).
  - Bổ sung các thông số này vào danh sách hiển thị Node Distribution và Edge Types trong Component `GraphDashboard.jsx` ở Frontend. Sử dụng icon `FileText` từ `lucide-react` để nhận diện Bài viết một cách trực quan.
- **Khắc phục**: 
  - Khắc phục tình trạng "biến mất" số lượng Posts trong Dashboard mặc dù đồ thị đã được load hàng chục nghìn Posts từ `massiveSeeder.js`. Hệ thống giờ đây phản ánh chính xác quy mô đồ sộ của database khi thực hiện benchmark.

### 2026-05-07
- Khởi chạy lại dự án: Start FalkorDB (Docker), backend (port 5000), frontend (port 5173).
- **Fix: Tab Notification bị re-render toàn bộ màn hình**:
  - **Nguyên nhân**: Không có trang Notifications (page + route + API). Khi click tab "Notifications", route `/notifications` rơi vào `*` → redirect `/feed` → re-render toàn bộ layout.
  - **Giải pháp**:
    - Tạo Backend route `routes/notifications.js` với 4 API thực (GET list, PUT mark-read, PUT read-all, DELETE) — tất cả dùng FalkorDB Cypher queries.
    - Đăng ký route `/api/notifications` trong `server.js`.
    - Tạo Frontend page `Notifications.jsx` với filter tabs (Tất cả/Chưa đọc/Đã đọc), đánh dấu đã đọc, xoá, animation mượt mà.
    - Thêm route `/notifications` vào `App.jsx` trong DashboardLayout group.
  - **Cải tiến kiến trúc**: Refactor `App.jsx` — Loại bỏ `AnimatedDashboardContent` component thừa, tích hợp `<Outlet />` trực tiếp vào `DashboardLayout` với `AnimatePresence`. Giờ khi chuyển tab, chỉ phần content (col-main) thay đổi, layout (TopNav, LeftSidebar, RightSidebar) giữ nguyên.
  - **Điểm nổi bật FalkorDB**: Notifications được lưu dưới dạng Node `Notification` với quan hệ `CREATED_NOTIFICATION` (actor) và `HAS_NOTIFICATION` (target), tận dụng graph traversal để truy vấn thông báo kèm thông tin actor rất hiệu quả.

### 2026-05-08 — Hoàn tất Data Ingestion SNAP & Sửa lỗi Cypher Compatibility
- **Nạp dữ liệu SNAP hoàn chỉnh**:
  - Sửa bug `TypeError: Unexpected param type undefined` khi generate posts: nguyên nhân do `result.data.map(r => r[0])` → sửa thành `r['u.id']` (FalkorDB trả về object thay vì array).
  - Script `ingest_snap.js` chạy thành công: nạp **3,963 users**, **170,174 edges**, **Features**, **Groups**, và **423 posts** vào graph `socily_snap`.

- **Sửa lỗi FalkorDB Cypher — EXISTS không được hỗ trợ**:
  - **Lỗi**: Smart Feed query sử dụng `EXISTS((:User {id: $userId})-[:IN_GROUP]->(g))` gây `SimpleError: Unable to resolve filtered alias`.
  - **Lỗi**: Sau khi sửa bằng `NOT EXISTS { pattern }`, FalkorDB vẫn báo `Invalid input '('` vì cú pháp subquery EXISTS cũng không được hỗ trợ.
  - **Giải pháp cuối cùng**: Dùng chiến lược `OPTIONAL MATCH` + `WHERE g IS NULL OR me IS NOT NULL` để thay thế hoàn toàn EXISTS. Áp dụng cho cả 3 truy vấn: Smart Feed, Search Posts, User Posts.
  - **File sửa**: `posts.js` (overwrite toàn bộ), `users.js` (sửa user posts query).

- **Kết quả kiểm thử**:
  - ✅ Login: Đăng nhập `user0/123456` thành công.
  - ✅ Home Feed: Hiển thị bài viết từ bạn bè và groups (có nhãn group).
  - ✅ Suggestions: Hiển thị lý do đề xuất (bạn chung, features chung, Adamic-Adar score).
  - ✅ Group Page: Hiển thị đúng thành viên, mô tả, rules.
  - ✅ Profile: Hiển thị thông tin user, followers/following count.
  - ⚠️ Encoding tiếng Việt: Giao diện hiển thị mojibake cho text tiếng Việt (cần fix charset).

### 2026-05-08 (Phiên 2) — Sửa lỗi Encoding Tiếng Việt
- **Vấn đề gốc**: Các file JSX chứa text tiếng Việt bị **double-encoded UTF-8** — text UTF-8 gốc bị encode thêm một lần nữa qua UTF-8, tạo ra chuỗi bytes sai (ví dụ: `C3 83 C2 AC` thay vì `C3 AC` cho chữ "ì"). Ngoài ra, một số bytes đã bị hỏng hoàn toàn (U+FFFD Replacement Character).

- **Quy trình sửa (3 bước)**:
  1. **Bước 1**: Viết script `fix_encoding.js` decode iterative UTF-8 → Latin-1 → UTF-8 để khôi phục 10 file bị double-encoding.
  2. **Bước 2**: Viết script `fix_encoding2.js` tìm & thay thế hàng loạt các chuỗi bị hỏng (FFFD) bằng text đúng, dựa trên ngữ cảnh xung quanh.
  3. **Bước 3**: Sửa thủ công 7 chuỗi cuối cùng trong `TopNav.jsx` và `Discover.jsx` mà script không bắt được.

- **Files đã sửa**: 
  - `App.jsx`, `TopNav.jsx`, `LeftSidebar.jsx`, `InviteModal.jsx`
  - `Feed.jsx`, `Discover.jsx`, `CreatePost.jsx`, `Group.jsx`
  - `Notifications.jsx`, `GraphDashboard.jsx`

- **Kết quả**: ✅ Toàn bộ text tiếng Việt hiển thị chính xác trên mọi trang (Home Feed, Suggestions, Notifications, Profile, Group).

### 2026-05-08 (Phiên 3) — Regenerate Posts bằng Tiếng Anh
- **Vấn đề**: Nội dung bài viết trong Feed đang hiển thị bằng tiếng Latin giả (Lorem Ipsum) do sử dụng `faker.lorem.paragraph()` trong script nạp dữ liệu.
- **Giải pháp**: Viết script `regen_posts.js` với 15 template bài viết social media thực tế (tech, daily life, food, travel, motivational quotes). Xóa posts cũ, tạo lại 596 bài viết tiếng Anh, gán 235 bài vào groups, và generate 500 likes.
- **Kết quả**: ✅ Feed hiển thị nội dung tiếng Anh tự nhiên như mạng xã hội thực.
