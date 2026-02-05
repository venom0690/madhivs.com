// Product Detail Page Functionality
document.addEventListener('DOMContentLoaded', function () {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const productName = urlParams.get('name') || 'Product Name';
    const productPrice = urlParams.get('price') || '0';
    const productImage = urlParams.get('image') || 'https://via.placeholder.com/600';

    // Set product information
    document.getElementById('productName').textContent = productName;
    document.getElementById('productPrice').textContent = `₹${parseInt(productPrice).toLocaleString('en-IN')}`;

    // Create 4 different view variants of the image
    const thumbnails = document.querySelectorAll('.product-detail-thumbnail');
    const mainImage = document.getElementById('productMainImage');

    // Set main image
    mainImage.src = productImage + '?w=800&q=80';

    // Set thumbnails (using different crop/zoom parameters for variety)
    thumbnails[0].src = productImage + '?w=200&q=80';
    thumbnails[1].src = productImage + '?w=200&q=80&sat=-20';
    thumbnails[2].src = productImage + '?w=200&q=80&brightness=10';
    thumbnails[3].src = productImage + '?w=200&q=80&contrast=10';

    // Thumbnail click handlers
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', function () {
            // Remove active class from all thumbnails
            thumbnails.forEach(t => t.classList.remove('active'));

            // Add active class to clicked thumbnail
            this.classList.add('active');

            // Update main image with fade effect
            mainImage.style.opacity = '0.5';
            setTimeout(() => {
                mainImage.src = this.src.replace('w=200', 'w=800');
                mainImage.style.opacity = '1';
            }, 150);
        });
    });

    // Size selector
    const sizeButtons = document.querySelectorAll('.size-btn');
    let selectedSize = 'M';

    sizeButtons.forEach(button => {
        button.addEventListener('click', function () {
            sizeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            selectedSize = this.getAttribute('data-size');
        });
    });

    // Quantity selector
    const quantityInput = document.getElementById('quantityInput');
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');

    decreaseBtn.addEventListener('click', function () {
        let currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    });

    increaseBtn.addEventListener('click', function () {
        let currentValue = parseInt(quantityInput.value);
        if (currentValue < 10) {
            quantityInput.value = currentValue + 1;
        }
    });

    // Add to Cart button - Integrated with cart.js
    document.getElementById('addToCartBtn').addEventListener('click', function () {
        const quantity = parseInt(quantityInput.value);

        // Create product object with dynamic data from URL
        const product = {
            id: productName.replace(/\s+/g, '-').toLowerCase(), // Generate ID from product name
            name: productName,
            price: parseInt(productPrice),
            image: productImage + '?w=200&q=80',
            size: selectedSize,
            quantity: quantity
        };

        // Call addToCart from cart.js
        addToCart(product);

        // Show success notification
        alert(`✨ ${productName} added to cart!\n\nSize: ${selectedSize}\nQuantity: ${quantity}`);
    });

    // Buy Now button - Go directly to checkout
    document.getElementById('buyNowBtn').addEventListener('click', function () {
        const quantity = parseInt(quantityInput.value);

        // Create product object
        const product = {
            id: productName.replace(/\s+/g, '-').toLowerCase(),
            name: productName,
            price: parseInt(productPrice),
            image: productImage + '?w=200&q=80',
            size: selectedSize,
            quantity: quantity
        };

        // Add to cart
        addToCart(product);

        // Redirect to checkout
        window.location.href = 'checkout.html';
    });
});
