const { getGraph } = require('../db');

async function createNotification(req, targetUserId, type, content, link) {
    if (req.user.id === targetUserId) return; // Don't notify yourself

    try {
        const graph = getGraph();
        const notificationId = 'notif_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);
        const timestamp = Date.now();

        // Save to DB
        await graph.query(`
            MATCH (actor:User {id: $actorId}), (target:User {id: $targetId})
            CREATE (n:Notification {
                id: $notificationId,
                type: $type,
                content: $content,
                link: $link,
                timestamp: $timestamp,
                read: false
            })
            CREATE (actor)-[:CREATED_NOTIFICATION]->(n)
            CREATE (target)<-[:HAS_NOTIFICATION]-(n)
        `, {
            params: {
                actorId: req.user.id,
                targetId: targetUserId,
                notificationId,
                type,
                content,
                link,
                timestamp
            }
        });

        // Emit via Socket.io if user is connected
        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');
        
        if (io && connectedUsers && connectedUsers.has(targetUserId)) {
            const socketId = connectedUsers.get(targetUserId);
            io.to(socketId).emit('new_notification', {
                id: notificationId,
                type,
                content,
                link,
                timestamp,
                read: false,
                actor: {
                    username: req.user.username,
                    avatar: req.user.avatar || req.user.username?.charAt(0)
                }
            });
        }
    } catch (error) {
        console.error('Create notification error:', error);
    }
}

module.exports = { createNotification };
