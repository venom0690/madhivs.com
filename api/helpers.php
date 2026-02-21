<?php
/**
 * Shared Helpers — mirrors server/utils/helpers.js + validators.js
 */

/* ── JSON Response ─────────────────────────────────── */

function jsonResponse($data, int $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* ── Slug ──────────────────────────────────────────── */

function slugify(string $text): string {
    $text = mb_strtolower(trim($text));
    $text = preg_replace('/\s+/', '-', $text);
    $text = preg_replace('/[^\w\-]+/', '', $text);
    $text = preg_replace('/\-\-+/', '-', $text);
    return $text;
}

/* ── Safe JSON decode ─────────────────────────────── */

function safeJsonDecode($str, $fallback = []) {
    if (!$str) return $fallback;
    if (is_array($str) || is_object($str)) return $str;
    $decoded = json_decode($str, true);
    return ($decoded !== null) ? $decoded : $fallback;
}

/* ── Sanitize ─────────────────────────────────────── */

function sanitizeInput(?string $input): string {
    if (!$input) return '';
    $input = str_replace(['<', '>'], '', $input);
    $input = preg_replace('/javascript:/i', '', $input);
    $input = preg_replace('/on\w+=/i', '', $input);
    return trim($input);
}

/* ── Validators ───────────────────────────────────── */

function isValidEmail(string $email): bool {
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

function isValidPhone(string $phone): bool {
    $cleaned = preg_replace('/[\s\-]/', '', $phone);
    return (bool) preg_match('/^\+?\d{10,15}$/', $cleaned);
}

function validateText($input, int $min = 1, int $max = 1000): array {
    if (!$input || !is_string($input)) {
        return ['valid' => false, 'error' => 'Input is required'];
    }
    $sanitized = sanitizeInput($input);
    if (mb_strlen($sanitized) < $min) {
        return ['valid' => false, 'error' => "Minimum length is {$min} characters"];
    }
    if (mb_strlen($sanitized) > $max) {
        return ['valid' => false, 'error' => "Maximum length is {$max} characters"];
    }
    return ['valid' => true, 'error' => null];
}

/* ── Get Request Body (JSON) ──────────────────────── */

function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/* ── Path Info / Route Parsing ────────────────────── */

function getPathSegments(): array {
    $path = $_SERVER['PATH_INFO'] ?? '';
    if (empty($path) || $path === '/') return [];
    $segments = explode('/', trim($path, '/'));
    return array_values(array_filter($segments, fn($s) => $s !== ''));
}

/* ── Recursive Category Descendants ───────────────── */

function getCategoryDescendants(PDO $pdo, int $categoryId, int $maxDepth = 20): array {
    $ids = [$categoryId];
    $visited = [];

    $findChildren = function (int $parentId, int $depth) use ($pdo, $maxDepth, &$ids, &$visited, &$findChildren) {
        if ($depth > $maxDepth) return;
        if (in_array($parentId, $visited)) return;
        $visited[] = $parentId;

        $stmt = $pdo->prepare('SELECT id FROM categories WHERE parent_id = ?');
        $stmt->execute([$parentId]);
        $children = $stmt->fetchAll();

        foreach ($children as $child) {
            $ids[] = (int) $child['id'];
            $findChildren((int) $child['id'], $depth + 1);
        }
    };

    $findChildren($categoryId, 0);
    return $ids;
}

/* ── Build Category Tree ──────────────────────────── */

function buildCategoryTree(array $categories, int $maxDepth = 10): array {
    $childrenMap = [];
    foreach ($categories as $cat) {
        $pid = $cat['parent_id'];
        $childrenMap[$pid][] = $cat;
    }

    $buildLevel = function ($parentId, int $depth) use ($childrenMap, $maxDepth, &$buildLevel): array {
        if ($depth > $maxDepth) return [];
        $children = $childrenMap[$parentId] ?? [];
        $tree = [];

        foreach ($children as $cat) {
            $node = [
                'id'          => (int) $cat['id'],
                'name'        => $cat['name'],
                'slug'        => $cat['slug'],
                'type'        => $cat['type'],
                'description' => $cat['description'],
                'image'       => $cat['image'],
                'is_active'   => (int) $cat['is_active'],
                'parent_id'   => $cat['parent_id'] ? (int) $cat['parent_id'] : null,
                'created_at'  => $cat['created_at'],
                'updated_at'  => $cat['updated_at'],
            ];

            $grandchildren = $buildLevel($cat['id'], $depth + 1);
            if (!empty($grandchildren)) {
                $node['children'] = $grandchildren;
            }

            $tree[] = $node;
        }
        return $tree;
    };

    return $buildLevel(null, 0);
}

/* ── CORS Headers ─────────────────────────────────── */

function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = ['http://localhost', 'http://127.0.0.1'];

    // Allow same-origin requests (no Origin header) or matching origins
    if (!$origin || in_array($origin, $allowed) || strpos($origin, 'localhost') !== false) {
        if ($origin) {
            header("Access-Control-Allow-Origin: {$origin}");
        }
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
    }

    // Handle preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/* ── Parse product row (decode JSON fields + cast types) ───── */

function parseProductRow(array $row): array {
    $row['id']                  = (int) $row['id'];
    $row['price']               = (float) $row['price'];
    $row['discount_price']      = $row['discount_price'] !== null ? (float) $row['discount_price'] : null;
    $row['category_id']         = (int) $row['category_id'];
    $row['subcategory_id']      = $row['subcategory_id'] ? (int) $row['subcategory_id'] : null;
    $row['stock']               = (int) $row['stock'];
    $row['is_trending']         = (int) $row['is_trending'];
    $row['is_popular']          = (int) $row['is_popular'];
    $row['is_featured']         = (int) $row['is_featured'];
    $row['is_men_collection']   = (int) $row['is_men_collection'];
    $row['is_women_collection'] = (int) $row['is_women_collection'];
    $row['images']              = safeJsonDecode($row['images'] ?? null);
    $row['sizes']               = safeJsonDecode($row['sizes'] ?? null);
    $row['colors']              = safeJsonDecode($row['colors'] ?? null);
    return $row;
}
