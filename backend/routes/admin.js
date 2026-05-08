const express = require('express');
const { getGraph } = require('../db');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');

// Middleware check admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ============================================
// GET /api/admin/users — Lấy danh sách người dùng
// ============================================
router.get('/users', auth, requireAdmin, async (req, res) => {
    try {
        const graph = getGraph();
        
        const query = `
            MATCH (u:User)
            OPTIONAL MATCH (u)-[:POSTED]->(p:Post)
            WITH u, count(p) as postCount
            RETURN u.id as id, u.username as username, u.email as email, u.name as name, 
                   u.role as role, u.status as status, postCount
            ORDER BY u.username
        `;
        
        const result = await graph.query(query);
        
        const users = result.data.map(row => ({
            id: row.id || row[0],
            username: row.username || row[1],
            email: row.email || row[2],
            name: row.name || row[3],
            role: row.role || row[4],
            status: row.status || row[5] || 'active',
            postCount: row.postCount || row[6] || 0
        }));

        res.json({ users });
    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// DELETE /api/admin/users/:id — Xóa người dùng và dữ liệu liên quan
// ============================================
router.delete('/users/:id', auth, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const graph = getGraph();
        
        if (req.user.id === userId) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }

        const query = `
            MATCH (u:User {id: $userId})
            OPTIONAL MATCH (u)-[:POSTED]->(p:Post)
            DETACH DELETE p
            DETACH DELETE u
        `;
        
        await graph.query(query, { params: { userId } });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// POST /api/admin/users/:id/ban — Cấm/Bỏ cấm người dùng
// ============================================
router.post('/users/:id/ban', auth, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { ban } = req.body; // true to ban, false to unban
        const graph = getGraph();
        
        if (req.user.id === userId) {
            return res.status(400).json({ error: 'Cannot ban yourself' });
        }

        const status = ban ? 'banned' : 'active';

        const query = `
            MATCH (u:User {id: $userId})
            SET u.status = $status
            RETURN u.username
        `;
        
        await graph.query(query, { params: { userId, status } });
        res.json({ message: `User ${ban ? 'banned' : 'unbanned'} successfully` });
    } catch (error) {
        console.error('Admin ban user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// GET /api/admin/posts — Lấy danh sách bài viết
// ============================================
router.get('/posts', auth, requireAdmin, async (req, res) => {
    try {
        const graph = getGraph();
        
        const query = `
            MATCH (p:Post)<-[:POSTED]-(u:User)
            RETURN p.id as id, p.content as content, p.timestamp as timestamp,
                   p.likes as likes, p.comments as comments,
                   u.username as author
            ORDER BY p.timestamp DESC
        `;
        
        const result = await graph.query(query);
        
        const posts = result.data.map(row => ({
            id: row.id || row[0],
            content: row.content || row[1],
            timestamp: row.timestamp || row[2],
            likes: row.likes || row[3] || 0,
            comments: row.comments || row[4] || 0,
            author: row.author || row[5]
        }));

        res.json({ posts });
    } catch (error) {
        console.error('Admin get posts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// DELETE /api/admin/posts/:id — Xóa bài viết
// ============================================
router.delete('/posts/:id', auth, requireAdmin, async (req, res) => {
    try {
        const postId = req.params.id;
        const graph = getGraph();
        
        const query = `
            MATCH (p:Post {id: $postId})
            DETACH DELETE p
        `;
        
        await graph.query(query, { params: { postId } });
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Admin delete post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
