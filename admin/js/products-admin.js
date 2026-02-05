/**
 * Products Management Logic
 */

// Auth guard
authService.requireAuth();

// Load user info
const user = authService.getCurrentUser();
if (user) {
    document.getElementById('userName').textContent = user.email.split('@')[0];
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', () => {
    authService.logout();
});

// Modal elements
const modal = document.getElementById('productModal');
const modalTitle = document.getElementById('modalTitle');
const productForm = document.getElementById('productForm');
const formError = document.getElementById('formError');

// Form inputs
const productIdInput = document.getElementById('productId');
const productNameInput = document.getElementById('productName');
const productPriceInput = document.getElementById('productPrice');
const productCategoryInput = document.getElementById('productCategory');
const productStockInput = document.getElementById('productStock');
const productDescriptionInput = document.getElementById('productDescription');
const primaryImageUrlInput = document.getElementById('primaryImageUrl');
const primaryImageFileInput = document.getElementById('primaryImageFile');
const primaryImagePreview = document.getElementById('primaryImagePreview');
const subImagesPreview = document.getElementById('subImagesPreview');

// Flags
const isTrendingInput = document.getElementById('isTrending');
const isPopularInput = document.getElementById('isPopular');
const isMenCollectionInput = document.getElementById('isMenCollection');
const isWomenCollectionInput = document.getElementById('isWomenCollection');

// Modal controls
document.getElementById('addProductBtn').addEventListener('click', openAddModal);
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('saveBtn').addEventListener('click', saveProduct);
document.getElementById('addSubImageBtn').addEventListener('click', addSubImageInput);

// Close modal on outside click
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Image preview handlers
primaryImageUrlInput.addEventListener('input', updatePrimaryImagePreview);
primaryImageFileInput.addEventListener('change', handlePrimaryImageFile);

// Load categories into dropdown
function loadCategoryDropdown() {
    const categories = dataService.getCategories();
    const select = productCategoryInput;

    select.innerHTML = '<option value="">Select category</option>';

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = `${category.name} (${category.type})`;
        select.appendChild(option);
    });
}

// Open add modal
function openAddModal() {
    modalTitle.textContent = 'Add Product';
    productForm.reset();
    productIdInput.value = '';
    formError.classList.remove('show');
    formError.textContent = '';
    primaryImagePreview.innerHTML = '';
    subImagesPreview.innerHTML = '';
    loadCategoryDropdown();
    modal.classList.add('show');
}

// Open edit modal
function openEditModal(product) {
    modalTitle.textContent = 'Edit Product';
    productIdInput.value = product.id;
    productNameInput.value = product.name;
    productPriceInput.value = product.price;
    productCategoryInput.value = product.category;
    productStockInput.value = product.stock;
    productDescriptionInput.value = product.description;

    // Set sizes
    document.querySelectorAll('input[name="size"]').forEach(checkbox => {
        checkbox.checked = product.sizes.includes(checkbox.value);
    });

    // Set flags
    isTrendingInput.checked = product.isTrending;
    isPopularInput.checked = product.isPopular;
    isMenCollectionInput.checked = product.isMenCollection;
    isWomenCollectionInput.checked = product.isWomenCollection;

    // Set primary image
    primaryImageUrlInput.value = product.primaryImage;
    updatePrimaryImagePreview();

    // Set sub images
    const container = document.getElementById('subImagesContainer');
    container.innerHTML = '';
    product.subImages.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'sub-image-input';
        div.style.marginBottom = '0.75rem';
        div.innerHTML = `
            <input 
                type="text" 
                class="form-input sub-image-url" 
                placeholder="Sub image ${index + 1} URL"
                value="${img}"
                style="margin-bottom: 0.25rem;"
            >
            <input 
                type="file" 
                class="form-input sub-image-file" 
                accept="image/*"
            >
        `;
        container.appendChild(div);
    });
    updateSubImagesPreview();

    formError.classList.remove('show');
    formError.textContent = '';
    loadCategoryDropdown();
    modal.classList.add('show');
}

// Close modal
function closeModal() {
    modal.classList.remove('show');
    productForm.reset();
}

// Add sub image input
function addSubImageInput() {
    const container = document.getElementById('subImagesContainer');
    const count = container.querySelectorAll('.sub-image-input').length + 1;

    const div = document.createElement('div');
    div.className = 'sub-image-input';
    div.style.marginBottom = '0.75rem';
    div.innerHTML = `
        <input 
            type="text" 
            class="form-input sub-image-url" 
            placeholder="Sub image ${count} URL"
            style="margin-bottom: 0.25rem;"
        >
        <input 
            type="file" 
            class="form-input sub-image-file" 
            accept="image/*"
        >
    `;
    container.appendChild(div);
}

// Update primary image preview
function updatePrimaryImagePreview() {
    const url = primaryImageUrlInput.value.trim();
    if (url) {
        primaryImagePreview.innerHTML = `
            <div class="preview-item">
                <img src="${url}" alt="Primary Image">
            </div>
        `;
    } else {
        primaryImagePreview.innerHTML = '';
    }
}

// Handle primary image file upload
function handlePrimaryImageFile(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            primaryImageUrlInput.value = event.target.result;
            updatePrimaryImagePreview();
        };
        reader.readAsDataURL(file);
    }
}

// Update sub images preview
function updateSubImagesPreview() {
    const urlInputs = document.querySelectorAll('.sub-image-url');
    const urls = Array.from(urlInputs)
        .map(input => input.value.trim())
        .filter(url => url !== '');

    if (urls.length > 0) {
        subImagesPreview.innerHTML = urls.map(url => `
            <div class="preview-item">
                <img src="${url}" alt="Sub Image">
            </div>
        `).join('');
    } else {
        subImagesPreview.innerHTML = '';
    }
}

// Handle sub image file uploads
document.addEventListener('change', function (e) {
    if (e.target.classList.contains('sub-image-file')) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            const urlInput = e.target.previousElementSibling;
            reader.onload = function (event) {
                urlInput.value = event.target.result;
                updateSubImagesPreview();
            };
            reader.readAsDataURL(file);
        }
    }
});

// Listen for sub image URL changes
document.addEventListener('input', function (e) {
    if (e.target.classList.contains('sub-image-url')) {
        updateSubImagesPreview();
    }
});

// Save product
async function saveProduct() {
    const productId = productIdInput.value;
    const productName = productNameInput.value.trim();
    const productPrice = parseFloat(productPriceInput.value);
    const productCategory = productCategoryInput.value;
    const productStock = parseInt(productStockInput.value);
    const productDescription = productDescriptionInput.value.trim();

    // Get selected sizes
    const sizes = Array.from(document.querySelectorAll('input[name="size"]:checked'))
        .map(cb => cb.value);

    // Get primary image
    const primaryImage = primaryImageUrlInput.value.trim();

    // Get sub images
    const subImageUrls = Array.from(document.querySelectorAll('.sub-image-url'))
        .map(input => input.value.trim())
        .filter(url => url !== '');

    // Validate
    if (!productName) {
        showError('Product name is required');
        return;
    }

    if (!productPrice || productPrice <= 0) {
        showError('Valid price is required');
        return;
    }

    if (!productCategory) {
        showError('Category is required');
        return;
    }

    if (sizes.length === 0) {
        showError('At least one size must be selected');
        return;
    }

    if (!primaryImage) {
        showError('Primary image is required');
        return;
    }

    if (subImageUrls.length < 3) {
        showError('At least 3 sub images are required');
        return;
    }

    try {
        const productData = {
            name: productName,
            price: productPrice,
            category: productCategory,
            stock: productStock,
            description: productDescription,
            sizes: sizes,
            primaryImage: primaryImage,
            subImages: subImageUrls,
            isTrending: isTrendingInput.checked,
            isPopular: isPopularInput.checked,
            isMenCollection: isMenCollectionInput.checked,
            isWomenCollection: isWomenCollectionInput.checked
        };

        if (productId) {
            // Update existing product
            dataService.updateProduct(productId, productData);
        } else {
            // Create new product
            dataService.createProduct(productData);
        }

        closeModal();
        loadProducts();
    } catch (error) {
        showError(error.message);
    }
}

// Show error message
function showError(message) {
    formError.textContent = message;
    formError.classList.add('show');
}

// Delete product
function deleteProduct(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        dataService.deleteProduct(id);
        loadProducts();
    } catch (error) {
        alert(error.message);
    }
}

// Load products table
function loadProducts() {
    const products = dataService.getProducts();
    const categories = dataService.getCategories();
    const container = document.getElementById('productsTableContainer');

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <div class="empty-state-text">No products yet</div>
                <button class="btn btn-primary mt-1" onclick="openAddModal()">Add Your First Product</button>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Price</th>
                        <th>Category</th>
                        <th>Stock</th>
                        <th>Flags</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => {
        const category = categories.find(c => c.id === product.category);
        const categoryName = category ? category.name : 'Unknown';

        return `
                            <tr>
                                <td>
                                    <img src="${product.primaryImage}" alt="${product.name}" 
                                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                                </td>
                                <td><strong>${product.name}</strong></td>
                                <td>₹${product.price.toLocaleString()}</td>
                                <td>${categoryName}</td>
                                <td>${product.stock}</td>
                                <td>
                                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                        ${product.isTrending ? '<span class="badge badge-warning">Trending</span>' : ''}
                                        ${product.isPopular ? '<span class="badge badge-success">Popular</span>' : ''}
                                        ${product.isMenCollection ? '<span class="badge badge-primary">Men</span>' : ''}
                                        ${product.isWomenCollection ? '<span class="badge badge-primary">Women</span>' : ''}
                                    </div>
                                </td>
                                <td>
                                    <div class="table-actions">
                                        <button class="btn btn-secondary btn-sm" onclick='editProduct(${JSON.stringify(product).replace(/'/g, "&apos;")})'>
                                            Edit
                                        </button>
                                        <button class="btn btn-danger btn-sm" onclick='deleteProduct("${product.id}", "${product.name}")'>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = tableHTML;
}

// Make functions globally accessible
window.openAddModal = openAddModal;
window.editProduct = openEditModal;
window.deleteProduct = deleteProduct;

// Initialize
loadCategoryDropdown();
loadProducts();
