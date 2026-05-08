const express = require('express');
const { getGraph } = require('../db');
const router = express.Router();

const { auth, isAdmin } = require('../middleware/authMiddleware');

// ============================================
// MODULE 1: Graph Statistics
// ============================================
router.get('/stats', [auth, isAdmin], async (req, res) => {
    try {
        const graph = getGraph();
        
        // Đếm từng loại node
        const userCount = await graph.query(`MATCH (u:User) RETURN count(u) AS c`);
        const interestCount = await graph.query(`MATCH (i:Interest) RETURN count(i) AS c`);
        const communityCount = await graph.query(`MATCH (c:Community) RETURN count(c) AS c`);
        const postCount = await graph.query(`MATCH (p:Post) RETURN count(p) AS c`);
        
        // Đếm từng loại edge
        const hasInterestCount = await graph.query(`MATCH ()-[r:HAS_INTEREST]->() RETURN count(r) AS c`);
        const belongsToCount = await graph.query(`MATCH ()-[r:BELONGS_TO]->() RETURN count(r) AS c`);
        const relatedToCount = await graph.query(`MATCH ()-[r:RELATED_TO]->() RETURN count(r) AS c`);
        const followsCount = await graph.query(`MATCH ()-[r:FOLLOWS]->() RETURN count(r) AS c`);
        const postedCount = await graph.query(`MATCH ()-[r:POSTED]->() RETURN count(r) AS c`);
        const postedInCount = await graph.query(`MATCH ()-[r:POSTED_IN]->() RETURN count(r) AS c`);
        const likedCount = await graph.query(`MATCH ()-[r:LIKED]->() RETURN count(r) AS c`);

        const extract = (result) => {
            if (result.data.length === 0) return 0;
            const row = result.data[0];
            return row.c !== undefined ? Number(row.c) : Number(row[0]);
        };

        const nodes = {
            users: extract(userCount),
            interests: extract(interestCount),
            communities: extract(communityCount),
            posts: extract(postCount)
        };

        const edges = {
            has_interest: extract(hasInterestCount),
            belongs_to: extract(belongsToCount),
            related_to: extract(relatedToCount),
            follows: extract(followsCount),
            posted: extract(postedCount),
            posted_in: extract(postedInCount),
            liked: extract(likedCount)
        };

        const totalNodes = Object.values(nodes).reduce((sum, count) => sum + count, 0);
        const totalEdges = Object.values(edges).reduce((sum, count) => sum + count, 0);
        const density = totalNodes > 1 ? (totalEdges / (totalNodes * (totalNodes - 1))).toFixed(6) : 0;

        res.json({ nodes, edges, totalNodes, totalEdges, density });
    } catch (error) {
        console.error('Graph stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// MODULE 2: Graph Visualization
// ============================================
router.get('/visualization', [auth, isAdmin], async (req, res) => {
    try {
        const graph = getGraph();

        // Lấy tất cả nodes
        const usersResult = await graph.query(`MATCH (u:User) RETURN u.id AS id, u.username AS name, 'User' AS type LIMIT 50`);
        const interestsResult = await graph.query(`MATCH (i:Interest) RETURN i.name AS id, i.name AS name, 'Interest' AS type LIMIT 30`);
        const communitiesResult = await graph.query(`MATCH (c:Community) RETURN c.id AS id, c.name AS name, 'Community' AS type LIMIT 20`);

        // Lấy tất cả edges
        const hiResult = await graph.query(`MATCH (u:User)-[:HAS_INTEREST]->(i:Interest) RETURN u.id AS source, i.name AS target, 'HAS_INTEREST' AS type LIMIT 100`);
        const btResult = await graph.query(`MATCH (u:User)-[:BELONGS_TO]->(c:Community) RETURN u.id AS source, c.id AS target, 'BELONGS_TO' AS type LIMIT 100`);
        const rtResult = await graph.query(`MATCH (c:Community)-[:RELATED_TO]->(i:Interest) RETURN c.id AS source, i.name AS target, 'RELATED_TO' AS type LIMIT 100`);
        const fResult = await graph.query(`MATCH (a:User)-[:FOLLOWS]->(b:User) RETURN a.id AS source, b.id AS target, 'FOLLOWS' AS type LIMIT 100`);

        const extractNodes = (result, type) => result.data.map(row => ({
            id: row.id || row[0],
            name: row.name || row[1],
            type: type || row.type || row[2]
        }));

        const extractLinks = (result, type) => result.data.map(row => ({
            source: row.source || row[0],
            target: row.target || row[1],
            type: type || row.type || row[2]
        }));

        const nodes = [
            ...extractNodes(usersResult, 'User'),
            ...extractNodes(interestsResult, 'Interest'),
            ...extractNodes(communitiesResult, 'Community')
        ];

        const links = [
            ...extractLinks(hiResult, 'HAS_INTEREST'),
            ...extractLinks(btResult, 'BELONGS_TO'),
            ...extractLinks(rtResult, 'RELATED_TO'),
            ...extractLinks(fResult, 'FOLLOWS')
        ];

        res.json({ nodes, links });
    } catch (error) {
        console.error('Graph visualization error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// MODULE 3: Cypher Query Playground
// ============================================
router.post('/query', [auth, isAdmin], async (req, res) => {
    try {
        const { cypher } = req.body;
        if (!cypher) return res.status(400).json({ error: 'Cypher query is required' });

        // Whitelist: chỉ cho phép đọc (MATCH, RETURN), chặn ghi/xóa
        const forbidden = ['CREATE', 'DELETE', 'DETACH', 'DROP', 'SET', 'REMOVE', 'MERGE'];
        const upper = cypher.toUpperCase().trim();
        for (const keyword of forbidden) {
            if (upper.includes(keyword)) {
                return res.status(403).json({ error: `Lệnh "${keyword}" không được phép. Chỉ hỗ trợ truy vấn đọc (MATCH/RETURN).` });
            }
        }

        const graph = getGraph();
        const startTime = performance.now();
        const result = await graph.query(cypher);
        const executionTime = (performance.now() - startTime).toFixed(2);

        res.json({
            data: result.data,
            columns: result.header || [],
            rowCount: result.data.length,
            executionTimeMs: executionTime
        });
    } catch (error) {
        console.error('Cypher query error:', error);
        res.status(400).json({ error: error.message || 'Invalid Cypher query' });
    }
});

// ============================================
// MODULE 4: Performance Benchmark
// ============================================
router.post('/benchmark', [auth, isAdmin], async (req, res) => {
    try {
        const graph = getGraph();
        const results = [];

        // Seed benchmark data: tạo 50 user + quan hệ FOLLOWS ngẫu nhiên
        const seedStart = performance.now();
        
        // Tạo benchmark users
        for (let i = 1; i <= 50; i++) {
            await graph.query(
                `MERGE (u:User {id: $id, username: $name})`,
                { params: { id: `bench_${i}`, name: `bench_user_${i}` } }
            );
        }
        
        // Tạo quan hệ FOLLOWS ngẫu nhiên (mỗi user follow 3-5 người)
        for (let i = 1; i <= 50; i++) {
            const numFollows = 3 + Math.floor(Math.random() * 3);
            for (let j = 0; j < numFollows; j++) {
                let target = Math.floor(Math.random() * 50) + 1;
                if (target === i) target = (target % 50) + 1;
                await graph.query(
                    `MATCH (a:User {id: $src}), (b:User {id: $tgt}) MERGE (a)-[:FOLLOWS]->(b)`,
                    { params: { src: `bench_${i}`, tgt: `bench_${target}` } }
                );
            }
        }

        // Tạo interests và gắn cho benchmark users
        const interests = ['Music', 'Gaming', 'Coding', 'AI', 'Design', 'Sports', 'Travel', 'Food'];
        for (const interest of interests) {
            await graph.query(`MERGE (i:Interest {name: $name})`, { params: { name: interest } });
        }
        for (let i = 1; i <= 50; i++) {
            const numInterests = 2 + Math.floor(Math.random() * 3);
            for (let j = 0; j < numInterests; j++) {
                const interest = interests[Math.floor(Math.random() * interests.length)];
                await graph.query(
                    `MATCH (u:User {id: $uid}), (i:Interest {name: $iname}) MERGE (u)-[:HAS_INTEREST]->(i)`,
                    { params: { uid: `bench_${i}`, iname: interest } }
                );
            }
        }

        const seedTime = (performance.now() - seedStart).toFixed(2);

        // --- Benchmark 1: 1-hop (Bạn bè trực tiếp) ---
        const t1 = performance.now();
        const r1 = await graph.query(
            `MATCH (u:User {id: 'bench_1'})-[:FOLLOWS]->(friend) RETURN friend.username AS name, friend.id AS id`
        );
        const time1 = (performance.now() - t1).toFixed(2);
        results.push({
            name: '1-hop: Bạn bè trực tiếp',
            query: "MATCH (u)-[:FOLLOWS]->(friend) RETURN friend",
            description: 'Tìm tất cả người mà user follow trực tiếp',
            timeMs: time1,
            resultCount: r1.data.length,
            sqlEquivalent: 'SELECT * FROM follows WHERE user_id = ? (1 JOIN)'
        });

        // --- Benchmark 2: 2-hop (Bạn của bạn) ---
        const t2 = performance.now();
        const r2 = await graph.query(
            `MATCH (u:User {id: 'bench_1'})-[:FOLLOWS]->()-[:FOLLOWS]->(fof) WHERE fof <> u AND NOT (u)-[:FOLLOWS]->(fof) RETURN DISTINCT fof.username AS name LIMIT 20`
        );
        const time2 = (performance.now() - t2).toFixed(2);
        results.push({
            name: '2-hop: Bạn của bạn',
            query: "MATCH (u)-[:FOLLOWS]->()-[:FOLLOWS]->(fof) RETURN fof",
            description: 'Tìm bạn của bạn (friend-of-friend) chưa follow',
            timeMs: time2,
            resultCount: r2.data.length,
            sqlEquivalent: 'SELECT * FROM follows f1 JOIN follows f2 ON f1.target = f2.user_id WHERE ... (2 JOINs)'
        });

        // --- Benchmark 3: 3-hop (Cách 3 bước) ---
        const t3 = performance.now();
        const r3 = await graph.query(
            `MATCH (u:User {id: 'bench_1'})-[:FOLLOWS]->(a)-[:FOLLOWS]->(b)-[:FOLLOWS]->(distant) WHERE distant <> u RETURN DISTINCT distant.username AS name LIMIT 20`
        );
        const time3 = (performance.now() - t3).toFixed(2);
        results.push({
            name: '3-hop: Cách 3 bước',
            query: "MATCH (u)-[:FOLLOWS]->(a)-[:FOLLOWS]->(b)-[:FOLLOWS]->(distant) RETURN distant",
            description: 'Tìm người cách 3 bước nhảy trong mạng lưới',
            timeMs: time3,
            resultCount: r3.data.length,
            sqlEquivalent: 'SELECT * FROM follows f1 JOIN follows f2 ON f1.target_id = f2.user_id JOIN follows f3 ON f2.target_id = f3.user_id (3 JOINs liên tiếp)'
        });

        // --- Benchmark 4: Mutual Connections (Bạn chung) ---
        const t4 = performance.now();
        const r4 = await graph.query(
            `MATCH (a:User {id: 'bench_1'})-[:FOLLOWS]->(mutual)<-[:FOLLOWS]-(b:User {id: 'bench_25'}) RETURN mutual.username AS name`
        );
        const time4 = (performance.now() - t4).toFixed(2);
        results.push({
            name: 'Mutual Connections (Bạn chung)',
            query: "MATCH (a)-[:FOLLOWS]->(mutual)<-[:FOLLOWS]-(b) RETURN mutual",
            description: 'Tìm bạn chung giữa 2 user — truy vấn kinh điển của Graph DB',
            timeMs: time4,
            resultCount: r4.data.length,
            sqlEquivalent: 'SELECT * FROM follows f1 INNER JOIN follows f2 ON f1.target_id = f2.target_id WHERE f1.user_id=? AND f2.user_id=? (2 JOINs + subquery)'
        });

        // --- Benchmark 5: Gợi ý dựa trên sở thích chung ---
        const t5 = performance.now();
        const r5 = await graph.query(
            `MATCH (u:User {id: 'bench_1'})-[:HAS_INTEREST]->(i:Interest)<-[:HAS_INTEREST]-(other:User) WHERE other <> u RETURN other.username AS name, collect(i.name) AS sharedInterests, count(i) AS score ORDER BY score DESC LIMIT 10`
        );
        const time5 = (performance.now() - t5).toFixed(2);
        results.push({
            name: 'Interest-based Matching',
            query: "MATCH (u)-[:HAS_INTEREST]->(i)<-[:HAS_INTEREST]-(other) RETURN other, count(i)",
            description: 'Gợi ý kết bạn dựa trên sở thích chung (Graph Traversal)',
            timeMs: time5,
            resultCount: r5.data.length,
            sqlEquivalent: 'SELECT * FROM user_interests ui1 JOIN user_interests ui2 ON ui1.interest_id = ui2.interest_id WHERE ... GROUP BY ... (2 JOINs + GROUP BY)'
        });

        res.json({
            seedInfo: {
                usersCreated: 50,
                followRelations: '150-250 (random)',
                interestsLinked: '100-150 (random)',
                seedTimeMs: seedTime
            },
            benchmarks: results
        });
    } catch (error) {
        console.error('Benchmark error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
