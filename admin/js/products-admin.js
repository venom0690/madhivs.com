/**
 * Products Management Logic
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
productCategoryInput.addEventListener('change', function() {
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
    createSubCategoryLink.addEventListener('click', (e) => {
        e.preventDefault();
        const categoryId = productCategoryInput.value;
        if (!categoryId) {
            alert('Please select a category first.');
            return;
        }
        
        const newSub = prompt('Enter new sub-category name:');
        if (newSub && newSub.trim()) {
            const category = dataService.getCategoryById(categoryId);
            if (category) {
                // Initialize subCategories if missing
                if (!category.subCategories) category.subCategories = [];
                
                // Add if not exists
                if (!category.subCategories.includes(newSub.trim())) {
                    category.subCategories.push(newSub.trim());
                    dataService.updateCategory(categoryId, category);
                    
                    // Reload dropdown and select new value
                    loadSubCategories(categoryId, newSub.trim());
                    alert('Sub-category added!');
                } else {
                    alert('Sub-category already exists.');
                }
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
    // Load sub-categories if category selected
    if (productIdInput.value && productCategoryInput.value) {
        // Wait for category to be set
        setTimeout(() => {
             loadSubCategories(productCategoryInput.value, productSubCategoryInput.dataset.selectedValue);
        }, 100);
    }
}

function loadSubCategories(categoryId, selectedSub = null) {
    productSubCategoryInput.innerHTML = '<option value="">Select sub-category</option>';
    if (!categoryId) return;
    
    const category = dataService.getCategoryById(categoryId);
    if (category && category.subCategories) {
        category.subCategories.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            if (selectedSub === sub) option.selected = true;
            productSubCategoryInput.appendChild(option);
        });
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
function openEditModal(product) {
    modalTitle.textContent = 'Edit Product';
    productIdInput.value = product.id;
    productNameInput.value = product.name;
    productPriceInput.value = product.price;
    productCategoryInput.value = product.category;
    
    // Store sub-category for later loading
    productSubCategoryInput.dataset.selectedValue = product.subCategory || '';
    
    productStockInput.value = product.stock;
    productDescriptionInput.value = product.description;

    // Set variants
    const hasSizes = product.sizes && product.sizes.length > 0;
    const hasColors = product.colors && product.colors.length > 0;
    
    // If neither (legacy data), assume sizes if sizes exist, otherwise default to sizes enabled?
    // Actually if sizes array is empty but it was a product that required sizes, it might be weird.
    // But logic says: check if array has items.
    
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
    const productSubCategory = productSubCategoryInput.value;
    const productStock = parseInt(productStockInput.value);
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

    try {
        const productData = {
            name: productName,
            price: productPrice,
            category: productCategory,
            subCategory: productSubCategory,
            stock: productStock,
            description: productDescription,
            sizes: sizes,
            colors: colors,
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
