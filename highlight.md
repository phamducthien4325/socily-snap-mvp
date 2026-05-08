# Highlight Kỹ Thuật Dự Án Socily SNAP MVP

## 1. Tận Dụng FalkorDB Cho Truy Vấn Đồ Thị Thực Tế
Hệ thống Socily đã được chuyển đổi thành công để có thể tích hợp với tập dữ liệu SNAP ego-Facebook.
Các thay đổi trọng tâm sử dụng FalkorDB:
- **Thay thế "Community" bằng "Private Group"**: 
  Thành viên được kết nối với Group thông qua Relationship `(:User)-[:IN_GROUP]->(:Group)`. Bài viết trong Group được kiểm soát quyền truy cập trực tiếp bằng các pattern matching mạnh mẽ của Cypher, loại bỏ việc lọc logic phức tạp trên Application Layer.
  Ví dụ truy vấn: `MATCH (p)-[:POSTED_IN]->(g:Group)<-[:IN_GROUP]-(me:User {id: $userId})`

- **Đề xuất bạn bè nâng cao (Friend Recommendation)**:
  Thuật toán gợi ý kết bạn kết hợp:
  1. Tính điểm các láng giềng chung (Common Neighbors).
  2. Chỉ số Adamic-Adar cho độ hiếm của láng giềng chung.
  3. Mức độ tương đồng về các thuộc tính (Shared Features/Demographics) thông qua mô hình đồ thị phân nhánh: `(u1)-[:HAS_FEATURE]->(f)<-[:HAS_FEATURE]-(u2)`.

- **Mô hình Dữ Liệu Tối Ưu**:
  Việc chuẩn hóa "Sở thích (Interests)" thành "Đặc điểm (Features)" giúp sát với dữ liệu `.feat` của Stanford SNAP, cho phép tạo ra hệ thống gợi ý với dữ liệu nhân khẩu học thực tế cực kỳ hiệu quả mà không tốn chi phí Join bảng so với RDBMS truyền thống.

## 2. Giải Quyết Hạn Chế Cypher Của FalkorDB
FalkorDB **không hỗ trợ** cú pháp `EXISTS { pattern }` và `NOT EXISTS { pattern }` trong mệnh đề WHERE (khác với Neo4j).
- **Vấn đề**: Các truy vấn Smart Feed ban đầu sử dụng `EXISTS((:User {id: $userId})-[:IN_GROUP]->(g))` để kiểm tra quyền truy cập Group, gây lỗi `Unable to resolve filtered alias`.
- **Giải pháp**: Thay bằng chiến lược `OPTIONAL MATCH` + kiểm tra `NULL`:
  ```cypher
  OPTIONAL MATCH (me:User {id: $userId})-[:IN_GROUP]->(g)
  WITH u, p, g, me
  WHERE g IS NULL OR me IS NOT NULL
  ```
  Cách này vừa tương thích FalkorDB, vừa giữ nguyên logic phân quyền: bài public (`g IS NULL`) luôn hiển thị, bài trong Group chỉ hiển thị nếu user là thành viên (`me IS NOT NULL`).

## 3. Nạp Dữ Liệu SNAP Hoàn Chỉnh
- **3,963 user** với tài khoản đăng nhập được (username `userX`, pass `123456`)
- **170,174 quan hệ FOLLOWS** (từ file `.edges`)
- **Features** được gán từ file `.feat` theo từng ego network
- **Private Groups** được tạo từ file `.circles`
- **423 bài viết** giả lập rải rác trên các tài khoản và groups

## 4. Các hướng phát triển tiếp theo
- **Tính toán Centrality Metrics (PageRank, Betweenness)**: Triển khai các thuật toán đồ thị nâng cao của FalkorDB Graph Algorithms để xác định những người dùng có sức ảnh hưởng (Influencers) trong các Group và mạng lưới.
- **Performance Benchmark**: Báo cáo so sánh thời gian truy xuất Feed và Suggestion bằng FalkorDB (Cypher) so với mô hình SQL Join trên tập dữ liệu hàng chục nghìn cạnh.
- ~~Sửa lỗi Encoding tiếng Việt~~: ✅ **Đã hoàn thành** — Sửa double-encoded UTF-8 bằng script decode iterative + tìm/thay thế trực tiếp. 10 file JSX đã được khôi phục.
- **Tạo bài viết trong Group**: Cho phép đăng bài trực tiếp từ trang Group thay vì chỉ từ Feed.

