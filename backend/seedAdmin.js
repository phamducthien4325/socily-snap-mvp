const { FalkorDB } = require('falkordb');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    try {
        const client = await FalkorDB.connect({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        const graph = client.selectGraph('socily');
        console.log('Connected to FalkorDB');

        const username = 'admin';
        const password = 'password123';
        const email = 'admin@socily.com';
        
        // Check if admin exists
        const checkQuery = `MATCH (u:User {username: $username}) RETURN u`;
        const result = await graph.query(checkQuery, { params: { username } });
        
        if (result.data.length > 0) {
            console.log('Admin user already exists!');
            process.exit(0);
        }

        const userId = Date.now().toString();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const insertQuery = `
            CREATE (u:User {id: $id, username: $username, email: $email, password: $password, verified: true, role: 'admin'})
            RETURN u
        `;
        
        await graph.query(insertQuery, {
            params: {
                id: userId,
                username,
                email,
                password: hashedPassword
            }
        });

        console.log('Admin user created successfully!');
        console.log('---------------------------');
        console.log('Username:', username);
        console.log('Password:', password);
        console.log('Role: admin');
        console.log('---------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

seedAdmin();
