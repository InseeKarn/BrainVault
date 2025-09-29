const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./user');
const problemRoutes = require('./problem');
const feedbackRoutes = require('./feedback');
const leaderboardRoutes = require('./leaderboard');
const hintRoutes = require('./hint');
const { router: aiRoutes } = require('./ai_problem_generator');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'brainvault_secret_key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// JWT Middleware for protected routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', authenticateToken, userRoutes);
// Public read-only problems API
app.use('/api/problems', problemRoutes);
app.use('/api/feedback', authenticateToken, feedbackRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/hints', authenticateToken, hintRoutes);
// Billing & monetization
const billingRoutes = require('./billing');
app.use('/api/billing', billingRoutes);

// Tournament API (requires auth per route)
const tournamentRoutes = require('./tournament');
app.use('/api/tournament', tournamentRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);

// Root route - serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'BrainVault API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`🧠 BrainVault server running on port ${PORT}`);
    console.log(`📚 Frontend available at http://localhost:${PORT}`);
    console.log(`🔗 API endpoints at http://localhost:${PORT}/api/`);
});

module.exports = app;