<?php
/**
 * CSRF Protection
 * Validates CSRF tokens on state-changing operations
 */

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/helpers.php';

function generateCsrfToken() {
    startSecureSession();
    
    if (!isset($_SESSION['csrf_token']) || !isset($_SESSION['csrf_token_time'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $_SESSION['csrf_token_time'] = time();
    }
    
    // Regenerate token if expired
    if (time() - $_SESSION['csrf_token_time'] > CSRF_TOKEN_EXPIRY) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $_SESSION['csrf_token_time'] = time();
    }
    
    return $_SESSION['csrf_token'];
}

function validateCsrfToken($token = null) {
    startSecureSession();
    
    // Get token from parameter or header
    if ($token === null) {
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? $_GET['csrf_token'] ?? null;
    }
    
    if (!$token) {
        return false;
    }
    
    if (!isset($_SESSION['csrf_token'])) {
        return false;
    }
    
    // Check if token expired
    if (isset($_SESSION['csrf_token_time']) && (time() - $_SESSION['csrf_token_time'] > CSRF_TOKEN_EXPIRY)) {
        return false;
    }
    
    // Timing-safe comparison
    return hash_equals($_SESSION['csrf_token'], $token);
}

function requireCsrfToken() {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
    
    if (!validateCsrfToken($token)) {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid or missing CSRF token'
        ]);
        exit;
    }
}

