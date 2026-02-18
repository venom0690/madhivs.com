const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { isValidEmail } = require('../utils/validators');

/**
 * Admin Login
 * POST /api/admin/login
 * FIX #7: Timing attack prevention (always hash even if user not found)
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide email and password'
            });
        }

        // FIX #16: Email format validation
        if (!isValidEmail(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email format'
            });
        }

        // Find admin by email
        const [admins] = await db.query(
            'SELECT * FROM admins WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        // FIX #7: Always run bcrypt.compare to prevent timing attacks
        // If user not found, compare against a dummy hash so response time is identical
        const dummyHash = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';
        const admin = admins.length > 0 ? admins[0] : null;
        const hashToCheck = admin ? admin.password : dummyHash;

        const isPasswordValid = await bcrypt.compare(password, hashToCheck);

        // Same error response whether user exists or not
        if (!admin || !isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: admin.id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(200).json({
            status: 'success',
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred during login'
        });
    }
};

/**
 * Get current admin info
 * GET /api/admin/me
 */
exports.getMe = async (req, res) => {
    try {
        const [admins] = await db.query(
            'SELECT id, name, email, created_at FROM admins WHERE id = ?',
            [req.admin.id]
        );

        if (admins.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Admin not found'
            });
        }

        res.status(200).json({
            status: 'success',
            admin: admins[0]
        });

    } catch (error) {
        console.error('Get admin error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred'
        });
    }
};
