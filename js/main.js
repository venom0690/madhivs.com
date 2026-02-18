// Cart utility: getSelectedSize (used by addToCart in cart.js)
function getSelectedSize(productId) {
  const sizeBtns = document.querySelectorAll(`[data-product-id="${productId}"] .size-btn.selected`);
  if (sizeBtns.length > 0) {
    return sizeBtns[0].textContent.trim();
  }
  return null;
}

// NOTE: addToCart is defined in cart.js (the canonical version)
// It accepts both positional params and object params.

function removeFromCart(itemId) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart = cart.filter(item => item.id !== itemId);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  loadCart();
}

function updateQuantity(itemId, change) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = cart.find(item => item.id === itemId);

  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
    updateCartCount();
  }
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

function loadCart() {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let container = document.getElementById("cart-items");

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 01.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
        </svg>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <button class="btn" onclick="window.location.href='shop.html'">Start Shopping</button>
      </div>
    `;
    document.getElementById("cart-summary").style.display = "none";
    return;
  }

  let total = 0;
  let html = "";

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const safeName = escapeHtml(item.name);
    const safeCategory = escapeHtml(item.category || '');
    const safeSize = escapeHtml(item.size || '');
    const safeId = escapeHtml(item.id);
    const safeImage = escapeHtml(item.image || 'https://via.placeholder.com/120');

    html += `
      <div class="cart-item">
        <img src="${safeImage}" alt="${safeName}">
        <div class="cart-item-info">
          <h3>${safeName}</h3>
          <div class="item-details">
            ${safeCategory ? `<span><strong>Category:</strong> ${safeCategory}</span>` : ''}
            ${safeSize ? `<span><strong>Size:</strong> ${safeSize}</span>` : ''}
          </div>
          <p>₹${item.price.toLocaleString()}</p>
        </div>
        <div class="quantity-control">
          <button class="quantity-btn" onclick="updateQuantity('${safeId}', -1)">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="quantity-btn" onclick="updateQuantity('${safeId}', 1)">+</button>
        </div>
        <div class="cart-item-actions">
          <p style="font-size: 20px; font-weight: 700; color: #667eea; margin-bottom: 10px;">₹${itemTotal.toLocaleString()}</p>
          <button class="btn btn-secondary" onclick="removeFromCart('${safeId}')">Remove</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  const subtotal = total;
  const shipping = 99;
  const finalTotal = subtotal + shipping;

  document.getElementById("subtotal").textContent = `₹${subtotal.toLocaleString()}`;
  document.getElementById("total").textContent = `₹${finalTotal.toLocaleString()}`;
  document.getElementById("cart-summary").style.display = "block";
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const countElement = document.getElementById("cart-count");
  if (countElement) {
    countElement.textContent = totalItems;
  }
}

// Wishlist Functions
function toggleWishlist(name, price, image, category = '') {
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  const existingIndex = wishlist.findIndex(item => item.name === name);

  if (existingIndex > -1) {
    wishlist.splice(existingIndex, 1);
    showNotification(`${name} removed from wishlist`);
  } else {
    wishlist.push({ name, price, image, category });
    showNotification(`${name} added to wishlist`);
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  updateWishlistCount();
  updateWishlistButtons();

  // Reload wishlist page if on it
  if (document.getElementById("wishlist-items")) {
    loadWishlist();
  }
}

function isInWishlist(name) {
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  return wishlist.some(item => item.name === name);
}

function updateWishlistButtons() {
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    const onclick = btn.getAttribute('onclick');
    if (onclick) {
      const match = onclick.match(/toggleWishlist\('([^']+)'/);
      if (match) {
        const itemName = match[1];
        if (isInWishlist(itemName)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    }
  });
}

function loadWishlist() {
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  let container = document.getElementById("wishlist-items");

  if (!container) return;

  if (wishlist.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
        </svg>
        <h3>Your wishlist is empty</h3>
        <p>Start adding items you love to your wishlist!</p>
        <button class="btn" onclick="window.location.href='shop.html'">Start Shopping</button>
      </div>
    `;
    return;
  }

  let html = "";

  wishlist.forEach(item => {
    const safeName = escapeHtml(item.name);
    const safeNameForJs = item.name.replace(/'/g, "\\'");
    const safeCategory = escapeHtml(item.category || '');
    const safeImage = escapeHtml(item.image || 'https://via.placeholder.com/120');

    html += `
      <div class="wishlist-item">
        <img src="${safeImage}" alt="${safeName}">
        <div class="wishlist-item-info">
          <h3>${safeName}</h3>
          <div class="item-details">
            ${safeCategory ? `<span><strong>Category:</strong> ${safeCategory}</span>` : ''}
          </div>
          <p>₹${item.price.toLocaleString()}</p>
        </div>
        <div class="wishlist-item-actions">
          <button class="btn" onclick="window.location.href='shop.html'">Select Size & Add to Cart</button>
          <button class="btn btn-secondary" onclick="toggleWishlist('${safeNameForJs}', ${item.price}, '${safeImage}', '${safeCategory}')">Remove</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function updateWishlistCount() {
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  const countElement = document.getElementById("wishlist-count");
  if (countElement) {
    countElement.textContent = wishlist.length;
  }
}

// Checkout Functions
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

  // Calculate total
  const shipping = 99;
  const itemsTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const totalAmount = itemsTotal + shipping;

  // Build order payload matching backend orderValidator schema
  const orderPayload = {
    customerInfo: {
      name: `${firstName} ${lastName}`.trim(),
      email: email,
      phone: phone
    },
    items: cart.map(item => ({
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
      pincode: zipCode, // Backend expects 'pincode', form has 'zipCode'
      country: country
    },
    totalAmount: totalAmount,
    paymentMethod: 'cod'
  };

  // Disable submit button to prevent double-clicks
  const submitBtn = event.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Placing Order...';
  }

  // POST order to backend API
  const apiBase = window.location.origin;
  fetch(`${apiBase}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        // Clear cart
        localStorage.removeItem("cart");
        updateCartCount();
        // Redirect to success page
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

// Filter Functions
function filterCategory(cat) {
  applyFilters();
}

function filterSize(size) {
  applyFilters();
}

function filterPrice(range) {
  applyFilters();
}

function applyFilters() {
  const categoryFilter = document.querySelector('select[onchange*="filterCategory"]')?.value || 'all';
  const sizeFilter = document.querySelector('select[onchange*="filterSize"]')?.value || 'all';
  const priceFilter = document.querySelector('select[onchange*="filterPrice"]')?.value || 'all';

  document.querySelectorAll(".card").forEach(card => {
    // Category filter
    const cardCategory = card.getAttribute('data-category');
    let showCategory = categoryFilter === "all" || cardCategory === categoryFilter || card.classList.contains(categoryFilter);

    // Size filter
    let showSize = true;
    if (sizeFilter !== 'all') {
      const sizeBtns = card.querySelectorAll('.size-btn');
      const availableSizes = Array.from(sizeBtns).map(btn => btn.textContent.trim());
      showSize = availableSizes.includes(sizeFilter);
    }

    // Price filter
    let showPrice = true;
    if (priceFilter !== 'all') {
      const price = parseInt(card.getAttribute('data-price')) || 0;
      if (priceFilter === "0-1000") {
        showPrice = price < 1000;
      } else if (priceFilter === "1000-2000") {
        showPrice = price >= 1000 && price <= 2000;
      } else if (priceFilter === "2000-3000") {
        showPrice = price > 2000 && price <= 3000;
      } else if (priceFilter === "3000+") {
        showPrice = price > 3000;
      }
    }

    card.style.display = (showCategory && showSize && showPrice) ? "block" : "none";
  });
}

// Size Selection Functions
function selectSize(productId, size) {
  const sizeBtns = document.querySelectorAll(`[data-product-id="${productId}"] .size-btn`);
  sizeBtns.forEach(btn => {
    if (btn.textContent.trim() === size) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

// Navigate to product page
function viewProduct(productId) {
  window.location.href = `product.html?id=${productId}`;
}

// Notification Function
function showNotification(message) {
  // Create notification element
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: linear-gradient(135deg, #ff6600 0%, #ff8533 100%);
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Mobile Menu Toggle
function initMobileMenu() {
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const nav = document.getElementById('main-nav');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      menuToggle.classList.toggle('active');
      nav.classList.toggle('active');
    });

    // Handle categories dropdown on mobile
    const categoriesDropdown = nav.querySelector('.categories-dropdown');
    if (categoriesDropdown) {
      const categoriesLink = categoriesDropdown.querySelector('> a');
      if (categoriesLink) {
        categoriesLink.addEventListener('click', function (e) {
          // Only prevent default on mobile
          if (window.innerWidth <= 768) {
            e.preventDefault();
            categoriesDropdown.classList.toggle('active');
          }
        });
      }
    }

    // Close menu when clicking on a link (except categories dropdown)
    const navLinks = nav.querySelectorAll('a:not(.categories-dropdown > a)');
    navLinks.forEach(link => {
      link.addEventListener('click', function () {
        menuToggle.classList.remove('active');
        nav.classList.remove('active');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (event) {
      const isClickInsideNav = nav.contains(event.target);
      const isClickOnToggle = menuToggle.contains(event.target);

      if (!isClickInsideNav && !isClickOnToggle && nav.classList.contains('active')) {
        menuToggle.classList.remove('active');
        nav.classList.remove('active');
      }
    });
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    updateCartCount();
    updateWishlistCount();
    updateWishlistButtons();
    initMobileMenu();
  });
} else {
  updateCartCount();
  updateWishlistCount();
  updateWishlistButtons();
  initMobileMenu();
}
