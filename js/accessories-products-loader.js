/**
 * Dynamic Product Loader for Accessories Collection Page
 * Replaces hardcoded products with admin panel data
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', async function () {
        const productGrid = document.getElementById('productGrid');

        if (!productGrid) {
            return; // Not on accessories page
        }

        // Check if we should use admin data
        if (typeof AdminDataBridge === 'undefined' || !(await AdminDataBridge.hasData())) {
            // No admin data, keep hardcoded HTML products
            console.log('Using hardcoded products (no admin data)');
            return;
        }

        // Load products from admin panel (async)
        const accessoriesProducts = await getAccessoriesProducts();

        if (!accessoriesProducts || accessoriesProducts.length === 0) {
            console.log('No accessories products found in admin panel, keeping hardcoded');
            return;
        }

        // Clear existing hardcoded products
        productGrid.innerHTML = '';

        // Create product cards from admin data
        accessoriesProducts.forEach(product => {
            const card = createProductCard(product);
            productGrid.appendChild(card);
        });

        // Re-initialize wishlist hearts
        if (typeof initializeWishlistHearts === 'function') {
            initializeWishlistHearts();
        }

        console.log(`Loaded ${accessoriesProducts.length} products from admin panel`);
    });

    /**
     * Get accessories products from admin panel
     * Looks for products in "Accessories" category or with accessories-related subcategories
     */
    async function getAccessoriesProducts() {
        try {
            // Get all products and categories
            const [products, categories] = await Promise.all([
                AdminDataBridge.getProducts(),
                AdminDataBridge.getCategories()
            ]);

            // Find accessories category (case-insensitive)
            const accessoriesCategory = categories.find(cat => 
                cat.name.toLowerCase().includes('accessories') || 
                cat.name.toLowerCase().includes('accessory')
            );

            if (accessoriesCategory) {
                // Filter products by accessories category
                const categoryProducts = products.filter(p => 
                    p.category_id === accessoriesCategory.id
                );
                
                if (categoryProducts.length > 0) {
                    return categoryProducts.map(AdminDataBridge.transformProduct);
                }
            }

            // Fallback: look for products with accessories-related keywords
            const accessoriesKeywords = ['bag', 'jewelry', 'jewellery', 'necklace', 'bracelet', 
                                        'earring', 'ring', 'watch', 'belt', 'scarf', 'sunglasses',
                                        'handbag', 'purse', 'wallet', 'clutch'];
            
            const keywordProducts = products.filter(p => {
                const name = (p.name || '').toLowerCase();
                const desc = (p.description || '').toLowerCase();
                return accessoriesKeywords.some(keyword => 
                    name.includes(keyword) || desc.includes(keyword)
                );
            });

            return keywordProducts.map(AdminDataBridge.transformProduct);
        } catch (error) {
            console.error('Error loading accessories products:', error);
            return [];
        }
    }

    // Helper to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Create a product card element
     * @param {Object} product - Product data object
     * @returns {HTMLElement} Product card element
     */
    function createProductCard(product) {
        const productLink = `product.html?id=${product.id}&name=${encodeURIComponent(product.name)}&price=${product.price}&image=${encodeURIComponent(product.image)}`;
        const imageUrl = typeof getImageUrl === 'function' ? getImageUrl(product.image, '?w=600&q=80') : product.image;

        const card = document.createElement('a');
        card.href = productLink;
        card.className = 'product-card';
        card.setAttribute('data-category', escapeHtml(product.category));

        const safeName = escapeHtml(product.name);
        const safePrice = escapeHtml(product.priceFormatted);
        const safeImage = escapeHtml(imageUrl);

        card.innerHTML = `
            <div class="product-images">
                <button class="wishlist-heart" 
                    data-product-name="${safeName}"
                    data-product-price="${safePrice}"
                    data-product-image="${safeImage}"
                    data-product-link="${productLink}">
                    ❤️
                </button>
                <img class="main-image" 
                    src="${safeImage}" 
                    alt="${safeName}">
            </div>
            <div class="product-info">
                <h3 class="product-name">${safeName}</h3>
                <p class="product-price">${safePrice}</p>
            </div>
        `;

        return card;
    }
})();
