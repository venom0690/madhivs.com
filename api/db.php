<?php
/**
 * Database Connection (PDO)
 * Shared by all API files
 */

require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_PERSISTENT         => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ]
    );
} catch (PDOException $e) {
    // Log error securely
    error_log('Database connection failed: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => IS_PRODUCTION ? 'Service temporarily unavailable' : 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}
