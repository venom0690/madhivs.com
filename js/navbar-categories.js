// Dynamic Multi-Level Category Navbar Builder
// Fetches categories from API and builds unlimited depth dropdown

document.addEventListener('DOMContentLoaded', async () => {
    const navItem = document.querySelector('.nav-item');
    if (!navItem) return;

    try {
        // Fetch nested categories from API
        const response = await fetch('/api/categories?nested=true');
        const data = await response.json();

        if (data.status === 'success' && data.categories) {
            buildCategoryDropdown(data.categories, navItem);
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
        // Fallback: keep existing static dropdown
    }
});

/**
 * Build multi-level dropdown recursively
 * @param {Array} categories - Nested category tree
 * @param {HTMLElement} container - Container element
 */
function buildCategoryDropdown(categories, container) {
    // Clear existing dropdown
    const existingDropdown = container.querySelector('.dropdown-menu');
    if (existingDropdown) {
        existingDropdown.remove();
    }

    // Create new dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown-menu';

    // Group by type
    const menCategories = categories.filter(cat => cat.type === 'Men');
    const womenCategories = categories.filter(cat => cat.type === 'Women');
    const generalCategories = categories.filter(cat => cat.type === 'General');

    // Build sections
    if (menCategories.length > 0) {
        const menSection = buildCategorySection('MEN', menCategories, 'Men');
        dropdown.appendChild(menSection);
    }

    if (womenCategories.length > 0) {
        const womenSection = buildCategorySection('WOMEN', womenCategories, 'Women');
        dropdown.appendChild(womenSection);
    }

    if (generalCategories.length > 0) {
        const generalSection = buildCategorySection('OTHERS', generalCategories, 'General');
        dropdown.appendChild(generalSection);
    }

    container.appendChild(dropdown);
}

/**
 * Build category section with header
 */
function buildCategorySection(title, categories, type) {
    const section = document.createElement('div');
    section.className = 'dropdown-section';

    const header = document.createElement('div');
    header.className = 'dropdown-section-header';
    header.textContent = title;
    section.appendChild(header);

    categories.forEach(cat => {
        const item = buildCategoryItem(cat, type, true);
        section.appendChild(item);
    });

    return section;
}

/**
 * Build category item recursively
 */
function buildCategoryItem(category, type, isChild = false) {
    const hasChildren = category.children && category.children.length > 0;

    // Determine base URL
    let baseUrl = 'shop.html';
    if (type === 'Men' || category.type === 'Men') baseUrl = 'men.html';
    else if (type === 'Women' || category.type === 'Women') baseUrl = 'women.html';
    else if (type === 'Accessories' || category.type === 'Accessories') baseUrl = 'accessories.html';

    const href = `${baseUrl}?category=${category.id}`;

    if (hasChildren) {
        // Category with children - create submenu
        const wrapper = document.createElement('div');
        wrapper.className = 'dropdown-submenu';

        const link = document.createElement('a');
        link.href = href;
        link.textContent = category.name;
        link.className = isChild ? 'dropdown-child' : '';
        wrapper.appendChild(link);

        const submenu = document.createElement('div');
        submenu.className = 'dropdown-submenu-content';

        category.children.forEach(child => {
            const childItem = buildCategoryItem(child, type, true);
            submenu.appendChild(childItem);
        });

        wrapper.appendChild(submenu);
        return wrapper;
    } else {
        // Leaf category - simple link
        const link = document.createElement('a');
        link.href = href;
        link.textContent = category.name;
        link.className = isChild ? 'dropdown-child' : '';
        return link;
    }
}
