/**
 * Search Keywords Management Logic
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

// Load products and categories into selects
function loadSelects() {
    const products = dataService.getProducts();
    const categories = dataService.getCategories();

    // Load products
    linkedProductsSelect.innerHTML = '';
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        linkedProductsSelect.appendChild(option);
    });

    // Load categories
    linkedCategoriesSelect.innerHTML = '';
    categories.forEach(category => {
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
    Array.from(linkedProductsSelect.options).forEach(option => {
        option.selected = keyword.linkedProducts.includes(option.value);
    });

    // Select linked categories
    Array.from(linkedCategoriesSelect.options).forEach(option => {
        option.selected = keyword.linkedCategories.includes(option.value);
    });

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
function saveKeyword() {
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
            dataService.updateKeyword(keywordId, keywordData);
        } else {
            // Create new keyword
            dataService.createKeyword(keywordData);
        }

        closeModal();
        loadKeywords();
    } catch (error) {
        showError(error.message);
    }
}

// Show error message
function showError(message) {
    formError.textContent = message;
    formError.classList.add('show');
}

// Delete keyword
function deleteKeyword(id, keyword) {
    if (!confirm(`Are you sure you want to delete keyword "${keyword}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        dataService.deleteKeyword(id);
        loadKeywords();
    } catch (error) {
        alert(error.message);
    }
}

// Load keywords table
function loadKeywords() {
    const keywords = dataService.getKeywords();
    const products = dataService.getProducts();
    const categories = dataService.getCategories();
    const container = document.getElementById('keywordsTableContainer');

    if (keywords.length === 0) {
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
        const linkedProductNames = keyword.linkedProducts
            .map(id => {
                const product = products.find(p => p.id === id);
                return product ? product.name : null;
            })
            .filter(name => name !== null);

        // Get linked category names
        const linkedCategoryNames = keyword.linkedCategories
            .map(id => {
                const category = categories.find(c => c.id === id);
                return category ? category.name : null;
            })
            .filter(name => name !== null);

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
                                <td>${new Date(keyword.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <div class="table-actions">
                                        <button class="btn btn-secondary btn-sm" onclick='editKeyword(${JSON.stringify(keyword).replace(/'/g, "&apos;")})'>
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
}

// Make functions globally accessible
window.openAddModal = openAddModal;
window.editKeyword = openEditModal;
window.deleteKeyword = deleteKeyword;

// Initialize
loadKeywords();
