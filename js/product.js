// Product Data
const products = {
  'prod-1': {
    name: 'Oversized Tee',
    price: 899,
    originalPrice: 1299,
    category: 'Men',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
    images: [
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Comfortable and stylish oversized t-shirt perfect for casual wear. Made from premium cotton blend fabric that feels soft against your skin. Features a relaxed fit with modern design elements.',
    material: '100% Premium Cotton Blend',
    care: 'Machine wash cold, tumble dry low',
    fit: 'Oversized/Relaxed',
    color: 'Black'
  },
  'prod-2': {
    name: 'Denim Jacket',
    price: 2999,
    originalPrice: 3999,
    category: 'Jackets',
    image: 'https://images.unsplash.com/photo-1495121605193-b116b5b09c53',
    images: [
      'https://images.unsplash.com/photo-1495121605193-b116b5b09c53',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5',
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Classic denim jacket with a modern twist. Perfect for layering in any season. Features premium denim fabric with vintage wash finish.',
    material: '100% Cotton Denim',
    care: 'Dry clean recommended',
    fit: 'Regular Fit',
    color: 'Blue Denim'
  },
  'prod-3': {
    name: 'Classic White Shirt',
    price: 1299,
    originalPrice: 1799,
    category: 'Men',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Timeless white shirt that never goes out of style. Perfect for both formal and casual occasions. Crisp, clean design with attention to detail.',
    material: '100% Cotton',
    care: 'Machine wash, iron on medium heat',
    fit: 'Regular Fit',
    color: 'White'
  },
  'prod-4': {
    name: 'Slim Fit Jeans',
    price: 1999,
    originalPrice: 2499,
    category: 'Men',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d'
    ],
    sizes: ['28', '30', '32', '34'],
    description: 'Modern slim fit jeans with stretch comfort. Perfect combination of style and comfort for everyday wear.',
    material: '98% Cotton, 2% Elastane',
    care: 'Machine wash cold, hang dry',
    fit: 'Slim Fit',
    color: 'Dark Blue'
  },
  'prod-5': {
    name: 'Women Jacket',
    price: 2299,
    originalPrice: 2999,
    category: 'Women',
    image: 'https://images.unsplash.com/photo-1520974735194-8f84a1f40f17',
    images: [
      'https://images.unsplash.com/photo-1520974735194-8f84a1f40f17',
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Elegant women\'s jacket with contemporary design. Perfect for transitioning between seasons with style.',
    material: 'Polyester Blend',
    care: 'Machine wash cold',
    fit: 'Regular Fit',
    color: 'Beige'
  },
  'prod-6': {
    name: 'Casual Sneakers',
    price: 3499,
    originalPrice: 4499,
    category: 'Men',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff'
    ],
    sizes: ['7', '8', '9', '10'],
    description: 'Comfortable and stylish casual sneakers perfect for everyday wear. Features cushioned insole and durable outsole.',
    material: 'Canvas Upper, Rubber Sole',
    care: 'Wipe clean with damp cloth',
    fit: 'True to Size',
    color: 'White'
  },
  'prod-7': {
    name: 'Designer Handbag',
    price: 4999,
    originalPrice: 6999,
    category: 'Women',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62'
    ],
    sizes: ['One Size'],
    description: 'Elegant designer handbag with premium materials. Spacious interior with multiple compartments for organization.',
    material: 'Genuine Leather',
    care: 'Clean with leather conditioner',
    fit: 'One Size',
    color: 'Brown'
  },
  'prod-8': {
    name: 'Leather Watch',
    price: 5999,
    originalPrice: 7999,
    category: 'Men',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30'
    ],
    sizes: ['One Size'],
    description: 'Classic leather watch with timeless design. Perfect for both casual and formal occasions.',
    material: 'Genuine Leather Strap, Stainless Steel Case',
    care: 'Avoid water, clean with soft cloth',
    fit: 'Adjustable Strap',
    color: 'Black/Brown'
  },
  'shop-1': {
    name: 'Men Hoodie',
    price: 1499,
    originalPrice: 1999,
    category: 'Men',
    image: 'https://images.unsplash.com/photo-1521334884684-d80222895322',
    images: [
      'https://images.unsplash.com/photo-1521334884684-d80222895322',
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Comfortable hoodie perfect for casual wear. Features soft fleece lining and adjustable drawstring hood.',
    material: '80% Cotton, 20% Polyester',
    care: 'Machine wash cold, tumble dry low',
    fit: 'Regular Fit',
    color: 'Gray'
  },
  'shop-2': {
    name: 'Women Top',
    price: 1199,
    originalPrice: 1599,
    category: 'Women',
    image: 'https://images.unsplash.com/photo-1520974735194-8f84a1f40f17',
    images: [
      'https://images.unsplash.com/photo-1520974735194-8f84a1f40f17'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Stylish women\'s top with modern design. Perfect for both casual and semi-formal occasions.',
    material: '100% Cotton',
    care: 'Machine wash cold',
    fit: 'Regular Fit',
    color: 'White'
  },
  'shop-3': {
    name: 'Men Leather Jacket',
    price: 2999,
    originalPrice: 3999,
    category: 'Jackets',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Premium leather jacket with classic design. Features genuine leather construction with modern styling.',
    material: 'Genuine Leather',
    care: 'Dry clean only',
    fit: 'Regular Fit',
    color: 'Black'
  },
  'shop-4': {
    name: 'Women Hoodie',
    price: 1799,
    originalPrice: 2299,
    category: 'Women',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7',
      'https://images.unsplash.com/photo-1521334884684-d80222895322'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Comfortable women\'s hoodie with flattering fit. Perfect for casual days and lounging.',
    material: '80% Cotton, 20% Polyester',
    care: 'Machine wash cold',
    fit: 'Regular Fit',
    color: 'Pink'
  },
  'shop-5': {
    name: 'Men T-Shirt',
    price: 899,
    originalPrice: 1199,
    category: 'Men',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Classic men\'s t-shirt with comfortable fit. Made from premium cotton for all-day comfort.',
    material: '100% Cotton',
    care: 'Machine wash',
    fit: 'Regular Fit',
    color: 'Navy Blue'
  },
  'shop-6': {
    name: 'Women Denim Jacket',
    price: 2499,
    originalPrice: 3299,
    category: 'Jackets',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3',
    images: [
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Stylish denim jacket for women with modern cut. Perfect for layering and creating versatile looks.',
    material: '100% Cotton Denim',
    care: 'Machine wash cold',
    fit: 'Regular Fit',
    color: 'Light Blue'
  }
};

// Load product detail page
function loadProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  if (!productId || !products[productId]) {
    document.getElementById('product-detail').innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h3>Product not found</h3>
        <p>The product you're looking for doesn't exist.</p>
        <button class="btn" onclick="window.location.href='shop.html'">Back to Shop</button>
      </div>
    `;
    return;
  }
  
  const product = products[productId];
  
  // Set product information
  document.getElementById('product-name').textContent = product.name;
  document.getElementById('product-category').textContent = product.category;
  document.getElementById('product-price').textContent = `₹${product.price.toLocaleString()}`;
  
  if (product.originalPrice && product.originalPrice > product.price) {
    document.getElementById('product-original-price').textContent = `₹${product.originalPrice.toLocaleString()}`;
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    document.getElementById('product-discount').textContent = `${discount}% OFF`;
  } else {
    document.getElementById('product-original-price').style.display = 'none';
    document.getElementById('product-discount').style.display = 'none';
  }
  
  document.getElementById('product-description-text').textContent = product.description;
  document.getElementById('product-material').textContent = product.material;
  document.getElementById('product-care').textContent = product.care;
  document.getElementById('product-fit').textContent = product.fit;
  document.getElementById('product-color').textContent = product.color;
  
  // Set main image
  document.getElementById('product-main-image').src = product.image;
  document.getElementById('product-main-image').alt = product.name;
  
  // Set thumbnail images
  const thumbnailContainer = document.getElementById('thumbnail-images');
  thumbnailContainer.innerHTML = '';
  product.images.forEach((img, index) => {
    const thumbnail = document.createElement('img');
    thumbnail.src = img;
    thumbnail.alt = `${product.name} - Image ${index + 1}`;
    thumbnail.className = index === 0 ? 'active' : '';
    thumbnail.onclick = () => {
      document.getElementById('product-main-image').src = img;
      document.querySelectorAll('.thumbnail-images img').forEach(t => t.classList.remove('active'));
      thumbnail.classList.add('active');
    };
    thumbnailContainer.appendChild(thumbnail);
  });
  
  // Set size options
  const sizeContainer = document.getElementById('product-size-options');
  sizeContainer.innerHTML = '';
  product.sizes.forEach(size => {
    const sizeBtn = document.createElement('button');
    sizeBtn.className = 'size-btn';
    sizeBtn.textContent = size;
    sizeBtn.onclick = () => {
      document.querySelectorAll('#product-size-options .size-btn').forEach(btn => btn.classList.remove('selected'));
      sizeBtn.classList.add('selected');
    };
    sizeContainer.appendChild(sizeBtn);
  });
  
  // Set up add to cart button
  document.getElementById('add-to-cart-btn').onclick = () => {
    const selectedSize = document.querySelector('#product-size-options .size-btn.selected');
    if (!selectedSize) {
      showNotification('Please select a size');
      return;
    }
    addToCart(
      product.name,
      product.price,
      product.image,
      product.category,
      selectedSize.textContent.trim(),
      productId
    );
  };
  
  // Set up wishlist button
  const wishlistBtn = document.getElementById('wishlist-btn-large');
  if (isInWishlist(product.name)) {
    wishlistBtn.classList.add('active');
  }
  
  wishlistBtn.onclick = () => {
    toggleWishlist(product.name, product.price, product.image, product.category);
    wishlistBtn.classList.toggle('active');
  };
}

// Initialize product page
if (document.getElementById('product-detail')) {
  loadProductDetail();
  updateCartCount();
  updateWishlistCount();
}
