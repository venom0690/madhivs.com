/**
 * Product Service
 * Centralized API for fetching product data
 * Removes all hardcoded data and localStorage dependencies
 */

const ProductService = {
    /**
     * Transform backend product format to frontend expectations
     * Maps snake_case to camelCase and handles categories
     */
    _transformProduct(product) {
        if (!product) return null;

        return {
            ...product,
            // Map keys
            image: product.primary_image || product.image,
            subImages: product.images || [], // For thumbnails
            category: product.category_slug || product.category || 'general', // For URL/Filtering
            categoryName: product.category_name || product.category || 'General', // For Display
            categoryType: product.category_type || 'General',

            // Map Boolean flags
            isMenCollection: product.is_men_collection == 1 || product.is_men_collection === true,
            isWomenCollection: product.is_women_collection == 1 || product.is_women_collection === true,
            isTrending: product.is_trending == 1 || product.is_trending === true,
            isPopular: product.is_popular == 1 || product.is_popular === true,
            isFeatured: product.is_featured == 1 || product.is_featured === true,

            // Ensure numbers
            price: Number(product.price),
            priceFormatted: '₹' + Number(product.price).toLocaleString('en-IN'),
            stock: Number(product.stock)
        };
    },

    /**
     * Fetch products with optional filters
     * @param {Object} params - Query parameters (category, is_trending, etc.)
     * @returns {Promise<Array>} Array of products
     */
    async getProducts(params = {}) {
        try {
            const query = new URLSearchParams(params).toString();
            // Assuming the API is at /api/products based on controller
            const response = await fetch(`/api/products?${query}`);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const rawProducts = data.products || [];

            // Transform data for frontend
            return rawProducts.map(p => this._transformProduct(p));
        } catch (error) {
            console.error('Failed to fetch products:', error);
            return [];
        }
    },

    /**
     * Get popular products
     * @returns {Promise<Array>}
     */
    async getPopular() {
        return this.getProducts({ popular: 'true', limit: 8 });
    },

    /**
     * Get trending products
     * @returns {Promise<Array>}
     */
    async getTrending() {
        return this.getProducts({ trending: 'true', limit: 8 });
    },

    /**
     * Get men's products
     * @returns {Promise<Array>}
     */
    async getMen() {
        return this.getProducts({ men: 'true' });
    },

    /**
     * Get women's products
     * @returns {Promise<Array>}
     */
    async getWomen() {
        return this.getProducts({ women: 'true' });
    },

    /**
     * Get details for a single product
     * @param {string|number} idOrSlug 
     * @returns {Promise<Object|null>}
     */
    async getProduct(idOrSlug) {
        try {
            const response = await fetch(`/api/products/${idOrSlug}`);
            if (!response.ok) return null;

            const data = await response.json();
            return this._transformProduct(data.product);
        } catch (error) {
            console.error('Failed to fetch product:', error);
            return null;
        }
    },

    /**
     * Search products
     * @param {string} query 
     * @returns {Promise<Array>}
     */
    async search(query) {
        return this.getProducts({ search: query });
    },

    /**
     * Get all categories
     * @returns {Promise<Array>}
     */
    async getCategories() {
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) return [];
            const data = await response.json();
            return data.categories || [];
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            return [];
        }
    },

    /**
     * Get category by ID
     * @param {string|number} id
     * @returns {Promise<Object|null>}
     */
    async getCategory(id) {
        try {
            const response = await fetch(`/api/categories/${id}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.category || null;
        } catch (error) {
            console.error('Failed to fetch category:', error);
            return null;
        }
    },

    /**
     * Get search keywords
     * @returns {Promise<Array>}
     */
    async getKeywords() {
        try {
            const response = await fetch('/api/content/keywords');
            if (!response.ok) return [];
            const data = await response.json();
            return data.data || []; // Note: data-service.js returns result.data
        } catch (error) {
            console.error('Failed to fetch keywords:', error);
            return [];
        }
    }
};

// Expose globally
window.ProductService = ProductService;
