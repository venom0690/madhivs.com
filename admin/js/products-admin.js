/**
 * Products Management Logic
 * Fixed version - uploads images to server API
 */

// Auth guard
authService.requireAuth();

// State
const selectedColors = new Set();
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
const productSubCategoryInput = document.getElementById('productSubCategory');
const createCategoryLink = document.getElementById('createCategoryLink');
const createSubCategoryLink = document.getElementById('createSubCategoryLink');
const productStockInput = document.getElementById('productStock');
const productDescriptionInput = document.getElementById('productDescription');
const primaryImageUrlInput = document.getElementById('primaryImageUrl');
const primaryImageFileInput = document.getElementById('primaryImageFile');
const primaryImagePreview = document.getElementById('primaryImagePreview');
const subImagesPreview = document.getElementById('subImagesPreview');

// Variants elements
const hasSizesCheckbox = document.getElementById('hasSizes');
const hasColorsCheckbox = document.getElementById('hasColors');
const sizesSection = document.getElementById('sizesSection');
const colorsSection = document.getElementById('colorsSection');
const productColorsInput = document.getElementById('productColors');
const colorSwatchesContainer = document.getElementById('colorSwatchesContainer');

// Variant Toggles
hasSizesCheckbox.addEventListener('change', () => {
    sizesSection.style.display = hasSizesCheckbox.checked ? 'block' : 'none';
});

hasColorsCheckbox.addEventListener('change', () => {
    colorsSection.style.display = hasColorsCheckbox.checked ? 'block' : 'none';
});

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

// Category/SubCategory Handlers
productCategoryInput.addEventListener('change', function () {
    loadSubCategories(this.value);
});

if (createCategoryLink) {
    createCategoryLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Leave this page to create a new category? Unsaved changes will be lost.')) {
            window.location.href = 'categories.html';
        }
    });
}

if (createSubCategoryLink) {
    createSubCategoryLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const categoryId = productCategoryInput.value;
        if (!categoryId) {
            alert('Please select a category first.');
            return;
        }

        const newSub = prompt('Enter new sub-category name:');
        if (newSub && newSub.trim()) {
            try {
                const category = await dataService.getCategoryById(categoryId);
                if (category) {
                    // Initialize subCategories if missing
                    if (!category.subCategories) category.subCategories = [];

                    // Add if not exists
                    if (!category.subCategories.includes(newSub.trim())) {
                        category.subCategories.push(newSub.trim());
                        await dataService.updateCategory(categoryId, { subCategories: category.subCategories });

                        // Reload dropdown and select new value
                        loadSubCategories(categoryId, newSub.trim());
                        alert('Sub-category added!');
                    } else {
                        alert('Sub-category already exists.');
                    }
                }
            } catch (error) {
                alert('Failed to add sub-category: ' + error.message);
            }
        }
    });
}

// Color Swatch Logic
function renderColorSwatches() {
    if (!colorSwatchesContainer) return;
    colorSwatchesContainer.innerHTML = '';

    colorPalette.forEach(color => {
        const div = document.createElement('div');
        const isSelected = selectedColors.has(color.name);

        div.style.cssText = `
            width: 32px; 
            height: 32px; 
            border-radius: 50%; 
            background-color: ${color.hex}; 
            cursor: pointer; 
            border: 2px solid ${isSelected ? '#000' : '#ddd'};
            box-shadow: ${isSelected ? '0 0 5px rgba(0,0,0,0.3)' : 'none'};
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        `;
        div.title = color.name;

        if (isSelected) {
            div.innerHTML = `<span style="color: ${['White', 'Yellow', 'Beige'].includes(color.name) ? '#000' : '#fff'}; font-weight: bold; font-size: 14px;">✓</span>`;
        }

        div.onclick = () => toggleColor(color.name);
        colorSwatchesContainer.appendChild(div);
    });
}

function toggleColor(colorName) {
    if (selectedColors.has(colorName)) {
        selectedColors.delete(colorName);
    } else {
        selectedColors.add(colorName);
    }
    renderColorSwatches();
}

// Load categories into dropdown
async function loadCategoryDropdown() {
    try {
        const categories = await dataService.getCategories();
        const select = productCategoryInput;

        select.innerHTML = '<option value="">Select category</option>';

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.name} (${category.type})`;
            select.appendChild(option);
        });

        // Load sub-categories if category selected
        if (productIdInput.value && productCategoryInput.value) {
            await loadSubCategories(productCategoryInput.value, productSubCategoryInput.dataset.selectedValue);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadSubCategories(categoryId, selectedSub = null) {
    productSubCategoryInput.innerHTML = '<option value="">Select sub-category</option>';
    if (!categoryId) return;

    try {
        const category = await dataService.getCategoryById(categoryId);
        if (category && category.subCategories) {
            category.subCategories.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                option.textContent = sub;
                if (selectedSub === sub) option.selected = true;
                productSubCategoryInput.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading subcategories:', error);
    }
}

/**
 * Upload image file to server
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} - URL of uploaded image
 */
async function uploadImageToServer(file) {
    try {
        const result = await dataService.uploadImage(file);
        return result.url;
    } catch (error) {
        console.error('Upload failed:', error);
        throw new Error('Image upload failed: ' + error.message);
    }
}

// Open add modal
function openAddModal() {
    modalTitle.textContent = 'Add Product';
    productForm.reset();

    // Reset variants defaults
    hasSizesCheckbox.checked = true;
    hasColorsCheckbox.checked = false;
    sizesSection.style.display = 'block';
    colorsSection.style.display = 'none';
    selectedColors.clear();
    renderColorSwatches();

    productIdInput.value = '';
    productSubCategoryInput.innerHTML = '<option value="">Select sub-category</option>';
    productSubCategoryInput.dataset.selectedValue = ''; // Reset dataset
    formError.classList.remove('show');
    formError.textContent = '';
    primaryImagePreview.innerHTML = '';
    subImagesPreview.innerHTML = '';
    loadCategoryDropdown();

    modal.classList.add('show');
}

// Open edit modal
async function openEditModal(product) {
    modalTitle.textContent = 'Edit Product';
    productIdInput.value = product.id;
    productNameInput.value = product.name;
    productPriceInput.value = product.price;

    // Handle category ID
    const categoryId = product.category_id;
    productCategoryInput.value = categoryId;

    // Store sub-category for later loading
    productSubCategoryInput.dataset.selectedValue = product.sub_category || '';

    productStockInput.value = product.stock;
    productDescriptionInput.value = product.description || '';

    // Set variants
    const hasSizes = product.sizes && product.sizes.length > 0;
    const hasColors = product.colors && product.colors.length > 0;

    hasSizesCheckbox.checked = hasSizes;
    hasColorsCheckbox.checked = hasColors;

    sizesSection.style.display = hasSizes ? 'block' : 'none';
    colorsSection.style.display = hasColors ? 'block' : 'none';

    // Set sizes
    document.querySelectorAll('input[name="size"]').forEach(checkbox => {
        checkbox.checked = product.sizes ? product.sizes.includes(checkbox.value) : false;
    });

    // Set colors
    selectedColors.clear();
    if (product.colors && product.colors.length > 0) {
        product.colors.forEach(c => selectedColors.add(c));
    }
    renderColorSwatches();

    // Set flags
    isTrendingInput.checked = product.is_trending || false;
    isPopularInput.checked = product.is_popular || false;
    isMenCollectionInput.checked = product.is_men_collection || false;
    isWomenCollectionInput.checked = product.is_women_collection || false;

    // Set primary image
    primaryImageUrlInput.value = product.primary_image || '';
    updatePrimaryImagePreview();

    // Set sub images (using product.images from backend)
    const container = document.getElementById('subImagesContainer');
    container.innerHTML = '';
    const subImages = product.images || product.subImages || [];
    subImages.forEach((img, index) => {
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
    await loadCategoryDropdown();

    // Set category value after dropdown is loaded
    productCategoryInput.value = categoryId;
    await loadSubCategories(categoryId, product.sub_category);

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
                <img src="${url}" alt="Primary Image" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📷</text></svg>'">
            </div>
        `;
    } else {
        primaryImagePreview.innerHTML = '';
    }
}

// Handle primary image file upload - NOW UPLOADS TO SERVER
async function handlePrimaryImageFile(e) {
    const file = e.target.files[0];
    if (file) {
        try {
            showError('Uploading image...');
            formError.style.color = '#666';

            const url = await uploadImageToServer(file);
            primaryImageUrlInput.value = url;
            updatePrimaryImagePreview();

            formError.classList.remove('show');
            formError.style.color = '';
        } catch (error) {
            formError.style.color = '';
            showError('Failed to upload image: ' + error.message);
        }
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
                <img src="${url}" alt="Sub Image" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📷</text></svg>'">
            </div>
        `).join('');
    } else {
        subImagesPreview.innerHTML = '';
    }
}

// Handle sub image file uploads - NOW UPLOADS TO SERVER
document.addEventListener('change', async function (e) {
    if (e.target.classList.contains('sub-image-file')) {
        const file = e.target.files[0];
        if (file) {
            try {
                const urlInput = e.target.previousElementSibling;
                urlInput.value = 'Uploading...';
                urlInput.disabled = true;

                const url = await uploadImageToServer(file);
                urlInput.value = url;
                urlInput.disabled = false;
                updateSubImagesPreview();
            } catch (error) {
                const urlInput = e.target.previousElementSibling;
                urlInput.value = '';
                urlInput.disabled = false;
                alert('Failed to upload image: ' + error.message);
            }
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
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const productId = productIdInput.value;
        const productName = productNameInput.value.trim();
        const productPrice = parseFloat(productPriceInput.value);
        const productCategory = productCategoryInput.value;
        const productSubCategory = productSubCategoryInput.value;
        const productStock = parseInt(productStockInput.value) || 0;
        const productDescription = productDescriptionInput.value.trim();

        // Get selected sizes
        const sizes = Array.from(document.querySelectorAll('input[name="size"]:checked'))
            .map(cb => cb.value);

        // Get selected colors
        const colors = Array.from(selectedColors);

        // Get primary image
        const primaryImage = primaryImageUrlInput.value.trim();

        // Get sub images
        const subImageUrls = Array.from(document.querySelectorAll('.sub-image-url'))
            .map(input => input.value.trim())
            .filter(url => url !== '' && !url.includes('Uploading'));

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

        if (!hasSizesCheckbox.checked && !hasColorsCheckbox.checked) {
            showError('At least one variant type (Size or Color) must be enabled');
            return;
        }

        if (hasSizesCheckbox.checked && sizes.length === 0) {
            showError('At least one size must be selected');
            return;
        }

        if (hasColorsCheckbox.checked && colors.length === 0) {
            showError('At least one color must be entered');
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

        const productData = {
            name: productName,
            price: productPrice,
            category: productCategory,
            subCategory: productSubCategory,
            stock: productStock,
            description: productDescription,
            sizes: hasSizesCheckbox.checked ? sizes : [],
            colors: hasColorsCheckbox.checked ? colors : [],
            primaryImage: primaryImage,
            images: subImageUrls,
            isTrending: isTrendingInput.checked,
            isPopular: isPopularInput.checked,
            isMenCollection: isMenCollectionInput.checked,
            isWomenCollection: isWomenCollectionInput.checked
        };

        if (productId) {
            // Update existing product
            await dataService.updateProduct(productId, productData);
        } else {
            // Create new product
            await dataService.createProduct(productData);
        }

        closeModal();
        await loadProducts();
    } catch (error) {
        showError(error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Product';
    }
}

// Show error message
function showError(message) {
    formError.textContent = message;
    formError.classList.add('show');
}

// Delete product
async function deleteProduct(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        await dataService.deleteProduct(id);
        await loadProducts();
    } catch (error) {
        alert(error.message);
    }
}

// Load products table
async function loadProducts() {
    try {
        const products = await dataService.getProducts();
        const categories = await dataService.getCategories();
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
            const categoryId = product.category_id;
            const category = categories.find(c => c.id === categoryId);
            const categoryName = category ? category.name : 'Unknown';

            return `
                                <tr>
                                    <td>
                                        <img src="${product.primary_image}" alt="${product.name}" 
                                             style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
                                             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📷</text></svg>'">
                                    </td>
                                    <td><strong>${product.name}</strong></td>
                                    <td>₹${product.price.toLocaleString()}</td>
                                    <td>${categoryName}</td>
                                    <td>${product.stock}</td>
                                    <td>
                                        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                            ${product.is_trending ? '<span class="badge badge-warning">Trending</span>' : ''}
                                            ${product.is_popular ? '<span class="badge badge-success">Popular</span>' : ''}
                                            ${product.is_men_collection ? '<span class="badge badge-primary">Men</span>' : ''}
                                            ${product.is_women_collection ? '<span class="badge badge-primary">Women</span>' : ''}
                                        </div>
                                    </td>
                                    <td>
                                        <div class="table-actions">
                                            <button class="btn btn-secondary btn-sm" onclick='editProductById("${product.id}")'>
                                                Edit
                                            </button>
                                            <button class="btn btn-danger btn-sm" onclick='deleteProduct("${product.id}", "${product.name.replace(/'/g, "\\'")}");'>
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
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsTableContainer').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Failed to load products</div>
                <div>${error.message}</div>
                <button class="btn btn-primary mt-1" onclick="loadProducts()">Retry</button>
            </div>
        `;
    }
}

// Edit product by ID (fetch fresh data)
async function editProductById(productId) {
    try {
        const product = await dataService.getProductById(productId);
        if (product) {
            await openEditModal(product);
        } else {
            alert('Product not found');
        }
    } catch (error) {
        alert('Failed to load product: ' + error.message);
    }
}

// Make functions globally accessible
window.openAddModal = openAddModal;
window.editProductById = editProductById;
window.deleteProduct = deleteProduct;
window.loadProducts = loadProducts;

// Initialize
loadCategoryDropdown();
loadProducts();
