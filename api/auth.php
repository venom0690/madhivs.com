<?php
/**
 * Session-based Authentication Helper
 * Replaces JWT middleware
 */

function startSecureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        $params = [
            'lifetime' => SESSION_LIFETIME,
            'path'     => '/',
            'httponly'  => true,
            'samesite'  => 'Strict',
        ];
        
        // Add secure flag if HTTPS is enabled
        if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
            $params['secure'] = true;
        }
        
        session_set_cookie_params($params);
        session_start();
        
        // Session timeout check
        if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > SESSION_LIFETIME)) {
            session_unset();
            session_destroy();
            session_start();
        }
        
        $_SESSION['last_activity'] = time();
    }
}

/**
 * Require admin authentication.
 * Call at the top of any protected endpoint.
 * Returns admin array or sends 401 and exits.
 */
function requireAuth() {
    startSecureSession();

    if (empty($_SESSION['admin_id'])) {
        http_response_code(401);
        echo json_encode([
            'status'  => 'error',
            'message' => 'You are not logged in. Please log in to access this resource.'
        ]);
        exit;
    }

    return [
        'id'    => $_SESSION['admin_id'],
        'name'  => $_SESSION['admin_name'] ?? '',
        'email' => $_SESSION['admin_email'] ?? '',
    ];
}

/**
 * Optional auth check — returns admin array or null (no exit).
 */
function getCurrentAdmin() {
    startSecureSession();

    if (empty($_SESSION['admin_id'])) {
        return null;
    }

    return [
        'id'    => $_SESSION['admin_id'],
        'name'  => $_SESSION['admin_name'] ?? '',
        'email' => $_SESSION['admin_email'] ?? '',
    ];
}
