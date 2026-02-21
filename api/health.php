<?php
/**
 * Health Check Endpoint
 * GET /api/health
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

setCorsHeaders();

try {
    $pdo->query('SELECT 1');
    jsonResponse([
        'status'    => 'success',
        'message'   => 'Server is running',
        'database'  => 'connected',
        'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
    ]);
} catch (Exception $e) {
    jsonResponse([
        'status'    => 'error',
        'message'   => 'Server running but database unavailable',
        'database'  => 'disconnected',
        'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
    ], 500);
}
