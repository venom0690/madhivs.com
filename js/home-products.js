/**
 * Home Products Loader
 * Dynamically loads Popular and Trending products on index.html
 */

(function () {
    'use strict';

    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', async function () {
        // Check if we're on the index page
        const popularContainer = document.getElementById('popularProducts');
        const trendingContainer = document.getElementById('trendingProducts');

        if (!popularContainer || !trendingContainer) {
            return; // Not on the index page
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

        /**
         * Load products into a container
         * @param {Array} products - Array of product objects
         * @param {HTMLElement} container - Container element
         * @param {number} maxProducts - Maximum number of products to display
         */
        function loadProducts(products, container, maxProducts = 6) {
            // Clear existing content
            container.innerHTML = '';

            // Limit the number of products displayed
            const productsToShow = products.slice(0, maxProducts);

            // Create and append product cards
            productsToShow.forEach(product => {
                const card = createProductCard(product);
                container.appendChild(card);
            });

            // Re-initialize wishlist hearts for new cards
            if (typeof initializeWishlistHearts === 'function') {
                initializeWishlistHearts();
            }
        }

        // Load Popular Products (async)
        const popularProducts = await getPopularProducts();
        loadProducts(popularProducts, popularContainer, 8);

        // Load Trending Products (async)
        const trendingProducts = await getTrendingProducts();
        loadProducts(trendingProducts, trendingContainer, 8);

        // Add click event prevention for wishlist hearts
        document.querySelectorAll('.wishlist-heart').forEach(heart => {
            heart.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
            });
        });
    });
})();
