<?php
/**
 * Admin Authentication Endpoint
 * POST /api/admin/login  → login
 * GET  /api/admin/me     → get current admin
 * POST /api/admin/logout → logout
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

setCorsHeaders();
startSecureSession();

$method   = $_SERVER['REQUEST_METHOD'];
$segments = getPathSegments();
$action   = $segments[0] ?? '';

// ─── POST /api/admin/login ─────────────────────────
if ($method === 'POST' && $action === 'login') {
    require_once __DIR__ . '/rate-limit.php';
    require_once __DIR__ . '/logger.php';
    
    $body = getJsonBody();
    $email    = $body['email'] ?? '';
    $password = $body['password'] ?? '';

    if (!$email || !$password) {
        jsonResponse(['status' => 'error', 'message' => 'Please provide email and password'], 400);
    }

    if (!isValidEmail($email)) {
        jsonResponse(['status' => 'error', 'message' => 'Invalid email format'], 400);
    }

    // Rate limiting
    $identifier = 'login_' . strtolower(trim($email)) . '_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $rateLimiter = getRateLimiter($pdo);
    $limitCheck = $rateLimiter->checkLimit($identifier);
    
    if (!$limitCheck['allowed']) {
        logSecurityEvent('login_rate_limited', ['email' => $email, 'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown']);
        jsonResponse([
            'status' => 'error',
            'message' => $limitCheck['message'],
            'retry_after' => $limitCheck['retry_after']
        ], 429);
    }

    $stmt = $pdo->prepare('SELECT * FROM admins WHERE email = ?');
    $stmt->execute([strtolower(trim($email))]);
    $admin = $stmt->fetch();

    // Always run password_verify to prevent timing attacks
    $dummyHash = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';
    $hashToCheck = $admin ? $admin['password'] : $dummyHash;
    $isValid = password_verify($password, $hashToCheck);

    if (!$admin || !$isValid) {
        $rateLimiter->recordAttempt($identifier, false);
        logSecurityEvent('login_failed', ['email' => $email, 'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown']);
        
        $remaining = $rateLimiter->getRemainingAttempts($identifier);
        $message = 'Invalid email or password';
        if ($remaining <= 2 && $remaining > 0) {
            $message .= ". $remaining attempts remaining before lockout.";
        }
        
        jsonResponse(['status' => 'error', 'message' => $message], 401);
    }

    // Successful login - clear rate limit
    $rateLimiter->recordAttempt($identifier, true);
    
    // Regenerate session ID to prevent session fixation
    session_regenerate_id(true);
    
    // Set session
    $_SESSION['admin_id']    = $admin['id'];
    $_SESSION['admin_name']  = $admin['name'];
    $_SESSION['admin_email'] = $admin['email'];
    $_SESSION['login_time']  = time();
    $_SESSION['last_activity'] = time();

    // Generate CSRF token for session
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    $_SESSION['csrf_token_time'] = time();
    
    logSecurityEvent('login_success', ['admin_id' => $admin['id'], 'email' => $email]);

    jsonResponse([
        'status' => 'success',
        'token'  => session_id(),
        'admin'  => [
            'id'    => (int) $admin['id'],
            'name'  => $admin['name'],
            'email' => $admin['email'],
        ]
    ]);
}

// ─── GET /api/admin/me ─────────────────────────────
if ($method === 'GET' && $action === 'me') {
    $admin = requireAuth();

    $stmt = $pdo->prepare('SELECT id, name, email, created_at FROM admins WHERE id = ?');
    $stmt->execute([$admin['id']]);
    $row = $stmt->fetch();

    if (!$row) {
        jsonResponse(['status' => 'error', 'message' => 'Admin not found'], 404);
    }

    $row['id'] = (int) $row['id'];

    jsonResponse([
        'status' => 'success',
        'admin'  => $row
    ]);
}

// ─── POST /api/admin/logout ────────────────────────
if ($method === 'POST' && $action === 'logout') {
    session_destroy();
    jsonResponse(['status' => 'success', 'message' => 'Logged out']);
}

// ─── Fallback ──────────────────────────────────────
jsonResponse(['status' => 'error', 'message' => 'Invalid auth endpoint'], 404);
