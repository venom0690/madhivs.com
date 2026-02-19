/**
 * Dynamic Product Loader for Women's Collection Page
 * Replaces hardcoded products with API data
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', async function () {
        const productGrid = document.getElementById('productGrid');

        if (!productGrid) return;

        // Show loading state
        productGrid.innerHTML = '<div class="loading-spinner">Loading products...</div>';

        try {
            // Load products from API
            const womenProducts = await ProductService.getWomen();

            if (!womenProducts || womenProducts.length === 0) {
                productGrid.innerHTML = '<div class="no-products">No products found in Women\'s collection.</div>';
                return;
            }

            // Clear loading state
            productGrid.innerHTML = '';

            // Create product cards
            womenProducts.forEach(product => {
                const card = createProductCard(product);
                productGrid.appendChild(card);
            });

            // Re-initialize wishlist hearts
            if (typeof initializeWishlistHearts === 'function') {
                initializeWishlistHearts();
            }

            // Lazy load images
            const lazyImages = productGrid.querySelectorAll('img[loading="lazy"]');
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                            observer.unobserve(img);
                        }
                    });
                });
                lazyImages.forEach(img => imageObserver.observe(img));
            } else {
                lazyImages.forEach(img => img.src = img.dataset.src);
            }

        } catch (error) {
            console.error('Error loading women\'s products:', error);
            productGrid.innerHTML = '<div class="error-message">Failed to load products. Please try again later.</div>';
        }
    });

    // Helper to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        return text.toString()
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
        const productLink = `product.html?id=${product.id}`;
        const imageUrl = product.primary_image || product.image || 'assets/images/placeholder.jpg';

        // Format price
        const priceDisplay = typeof product.price === 'number'
            ? `₹${product.price.toLocaleString()}`
            : product.priceFormatted || `₹${product.price}`;

        const card = document.createElement('a');
        card.href = productLink;
        card.className = 'product-card';
        if (product.category_name) {
            card.setAttribute('data-category', escapeHtml(product.category_name));
        }

        card.innerHTML = `
            <div class="product-images">
                <button class="wishlist-heart" 
                    data-product-id="${product.id}"
                    data-product-name="${escapeHtml(product.name)}"
                    data-product-price="${escapeHtml(priceDisplay)}"
                    data-product-image="${escapeHtml(imageUrl)}"
                    data-product-link="${productLink}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
                <img class="main-image" 
                    src="assets/images/placeholder.jpg"
                    data-src="${escapeHtml(imageUrl)}" 
                    alt="${escapeHtml(product.name)}"
                    loading="lazy">
            </div>
            <div class="product-info">
                <h3 class="product-name">${escapeHtml(product.name)}</h3>
                <p class="product-price">${escapeHtml(priceDisplay)}</p>
            </div>
        `;

        return card;
    }
})();
