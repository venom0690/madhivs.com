/**
 * Dynamic Product Loader for Women's Collection Page
 * Replaces hardcoded products with admin panel data
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', async function () {
        const productGrid = document.getElementById('productGrid');

        if (!productGrid) {
            return; // Not on women's page
        }

        // Check if we should use admin data
        if (typeof AdminDataBridge === 'undefined' || !(await AdminDataBridge.hasData())) {
            // No admin data, keep hardcoded HTML products
            console.log('Using hardcoded products (no admin data)');
            return;
        }

        // Load products from admin panel (async)
        const womenProducts = await getWomenProducts();

        if (!womenProducts || womenProducts.length === 0) {
            console.log('No women\'s products found in admin panel, keeping hardcoded');
            return;
        }

        // Clear existing hardcoded products
        productGrid.innerHTML = '';

        // Create product cards from admin data
        womenProducts.forEach(product => {
            const card = createProductCard(product);
            productGrid.appendChild(card);
        });

        // Re-initialize wishlist hearts
        if (typeof initializeWishlistHearts === 'function') {
            initializeWishlistHearts();
        }

        console.log(`Loaded ${womenProducts.length} products from admin panel`);
    });

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
