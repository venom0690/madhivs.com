/**
 * Dynamic Product Loader for Men's Collection Page
 * Replaces hardcoded products with admin panel data
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', async function () {
        const productGrid = document.getElementById('productGrid');

        if (!productGrid) {
            return; // Not on men's page
        }

        // Check if we should use admin data
        if (typeof AdminDataBridge === 'undefined' || !(await AdminDataBridge.hasData())) {
            // No admin data, keep hardcoded HTML products
            console.log('Using hardcoded products (no admin data)');
            return;
        }

        // Load products from admin panel (async)
        const menProducts = await getMenProducts();

        if (!menProducts || menProducts.length === 0) {
            console.log('No men\'s products found in admin panel, keeping hardcoded');
            return;
        }

        // Clear existing hardcoded products
        productGrid.innerHTML = '';

        // Create product cards from admin data
        menProducts.forEach(product => {
            const card = createProductCard(product);
            productGrid.appendChild(card);
        });

        // Re-initialize wishlist hearts
        if (typeof initializeWishlistHearts === 'function') {
            initializeWishlistHearts();
        }

        console.log(`Loaded ${menProducts.length} products from admin panel`);
    });

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
