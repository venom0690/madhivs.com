const db = require('../db');
const { isValidEmail, isValidPhone, sanitizeInput, validateText } = require('../utils/validators');

/**
 * Create order
 * POST /api/orders
 * FIX #14: Unique order number with retry
 * FIX #15: Safe connection pool handling
 */
exports.createOrder = async (req, res) => {
    const {
        customerInfo,
        items,
        shippingAddress,
        paymentMethod,
        notes
    } = req.body;

    // Basic validation — BEFORE acquiring connection to prevent pool leaks
    if (!customerInfo || !customerInfo.name || !customerInfo.email || !customerInfo.phone) {
        return res.status(400).json({
            status: 'error',
            message: 'Customer information (name, email, phone) is required'
        });
    }

    // Validate and sanitize customer name
    const nameValidation = validateText(customerInfo.name, 2, 100);
    if (!nameValidation.valid) {
        return res.status(400).json({
            status: 'error',
            message: `Customer name: ${nameValidation.error}`
        });
    }

    // FIX #16: Email validation
    if (!isValidEmail(customerInfo.email)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid email format'
        });
    }

    // Phone validation (accepting 10-15 digits)
    if (!isValidPhone(customerInfo.phone)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid phone number (10-15 digits required)'
        });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Order must have at least one item'
        });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
        return res.status(400).json({
            status: 'error',
            message: 'Shipping address (street, city) is required'
        });
    }

    // Validate shipping address fields
    const streetValidation = validateText(shippingAddress.street, 5, 255);
    if (!streetValidation.valid) {
        return res.status(400).json({
            status: 'error',
            message: `Street address: ${streetValidation.error}`
        });
    }

    const cityValidation = validateText(shippingAddress.city, 2, 100);
    if (!cityValidation.valid) {
        return res.status(400).json({
            status: 'error',
            message: `City: ${cityValidation.error}`
        });
    }

    // Validate notes if provided
    if (notes) {
        const notesValidation = validateText(notes, 0, 500);
        if (!notesValidation.valid) {
            return res.status(400).json({
                status: 'error',
                message: `Notes: ${notesValidation.error}`
            });
        }
    }

    // FIX #15: Declare connection outside try so finally can always release
    let connection;

    try {
        connection = await db.getConnection();

        // Start transaction
        await connection.beginTransaction();

        // 1. Verify Stock and Calculate Real Total
        // Prevent "Trusting Frontend Price" vulnerability
        let calculatedTotal = 0;
        const verifiedItems = [];

        for (const item of items) {
            const productId = item.product_id || item.id;
            const requestedQty = parseInt(item.quantity);

            if (!productId || isNaN(requestedQty) || requestedQty <= 0) {
                throw new Error('Invalid item data');
            }

            // Lock row for update to prevent race conditions
            const [products] = await connection.query(
                'SELECT id, name, price, stock, primary_image FROM products WHERE id = ? FOR UPDATE',
                [productId]
            );

            if (products.length === 0) {
                throw new Error(`Product ID ${productId} not found`);
            }

            const product = products[0];

            // Check stock
            if (product.stock < requestedQty) {
                throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
            }

            // Use Database Price
            const itemTotal = parseFloat(product.price) * requestedQty;
            calculatedTotal += itemTotal;

            verifiedItems.push({
                product_id: product.id,
                product_name: product.name,
                price: parseFloat(product.price),
                quantity: requestedQty,
                size: item.size || null,
                color: item.color || null,
                image: product.primary_image // Use DB image for consistency
            });

            // Decrement Stock
            await connection.query(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [requestedQty, productId]
            );
        }

        // FIX #14: Generate unique order number with retry logic
        let orderNumber;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            const date = new Date();
            const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
            const random = Math.floor(1000 + Math.random() * 9000);
            const timestamp = Date.now().toString().slice(-4);
            orderNumber = `MB${dateStr}${timestamp}${random}`;

            const [existing] = await connection.query(
                'SELECT id FROM orders WHERE order_number = ?',
                [orderNumber]
            );

            if (existing.length === 0) break;
            attempts++;
        }

        if (attempts === maxAttempts) {
            throw new Error('Failed to generate unique order number after ' + maxAttempts + ' attempts');
        }

        // Insert order with CALCULATED total and sanitized inputs
        const [orderResult] = await connection.query(
            `INSERT INTO orders (
                order_number, customer_name, customer_email, customer_phone,
                total_amount, payment_method, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                orderNumber,
                sanitizeInput(customerInfo.name.trim()),
                sanitizeInput(customerInfo.email.trim().toLowerCase()),
                sanitizeInput(customerInfo.phone.trim()),
                calculatedTotal,
                paymentMethod || 'cod',
                notes ? sanitizeInput(notes) : null
            ]
        );

        const orderId = orderResult.insertId;

        // Insert verified order items
        for (const item of verifiedItems) {
            await connection.query(
                `INSERT INTO order_items (
                    order_id, product_id, product_name, price, quantity, size, color, image
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.product_id,
                    item.product_name,
                    item.price,
                    item.quantity,
                    item.size,
                    item.color,
                    item.image
                ]
            );
        }

        // Insert shipping address with sanitized inputs
        await connection.query(
            `INSERT INTO shipping_addresses (
                order_id, street, city, state, pincode, country
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                orderId,
                sanitizeInput(shippingAddress.street.trim()),
                sanitizeInput(shippingAddress.city.trim()),
                shippingAddress.state ? sanitizeInput(shippingAddress.state) : null,
                shippingAddress.pincode ? sanitizeInput(shippingAddress.pincode) : null,
                shippingAddress.country ? sanitizeInput(shippingAddress.country) : 'India'
            ]
        );

        // Commit transaction
        await connection.commit();

        // Return success response immediately
        // (Fetching full order details again is unnecessary overhead for creation response)
        res.status(201).json({
            status: 'success',
            message: 'Order created successfully',
            order: {
                id: orderId,
                order_number: orderNumber,
                total_amount: calculatedTotal,
                items: verifiedItems
            }
        });

    } catch (error) {
        // FIX #15: Safe rollback — only if connection exists
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Rollback failed:', rollbackError.message);
            }
        }

        // Return 400 for business logic errors (stock, invalid item), 500 for others
        const status = error.message.includes('Insufficient stock') || error.message.includes('Invalid') ? 400 : 500;

        console.error('Create order error:', error.message);
        res.status(status).json({
            status: 'error',
            message: error.message || 'An error occurred while creating order'
        });
    } finally {
        // FIX #15: Always release connection
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Get all orders
 * GET /api/orders
 */
exports.getAllOrders = async (req, res) => {
    try {
        const { status, limit } = req.query;

        let query = `
            SELECT o.*,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
            FROM orders o
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            // Validate status against allowed values
            const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid order status'
                });
            }
            query += ' AND o.order_status = ?';
            params.push(status);
        }

        query += ' ORDER BY o.created_at DESC';

        if (limit) {
            const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
            query += ' LIMIT ?';
            params.push(limitNum);
        }

        const [orders] = await db.query(query, params);

        res.status(200).json({
            status: 'success',
            results: orders.length,
            orders
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching orders'
        });
    }
};

/**
 * Get single order
 * GET /api/orders/:id
 */
exports.getOrder = async (req, res) => {
    try {
        // Get order
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE id = ? OR order_number = ?',
            [req.params.id, req.params.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found'
            });
        }

        const order = orders[0];

        // Get order items
        const [items] = await db.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [order.id]
        );

        // Get shipping address
        const [addresses] = await db.query(
            'SELECT * FROM shipping_addresses WHERE order_id = ?',
            [order.id]
        );

        order.items = items;
        order.shippingAddress = addresses[0] || null;

        res.status(200).json({
            status: 'success',
            order
        });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred'
        });
    }
};

/**
 * Update order status
 * PATCH /api/orders/:id
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { order_status, tracking_number, notes } = req.body;

        const updates = [];
        const params = [];

        if (order_status) {
            // Validate order status
            const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
            if (!validStatuses.includes(order_status)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid order status. Must be one of: ' + validStatuses.join(', ')
                });
            }

            updates.push('order_status = ?');
            params.push(order_status);

            if (order_status === 'Delivered') {
                updates.push('delivered_at = NOW()');
            } else if (order_status === 'Cancelled') {
                updates.push('cancelled_at = NOW()');
            }
        }

        if (tracking_number) {
            updates.push('tracking_number = ?');
            params.push(tracking_number);
        }

        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No fields to update'
            });
        }

        params.push(req.params.id);

        const [result] = await db.query(
            `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found'
            });
        }

        // Get updated order
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE id = ?',
            [req.params.id]
        );

        res.status(200).json({
            status: 'success',
            order: orders[0]
        });

    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while updating order'
        });
    }
};
