/**
 * DIAGNOSTIC: Trace admin login flow step-by-step
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function diagnose() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' ADMIN LOGIN DIAGNOSTIC');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // STEP 1: Check environment variables
    console.log('\n[STEP 1] Environment Variables:');
    console.log('  DB_HOST:', process.env.DB_HOST || '(not set, using localhost)');
    console.log('  DB_USER:', process.env.DB_USER || '(not set, using root)');
    console.log('  DB_PASSWORD:', process.env.DB_PASSWORD !== undefined ? '***SET***' : '(not set, using empty)');
    console.log('  DB_NAME:', process.env.DB_NAME || '(not set, using maadhivs_boutique)');
    console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '***SET*** (length=' + process.env.JWT_SECRET.length + ')' : '❌ NOT SET');
    console.log('  JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || '(not set, using 7d)');

    if (!process.env.JWT_SECRET) {
        console.log('\n  ⚠️  WARNING: JWT_SECRET is NOT set!');
        console.log('  jwt.sign() will THROW an error: "secretOrPrivateKey must have a value"');
        console.log('  This means login will hit the catch block and return 500 error.');
    }

    // STEP 2: Connect to DB
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'maadhivs_boutique',
        });
        console.log('\n[STEP 2] Database Connection: ✅ Connected');
    } catch (err) {
        console.log('\n[STEP 2] Database Connection: ❌ FAILED');
        console.log('  Error:', err.message);
        process.exit(1);
    }

    // STEP 3: Query admin
    const testEmail = 'admin@maadhivs.com';
    const testPassword = 'Admin@123';

    console.log('\n[STEP 3] DB Query (SELECT * FROM admins WHERE email = ?)');
    console.log('  Testing email:', testEmail);

    const [rows] = await connection.query('SELECT * FROM admins WHERE email = ?', [testEmail]);
    console.log('  Rows returned:', rows.length);

    if (rows.length === 0) {
        console.log('  ❌ No admin found with this email!');
        console.log('  LOGIN FAILS HERE → "Invalid email or password"');
        console.log('\n  FIX: Run "node seeds/seedAdmin.js" or "node fix-admin.js"');
        await connection.end();
        process.exit(1);
    }

    const admin = rows[0];
    console.log('  ✅ Admin found');
    console.log('  Admin ID:', admin.id);
    console.log('  Admin Name:', admin.name);
    console.log('  Admin Email:', admin.email);

    // STEP 4: Inspect password hash
    console.log('\n[STEP 4] Password Hash Inspection:');
    console.log('  Hash value:', admin.password);
    console.log('  Hash length:', admin.password ? admin.password.length : 'NULL');
    console.log('  Hash type:', typeof admin.password);
    console.log('  Starts with $2a$ or $2b$:', admin.password ? admin.password.startsWith('$2') : false);

    if (!admin.password || !admin.password.startsWith('$2')) {
        console.log('  ❌ Password is NOT a valid bcrypt hash!');
        console.log('  This means password was stored as PLAIN TEXT or is corrupted.');
        console.log('  LOGIN FAILS HERE → bcrypt.compare returns false');
        console.log('\n  FIX: Re-hash and update the password.');
        await connection.end();
        process.exit(1);
    }

    // Check for hash truncation
    if (admin.password.length !== 60) {
        console.log('  ⚠️  WARNING: Hash length is', admin.password.length, '(expected 60)');
        console.log('  The hash may have been TRUNCATED by a too-short VARCHAR column!');
    } else {
        console.log('  ✅ Hash length is correct (60 chars)');
    }

    // STEP 5: bcrypt.compare
    console.log('\n[STEP 5] bcrypt.compare("' + testPassword + '", hash):');
    const isValid = await bcrypt.compare(testPassword, admin.password);
    console.log('  Result:', isValid ? '✅ MATCH' : '❌ NO MATCH');

    if (!isValid) {
        console.log('\n  The hash in the database does NOT match "' + testPassword + '"');
        console.log('  POSSIBLE CAUSES:');
        console.log('    1. Password was hashed with a DIFFERENT plaintext');
        console.log('    2. Hash in schema.sql was manually typed/copied wrong');
        console.log('    3. Admin was seeded with a different password');
        console.log('\n  Let me verify what "Admin@123" should hash to...');
        const freshHash = await bcrypt.hash(testPassword, 12);
        console.log('  Fresh hash of "Admin@123":', freshHash);
        console.log('  Fresh hash matches DB hash:', await bcrypt.compare(testPassword, freshHash) ? 'YES' : 'NO');
        console.log('\n  LOGIN FAILS HERE → "Invalid email or password"');
        console.log('  FIX: Run "node fix-admin.js" to re-hash and insert correct password.');
    }

    // STEP 6: JWT signing test
    if (isValid) {
        console.log('\n[STEP 6] JWT Signing Test:');
        if (!process.env.JWT_SECRET) {
            console.log('  ❌ JWT_SECRET is not set!');
            console.log('  jwt.sign() will THROW: "secretOrPrivateKey must have a value"');
            console.log('  LOGIN FAILS HERE → 500 Internal Server Error');
            console.log('\n  FIX: Create .env file with JWT_SECRET=your_secret_key_here');
        } else {
            try {
                const jwt = require('jsonwebtoken');
                const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
                console.log('  ✅ JWT token generated successfully');
                console.log('  Token (first 50 chars):', token.substring(0, 50) + '...');
            } catch (err) {
                console.log('  ❌ JWT signing FAILED:', err.message);
            }
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' DIAGNOSIS COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await connection.end();
    process.exit(0);
}

diagnose().catch(err => {
    console.error('Diagnostic failed:', err);
    process.exit(1);
});
