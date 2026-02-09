/**
 * Seed Admin User - MySQL Version
 * Run: node seeds/seedAdmin.js
 * Creates the default admin user in MySQL
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../db');

async function seedAdmin() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@maadhivs.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

        // Check if admin already exists
        const [existing] = await db.query(
            'SELECT id FROM admins WHERE email = ?',
            [adminEmail]
        );

        if (existing.length > 0) {
            console.log(`Admin already exists: ${adminEmail}`);
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 12);

        // Insert admin
        await db.query(
            'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
            ['Admin', adminEmail, hashedPassword]
        );

        console.log(`Admin created successfully!`);
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        process.exit(0);

    } catch (error) {
        console.error('Seed error:', error.message);
        process.exit(1);
    }
}

seedAdmin();
