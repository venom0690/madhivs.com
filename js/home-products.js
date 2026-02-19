/**
 * Home Products Loader
 * Dynamically loads Popular and Trending products on index.html
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', async function () {
        const popularContainer = document.getElementById('popularProducts');
        const trendingContainer = document.getElementById('trendingProducts');

        if (!popularContainer || !trendingContainer) return;

        /**
         * Create a product card element
         */
        function createProductCard(product) {
            // Encode URI components for safety
            const nameEnc = encodeURIComponent(product.name);
            const priceEnc = product.price; // Passed as raw number usually
            const imageEnc = encodeURIComponent(product.primary_image || product.image);

            const productLink = `product.html?id=${product.id}`;
            const imageUrl = product.primary_image || product.image || 'assets/images/placeholder.jpg';

            // Format price if needed
            const priceDisplay = typeof product.price === 'number'
                ? `₹${product.price.toLocaleString()}`
                : product.priceFormatted || `₹${product.price}`;

            const card = document.createElement('a');
            card.href = productLink;
            card.className = 'product-card';
            if (product.category_name) {
                card.setAttribute('data-category', product.category_name);
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

        // XSS Helper
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
         * Load products into container
         */
        function renderProducts(products, container) {
            container.innerHTML = '';

            if (!products || products.length === 0) {
                container.innerHTML = '<div class="no-products">No products found.</div>';
                return;
            }

            products.forEach(product => {
                const card = createProductCard(product);
                container.appendChild(card);
            });

            // Initialize lazy loading
            const lazyImages = container.querySelectorAll('img[loading="lazy"]');
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
                // Fallback
                lazyImages.forEach(img => img.src = img.dataset.src);
            }

            // Wishlist logic
            if (typeof initializeWishlistHearts === 'function') {
                initializeWishlistHearts();
            }

            // Prevent heart click default
            container.querySelectorAll('.wishlist-heart').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Wishlist toggle logic is usually handled by `initializeWishlistHearts` or global event delegation
                });
            });
        }

        // Fetch Data
        try {
            // Show loading state
            popularContainer.innerHTML = '<div class="loading-spinner">Loading...</div>';
            trendingContainer.innerHTML = '<div class="loading-spinner">Loading...</div>';

            const [popularProducts, trendingProducts] = await Promise.all([
                ProductService.getPopular(),
                ProductService.getTrending()
            ]);

            renderProducts(popularProducts, popularContainer);
            renderProducts(trendingProducts, trendingContainer);

        } catch (error) {
            console.error('Error loading home products:', error);
            popularContainer.innerHTML = '<div class="error-message">Failed to load products.</div>';
            trendingContainer.innerHTML = '<div class="error-message">Failed to load products.</div>';
        }
    });
})();
