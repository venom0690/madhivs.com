const cartItemsDiv = document.getElementById("cartItems");
const cartSubtotalDiv = document.getElementById("cartSubtotal");
const cartTotalDiv = document.getElementById("cartTotal");
const cartSummarySection = document.getElementById("cartSummarySection");

let cart = getCart();

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

        const itemDiv = document.createElement("div");
        itemDiv.className = "cart-item";
        itemDiv.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p>Size: <strong>${item.size}</strong></p>
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
