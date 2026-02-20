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

    // Add social icons
    const socialContainer = document.createElement("div");
    socialContainer.className = "mobile-social-icons";
    socialContainer.innerHTML = `
        <a href="https://facebook.com" target="_blank" aria-label="Facebook">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="24" height="24"><path fill="#1877f2" d="M1024,512C1024,229.23016,794.76978,0,512,0S0,229.23016,0,512c0,255.554,187.231,467.37012,432,505.77777V660H302V512H432V399.2C432,270.87982,508.43854,200,625.38922,200,681.40765,200,740,210,740,210V336H675.43713C611.83508,336,592,375.46667,592,415.95728V512H734L711.3,660H592v357.77777C836.769,979.37012,1024,767.554,1024,512Z"></path><path fill="#fff" d="M711.3,660,734,512H592V415.95728C592,375.46667,611.83508,336,675.43713,336H740V210s-58.59235-10-114.61078-10C508.43854,200,432,270.87982,432,399.2V512H302V660H432v357.77777a517.39619,517.39619,0,0,0,160,0V660Z"></path></svg>
        </a>
        <a href="https://instagram.com" target="_blank" aria-label="Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="24" height="24"><linearGradient id="a_mob" x1="1.464" x2="14.536" y1="14.536" y2="1.464" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFC107"></stop><stop offset=".507" stop-color="#F44336"></stop><stop offset=".99" stop-color="#9C27B0"></stop></linearGradient><path fill="url(#a_mob)" d="M11 0H5a5 5 0 0 0-5 5v6a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V5a5 5 0 0 0-5-5zm3.5 11c0 1.93-1.57 3.5-3.5 3.5H5c-1.93 0-3.5-1.57-3.5-3.5V5c0-1.93 1.57-3.5 3.5-3.5h6c1.93 0 3.5 1.57 3.5 3.5v6z"></path><linearGradient id="b_mob" x1="5.172" x2="10.828" y1="10.828" y2="5.172" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFC107"></stop><stop offset=".507" stop-color="#F44336"></stop><stop offset=".99" stop-color="#9C27B0"></stop></linearGradient><path fill="url(#b_mob)" d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6.5A2.503 2.503 0 0 1 5.5 8c0-1.379 1.122-2.5 2.5-2.5s2.5 1.121 2.5 2.5c0 1.378-1.122 2.5-2.5 2.5z"></path><linearGradient id="c_mob" x1="11.923" x2="12.677" y1="4.077" y2="3.323" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFC107"></stop><stop offset=".507" stop-color="#F44336"></stop><stop offset=".99" stop-color="#9C27B0"></stop></linearGradient><circle cx="12.3" cy="3.7" r=".533" fill="url(#c_mob)"></circle></svg>
        </a>
        <a href="https://twitter.com" target="_blank" aria-label="Twitter">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512"><path fill="#000" d="M355.904 100H408.832L293.2 232.16L429.232 412H322.72L239.296 302.928L143.84 412H90.8805L214.56 270.64L84.0645 100H193.28L268.688 199.696L355.904 100ZM337.328 380.32H366.656L177.344 130.016H145.872L337.328 380.32Z"></path></svg>
        </a>
    `;

    // Append social icons to nav container
    navContainer.appendChild(socialContainer);

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
        let baseUrl = 'shop.html';
        if (cat.type === 'Men') baseUrl = 'men.html';
        else if (cat.type === 'Women') baseUrl = 'women.html';
        else if (cat.type === 'Accessories') baseUrl = 'accessories.html';

        const item = {
            text: cat.name,
            href: `${baseUrl}?category=${cat.id}`
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
