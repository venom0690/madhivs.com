/**
 * Fix Admin - Generate proper hash and insert
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

async function fixAdmin() {
    try {
        // Delete all admins
        await db.query('DELETE FROM admins');
        console.log('✓ Deleted existing admins');

        // Generate proper bcrypt hash
        const password = 'Admin@123';
        const hashedPassword = await bcrypt.hash(password, 12);
        
        console.log('Generated hash:', hashedPassword);
        console.log('Hash length:', hashedPassword.length);
        
        // Insert admin with proper hash
        await db.query(
            'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
            ['Admin', 'admin@maadhivs.com', hashedPassword]
        );
        
        console.log('✓ Admin inserted successfully');
        
        // Verify by reading back
        const [admins] = await db.query('SELECT email, password FROM admins');
        console.log('\nVerification:');
        console.log('Email:', admins[0].email);
        console.log('Password hash:', admins[0].password);
        console.log('Hash starts with $2a$ or $2b$:', admins[0].password.startsWith('$2'));
        
        // Test bcrypt.compare
        const isValid = await bcrypt.compare(password, admins[0].password);
        console.log('\nbcrypt.compare test:', isValid ? '✅ PASS' : '❌ FAIL');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixAdmin();
