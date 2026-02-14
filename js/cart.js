// FIX #5: Safe cart parsing — prevents page crash on corrupted localStorage

// Get cart from localStorage
function getCart() {
    try {
        const cartData = localStorage.getItem("cart");
        if (!cartData) return [];

        const cart = JSON.parse(cartData);

        // Validate cart is array
        if (!Array.isArray(cart)) {
            console.warn('Cart data corrupted, resetting');
            localStorage.removeItem("cart");
            return [];
        }

        return cart;
    } catch (error) {
        console.error('Failed to parse cart:', error);
        localStorage.removeItem("cart");
        return [];
    }
}

// Save cart to localStorage
function saveCart(cart) {
    try {
        localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
        console.error('Failed to save cart:', error);
    }
}

// Add item to cart
function addToCart(product) {
    let cart = getCart();

    // Validate product has required fields
    if (!product || !product.id || !product.price) {
        console.error('Invalid product data');
        return;
    }

    // Ensure quantity
    if (!product.quantity || product.quantity < 1) {
        product.quantity = 1;
    }

    // Check if same product + size exists
    let existing = cart.find(
        item => item.id === product.id && item.size === product.size
    );

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push(product);
    }

    saveCart(cart);
    alert("Product added to cart 🛒");
}
