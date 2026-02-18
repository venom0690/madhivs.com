/**
 * Homepage Control Logic
 * Fully Async/Await version
 */

// Auth guard - wrapped in async IIFE
(async function initializePage() {
    await authService.requireAuth();

    // Load user info
    const user = authService.getCurrentUser();
if (user) {
    document.getElementById('userName').textContent = user.email.split('@')[0];
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', () => {
    authService.logout();
});

// State
let homepageContent = {
    sliderImages: [],
    trendingProductIds: [],
    popularProductIds: []
};
let allProducts = [];

// Modal elements
const sliderModal = document.getElementById('sliderModal');
const sliderImageUrlInput = document.getElementById('sliderImageUrl');
const sliderImageFileInput = document.getElementById('sliderImageFile');
const sliderImagePreview = document.getElementById('sliderImagePreview');

// Modal controls
document.getElementById('addSliderImageBtn').addEventListener('click', openSliderModal);
document.getElementById('closeSliderModal').addEventListener('click', closeSliderModal);
document.getElementById('cancelSliderBtn').addEventListener('click', closeSliderModal);
document.getElementById('addSliderBtn').addEventListener('click', addSliderImage);
document.getElementById('saveChangesBtn').addEventListener('click', saveAllChanges);

// Image preview
sliderImageUrlInput.addEventListener('input', updateSliderPreview);
sliderImageFileInput.addEventListener('change', handleSliderImageFile);

// Product selects
document.getElementById('trendingProductSelect').addEventListener('change', addTrendingProduct);
document.getElementById('popularProductSelect').addEventListener('change', addPopularProduct);

// Initialize Data
async function init() {
    try {
        // Load content and products in parallel
        const [content, products] = await Promise.all([
            dataService.getHomepageContent(),
            dataService.getProducts()
        ]);

        homepageContent = content || {
            sliderImages: [],
            trendingProductIds: [],
            popularProductIds: []
        };
        allProducts = products || [];

        renderAll();
    } catch (error) {
        console.error('Failed to load homepage data:', error);
        alert('Failed to load data: ' + error.message);
    }
}

function renderAll() {
    loadSliderImages();
    loadProductDropdowns();
    loadTrendingProducts();
    loadPopularProducts();
}

// Open slider modal
function openSliderModal() {
    sliderImageUrlInput.value = '';
    sliderImageFileInput.value = '';
    sliderImagePreview.innerHTML = '';
    sliderModal.classList.add('show');
}

// Close slider modal
function closeSliderModal() {
    sliderModal.classList.remove('show');
}

// Update slider preview
function updateSliderPreview() {
    const url = sliderImageUrlInput.value.trim();
    if (url) {
        sliderImagePreview.innerHTML = `
            <div class="preview-item">
                <img src="${url}" alt="Slider Image">
            </div>
        `;
    } else {
        sliderImagePreview.innerHTML = '';
    }
}

// Handle slider image file
async function handleSliderImageFile(e) {
    const file = e.target.files[0];
    if (file) {
        try {
            // Upload immediately to get URL
            sliderImageUrlInput.placeholder = "Uploading...";
            const result = await dataService.uploadImage(file);
            sliderImageUrlInput.value = result.url;
            updateSliderPreview();
        } catch (error) {
            alert('Upload failed: ' + error.message);
            sliderImageFileInput.value = '';
        }
    }
}

// Add slider image
function addSliderImage() {
    const url = sliderImageUrlInput.value.trim();
    if (!url) {
        alert('Please provide an image URL or upload an image');
        return;
    }

    const newImage = {
        id: 'slider_' + Date.now(),
        url: url,
        order: homepageContent.sliderImages.length,
        isActive: true
    };

    homepageContent.sliderImages.push(newImage);
    closeSliderModal();
    loadSliderImages();
}

// Remove slider image
function removeSliderImage(id) {
    if (!confirm('Remove this slider image?')) return;

    homepageContent.sliderImages = homepageContent.sliderImages.filter(img => img.id !== id);
    // Reorder
    homepageContent.sliderImages.forEach((img, index) => {
        img.order = index;
    });
    loadSliderImages();
}

// Move slider image
function moveSliderImage(id, direction) {
    const index = homepageContent.sliderImages.findIndex(img => img.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= homepageContent.sliderImages.length) return;

    // Swap
    [homepageContent.sliderImages[index], homepageContent.sliderImages[newIndex]] =
        [homepageContent.sliderImages[newIndex], homepageContent.sliderImages[index]];

    // Update order
    homepageContent.sliderImages.forEach((img, idx) => {
        img.order = idx;
    });

    loadSliderImages();
}

// Toggle slider image active
function toggleSliderActive(id) {
    const image = homepageContent.sliderImages.find(img => img.id === id);
    if (image) {
        image.isActive = !image.isActive;
        loadSliderImages();
    }
}

// Load slider images
function loadSliderImages() {
    const container = document.getElementById('sliderImagesContainer');

    if (!homepageContent.sliderImages || homepageContent.sliderImages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🖼️</div>
                <div class="empty-state-text">No slider images yet</div>
            </div>
        `;
        return;
    }

    container.innerHTML = homepageContent.sliderImages.map((img, index) => `
        <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 0.75rem; background: ${img.isActive ? 'white' : 'var(--bg-main)'};">
            <img src="${img.url}" alt="Slider" style="width: 120px; height: 80px; object-fit: cover; border-radius: var(--radius-sm);">
            <div style="flex: 1;">
                <div style="font-weight: 500; margin-bottom: 0.25rem;">Slide ${index + 1}</div>
                <div style="font-size: 13px; color: var(--text-secondary);">
                    ${img.isActive ? '✅ Active' : '❌ Inactive'}
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary btn-sm" onclick="moveSliderImage('${img.id}', 'up')" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button class="btn btn-secondary btn-sm" onclick="moveSliderImage('${img.id}', 'down')" ${index === homepageContent.sliderImages.length - 1 ? 'disabled' : ''}>↓</button>
                <button class="btn btn-secondary btn-sm" onclick="toggleSliderActive('${img.id}')">${img.isActive ? 'Hide' : 'Show'}</button>
                <button class="btn btn-danger btn-sm" onclick="removeSliderImage('${img.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Load product dropdowns
function loadProductDropdowns() {
    // Trending products
    const trendingSelect = document.getElementById('trendingProductSelect');
    trendingSelect.innerHTML = '<option value="">Choose a product to add</option>';

    // Sort alphabetically
    const sortedProducts = [...allProducts].sort((a, b) => a.name.localeCompare(b.name));

    sortedProducts.forEach(product => {
        if (!homepageContent.trendingProductIds.includes(product.id)) {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            trendingSelect.appendChild(option);
        }
    });

    // Popular products
    const popularSelect = document.getElementById('popularProductSelect');
    popularSelect.innerHTML = '<option value="">Choose a product to add</option>';

    sortedProducts.forEach(product => {
        if (!homepageContent.popularProductIds.includes(product.id)) {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            popularSelect.appendChild(option);
        }
    });
}

// Add trending product
function addTrendingProduct(e) {
    const productId = e.target.value;
    if (!productId) return;

    // Convert to number if needed (legacy ids vs new ids)
    // Actually keep as string/mix to match backend ID type
    homepageContent.trendingProductIds.push(productId);

    e.target.value = '';
    loadProductDropdowns();
    loadTrendingProducts();
}

// Add popular product
function addPopularProduct(e) {
    const productId = e.target.value;
    if (!productId) return;

    homepageContent.popularProductIds.push(productId);

    e.target.value = '';
    loadProductDropdowns();
    loadPopularProducts();
}

// Remove trending product
function removeTrendingProduct(productId) {
    // Filter loose equality to catch both string/number IDs
    homepageContent.trendingProductIds = homepageContent.trendingProductIds.filter(id => id != productId);
    loadProductDropdowns();
    loadTrendingProducts();
}

// Remove popular product
function removePopularProduct(productId) {
    homepageContent.popularProductIds = homepageContent.popularProductIds.filter(id => id != productId);
    loadProductDropdowns();
    loadPopularProducts();
}

// Move trending product
function moveTrendingProduct(productId, direction) {
    const index = homepageContent.trendingProductIds.findIndex(id => id == productId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= homepageContent.trendingProductIds.length) return;

    [homepageContent.trendingProductIds[index], homepageContent.trendingProductIds[newIndex]] =
        [homepageContent.trendingProductIds[newIndex], homepageContent.trendingProductIds[index]];

    loadTrendingProducts();
}

// Move popular product
function movePopularProduct(productId, direction) {
    const index = homepageContent.popularProductIds.findIndex(id => id == productId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= homepageContent.popularProductIds.length) return;

    [homepageContent.popularProductIds[index], homepageContent.popularProductIds[newIndex]] =
        [homepageContent.popularProductIds[newIndex], homepageContent.popularProductIds[index]];

    loadPopularProducts();
}

// Load trending products
function loadTrendingProducts() {
    const container = document.getElementById('trendingProductsList');

    if (!homepageContent.trendingProductIds || homepageContent.trendingProductIds.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-text">No trending products selected</div></div>';
        return;
    }

    container.innerHTML = homepageContent.trendingProductIds.map((productId, index) => {
        const product = allProducts.find(p => p.id == productId);
        if (!product) return '';

        return `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                <img src="${product.primary_image || product.primaryImage || 'https://via.placeholder.com/60'}" alt="${product.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: var(--radius-sm);">
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${product.name}</div>
                    <div style="font-size: 13px; color: var(--text-secondary);">₹${Number(product.price).toLocaleString()}</div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary btn-sm" onclick="moveTrendingProduct('${productId}', 'up')" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-secondary btn-sm" onclick="moveTrendingProduct('${productId}', 'down')" ${index === homepageContent.trendingProductIds.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn btn-danger btn-sm" onclick="removeTrendingProduct('${productId}')">Remove</button>
                </div>
            </div>
        `;
    }).join('');
}

// Load popular products
function loadPopularProducts() {
    const container = document.getElementById('popularProductsList');

    if (!homepageContent.popularProductIds || homepageContent.popularProductIds.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-text">No popular products selected</div></div>';
        return;
    }

    container.innerHTML = homepageContent.popularProductIds.map((productId, index) => {
        const product = allProducts.find(p => p.id == productId);
        if (!product) return '';

        return `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                <img src="${product.primary_image || product.primaryImage || 'https://via.placeholder.com/60'}" alt="${product.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: var(--radius-sm);">
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${product.name}</div>
                    <div style="font-size: 13px; color: var(--text-secondary);">₹${Number(product.price).toLocaleString()}</div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary btn-sm" onclick="movePopularProduct('${productId}', 'up')" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-secondary btn-sm" onclick="movePopularProduct('${productId}', 'down')" ${index === homepageContent.popularProductIds.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn btn-danger btn-sm" onclick="removePopularProduct('${productId}')">Remove</button>
                </div>
            </div>
        `;
    }).join('');
}

// Save all changes
async function saveAllChanges() {
    const saveBtn = document.getElementById('saveChangesBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        await dataService.updateHomepageContent(homepageContent);
        alert('✅ Homepage content saved successfully!');
    } catch (error) {
        alert('Error saving: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
    }
}

// Make functions globally accessible
window.removeSliderImage = removeSliderImage;
window.moveSliderImage = moveSliderImage;
window.toggleSliderActive = toggleSliderActive;
window.removeTrendingProduct = removeTrendingProduct;
window.removePopularProduct = removePopularProduct;
window.moveTrendingProduct = moveTrendingProduct;
window.movePopularProduct = movePopularProduct;

// Initialize
init();

})(); // End of async IIFE
