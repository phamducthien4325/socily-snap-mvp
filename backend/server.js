const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Routes
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const userRoutes = require('./routes/users');
const graphRoutes = require('./routes/graph');
const postRoutes = require('./routes/posts');
const adminRoutes = require('./routes/admin');
const searchRoutes = require('./routes/search');
const notificationRoutes = require('./routes/notifications');
const { connectDB } = require('./db');

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('Socily API is running');
});

const PORT = process.env.PORT || 5000;

// Connect to DB then start server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
});
