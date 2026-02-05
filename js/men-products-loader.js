/**
 * Dynamic Product Loader for Men's Collection Page
 * Replaces hardcoded products with admin panel data
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        const productGrid = document.getElementById('productGrid');

        if (!productGrid) {
            return; // Not on men's page
        }

        // Check if we should use admin data
        if (typeof AdminDataBridge === 'undefined' || !AdminDataBridge.hasData()) {
            // No admin data, keep hardcoded HTML products
            console.log('Using hardcoded products (no admin data)');
            return;
        }

        // Load products from admin panel
        const menProducts = getMenProducts(); // Uses admin data via products.js

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

    /**
     * Create a product card element
     * @param {Object} product - Product data object
     * @returns {HTMLElement} Product card element
     */
    function createProductCard(product) {
        const productLink = `product.html?name=${encodeURIComponent(product.name)}&price=${product.price}&image=${encodeURIComponent(product.image)}`;
        const imageUrl = `${product.image}?w=600&q=80`;

        const card = document.createElement('a');
        card.href = productLink;
        card.className = 'product-card';
        card.setAttribute('data-category', product.category);

        card.innerHTML = `
            <div class="product-images">
                <button class="wishlist-heart" 
                    data-product-name="${product.name}"
                    data-product-price="${product.priceFormatted}"
                    data-product-image="${imageUrl}"
                    data-product-link="${productLink}">
                    ❤️
                </button>
                <img class="main-image" 
                    src="${imageUrl}" 
                    alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${product.priceFormatted}</p>
            </div>
        `;

        return card;
    }
})();
