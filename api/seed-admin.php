<?php
/**
 * Admin Seed Script
 * Run this once to create the default admin account
 * 
 * Usage: Navigate to http://localhost/new-main - Copy/api/seed-admin.php
 * Then DELETE this file for security.
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

setCorsHeaders();

// Default admin credentials
$adminName     = 'Admin';
$adminEmail    = 'admin@maadhivs.com';

// Generate secure random password (or use environment variable)
$adminPassword = getenv('ADMIN_PASSWORD') ?: bin2hex(random_bytes(8)); // 16 character random password

try {
    // Check if admin already exists
    $stmt = $pdo->prepare('SELECT id FROM admins WHERE email = ?');
    $stmt->execute([strtolower($adminEmail)]);
    
    if ($stmt->fetch()) {
        jsonResponse([
            'status'  => 'info',
            'message' => 'Admin account already exists. No changes made.',
        ]);
    }

    // Hash password (bcrypt — compatible with both PHP and Node.js bcryptjs)
    $hashedPassword = password_hash($adminPassword, PASSWORD_BCRYPT, ['cost' => 10]);

    $stmt = $pdo->prepare('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)');
    $stmt->execute([$adminName, strtolower($adminEmail), $hashedPassword]);

    jsonResponse([
        'status'  => 'success',
        'message' => 'Admin account created successfully',
        'admin'   => [
            'email'    => $adminEmail,
            'password' => $adminPassword,
        ],
        'warning' => 'DELETE this file (seed-admin.php) after use for security!',
    ]);
} catch (PDOException $e) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Failed to create admin: ' . $e->getMessage(),
    ], 500);
}
