const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

/**
 * Admin Login
 * POST /api/admin/login
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

        // Find admin by email
        const [admins] = await db.query(
            'SELECT * FROM admins WHERE email = ?',
            [email]
        );

        if (admins.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        const admin = admins[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
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
