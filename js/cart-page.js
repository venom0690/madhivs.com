const cartItemsDiv = document.getElementById("cartItems");
const cartSubtotalDiv = document.getElementById("cartSubtotal");
const cartTotalDiv = document.getElementById("cartTotal");
const cartSummarySection = document.getElementById("cartSummarySection");

let cart = getCart();

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

function renderCart() {
    cartItemsDiv.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = `
            <div class="cart-empty">
                <div class="empty-state-icon">🛒</div>
                <h2 class="empty-state-title">Your cart is empty</h2>
                <p class="empty-state-message">Start shopping to add items to your cart!</p>
                <a href="index.html" class="btn btn-primary" style="display: inline-block; text-decoration: none; margin-top: 1rem;">Continue Shopping</a>
            </div>
        `;
        cartSummarySection.style.display = "none";
        return;
    }

    cartSummarySection.style.display = "block";

    cart.forEach((item, index) => {
        total += item.price * item.quantity;

        const safeName = escapeHtml(item.name);
        // Size and quantity are likely safe if enforced elsewhere, but escaping size is good practice
        const safeSize = escapeHtml(item.size);
        const safeImage = escapeHtml(item.image);

        const itemDiv = document.createElement("div");
        itemDiv.className = "cart-item";
        itemDiv.innerHTML = `
            <img src="${safeImage}" alt="${safeName}">
            <div class="cart-item-details">
                <h3>${safeName}</h3>
                <p>Size: <strong>${safeSize}</strong></p>
                <p class="cart-item-price">₹${item.price.toLocaleString('en-IN')} × ${item.quantity}</p>
            </div>
            <div class="cart-item-actions">
                <div class="quantity-controls">
                    <button onclick="changeQty(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQty(${index}, 1)">+</button>
                </div>
                <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
            </div>
        `;
        cartItemsDiv.appendChild(itemDiv);
    });

    cartSubtotalDiv.innerText = `₹${total.toLocaleString('en-IN')}`;
    cartTotalDiv.innerText = `₹${total.toLocaleString('en-IN')}`;
}

function changeQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    saveCart(cart);
    renderCart();
}

function removeItem(index) {
    if (confirm("Remove this item from cart?")) {
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
    }
}

renderCart();
