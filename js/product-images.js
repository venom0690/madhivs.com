// Product Image Thumbnail Switching
document.addEventListener('DOMContentLoaded', function () {
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const mainImage = card.querySelector('.main-image');
        const thumbnails = card.querySelectorAll('.thumbnail');

        thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', function () {
                // Remove active class from all thumbnails in this card
                thumbnails.forEach(thumb => thumb.classList.remove('active'));

                // Add active class to clicked thumbnail
                this.classList.add('active');

                // Get the thumbnail's image source
                const newImageSrc = this.src.replace('w=150', 'w=600');

                // Add fade effect
                mainImage.style.opacity = '0.5';

                // Change main image after short delay
                setTimeout(() => {
                    mainImage.src = newImageSrc;
                    mainImage.style.opacity = '1';
                }, 150);
            });
        });
    });
});
