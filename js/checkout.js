// Checkout Logic extracted from main.js

function loadCheckoutSummary() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let container = document.getElementById("order-items");

    if (!container) return;

    if (cart.length === 0) {
        window.location.href = "cart.html";
        return;
    }

    let total = 0;
    let html = "";

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const safeName = escapeHtml(item.name);
        const safeSize = escapeHtml(item.size || '');
        const sizeText = safeSize ? ` (${safeSize})` : '';

        html += `
      <div class="order-item">
        <span>${safeName}${sizeText} x${item.quantity}</span>
        <span>₹${itemTotal.toLocaleString()}</span>
      </div>
    `;
    });

    // Fetch dynamic shipping cost
    fetch('/api/settings')
        .then(res => res.json())
        .then(response => {
            let shipping = 99; // Default fallback
            if (response.status === 'success' && response.data.shipping_cost) {
                shipping = parseFloat(response.data.shipping_cost);
            }

            const finalTotal = total + shipping;

            // Append shipping and total
            html += `
            <div class="order-item">
            <span>Shipping</span>
            <span>₹${shipping}</span>
            </div>
        `;

            container.innerHTML = html;
            document.getElementById("order-total").textContent = `₹${finalTotal.toLocaleString()}`;
        })
        .catch(err => {
            console.error('Failed to load settings:', err);
            // Fallback render
            const shipping = 99;
            const finalTotal = total + shipping;
            html += `
            <div class="order-item">
            <span>Shipping</span>
            <span>₹${shipping}</span>
            </div>
        `;
            container.innerHTML = html;
            document.getElementById("order-total").textContent = `₹${finalTotal.toLocaleString()}`;
        });
}

function handleCheckout(event) {
    event.preventDefault();

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    // Get form data
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value;
    const city = document.getElementById("city").value;
    const state = document.getElementById("state").value;
    const zipCode = document.getElementById("zipCode").value;
    const country = document.getElementById("country")?.value || "India";

    // Calculate total (Client side estimation only)
    // Actual total is calculated on backend
    const itemsTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    // Build order payload
    const orderPayload = {
        customerInfo: {
            name: `${firstName} ${lastName}`.trim(),
            email: email,
            phone: phone
        },
        items: cart.map(item => ({
            product_id: item.productId || item.id, // FIX: Pass ID to backend
            name: item.name || item.title || 'Product',
            price: Number(item.price),
            quantity: item.quantity || 1,
            size: item.size || '',
            color: item.color || '',
            image: item.image || ''
        })),
        shippingAddress: {
            street: address,
            city: city,
            state: state,
            pincode: zipCode,
            country: country
        },
        // We don't send totalAmount anymore ideally, or backend ignores it.
        // Keeping it for now if backend expects it, but backend recalculates.
        totalAmount: itemsTotal,
        paymentMethod: 'cod'
    };

    // Disable submit button
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Placing Order...';
    }

    // POST order
    const apiBase = window.location.origin;
    fetch(`${apiBase}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                localStorage.removeItem("cart");
                if (typeof updateCartCount === 'function') updateCartCount();
                window.location.href = "success.html";
            } else {
                alert("Order failed: " + (data.message || "Please try again."));
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Place Order';
                }
            }
        })
        .catch(error => {
            console.error('Checkout error:', error);
            alert("Something went wrong. Please try again.");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Place Order';
            }
        });
}

// Attach event listener if on checkout page
if (document.getElementById('checkout-form')) {
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
}

// Initial load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCheckoutSummary);
} else {
    loadCheckoutSummary();
}
