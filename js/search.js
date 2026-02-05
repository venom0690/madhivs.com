/**
 * Product Search Functionality
 * Filters products in real-time based on user search input
 */

/**
 * Handle search on index page (redirects to category pages)
 * @param {HTMLElement} searchInput - The search input element
 */
function handleIndexPageSearch(searchInput) {
    // Keywords that indicate category
    const womenKeywords = ['saree', 'lehenga', 'suit', 'anarkali', 'women', 'palazzo', 'georgette', 'kanjivaram', 'chanderi'];
    const menKeywords = ['kurta', 'sherwani', 'jacket', 'men', 'nehru', 'bandhgala'];

    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();

        if (query === '') {
            return;
        }

        // Check if query matches women's categories
        for (let keyword of womenKeywords) {
            if (query.includes(keyword)) {
                window.location.href = 'women.html';
                return;
            }
        }

        // Check if query matches men's categories
        for (let keyword of menKeywords) {
            if (query.includes(keyword)) {
                window.location.href = 'men.html';
                return;
            }
        }

        // Default: go to women's page for general searches
        window.location.href = 'women.html';
    }

    // Search on Enter key
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Search on icon click
    const searchIcon = document.querySelector('.search-icon');
    if (searchIcon) {
        searchIcon.addEventListener('click', performSearch);
    }

    // Visual feedback
    searchInput.addEventListener('focus', function () {
        this.parentElement.classList.add('search-box-focused');
    });

    searchInput.addEventListener('blur', function () {
        this.parentElement.classList.remove('search-box-focused');
    });
}


(function () {
    'use strict';

    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function () {
        const searchInput = document.querySelector('.search-box input');
        const productGrid = document.getElementById('productGrid');

        // Exit if search input doesn't exist on this page
        if (!searchInput) {
            return;
        }

        // Handle search on index page (no product grid)
        if (!productGrid) {
            handleIndexPageSearch(searchInput);
            return;
        }

        // Create "no results" message element
        const noResultsMessage = document.createElement('div');
        noResultsMessage.className = 'search-no-results';
        noResultsMessage.innerHTML = `
            <div class="empty-state-icon">🔍</div>
            <h2 class="empty-state-title">No products found</h2>
            <p class="empty-state-message">Try adjusting your search terms or browse our categories.</p>
        `;
        noResultsMessage.style.display = 'none';

        // Insert no results message after the product grid
        productGrid.parentNode.insertBefore(noResultsMessage, productGrid.nextSibling);

        // Get all product cards
        const productCards = productGrid.querySelectorAll('.product-card');

        /**
         * Filter products based on search query
         * @param {string} query - The search query
         */
        function filterProducts(query) {
            const searchTerm = query.toLowerCase().trim();
            let visibleCount = 0;

            // If search is empty, show all products (respecting category filter if active)
            if (searchTerm === '') {
                // Get the active category filter if exists
                const activeFilterBtn = document.querySelector('.filter-btn.active');
                const activeCategory = activeFilterBtn ? activeFilterBtn.getAttribute('data-category') : 'all';

                productCards.forEach(card => {
                    const productCategory = card.getAttribute('data-category');

                    // If "all" is selected or category matches, show the product
                    if (activeCategory === 'all' || productCategory === activeCategory) {
                        card.style.display = '';
                        visibleCount++;
                    } else {
                        // Hide if category doesn't match active filter
                        card.style.display = 'none';
                    }
                });

                productGrid.style.display = '';
                noResultsMessage.style.display = 'none';
                return;
            }

            // Filter products based on search term
            productCards.forEach(card => {
                const productName = card.querySelector('.product-name');
                const productCategory = card.getAttribute('data-category');

                if (productName) {
                    const productText = productName.textContent.toLowerCase();
                    const categoryText = productCategory ? productCategory.toLowerCase() : '';

                    // Check if product name or category contains the search term
                    if (productText.includes(searchTerm) || categoryText.includes(searchTerm)) {
                        card.style.display = '';
                        visibleCount++;
                    } else {
                        card.style.display = 'none';
                    }
                }
            });

            // Show/hide no results message
            if (visibleCount === 0) {
                productGrid.style.display = 'none';
                noResultsMessage.style.display = 'block';
            } else {
                productGrid.style.display = '';
                noResultsMessage.style.display = 'none';
            }
        }

        /**
         * Debounce function to limit how often filter runs
         * @param {Function} func - Function to debounce
         * @param {number} wait - Wait time in milliseconds
         */
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Add event listener with debouncing for better performance
        const debouncedFilter = debounce(function (e) {
            filterProducts(e.target.value);
        }, 150);

        searchInput.addEventListener('input', debouncedFilter);

        // Add visual feedback when search input is focused
        searchInput.addEventListener('focus', function () {
            this.parentElement.classList.add('search-box-focused');
        });

        searchInput.addEventListener('blur', function () {
            this.parentElement.classList.remove('search-box-focused');
        });

        // Clear search on escape key
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                this.value = '';
                filterProducts('');
                this.blur();
            }
        });
    });
})();
