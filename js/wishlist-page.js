// Wishlist Page Functionality
// Handles displaying wishlist items and managing interactions

document.addEventListener('DOMContentLoaded', function () {
    loadAndDisplayWishlist();
    updateWishlistCount();
});

// Load and display all wish list items
function loadAndDisplayWishlist() {
    const wishlist = WishlistManager.getWishlist();
    const wishlistGrid = document.getElementById('wishlistGrid');
    const emptyState = document.getElementById('emptyState');
    const subtitle = document.getElementById('wishlist-subtitle');

    // Clear current content
    wishlistGrid.innerHTML = '';

    // Check if wishlist is empty
    if (wishlist.length === 0) {
        wishlistGrid.style.display = 'none';
        emptyState.style.display = 'block';
        if (subtitle) {
            subtitle.textContent = 'Your saved favorites';
        }
        return;
    }

    // Show grid and hide empty state
    wishlistGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    // Update subtitle with count
    if (subtitle) {
        subtitle.textContent = `${wishlist.length} ${wishlist.length === 1 ? 'item' : 'items'} saved`;
    }

    // Create product cards for each wishlist item
    wishlist.forEach(product => {
        const productCard = createWishlistProductCard(product);
        wishlistGrid.appendChild(productCard);
    });
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

// Create a product card element for wishlist
function createWishlistProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card wishlist-item';

    const safeName = escapeHtml(product.name);
    // For JS data attributes, we might need simple escaping, but dataset handles it well usually. 
    // However, for HTML attributes below, we definitely need escapeHtml.
    card.dataset.productName = safeName;

    const safePrice = escapeHtml(product.price);
    const safeImage = escapeHtml(product.image);
    const safeLink = escapeHtml(product.link);

    card.innerHTML = `
        <div class="product-images">
            <button class="wishlist-remove-btn" 
                    data-product-name="${safeName}"
                    title="Remove from wishlist">
                ✕
            </button>
            <img class="main-image" 
                 src="${safeImage}" 
                 alt="${safeName}">
        </div>
        <div class="product-info">
            <h3 class="product-name">${safeName}</h3>
            <p class="product-price">${safePrice}</p>
            <div class="wishlist-actions">
                <button class="btn btn-primary add-to-cart-btn" 
                        data-product-name="${safeName}"
                        data-product-price="${safePrice}"
                        data-product-image="${safeImage}">
                    Add to Cart
                </button>
                <a href="${safeLink}" class="btn btn-secondary">View Details</a>
            </div>
        </div>
    `;

    // Add event listener for remove button
    const removeBtn = card.querySelector('.wishlist-remove-btn');
    removeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        removeFromWishlist(product.name);
    });

    // Add event listener for add to cart button
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    addToCartBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        addToCartFromWishlist(product);
    });

    return card;
}

// Remove item from wishlist
function removeFromWishlist(productName) {
    WishlistManager.removeFromWishlist(productName);

    // Show notification
    showNotification('Removed from wishlist');

    // Reload the wishlist display
    loadAndDisplayWishlist();

    // Update count in navbar
    updateWishlistCount();
}

// Add item to cart from wishlist
function addToCartFromWishlist(product) {
    // Get existing cart or create new one
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Check if product already in cart
    const existingItem = cart.find(item => item.name === product.name);

    if (existingItem) {
        // Increase quantity if already in cart
        existingItem.quantity = (existingItem.quantity || 1) + 1;
        showNotification('Increased quantity in cart');
    } else {
        // Add new item to cart
        const cartItem = {
            name: product.name,
            price: parseFloat(product.price.replace(/[₹,]/g, '')),
            image: product.image,
            quantity: 1,
            size: 'M' // Default size
        };
        cart.push(cartItem);
        showNotification('Added to cart! 🛒');
    }

    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Update cart count if function exists
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
}

// Additional CSS for wishlist page specific styles
const wishlistStyles = document.createElement('style');
wishlistStyles.textContent = `
    .wishlist-item {
        position: relative;
    }

    .wishlist-remove-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(255, 255, 255, 0.95);
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 20px;
        font-weight: bold;
        color: #666;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .wishlist-remove-btn:hover {
        background: #ff4757;
        color: white;
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4);
    }

    .wishlist-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
        flex-wrap: wrap;
    }

    .wishlist-actions .btn {
        flex: 1;
        min-width: 120px;
        padding: 0.8rem 1.2rem;
        font-size: 0.95rem;
    }

    @media (max-width: 768px) {
        .wishlist-actions {
            flex-direction: column;
        }

        .wishlist-actions .btn {
            width: 100%;
        }
    }

    .wishlist-link.active {
        color: #ff4757;
    }
`;
document.head.appendChild(wishlistStyles);
