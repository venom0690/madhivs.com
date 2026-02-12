/**
 * Data Service - Admin Panel API Layer
 * Handles all API communication for the admin panel
 * Aligned with MySQL backend response shapes
 */

const dataService = (function () {
    'use strict';

    const API_BASE = window.location.origin + '/api';

    /**
     * Internal request helper
     * Adds auth token and handles response parsing
     */
    async function _request(endpoint, options = {}) {
        const token = localStorage.getItem('adminToken');
        const headers = options.headers || {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Only set Content-Type for non-FormData requests
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Request failed (${response.status})`);
        }

        return data;
    }

    // ==========================================
    // CATEGORIES
    // ==========================================

    async function getCategories() {
        // Backend returns: { status, results, categories }
        const result = await _request('/categories');
        return result.categories || [];
    }

    async function getCategoryById(id) {
        // Backend returns: { status, category }
        const result = await _request(`/categories/${id}`);
        return result.category || null;
    }

    async function createCategory(categoryData) {
        const result = await _request('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
        return result.category;
    }

    async function updateCategory(id, categoryData) {
        const result = await _request(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
        return result.category;
    }

    async function deleteCategory(id) {
        return await _request(`/categories/${id}`, {
            method: 'DELETE'
        });
    }

    // ==========================================
    // PRODUCTS
    // ==========================================

    async function getProducts() {
        // Backend returns: { status, results, products }
        const result = await _request('/products?limit=1000');
        return result.products || [];
    }

    async function getProductById(id) {
        // Backend route is GET /api/products/:idOrSlug
        const result = await _request(`/products/${id}`);
        return result.product || null;
    }

    async function createProduct(productData) {
        // Map frontend camelCase field names → backend snake_case
        const payload = _mapProductToBackend(productData);

        const result = await _request('/products', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return result.product;
    }

    async function updateProduct(id, productData) {
        // Map frontend camelCase field names → backend snake_case
        const payload = _mapProductToBackend(productData);

        const result = await _request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        return result.product;
    }

    async function deleteProduct(id) {
        return await _request(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Maps frontend product fields to backend field names
     * Frontend sends: category, primaryImage, isTrending, isMenCollection, etc.
     * Backend expects: category_id, primary_image, is_trending, is_men_collection, etc.
     */
    function _mapProductToBackend(data) {
        const payload = {};

        if (data.name !== undefined) payload.name = data.name;
        if (data.description !== undefined) payload.description = data.description;
        if (data.price !== undefined) payload.price = data.price;
        if (data.discount_price !== undefined) payload.discount_price = data.discount_price;
        if (data.stock !== undefined) payload.stock = data.stock;
        if (data.sizes !== undefined) payload.sizes = data.sizes;
        if (data.colors !== undefined) payload.colors = data.colors;
        if (data.images !== undefined) payload.images = data.images;
        if (data.seo_title !== undefined) payload.seo_title = data.seo_title;
        if (data.seo_description !== undefined) payload.seo_description = data.seo_description;

        // Map camelCase → snake_case
        if (data.category !== undefined) payload.category_id = data.category;
        if (data.subcategory_id !== undefined) payload.subcategory_id = data.subcategory_id;
        if (data.primaryImage !== undefined) payload.primary_image = data.primaryImage;
        if (data.isTrending !== undefined) payload.is_trending = data.isTrending;
        if (data.isPopular !== undefined) payload.is_popular = data.isPopular;
        if (data.isFeatured !== undefined) payload.is_featured = data.isFeatured;
        if (data.isMenCollection !== undefined) payload.is_men_collection = data.isMenCollection;
        if (data.isWomenCollection !== undefined) payload.is_women_collection = data.isWomenCollection;

        return payload;
    }

    // ==========================================
    // ORDERS
    // ==========================================

    async function getOrders() {
        // Backend returns: { status, results, orders }
        // Note: getAllOrders returns orders with item_count, NOT full items array
        const result = await _request('/orders');
        const orders = result.orders || [];

        // Normalize field names for admin JS compatibility
        return orders.map(order => ({
            ...order,
            id: order.id,
            orderNumber: order.order_number,
            orderStatus: order.order_status,
            totalAmount: parseFloat(order.total_amount),
            customerInfo: {
                name: order.customer_name,
                email: order.customer_email,
                phone: order.customer_phone
            },
            // items array is NOT included in list endpoint, only item_count
            items: order.items || Array(order.item_count || 0).fill({ name: '-', price: 0, quantity: 1 }),
            createdAt: order.created_at
        }));
    }

    async function getOrderById(id) {
        // Backend returns: { status, order } with items and shippingAddress
        const result = await _request(`/orders/${id}`);
        const order = result.order;
        if (!order) return null;

        // Normalize field names
        return {
            ...order,
            id: order.id,
            orderNumber: order.order_number,
            orderStatus: order.order_status,
            totalAmount: parseFloat(order.total_amount),
            customerInfo: {
                name: order.customer_name,
                email: order.customer_email,
                phone: order.customer_phone
            },
            items: (order.items || []).map(item => ({
                ...item,
                name: item.product_name || item.name,
                price: parseFloat(item.price),
                quantity: item.quantity,
                size: item.size,
                image: item.image
            })),
            shippingAddress: order.shippingAddress || order.shipping_address || {},
            createdAt: order.created_at
        };
    }

    async function updateOrderStatus(orderId, newStatus) {
        // Backend route is PATCH /api/orders/:id  (NOT /orders/:id/status)
        // Backend expects: { order_status: '...' }
        const result = await _request(`/orders/${orderId}`, {
            method: 'PATCH',
            body: JSON.stringify({ order_status: newStatus })
        });
        return result.order;
    }

    // ==========================================
    // UPLOAD
    // ==========================================

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        // Backend returns: { status, data: { url, filename, size } }
        const result = await _request('/upload', {
            method: 'POST',
            body: formData
        });
        return result.data;
    }

    // ==========================================
    // STATISTICS (computed from existing endpoints)
    // ==========================================

    async function getStatistics() {
        try {
            const [products, orders, categories] = await Promise.all([
                getProducts().catch(() => []),
                _request('/orders').catch(() => ({ orders: [] })),
                _request('/categories').catch(() => ({ categories: [] }))
            ]);

            const ordersList = orders.orders || orders || [];
            const categoriesList = categories.categories || categories || [];
            const pendingOrders = Array.isArray(ordersList)
                ? ordersList.filter(o => o.order_status === 'Pending').length
                : 0;

            return {
                totalProducts: Array.isArray(products) ? products.length : 0,
                totalOrders: Array.isArray(ordersList) ? ordersList.length : 0,
                totalCategories: Array.isArray(categoriesList) ? categoriesList.length : 0,
                pendingOrders: pendingOrders
            };
        } catch (error) {
            console.error('Error computing statistics:', error);
            return {
                totalProducts: 0,
                totalOrders: 0,
                totalCategories: 0,
                pendingOrders: 0
            };
        }
    }

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        // Categories
        getCategories,
        getCategoryById,
        createCategory,
        updateCategory,
        deleteCategory,

        // Products
        getProducts,
        getProductById,
        createProduct,
        updateProduct,
        deleteProduct,

        // Orders
        getOrders,
        getOrderById,
        updateOrderStatus,

        // Upload
        uploadImage,

        // Statistics
        getStatistics
    };

})();
