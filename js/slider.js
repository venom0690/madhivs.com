// Hero Slider Functionality - Dynamic
document.addEventListener('DOMContentLoaded', async function () {
    const heroSlider = document.getElementById('heroSlider');

    if (heroSlider) {
        let slides;
        let currentSlide = 0;
        let autoSlideInterval;

        /**
         * Initialize slider with API data
         */
        async function initializeSlider() {
            try {
                // Fetch featured products for slider
                const featuredProducts = await ProductService.getProducts({ featured: 'true', limit: 5 });

                if (featuredProducts && featuredProducts.length > 0) {
                    // Clear existing slides
                    const existingSlides = heroSlider.querySelectorAll('.hero-slide');
                    existingSlides.forEach(slide => slide.remove());

                    // Create slides from featured products
                    featuredProducts.forEach((product, index) => {
                        const slideDiv = document.createElement('div');
                        slideDiv.className = 'hero-slide';
                        if (index === 0) {
                            slideDiv.classList.add('active');
                        }

                        // Use primary image
                        const img = document.createElement('img');
                        img.src = product.primary_image || product.image || 'assets/images/placeholder.jpg';
                        img.alt = product.name;

                        // Optional: Add caption
                        const caption = document.createElement('div');
                        caption.className = 'hero-caption';
                        caption.innerHTML = `
                            <h2>${product.name}</h2>
                            <a href="product.html?id=${product.id}" class="btn">Shop Now</a>
                        `;
                        // Note: You might need CSS for .hero-caption if not already present, 
                        // or just stick to images if the design dictates. 
                        // For now, let's stick to images to match previous logic, 
                        // but maybe add a data-link to the slide click?

                        slideDiv.appendChild(img);

                        // Make slide clickable
                        slideDiv.style.cursor = 'pointer';
                        slideDiv.addEventListener('click', () => {
                            window.location.href = `product.html?id=${product.id}`;
                        });

                        // Insert before controls
                        const controls = heroSlider.querySelector('.slider-controls');
                        if (controls) {
                            heroSlider.insertBefore(slideDiv, controls);
                        } else {
                            heroSlider.appendChild(slideDiv);
                        }
                    });
                } else {
                    console.warn('No featured products found for slider.');
                    // Fallback to maintain static HTML if it exists, or show nothing
                    const existingSlides = heroSlider.querySelectorAll('.hero-slide');
                    if (existingSlides.length === 0) return false;
                }
            } catch (error) {
                console.error('Error initializing slider:', error);
                // Fallback to static HTML if validation fails
                const existingSlides = heroSlider.querySelectorAll('.hero-slide');
                if (existingSlides.length === 0) return false;
            }

            // Get all slides
            slides = heroSlider.querySelectorAll('.hero-slide');
            return slides.length > 0;
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
            stopAutoSlide(); // Ensure clear before start
            autoSlideInterval = setInterval(nextSlide, 5000);
        }

        // Stop auto slide
        function stopAutoSlide() {
            if (autoSlideInterval) {
                clearInterval(autoSlideInterval);
                autoSlideInterval = null;
            }
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
            nextBtn.addEventListener('click', function (e) {
                e.preventDefault();
                stopAutoSlide();
                nextSlide();
                startAutoSlide();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', function (e) {
                e.preventDefault();
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

