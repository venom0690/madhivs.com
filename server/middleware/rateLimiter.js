/**
 * Rate Limiter Middleware
 * FIX #6: Prevents brute-force attacks on login endpoint
 * 
 * Simple in-memory rate limiter (no external dependency needed)
 * Good enough for ₹20k website level — no need for Redis
 */

// In-memory store for rate limiting
const loginAttempts = new Map();

// Clean up old entries every 15 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of loginAttempts) {
        if (now - data.firstAttempt > 15 * 60 * 1000) {
            loginAttempts.delete(key);
        }
    }
}, 15 * 60 * 1000);

/**
 * Rate limiter for login endpoint
 * 5 attempts per 15 minutes per IP
 */
exports.loginLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    const attempts = loginAttempts.get(ip);

    if (!attempts) {
        loginAttempts.set(ip, { count: 1, firstAttempt: now });
        return next();
    }

    // Reset if window has passed
    if (now - attempts.firstAttempt > windowMs) {
        loginAttempts.set(ip, { count: 1, firstAttempt: now });
        return next();
    }

    // Check if limit exceeded
    if (attempts.count >= maxAttempts) {
        const remainingMs = windowMs - (now - attempts.firstAttempt);
        const remainingMin = Math.ceil(remainingMs / 60000);
        return res.status(429).json({
            status: 'error',
            message: `Too many login attempts. Please try again after ${remainingMin} minutes.`
        });
    }

    // Increment count
    attempts.count++;
    next();
};

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
const apiAttempts = new Map();

setInterval(() => {
    apiAttempts.clear();
}, 60 * 1000);

exports.apiLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const maxRequests = 100;

    const data = apiAttempts.get(ip);

    if (!data) {
        apiAttempts.set(ip, { count: 1, start: now });
        return next();
    }

    if (now - data.start > 60 * 1000) {
        apiAttempts.set(ip, { count: 1, start: now });
        return next();
    }

    if (data.count >= maxRequests) {
        return res.status(429).json({
            status: 'error',
            message: 'Too many requests. Please slow down.'
        });
    }

    data.count++;
    next();
};
