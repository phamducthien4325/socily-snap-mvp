const express = require('express');
const router = express.Router();
const { getGraph } = require('../db');
const { auth } = require('../middleware/authMiddleware');

// GET /api/notifications — Lấy danh sách thông báo của user hiện tại
router.get('/', auth, async (req, res) => {
    try {
        const graph = getGraph();
        const result = await graph.query(`
            MATCH (n:Notification)-[:HAS_NOTIFICATION]->(target:User {id: $userId})
            MATCH (actor:User)-[:CREATED_NOTIFICATION]->(n)
            RETURN n.id AS id, n.type AS type, n.content AS content, 
                   n.link AS link, n.timestamp AS timestamp, n.read AS read,
                   actor.username AS actorUsername, actor.avatar AS actorAvatar, actor.id AS actorId
            ORDER BY n.timestamp DESC
            LIMIT 50
        `, { params: { userId: req.user.id } });

        const notifications = result.data.map(row => ({
            id: row.id,
            type: row.type,
            content: row.content,
            link: row.link,
            timestamp: row.timestamp,
            read: row.read,
            actor: {
                id: row.actorId,
                username: row.actorUsername,
                avatar: row.actorAvatar
            }
        }));

        res.json({ notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// PUT /api/notifications/:id/read — Đánh dấu 1 thông báo đã đọc
router.put('/:id/read', auth, async (req, res) => {
    try {
        const graph = getGraph();
        await graph.query(`
            MATCH (n:Notification {id: $notifId})-[:HAS_NOTIFICATION]->(target:User {id: $userId})
            SET n.read = true
        `, { params: { notifId: req.params.id, userId: req.user.id } });

        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// PUT /api/notifications/read-all — Đánh dấu tất cả đã đọc
router.put('/read-all', auth, async (req, res) => {
    try {
        const graph = getGraph();
        await graph.query(`
            MATCH (n:Notification)-[:HAS_NOTIFICATION]->(target:User {id: $userId})
            WHERE n.read = false
            SET n.read = true
        `, { params: { userId: req.user.id } });

        res.json({ success: true });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

// DELETE /api/notifications/:id — Xoá 1 thông báo
router.delete('/:id', auth, async (req, res) => {
    try {
        const graph = getGraph();
        await graph.query(`
            MATCH (n:Notification {id: $notifId})-[:HAS_NOTIFICATION]->(target:User {id: $userId})
            DETACH DELETE n
        `, { params: { notifId: req.params.id, userId: req.user.id } });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

module.exports = router;
