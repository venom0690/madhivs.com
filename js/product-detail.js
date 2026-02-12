// Product Detail Page Functionality
document.addEventListener('DOMContentLoaded', async function () {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id'); // Get ID from URL if available
    const productName = urlParams.get('name') || 'Product Name';
    const productPrice = urlParams.get('price') || '0';
    const productImage = urlParams.get('image') || 'https://via.placeholder.com/600';

    // Helper: only append query params to external URLs
    function safeImageUrl(src, params) {
        if (!src) return src;
        if (src.startsWith('http://') || src.startsWith('https://')) {
            return src + (params || '');
        }
        return src;
    }

    // Try to find product in Admin Data to get dynamic attributes
    let productData = null;
    if (typeof AdminDataBridge !== 'undefined' && await AdminDataBridge.hasData()) {
        if (productId) {
            // Prefer finding by ID
            const rawProduct = await AdminDataBridge.getProductById(productId);
            if (rawProduct) {
                productData = AdminDataBridge.transformProduct(rawProduct);
            }
        }

        // Fallback to name search if ID didn't work or wasn't provided
        if (!productData) {
            const products = await AdminDataBridge.getWebsiteProducts();
            productData = products.find(p => p.name === productName);
        }
    }

    // Set product information
    document.getElementById('productName').textContent = productData ? productData.name : productName;
    document.getElementById('productPrice').textContent = productData ? productData.priceFormatted : `₹${parseInt(productPrice).toLocaleString('en-IN')}`;

    // Update Description
    if (productData && productData.description) {
        const descEl = document.getElementById('productDescription');
        if (descEl) descEl.textContent = productData.description;
    }

    // Set Category / Sub-category info
    const categoryElement = document.getElementById('productCategory');
    if (categoryElement) {
        if (productData) {
            let catText = productData.categoryName || productData.category;
            // Capitalize first letter if needed
            if (catText) catText = catText.charAt(0).toUpperCase() + catText.slice(1);

            if (productData.subCategory) {
                catText += ` / ${productData.subCategory}`;
            }
            categoryElement.textContent = catText;
        } else {
            // Hide if no data
            categoryElement.style.display = 'none';
        }
    }

    // Create 4 different view variants of the image
    const thumbnails = document.querySelectorAll('.product-detail-thumbnail');
    const mainImage = document.getElementById('productMainImage');

    // Use image from productData if available, otherwise URL param
    const displayImage = productData ? productData.image : productImage;

    // Set main image
    // Check if image is base64 or relative url vs external url
    const isDataUrl = displayImage.startsWith('data:') || displayImage.startsWith('blob:');
    mainImage.src = isDataUrl ? displayImage : safeImageUrl(displayImage, '?w=800&q=80');

    // Set thumbnails
    if (productData && productData.subImages && productData.subImages.length > 0) {
        // Use uploaded sub-images
        thumbnails.forEach((thumbnail, index) => {
            // Index 0: Main Image
            // Index 1+: Sub Images
            let thumbSrc = '';

            if (index === 0) {
                thumbSrc = displayImage;
            } else if (index - 1 < productData.subImages.length) {
                thumbSrc = productData.subImages[index - 1];
            }

            if (thumbSrc) {
                const isThumbDataUrl = thumbSrc.startsWith('data:') || thumbSrc.startsWith('blob:');
                thumbnail.src = isThumbDataUrl ? thumbSrc : safeImageUrl(thumbSrc, '?w=200&q=80');
                thumbnail.style.display = 'block';
            } else {
                thumbnail.style.display = 'none';
            }
        });
    } else {
        // Fallback: Generate variants
        thumbnails[0].src = isDataUrl ? displayImage : safeImageUrl(displayImage, '?w=200&q=80');
        thumbnails[1].src = isDataUrl ? displayImage : safeImageUrl(displayImage, '?w=200&q=80&sat=-20');
        thumbnails[2].src = isDataUrl ? displayImage : safeImageUrl(displayImage, '?w=200&q=80&brightness=10');
        thumbnails[3].src = isDataUrl ? displayImage : safeImageUrl(displayImage, '?w=200&q=80&contrast=10');

        thumbnails.forEach(t => t.style.display = 'block');
    }

    // Thumbnail click handlers
    thumbnails.forEach((thumbnail) => {
        thumbnail.addEventListener('click', function () {
            // Remove active class from all thumbnails
            thumbnails.forEach(t => t.classList.remove('active'));

            // Add active class to clicked thumbnail
            this.classList.add('active');

            // Update main image with fade effect
            mainImage.style.opacity = '0.5';
            setTimeout(() => {
                let newSrc = this.src;
                // If it has w=200, replace with w=800 for better quality
                if (newSrc.includes('w=200')) {
                    newSrc = newSrc.replace('w=200', 'w=800');
                }
                mainImage.src = newSrc;
                mainImage.style.opacity = '1';
            }, 150);
        });
    });

    // Size selector
    const sizeSelectorContainer = document.getElementById('sizeSelectorContainer');
    const sizeOptionsContainer = sizeSelectorContainer.querySelector('.size-options');
    let selectedSize = null;

    if (productData && productData.sizes && productData.sizes.length > 0) {
        // Dynamic sizes from admin
        sizeSelectorContainer.style.display = 'block';
        sizeOptionsContainer.innerHTML = '';
        productData.sizes.forEach((size, index) => {
            const btn = document.createElement('button');
            btn.className = `size-btn ${index === 0 ? 'active' : ''}`;
            btn.textContent = size;
            btn.dataset.size = size;
            btn.onclick = function () {
                sizeOptionsContainer.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                selectedSize = this.dataset.size;
            };
            sizeOptionsContainer.appendChild(btn);
            if (index === 0) selectedSize = size;
        });
    } else if (productData) {
        // Product exists but has no sizes
        sizeSelectorContainer.style.display = 'none';
        selectedSize = 'N/A';
    } else {
        // Fallback for non-admin products (hardcoded)
        selectedSize = 'M';
        const sizeButtons = document.querySelectorAll('.size-btn');
        sizeButtons.forEach(button => {
            button.addEventListener('click', function () {
                sizeButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                selectedSize = this.getAttribute('data-size');
            });
        });
    }

    // Color Palette (must match admin)
    const colorPalette = [
        { name: 'Red', hex: '#FF0000' },
        { name: 'Blue', hex: '#0000FF' },
        { name: 'Green', hex: '#008000' },
        { name: 'Yellow', hex: '#FFFF00' },
        { name: 'Black', hex: '#000000' },
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Pink', hex: '#FFC0CB' },
        { name: 'Purple', hex: '#800080' },
        { name: 'Orange', hex: '#FFA500' },
        { name: 'Grey', hex: '#808080' },
        { name: 'Brown', hex: '#A52A2A' },
        { name: 'Beige', hex: '#F5F5DC' },
        { name: 'Navy', hex: '#000080' },
        { name: 'Maroon', hex: '#800000' },
        { name: 'Gold', hex: '#FFD700' },
        { name: 'Silver', hex: '#C0C0C0' }
    ];

    // Color Selector Logic
    const colorSelectorContainer = document.getElementById('colorSelectorContainer');
    const colorOptionsContainer = document.getElementById('colorOptions');
    let selectedColor = null;

    if (productData && productData.colors && productData.colors.length > 0) {
        colorSelectorContainer.style.display = 'block';
        colorOptionsContainer.innerHTML = '';
        productData.colors.forEach((color, index) => {
            const btn = document.createElement('button');
            const paletteColor = colorPalette.find(c => c.name === color);

            if (paletteColor) {
                // Visual Swatch
                btn.className = `color-btn ${index === 0 ? 'active' : ''}`;
                btn.style.cssText = `
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background-color: ${paletteColor.hex};
                    border: 2px solid ${index === 0 ? '#000' : '#ddd'};
                    margin-right: 8px;
                    cursor: pointer;
                    position: relative;
                `;
                btn.title = color;

                // Checkmark for active state
                if (index === 0) {
                    btn.innerHTML = '<span style="color: ' + (['White', 'Yellow', 'Beige'].includes(color) ? '#000' : '#fff') + '; font-size: 12px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">✓</span>';
                }

                btn.onclick = function () {
                    // Reset all
                    Array.from(colorOptionsContainer.children).forEach(b => {
                        b.style.borderColor = '#ddd';
                        b.innerHTML = '';
                    });

                    // Set active
                    this.style.borderColor = '#000';
                    this.innerHTML = '<span style="color: ' + (['White', 'Yellow', 'Beige'].includes(color) ? '#000' : '#fff') + '; font-size: 12px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">✓</span>';
                    selectedColor = this.dataset.color;
                };
            } else {
                // Text Button Fallback
                btn.className = `size-btn ${index === 0 ? 'active' : ''}`;
                btn.textContent = color;
                btn.onclick = function () {
                    colorOptionsContainer.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    selectedColor = this.dataset.color;
                };
            }

            btn.dataset.color = color;
            colorOptionsContainer.appendChild(btn);
            if (index === 0) selectedColor = color;
        });
    } else {
        colorSelectorContainer.style.display = 'none';
        selectedColor = null;
    }

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
            id: (productData && productData.id) ? productData.id : productName.replace(/\s+/g, '-').toLowerCase(),
            name: productData ? productData.name : productName,
            price: productData ? parseInt(productData.price) : parseInt(productPrice),
            image: productData ? productData.image : productImage,
            size: selectedSize,
            color: selectedColor,
            quantity: quantity
        };

        // Call addToCart from cart.js
        addToCart(product);

        // Show success notification
        let msg = `✨ ${product.name} added to cart!`;
        if (selectedSize && selectedSize !== 'N/A') msg += `\nSize: ${selectedSize}`;
        if (selectedColor) msg += `\nColor: ${selectedColor}`;
        msg += `\nQuantity: ${quantity}`;
        alert(msg);
    });

    // Buy Now button - Go directly to checkout
    document.getElementById('buyNowBtn').addEventListener('click', function () {
        const quantity = parseInt(quantityInput.value);

        // Create product object
        const product = {
            id: (productData && productData.id) ? productData.id : productName.replace(/\s+/g, '-').toLowerCase(),
            name: productData ? productData.name : productName,
            price: productData ? parseInt(productData.price) : parseInt(productPrice),
            image: productData ? productData.image : productImage,
            size: selectedSize,
            color: selectedColor,
            quantity: quantity
        };

        // Add to cart
        addToCart(product);

        // Redirect to checkout
        window.location.href = 'checkout.html';
    });
});
