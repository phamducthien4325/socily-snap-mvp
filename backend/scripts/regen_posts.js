/**
 * Script regenerate bài viết bằng tiếng Anh có ý nghĩa
 * - Xóa tất cả Post cũ (Lorem Ipsum)
 * - Tạo lại posts bằng tiếng Anh thực tế (social media style)
 */

const { faker } = require('@faker-js/faker/locale/en');
require('dotenv').config();
const { connectDB } = require('../db');

// Các template bài viết social media thực tế
const postTemplates = [
    // Tech & Programming
    () => `Just finished building a ${faker.helpers.arrayElement(['React', 'Node.js', 'Python', 'GraphDB', 'microservice', 'REST API', 'mobile app', 'dashboard'])} project! ${faker.helpers.arrayElement(['So excited!', 'What a journey!', 'Learned so much!', 'Time to celebrate! 🎉'])}`,
    () => `${faker.helpers.arrayElement(['Hot take:', 'Unpopular opinion:', 'Hear me out:', 'Just my thoughts:'])} ${faker.helpers.arrayElement(['Graph databases are the future of social networks.', 'NoSQL beats SQL for social media apps.', 'FalkorDB is underrated for graph queries.', 'Real-time recommendations need graph traversal.', 'Every developer should learn Cypher query language.'])}`,
    () => `Working on ${faker.helpers.arrayElement(['a new feature', 'bug fixes', 'performance optimization', 'database migration', 'UI redesign'])} today. ${faker.helpers.arrayElement(['Coffee is my best friend right now ☕', 'Wish me luck!', 'Almost there!', 'The grind never stops 💪'])}`,
    
    // Daily life & Thoughts
    () => `${faker.helpers.arrayElement(['Beautiful morning', 'Great evening', 'Perfect weekend', 'Lovely day'])} for ${faker.helpers.arrayElement(['a walk in the park 🌳', 'reading a good book 📚', 'catching up with old friends', 'trying a new recipe 🍳', 'watching the sunset 🌅', 'a cup of coffee at my favorite cafe ☕'])}`,
    () => `Just ${faker.helpers.arrayElement(['watched', 'finished', 'started', 'rewatched'])} "${faker.helpers.arrayElement(['The Social Network', 'Interstellar', 'The Matrix', 'Breaking Bad', 'Dark', 'Stranger Things', 'Black Mirror'])}" and ${faker.helpers.arrayElement(["it blew my mind! 🤯", "I can't stop thinking about it.", "highly recommend it!", "it's a masterpiece.", "now I need a sequel."])}`,
    () => `${faker.helpers.arrayElement(['Grateful for', 'Thankful for', 'Appreciating', 'Blessed with'])} ${faker.helpers.arrayElement(['amazing friends who always have my back.', 'a supportive community.', 'the little things in life.', 'every opportunity that comes my way.', 'this beautiful journey called life.'])}`,
    
    // Questions & Engagement
    () => `${faker.helpers.arrayElement(["What's your favorite", "What do you think about", "Anyone else into", "Who else loves"])} ${faker.helpers.arrayElement(['programming language?', 'productivity app?', 'tech podcast?', 'way to relax after work?', 'weekend hobby?', 'book you read this year?'])} ${faker.helpers.arrayElement(['Drop your answers below! 👇', 'Let me know!', 'Curious to hear your thoughts!', 'Share with me!'])}`,
    () => `Pro tip: ${faker.helpers.arrayElement(["Always back up your data before any migration.", "Use graph databases for relationship-heavy queries.", "Take breaks — your brain needs rest to solve problems.", "Write tests before you write code.", "Document your code while it's fresh in your mind.", "Network with people outside your comfort zone."])}`,
    
    // Achievements & Updates
    () => `Excited to announce that ${faker.helpers.arrayElement(["I just hit 1000 connections! 🎉", "our team shipped a major update today!", "I passed my certification exam! 📜", "I'm starting a new chapter in my career.", "we reached our project milestone ahead of schedule!", "I finally automated my workflow!"])}`,
    () => `${faker.helpers.arrayElement(['Monday motivation:', 'Midweek reminder:', 'Friday thoughts:', 'Weekend vibes:'])} ${faker.helpers.arrayElement(["Success is not final, failure is not fatal.", "The best time to start was yesterday. The next best time is now.", "Stay hungry, stay foolish.", "Code, test, deploy, repeat.", "Small steps every day lead to big results.", "Don't compare your chapter 1 to someone else's chapter 20."])}`,
    
    // Social & Fun
    () => `${faker.helpers.arrayElement(['Had an amazing time', 'Spent the weekend', 'Just got back from', 'Currently enjoying'])} ${faker.helpers.arrayElement(['at the tech meetup downtown! Met some incredible people.', 'hiking with friends. Nature is the best therapy! 🏔️', 'a road trip along the coast. Unforgettable views! 🚗', 'a coding marathon. 12 hours straight! 💻', 'volunteering at the local community center. So fulfilling! ❤️'])}`,
    () => `${faker.helpers.arrayElement(["Can't believe", "So happy that", "Really proud that", "Amazed that"])} ${faker.helpers.arrayElement(["it's already May 2026!", "I've been coding for 5 years now.", "our app has 1000+ active users.", "the project is finally coming together.", "graph databases make everything faster."])}`,
    
    // Food & Travel
    () => `${faker.helpers.arrayElement(['Tried', 'Discovered', 'Made', 'Ordered'])} ${faker.helpers.arrayElement(['the most amazing ramen today 🍜', 'a new coffee blend that changed my life ☕', 'homemade pizza from scratch 🍕', 'the best burger in town 🍔', 'an incredible Vietnamese pho 🍲'])}. ${faker.helpers.arrayElement(['10/10 would recommend!', 'Life-changing experience!', 'Pure happiness in a bowl!', 'Food is love! ❤️'])}`,
    () => `Travel bucket list update: ${faker.helpers.arrayElement(["Just crossed off Japan! 🇯🇵 Cherry blossoms were magical.", "Vietnam is calling me! Can't wait to explore Hanoi.", "Iceland's northern lights — absolutely breathtaking! 🌌", "Barcelona's architecture is next level. Gaudi was a genius!", "New Zealand adventure completed! Middle-earth is real! 🧙‍♂️"])}`,
];

async function run() {
    const graph = await connectDB();
    
    console.log('🗑️  Deleting old posts...');
    try {
        // Xóa tất cả relationships liên quan đến Post
        await graph.query('MATCH ()-[r:POSTED]->() DELETE r');
        await graph.query('MATCH ()-[r:POSTED_IN]->() DELETE r');
        await graph.query('MATCH ()-[r:LIKED]->() DELETE r');
        await graph.query('MATCH ()-[r:COMMENTED]->() DELETE r');
        // Xóa tất cả Post nodes
        await graph.query('MATCH (p:Post) DELETE p');
        // Xóa tất cả Comment nodes
        try { await graph.query('MATCH (c:Comment) DETACH DELETE c'); } catch(e) {}
        console.log('✅ Old posts deleted.');
    } catch (e) {
        console.log('⚠️  Error deleting old data:', e.message);
    }

    // Lấy users để tạo posts
    console.log('📝 Generating English posts...');
    const usersResult = await graph.query("MATCH (u:User) RETURN u.id LIMIT 300");
    const users = usersResult.data.map(r => r['u.id']);
    
    const postIds = [];
    const batchSize = 50;
    let postBatch = [];

    for (const uId of users) {
        const postCount = Math.floor(Math.random() * 3) + 1; // 1-3 posts per user
        for (let i = 0; i < postCount; i++) {
            const template = faker.helpers.arrayElement(postTemplates);
            const content = template();
            const postId = `post_${uId}_${i}`;
            const ts = Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000); // within 7 days
            
            postBatch.push({ uId, postId, content, ts });
            postIds.push(postId);

            if (postBatch.length >= batchSize) {
                await insertPostBatch(graph, postBatch);
                console.log(`  Generated ${postIds.length} posts...`);
                postBatch = [];
            }
        }
    }

    // Insert remaining
    if (postBatch.length > 0) {
        await insertPostBatch(graph, postBatch);
    }

    console.log(`✅ Generated ${postIds.length} English posts total.`);

    // Gán một số posts vào Group
    console.log('🏷️  Assigning some posts to groups...');
    let groupAssigned = 0;
    for (const postId of postIds) {
        if (Math.random() > 0.6) { // 40% posts thuộc group
            const uId = postId.split('_')[1];
            try {
                await graph.query(`
                    MATCH (u:User {id: $uId})-[:IN_GROUP]->(g:Group)
                    WITH g LIMIT 1
                    MATCH (p:Post {id: $postId})
                    CREATE (p)-[:POSTED_IN]->(g)
                `, { params: { uId, postId } });
                groupAssigned++;
            } catch(e) {}
        }
    }
    console.log(`✅ Assigned ${groupAssigned} posts to groups.`);

    // Generate some likes
    console.log('❤️  Generating likes...');
    let likeCount = 0;
    for (let i = 0; i < 500; i++) {
        const randomUser = faker.helpers.arrayElement(users);
        const randomPost = faker.helpers.arrayElement(postIds);
        try {
            await graph.query(`
                MATCH (u:User {id: $uId}), (p:Post {id: $pId})
                MERGE (u)-[:LIKED]->(p)
            `, { params: { uId: randomUser, pId: randomPost } });
            likeCount++;
        } catch(e) {}
    }
    console.log(`✅ Generated ${likeCount} likes.`);

    console.log('\n🎉 Done! All posts are now in English.');
    process.exit(0);
}

async function insertPostBatch(graph, batch) {
    for (const { uId, postId, content, ts } of batch) {
        await graph.query(`
            MATCH (u:User {id: $uId})
            CREATE (p:Post {id: $postId, content: $content, timestamp: $ts})
            CREATE (u)-[:POSTED]->(p)
        `, {
            params: { uId, postId, content, ts }
        });
    }
}

run().catch(console.error);
