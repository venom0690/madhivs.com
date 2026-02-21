<?php
/**
 * Content API (Homepage Settings + Search Keywords)
 * GET    /api/content/homepage         → get homepage config
 * POST   /api/content/homepage         → update homepage config (auth)
 * PUT    /api/content/homepage         → update homepage config (auth, alias)
 * GET    /api/content/keywords         → list keywords
 * POST   /api/content/keywords         → create keyword (auth)
 * PUT    /api/content/keywords/{id}    → update keyword (auth)
 * DELETE /api/content/keywords/{id}    → delete keyword (auth)
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/csrf.php';

setCorsHeaders();
startSecureSession();

$method   = $_SERVER['REQUEST_METHOD'];
$segments = getPathSegments();
$resource = $segments[0] ?? '';
$subId    = $segments[1] ?? null;

// ═══════════════════════════════════════════════
//  HOMEPAGE SETTINGS
// ═══════════════════════════════════════════════

if ($resource === 'homepage') {

    // GET /api/content/homepage
    if ($method === 'GET') {
        $stmt = $pdo->prepare('SELECT setting_value FROM settings WHERE setting_key = ?');
        $stmt->execute(['homepage_config']);
        $row = $stmt->fetch();

        if (!$row) {
            jsonResponse([
                'status' => 'success',
                'data'   => ['sliderImages' => [], 'trendingProductIds' => [], 'popularProductIds' => []],
            ]);
        }

        $config = $row['setting_value'];
        if (is_string($config)) {
            $config = safeJsonDecode($config, []);
        }

        jsonResponse(['status' => 'success', 'data' => $config]);
    }

    // POST|PUT /api/content/homepage
    if ($method === 'POST' || $method === 'PUT') {
        requireAuth();
        requireCsrfToken();
        $config = getJsonBody();

        if (!$config || !is_array($config)) {
            jsonResponse(['status' => 'error', 'message' => 'Invalid configuration data'], 400);
        }

        $jsonConfig = json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $stmt = $pdo->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?');
        $stmt->execute(['homepage_config', $jsonConfig, $jsonConfig]);

        jsonResponse(['status' => 'success', 'message' => 'Homepage settings updated', 'data' => $config]);
    }
}

// ═══════════════════════════════════════════════
//  SEARCH KEYWORDS
// ═══════════════════════════════════════════════

if ($resource === 'keywords') {

    // GET /api/content/keywords
    if ($method === 'GET' && !$subId) {
        $stmt = $pdo->query('SELECT * FROM search_keywords ORDER BY created_at DESC');
        $rows = $stmt->fetchAll();

        $keywords = array_map(function ($row) {
            return [
                'id'               => (int) $row['id'],
                'keyword'          => $row['keyword'],
                'linked_products'  => $row['linked_products'],
                'linked_categories'=> $row['linked_categories'],
                'linkedProducts'   => safeJsonDecode($row['linked_products']),
                'linkedCategories' => safeJsonDecode($row['linked_categories']),
                'created_at'       => $row['created_at'],
            ];
        }, $rows);

        jsonResponse(['status' => 'success', 'data' => $keywords]);
    }

    // POST /api/content/keywords
    if ($method === 'POST' && !$subId) {
        requireAuth();
        requireCsrfToken();
        $body = getJsonBody();
        $keyword          = $body['keyword'] ?? '';
        $linkedProducts   = $body['linkedProducts'] ?? [];
        $linkedCategories = $body['linkedCategories'] ?? [];

        if (!$keyword) {
            jsonResponse(['status' => 'error', 'message' => 'Keyword is required'], 400);
        }

        try {
            $stmt = $pdo->prepare('INSERT INTO search_keywords (keyword, linked_products, linked_categories) VALUES (?, ?, ?)');
            $stmt->execute([
                strtolower($keyword),
                json_encode($linkedProducts),
                json_encode($linkedCategories),
            ]);

            jsonResponse([
                'status' => 'success',
                'data'   => [
                    'id'               => (int) $pdo->lastInsertId(),
                    'keyword'          => $keyword,
                    'linkedProducts'   => $linkedProducts,
                    'linkedCategories' => $linkedCategories,
                ],
            ], 201);
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                jsonResponse(['status' => 'error', 'message' => 'Keyword already exists'], 400);
            }
            jsonResponse(['status' => 'error', 'message' => 'Failed to create keyword'], 500);
        }
    }

    // PUT /api/content/keywords/{id}
    if ($method === 'PUT' && $subId) {
        requireAuth();
        requireCsrfToken();
        $body = getJsonBody();
        $keyword          = $body['keyword'] ?? '';
        $linkedProducts   = $body['linkedProducts'] ?? [];
        $linkedCategories = $body['linkedCategories'] ?? [];

        if (!$keyword) {
            jsonResponse(['status' => 'error', 'message' => 'Keyword is required'], 400);
        }

        $stmt = $pdo->prepare('UPDATE search_keywords SET keyword = ?, linked_products = ?, linked_categories = ? WHERE id = ?');
        $stmt->execute([
            strtolower($keyword),
            json_encode($linkedProducts),
            json_encode($linkedCategories),
            intval($subId),
        ]);

        jsonResponse([
            'status' => 'success',
            'data'   => [
                'id'               => intval($subId),
                'keyword'          => $keyword,
                'linkedProducts'   => $linkedProducts,
                'linkedCategories' => $linkedCategories,
            ],
        ]);
    }

    // DELETE /api/content/keywords/{id}
    if ($method === 'DELETE' && $subId) {
        requireAuth();
        requireCsrfToken();
        $pdo->prepare('DELETE FROM search_keywords WHERE id = ?')->execute([intval($subId)]);
        jsonResponse(['status' => 'success', 'message' => 'Keyword deleted']);
    }
}

// ─── Fallback ──────────────────────────────────────
jsonResponse(['status' => 'error', 'message' => 'Invalid content endpoint'], 404);
