/**
 * Search Keywords Management Logic
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
let allProducts = [];
let allCategories = [];

// Modal elements
const modal = document.getElementById('keywordModal');
const modalTitle = document.getElementById('modalTitle');
const keywordForm = document.getElementById('keywordForm');
const keywordIdInput = document.getElementById('keywordId');
const keywordTextInput = document.getElementById('keywordText');
const linkedProductsSelect = document.getElementById('linkedProducts');
const linkedCategoriesSelect = document.getElementById('linkedCategories');
const formError = document.getElementById('formError');

// Modal controls
document.getElementById('addKeywordBtn').addEventListener('click', openAddModal);
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('saveBtn').addEventListener('click', saveKeyword);

// Close modal on outside click
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Initialize
async function init() {
    try {
        const [products, categories] = await Promise.all([
            dataService.getProducts(),
            dataService.getCategories()
        ]);

        allProducts = products || [];
        allCategories = categories || [];

        loadKeywords();
    } catch (error) {
        console.error('Failed to load initial data:', error);
    }
}

// Load products and categories into selects
function loadSelects() {
    // Load products
    linkedProductsSelect.innerHTML = '';
    // Sort products by name
    const sortedProducts = [...allProducts].sort((a, b) => a.name.localeCompare(b.name));

    sortedProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        linkedProductsSelect.appendChild(option);
    });

    // Load categories
    linkedCategoriesSelect.innerHTML = '';
    allCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        linkedCategoriesSelect.appendChild(option);
    });
}

// Open add modal
function openAddModal() {
    modalTitle.textContent = 'Add Search Keyword';
    keywordForm.reset();
    keywordIdInput.value = '';
    formError.classList.remove('show');
    formError.textContent = '';
    loadSelects();
    modal.classList.add('show');
}

// Open edit modal
function openEditModal(keyword) {
    modalTitle.textContent = 'Edit Search Keyword';
    keywordIdInput.value = keyword.id;
    keywordTextInput.value = keyword.keyword;

    loadSelects();

    // Select linked products
    if (keyword.linkedProducts) {
        Array.from(linkedProductsSelect.options).forEach(option => {
            // handle both string and number IDs equality
            option.selected = keyword.linkedProducts.some(id => id == option.value);
        });
    }

    // Select linked categories
    if (keyword.linkedCategories) {
        Array.from(linkedCategoriesSelect.options).forEach(option => {
            option.selected = keyword.linkedCategories.some(id => id == option.value);
        });
    }

    formError.classList.remove('show');
    formError.textContent = '';
    modal.classList.add('show');
}

// Close modal
function closeModal() {
    modal.classList.remove('show');
    keywordForm.reset();
}

// Save keyword
async function saveKeyword() {
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const keywordId = keywordIdInput.value;
    const keywordText = keywordTextInput.value.trim().toLowerCase();

    // Get selected products
    const selectedProducts = Array.from(linkedProductsSelect.selectedOptions)
        .map(option => option.value);

    // Get selected categories
    const selectedCategories = Array.from(linkedCategoriesSelect.selectedOptions)
        .map(option => option.value);

    // Validate
    if (!keywordText) {
        showError('Keyword is required');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Keyword';
        return;
    }

    try {
        const keywordData = {
            keyword: keywordText,
            linkedProducts: selectedProducts,
            linkedCategories: selectedCategories
        };

        if (keywordId) {
            // Update existing keyword
            await dataService.updateKeyword(keywordId, keywordData);
        } else {
            // Create new keyword
            await dataService.createKeyword(keywordData);
        }

        closeModal();
        await loadKeywords();
    } catch (error) {
        showError(error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Keyword';
    }
}

// Show error message
function showError(message) {
    formError.textContent = message;
    formError.classList.add('show');
}

// Delete keyword
async function deleteKeyword(id, keyword) {
    if (!confirm(`Are you sure you want to delete keyword "${keyword}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        await dataService.deleteKeyword(id);
        await loadKeywords();
    } catch (error) {
        alert(error.message);
    }
}

// Load keywords table
async function loadKeywords() {
    const container = document.getElementById('keywordsTableContainer');

    try {
        const keywords = await dataService.getKeywords();

        if (!keywords || keywords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">No search keywords yet</div>
                    <button class="btn btn-primary mt-1" onclick="openAddModal()">Add Your First Keyword</button>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Keyword</th>
                            <th>Linked Products</th>
                            <th>Linked Categories</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${keywords.map(keyword => {
            // Get linked product names
            const linkedIds = keyword.linkedProducts || [];
            const linkedProductNames = linkedIds
                .map(id => {
                    const product = allProducts.find(p => p.id == id);
                    return product ? product.name : null;
                })
                .filter(name => name !== null);

            // Get linked category names
            const linkedCatIds = keyword.linkedCategories || [];
            const linkedCategoryNames = linkedCatIds
                .map(id => {
                    const category = allCategories.find(c => c.id == id);
                    return category ? category.name : null;
                })
                .filter(name => name !== null);

            // Safe stringify for onClick
            const safeKeywordJson = JSON.stringify(keyword).replace(/"/g, '&quot;');

            return `
                                <tr>
                                    <td><strong>"${keyword.keyword}"</strong></td>
                                    <td>
                                        ${linkedProductNames.length > 0
                    ? linkedProductNames.map(name => `<span class="badge badge-primary" style="margin: 0.125rem;">${name}</span>`).join(' ')
                    : '<span style="color: var(--text-muted);">None</span>'
                }
                                    </td>
                                    <td>
                                        ${linkedCategoryNames.length > 0
                    ? linkedCategoryNames.map(name => `<span class="badge badge-success" style="margin: 0.125rem;">${name}</span>`).join(' ')
                    : '<span style="color: var(--text-muted);">None</span>'
                }
                                    </td>
                                    <td>${keyword.created_at ? new Date(keyword.created_at).toLocaleDateString() : 'N/A'}</td>
                                    <td>
                                        <div class="table-actions">
                                            <button class="btn btn-secondary btn-sm" onclick='editKeyword(${safeKeywordJson})'>
                                                Edit
                                            </button>
                                            <button class="btn btn-danger btn-sm" onclick='deleteKeyword("${keyword.id}", "${keyword.keyword}")'>
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
        console.error('Error loading keywords:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Failed to load keywords</div>
                <div>${error.message}</div>
                <button class="btn btn-primary mt-1" onclick="loadKeywords()">Retry</button>
            </div>
        `;
    }
}

// Make functions globally accessible
window.openAddModal = openAddModal;
window.editKeyword = openEditModal;
window.deleteKeyword = deleteKeyword;
window.loadKeywords = loadKeywords;

// Initialize
init();

})(); // End of async IIFE
