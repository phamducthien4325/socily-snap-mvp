# Socily - FalkorDB Showcase Demo Scenarios

Tài liệu này lưu trữ các kịch bản (scenarios) lý tưởng để trình diễn (demo) sức mạnh của Graph Database (FalkorDB) so với Relational Database (SQL). Các kịch bản này tận dụng tối đa cấu trúc dữ liệu đa hướng gồm các thực thể `User`, `Post`, `Community`, và `Interest`.

## 🚀 Kịch bản 1: Thuật toán Bảng tin Siêu Cấp (The Ultimate Smart Feed)

**Mô tả bài toán:**
Lấy ra những bài viết "tuyệt vời nhất" cho người dùng hiện tại dựa trên mạng lưới quan hệ. Cụ thể:

- Bài viết phải nằm trong một `Community` mà "người tôi theo dõi" đang tham gia.
- `Community` đó phải có chứa `Interest` (Sở thích) khớp với `Interest` cá nhân của tôi.
- Sắp xếp dựa trên số lượng bạn bè trong cộng đồng đó.

**Tại sao SQL lại yếu kém trong bài toán này?**
Để thực thi truy vấn này bằng SQL, hệ thống cần thực hiện ít nhất 5 đến 6 lệnh `JOIN` qua các bảng trung gian: `Users`, `Follows`, `Community_Members`, `Posts`, `Community_Tags`, `User_Interests`. Nếu số lượng người dùng lên tới hàng triệu, truy vấn sẽ trở nên cồng kềnh, chậm chạp và tốn rất nhiều tài nguyên hệ thống (thường phải dùng các giải pháp caching rất phức tạp để bù đắp).

**Sức mạnh của Cypher Graph:**

```cypher
MATCH (me:User {id: 'bench_1'})-[:FOLLOWS]->(friend:User)-[:BELONGS_TO]->(c:Community)<-[:POSTED_IN]-(p:Post)
MATCH (c)-[:RELATED_TO]->(i:Interest)<-[:HAS_INTEREST]-(me)
RETURN p.id AS Post, c.name AS Community, i.name AS Interest, count(friend) AS FriendsInComm 
ORDER BY FriendsInComm DESC LIMIT 10
```

## 🚀 Kịch bản 2: Gợi ý Cộng đồng Mạng lưới (Collaborative Filtering)

**Mô tả bài toán:**
Hệ thống muốn gợi ý các hội nhóm mới cho người dùng. Thuật toán: "Tìm những người dùng khác có chung nhiều sở thích nhất với tôi, xem họ đang sinh hoạt ở `Community` nào mà tôi *chưa* tham gia, sau đó gợi ý `Community` đó cho tôi".

**Tại sao SQL lại yếu kém trong bài toán này?**
Đòi hỏi thực hiện phép giao tập hợp (Intersection) lớn để tìm điểm tương đồng (Similarity), đồng thời phải sử dụng sub-queries (`NOT IN` hoặc `LEFT JOIN ... WHERE NULL`) để lọc các cộng đồng người dùng đã tham gia. Các thao tác này cực kỳ "đắt đỏ" trên SQL.

**Sức mạnh của Cypher Graph:**

```cypher
MATCH (me:User {id: 'bench_1'})-[:HAS_INTEREST]->(i:Interest)<-[:HAS_INTEREST]-(similar:User)-[:BELONGS_TO]->(c:Community)
WHERE NOT (me)-[:BELONGS_TO]->(c)
RETURN c.name AS RecommendedCommunity, count(similar) AS SimilarityScore
ORDER BY SimilarityScore DESC LIMIT 10
```

## 🔮 Kịch bản Tương lai (Hướng phát triển tiếp theo)

### Kịch bản 3: Truy tìm đường đi ngắn nhất (Shortest Path)

Tính năng cho phép tìm kiếm cách thức để kết nối với một cá nhân bất kỳ trong mạng lưới.

```cypher
MATCH p = shortestPath((me:User {id: 'A'})-[*..4]-(target:User {id: 'K'}))
RETURN p
```

*Ghi chú: SQL hoàn toàn không có khả năng thực hiện Shortest Path một cách tự nhiên mà không dùng đệ quy (Recursive CTEs) cực kỳ rườm rà và chậm chạp.*

### Kịch bản 4: Phát hiện gian lận (Fraud/Bot Detection)

Phát hiện các mô hình vòng lặp (Cycles) hoặc cụm (Cliques) bất thường trong mạng lưới, ví dụ: 100 tài khoản follow chéo lẫn nhau và cùng like 1 bài viết trong cùng 1 giây. Việc phân tích "hình thái đồ thị" (Graph Morphology) là lãnh địa riêng của Graph Database.
