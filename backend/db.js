const { FalkorDB } = require('falkordb');

let graph;

async function connectDB() {
    try {
        const client = await FalkorDB.connect({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        const graphName = process.env.GRAPH_NAME || 'socily';
        graph = client.selectGraph(graphName);
        console.log(`Connected to FalkorDB (Graph: ${graphName})`);
        return graph;
    } catch (error) {
        console.error('FalkorDB connection error:', error);
        process.exit(1);
    }
}

function getGraph() {
    if (!graph) {
        throw new Error('Graph DB not initialized. Call connectDB first.');
    }
    return graph;
}

module.exports = { connectDB, getGraph };
