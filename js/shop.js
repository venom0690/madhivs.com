/**
 * Shop Page Functionality
 * Loads products dynamically from AdminDataBridge -> products.js
 * Handles filtering and rendering
 */

document.addEventListener('DOMContentLoaded', async function () {
    const productGrid = document.getElementById('shop-products');
    const categorySelect = document.querySelector('select[onchange="filterCategory(this.value)"]');
    const sizeSelect = document.querySelector('select[onchange="filterSize(this.value)"]');
    const priceSelect = document.querySelector('select[onchange="filterPrice(this.value)"]');

    if (!productGrid) return;

    // Remove existing static content (if any remains)
    productGrid.innerHTML = '<div class="loading-spinner">Loading products...</div>';

    // Fetch all products
    let allProducts = [];
    try {
        // Use ProductService (new API based approach)
        if (typeof ProductService !== 'undefined') {
            const products = await ProductService.getProducts();
            allProducts = products;
        } else {
            console.error('ProductService not found. Make sure products.js is loaded.');
            productGrid.innerHTML = '<p>Error loading products.</p>';
            return;
        }
    } catch (error) {
        console.error('Failed to load products:', error);
        productGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
        return;
    }

    // Initial Render
    renderProducts(allProducts);

    // Check URL params for search or category
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    const searchParam = urlParams.get('search');

    if (categoryParam) {
        if (categorySelect) categorySelect.value = categoryParam;
        filterProducts();
    } else if (searchParam) {
        // If there's a search param, we might want to filter by name
        // The current dropdowns don't support "search text", so we apply it manually
        const searchFiltered = allProducts.filter(p =>
            p.name.toLowerCase().includes(searchParam.toLowerCase()) ||
            (p.category && p.category.toLowerCase().includes(searchParam.toLowerCase()))
        );
        renderProducts(searchFiltered);
    }

    // Attach Event Listeners to Selects (overriding inline onchange if necessary, or just working with them)
    // We'll replace the global window functions that inline HTML might use
    window.filterCategory = function (val) { filterProducts(); }
    window.filterSize = function (val) { filterProducts(); }
    window.filterPrice = function (val) { filterProducts(); }


    function filterProducts() {
        const catVal = categorySelect ? categorySelect.value : 'all';
        const sizeVal = sizeSelect ? sizeSelect.value : 'all';
        const priceVal = priceSelect ? priceSelect.value : 'all';

        const filtered = allProducts.filter(product => {
            // Category Filter
            // Match against product.category (slug) or category type/name
            let catMatch = (catVal === 'all');
            if (!catMatch) {
                const prodCat = (product.category || '').toLowerCase();
                const prodType = (product.categoryType || '').toLowerCase();
                const target = catVal.toLowerCase();

                catMatch = prodCat === target || prodType === target ||
                    (product.subCategory && product.subCategory.toLowerCase() === target) ||
                    (product.categoryName && product.categoryName.toLowerCase() === target);

                // Specific checks for "men" / "women" vs specific categories
                if (target === 'men' && (product.isMenCollection || prodType === 'men')) catMatch = true;
                if (target === 'women' && (product.isWomenCollection || prodType === 'women')) catMatch = true;
            }

            // Size Filter
            let sizeMatch = (sizeVal === 'all');
            if (!sizeMatch && product.sizes) {
                // standardized comparison
                sizeMatch = product.sizes.some(s => s.toLowerCase() === sizeVal.toLowerCase());
            }

            // Price Filter
            let priceMatch = (priceVal === 'all');
            if (!priceMatch) {
                const price = Number(product.price);
                if (priceVal === '0-1000') priceMatch = price < 1000;
                else if (priceVal === '1000-2000') priceMatch = price >= 1000 && price <= 2000;
                else if (priceVal === '2000-3000') priceMatch = price > 2000 && price <= 3000;
                else if (priceVal === '3000+') priceMatch = price > 3000;
            }

            return catMatch && sizeMatch && priceMatch;
        });

        renderProducts(filtered);
    }

    function renderProducts(products) {
        if (products.length === 0) {
            productGrid.innerHTML = '<div class="no-products">No products found matching your criteria.</div>';
            return;
        }

        productGrid.innerHTML = '';
        products.forEach(product => {
            const card = createProductCard(product);
            productGrid.appendChild(card);
        });

        // Updates for wishlist/cart counts
        if (typeof updateCartCount === 'function') updateCartCount();
        if (typeof updateWishlistButtons === 'function') updateWishlistButtons();
    }

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

    function createProductCard(product) {
        const card = document.createElement('div');
        // Add classes for filtering hook compatibility if logic relies on classList (though we do data filtering now)
        const safeCategory = escapeHtml(product.category || '');
        const safeCategoryType = escapeHtml(product.categoryType || '');
        card.className = `card ${safeCategory} ${safeCategoryType}`;
        card.setAttribute('data-price', product.price);
        card.setAttribute('data-product-id', product.id);
        card.setAttribute('data-category', safeCategory);

        // Image URL helper
        const imageUrl = product.image || 'https://via.placeholder.com/300';

        // Safe values for display
        const safeName = escapeHtml(product.name);
        // Escape name for onclick/function arguments (requires escaping single quotes specifically for JS string context)
        const safeNameForJs = product.name.replace(/'/g, "\\'");
        const safeCategoryName = escapeHtml(product.categoryName || product.category || 'Collection');
        const priceFormatted = product.priceFormatted || '₹' + product.price;

        // Sizes HTML
        let sizesHtml = '';
        if (product.sizes && product.sizes.length > 0) {
            sizesHtml = `
                <div class="size-selector">
                  <label>Size</label>
                  <div class="size-options">
                    ${product.sizes.map(size =>
                `<button class="size-btn" onclick="event.stopPropagation(); selectSize('${product.id}', '${escapeHtml(size)}')">${escapeHtml(size)}</button>`
            ).join('')}
                  </div>
                </div>
             `;
        }

        card.innerHTML = `
            <button class="wishlist-btn" onclick="event.stopPropagation(); toggleWishlist('${safeNameForJs}', ${product.price}, '${imageUrl}', '${safeCategory}')">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
                </svg>
            </button>
            <img src="${imageUrl}" alt="${safeName}" loading="lazy">
            <div class="card-content">
                <span class="category-badge">${safeCategoryName}</span>
                <h3>${safeName}</h3>
                <p>${priceFormatted}</p>
                ${sizesHtml}
                <div class="card-actions">
                  <button onclick="event.stopPropagation(); addToCart({id: '${product.id}', name: '${safeNameForJs}', price: ${product.price}, image: '${imageUrl}', category: '${safeCategory}'})">Add to Cart</button>
                </div>
            </div>
        `;

        // Click on image/title to view product
        const img = card.querySelector('img');
        const title = card.querySelector('h3');
        if (img) img.onclick = () => viewProduct(product.id);
        if (title) title.onclick = () => viewProduct(product.id);

        return card;
    }
});
