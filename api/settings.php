<?php
/**
 * Settings API
 * GET /api/settings      → get all settings
 * PUT /api/settings      → update settings (auth)
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/csrf.php';

setCorsHeaders();
startSecureSession();

$method = $_SERVER['REQUEST_METHOD'];

// ═════════════════════════════════════════════════════
// GET /api/settings
// ═════════════════════════════════════════════════════
if ($method === 'GET') {
    $stmt = $pdo->query('SELECT setting_key, setting_value FROM settings');
    $rows = $stmt->fetchAll();

    $settingsObj = [];
    foreach ($rows as $row) {
        $settingsObj[$row['setting_key']] = $row['setting_value'];
    }

    jsonResponse(['status' => 'success', 'data' => $settingsObj]);
}

// ═════════════════════════════════════════════════════
// PUT /api/settings
// ═════════════════════════════════════════════════════
if ($method === 'PUT') {
    requireAuth();
    requireCsrfToken();
    $updates = getJsonBody();

    foreach ($updates as $key => $value) {
        $stmt = $pdo->prepare('SELECT setting_key FROM settings WHERE setting_key = ?');
        $stmt->execute([$key]);

        if ($stmt->fetch()) {
            $pdo->prepare('UPDATE settings SET setting_value = ? WHERE setting_key = ?')->execute([$value, $key]);
        } else {
            $pdo->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)')->execute([$key, $value]);
        }
    }

    jsonResponse(['status' => 'success', 'message' => 'Settings updated successfully']);
}

// ─── Fallback ──────────────────────────────────────
jsonResponse(['status' => 'error', 'message' => 'Invalid settings endpoint'], 404);
