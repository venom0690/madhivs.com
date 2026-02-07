/**
 * Admin Data Bridge
 * Connects customer website to admin panel data
 * Single source of truth for all product and content data
 */

(function (window) {
    'use strict';

    /**
     * Get all products from admin panel
     * @returns {Array} Array of product objects
     */
    function getAdminProducts() {
        try {
            const products = JSON.parse(localStorage.getItem('admin_products') || '[]');
            return products;
        } catch (error) {
            console.error('Error loading admin products:', error);
            return [];
        }
    }

    /**
     * Get all categories from admin panel
     * @returns {Array} Array of category objects
     */
    function getAdminCategories() {
        try {
            const categories = JSON.parse(localStorage.getItem('admin_categories') || '[]');
            return categories;
        } catch (error) {
            console.error('Error loading admin categories:', error);
            return [];
        }
    }

    /**
     * Get homepage content from admin panel
     * @returns {Object} Homepage content object
     */
    function getAdminHomepageContent() {
        try {
            const data = JSON.parse(localStorage.getItem('admin_homepage') || '{}');
            // Handle both object (legacy) and array (new data service) formats
            const content = Array.isArray(data) ? (data[0] || {}) : data;
            
            return {
                sliderImages: content.sliderImages || [],
                trendingProductIds: content.trendingProductIds || [],
                popularProductIds: content.popularProductIds || []
            };
        } catch (error) {
            console.error('Error loading homepage content:', error);
            return {
                sliderImages: [],
                trendingProductIds: [],
                popularProductIds: []
            };
        }
    }

    /**
     * Get category by ID
     * @param {string} categoryId - Category ID
     * @returns {Object|null} Category object or null
     */
    function getAdminCategoryById(categoryId) {
        const categories = getAdminCategories();
        return categories.find(cat => cat.id === categoryId) || null;
    }

    /**
     * Get product by ID
     * @param {string} productId - Product ID
     * @returns {Object|null} Product object or null
     */
    function getAdminProductById(productId) {
        const products = getAdminProducts();
        return products.find(prod => prod.id === productId) || null;
    }

    /**
     * Get products by category ID
     * @param {string} categoryId - Category ID
     * @returns {Array} Array of products
     */
    function getAdminProductsByCategory(categoryId) {
        const products = getAdminProducts();
        return products.filter(prod => prod.category === categoryId);
    }

    /**
     * Get products by category type (Men/Women)
     * @param {string} type - Category type ('Men' or 'Women')
     * @returns {Array} Array of products
     */
    function getAdminProductsByCategoryType(type) {
        const products = getAdminProducts();
        const categories = getAdminCategories();
        const categoryIds = categories
            .filter(cat => cat.type === type)
            .map(cat => cat.id);

        return products.filter(prod => categoryIds.includes(prod.category));
    }

    /**
     * Get trending products from admin panel
     * @returns {Array} Array of trending products
     */
    function getAdminTrendingProducts() {
        const homepage = getAdminHomepageContent();
        const products = getAdminProducts();

        // If admin has configured trending products, use those
        if (homepage.trendingProductIds && homepage.trendingProductIds.length > 0) {
            return homepage.trendingProductIds
                .map(id => products.find(p => p.id === id))
                .filter(p => p !== undefined);
        }

        // Fallback: use products marked as trending
        return products.filter(prod => prod.isTrending === true);
    }

    /**
     * Get popular products from admin panel
     * @returns {Array} Array of popular products
     */
    function getAdminPopularProducts() {
        const homepage = getAdminHomepageContent();
        const products = getAdminProducts();

        // If admin has configured popular products, use those
        if (homepage.popularProductIds && homepage.popularProductIds.length > 0) {
            return homepage.popularProductIds
                .map(id => products.find(p => p.id === id))
                .filter(p => p !== undefined);
        }

        // Fallback: use products marked as popular
        return products.filter(prod => prod.isPopular === true);
    }

    /**
     * Get men's collection products
     * @returns {Array} Array of men's products
     */
    function getAdminMenProducts() {
        const products = getAdminProducts();
        return products.filter(prod => prod.isMenCollection === true);
    }

    /**
     * Get women's collection products
     * @returns {Array} Array of women's products
     */
    function getAdminWomenProducts() {
        const products = getAdminProducts();
        return products.filter(prod => prod.isWomenCollection === true);
    }

    /**
     * Get slider images from admin panel
     * @returns {Array} Array of active slider images
     */
    function getAdminSliderImages() {
        const homepage = getAdminHomepageContent();
        return homepage.sliderImages
            .filter(img => img.isActive === true)
            .sort((a, b) => a.order - b.order);
    }

    /**
     * Transform admin product to website format
     * @param {Object} adminProduct - Admin product object
     * @returns {Object} Website-formatted product
     */
    function transformProductForWebsite(adminProduct) {
        const category = getAdminCategoryById(adminProduct.category);

        return {
            id: adminProduct.id,
            name: adminProduct.name,
            price: adminProduct.price.toString(),
            priceFormatted: `₹${adminProduct.price.toLocaleString('en-IN')}`,
            image: adminProduct.primaryImage,
            subImages: adminProduct.subImages || [],
            category: category ? category.name.toLowerCase() : 'general',
            categoryId: adminProduct.category,
            categoryName: category ? category.name : 'General',
            subCategory: adminProduct.subCategory || '',
            sizes: adminProduct.sizes || [],
            colors: adminProduct.colors || [],
            stock: adminProduct.stock || 0,
            description: adminProduct.description || '',
            isPopular: adminProduct.isPopular || false,
            isTrending: adminProduct.isTrending || false,
            isMenCollection: adminProduct.isMenCollection || false,
            isWomenCollection: adminProduct.isWomenCollection || false
        };
    }

    /**
     * Get all products in website format
     * @returns {Array} Array of website-formatted products
     */
    function getWebsiteProducts() {
        const adminProducts = getAdminProducts();
        return adminProducts.map(transformProductForWebsite);
    }

    /**
     * Search products by query
     * @param {string} query - Search query
     * @returns {Array} Array of matching products
     */
    function searchAdminProducts(query) {
        if (!query || query.trim() === '') {
            return [];
        }

        const products = getWebsiteProducts();
        const searchTerm = query.toLowerCase().trim();

        return products.filter(product => {
            return product.name.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm) ||
                product.categoryName.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm));
        });
    }

    /**
     * Check if admin data exists
     * @returns {boolean} True if admin has added data
     */
    function hasAdminData() {
        const products = getAdminProducts();
        return products.length > 0;
    }

    // Expose functions to global scope
    window.AdminDataBridge = {
        // Core getters
        getProducts: getAdminProducts,
        getCategories: getAdminCategories,
        getHomepageContent: getAdminHomepageContent,

        // Specific getters
        getProductById: getAdminProductById,
        getCategoryById: getAdminCategoryById,
        getProductsByCategory: getAdminProductsByCategory,
        getProductsByCategoryType: getAdminProductsByCategoryType,

        // Collection getters
        getTrendingProducts: getAdminTrendingProducts,
        getPopularProducts: getAdminPopularProducts,
        getMenProducts: getAdminMenProducts,
        getWomenProducts: getAdminWomenProducts,

        // Homepage
        getSliderImages: getAdminSliderImages,

        // Utilities
        transformProduct: transformProductForWebsite,
        getWebsiteProducts: getWebsiteProducts,
        searchProducts: searchAdminProducts,
        hasData: hasAdminData
    };

})(window);
