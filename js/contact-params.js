// Contact Form URL Parameter Handler
// Handles pre-selection of inquiry type based on URL parameter

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const inquiry = urlParams.get('inquiry');
    const inquirySelect = document.getElementById('inquiryType');

    if (inquiry && inquirySelect) {
        // Map URL parameters to select options
        const valueMap = {
            'custom': 'custom',
            'styling': 'styling',
            'general': 'general',
            'bulk': 'bulk'
        };

        const selectValue = valueMap[inquiry.toLowerCase()];

        if (selectValue) {
            inquirySelect.value = selectValue;

            // Add visual feedback
            inquirySelect.style.borderColor = 'var(--color-accent)';
            setTimeout(() => {
                inquirySelect.style.borderColor = '';
            }, 2000);
        }
    }
});
