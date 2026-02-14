// Mobile Hamburger Menu - Dynamic Nested Categories
document.addEventListener("DOMContentLoaded", async () => {
    const hamburger = document.querySelector(".hamburger");
    if (!hamburger) return;

    // Prevent duplicate menu creation
    if (document.querySelector(".mobile-menu")) return;

    const body = document.body;

    // Backdrop
    const backdrop = document.createElement("div");
    backdrop.className = "mobile-menu-backdrop";

    // Menu container
    const mobileMenu = document.createElement("div");
    mobileMenu.className = "mobile-menu";

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "mobile-menu-close";
    closeBtn.innerHTML = "×";
    closeBtn.setAttribute("aria-label", "Close menu");

    // Nav container
    const navContainer = document.createElement("nav");
    navContainer.className = "mobile-nav-links";

    const navItems = [
        { text: "Home", href: "index.html" }
    ];

    const currentPage =
        window.location.pathname.split("/").pop() || "index.html";

    // Fetch categories from API
    try {
        const response = await fetch('/api/categories?nested=true');
        const data = await response.json();

        if (data.status === 'success' && data.categories) {
            // Add Categories dropdown with nested structure
            navItems.push({
                text: "Categories",
                isDropdown: true,
                subItems: buildMobileCategoryTree(data.categories)
            });
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
        // Fallback to static categories
        navItems.push({
            text: "Categories",
            isDropdown: true,
            subItems: [
                { text: "Men", href: "men.html" },
                { text: "Women", href: "women.html" },
                { text: "Accessories", href: "accessories.html" }
            ]
        });
    }

    // Add other menu items
    navItems.push(
        { text: "Services", href: "services.html" },
        { text: "About", href: "about.html" },
        { text: "Contact", href: "contact.html" },
        { text: "Wishlist", href: "wishlist.html" },
        { text: "Cart", href: "cart.html" }
    );

    navItems.forEach(item => {
        if (item.isDropdown) {
            const dropdownContainer = createMobileDropdown(item, currentPage, closeMenu);
            navContainer.appendChild(dropdownContainer);
        } else {
            // Regular link
            const link = document.createElement("a");
            link.href = item.href;
            link.textContent = item.text;

            if (item.href === currentPage) {
                link.classList.add("active");
            }

            link.addEventListener("click", closeMenu);
            navContainer.appendChild(link);
        }
    });

    mobileMenu.appendChild(closeBtn);
    mobileMenu.appendChild(navContainer);

    body.appendChild(backdrop);
    body.appendChild(mobileMenu);

    function openMenu() {
        mobileMenu.classList.add("open");
        backdrop.classList.add("show");
        body.style.overflow = "hidden";
    }

    function closeMenu() {
        mobileMenu.classList.remove("open");
        backdrop.classList.remove("show");
        body.style.overflow = "";
    }

    hamburger.addEventListener("click", e => {
        e.stopPropagation();
        openMenu();
    });

    closeBtn.addEventListener("click", e => {
        e.stopPropagation();
        closeMenu();
    });

    backdrop.addEventListener("click", closeMenu);

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") closeMenu();
    });
});

/**
 * Build mobile category tree from nested API data
 */
function buildMobileCategoryTree(categories) {
    const items = [];

    categories.forEach(cat => {
        const item = {
            text: cat.name,
            href: `men.html?category=${cat.id}`
        };

        if (cat.children && cat.children.length > 0) {
            item.isDropdown = true;
            item.subItems = buildMobileCategoryTree(cat.children);
        }

        items.push(item);
    });

    return items;
}

/**
 * Create mobile dropdown element recursively
 */
function createMobileDropdown(item, currentPage, closeMenu) {
    const dropdownContainer = document.createElement("div");
    dropdownContainer.className = "mobile-dropdown";

    const dropdownHeader = document.createElement("div");
    dropdownHeader.className = "mobile-dropdown-header";
    dropdownHeader.innerHTML = `${item.text} <span class="mobile-dropdown-arrow">▼</span>`;

    const dropdownContent = document.createElement("div");
    dropdownContent.className = "mobile-dropdown-content";

    item.subItems.forEach(subItem => {
        if (subItem.isDropdown) {
            // Nested dropdown
            const nestedDropdown = createMobileDropdown(subItem, currentPage, closeMenu);
            dropdownContent.appendChild(nestedDropdown);
        } else {
            // Regular link
            const subLink = document.createElement("a");
            subLink.href = subItem.href;
            subLink.textContent = subItem.text;

            if (subItem.href === currentPage) {
                subLink.classList.add("active");
            }

            subLink.addEventListener("click", closeMenu);
            dropdownContent.appendChild(subLink);
        }
    });

    dropdownHeader.addEventListener("click", () => {
        dropdownContainer.classList.toggle("open");
    });

    dropdownContainer.appendChild(dropdownHeader);
    dropdownContainer.appendChild(dropdownContent);

    return dropdownContainer;
}
