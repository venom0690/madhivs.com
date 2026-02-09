/**
 * Admin Data Bridge
 * Connects customer website to backend API
 * Single source of truth for all product and content data
 */

(function (window) {
    'use strict';

    const API_BASE_URL = window.location.origin + '/api';

    // Cache for API responses
    let productsCache = null;
    let categoriesCache = null;
    let homepageCache = null;
    let cacheTimestamp = 0;
    const CACHE_DURATION = 60000; // 1 minute cache

    /**
     * Check if cache is valid
     */
    function isCacheValid() {
        return Date.now() - cacheTimestamp < CACHE_DURATION;
    }

    /**
     * Clear cache
     */
    function clearCache() {
        productsCache = null;
        categoriesCache = null;
        homepageCache = null;
        cacheTimestamp = 0;
    }

    /**
     * Fetch wrapper with error handling
     */
    async function fetchAPI(endpoint) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error.message);
            return null;
        }
    }

    /**
     * Get all products from API
     * @returns {Promise<Array>} Array of product objects
     */
    async function getAdminProducts() {
        if (productsCache && isCacheValid()) {
            return productsCache;
        }

        const result = await fetchAPI('/products?limit=1000');
        if (result && result.data) {
            productsCache = result.data.products;
            cacheTimestamp = Date.now();
            return productsCache;
        }
        return [];
    }

    /**
     * Get all categories from API
     * @returns {Promise<Array>} Array of category objects
     */
    async function getAdminCategories() {
        if (categoriesCache && isCacheValid()) {
            return categoriesCache;
        }

        const result = await fetchAPI('/categories');
        if (result && result.data) {
            categoriesCache = result.data.categories;
            cacheTimestamp = Date.now();
            return categoriesCache;
        }
        return [];
    }

    /**
     * Get homepage content from API
     * @returns {Promise<Object>} Homepage content object
     */
    async function getAdminHomepageContent() {
        if (homepageCache && isCacheValid()) {
            return homepageCache;
        }

        const result = await fetchAPI('/homepage');
        if (result && result.data) {
            homepageCache = result.data;
            cacheTimestamp = Date.now();
            return homepageCache;
        }
        return {
            sliderImages: [],
            trendingProducts: [],
            popularProducts: []
        };
    }

    /**
     * Get category by ID
     */
    async function getAdminCategoryById(categoryId) {
        const categories = await getAdminCategories();
        return categories.find(cat => cat._id === categoryId) || null;
    }

    /**
     * Get product by ID
     */
    async function getAdminProductById(productId) {
        const products = await getAdminProducts();
        return products.find(prod => prod._id === productId) || null;
    }

    /**
     * Get products by category ID
     */
    async function getAdminProductsByCategory(categoryId) {
        const products = await getAdminProducts();
        return products.filter(prod => prod.category?._id === categoryId || prod.category === categoryId);
    }

    /**
     * Get products by category type (Men/Women/General)
     */
    async function getAdminProductsByCategoryType(type) {
        const products = await getAdminProducts();
        return products.filter(prod => prod.category?.type === type);
    }

    /**
     * Get trending products
     */
    async function getAdminTrendingProducts() {
        const homepage = await getAdminHomepageContent();
        if (homepage.trendingProducts && homepage.trendingProducts.length > 0) {
            return homepage.trendingProducts;
        }
        // Fallback: get products marked as trending
        const products = await getAdminProducts();
        return products.filter(prod => prod.isTrending === true);
    }

    /**
     * Get popular products
     */
    async function getAdminPopularProducts() {
        const homepage = await getAdminHomepageContent();
        if (homepage.popularProducts && homepage.popularProducts.length > 0) {
            return homepage.popularProducts;
        }
        // Fallback: get products marked as popular
        const products = await getAdminProducts();
        return products.filter(prod => prod.isPopular === true);
    }

    /**
     * Get men's collection products
     */
    async function getAdminMenProducts() {
        const products = await getAdminProducts();
        return products.filter(prod => prod.isMenCollection === true);
    }

    /**
     * Get women's collection products
     */
    async function getAdminWomenProducts() {
        const products = await getAdminProducts();
        return products.filter(prod => prod.isWomenCollection === true);
    }

    /**
     * Get slider images
     */
    async function getAdminSliderImages() {
        const homepage = await getAdminHomepageContent();
        return homepage.sliderImages || [];
    }

    /**
     * Transform product for website display
     */
    function transformProductForWebsite(product) {
        const category = product.category;
        return {
            id: product._id,
            name: product.name,
            slug: product.slug,
            price: product.price.toString(),
            priceFormatted: `₹${product.price.toLocaleString('en-IN')}`,
            discountPrice: product.discountPrice,
            image: product.primaryImage,
            subImages: product.images || [],
            category: category?.name?.toLowerCase() || 'general',
            categoryId: category?._id || product.category,
            categoryName: category?.name || 'General',
            categoryType: category?.type || 'General',
            subCategory: product.subCategory || '',
            sizes: product.sizes || [],
            colors: product.colors || [],
            stock: product.stock || 0,
            description: product.description || '',
            isPopular: product.isPopular || false,
            isTrending: product.isTrending || false,
            isFeatured: product.isFeatured || false,
            isMenCollection: product.isMenCollection || false,
            isWomenCollection: product.isWomenCollection || false
        };
    }

    /**
     * Get all products in website format
     */
    async function getWebsiteProducts() {
        const products = await getAdminProducts();
        return products.map(transformProductForWebsite);
    }

    /**
     * Search products
     */
    async function searchAdminProducts(query) {
        if (!query || query.trim() === '') {
            return [];
        }

        const products = await getWebsiteProducts();
        const searchTerm = query.toLowerCase().trim();

        return products.filter(product => {
            return product.name.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm) ||
                product.categoryName.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm));
        });
    }

    /**
     * Check if data exists
     */
    async function hasAdminData() {
        const products = await getAdminProducts();
        return products.length > 0;
    }

    // Expose functions to global scope
    window.AdminDataBridge = {
        // Core getters (async)
        getProducts: getAdminProducts,
        getCategories: getAdminCategories,
        getHomepageContent: getAdminHomepageContent,

        // Specific getters (async)
        getProductById: getAdminProductById,
        getCategoryById: getAdminCategoryById,
        getProductsByCategory: getAdminProductsByCategory,
        getProductsByCategoryType: getAdminProductsByCategoryType,

        // Collection getters (async)
        getTrendingProducts: getAdminTrendingProducts,
        getPopularProducts: getAdminPopularProducts,
        getMenProducts: getAdminMenProducts,
        getWomenProducts: getAdminWomenProducts,

        // Homepage (async)
        getSliderImages: getAdminSliderImages,

        // Utilities
        transformProduct: transformProductForWebsite,
        getWebsiteProducts: getWebsiteProducts,
        searchProducts: searchAdminProducts,
        hasData: hasAdminData,
        clearCache: clearCache
    };

})(window);
