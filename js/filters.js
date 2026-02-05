// Category Filter Functionality
document.addEventListener('DOMContentLoaded', function () {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Get the category to filter
            const category = this.getAttribute('data-category');

            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            this.classList.add('active');

            // Filter products
            productCards.forEach(card => {
                const productCategory = card.getAttribute('data-category');

                if (category === 'all' || productCategory === category) {
                    // Show the product with animation
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.classList.add('fade-in');
                    }, 10);
                } else {
                    // Hide the product
                    card.style.display = 'none';
                    card.classList.remove('fade-in');
                }
            });

            // Clear search input when filtering by category
            const searchInput = document.querySelector('.search-box input');
            if (searchInput) {
                searchInput.value = '';
            }
        });
    });
});
