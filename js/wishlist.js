// Wishlist Management Module
// Handles adding, removing, and displaying wishlist items using localStorage

const WishlistManager = {
    STORAGE_KEY: 'maadhivs_wishlist',

    // Get all wishlist items from localStorage
    getWishlist() {
        const wishlist = localStorage.getItem(this.STORAGE_KEY);
        return wishlist ? JSON.parse(wishlist) : [];
    },

    // Save wishlist to localStorage
    saveWishlist(wishlist) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(wishlist));
    },

    // Check if product is in wishlist
    isInWishlist(productName) {
        const wishlist = this.getWishlist();
        return wishlist.some(item => item.name === productName);
    },

    // Add product to wishlist
    addToWishlist(product) {
        const wishlist = this.getWishlist();

        // Check if already exists
        if (this.isInWishlist(product.name)) {
            return false;
        }

        wishlist.push(product);
        this.saveWishlist(wishlist);
        return true;
    },

    // Remove product from wishlist
    removeFromWishlist(productName) {
        let wishlist = this.getWishlist();
        wishlist = wishlist.filter(item => item.name !== productName);
        this.saveWishlist(wishlist);
    },

    // Get wishlist count
    getWishlistCount() {
        return this.getWishlist().length;
    },

    // Toggle wishlist item
    toggleWishlist(product) {
        if (this.isInWishlist(product.name)) {
            this.removeFromWishlist(product.name);
            return false; // Removed
        } else {
            this.addToWishlist(product);
            return true; // Added
        }
    }
};

// Initialize wishlist heart icons when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Update all heart icons based on wishlist state
    updateAllHeartIcons();

    // Add click event listeners to all wishlist hearts
    const heartButtons = document.querySelectorAll('.wishlist-heart');
    heartButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // Get product data from attributes
            const productData = {
                name: this.dataset.productName,
                price: this.dataset.productPrice,
                image: this.dataset.productImage,
                link: this.dataset.productLink
            };

            // Toggle wishlist
            const isAdded = WishlistManager.toggleWishlist(productData);

            // Update heart icon state
            this.classList.toggle('active', isAdded);

            // Show feedback
            if (isAdded) {
                showNotification('Added to wishlist ❤️');
            } else {
                showNotification('Removed from wishlist');
            }

            // Update wishlist count in navbar
            updateWishlistCount();
        });
    });

    // Update wishlist count on page load
    updateWishlistCount();
});

// Update all heart icons based on current wishlist state
function updateAllHeartIcons() {
    const heartButtons = document.querySelectorAll('.wishlist-heart');
    heartButtons.forEach(button => {
        const productName = button.dataset.productName;
        if (WishlistManager.isInWishlist(productName)) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Update wishlist count badge in navbar
function updateWishlistCount() {
    const count = WishlistManager.getWishlistCount();
    const countBadge = document.querySelector('.wishlist-count');

    if (countBadge) {
        if (count > 0) {
            countBadge.textContent = count;
            countBadge.style.display = 'flex';
        } else {
            countBadge.style.display = 'none';
        }
    }
}

// Show notification message
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'wishlist-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Hide and remove after 2 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}
