/**
 * Mobile Menu Handler
 * Handles sidebar toggle on mobile devices
 */

(function() {
    'use strict';

    // Only run on admin pages (not login)
    if (!document.querySelector('.admin-layout')) {
        return;
    }

    // Create mobile menu toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'mobile-menu-toggle';
    toggleButton.innerHTML = '☰';
    toggleButton.setAttribute('aria-label', 'Toggle menu');
    document.body.appendChild(toggleButton);

    // Create mobile overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    document.body.appendChild(overlay);

    const sidebar = document.querySelector('.sidebar');

    // Toggle sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('show');
        document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : '';
    }

    // Close sidebar
    function closeSidebar() {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    // Event listeners
    toggleButton.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Close sidebar when clicking a nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Close sidebar on window resize if screen becomes larger
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
            closeSidebar();
        }
    });

})();
