// Mobile Hamburger Menu - Client Safe Version
document.addEventListener("DOMContentLoaded", () => {
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
        { text: "Home", href: "index.html" },
        { text: "Men", href: "men.html" },
        { text: "Women", href: "women.html" },
        { text: "Services", href: "services.html" },
        { text: "About", href: "about.html" },
        { text: "Contact", href: "contact.html" },
        { text: "Wishlist", href: "wishlist.html" },
        { text: "Cart", href: "cart.html" }
    ];

    const currentPage =
        window.location.pathname.split("/").pop() || "index.html";

    navItems.forEach(item => {
        const link = document.createElement("a");
        link.href = item.href;
        link.textContent = item.text;

        if (item.href === currentPage) {
            link.classList.add("active");
        }

        link.addEventListener("click", closeMenu);
        navContainer.appendChild(link);
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
