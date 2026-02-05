// Mobile Action Bar Functionality for Collection Pages
document.addEventListener('DOMContentLoaded', function () {
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    const mobileFilterBtn = document.getElementById('mobileFilterBtn');
    const searchBox = document.querySelector('.search-box input');
    const filterButtons = document.querySelector('.filter-buttons');

    // Mobile Search Button - Focus on search input
    if (mobileSearchBtn && searchBox) {
        mobileSearchBtn.addEventListener('click', function () {
            // Scroll to top where search is
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Focus on search input after scroll
            setTimeout(() => {
                searchBox.focus();
            }, 300);
        });
    }

    // Mobile Filter Button - Scroll to filter buttons
    if (mobileFilterBtn && filterButtons) {
        mobileFilterBtn.addEventListener('click', function () {
            // Scroll to filter buttons section
            filterButtons.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    }
});
