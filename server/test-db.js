/**
 * Test database password retrieval
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'maadhivs_boutique',
        });

        console.log('✓ Connected to database');

        const [rows] = await connection.query('SELECT * FROM admins WHERE email = ?', ['admin@maadhivs.com']);

        console.log('\n━━━ DATABASE QUERY RESULT ━━━');
        console.log('Number of rows:', rows.length);

        if (rows.length > 0) {
            const admin = rows[0];
            console.log('\nAdmin object keys:', Object.keys(admin));
            console.log('Email:', admin.email);
            console.log('Password type:', typeof admin.password);
            console.log('Password value:', admin.password);
            console.log('Password length:', admin.password ? admin.password.length : 'N/A');
            console.log('Password starts with $2:', admin.password ? admin.password.startsWith('$2') : false);
        } else {
            console.log('No admin found!');
        }

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testDB();
