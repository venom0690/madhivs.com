/**
 * Data Service Layer for Admin Panel
 * Production API-based implementation
 * Replaces localStorage with real backend API calls
 */

const API_BASE_URL = window.location.origin + '/api';

const dataService = {
    // Get auth token
    _getToken() {
        return localStorage.getItem('admin_auth_token');
    },

    // API request helper
    async _request(endpoint, options = {}) {
        const token = this._getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error.message);
            throw error;
        }
    },

    // ==================== CATEGORIES ====================
    async getCategories() {
        try {
            const result = await this._request('/categories');
            return result.data.categories;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    },

    async getCategoryById(id) {
        try {
            const result = await this._request(`/categories/${id}`);
            return result.data.category;
        } catch (error) {
            console.error('Error fetching category:', error);
            return null;
        }
    },

    async createCategory(categoryData) {
        const result = await this._request('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData),
        });
        return result.data.category;
    },

    async updateCategory(id, categoryData) {
        const result = await this._request(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData),
        });
        return result.data.category;
    },

    async deleteCategory(id) {
        await this._request(`/categories/${id}`, {
            method: 'DELETE',
        });
        return true;
    },

    // ==================== PRODUCTS ====================
    async getProducts(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const endpoint = queryString ? `/products?${queryString}` : '/products';
            const result = await this._request(endpoint);
            return result.data.products;
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    },

    async getProductById(id) {
        try {
            const result = await this._request(`/products/id/${id}`);
            return result.data.product;
        } catch (error) {
            console.error('Error fetching product:', error);
            return null;
        }
    },

    async createProduct(productData) {
        // Map frontend field names to backend schema
        const mappedData = {
            ...productData,
            images: productData.subImages || productData.images || [],
        };
        delete mappedData.subImages;

        const result = await this._request('/products', {
            method: 'POST',
            body: JSON.stringify(mappedData),
        });
        return result.data.product;
    },

    async updateProduct(id, productData) {
        // Map frontend field names to backend schema
        const mappedData = {
            ...productData,
            images: productData.subImages || productData.images || [],
        };
        delete mappedData.subImages;

        const result = await this._request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(mappedData),
        });
        return result.data.product;
    },

    async deleteProduct(id) {
        await this._request(`/products/${id}`, {
            method: 'DELETE',
        });
        return true;
    },

    async toggleProductFlag(id, field, value) {
        const result = await this._request(`/products/${id}/toggle`, {
            method: 'PATCH',
            body: JSON.stringify({ field, value }),
        });
        return result.data.product;
    },

    // ==================== ORDERS ====================
    async getOrders(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const endpoint = queryString ? `/orders?${queryString}` : '/orders';
            const result = await this._request(endpoint);
            return result.data.orders;
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
    },

    async getOrderById(id) {
        try {
            const result = await this._request(`/orders/${id}`);
            return result.data.order;
        } catch (error) {
            console.error('Error fetching order:', error);
            return null;
        }
    },

    async updateOrderStatus(id, status) {
        const result = await this._request(`/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ orderStatus: status }),
        });
        return result.data.order;
    },

    async getOrderStats() {
        try {
            const result = await this._request('/orders/stats');
            return result.data;
        } catch (error) {
            console.error('Error fetching order stats:', error);
            return { totalOrders: 0, totalRevenue: 0, byStatus: {} };
        }
    },

    // ==================== HOMEPAGE CONTENT ====================
    async getHomepageContent() {
        try {
            const result = await this._request('/homepage');
            return result.data;
        } catch (error) {
            console.error('Error fetching homepage content:', error);
            return { sliderImages: [], trendingProducts: [], popularProducts: [] };
        }
    },

    async updateHomepageContent(contentData) {
        const result = await this._request('/homepage', {
            method: 'PUT',
            body: JSON.stringify(contentData),
        });
        return result.data.content;
    },

    async addSliderImage(imageData) {
        const result = await this._request('/homepage/slider', {
            method: 'POST',
            body: JSON.stringify(imageData),
        });
        return result.data.sliderImages;
    },

    async updateSliderImage(imageId, imageData) {
        const result = await this._request(`/homepage/slider/${imageId}`, {
            method: 'PUT',
            body: JSON.stringify(imageData),
        });
        return result.data.sliderImages;
    },

    async deleteSliderImage(imageId) {
        const result = await this._request(`/homepage/slider/${imageId}`, {
            method: 'DELETE',
        });
        return result.data.sliderImages;
    },

    async reorderSliderImages(orderedIds) {
        const result = await this._request('/homepage/slider/reorder', {
            method: 'PUT',
            body: JSON.stringify({ orderedIds }),
        });
        return result.data.sliderImages;
    },

    // ==================== UPLOAD ====================
    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        const token = this._getToken();
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }
        return data.data;
    },

    async uploadImageFromUrl(imageUrl) {
        const result = await this._request('/upload/url', {
            method: 'POST',
            body: JSON.stringify({ imageUrl }),
        });
        return result.data;
    },

    // ==================== STATISTICS ====================
    async getStatistics() {
        try {
            const [products, orders, categories] = await Promise.all([
                this.getProducts(),
                this.getOrders(),
                this.getCategories(),
            ]);

            const pendingOrders = orders.filter(o => o.orderStatus === 'Pending').length;
            const shippedOrders = orders.filter(o => o.orderStatus === 'Shipped').length;
            const deliveredOrders = orders.filter(o => o.orderStatus === 'Delivered').length;

            return {
                totalProducts: products.length,
                totalOrders: orders.length,
                totalCategories: categories.length,
                pendingOrders,
                shippedOrders,
                deliveredOrders,
            };
        } catch (error) {
            console.error('Error fetching statistics:', error);
            return {
                totalProducts: 0,
                totalOrders: 0,
                totalCategories: 0,
                pendingOrders: 0,
                shippedOrders: 0,
                deliveredOrders: 0,
            };
        }
    },

    // ==================== CUSTOMERS ====================
    async getCustomers(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const endpoint = queryString ? `/admin/customers?${queryString}` : '/admin/customers';
            const result = await this._request(endpoint);
            return result.data.customers;
        } catch (error) {
            console.error('Error fetching customers:', error);
            return [];
        }
    },
};
