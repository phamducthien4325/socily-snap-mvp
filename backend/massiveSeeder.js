const { FalkorDB } = require('falkordb');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

// ============================================
// CONFIGURATION: Điều chỉnh số lượng dữ liệu
// ============================================
const NUM_USERS = 5000;
const NUM_INTERESTS = 20;
const NUM_COMMUNITIES = 10;
const NUM_POSTS = 20000;
const NUM_FOLLOWS = 10000;
const NUM_LIKES = 30000;

async function runSeeder() {
    console.log('🚀 Starting Massive Data Seeder...');
    console.log(`Config: ${NUM_USERS} Users, ${NUM_POSTS} Posts, ${NUM_LIKES} Likes...`);

    let client;
    try {
        client = await FalkorDB.connect({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        const graph = client.selectGraph('socily');
        console.log('Connected to FalkorDB');

        // Warning: This clears the entire graph!
        console.log('Clearing existing data...');
        await graph.query('MATCH (n) DETACH DELETE n');
        console.log('Graph cleared.');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // ============================================
        // Helper: Thực thi Batch Insert với UNWIND
        // ============================================
        async function batchInsert(query, items, batchSize = 1000) {
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                await graph.query(query, { params: { batch } });
                if ((i + batchSize) < items.length) {
                    process.stdout.write(`\r... inserted ${i + batchSize}/${items.length}`);
                }
            }
            console.log(`\r... inserted ${items.length}/${items.length} ✅`);
        }

        // ============================================
        // 1. Create Interests
        // ============================================
        console.log('\n--- Creating Interests ---');
        const interests = [];
        for (let i = 0; i < NUM_INTERESTS; i++) {
            interests.push({ name: faker.company.catchPhraseAdjective() + ' ' + faker.company.buzzNoun() });
        }
        await batchInsert(`
            UNWIND $batch AS i
            MERGE (n:Interest {name: i.name})
        `, interests);
        const interestNames = interests.map(i => i.name);

        // ============================================
        // 2. Create Communities
        // ============================================
        console.log('\n--- Creating Communities ---');
        const communities = [];
        for (let i = 0; i < NUM_COMMUNITIES; i++) {
            const tags = faker.helpers.arrayElements(interestNames, 3);
            communities.push({
                id: faker.string.uuid(),
                name: faker.company.name() + ' Community',
                description: faker.lorem.sentence(),
                tags: tags
            });
        }
        
        // Insert communities
        await batchInsert(`
            UNWIND $batch AS c
            MERGE (n:Community {id: c.id})
            SET n.name = c.name, n.description = c.description, n.memberCount = 0
        `, communities);

        // Connect Communities to Interests
        const commInterestRels = [];
        for (const comm of communities) {
            for (const tag of comm.tags) {
                commInterestRels.push({ commId: comm.id, interestName: tag });
            }
        }
        await batchInsert(`
            UNWIND $batch AS r
            MATCH (c:Community {id: r.commId}), (i:Interest {name: r.interestName})
            MERGE (c)-[:RELATED_TO]->(i)
        `, commInterestRels);


        // ============================================
        // 3. Create Users
        // ============================================
        console.log('\n--- Creating Users ---');
        const users = [];
        const usernames = [];
        for (let i = 0; i < NUM_USERS; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const username = faker.internet.username({ firstName, lastName }).toLowerCase() + '_' + faker.number.int(1000);
            usernames.push(username);
            users.push({
                id: faker.string.uuid(),
                username: username,
                name: `${firstName} ${lastName}`,
                role: faker.person.jobTitle(),
                avatar: faker.image.avatar(),
                email: faker.internet.email({ firstName, lastName }),
                password: hashedPassword
            });
        }
        await batchInsert(`
            UNWIND $batch AS u
            MERGE (n:User {username: u.username})
            SET n.id = u.id, n.name = u.name, n.role = u.role, n.avatar = u.avatar, n.email = u.email, n.password = u.password
        `, users, 2000);


        // ============================================
        // 4. Create User Interests (HAS_INTEREST)
        // ============================================
        console.log('\n--- Creating User Interests ---');
        const userInterests = [];
        for (const username of usernames) {
            const numUserInterests = faker.number.int({ min: 1, max: 5 });
            const selectedInterests = faker.helpers.arrayElements(interestNames, numUserInterests);
            for (const intName of selectedInterests) {
                userInterests.push({
                    username: username,
                    interestName: intName,
                    weight: faker.number.float({ min: 5, max: 50, fractionDigits: 1 })
                });
            }
        }
        await batchInsert(`
            UNWIND $batch AS ui
            MATCH (u:User {username: ui.username}), (i:Interest {name: ui.interestName})
            MERGE (u)-[r:HAS_INTEREST]->(i)
            SET r.weight = ui.weight, r.source = 'explicit'
        `, userInterests, 2000);

        // ============================================
        // 5. Create Community Memberships (BELONGS_TO)
        // ============================================
        console.log('\n--- Creating Community Memberships ---');
        const memberships = [];
        for (const username of usernames) {
            const numComms = faker.number.int({ min: 3, max: 8 });
            const selectedComms = faker.helpers.arrayElements(communities, numComms);
            for (const comm of selectedComms) {
                memberships.push({
                    username: username,
                    commId: comm.id
                });
            }
        }
        await batchInsert(`
            UNWIND $batch AS m
            MATCH (u:User {username: m.username}), (c:Community {id: m.commId})
            MERGE (u)-[:BELONGS_TO {role: 'member'}]->(c)
            SET c.memberCount = coalesce(c.memberCount, 0) + 1
        `, memberships, 2000);

        // ============================================
        // 6. Create Follows (FOLLOWS)
        // ============================================
        console.log('\n--- Creating Follow Relationships ---');
        const follows = [];
        for (let i = 0; i < NUM_FOLLOWS; i++) {
            const u1 = faker.helpers.arrayElement(usernames);
            let u2 = faker.helpers.arrayElement(usernames);
            while (u1 === u2) u2 = faker.helpers.arrayElement(usernames);
            follows.push({ from: u1, to: u2 });
        }
        await batchInsert(`
            UNWIND $batch AS f
            MATCH (a:User {username: f.from}), (b:User {username: f.to})
            MERGE (a)-[:FOLLOWS]->(b)
        `, follows, 2000);

        // ============================================
        // 7. Create Posts (POSTED, POSTED_IN)
        // ============================================
        console.log('\n--- Creating Posts ---');
        const posts = [];
        const postIds = [];
        for (let i = 0; i < NUM_POSTS; i++) {
            const id = faker.string.uuid();
            postIds.push(id);
            posts.push({
                id: id,
                username: faker.helpers.arrayElement(usernames),
                communityId: faker.helpers.arrayElement(communities).id,
                content: faker.lorem.paragraphs({ min: 1, max: 3 }),
                likes: 0,
                comments: 0,
                timestamp: faker.date.recent({ days: 30 }).getTime()
            });
        }
        await batchInsert(`
            UNWIND $batch AS p
            MATCH (u:User {username: p.username}), (c:Community {id: p.communityId})
            MERGE (post:Post {id: p.id})
            SET post.content = p.content, post.likes = p.likes, post.comments = p.comments, post.timestamp = p.timestamp
            MERGE (u)-[:POSTED]->(post)
            MERGE (post)-[:POSTED_IN]->(c)
        `, posts, 2000);

        // ============================================
        // 8. Create Likes (LIKED)
        // ============================================
        console.log('\n--- Creating Likes ---');
        const likes = [];
        // To optimize, we won't calculate implicit interest for massive seed
        // We just create relationships to save time, or do it partially
        for (let i = 0; i < NUM_LIKES; i++) {
            likes.push({
                username: faker.helpers.arrayElement(usernames),
                postId: faker.helpers.arrayElement(postIds)
            });
        }
        await batchInsert(`
            UNWIND $batch AS l
            MATCH (u:User {username: l.username}), (p:Post {id: l.postId})
            MERGE (u)-[:LIKED]->(p)
            SET p.likes = p.likes + 1
        `, likes, 2000);

        console.log('\n🎉 Massive Database Seeded Successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding massive database:', error);
        process.exit(1);
    }
}

runSeeder();
