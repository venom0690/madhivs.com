/**
 * Data Service Layer for Admin Panel
 * Handles all CRUD operations using localStorage
 * Easily replaceable with API calls for backend integration
 */

const dataService = {
    // Storage keys
    KEYS: {
        CATEGORIES: 'admin_categories',
        PRODUCTS: 'admin_products',
        ORDERS: 'admin_orders',
        HOMEPAGE: 'admin_homepage',
        KEYWORDS: 'admin_keywords'
    },

    // Helper: Get data from localStorage
    _getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`Error reading ${key}:`, error);
            return [];
        }
    },

    // Helper: Save data to localStorage
    _saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
            return false;
        }
    },

    // ==================== CATEGORIES ====================
    // API endpoint: GET /api/categories
    getCategories() {
        return this._getData(this.KEYS.CATEGORIES);
    },

    // API endpoint: GET /api/categories/:id
    getCategoryById(id) {
        const categories = this.getCategories();
        return categories.find(cat => cat.id === id);
    },

    // API endpoint: POST /api/categories
    createCategory(categoryData) {
        try {
            const category = new Category(categoryData);
            category.validate();

            const categories = this.getCategories();
            categories.push(category);
            this._saveData(this.KEYS.CATEGORIES, categories);

            return category;
        } catch (error) {
            throw error;
        }
    },

    // API endpoint: PUT /api/categories/:id
    updateCategory(id, categoryData) {
        try {
            const categories = this.getCategories();
            const index = categories.findIndex(cat => cat.id === id);

            if (index === -1) {
                throw new Error('Category not found');
            }

            categoryData.id = id;
            categoryData.updatedAt = new Date().toISOString();
            const category = new Category(categoryData);
            category.validate();

            categories[index] = category;
            this._saveData(this.KEYS.CATEGORIES, categories);

            return category;
        } catch (error) {
            throw error;
        }
    },

    // API endpoint: DELETE /api/categories/:id
    deleteCategory(id) {
        try {
            // Check if category is used by any products
            const products = this.getProducts();
            const usedByProducts = products.some(p => p.category === id);

            if (usedByProducts) {
                throw new Error('Cannot delete category that is used by products');
            }

            const categories = this.getCategories();
            const filtered = categories.filter(cat => cat.id !== id);
            this._saveData(this.KEYS.CATEGORIES, filtered);

            return true;
        } catch (error) {
            throw error;
        }
    },

    // ==================== PRODUCTS ====================
    // API endpoint: GET /api/products
    getProducts() {
        return this._getData(this.KEYS.PRODUCTS);
    },

    // API endpoint: GET /api/products/:id
    getProductById(id) {
        const products = this.getProducts();
        return products.find(p => p.id === id);
    },

    // API endpoint: POST /api/products
    createProduct(productData) {
        try {
            const product = new Product(productData);
            product.validate();

            const products = this.getProducts();
            products.push(product);
            this._saveData(this.KEYS.PRODUCTS, products);

            return product;
        } catch (error) {
            throw error;
        }
    },

    // API endpoint: PUT /api/products/:id
    updateProduct(id, productData) {
        try {
            const products = this.getProducts();
            const index = products.findIndex(p => p.id === id);

            if (index === -1) {
                throw new Error('Product not found');
            }

            productData.id = id;
            productData.createdAt = products[index].createdAt;
            productData.updatedAt = new Date().toISOString();
            const product = new Product(productData);
            product.validate();

            products[index] = product;
            this._saveData(this.KEYS.PRODUCTS, products);

            return product;
        } catch (error) {
            throw error;
        }
    },

    // API endpoint: DELETE /api/products/:id
    deleteProduct(id) {
        try {
            const products = this.getProducts();
            const filtered = products.filter(p => p.id !== id);
            this._saveData(this.KEYS.PRODUCTS, filtered);

            return true;
        } catch (error) {
            throw error;
        }
    },

    // ==================== ORDERS ====================
    // API endpoint: GET /api/orders
    getOrders() {
        return this._getData(this.KEYS.ORDERS);
    },

    // API endpoint: GET /api/orders/:id
    getOrderById(id) {
        const orders = this.getOrders();
        return orders.find(o => o.id === id);
    },

    // API endpoint: POST /api/orders
    createOrder(orderData) {
        try {
            const order = new Order(orderData);
            order.validate();

            const orders = this.getOrders();
            orders.push(order);
            this._saveData(this.KEYS.ORDERS, orders);

            return order;
        } catch (error) {
            throw error;
        }
    },

    // API endpoint: PUT /api/orders/:id
    updateOrder(id, orderData) {
        try {
            const orders = this.getOrders();
            const index = orders.findIndex(o => o.id === id);

            if (index === -1) {
                throw new Error('Order not found');
            }

            orderData.id = id;
            orderData.createdAt = orders[index].createdAt;
            orderData.updatedAt = new Date().toISOString();
            const order = new Order(orderData);
            order.validate();

            orders[index] = order;
            this._saveData(this.KEYS.ORDERS, orders);

            return order;
        } catch (error) {
            throw error;
        }
    },

    // API endpoint: PUT /api/orders/:id/status
    updateOrderStatus(id, status) {
        try {
            const orders = this.getOrders();
            const order = orders.find(o => o.id === id);

            if (!order) {
                throw new Error('Order not found');
            }

            if (!['Pending', 'Shipped', 'Delivered'].includes(status)) {
                throw new Error('Invalid status');
            }

            order.status = status;
            order.updatedAt = new Date().toISOString();
            this._saveData(this.KEYS.ORDERS, orders);

            return order;
        } catch (error) {
            throw error;
        }
    },

    // ==================== HOMEPAGE CONTENT ====================
    // API endpoint: GET /api/homepage
    getHomepageContent() {
        const data = this._getData(this.KEYS.HOMEPAGE);
        return data.length > 0 ? data[0] : new HomepageContent({});
    },

    // API endpoint: PUT /api/homepage
    updateHomepageContent(contentData) {
        try {
            const content = new HomepageContent(contentData);
            content.updatedAt = new Date().toISOString();
            this._saveData(this.KEYS.HOMEPAGE, [content]);

            return content;
        } catch (error) {
            throw error;
        }
    },

    // ==================== SEARCH KEYWORDS ====================
    // API endpoint: GET /api/keywords
    getKeywords() {
        return this._getData(this.KEYS.KEYWORDS);
    },

    // API endpoint: GET /api/keywords/:id
    getKeywordById(id) {
        const keywords = this.getKeywords();
        return keywords.find(k => k.id === id);
    },

    // API endpoint: POST /api/keywords
    createKeyword(keywordData) {
        try {
            const keyword = new SearchKeyword(keywordData);
            keyword.validate();

            const keywords = this.getKeywords();
            keywords.push(keyword);
            this._saveData(this.KEYS.KEYWORDS, keywords);

            return keyword;
        } catch (error) {
            throw error;
        }
    },

    // API endpoint: PUT /api/keywords/:id
    updateKeyword(id, keywordData) {
        try {
            const keywords = this.getKeywords();
            const index = keywords.findIndex(k => k.id === id);

            if (index === -1) {
                throw new Error('Keyword not found');
            }

            keywordData.id = id;
            keywordData.createdAt = keywords[index].createdAt;
            const keyword = new SearchKeyword(keywordData);
            keyword.validate();

            keywords[index] = keyword;
            this._saveData(this.KEYS.KEYWORDS, keywords);

            return keyword;
        } catch (error) {
            throw error;
        }
    },

    // API endpoint: DELETE /api/keywords/:id
    deleteKeyword(id) {
        try {
            const keywords = this.getKeywords();
            const filtered = keywords.filter(k => k.id !== id);
            this._saveData(this.KEYS.KEYWORDS, filtered);

            return true;
        } catch (error) {
            throw error;
        }
    },

    // ==================== STATISTICS ====================
    // API endpoint: GET /api/stats
    getStatistics() {
        return {
            totalProducts: this.getProducts().length,
            totalOrders: this.getOrders().length,
            totalCategories: this.getCategories().length,
            pendingOrders: this.getOrders().filter(o => o.status === 'Pending').length,
            shippedOrders: this.getOrders().filter(o => o.status === 'Shipped').length,
            deliveredOrders: this.getOrders().filter(o => o.status === 'Delivered').length
        };
    }
};
