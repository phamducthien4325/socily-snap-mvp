const express = require('express');
const { getGraph } = require('../db');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { createNotification } = require('../utils/notificationHelper');

// ============================================
// GET /api/users/quick-match — Đề xuất bạn bè (SNAP MVP)
// Kết hợp: Common Neighbors + Adamic-Adar + Shared Features
// ============================================
router.get('/quick-match', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const graph = getGraph();

        // Bước 1: Shared Features Score
        const featureResult = await graph.query(`
            MATCH (u1:User {id: $userId})-[:HAS_FEATURE]->(f:Feature)<-[:HAS_FEATURE]-(u2:User)
            WHERE u1 <> u2 AND NOT (u1)-[:FOLLOWS]->(u2)
            RETURN u2.id as id, u2.username as username, u2.avatar as avatar,
                   collect(f.id) as sharedFeatures,
                   count(f) as featureScore
            ORDER BY featureScore DESC
            LIMIT 50
        `, { params: { userId: req.user.id } });

        const candidates = featureResult.data.map(row => ({
            id: row.id || row[0],
            username: row.username || row[1],
            avatar: row.avatar || row[2],
            sharedFeatures: row.sharedFeatures || row[3] || [],
            featureScore: parseFloat(row.featureScore || row[4] || 0)
        }));

        if (candidates.length === 0) {
            // Fallback: nếu không có feature match, lấy random users
            const fallback = await graph.query(`
                MATCH (u1:User {id: $userId}), (u2:User)
                WHERE u1 <> u2 AND NOT (u1)-[:FOLLOWS]->(u2)
                RETURN u2.id as id, u2.username as username, u2.avatar as avatar
                SKIP $skip LIMIT $limit
            `, { params: { userId: req.user.id, skip, limit } });

            const matches = fallback.data.map(row => ({
                id: row.id || row[0],
                username: row.username || row[1],
                avatar: row.avatar || row[2],
                sharedFeatures: [],
                matchScore: 0,
                commonCount: 0
            }));

            return res.json({ matches, hasMore: matches.length === limit });
        }

        // Bước 2: Tính Common Neighbors + Adamic-Adar cho từng candidate
        const enrichedCandidates = [];

        for (const candidate of candidates) {
            // Common Neighbors
            const cnResult = await graph.query(`
                MATCH (u1:User {id: $userId})-[:FOLLOWS]->(mutual)<-[:FOLLOWS]-(u2:User {id: $candidateId})
                RETURN count(mutual) as commonCount
            `, { params: { userId: req.user.id, candidateId: candidate.id } });
            
            const commonCount = cnResult.data.length > 0 
                ? (cnResult.data[0].commonCount || cnResult.data[0][0] || 0) 
                : 0;

            // Adamic-Adar (đơn giản hóa)
            const aaResult = await graph.query(`
                MATCH (u1:User {id: $userId})-[:FOLLOWS]->(mutual)<-[:FOLLOWS]-(u2:User {id: $candidateId})
                MATCH (mutual)-[:FOLLOWS]->(anyone)
                WITH mutual, count(anyone) AS degree
                RETURN sum(1.0 / log(degree + 2)) AS adamicAdar
            `, { params: { userId: req.user.id, candidateId: candidate.id } });

            const adamicAdar = aaResult.data.length > 0 
                ? parseFloat(aaResult.data[0].adamicAdar || aaResult.data[0][0] || 0) 
                : 0;

            // Hybrid Score: 0.3 × commonNeighbors + 0.3 × adamicAdar + 0.4 × featureScore(normalized)
            const maxFeature = Math.max(...candidates.map(c => c.featureScore), 1);
            const normalizedFeature = candidate.featureScore / maxFeature * 10;

            const matchScore = (0.3 * commonCount) + (0.3 * adamicAdar) + (0.4 * normalizedFeature);

            enrichedCandidates.push({
                ...candidate,
                commonCount: Number(commonCount),
                adamicAdar: parseFloat(adamicAdar.toFixed(3)),
                matchScore: parseFloat(matchScore.toFixed(3))
            });
        }

        // Sort by matchScore and paginate
        enrichedCandidates.sort((a, b) => b.matchScore - a.matchScore);
        const paged = enrichedCandidates.slice(skip, skip + limit);

        res.json({ 
            matches: paged, 
            hasMore: skip + limit < enrichedCandidates.length 
        });
    } catch (error) {
        console.error('Quick match error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// GET /api/users/search — Tìm kiếm người dùng (Advanced Graph Search)
// ============================================
router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json({ users: [] });

        const graph = getGraph();
        const query = `
            MATCH (u:User)
            WHERE u.username CONTAINS $q AND u.id <> $userId
            
            // 1. Common Followers (Bạn chung)
            OPTIONAL MATCH (u)<-[:FOLLOWS]-(mutual:User)<-[:FOLLOWS]-(me:User {id: $userId})
            WITH u, count(DISTINCT mutual) as commonFriends, me
            
            // 2. Shared Features
            OPTIONAL MATCH (u)-[:HAS_FEATURE]->(f:Feature)<-[:HAS_FEATURE]-(me)
            WITH u, commonFriends, me, count(f) as sharedFeatureScore
            
            // 3. Following Status
            OPTIONAL MATCH (me)-[fl:FOLLOWS]->(u)
            
            WITH u, commonFriends, sharedFeatureScore, fl IS NOT NULL as isFollowing,
                 (commonFriends * 2.0 + sharedFeatureScore) as relevanceScore
                 
            RETURN u.id as id, u.username as username, u.name as name, u.avatar as avatar, 
                   isFollowing, commonFriends, sharedFeatureScore, relevanceScore
            ORDER BY relevanceScore DESC, u.username ASC
            LIMIT 20
        `;
        const result = await graph.query(query, { params: { q, userId: req.user.id } });
        
        const users = result.data.map(row => ({
            id: row.id || row[0],
            username: row.username || row[1],
            name: row.name || row[2],
            avatar: row.avatar || row[3],
            isFollowing: row.isFollowing || row[4],
            commonFriends: row.commonFriends || row[5] || 0,
            sharedFeatureScore: row.sharedFeatureScore || row[6] || 0,
            relevanceScore: row.relevanceScore || row[7] || 0
        }));
        
        res.json({ users });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// POST /api/users/connect/:targetId — Follow người dùng
// ============================================
router.post('/connect/:targetId', auth, async (req, res) => {
    try {
        const { targetId } = req.params;
        const graph = getGraph();
        
        if (req.user.id === targetId) {
            return res.status(400).json({ error: 'Cannot connect to yourself' });
        }

        const query = `
            MATCH (u1:User {id: $userId}), (u2:User {id: $targetId})
            MERGE (u1)-[:FOLLOWS]->(u2)
            RETURN u2.username
        `;
        const result = await graph.query(query, { params: { userId: req.user.id, targetId } });
        
        if (result.data.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Notify
        await createNotification(req, targetId, 'connection', 'started following you', `/profile/${req.user.username}`);

        res.json({ message: 'Connected successfully' });
    } catch (error) {
        console.error('Connect error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// GET /api/users/:username — Lấy thông tin cá nhân
// ============================================
router.get('/:username', auth, async (req, res) => {
    try {
        const { username } = req.params;
        const graph = getGraph();

        const query = `
            MATCH (u:User {username: $username})
            OPTIONAL MATCH (u)-[:FOLLOWS]->(following:User)
            OPTIONAL MATCH (follower:User)-[:FOLLOWS]->(u)
            OPTIONAL MATCH (u)-[:POSTED]->(post:Post)
            RETURN u.id as id, u.username as username, u.name as name, u.role as role, u.avatar as avatar,
                   count(DISTINCT following) as followingCount,
                   count(DISTINCT follower) as followersCount,
                   count(DISTINCT post) as postsCount
        `;
        const result = await graph.query(query, { params: { username } });

        if (result.data.length === 0 || !result.data[0].id && !result.data[0][0]) {
            return res.status(404).json({ error: 'User not found' });
        }

        const row = result.data[0];
        const user = {
            id: row.id || row[0],
            username: row.username || row[1],
            name: row.name || row[2],
            role: row.role || row[3],
            avatar: row.avatar || row[4],
            followingCount: row.followingCount || row[5] || 0,
            followersCount: row.followersCount || row[6] || 0,
            postsCount: row.postsCount || row[7] || 0
        };

        let isFollowing = false;
        if (req.user.username !== username) {
            const followCheck = await graph.query(`
                MATCH (me:User {id: $userId})-[r:FOLLOWS]->(u:User {username: $username})
                RETURN r
            `, { params: { userId: req.user.id, username } });
            isFollowing = followCheck.data.length > 0;
        }

        res.json({ ...user, isFollowing });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// GET /api/users/:username/posts — Lấy bài viết của user
// ============================================
router.get('/:username/posts', auth, async (req, res) => {
    try {
        const { username } = req.params;
        const graph = getGraph();

        const query = `
            MATCH (u:User {username: $username})-[:POSTED]->(p:Post)
            OPTIONAL MATCH (p)-[:POSTED_IN]->(g:Group)
            OPTIONAL MATCH (me:User {id: $userId})-[:IN_GROUP]->(g)
            WITH u, p, g, me
            WHERE g IS NULL OR me IS NOT NULL
            OPTIONAL MATCH (liker:User)-[:LIKED]->(p)
            OPTIONAL MATCH (commenter:User)-[:COMMENTED]->(:Comment)-[:ON]->(p)
            OPTIONAL MATCH (me2:User {id: $userId})-[myLike:LIKED]->(p)
            RETURN p.id as id, p.content as content, p.timestamp as timestamp,
                   u.username as author_username, u.name as author_name,
                   g.name as group_name, g.id as group_id,
                   count(DISTINCT liker) as likes,
                   count(DISTINCT commenter) as comments,
                   myLike IS NOT NULL as isLikedByMe
            ORDER BY p.timestamp DESC
            LIMIT 50
        `;
        
        const result = await graph.query(query, { params: { username, userId: req.user.id } });
        
        const posts = result.data.map(row => ({
            id: row.id || row[0],
            content: row.content || row[1],
            timestamp: row.timestamp || row[2],
            author: {
                username: row.author_username || row[3],
                name: row.author_name || row[4]
            },
            group: (row.group_name || row[5]) ? { name: row.group_name || row[5], id: row.group_id || row[6] } : null,
            likes: row.likes || row[7] || 0,
            comments: row.comments || row[8] || 0,
            isLikedByMe: row.isLikedByMe || row[9] || false
        }));

        res.json({ posts });
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// GET /api/users/:username/features — Xem features của user
// ============================================
router.get('/:username/features', auth, async (req, res) => {
    try {
        const { username } = req.params;
        const graph = getGraph();
        const result = await graph.query(`
            MATCH (u:User {username: $username})-[:HAS_FEATURE]->(f:Feature)
            RETURN f.id as id
            LIMIT 20
        `, { params: { username } });

        const features = result.data.map(row => ({
            id: row.id || row[0]
        }));

        res.json({ features });
    } catch (error) {
        console.error('Get user features error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
