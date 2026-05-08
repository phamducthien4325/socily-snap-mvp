const express = require('express');
const { getGraph } = require('../db');
const router = express.Router();

const { auth } = require('../middleware/authMiddleware');

// Create a group
router.post('/', auth, async (req, res) => {
    try {
        const { name, description } = req.body;
        const graph = getGraph();
        const groupId = Date.now().toString();

        const query = `
            CREATE (g:Group {id: $id, name: $name, description: $description, type: 'private'})
            WITH g
            MATCH (u:User {id: $userId})
            CREATE (u)-[:IN_GROUP {role: 'admin'}]->(g)
            RETURN g
        `;
        
        await graph.query(query, { params: { id: groupId, name, description, userId: req.user.id } });

        res.status(201).json({ message: 'Group created', id: groupId });
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Join Group
router.post('/:id/join', auth, async (req, res) => {
    try {
        const graph = getGraph();
        const groupId = req.params.id;

        const checkQuery = `MATCH (u:User {id: $userId})-[r]->(g:Group {id: $groupId}) WHERE type(r) = 'IN_GROUP' OR type(r) = 'BANNED_FROM' RETURN type(r) as relType`;
        const check = await graph.query(checkQuery, { params: { userId: req.user.id, groupId } });
        
        if (check.data.length > 0) {
            const relType = check.data[0].relType || check.data[0][0];
            if (relType === 'BANNED_FROM') return res.status(403).json({ error: 'You are banned from this group' });
            return res.status(400).json({ error: 'Already a member' });
        }

        const query = `
            MATCH (u:User {id: $userId}), (g:Group {id: $groupId})
            CREATE (u)-[:IN_GROUP {role: 'member'}]->(g)
            RETURN g
        `;
        await graph.query(query, { params: { userId: req.user.id, groupId } });
        res.json({ message: 'Joined group successfully' });
    } catch (error) {
        console.error('Join group error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Leave Group
router.post('/:id/leave', auth, async (req, res) => {
    try {
        const graph = getGraph();
        const groupId = req.params.id;

        const query = `
            MATCH (u:User {id: $userId})-[r:IN_GROUP]->(g:Group {id: $groupId})
            DELETE r
        `;
        await graph.query(query, { params: { userId: req.user.id, groupId } });
        res.json({ message: 'Left group successfully' });
    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/groups/my-groups
router.get('/my-groups', auth, async (req, res) => {
    try {
        const graph = getGraph();
        const query = `
            MATCH (u:User {id: $userId})-[b:IN_GROUP]->(g:Group)
            OPTIONAL MATCH (member:User)-[:IN_GROUP]->(g)
            RETURN g.id as id, g.name as name, g.description as description, count(DISTINCT member) as memberCount, b.role as role
            ORDER BY g.name ASC
        `;
        const result = await graph.query(query, { params: { userId: req.user.id } });
        
        const groups = result.data.map(row => ({
            id: row.id || row[0],
            name: row.name || row[1],
            description: row.description || row[2],
            memberCount: row.memberCount || row[3] || 0,
            role: row.role || row[4]
        }));
        
        res.json({ groups }); // Return {groups: []} to be compatible with frontend logic after refactor
    } catch (error) {
        console.error('Get my groups error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/groups/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const graph = getGraph();
        
        const query = `
            MATCH (g:Group {id: $id})
            OPTIONAL MATCH (member:User)-[:IN_GROUP]->(g)
            OPTIONAL MATCH (me:User {id: $userId})-[b:IN_GROUP]->(g)
            RETURN g.id as id, g.name as name, g.description as description, count(DISTINCT member) as memberCount,
                   b IS NOT NULL as isMember,
                   b.role as myRole
        `;
        const result = await graph.query(query, { params: { id, userId: req.user.id } });
        
        if (result.data.length === 0 || (!result.data[0].id && !result.data[0][0])) {
            return res.status(404).json({ error: 'Group not found' });
        }
        
        const row = result.data[0];
        
        const group = {
            id: row.id || row[0],
            name: row.name || row[1],
            description: row.description || row[2],
            memberCount: row.memberCount || row[3] || 0,
            isMember: row.isMember || row[4] || false,
            myRole: row.myRole || row[5] || null
        };
        
        res.json({ group });
    } catch (error) {
        console.error('Get group error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/groups/:id/posts
router.get('/:id/posts', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const graph = getGraph();
        
        // Ensure user is in group before fetching posts
        const checkQuery = `MATCH (u:User {id: $userId})-[:IN_GROUP]->(g:Group {id: $id}) RETURN g`;
        const check = await graph.query(checkQuery, { params: { userId: req.user.id, id } });
        if (check.data.length === 0) {
            return res.status(403).json({ error: 'You must be a member to view posts' });
        }

        const query = `
            MATCH (p:Post)-[:POSTED_IN]->(g:Group {id: $id})
            MATCH (u:User)-[:POSTED]->(p)
            OPTIONAL MATCH (me:User {id: $userId})-[liked:LIKED]->(p)
            RETURN p.id as id, p.content as content, p.timestamp as timestamp, p.likes as likes, p.comments as comments,
                   u.id as authorId, u.username as handle, u.name as name, u.avatar as avatar,
                   g.name as groupName, g.id as groupId,
                   liked IS NOT NULL as likedByMe
            ORDER BY p.timestamp DESC
            SKIP $skip LIMIT $limit
        `;
        
        const result = await graph.query(query, { params: { id, userId: req.user.id, skip, limit } });
        
        const posts = result.data.map(row => ({
            id: row.id || row[0],
            content: row.content || row[1],
            timestamp: row.timestamp || row[2],
            likes: row.likes || row[3] || 0,
            comments: row.comments || row[4] || 0,
            user: {
                id: row.authorId || row[5],
                handle: '@' + (row.handle || row[6]),
                name: row.name || row[7],
                avatar: row.avatar || row[8] || (row.name || row[7])?.charAt(0) || 'U'
            },
            group: {
                name: row.groupName || row[9],
                id: row.groupId || row[10]
            },
            likedByMe: row.likedByMe || row[11] || false
        }));
        
        res.json({ posts, hasMore: posts.length === limit });
    } catch (error) {
        console.error('Get group posts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/groups/search
router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json({ groups: [] });

        const graph = getGraph();
        const query = `
            MATCH (g:Group)
            WHERE g.name CONTAINS $q
            OPTIONAL MATCH (me:User {id: $userId})-[b:IN_GROUP]->(g)
            OPTIONAL MATCH (member:User)-[:IN_GROUP]->(g)
            RETURN g.id as id, g.name as name, g.description as description,
                   count(DISTINCT member) as memberCount,
                   b IS NOT NULL as isMember
            ORDER BY memberCount DESC
            LIMIT 20
        `;
        const result = await graph.query(query, { params: { q, userId: req.user.id } });

        const groups = result.data.map(row => ({
            id: row.id || row[0],
            name: row.name || row[1],
            description: row.description || row[2],
            memberCount: row.memberCount || row[3] || 0,
            isMember: row.isMember || row[4] || false
        }));

        res.json({ groups });
    } catch (error) {
        console.error('Search groups error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/groups/:id/members
router.get('/:id/members', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const graph = getGraph();
        const query = `
            MATCH (u:User)-[b:IN_GROUP]->(g:Group {id: $id})
            RETURN u.id as id, u.name as name, u.username as username, u.avatar as avatar, b.role as role
            ORDER BY b.role DESC, u.name ASC
        `;
        const result = await graph.query(query, { params: { id } });
        
        const members = result.data.map(row => ({
            id: row.id || row[0],
            name: row.name || row[1],
            username: row.username || row[2],
            avatar: row.avatar || row[3],
            role: row.role || row[4]
        }));
        res.json({ members });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/groups/:id/invite-suggestions
router.get('/:id/invite-suggestions', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const graph = getGraph();

        const query = `
            MATCH (u:User {id: $userId})-[:FOLLOWS]->(f:User)
            MATCH (g:Group {id: $groupId})
            WHERE NOT (f)-[:IN_GROUP]->(g) AND NOT (f)-[:BANNED_FROM]->(g)
            RETURN f.id as id, f.name as name, f.username as username, f.avatar as avatar
            LIMIT 20
        `;
        const result = await graph.query(query, { params: { userId: req.user.id, groupId: id } });
        
        const suggestions = result.data.map(row => ({
            id: row.id || row[0],
            name: row.name || row[1],
            username: row.username || row[2],
            avatar: row.avatar || row[3]
        }));
        
        res.json({ suggestions });
    } catch (error) {
        console.error('Invite suggestions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
