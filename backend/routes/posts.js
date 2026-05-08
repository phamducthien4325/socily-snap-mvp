const express = require('express');
const { getGraph } = require('../db');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { createNotification } = require('../utils/notificationHelper');

// ============================================
// GET /api/posts — Lấy tất cả bài viết (Smart Feed)
// ============================================
router.get('/', auth, async (req, res) => {
    try {
        const graph = getGraph();
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const groupId = req.query.groupId;

        let query;

        if (groupId) {
            // Lấy bài viết trong 1 group cụ thể (kiểm tra quyền truy cập)
            query = `
                MATCH (me:User {id: $userId})-[:IN_GROUP]->(g:Group {id: $groupId})
                MATCH (u:User)-[:POSTED]->(p:Post)-[:POSTED_IN]->(g)
                OPTIONAL MATCH (me)-[liked:LIKED]->(p)
                RETURN p.id as id, p.content as content, p.likes as likes, p.comments as comments, p.timestamp as timestamp,
                       u.username as handle, u.name as name, u.avatar as avatar, u.id as authorId,
                       g.name as groupName, g.id as groupId,
                       liked IS NOT NULL AS likedByMe, 1.0 AS feedScore
                ORDER BY p.timestamp DESC
                SKIP $skip LIMIT $limit
            `;
        } else {
            // Smart Feed: Lấy tất cả bài viết mà user có quyền xem
            // Dùng OPTIONAL MATCH + filter null thay cho EXISTS (FalkorDB không hỗ trợ)
            query = `
                MATCH (u:User)-[:POSTED]->(p:Post)
                OPTIONAL MATCH (p)-[:POSTED_IN]->(g:Group)
                OPTIONAL MATCH (me:User {id: $userId})-[:IN_GROUP]->(g)
                OPTIONAL MATCH (me2:User {id: $userId})-[:FOLLOWS]->(u)
                WITH u, p, g, me, me2
                WHERE 
                    (g IS NOT NULL AND me IS NOT NULL)
                    OR
                    (g IS NULL AND (me2 IS NOT NULL OR u.id = $userId))
                
                WITH p, u, g
                OPTIONAL MATCH (liker:User {id: $userId})-[liked:LIKED]->(p)

                WITH p, u, g, liked IS NOT NULL AS likedByMe,
                     ($now - p.timestamp) / 3600000.0 AS hoursSincePost

                WITH p, u, g, likedByMe, hoursSincePost,
                     1.0 / (1.0 + (CASE WHEN hoursSincePost < 0 THEN 0 ELSE hoursSincePost END) / 24.0) AS feedScore

                RETURN p.id as id, p.content as content, p.likes as likes, p.comments as comments, p.timestamp as timestamp,
                       u.username as handle, u.name as name, u.avatar as avatar, u.id as authorId,
                       g.name as groupName, g.id as groupId,
                       likedByMe, feedScore
                ORDER BY feedScore DESC, p.timestamp DESC
                SKIP $skip LIMIT $limit
            `;
        }
        
        const result = await graph.query(query, { 
            params: { 
                userId: req.user.id,
                now: Date.now(),
                skip,
                limit,
                ...(groupId && { groupId })
            } 
        });
        
        const posts = result.data.map(row => ({
            id: row.id || row[0],
            content: row.content || row[1],
            likes: row.likes || row[2] || 0,
            comments: row.comments || row[3] || 0,
            timestamp: row.timestamp || row[4],
            user: {
                id: row.authorId || row[8],
                handle: '@' + (row.handle || row[5]),
                name: row.name || row[6],
                avatar: row.avatar || row[7] || (row.name || row[6])?.charAt(0) || 'U'
            },
            group: (row.groupId || row[10]) ? {
                id: row.groupId || row[10],
                name: row.groupName || row[9]
            } : null,
            likedByMe: row.likedByMe || row[11] || false,
            feedScore: row.feedScore || row[12] || 0
        }));
        
        res.json({ 
            posts,
            hasMore: posts.length === limit
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// GET /api/posts/groups — Lấy danh sách group để chọn khi tạo post
// ============================================
router.get('/groups', auth, async (req, res) => {
    try {
        const graph = getGraph();
        const result = await graph.query(`
            MATCH (u:User {id: $userId})-[:IN_GROUP]->(g:Group)
            RETURN g.id as id, g.name as name
            ORDER BY g.name
        `, { params: { userId: req.user.id } });
        
        const groups = result.data.map(row => ({
            id: row.id || row[0],
            name: row.name || row[1]
        }));
        
        res.json({ groups });
    } catch (error) {
        console.error('Get groups for post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// POST /api/posts — Tạo bài viết
// ============================================
router.post('/', auth, async (req, res) => {
    try {
        const { content, groupId } = req.body;
        if (!content) return res.status(400).json({ error: 'Content is required' });

        const graph = getGraph();
        const postId = 'post_' + Date.now().toString();
        const timestamp = Date.now();

        if (groupId) {
            const checkQuery = `MATCH (u:User {id: $userId})-[:IN_GROUP]->(g:Group {id: $groupId}) RETURN g`;
            const check = await graph.query(checkQuery, { params: { userId: req.user.id, groupId } });
            if (check.data.length === 0) return res.status(403).json({ error: 'Must be member of group to post' });

            const query = `
                MATCH (u:User {id: $userId}), (g:Group {id: $groupId})
                CREATE (p:Post {id: $postId, content: $content, likes: 0, comments: 0, timestamp: $timestamp})
                CREATE (u)-[:POSTED]->(p)
                CREATE (p)-[:POSTED_IN]->(g)
                RETURN p.id as id
            `;
            await graph.query(query, { params: { userId: req.user.id, groupId, postId, content, timestamp } });
        } else {
            const query = `
                MATCH (u:User {id: $userId})
                CREATE (p:Post {id: $postId, content: $content, likes: 0, comments: 0, timestamp: $timestamp})
                CREATE (u)-[:POSTED]->(p)
                RETURN p.id as id
            `;
            await graph.query(query, { params: { userId: req.user.id, postId, content, timestamp } });
        }
        
        res.status(201).json({ message: 'Post created', id: postId });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// POST /api/posts/:id/like — Like bài viết
// ============================================
router.post('/:id/like', auth, async (req, res) => {
    try {
        const graph = getGraph();
        const postId = req.params.id;

        const check = await graph.query(
            `MATCH (u:User {id: $userId})-[r:LIKED]->(p:Post {id: $postId}) RETURN r`,
            { params: { userId: req.user.id, postId } }
        );

        if (check.data.length > 0) {
            return res.status(400).json({ error: 'Already liked' });
        }

        const authorRes = await graph.query(`
            MATCH (u:User {id: $userId}), (p:Post {id: $postId})<-[:POSTED]-(author:User)
            CREATE (u)-[:LIKED]->(p)
            SET p.likes = p.likes + 1
            RETURN author.id as authorId
        `, { params: { userId: req.user.id, postId } });

        if (authorRes.data.length > 0) {
            const authorId = authorRes.data[0].authorId || authorRes.data[0][0];
            await createNotification(req, authorId, 'like', 'liked your post', `/profile/${req.user.username}`);
        }

        res.json({ message: 'Liked' });
    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// POST /api/posts/:id/unlike — Bỏ like bài viết
// ============================================
router.post('/:id/unlike', auth, async (req, res) => {
    try {
        const graph = getGraph();
        const postId = req.params.id;

        await graph.query(`
            MATCH (u:User {id: $userId})-[r:LIKED]->(p:Post {id: $postId})
            DELETE r
            SET p.likes = p.likes - 1
        `, { params: { userId: req.user.id, postId } });

        res.json({ message: 'Unliked' });
    } catch (error) {
        console.error('Unlike error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// POST /api/posts/:id/comment — Comment bài viết
// ============================================
router.post('/:id/comment', auth, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: 'Content is required' });

        const graph = getGraph();
        const postId = req.params.id;
        const commentId = 'cmt_' + Date.now().toString();

        const authorRes = await graph.query(`
            MATCH (u:User {id: $userId}), (p:Post {id: $postId})<-[:POSTED]-(author:User)
            CREATE (cm:Comment {id: $commentId, content: $content, timestamp: $timestamp})
            CREATE (u)-[:COMMENTED]->(cm)
            CREATE (cm)-[:ON]->(p)
            SET p.comments = p.comments + 1
            RETURN author.id as authorId
        `, { params: { userId: req.user.id, postId, commentId, content, timestamp: Date.now() } });

        if (authorRes.data.length > 0) {
            const authorId = authorRes.data[0].authorId || authorRes.data[0][0];
            await createNotification(req, authorId, 'comment', 'commented on your post', `/profile/${req.user.username}`);
        }

        res.json({ message: 'Commented', id: commentId });
    } catch (error) {
        console.error('Comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// POST /api/posts/:id/share — Share bài viết
// ============================================
router.post('/:id/share', auth, async (req, res) => {
    try {
        const graph = getGraph();
        const postId = req.params.id;

        const check = await graph.query(
            `MATCH (u:User {id: $userId})-[r:SHARED]->(p:Post {id: $postId}) RETURN r`,
            { params: { userId: req.user.id, postId } }
        );

        if (check.data.length > 0) {
            return res.status(400).json({ error: 'Already shared' });
        }

        await graph.query(`
            MATCH (u:User {id: $userId}), (p:Post {id: $postId})
            CREATE (u)-[:SHARED]->(p)
        `, { params: { userId: req.user.id, postId } });

        res.json({ message: 'Shared' });
    } catch (error) {
        console.error('Share error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// GET /api/posts/:id/comments — Lấy comments của bài viết
// ============================================
router.get('/:id/comments', auth, async (req, res) => {
    try {
        const graph = getGraph();
        const postId = req.params.id;

        const result = await graph.query(`
            MATCH (u:User)-[:COMMENTED]->(cm:Comment)-[:ON]->(p:Post {id: $postId})
            RETURN cm.id as id, cm.content as content, cm.timestamp as timestamp,
                   u.username as username, u.avatar as avatar
            ORDER BY cm.timestamp ASC
        `, { params: { postId } });

        const comments = result.data.map(row => ({
            id: row.id || row[0],
            content: row.content || row[1],
            timestamp: row.timestamp || row[2],
            user: {
                username: row.username || row[3],
                avatar: row.avatar || row[4]
            }
        }));

        res.json({ comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// GET /api/posts/search — Tìm kiếm bài viết
// ============================================
router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json({ posts: [] });

        const graph = getGraph();
        
        const query = `
            MATCH (u:User)-[:POSTED]->(p:Post)
            WHERE p.content CONTAINS $q
            OPTIONAL MATCH (p)-[:POSTED_IN]->(g:Group)
            OPTIONAL MATCH (me:User {id: $userId})-[:IN_GROUP]->(g)
            WITH u, p, g, me
            WHERE g IS NULL OR me IS NOT NULL
            OPTIONAL MATCH (me2:User {id: $userId})-[liked:LIKED]->(p)
            RETURN p.id as id, p.content as content, p.timestamp as timestamp,
                   p.likes as likes, p.comments as comments,
                   u.username as handle, u.name as name, u.avatar as avatar, u.id as authorId,
                   g.name as groupName, g.id as groupId,
                   liked IS NOT NULL as likedByMe
            ORDER BY p.timestamp DESC
            LIMIT 20
        `;
        
        const result = await graph.query(query, { params: { q, userId: req.user.id } });
        
        const posts = result.data.map(row => ({
            id: row.id || row[0],
            content: row.content || row[1],
            timestamp: row.timestamp || row[2],
            likes: row.likes || row[3] || 0,
            comments: row.comments || row[4] || 0,
            user: {
                handle: '@' + (row.handle || row[5]),
                name: row.name || row[6],
                avatar: row.avatar || row[7] || (row.name || row[6])?.charAt(0) || 'U',
                id: row.authorId || row[8]
            },
            group: (row.groupId || row[10]) ? {
                name: row.groupName || row[9],
                id: row.groupId || row[10]
            } : null,
            likedByMe: row.likedByMe || row[11] || false
        }));
        
        res.json({ posts });
    } catch (error) {
        console.error('Search posts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
