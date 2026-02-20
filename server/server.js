require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const multer = require('multer');
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const db = require('./db');
const { apiLimiter } = require('./middleware/rateLimiter');
const { getCsrfToken } = require('./middleware/csrf');

// Route imports
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const contentRoutes = require('./routes/contentRoutes');

// Initialize express app
const app = express();

// Trust proxy (required for rate limiting behind Nginx/Cloudflare)
app.set('trust proxy', 1);

// SECURITY: Fail fast if JWT_SECRET is missing or too short
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET must be set in .env and at least 32 characters');
    process.exit(1);
}

// Security headers
app.disable('x-powered-by');

// Use Helmet for security headers including CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-inline needed for inline scripts
            scriptSrcAttr: ["'unsafe-inline'"], // needed for inline event handlers (onclick, etc.)
            imgSrc: ["'self'", "data:", "https:", "http:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Additional security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

// FIX #13: CORS — whitelist specific origins instead of wildcard
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
    : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, same-origin)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

// FIX #8: HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General API rate limiting
app.use('/api', apiLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/admin', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/settings', require('./routes/settingsRoutes'));

// CSRF token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Health check endpoint (includes DB ping)
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.status(200).json({
            status: 'success',
            message: 'Server is running',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Server running but database unavailable',
            database: 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
});

// Handle undefined API routes
app.all('/api/*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Cannot find ${req.originalUrl} on this server`
    });
});

// For non-API routes, serve index.html (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Global error handler (includes multer file-size errors + malformed JSON)
app.use((err, req, res, next) => {
    console.error('Error:', err.message);

    // CORS error
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            status: 'error',
            message: 'CORS: Origin not allowed'
        });
    }

    // Multer file-size limit
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            status: 'error',
            message: err.code === 'LIMIT_FILE_SIZE'
                ? 'File too large. Maximum size is 5MB.'
                : err.message
        });
    }

    // Malformed JSON body
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid JSON in request body'
        });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
    console.log(`Uploads: http://localhost:${PORT}/uploads`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
    });
});

// Prevent silent crashes
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Give server time to finish pending requests, then exit
    server.close(() => process.exit(1));
});

module.exports = app;
