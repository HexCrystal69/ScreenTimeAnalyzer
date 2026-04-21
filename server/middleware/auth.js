// JWT authentication middleware
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'attentrack-secret-key-2024';

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Verify token middleware
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        req.userId = user.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = { authenticate, generateToken, JWT_SECRET };
