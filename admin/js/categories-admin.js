/**
 * Categories Management Logic
 * Updated for parent_id subcategory system
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
const parentCategoryInput = document.getElementById('parentCategory');
const formError = document.getElementById('formError');

// Modal controls
document.getElementById('addCategoryBtn').addEventListener('click', openAddModal);
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
async function openAddModal() {
    modalTitle.textContent = 'Add Category';
    categoryForm.reset();
    categoryIdInput.value = '';
    formError.classList.remove('show');
    formError.textContent = '';
    await loadParentCategoryDropdown();
    modal.classList.add('show');
}

// Open edit modal
async function openEditModal(category) {
    modalTitle.textContent = 'Edit Category';
    categoryIdInput.value = category.id;
    categoryNameInput.value = category.name;
    categoryTypeInput.value = category.type;
    formError.classList.remove('show');
    formError.textContent = '';
    await loadParentCategoryDropdown(category.id);
    parentCategoryInput.value = category.parent_id || '';
    modal.classList.add('show');
}

// Load parent category dropdown
async function loadParentCategoryDropdown(excludeId = null) {
    try {
        const categories = await dataService.getCategories();
        const select = parentCategoryInput;

        select.innerHTML = '<option value="">None (Main Category)</option>';

        // Only show main categories (parent_id = null) as parent options
        const mainCategories = categories.filter(cat => !cat.parent_id && cat.id !== excludeId);

        mainCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.name} (${category.type})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading parent categories:', error);
    }
}

// Close modal
function closeModal() {
    modal.classList.remove('show');
    categoryForm.reset();
}

// Save category
async function saveCategory() {
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const categoryId = categoryIdInput.value;
        const categoryName = categoryNameInput.value.trim();
        const categoryType = categoryTypeInput.value;
        const parentId = parentCategoryInput.value || null;

        // Validate
        if (!categoryName) {
            showError('Category name is required');
            return;
        }

        if (!categoryType) {
            showError('Category type is required');
            return;
        }

        const categoryData = {
            name: categoryName,
            type: categoryType,
            parent_id: parentId
        };

        if (categoryId) {
            // Update existing category
            await dataService.updateCategory(categoryId, categoryData);
        } else {
            // Create new category
            await dataService.createCategory(categoryData);
        }

        closeModal();
        await loadCategories();
    } catch (error) {
        showError(error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Category';
    }
}

// Show error message
function showError(message) {
    formError.textContent = message;
    formError.classList.add('show');
}

// Delete category
async function deleteCategory(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?\n\nIf this is a parent category, all subcategories will also be deleted.\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        await dataService.deleteCategory(id);
        await loadCategories();
    } catch (error) {
        alert(error.message);
    }
}

// Load categories table with nested structure
async function loadCategories() {
    const container = document.getElementById('categoriesTableContainer');

    try {
        const categories = await dataService.getCategories();

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

        // Separate main categories and subcategories
        const mainCategories = categories.filter(cat => !cat.parent_id);
        const subcategories = categories.filter(cat => cat.parent_id);

        // Build rows with nested structure
        let rows = '';

        mainCategories.forEach(parent => {
            // Parent row
            rows += `
                <tr style="background-color: #f8f9fa;">
                    <td><strong>${parent.name}</strong></td>
                    <td>
                        <span class="badge ${parent.type === 'Men' ? 'badge-primary' :
                    parent.type === 'Women' ? 'badge-success' :
                        'badge-warning'}">
                            ${parent.type}
                        </span>
                    </td>
                    <td>Main Category</td>
                    <td>${new Date(parent.created_at).toLocaleDateString()}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-secondary btn-sm" onclick='editCategoryById("${parent.id}")'>
                                Edit
                            </button>
                            <button class="btn btn-danger btn-sm" onclick='deleteCategory("${parent.id}", "${parent.name.replace(/'/g, "\\'")}");'>
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;

            // Subcategory rows
            const subs = subcategories.filter(sub => sub.parent_id === parent.id);
            subs.forEach(sub => {
                rows += `
                    <tr>
                        <td style="padding-left: 2rem;">├─ ${sub.name}</td>
                        <td>
                            <span class="badge ${sub.type === 'Men' ? 'badge-primary' :
                        sub.type === 'Women' ? 'badge-success' :
                            'badge-warning'}">
                                ${sub.type}
                            </span>
                        </td>
                        <td>Subcategory of ${parent.name}</td>
                        <td>${new Date(sub.created_at).toLocaleDateString()}</td>
                        <td>
                            <div class="table-actions">
                                <button class="btn btn-secondary btn-sm" onclick='editCategoryById("${sub.id}")'>
                                    Edit
                                </button>
                                <button class="btn btn-danger btn-sm" onclick='deleteCategory("${sub.id}", "${sub.name.replace(/'/g, "\\'")}");'>
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        });

        const tableHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Category Name</th>
                            <th>Type</th>
                            <th>Level</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    } catch (error) {
        console.error('Error loading categories:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Failed to load categories</div>
                <div>${error.message}</div>
                <button class="btn btn-primary mt-1" onclick="loadCategories()">Retry</button>
            </div>
        `;
    }
}

// Edit category by ID (fetch fresh data)
async function editCategoryById(categoryId) {
    try {
        const category = await dataService.getCategoryById(categoryId);
        if (category) {
            await openEditModal(category);
        } else {
            alert('Category not found');
        }
    } catch (error) {
        alert('Failed to load category: ' + error.message);
    }
}

// Make functions globally accessible
window.openAddModal = openAddModal;
window.editCategoryById = editCategoryById;
window.deleteCategory = deleteCategory;
window.loadCategories = loadCategories;

// Initialize
loadCategories();
