<?php
/**
 * Categories API
 * GET    /api/categories          → list (flat or nested tree)
 * GET    /api/categories/{id}     → single category
 * POST   /api/categories          → create (auth required)
 * PUT    /api/categories/{id}     → update (auth required)
 * DELETE /api/categories/{id}     → delete (auth required)
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/csrf.php';

setCorsHeaders();
startSecureSession();

$method   = $_SERVER['REQUEST_METHOD'];
$segments = getPathSegments();

$VALID_TYPES = ['Men', 'Women', 'Accessories', 'General'];

// ═════════════════════════════════════════════════════
// GET /api/categories  — List all categories
// ═════════════════════════════════════════════════════
if ($method === 'GET' && empty($segments)) {
    $type   = $_GET['type'] ?? null;
    $nested = $_GET['nested'] ?? null;

    $query  = 'SELECT * FROM categories WHERE is_active = 1';
    $params = [];

    if ($type) {
        if (!in_array($type, $VALID_TYPES)) {
            jsonResponse(['status' => 'error', 'message' => 'Type must be one of: Men, Women, Accessories, General'], 400);
        }
        $query .= ' AND type = ?';
        $params[] = $type;
    }

    $query .= ' ORDER BY name';

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $categories = $stmt->fetchAll();

    // Cast types
    foreach ($categories as &$cat) {
        $cat['id']        = (int) $cat['id'];
        $cat['is_active'] = (int) $cat['is_active'];
        $cat['parent_id'] = $cat['parent_id'] ? (int) $cat['parent_id'] : null;
    }
    unset($cat);

    if ($nested === 'true') {
        $tree = buildCategoryTree($categories);
        jsonResponse([
            'status'     => 'success',
            'results'    => count($tree),
            'categories' => $tree,
        ]);
    }

    jsonResponse([
        'status'     => 'success',
        'results'    => count($categories),
        'categories' => $categories,
    ]);
}

// ═════════════════════════════════════════════════════
// GET /api/categories/{id}  — Single category
// ═════════════════════════════════════════════════════
if ($method === 'GET' && !empty($segments[0])) {
    $catId = intval($segments[0]);

    $stmt = $pdo->prepare('SELECT * FROM categories WHERE id = ?');
    $stmt->execute([$catId]);
    $cat = $stmt->fetch();

    if (!$cat) {
        jsonResponse(['status' => 'error', 'message' => 'Category not found'], 404);
    }

    $cat['id']        = (int) $cat['id'];
    $cat['is_active'] = (int) $cat['is_active'];
    $cat['parent_id'] = $cat['parent_id'] ? (int) $cat['parent_id'] : null;

    jsonResponse(['status' => 'success', 'category' => $cat]);
}

// ═════════════════════════════════════════════════════
// POST /api/categories  — Create category
// ═════════════════════════════════════════════════════
if ($method === 'POST' && empty($segments)) {
    requireAuth();
    requireCsrfToken();
    $body = getJsonBody();

    $name        = $body['name'] ?? '';
    $type        = $body['type'] ?? '';
    $description = $body['description'] ?? null;
    $image       = $body['image'] ?? null;
    $parent_id   = $body['parent_id'] ?? null;

    // Validate name
    if (!$name || !is_string($name)) {
        jsonResponse(['status' => 'error', 'message' => 'Name is required and must be a string'], 400);
    }
    $trimmedName = trim($name);
    if (mb_strlen($trimmedName) < 2 || mb_strlen($trimmedName) > 100) {
        jsonResponse(['status' => 'error', 'message' => 'Name must be between 2 and 100 characters'], 400);
    }

    // Validate type
    if (!$type || !in_array($type, $VALID_TYPES)) {
        jsonResponse(['status' => 'error', 'message' => 'Type must be one of: Men, Women, Accessories, General'], 400);
    }

    // Validate description length
    if ($description && mb_strlen($description) > 500) {
        jsonResponse(['status' => 'error', 'message' => 'Description cannot exceed 500 characters'], 400);
    }

    // Validate image path
    if ($image && (strpos($image, '..') !== false || (strpos($image, '/uploads/') !== 0 && $image !== ''))) {
        jsonResponse(['status' => 'error', 'message' => 'Invalid image path'], 400);
    }

    // Validate parent_id
    if ($parent_id !== null && $parent_id !== '') {
        $parentIdNum = intval($parent_id);
        if ($parentIdNum < 1) {
            jsonResponse(['status' => 'error', 'message' => 'Invalid parent category ID'], 400);
        }
        $stmt = $pdo->prepare('SELECT id, type FROM categories WHERE id = ?');
        $stmt->execute([$parentIdNum]);
        if (!$stmt->fetch()) {
            jsonResponse(['status' => 'error', 'message' => 'Parent category not found'], 400);
        }
    }

    $slug = slugify($trimmedName);

    try {
        $stmt = $pdo->prepare('INSERT INTO categories (name, slug, type, description, image, parent_id) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $trimmedName, $slug, $type,
            $description ?: null, $image ?: null,
            ($parent_id !== null && $parent_id !== '') ? intval($parent_id) : null,
        ]);

        $insertId = $pdo->lastInsertId();
        $stmt2 = $pdo->prepare('SELECT * FROM categories WHERE id = ?');
        $stmt2->execute([$insertId]);
        $cat = $stmt2->fetch();
        $cat['id']        = (int) $cat['id'];
        $cat['is_active'] = (int) $cat['is_active'];
        $cat['parent_id'] = $cat['parent_id'] ? (int) $cat['parent_id'] : null;

        jsonResponse(['status' => 'success', 'category' => $cat], 201);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            jsonResponse(['status' => 'error', 'message' => 'A category with this name already exists'], 400);
        }
        jsonResponse(['status' => 'error', 'message' => 'An error occurred while creating category'], 500);
    }
}

// ═════════════════════════════════════════════════════
// PUT /api/categories/{id}  — Update category
// ═════════════════════════════════════════════════════
if ($method === 'PUT' && !empty($segments[0])) {
    requireAuth();
    requireCsrfToken();
    $catId = intval($segments[0]);
    $body  = getJsonBody();

    $updates = [];
    $params  = [];

    if (isset($body['name']) && $body['name']) {
        $trimmed = trim($body['name']);
        if (mb_strlen($trimmed) < 2 || mb_strlen($trimmed) > 100) {
            jsonResponse(['status' => 'error', 'message' => 'Name must be between 2 and 100 characters'], 400);
        }
        $updates[] = 'name = ?';
        $params[]  = $trimmed;
        $updates[] = 'slug = ?';
        $params[]  = slugify($trimmed);
    }

    if (isset($body['type']) && $body['type']) {
        if (!in_array($body['type'], $VALID_TYPES)) {
            jsonResponse(['status' => 'error', 'message' => 'Type must be one of: Men, Women, Accessories, General'], 400);
        }
        $updates[] = 'type = ?';
        $params[]  = $body['type'];
    }

    if (array_key_exists('description', $body)) {
        if ($body['description'] && mb_strlen($body['description']) > 500) {
            jsonResponse(['status' => 'error', 'message' => 'Description cannot exceed 500 characters'], 400);
        }
        $updates[] = 'description = ?';
        $params[]  = $body['description'];
    }

    if (array_key_exists('image', $body)) {
        if ($body['image'] && strpos($body['image'], '..') !== false) {
            jsonResponse(['status' => 'error', 'message' => 'Invalid image path'], 400);
        }
        $updates[] = 'image = ?';
        $params[]  = $body['image'];
    }

    if (array_key_exists('is_active', $body)) {
        $updates[] = 'is_active = ?';
        $params[]  = $body['is_active'] ? 1 : 0;
    }

    if (array_key_exists('parent_id', $body)) {
        $parentIdValue = ($body['parent_id'] === '' || $body['parent_id'] === null) ? null : $body['parent_id'];

        if ($parentIdValue !== null) {
            // Prevent self-reference
            if (intval($parentIdValue) === $catId) {
                jsonResponse(['status' => 'error', 'message' => 'Category cannot be its own parent'], 400);
            }
            // Prevent circular reference
            $descendants = getCategoryDescendants($pdo, $catId);
            if (in_array(intval($parentIdValue), $descendants)) {
                jsonResponse(['status' => 'error', 'message' => 'Cannot set parent to a descendant category (circular reference)'], 400);
            }
            // Validate parent exists
            $s = $pdo->prepare('SELECT id FROM categories WHERE id = ?');
            $s->execute([$parentIdValue]);
            if (!$s->fetch()) {
                jsonResponse(['status' => 'error', 'message' => 'Parent category not found'], 400);
            }
        }

        $updates[] = 'parent_id = ?';
        $params[]  = $parentIdValue;
    }

    if (empty($updates)) {
        jsonResponse(['status' => 'error', 'message' => 'No fields to update'], 400);
    }

    $params[] = $catId;
    $pdo->prepare("UPDATE categories SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);

    $stmt = $pdo->prepare('SELECT * FROM categories WHERE id = ?');
    $stmt->execute([$catId]);
    $cat = $stmt->fetch();

    if (!$cat) {
        jsonResponse(['status' => 'error', 'message' => 'Category not found'], 404);
    }

    $cat['id']        = (int) $cat['id'];
    $cat['is_active'] = (int) $cat['is_active'];
    $cat['parent_id'] = $cat['parent_id'] ? (int) $cat['parent_id'] : null;

    jsonResponse(['status' => 'success', 'category' => $cat]);
}

// ═════════════════════════════════════════════════════
// DELETE /api/categories/{id}  — Delete category
// ═════════════════════════════════════════════════════
if ($method === 'DELETE' && !empty($segments[0])) {
    requireAuth();
    requireCsrfToken();
    $catId = intval($segments[0]);

    // Check children
    $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM categories WHERE parent_id = ?');
    $stmt->execute([$catId]);
    $childCount = (int) $stmt->fetchColumn();

    if ($childCount > 0) {
        jsonResponse(['status' => 'error', 'message' => "Cannot delete category with {$childCount} subcategories. Delete or reassign children first."], 400);
    }

    // Check products
    $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ? OR subcategory_id = ?');
    $stmt->execute([$catId, $catId]);
    $prodCount = (int) $stmt->fetchColumn();

    if ($prodCount > 0) {
        jsonResponse(['status' => 'error', 'message' => "Cannot delete category with {$prodCount} products. Reassign products first."], 400);
    }

    $stmt = $pdo->prepare('DELETE FROM categories WHERE id = ?');
    $stmt->execute([$catId]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['status' => 'error', 'message' => 'Category not found'], 404);
    }

    jsonResponse(['status' => 'success', 'message' => 'Category deleted successfully']);
}

// ─── Fallback ──────────────────────────────────────
jsonResponse(['status' => 'error', 'message' => 'Invalid categories endpoint'], 404);
