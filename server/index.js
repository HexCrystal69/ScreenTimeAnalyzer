// AttenTrack Server — Main Entry Point
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for reports
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/screentime', require('./routes/screentime'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/distracting-apps', require('./routes/distracting'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/attention', require('./routes/attention'));
app.use('/api/opportunity', require('./routes/opportunity'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
    try {
        // Create database if it doesn't exist
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: 'localhost', user: 'root', password: '34691218'
        });
        await connection.query('CREATE DATABASE IF NOT EXISTS attentrack');
        await connection.end();
        console.log('Database "attentrack" ensured');

        // Sync all models
        await sequelize.sync({ alter: true });
        console.log('All models synced to MySQL');

        app.listen(PORT, () => {
            console.log(`\n  AttenTrack API running on http://localhost:${PORT}`);
            console.log(`  Health check: http://localhost:${PORT}/api/health\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
