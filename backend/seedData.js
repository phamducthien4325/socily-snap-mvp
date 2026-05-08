const { FalkorDB } = require('falkordb');
const bcrypt = require('bcryptjs');

async function seedData() {
    try {
        const client = await FalkorDB.connect({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        const graph = client.selectGraph('socily');
        console.log('Connected to FalkorDB for seeding');

        // Optional: clear graph if you want fresh data
        // await graph.query('MATCH (n) DETACH DELETE n');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // ============================================
        // 1. Create Users
        // ============================================
        const users = [
            { id: '1', username: 'elenar', name: 'Elena Rodriguez', role: 'System Architect', avatar: 'ER', email: 'elena@socily.com', password: hashedPassword },
            { id: '2', username: 'davidc', name: 'David Cho', role: 'UX Engineer', avatar: 'DC', email: 'david@socily.com', password: hashedPassword },
            { id: '3', username: 'mayap', name: 'Maya Patel', role: 'Data Scientist', avatar: 'MP', email: 'maya@socily.com', password: hashedPassword },
            { id: '4', username: 'jamesw', name: 'James Wilson', role: 'Product Manager', avatar: 'JW', email: 'james@socily.com', password: hashedPassword },
            { id: '5', username: 'sarahk', name: 'Sarah Kim', role: 'ML Engineer', avatar: 'SK', email: 'sarah@socily.com', password: hashedPassword },
            { id: '6', username: 'alexm', name: 'Alex Martinez', role: 'Full Stack Dev', avatar: 'AM', email: 'alex@socily.com', password: hashedPassword },
            { id: '7', username: 'lisaw', name: 'Lisa Wang', role: 'DevOps Engineer', avatar: 'LW', email: 'lisa@socily.com', password: hashedPassword },
            { id: '8', username: 'tomn', name: 'Tom Nguyen', role: 'Backend Dev', avatar: 'TN', email: 'tom@socily.com', password: hashedPassword },
        ];

        for (const user of users) {
            await graph.query(`
                MERGE (u:User {username: $username})
                ON CREATE SET u.id = $id, u.name = $name, u.role = $role, u.avatar = $avatar, u.email = $email, u.password = $password
                ON MATCH SET u.name = $name, u.role = $role, u.avatar = $avatar
            `, { params: user });
        }
        console.log(`✅ Created ${users.length} users`);

        // ============================================
        // 2. Create Interests
        // ============================================
        const interests = ['React', 'Node.js', 'GraphDB', 'UI/UX', 'Machine Learning', 'Python', 'DevOps', 'AI', 'Cybersecurity', 'Cloud'];
        for (const interest of interests) {
            await graph.query(`MERGE (i:Interest {name: $name})`, { params: { name: interest } });
        }
        console.log(`✅ Created ${interests.length} interests`);

        // ============================================
        // 3. User Interests (với weight)
        // ============================================
        const userInterests = [
            { username: 'elenar', interests: [{ name: 'React', weight: 25.0 }, { name: 'Node.js', weight: 20.0 }, { name: 'GraphDB', weight: 30.0 }] },
            { username: 'davidc', interests: [{ name: 'UI/UX', weight: 28.0 }, { name: 'React', weight: 15.0 }, { name: 'Python', weight: 8.0 }] },
            { username: 'mayap', interests: [{ name: 'Machine Learning', weight: 35.0 }, { name: 'GraphDB', weight: 18.0 }, { name: 'AI', weight: 25.0 }, { name: 'Python', weight: 22.0 }] },
            { username: 'jamesw', interests: [{ name: 'UI/UX', weight: 12.0 }, { name: 'Machine Learning', weight: 10.0 }, { name: 'Cloud', weight: 15.0 }] },
            { username: 'sarahk', interests: [{ name: 'Machine Learning', weight: 30.0 }, { name: 'AI', weight: 28.0 }, { name: 'Python', weight: 20.0 }] },
            { username: 'alexm', interests: [{ name: 'React', weight: 22.0 }, { name: 'Node.js', weight: 25.0 }, { name: 'DevOps', weight: 15.0 }, { name: 'Cloud', weight: 12.0 }] },
            { username: 'lisaw', interests: [{ name: 'DevOps', weight: 30.0 }, { name: 'Cloud', weight: 28.0 }, { name: 'Cybersecurity', weight: 20.0 }] },
            { username: 'tomn', interests: [{ name: 'Node.js', weight: 25.0 }, { name: 'GraphDB', weight: 15.0 }, { name: 'Python', weight: 18.0 }] },
        ];

        for (const ui of userInterests) {
            for (const interest of ui.interests) {
                await graph.query(`
                    MATCH (u:User {username: $username}), (i:Interest {name: $interest})
                    MERGE (u)-[r:HAS_INTEREST]->(i)
                    ON CREATE SET r.weight = $weight, r.source = 'explicit'
                    ON MATCH SET r.weight = $weight
                `, { params: { username: ui.username, interest: interest.name, weight: interest.weight } });
            }
        }
        console.log('✅ Created user interests with weights');

        // ============================================
        // 4. Create Communities (với RELATED_TO Interest)
        // ============================================
        const communities = [
            { id: 'comm_1', name: 'Frontend Devs', description: 'Everything about frontend development', tags: ['React', 'UI/UX'] },
            { id: 'comm_2', name: 'Data & AI', description: 'Machine Learning, AI and data science', tags: ['Machine Learning', 'AI', 'Python'] },
            { id: 'comm_3', name: 'Graph Enthusiasts', description: 'Graph databases and graph theory', tags: ['GraphDB', 'Node.js'] },
            { id: 'comm_4', name: 'DevOps & Cloud', description: 'Infrastructure, CI/CD, and cloud services', tags: ['DevOps', 'Cloud', 'Cybersecurity'] },
            { id: 'comm_5', name: 'Full Stack Hub', description: 'Full stack development discussions', tags: ['React', 'Node.js', 'Python'] },
        ];

        for (const comm of communities) {
            await graph.query(`
                MERGE (c:Community {id: $id})
                ON CREATE SET c.name = $name, c.description = $description, c.memberCount = 0
                ON MATCH SET c.name = $name, c.description = $description
            `, { params: { id: comm.id, name: comm.name, description: comm.description } });

            for (const tag of comm.tags) {
                await graph.query(`
                    MATCH (c:Community {id: $commId}), (i:Interest {name: $tag})
                    MERGE (c)-[:RELATED_TO]->(i)
                `, { params: { commId: comm.id, tag } });
            }
        }
        console.log(`✅ Created ${communities.length} communities with tags`);

        // ============================================
        // 5. Users join Communities (BELONGS_TO)
        // ============================================
        const memberships = [
            { username: 'elenar', communities: ['comm_1', 'comm_3', 'comm_5'] },
            { username: 'davidc', communities: ['comm_1'] },
            { username: 'mayap', communities: ['comm_2', 'comm_3'] },
            { username: 'jamesw', communities: ['comm_1', 'comm_2'] },
            { username: 'sarahk', communities: ['comm_2'] },
            { username: 'alexm', communities: ['comm_4', 'comm_5'] },
            { username: 'lisaw', communities: ['comm_4'] },
            { username: 'tomn', communities: ['comm_3', 'comm_5'] },
        ];

        for (const m of memberships) {
            for (const commId of m.communities) {
                await graph.query(`
                    MATCH (u:User {username: $username}), (c:Community {id: $commId})
                    MERGE (u)-[:BELONGS_TO {role: 'member'}]->(c)
                    SET c.memberCount = c.memberCount + 1
                `, { params: { username: m.username, commId } });
            }
        }
        console.log('✅ Created community memberships');

        // ============================================
        // 6. Create Posts (POSTED_IN Community)
        // ============================================
        const posts = [
            { id: 'p1', username: 'elenar', communityId: 'comm_3', content: 'FalkorDB benchmark results are in! Graph traversal is 10x faster than SQL JOINs for 3-hop queries. The index-free adjacency really shines here. 🔥', likes: 0, comments: 0, timestamp: Date.now() - 7200000 },
            { id: 'p2', username: 'davidc', communityId: 'comm_1', content: 'The future of social interfaces is asymmetric information density. Moving away from the "endless scroll" towards modular, context-aware feeds. What do you think? 🎨', likes: 0, comments: 0, timestamp: Date.now() - 14400000 },
            { id: 'p3', username: 'mayap', communityId: 'comm_2', content: 'Just trained a recommendation model using graph embeddings. The collaborative filtering results on our social graph are mind-blowing! 🤖', likes: 0, comments: 0, timestamp: Date.now() - 3600000 },
            { id: 'p4', username: 'sarahk', communityId: 'comm_2', content: 'New paper on Graph Neural Networks for social network analysis. The attention mechanism helps identify influential nodes in O(n log n). Anyone interested in a reading group? 📚', likes: 0, comments: 0, timestamp: Date.now() - 1800000 },
            { id: 'p5', username: 'alexm', communityId: 'comm_5', content: 'Just deployed a full-stack app with React + Node.js + FalkorDB. The developer experience is surprisingly smooth. Real-time graph queries from the frontend! ⚡', likes: 0, comments: 0, timestamp: Date.now() - 900000 },
            { id: 'p6', username: 'lisaw', communityId: 'comm_4', content: 'Kubernetes + Redis cluster for FalkorDB in production — here is my setup guide. Zero downtime deployment with rolling updates. 🐳', likes: 0, comments: 0, timestamp: Date.now() - 5400000 },
            { id: 'p7', username: 'tomn', communityId: 'comm_3', content: 'Comparing Cypher query patterns: MATCH vs OPTIONAL MATCH performance in FalkorDB. Interesting findings on query planning! 📊', likes: 0, comments: 0, timestamp: Date.now() - 10800000 },
        ];

        for (const post of posts) {
            await graph.query(`
                MATCH (u:User {username: $username}), (c:Community {id: $communityId})
                MERGE (p:Post {id: $id})
                ON CREATE SET p.content = $content, p.likes = $likes, p.comments = $comments, p.timestamp = $timestamp
                ON MATCH SET p.content = $content, p.likes = $likes, p.comments = $comments, p.timestamp = $timestamp
                MERGE (u)-[:POSTED]->(p)
                MERGE (p)-[:POSTED_IN]->(c)
            `, { params: post });
        }
        console.log(`✅ Created ${posts.length} posts in communities`);

        // ============================================
        // 7. Create Follow relationships
        // ============================================
        const follows = [
            { from: 'elenar', to: 'davidc' },
            { from: 'elenar', to: 'mayap' },
            { from: 'davidc', to: 'elenar' },
            { from: 'davidc', to: 'jamesw' },
            { from: 'mayap', to: 'sarahk' },
            { from: 'mayap', to: 'elenar' },
            { from: 'jamesw', to: 'davidc' },
            { from: 'sarahk', to: 'mayap' },
            { from: 'sarahk', to: 'alexm' },
            { from: 'alexm', to: 'elenar' },
            { from: 'alexm', to: 'tomn' },
            { from: 'lisaw', to: 'alexm' },
            { from: 'tomn', to: 'elenar' },
            { from: 'tomn', to: 'mayap' },
        ];

        for (const f of follows) {
            await graph.query(`
                MATCH (a:User {username: $from}), (b:User {username: $to})
                MERGE (a)-[:FOLLOWS]->(b)
            `, { params: f });
        }
        console.log(`✅ Created ${follows.length} follow relationships`);

        // ============================================
        // 8. Create some Likes (simulate implicit interest)
        // ============================================
        const likes = [
            { username: 'davidc', postId: 'p1' },   // David likes Elena's GraphDB post
            { username: 'mayap', postId: 'p1' },     // Maya likes Elena's GraphDB post
            { username: 'tomn', postId: 'p1' },      // Tom likes Elena's GraphDB post
            { username: 'elenar', postId: 'p3' },    // Elena likes Maya's AI post
            { username: 'sarahk', postId: 'p3' },    // Sarah likes Maya's AI post
            { username: 'jamesw', postId: 'p2' },    // James likes David's UI post
            { username: 'alexm', postId: 'p5' },     // Alex likes his own? skip — but others
            { username: 'elenar', postId: 'p5' },    // Elena likes Alex's fullstack post
            { username: 'tomn', postId: 'p5' },      // Tom likes Alex's fullstack post
            { username: 'lisaw', postId: 'p6' },     // Lisa likes her own DevOps — skip
            { username: 'alexm', postId: 'p6' },     // Alex likes Lisa's DevOps post
        ];

        for (const like of likes) {
            // Create LIKED relationship + increase post likes count
            await graph.query(`
                MATCH (u:User {username: $username}), (p:Post {id: $postId})
                MERGE (u)-[:LIKED]->(p)
                SET p.likes = p.likes + 1
            `, { params: like });

            // Boost interest weight from community tags (+1.0)
            // Find interests via Post -> Community -> Interest
            const tagResult = await graph.query(`
                MATCH (p:Post {id: $postId})-[:POSTED_IN]->(c:Community)-[:RELATED_TO]->(i:Interest)
                RETURN i.name AS interestName
            `, { params: { postId: like.postId } });

            const userResult = await graph.query(`
                MATCH (u:User {username: $username}) RETURN u.id as id
            `, { params: { username: like.username } });
            
            if (userResult.data.length > 0) {
                const userId = userResult.data[0].id || userResult.data[0][0];
                for (const row of tagResult.data) {
                    const interestName = row.interestName || row[0];
                    await graph.query(`
                        MATCH (u:User {id: $userId})
                        MERGE (i:Interest {name: $interest})
                        MERGE (u)-[r:HAS_INTEREST]->(i)
                        ON CREATE SET r.weight = 1.0, r.source = 'implicit'
                        ON MATCH SET r.weight = r.weight + 1.0,
                                     r.source = CASE WHEN r.source = 'explicit' THEN 'mixed' ELSE r.source END
                    `, { params: { userId, interest: interestName } });
                }
            }
        }
        console.log(`✅ Created ${likes.length} likes with implicit interest boosting`);

        console.log('\n🎉 Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedData();
