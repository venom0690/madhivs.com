<?php
/**
 * CSRF Token Endpoint
 * GET /api/csrf-token → returns CSRF token for frontend
 */

require_once __DIR__ . '/csrf.php';

header('Content-Type: application/json');
setCorsHeaders();

$token = generateCsrfToken();

echo json_encode([
    'status' => 'success',
    'csrfToken' => $token
]);
