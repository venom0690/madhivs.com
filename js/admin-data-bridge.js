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
        if (result && result.products) {
            productsCache = result.products;
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
        if (result && result.categories) {
            categoriesCache = result.categories;
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

        const result = await fetchAPI('/content/homepage');
        if (result && result.data) {
            homepageCache = result.data;
            cacheTimestamp = Date.now();
            return homepageCache;
        }

        // Fallback structure if API fails
        return {
            sliderImages: [],
            trendingProductIds: [],
            popularProductIds: []
        };
    }

    /**
     * Get search keywords from API
     */
    async function getAdminKeywords() {
        const result = await fetchAPI('/content/keywords');
        return result && result.data ? result.data : [];
    }

    /**
     * Get category by ID
     */
    async function getAdminCategoryById(categoryId) {
        const categories = await getAdminCategories();
        return categories.find(cat => cat.id == categoryId) || null;
    }

    /**
     * Get product by ID
     */
    async function getAdminProductById(productId) {
        const products = await getAdminProducts();
        return products.find(prod => prod.id == productId) || null;
    }

    /**
     * Get products by category ID
     */
    async function getAdminProductsByCategory(categoryId) {
        const products = await getAdminProducts();
        return products.filter(prod => prod.category_id == categoryId);
    }

    /**
     * Get products by category type (Men/Women/General)
     */
    async function getAdminProductsByCategoryType(type) {
        // For category type filtering, we need to fetch categories too
        const [products, categories] = await Promise.all([
            getAdminProducts(),
            getAdminCategories()
        ]);
        const categoryIds = categories.filter(c => c.type === type).map(c => c.id);
        return products.filter(prod => categoryIds.includes(prod.category_id));
    }

    /**
     * Get trending products
     */
    async function getAdminTrendingProducts() {
        const homepage = await getAdminHomepageContent();
        const products = await getAdminProducts();

        // Use IDs from homepage settings if available
        if (homepage.trendingProductIds && homepage.trendingProductIds.length > 0) {
            return products.filter(p => homepage.trendingProductIds.includes(p.id.toString()) || homepage.trendingProductIds.includes(p.id));
        }

        // Fallback: get products marked as trending in DB
        return products.filter(prod => prod.is_trending == 1 || prod.is_trending === true);
    }

    /**
     * Get popular products
     */
    async function getAdminPopularProducts() {
        const homepage = await getAdminHomepageContent();
        const products = await getAdminProducts();

        // Use IDs from homepage settings if available
        if (homepage.popularProductIds && homepage.popularProductIds.length > 0) {
            return products.filter(p => homepage.popularProductIds.includes(p.id.toString()) || homepage.popularProductIds.includes(p.id));
        }

        // Fallback: get products marked as popular in DB
        return products.filter(prod => prod.is_popular == 1 || prod.is_popular === true);
    }

    /**
     * Get men's collection products
     */
    async function getAdminMenProducts() {
        const products = await getAdminProducts();
        return products.filter(prod => prod.is_men_collection == 1 || prod.is_men_collection === true);
    }

    /**
     * Get women's collection products
     */
    async function getAdminWomenProducts() {
        const products = await getAdminProducts();
        return products.filter(prod => prod.is_women_collection == 1 || prod.is_women_collection === true);
    }

    /**
     * Get slider images
     */
    async function getAdminSliderImages() {
        const homepage = await getAdminHomepageContent();
        // Return active slider images sorted by order
        return (homepage.sliderImages || [])
            .filter(img => img.isActive)
            .sort((a, b) => a.order - b.order);
    }

    /**
     * Transform product for website display
     */
    function transformProductForWebsite(product) {
        return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price.toString(),
            priceFormatted: `₹${Number(product.price).toLocaleString('en-IN')}`,
            discountPrice: product.discount_price,
            image: product.primary_image,
            subImages: product.images || [],
            category: 'general',
            categoryId: product.category_id,
            categoryName: 'General',
            categoryType: 'General',
            subCategory: product.sub_category || '',
            sizes: product.sizes || [],
            colors: product.colors || [],
            stock: product.stock || 0,
            description: product.description || '',
            isPopular: product.is_popular == 1,
            isTrending: product.is_trending == 1,
            isFeatured: product.is_featured == 1,
            isMenCollection: product.is_men_collection == 1,
            isWomenCollection: product.is_women_collection == 1
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
        getKeywords: getAdminKeywords,

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
