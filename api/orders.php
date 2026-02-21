<?php
/**
 * Orders API
 * POST   /api/orders         → create order (public)
 * GET    /api/orders          → list orders (auth)
 * GET    /api/orders/{id}     → single order (auth)
 * PATCH  /api/orders/{id}     → update status (auth)
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
// POST /api/orders  — Create order (checkout)
// ═════════════════════════════════════════════════════
if ($method === 'POST' && empty($segments)) {
    $body = getJsonBody();

    $customerInfo    = $body['customerInfo'] ?? null;
    $items           = $body['items'] ?? null;
    $shippingAddress = $body['shippingAddress'] ?? null;
    $paymentMethod   = $body['paymentMethod'] ?? 'cod';
    $notes           = $body['notes'] ?? null;

    // ── Validate customer info ──
    if (!$customerInfo || !($customerInfo['name'] ?? null) || !($customerInfo['email'] ?? null) || !($customerInfo['phone'] ?? null)) {
        jsonResponse(['status' => 'error', 'message' => 'Customer information (name, email, phone) is required'], 400);
    }

    $nameV = validateText($customerInfo['name'], 2, 100);
    if (!$nameV['valid']) {
        jsonResponse(['status' => 'error', 'message' => "Customer name: {$nameV['error']}"], 400);
    }

    if (!isValidEmail($customerInfo['email'])) {
        jsonResponse(['status' => 'error', 'message' => 'Invalid email format'], 400);
    }

    if (!isValidPhone($customerInfo['phone'])) {
        jsonResponse(['status' => 'error', 'message' => 'Invalid phone number (10-15 digits required)'], 400);
    }

    // ── Validate items ──
    if (!$items || !is_array($items) || count($items) === 0) {
        jsonResponse(['status' => 'error', 'message' => 'Order must have at least one item'], 400);
    }

    // ── Validate shipping address ──
    if (!$shippingAddress || !($shippingAddress['street'] ?? null) || !($shippingAddress['city'] ?? null)) {
        jsonResponse(['status' => 'error', 'message' => 'Shipping address (street, city) is required'], 400);
    }

    $streetV = validateText($shippingAddress['street'], 5, 255);
    if (!$streetV['valid']) {
        jsonResponse(['status' => 'error', 'message' => "Street address: {$streetV['error']}"], 400);
    }

    $cityV = validateText($shippingAddress['city'], 2, 100);
    if (!$cityV['valid']) {
        jsonResponse(['status' => 'error', 'message' => "City: {$cityV['error']}"], 400);
    }

    if ($notes) {
        $notesV = validateText($notes, 0, 500);
        if (!$notesV['valid']) {
            jsonResponse(['status' => 'error', 'message' => "Notes: {$notesV['error']}"], 400);
        }
    }

    // ── Transaction ──
    try {
        $pdo->beginTransaction();

        // Verify stock and calculate real total
        $calculatedTotal = 0;
        $verifiedItems   = [];

        foreach ($items as $item) {
            $productId   = $item['product_id'] ?? $item['id'] ?? null;
            $requestedQty = intval($item['quantity'] ?? 0);

            if (!$productId || $requestedQty <= 0) {
                throw new Exception('Invalid item data');
            }

            // Lock row for update
            $stmt = $pdo->prepare('SELECT id, name, price, stock, primary_image FROM products WHERE id = ? FOR UPDATE');
            $stmt->execute([$productId]);
            $product = $stmt->fetch();

            if (!$product) {
                throw new Exception("Product ID {$productId} not found");
            }

            if ((int) $product['stock'] < $requestedQty) {
                throw new Exception("Insufficient stock for {$product['name']}. Available: {$product['stock']}");
            }

            $itemTotal = floatval($product['price']) * $requestedQty;
            $calculatedTotal += $itemTotal;

            $verifiedItems[] = [
                'product_id'   => (int) $product['id'],
                'product_name' => $product['name'],
                'price'        => floatval($product['price']),
                'quantity'     => $requestedQty,
                'size'         => $item['size'] ?? null,
                'color'        => $item['color'] ?? null,
                'image'        => $product['primary_image'],
            ];

            // Decrement stock
            $pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ?')->execute([$requestedQty, $productId]);
        }

        // Fetch shipping cost
        $shippingCost = 99;
        try {
            $stmt = $pdo->prepare('SELECT setting_value FROM settings WHERE setting_key = ?');
            $stmt->execute(['shipping_cost']);
            $row = $stmt->fetch();
            if ($row) {
                $shippingCost = floatval($row['setting_value']);
            }
        } catch (Exception $e) {
            // Use default
        }

        $totalAmount = $calculatedTotal + $shippingCost;

        // Generate unique order number
        $orderNumber = '';
        $attempts = 0;
        $maxAttempts = 5;

        while ($attempts < $maxAttempts) {
            $dateStr   = date('Ymd');
            $random    = rand(1000, 9999);
            $timestamp = substr((string) time(), -4);
            $orderNumber = "MB{$dateStr}{$timestamp}{$random}";

            $stmt = $pdo->prepare('SELECT id FROM orders WHERE order_number = ?');
            $stmt->execute([$orderNumber]);
            if (!$stmt->fetch()) break;
            $attempts++;
        }

        if ($attempts === $maxAttempts) {
            throw new Exception('Failed to generate unique order number');
        }

        // Insert order
        $stmt = $pdo->prepare("INSERT INTO orders
            (order_number, customer_name, customer_email, customer_phone, total_amount, payment_method, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $orderNumber,
            sanitizeInput(trim($customerInfo['name'])),
            sanitizeInput(strtolower(trim($customerInfo['email']))),
            sanitizeInput(trim($customerInfo['phone'])),
            $calculatedTotal,
            $paymentMethod ?: 'cod',
            $notes ? sanitizeInput($notes) : null,
        ]);

        $orderId = (int) $pdo->lastInsertId();

        // Insert order items
        $itemStmt = $pdo->prepare("INSERT INTO order_items
            (order_id, product_id, product_name, price, quantity, size, color, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

        foreach ($verifiedItems as $vi) {
            $itemStmt->execute([
                $orderId, $vi['product_id'], $vi['product_name'],
                $vi['price'], $vi['quantity'], $vi['size'], $vi['color'], $vi['image'],
            ]);
        }

        // Insert shipping address
        $pdo->prepare("INSERT INTO shipping_addresses
            (order_id, street, city, state, pincode, country)
            VALUES (?, ?, ?, ?, ?, ?)")->execute([
            $orderId,
            sanitizeInput(trim($shippingAddress['street'])),
            sanitizeInput(trim($shippingAddress['city'])),
            isset($shippingAddress['state']) ? sanitizeInput($shippingAddress['state']) : null,
            isset($shippingAddress['pincode']) ? sanitizeInput($shippingAddress['pincode']) : null,
            isset($shippingAddress['country']) ? sanitizeInput($shippingAddress['country']) : 'India',
        ]);

        $pdo->commit();

        jsonResponse([
            'status'  => 'success',
            'message' => 'Order created successfully',
            'order'   => [
                'id'           => $orderId,
                'order_number' => $orderNumber,
                'total_amount' => $calculatedTotal,
                'items'        => $verifiedItems,
            ],
        ], 201);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        $status = (strpos($e->getMessage(), 'Insufficient stock') !== false || strpos($e->getMessage(), 'Invalid') !== false) ? 400 : 500;
        jsonResponse(['status' => 'error', 'message' => $e->getMessage()], $status);
    }
}

// ═════════════════════════════════════════════════════
// GET /api/orders  — List all orders (admin only)
// ═════════════════════════════════════════════════════
if ($method === 'GET' && empty($segments)) {
    requireAuth();

    $status = $_GET['status'] ?? null;
    $limit  = $_GET['limit'] ?? null;

    $query  = "SELECT o.*, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count FROM orders o WHERE 1=1";
    $params = [];

    if ($status) {
        $validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!in_array($status, $validStatuses)) {
            jsonResponse(['status' => 'error', 'message' => 'Invalid order status'], 400);
        }
        $query .= ' AND o.order_status = ?';
        $params[] = $status;
    }

    $query .= ' ORDER BY o.created_at DESC';

    if ($limit) {
        $limitNum = min(100, max(1, intval($limit)));
        $query .= ' LIMIT ?';
        $params[] = $limitNum;
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();

    // Cast types
    foreach ($orders as &$order) {
        $order['id']           = (int) $order['id'];
        $order['total_amount'] = (float) $order['total_amount'];
        $order['item_count']   = (int) $order['item_count'];
    }
    unset($order);

    jsonResponse([
        'status'  => 'success',
        'results' => count($orders),
        'orders'  => $orders,
    ]);
}

// ═════════════════════════════════════════════════════
// GET /api/orders/{id}  — Single order (admin only)
// ═════════════════════════════════════════════════════
if ($method === 'GET' && !empty($segments[0])) {
    requireAuth();
    $orderId = $segments[0];

    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?');
    $stmt->execute([$orderId, $orderId]);
    $order = $stmt->fetch();

    if (!$order) {
        jsonResponse(['status' => 'error', 'message' => 'Order not found'], 404);
    }

    $order['id']           = (int) $order['id'];
    $order['total_amount'] = (float) $order['total_amount'];

    // Get items
    $stmt = $pdo->prepare('SELECT * FROM order_items WHERE order_id = ?');
    $stmt->execute([$order['id']]);
    $items = $stmt->fetchAll();
    foreach ($items as &$item) {
        $item['id']         = (int) $item['id'];
        $item['order_id']   = (int) $item['order_id'];
        $item['product_id'] = $item['product_id'] ? (int) $item['product_id'] : null;
        $item['price']      = (float) $item['price'];
        $item['quantity']   = (int) $item['quantity'];
    }
    unset($item);

    // Get shipping address
    $stmt = $pdo->prepare('SELECT * FROM shipping_addresses WHERE order_id = ?');
    $stmt->execute([$order['id']]);
    $address = $stmt->fetch();

    $order['items']           = $items;
    $order['shippingAddress'] = $address ?: null;

    jsonResponse(['status' => 'success', 'order' => $order]);
}

// ═════════════════════════════════════════════════════
// PATCH /api/orders/{id}  — Update order status
// ═════════════════════════════════════════════════════
if ($method === 'PATCH' && !empty($segments[0])) {
    requireAuth();
    requireCsrfToken();
    $orderId = intval($segments[0]);
    $body    = getJsonBody();

    $updates = [];
    $params  = [];

    $orderStatus   = $body['order_status'] ?? null;
    $trackingNum   = $body['tracking_number'] ?? null;
    $orderNotes    = $body['notes'] ?? null;

    if ($orderStatus) {
        $validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!in_array($orderStatus, $validStatuses)) {
            jsonResponse(['status' => 'error', 'message' => 'Invalid order status. Must be one of: ' . implode(', ', $validStatuses)], 400);
        }
        $updates[] = 'order_status = ?';
        $params[]  = $orderStatus;

        if ($orderStatus === 'Delivered') {
            $updates[] = 'delivered_at = NOW()';
        } elseif ($orderStatus === 'Cancelled') {
            $updates[] = 'cancelled_at = NOW()';
        }
    }

    if ($trackingNum) {
        $updates[] = 'tracking_number = ?';
        $params[]  = $trackingNum;
    }

    if ($orderNotes !== null) {
        $updates[] = 'notes = ?';
        $params[]  = $orderNotes;
    }

    if (empty($updates)) {
        jsonResponse(['status' => 'error', 'message' => 'No fields to update'], 400);
    }

    $params[] = $orderId;
    $stmt = $pdo->prepare("UPDATE orders SET " . implode(', ', $updates) . " WHERE id = ?");
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['status' => 'error', 'message' => 'Order not found'], 404);
    }

    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    $order['id']           = (int) $order['id'];
    $order['total_amount'] = (float) $order['total_amount'];

    jsonResponse(['status' => 'success', 'order' => $order]);
}

// ─── Fallback ──────────────────────────────────────
jsonResponse(['status' => 'error', 'message' => 'Invalid orders endpoint'], 404);
