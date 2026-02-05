// Get cart from localStorage
function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// Add item to cart
function addToCart(product) {
    let cart = getCart();

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
    console.log(cart);
}
