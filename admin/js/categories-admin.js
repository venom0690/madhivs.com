/**
 * Categories Management Logic
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
const modal = document.getElementById('categoryModal');
const modalTitle = document.getElementById('modalTitle');
const categoryForm = document.getElementById('categoryForm');
const categoryIdInput = document.getElementById('categoryId');
const categoryNameInput = document.getElementById('categoryName');
const categoryTypeInput = document.getElementById('categoryType');
const subCategoryInput = document.getElementById('subCategoryInput');
const subCategoriesList = document.getElementById('subCategoriesList');
const formError = document.getElementById('formError');

let currentSubCategories = [];

// Modal controls
document.getElementById('addCategoryBtn').addEventListener('click', openAddModal);
document.getElementById('addSubCategoryBtn').addEventListener('click', addSubCategory);
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('saveBtn').addEventListener('click', saveCategory);

// Close modal on outside click
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Open add modal
function openAddModal() {
    modalTitle.textContent = 'Add Category';
    categoryForm.reset();
    categoryIdInput.value = '';
    currentSubCategories = [];
    renderSubCategories();
    formError.classList.remove('show');
    formError.textContent = '';
    modal.classList.add('show');
}

// Open edit modal
function openEditModal(category) {
    modalTitle.textContent = 'Edit Category';
    categoryIdInput.value = category.id;
    categoryNameInput.value = category.name;
    categoryTypeInput.value = category.type;
    currentSubCategories = category.subCategories || [];
    renderSubCategories();
    formError.classList.remove('show');
    formError.textContent = '';
    modal.classList.add('show');
}

function addSubCategory() {
    const val = subCategoryInput.value.trim();
    if (val && !currentSubCategories.includes(val)) {
        currentSubCategories.push(val);
        subCategoryInput.value = '';
        renderSubCategories();
    }
}

function removeSubCategory(index) {
    currentSubCategories.splice(index, 1);
    renderSubCategories();
}

function renderSubCategories() {
    subCategoriesList.innerHTML = currentSubCategories.map((sub, index) => `
        <div style="background: #eee; padding: 2px 8px; border-radius: 12px; display: flex; align-items: center; font-size: 0.9rem;">
            ${sub}
            <span onclick="removeSubCategory(${index})" style="margin-left: 6px; cursor: pointer; color: #666; font-weight: bold;">&times;</span>
        </div>
    `).join('');
}

// Make globally accessible
window.removeSubCategory = removeSubCategory;

// Close modal
function closeModal() {
    modal.classList.remove('show');
    categoryForm.reset();
    currentSubCategories = [];
    renderSubCategories();
}

// Save category
function saveCategory() {
    const categoryId = categoryIdInput.value;
    const categoryName = categoryNameInput.value.trim();
    const categoryType = categoryTypeInput.value;

    // Validate
    if (!categoryName) {
        showError('Category name is required');
        return;
    }

    if (!categoryType) {
        showError('Category type is required');
        return;
    }

    try {
        const categoryData = {
            name: categoryName,
            type: categoryType,
            subCategories: currentSubCategories
        };

        if (categoryId) {
            // Update existing category
            dataService.updateCategory(categoryId, categoryData);
        } else {
            // Create new category
            dataService.createCategory(categoryData);
        }

        closeModal();
        loadCategories();
    } catch (error) {
        showError(error.message);
    }
}

// Show error message
function showError(message) {
    formError.textContent = message;
    formError.classList.add('show');
}

// Delete category
function deleteCategory(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        dataService.deleteCategory(id);
        loadCategories();
    } catch (error) {
        alert(error.message);
    }
}

// Load categories table
function loadCategories() {
    const categories = dataService.getCategories();
    const container = document.getElementById('categoriesTableContainer');

    if (categories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏷️</div>
                <div class="empty-state-text">No categories yet</div>
                <button class="btn btn-primary mt-1" onclick="openAddModal()">Add Your First Category</button>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Category Name</th>
                        <th>Type</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${categories.map(category => `
                        <tr>
                            <td><strong>${category.name}</strong></td>
                            <td>
                                <span class="badge ${category.type === 'Men' ? 'badge-primary' :
            category.type === 'Women' ? 'badge-success' :
                'badge-warning'
        }">
                                    ${category.type}
                                </span>
                            </td>
                            <td>${new Date(category.createdAt).toLocaleDateString()}</td>
                            <td>
                                <div class="table-actions">
                                    <button class="btn btn-secondary btn-sm" onclick='editCategory(${JSON.stringify(category)})'>
                                        Edit
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick='deleteCategory("${category.id}", "${category.name}")'>
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = tableHTML;
}

// Make functions globally accessible
window.openAddModal = openAddModal;
window.editCategory = openEditModal;
window.deleteCategory = deleteCategory;

// Initialize
loadCategories();
