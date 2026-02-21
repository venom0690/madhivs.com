<?php
/**
 * Products API
 * GET    /api/products            → list (with filters, pagination)
 * GET    /api/products/{idOrSlug} → single product
 * POST   /api/products            → create (auth required)
 * PUT    /api/products/{id}       → update (auth required)
 * DELETE /api/products/{id}       → delete (auth required)
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/csrf.php';

setCorsHeaders();
startSecureSession();

$method   = $_SERVER['REQUEST_METHOD'];
$segments = getPathSegments();

// ═════════════════════════════════════════════════════
// GET /api/products  — List all products (filtered)
// ═════════════════════════════════════════════════════
if ($method === 'GET' && empty($segments)) {
    $category    = $_GET['category'] ?? null;
    $subcategory = $_GET['subcategory'] ?? null;
    $type        = $_GET['type'] ?? null;
    $trending    = $_GET['trending'] ?? null;
    $popular     = $_GET['popular'] ?? null;
    $featured    = $_GET['featured'] ?? null;
    $men         = $_GET['men'] ?? null;
    $women       = $_GET['women'] ?? null;
    $search      = $_GET['search'] ?? null;
    $limit       = $_GET['limit'] ?? 20;
    $page        = $_GET['page'] ?? 1;

    $query = "SELECT p.*, c.name as category_name, c.slug as category_slug, c.type as category_type
              FROM products p
              LEFT JOIN categories c ON p.category_id = c.id
              WHERE 1=1";
    $countQuery = "SELECT COUNT(p.id) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1";

    $params      = [];
    $countParams = [];

    // ── Category filter (with hierarchical descendants) ──
    if ($category) {
        $categoryIdNum = intval($category);

        // Resolve slug if not numeric
        if (!is_numeric($category)) {
            $stmt = $pdo->prepare('SELECT id FROM categories WHERE slug = ?');
            $stmt->execute([$category]);
            $catRow = $stmt->fetch();
            if ($catRow) {
                $categoryIdNum = (int) $catRow['id'];
            } else {
                jsonResponse(['status' => 'error', 'message' => 'Category not found'], 404);
            }
        }

        if ($categoryIdNum < 1) {
            jsonResponse(['status' => 'error', 'message' => 'Invalid category ID'], 400);
        }

        $categoryIds = getCategoryDescendants($pdo, $categoryIdNum);
        $validIds = array_filter($categoryIds, fn($id) => is_int($id) && $id > 0);

        if (!empty($validIds)) {
            $placeholders = implode(',', array_fill(0, count($validIds), '?'));
            $clause = " AND (p.category_id IN ({$placeholders}) OR p.subcategory_id IN ({$placeholders}))";
            $query      .= $clause;
            $countQuery .= $clause;
            $params      = array_merge($params, $validIds, $validIds);
            $countParams = array_merge($countParams, $validIds, $validIds);
        } else {
            $query      .= ' AND 1=0';
            $countQuery .= ' AND 1=0';
        }
    }

    if ($subcategory) {
        $subIdNum = intval($subcategory);
        if ($subIdNum < 1) {
            jsonResponse(['status' => 'error', 'message' => 'Invalid subcategory ID'], 400);
        }
        $query      .= ' AND p.subcategory_id = ?';
        $countQuery .= ' AND p.subcategory_id = ?';
        $params[]      = $subIdNum;
        $countParams[] = $subIdNum;
    }

    if ($type) {
        $query      .= ' AND c.type = ?';
        $countQuery .= ' AND c.type = ?';
        $params[]      = $type;
        $countParams[] = $type;
    }

    if ($trending === 'true') {
        $query      .= ' AND p.is_trending = 1';
        $countQuery .= ' AND p.is_trending = 1';
    }
    if ($popular === 'true') {
        $query      .= ' AND p.is_popular = 1';
        $countQuery .= ' AND p.is_popular = 1';
    }
    if ($featured === 'true') {
        $query      .= ' AND p.is_featured = 1';
        $countQuery .= ' AND p.is_featured = 1';
    }
    if ($men === 'true') {
        $query      .= ' AND p.is_men_collection = 1';
        $countQuery .= ' AND p.is_men_collection = 1';
    }
    if ($women === 'true') {
        $query      .= ' AND p.is_women_collection = 1';
        $countQuery .= ' AND p.is_women_collection = 1';
    }

    if ($search) {
        $sanitizedSearch = mb_substr((string) $search, 0, 200);
        $query      .= ' AND (p.name LIKE ? OR p.description LIKE ?)';
        $countQuery .= ' AND (p.name LIKE ? OR p.description LIKE ?)';
        $searchTerm = "%{$sanitizedSearch}%";
        $params[]      = $searchTerm;
        $params[]      = $searchTerm;
        $countParams[] = $searchTerm;
        $countParams[] = $searchTerm;
    }

    $query .= ' ORDER BY p.created_at DESC';

    // Pagination
    $pageNum  = max(1, intval($page));
    $limitNum = min(100, max(1, intval($limit)));
    $offset   = ($pageNum - 1) * $limitNum;

    // Total count
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute($countParams);
    $total = (int) $countStmt->fetchColumn();

    $query .= ' LIMIT ? OFFSET ?';
    $params[] = $limitNum;
    $params[] = $offset;

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $products = $stmt->fetchAll();

    // Parse JSON fields
    $parsed = array_map('parseProductRow', $products);

    jsonResponse([
        'status'     => 'success',
        'results'    => count($parsed),
        'total'      => $total,
        'page'       => $pageNum,
        'totalPages' => (int) ceil($total / $limitNum),
        'products'   => $parsed,
    ]);
}

// ═════════════════════════════════════════════════════
// GET /api/products/{idOrSlug}  — Single product
// ═════════════════════════════════════════════════════
if ($method === 'GET' && !empty($segments[0])) {
    $idOrSlug = $segments[0];

    $query = "SELECT p.*, c.name as category_name, c.slug as category_slug, c.type as category_type,
                     sc.name as subcategory_name
              FROM products p
              LEFT JOIN categories c ON p.category_id = c.id
              LEFT JOIN categories sc ON p.subcategory_id = sc.id
              WHERE ";

    if (is_numeric($idOrSlug)) {
        $query .= 'p.id = ?';
        $param = intval($idOrSlug);
    } else {
        $query .= 'p.slug = ?';
        $param = $idOrSlug;
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute([$param]);
    $product = $stmt->fetch();

    if (!$product) {
        jsonResponse(['status' => 'error', 'message' => 'Product not found'], 404);
    }

    $product = parseProductRow($product);

    jsonResponse([
        'status'  => 'success',
        'product' => $product,
    ]);
}

// ═════════════════════════════════════════════════════
// POST /api/products  — Create product
// ═════════════════════════════════════════════════════
if ($method === 'POST' && empty($segments)) {
    requireAuth();
    requireCsrfToken();
    $body = getJsonBody();

    $name            = $body['name'] ?? '';
    $description     = $body['description'] ?? null;
    $price           = $body['price'] ?? null;
    $discount_price  = $body['discount_price'] ?? null;
    $category_id     = $body['category_id'] ?? null;
    $subcategory_id  = $body['subcategory_id'] ?? null;
    $stock           = $body['stock'] ?? 0;
    $primary_image   = $body['primary_image'] ?? '';
    $images          = $body['images'] ?? [];
    $sizes           = $body['sizes'] ?? [];
    $colors          = $body['colors'] ?? [];
    $is_trending     = $body['is_trending'] ?? false;
    $is_popular      = $body['is_popular'] ?? false;
    $is_featured     = $body['is_featured'] ?? false;
    $is_men          = $body['is_men_collection'] ?? false;
    $is_women        = $body['is_women_collection'] ?? false;
    $seo_title       = $body['seo_title'] ?? null;
    $seo_description = $body['seo_description'] ?? null;

    // Validation
    if (!$name || !is_string($name) || mb_strlen(trim($name)) < 2 || mb_strlen(trim($name)) > 200) {
        jsonResponse(['status' => 'error', 'message' => 'Product name is required (2-200 characters)'], 400);
    }

    if ($description) {
        $v = validateText($description, 0, 5000);
        if (!$v['valid']) {
            jsonResponse(['status' => 'error', 'message' => "Description: {$v['error']}"], 400);
        }
    }

    $sanitizedName = sanitizeInput($name);
    $sanitizedDesc = $description ? sanitizeInput($description) : null;

    $priceNum = floatval($price);
    if (!$price || $priceNum <= 0) {
        jsonResponse(['status' => 'error', 'message' => 'Valid price is required'], 400);
    }

    if (!$category_id) {
        jsonResponse(['status' => 'error', 'message' => 'Category is required'], 400);
    }

    if (!$primary_image) {
        jsonResponse(['status' => 'error', 'message' => 'Primary image is required'], 400);
    }

    if ($discount_price !== null && $discount_price !== '') {
        $discountNum = floatval($discount_price);
        if ($discountNum < 0 || $discountNum >= $priceNum) {
            jsonResponse(['status' => 'error', 'message' => 'Discount price must be less than original price'], 400);
        }
    }

    // Validate subcategory belongs to category
    if ($subcategory_id) {
        $stmt = $pdo->prepare('SELECT id FROM categories WHERE id = ? AND parent_id = ?');
        $stmt->execute([$subcategory_id, $category_id]);
        if (!$stmt->fetch()) {
            jsonResponse(['status' => 'error', 'message' => 'Subcategory does not belong to the selected category'], 400);
        }
    }

    $slug = slugify($sanitizedName);
    $imagesJson = json_encode(is_array($images) ? $images : []);
    $sizesJson  = json_encode(is_array($sizes) ? $sizes : []);
    $colorsJson = json_encode(is_array($colors) ? $colors : []);

    try {
        $stmt = $pdo->prepare("INSERT INTO products
            (name, slug, description, price, discount_price, category_id, subcategory_id, stock,
             primary_image, images, sizes, colors,
             is_trending, is_popular, is_featured, is_men_collection, is_women_collection,
             seo_title, seo_description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $sanitizedName, $slug, $sanitizedDesc, $priceNum,
            ($discount_price !== null && $discount_price !== '') ? floatval($discount_price) : null,
            $category_id, $subcategory_id ?: null, intval($stock),
            $primary_image, $imagesJson, $sizesJson, $colorsJson,
            $is_trending ? 1 : 0, $is_popular ? 1 : 0, $is_featured ? 1 : 0,
            $is_men ? 1 : 0, $is_women ? 1 : 0,
            $seo_title ?: null, $seo_description ?: null,
        ]);

        $insertId = $pdo->lastInsertId();
        $stmt2 = $pdo->prepare('SELECT * FROM products WHERE id = ?');
        $stmt2->execute([$insertId]);
        $product = parseProductRow($stmt2->fetch());

        jsonResponse(['status' => 'success', 'product' => $product], 201);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            jsonResponse(['status' => 'error', 'message' => 'A product with this name already exists'], 400);
        }
        jsonResponse(['status' => 'error', 'message' => 'An error occurred while creating product'], 500);
    }
}

// ═════════════════════════════════════════════════════
// PUT /api/products/{id}  — Update product
// ═════════════════════════════════════════════════════
if ($method === 'PUT' && !empty($segments[0])) {
    requireAuth();
    requireCsrfToken();
    $productId = intval($segments[0]);
    $body = getJsonBody();

    $updates = [];
    $params  = [];

    $allowedFields = [
        'name', 'description', 'price', 'discount_price', 'category_id', 'subcategory_id', 'stock',
        'primary_image', 'is_trending', 'is_popular', 'is_featured',
        'is_men_collection', 'is_women_collection', 'seo_title', 'seo_description',
    ];

    // Validate subcategory
    if (isset($body['subcategory_id']) && $body['subcategory_id'] !== null) {
        $targetCatId = $body['category_id'] ?? null;
        if (!$targetCatId) {
            $s = $pdo->prepare('SELECT category_id FROM products WHERE id = ?');
            $s->execute([$productId]);
            $cur = $s->fetch();
            if ($cur) $targetCatId = $cur['category_id'];
        }
        if ($targetCatId) {
            $s = $pdo->prepare('SELECT id FROM categories WHERE id = ? AND parent_id = ?');
            $s->execute([$body['subcategory_id'], $targetCatId]);
            if (!$s->fetch()) {
                jsonResponse(['status' => 'error', 'message' => 'Subcategory does not belong to the selected category'], 400);
            }
        }
    }

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $body)) {
            if ($field === 'name') {
                $trimmed = trim((string) $body[$field]);
                if (mb_strlen($trimmed) < 2 || mb_strlen($trimmed) > 200) {
                    jsonResponse(['status' => 'error', 'message' => 'Product name must be 2-200 characters'], 400);
                }
                $updates[] = 'name = ?';
                $params[]  = $trimmed;
                $updates[] = 'slug = ?';
                $params[]  = slugify($trimmed);
            } elseif ($field === 'price') {
                $priceNum = floatval($body[$field]);
                if ($priceNum <= 0) {
                    jsonResponse(['status' => 'error', 'message' => 'Price must be a positive number'], 400);
                }
                $updates[] = 'price = ?';
                $params[]  = $priceNum;
            } elseif (strpos($field, 'is_') === 0) {
                $updates[] = "{$field} = ?";
                $params[]  = $body[$field] ? 1 : 0;
            } else {
                $updates[] = "{$field} = ?";
                $params[]  = $body[$field];
            }
        }
    }

    // Handle JSON fields
    foreach (['images', 'sizes', 'colors'] as $jsonField) {
        if (array_key_exists($jsonField, $body)) {
            $updates[] = "{$jsonField} = ?";
            $params[]  = json_encode(is_array($body[$jsonField]) ? $body[$jsonField] : []);
        }
    }

    if (empty($updates)) {
        jsonResponse(['status' => 'error', 'message' => 'No fields to update'], 400);
    }

    $params[] = $productId;
    $pdo->prepare("UPDATE products SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);

    $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ?');
    $stmt->execute([$productId]);
    $product = $stmt->fetch();

    if (!$product) {
        jsonResponse(['status' => 'error', 'message' => 'Product not found'], 404);
    }

    jsonResponse(['status' => 'success', 'product' => parseProductRow($product)]);
}

// ═════════════════════════════════════════════════════
// DELETE /api/products/{id}  — Delete product
// ═════════════════════════════════════════════════════
if ($method === 'DELETE' && !empty($segments[0])) {
    requireAuth();
    requireCsrfToken();
    $productId = intval($segments[0]);

    $stmt = $pdo->prepare('SELECT primary_image, images FROM products WHERE id = ?');
    $stmt->execute([$productId]);
    $product = $stmt->fetch();

    if (!$product) {
        jsonResponse(['status' => 'error', 'message' => 'Product not found'], 404);
    }

    $pdo->prepare('DELETE FROM products WHERE id = ?')->execute([$productId]);

    // Try to delete image files
    $images = safeJsonDecode($product['images']);
    foreach ($images as $imgPath) {
        if ($imgPath && is_string($imgPath) && strpos($imgPath, '/uploads/') === 0 && strpos($imgPath, '..') === false) {
            $filePath = realpath(__DIR__ . '/../' . $imgPath);
            if ($filePath && file_exists($filePath)) {
                @unlink($filePath);
            }
        }
    }

    jsonResponse(['status' => 'success', 'message' => 'Product deleted successfully']);
}

// ─── Fallback ──────────────────────────────────────
jsonResponse(['status' => 'error', 'message' => 'Invalid products endpoint'], 404);
