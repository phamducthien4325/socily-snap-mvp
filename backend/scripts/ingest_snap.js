const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
require('dotenv').config();
const { connectDB } = require('../db');

// Thư mục chứa dữ liệu SNAP
const SNAP_DIR = path.join(__dirname, '../../../snap_dataset/facebook');

async function run() {
    const graph = await connectDB();
    
    console.log('Vui lòng đợi vài giây để kết nối...');
    
    // Nếu muốn xóa graph cũ, uncomment dòng dưới đây
    // try {
    //     console.log('Cleaning up old graph...');
    //     await graph.query('MATCH (n) DETACH DELETE n');
    // } catch(e) { console.log('Graph is empty or error cleaning:', e); }

    // Tạo index để insert nhanh hơn
    try { await graph.query("CREATE INDEX FOR (u:User) ON (u.id)"); } catch(e){}
    try { await graph.query("CREATE INDEX FOR (u:User) ON (u.username)"); } catch(e){}
    try { await graph.query("CREATE INDEX FOR (f:Feature) ON (f.id)"); } catch(e){}
    try { await graph.query("CREATE INDEX FOR (g:Group) ON (g.id)"); } catch(e){}

    const files = fs.readdirSync(SNAP_DIR);
    const egos = new Set(files.filter(f => f.includes('.')).map(f => f.split('.')[0]));

    let allUsers = new Set();
    let allEdges = [];

    // Lấy Users và Edges
    console.log(`Found ${egos.size} ego networks. Reading edges...`);
    for (const ego of egos) {
        allUsers.add(ego);
        const edgeFile = path.join(SNAP_DIR, `${ego}.edges`);
        if (fs.existsSync(edgeFile)) {
            const lines = fs.readFileSync(edgeFile, 'utf8').split('\n');
            for (let line of lines) {
                line = line.trim();
                if (!line) continue;
                const [source, target] = line.split(' ');
                if (source && target) {
                    allUsers.add(source);
                    allUsers.add(target);
                    allEdges.push({ source, target });
                }
            }
        }
    }

    console.log(`Found ${allUsers.size} unique users and ${allEdges.length} edges.`);

    // 1. Tạo Users (Batching)
    console.log('Generating accounts...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    const userArray = Array.from(allUsers).map(id => ({
        id: id,
        username: `user${id}`,
        password: hashedPassword,
        name: `Node ${id}`,
        avatar: faker.image.avatar()
    }));

    const batchSize = 1000;
    for (let i = 0; i < userArray.length; i += batchSize) {
        const batch = userArray.slice(i, i + batchSize);
        await graph.query(`
            UNWIND $users AS u
            MERGE (n:User {id: u.id})
            SET n.username = u.username,
                n.password = u.password,
                n.name = u.name,
                n.role = 'user',
                n.avatar = u.avatar
        `, { params: { users: batch } });
        console.log(`Inserted users ${Math.min(i + batch.length, userArray.length)} / ${userArray.length}`);
    }

    // 2. Tạo Edges (Batching)
    console.log('Generating follows edges...');
    for (let i = 0; i < allEdges.length; i += batchSize) {
        const batch = allEdges.slice(i, i + batchSize);
        await graph.query(`
            UNWIND $edges AS e
            MATCH (u1:User {id: e.source}), (u2:User {id: e.target})
            MERGE (u1)-[:FOLLOWS]->(u2)
            MERGE (u2)-[:FOLLOWS]->(u1)
        `, { params: { edges: batch } });
        console.log(`Inserted edges ${Math.min(i + batch.length, allEdges.length)} / ${allEdges.length}`);
    }

    // 3. Tạo Features
    console.log('Processing features...');
    for (const ego of egos) {
        const egofeatFile = path.join(SNAP_DIR, `${ego}.egofeat`);
        const featFile = path.join(SNAP_DIR, `${ego}.feat`);
        
        let featMappings = [];

        if (fs.existsSync(egofeatFile)) {
            const egoLine = fs.readFileSync(egofeatFile, 'utf8').trim().split(' ');
            egoLine.forEach((val, idx) => {
                if (val === '1') {
                    featMappings.push({ user_id: ego, feature_id: `feat_${idx}` });
                }
            });
        }

        if (fs.existsSync(featFile)) {
            const lines = fs.readFileSync(featFile, 'utf8').split('\n');
            for (let line of lines) {
                line = line.trim();
                if (!line) continue;
                const parts = line.split(' ');
                const nodeId = parts[0];
                for (let i = 1; i < parts.length; i++) {
                    if (parts[i] === '1') {
                        featMappings.push({ user_id: nodeId, feature_id: `feat_${i-1}` });
                    }
                }
            }
        }
        
        if (featMappings.length > 0) {
            for (let i = 0; i < featMappings.length; i += batchSize) {
                const batch = featMappings.slice(i, i + batchSize);
                await graph.query(`
                    UNWIND $mappings AS m
                    MERGE (f:Feature {id: m.feature_id})
                    WITH f, m
                    MATCH (u:User {id: m.user_id})
                    MERGE (u)-[:HAS_FEATURE]->(f)
                `, { params: { mappings: batch } });
            }
            console.log(`Inserted features for ego network ${ego}`);
        }
    }

    // 4. Tạo Groups từ Circles
    console.log('Generating Groups from circles...');
    for (const ego of egos) {
        const circleFile = path.join(SNAP_DIR, `${ego}.circles`);
        if (fs.existsSync(circleFile)) {
            const lines = fs.readFileSync(circleFile, 'utf8').split('\n');
            for (let line of lines) {
                line = line.trim();
                if (!line) continue;
                const parts = line.split('\t');
                const circleName = parts[0];
                const members = parts.slice(1);
                
                if (!members.includes(ego)) {
                    members.push(ego);
                }

                const groupId = `group_${ego}_${circleName}`;
                await graph.query(`
                    MERGE (g:Group {id: $groupId})
                    SET g.name = $groupName,
                        g.description = $desc
                `, {
                    params: {
                        groupId,
                        groupName: `Circle ${circleName} (Ego ${ego})`,
                        desc: `A private group generated from circle ${circleName} of ego network ${ego}.`
                    }
                });

                for (let i = 0; i < members.length; i += batchSize) {
                    const batch = members.slice(i, i + batchSize);
                    await graph.query(`
                        UNWIND $batch AS memberId
                        MATCH (g:Group {id: $groupId})
                        MATCH (u:User {id: memberId})
                        MERGE (u)-[:IN_GROUP]->(g)
                    `, { params: { groupId, batch } });
                }
            }
            console.log(`Inserted groups for ego network ${ego}`);
        }
    }

    // 5. Generate some Posts & Likes
    console.log('Generating posts...');
    const randomUsersQuery = await graph.query("MATCH (u:User) RETURN u.id LIMIT 200");
    const randomUsers = randomUsersQuery.data.map(r => r['u.id']);

    const postIds = [];
    for (const uId of randomUsers) {
        const postCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < postCount; i++) {
            const postId = `post_${uId}_${i}`;
            const isGroupPost = Math.random() > 0.5;
            
            await graph.query(`
                MATCH (u:User {id: $uId})
                CREATE (p:Post {id: $postId, content: $content, timestamp: $ts})
                CREATE (u)-[:POSTED]->(p)
            `, {
                params: {
                    uId, postId,
                    content: faker.lorem.paragraph(),
                    ts: Date.now() - Math.floor(Math.random() * 10000000)
                }
            });
            postIds.push(postId);

            if (isGroupPost) {
                await graph.query(`
                    MATCH (u:User {id: $uId})-[:IN_GROUP]->(g:Group)
                    WITH g, u LIMIT 1
                    MATCH (p:Post {id: $postId})
                    CREATE (p)-[:POSTED_IN]->(g)
                `, { params: { uId, postId } });
            }
        }
    }
    console.log(`Generated ${postIds.length} posts.`);
    console.log('Done data ingestion! Graph: socily_snap is fully populated.');
    process.exit(0);
}

run().catch(console.error);
