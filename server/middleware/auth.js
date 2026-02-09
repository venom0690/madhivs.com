const jwt = require('jsonwebtoken');

/**
 * Protect routes - verify JWT token
 */
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'You are not logged in. Please log in to access this resource.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add admin info to request
        req.admin = decoded;

        next();

    } catch (error) {
        console.error('Auth error:', error.message);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token expired. Please log in again.'
            });
        }

        res.status(401).json({
            status: 'error',
            message: 'Authentication failed'
        });
    }
};
