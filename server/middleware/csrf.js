/**
 * CSRF Protection Middleware
 * Custom implementation using crypto for token generation
 */

const crypto = require('crypto');

// In-memory store for CSRF tokens (use Redis in production for multi-server setup)
const csrfTokens = new Map();

// Clean up expired tokens every hour
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of csrfTokens) {
        if (now - data.created > 24 * 60 * 60 * 1000) { // 24 hours
            csrfTokens.delete(token);
        }
    }
}, 60 * 60 * 1000);

/**
 * Generate CSRF token
 * @returns {string} CSRF token
 */
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware to generate and attach CSRF token
 * Use this on GET requests that render forms
 */
exports.generateCsrfToken = (req, res, next) => {
    const token = generateToken();
    csrfTokens.set(token, {
        created: Date.now(),
        ip: req.ip || req.connection.remoteAddress
    });

    // Attach token to response
    res.locals.csrfToken = token;
    
    // Also send in header for API clients
    res.setHeader('X-CSRF-Token', token);
    
    next();
};

/**
 * Middleware to verify CSRF token
 * Use this on POST, PUT, PATCH, DELETE requests
 */
exports.verifyCsrfToken = (req, res, next) => {
    // Get token from header or body
    const token = req.headers['x-csrf-token'] || 
                  req.body._csrf || 
                  req.query._csrf;

    if (!token) {
        return res.status(403).json({
            status: 'error',
            message: 'CSRF token missing'
        });
    }

    // Verify token exists and is valid
    const tokenData = csrfTokens.get(token);
    
    if (!tokenData) {
        return res.status(403).json({
            status: 'error',
            message: 'Invalid or expired CSRF token'
        });
    }

    // Check if token is expired (24 hours)
    const now = Date.now();
    if (now - tokenData.created > 24 * 60 * 60 * 1000) {
        csrfTokens.delete(token);
        return res.status(403).json({
            status: 'error',
            message: 'CSRF token expired'
        });
    }

    // Token is valid - DO NOT delete it (reusable for session)
    // Update last used time
    tokenData.lastUsed = now;
    
    next();
};

/**
 * Get CSRF token endpoint
 * GET /api/csrf-token
 */
exports.getCsrfToken = (req, res) => {
    const token = generateToken();
    csrfTokens.set(token, {
        created: Date.now(),
        ip: req.ip || req.connection.remoteAddress
    });

    res.status(200).json({
        status: 'success',
        csrfToken: token
    });
};
