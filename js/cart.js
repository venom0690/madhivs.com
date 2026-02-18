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

/**
 * Add item to cart
 * Accepts EITHER:
 *   addToCart(product)  — object with {id, name, price, image, size, ...}
 *   addToCart(name, price, image, category, size, productId) — positional params
 */
function addToCart(nameOrProduct, price, image, category, size, productId) {
    let product;

    if (typeof nameOrProduct === 'object' && nameOrProduct !== null) {
        // Object-based call (from product-detail.js)
        product = nameOrProduct;
    } else {
        // Positional-param call (from shop.js)
        product = {
            name: nameOrProduct,
            price: price,
            image: image,
            category: category || '',
            size: size || null,
            productId: productId || null
        };
    }

    // Size is required
    if (!product.size) {
        if (typeof showNotification === 'function') {
            showNotification('Please select a size');
        }
        return;
    }

    // Build consistent cart item shape
    const itemId = product.id || product.productId || `${product.name}-${product.size}`;
    const cartItem = {
        id: itemId,
        productId: product.id || product.productId,
        name: product.name,
        price: Number(product.price),
        image: product.image || '',
        category: product.category || '',
        size: product.size,
        quantity: product.quantity || 1
    };

    let cart = getCart();

    // Dedup by id + size
    const existing = cart.find(item => item.id === cartItem.id && item.size === cartItem.size);

    if (existing) {
        existing.quantity += 1;
        if (typeof showNotification === 'function') {
            showNotification(`${cartItem.name} (Size: ${cartItem.size}) quantity updated!`);
        }
    } else {
        cart.push(cartItem);
        if (typeof showNotification === 'function') {
            showNotification(`${cartItem.name} (Size: ${cartItem.size}) added to cart!`);
        }
    }

    saveCart(cart);
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
}
