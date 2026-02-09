// Hero Slider Functionality - Now syncs with Admin Panel
document.addEventListener('DOMContentLoaded', async function () {
    const heroSlider = document.getElementById('heroSlider');

    if (heroSlider) {
        let slides;
        let currentSlide = 0;
        let autoSlideInterval;

        /**
         * Initialize slider with admin data or fallback to static HTML
         */
        async function initializeSlider() {
            // Try to load slider images from admin panel
            if (typeof AdminDataBridge !== 'undefined') {
                const adminSlides = await AdminDataBridge.getSliderImages();

                if (adminSlides && adminSlides.length > 0) {
                    // Clear existing slides
                    const existingSlides = heroSlider.querySelectorAll('.hero-slide');
                    existingSlides.forEach(slide => slide.remove());

                    // Create slides from admin data
                    adminSlides.forEach((slideData, index) => {
                        const slideDiv = document.createElement('div');
                        slideDiv.className = 'hero-slide';
                        if (index === 0) {
                            slideDiv.classList.add('active');
                        }

                        const img = document.createElement('img');
                        img.src = slideData.url;
                        img.alt = `Slide ${index + 1}`;

                        slideDiv.appendChild(img);

                        // Insert before controls
                        const controls = heroSlider.querySelector('.slider-controls');
                        if (controls) {
                            heroSlider.insertBefore(slideDiv, controls);
                        } else {
                            heroSlider.appendChild(slideDiv);
                        }
                    });
                }
            }

            // Get all slides (either admin-generated or static HTML)
            slides = heroSlider.querySelectorAll('.hero-slide');

            // Only proceed if we have slides
            if (slides.length === 0) {
                console.warn('No slider images found');
                return false;
            }

            return true;
        }

        // Show specific slide
        function showSlide(index) {
            if (!slides || slides.length === 0) return;

            // Remove active class from all slides
            slides.forEach(slide => slide.classList.remove('active'));

            // Wrap around if needed
            if (index >= slides.length) {
                currentSlide = 0;
            } else if (index < 0) {
                currentSlide = slides.length - 1;
            } else {
                currentSlide = index;
            }

            // Add active class to current slide
            slides[currentSlide].classList.add('active');
        }

        // Next slide
        function nextSlide() {
            showSlide(currentSlide + 1);
        }

        // Previous slide
        function prevSlide() {
            showSlide(currentSlide - 1);
        }

        // Auto slide every 5 seconds
        function startAutoSlide() {
            autoSlideInterval = setInterval(nextSlide, 5000);
        }

        // Stop auto slide
        function stopAutoSlide() {
            clearInterval(autoSlideInterval);
        }

        // Initialize the slider (async)
        const initialized = await initializeSlider();

        if (!initialized) {
            return; // Exit if no slides
        }

        // Event listeners for buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                stopAutoSlide();
                nextSlide();
                startAutoSlide();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                stopAutoSlide();
                prevSlide();
                startAutoSlide();
            });
        }

        // Start auto-sliding
        startAutoSlide();

        // Pause auto-slide on hover
        heroSlider.addEventListener('mouseenter', stopAutoSlide);
        heroSlider.addEventListener('mouseleave', startAutoSlide);
    }
});

