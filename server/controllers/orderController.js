const db = require('../db');

/**
 * Create order
 * POST /api/orders
 */
exports.createOrder = async (req, res) => {
    const {
        customerInfo,
        items,
        totalAmount,
        shippingAddress,
        paymentMethod,
        notes
    } = req.body;

    // Basic validation — BEFORE acquiring connection to prevent pool leaks
    if (!customerInfo || !customerInfo.name || !customerInfo.email || !customerInfo.phone) {
        return res.status(400).json({
            status: 'error',
            message: 'Customer information is required'
        });
    }

    if (!items || items.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Order must have at least one item'
        });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
        return res.status(400).json({
            status: 'error',
            message: 'Shipping address is required'
        });
    }

    const connection = await db.getConnection();

    try {

        // Generate order number: MB + YYYYMMDD + random 4 digits
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `MB${dateStr}${random}`;

        // Start transaction
        await connection.beginTransaction();

        // Insert order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (
                order_number, customer_name, customer_email, customer_phone,
                total_amount, payment_method, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                orderNumber,
                customerInfo.name,
                customerInfo.email,
                customerInfo.phone,
                totalAmount,
                paymentMethod || 'cod',
                notes || null
            ]
        );

        const orderId = orderResult.insertId;

        // Insert order items
        for (const item of items) {
            await connection.query(
                `INSERT INTO order_items (
                    order_id, product_id, product_name, price, quantity, size, color, image
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.product_id || item.id || null,
                    item.name || item.product_name,
                    item.price,
                    item.quantity,
                    item.size || null,
                    item.color || null,
                    item.image || null
                ]
            );
        }

        // Insert shipping address
        await connection.query(
            `INSERT INTO shipping_addresses (
                order_id, street, city, state, pincode, country
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                orderId,
                shippingAddress.street,
                shippingAddress.city,
                shippingAddress.state,
                shippingAddress.pincode,
                shippingAddress.country || 'India'
            ]
        );

        // Commit transaction
        await connection.commit();

        // Get complete order with items and address
        const [orders] = await connection.query(
            `SELECT o.*, 
                GROUP_CONCAT(
                    JSON_OBJECT(
                        'id', oi.id,
                        'product_id', oi.product_id,
                        'product_name', oi.product_name,
                        'price', oi.price,
                        'quantity', oi.quantity,
                        'size', oi.size,
                        'color', oi.color,
                        'image', oi.image
                    )
                ) as items_json
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = ?
            GROUP BY o.id`,
            [orderId]
        );

        const [addresses] = await connection.query(
            'SELECT * FROM shipping_addresses WHERE order_id = ?',
            [orderId]
        );

        const order = orders[0];
        order.items = order.items_json ? JSON.parse(`[${order.items_json}]`) : [];
        order.shippingAddress = addresses[0] || null;
        delete order.items_json;

        res.status(201).json({
            status: 'success',
            order
        });

    } catch (error) {
        await connection.rollback();
        console.error('Create order error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while creating order'
        });
    } finally {
        connection.release();
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
            query += ' AND o.order_status = ?';
            params.push(status);
        }

        query += ' ORDER BY o.created_at DESC';

        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
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

        await db.query(
            `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // Get updated order
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE id = ?',
            [req.params.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found'
            });
        }

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
