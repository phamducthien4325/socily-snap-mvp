const express = require('express');
const { getGraph } = require('../db');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');

// ============================================
// POST /api/search/recent — Lưu lịch sử tìm kiếm
// ============================================
router.post('/recent', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Search text is required' });
        }

        const graph = getGraph();
        
        // Cập nhật hoặc tạo mới SearchTerm và link với User
        // Sử dụng timestamp milliseconds
        await graph.query(`
            MERGE (t:SearchTerm {text: $text})
            WITH t
            MATCH (u:User {id: $userId})
            MERGE (u)-[r:SEARCHED]->(t)
            SET r.timestamp = $timestamp
        `, { 
            params: { 
                text: text.trim().toLowerCase(),
                userId: req.user.id,
                timestamp: Date.now()
            } 
        });

        res.json({ message: 'Search history saved' });
    } catch (error) {
        console.error('Save recent search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// GET /api/search/recent — Lấy lịch sử tìm kiếm gần đây của user
// ============================================
router.get('/recent', auth, async (req, res) => {
    try {
        const graph = getGraph();
        
        const result = await graph.query(`
            MATCH (u:User {id: $userId})-[r:SEARCHED]->(t:SearchTerm)
            RETURN t.text as text, r.timestamp as timestamp
            ORDER BY r.timestamp DESC
            LIMIT 5
        `, { 
            params: { userId: req.user.id } 
        });

        const recentSearches = result.data.map(row => ({
            text: row.text || row[0],
            timestamp: row.timestamp || row[1]
        }));

        res.json({ recentSearches });
    } catch (error) {
        console.error('Get recent searches error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// GET /api/search/trending — Lấy các từ khóa được tìm kiếm nhiều nhất (Trending)
// ============================================
router.get('/trending', auth, async (req, res) => {
    try {
        const graph = getGraph();
        
        // Lấy 5 từ khóa được search nhiều nhất trên hệ thống
        const result = await graph.query(`
            MATCH (u:User)-[r:SEARCHED]->(t:SearchTerm)
            RETURN t.text as text, count(r) as weight
            ORDER BY weight DESC, text ASC
            LIMIT 5
        `);

        const trendingSearches = result.data.map(row => ({
            text: row.text || row[0],
            weight: row.weight || row[1]
        }));

        res.json({ trendingSearches });
    } catch (error) {
        console.error('Get trending searches error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// DELETE /api/search/recent/:text — Xóa 1 từ khóa khỏi lịch sử tìm kiếm (Optional, useful for UX)
// ============================================
router.delete('/recent/:text', auth, async (req, res) => {
    try {
        const text = req.params.text;
        const graph = getGraph();
        
        await graph.query(`
            MATCH (u:User {id: $userId})-[r:SEARCHED]->(t:SearchTerm {text: $text})
            DELETE r
        `, { 
            params: { 
                userId: req.user.id,
                text: text.toLowerCase()
            } 
        });

        res.json({ message: 'Removed from history' });
    } catch (error) {
        console.error('Delete recent search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
