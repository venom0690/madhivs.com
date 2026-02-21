// Settings Admin Script (PHP session-based auth)

document.addEventListener('DOMContentLoaded', async () => {
    // Check auth via authService
    if (typeof authService !== 'undefined' && !authService.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    const form = document.getElementById('settingsForm');
    const shippingInput = document.getElementById('shippingCost');
    const saveBtn = document.getElementById('saveBtn');

    // Load Settings
    try {
        const response = await fetch('/api/settings', { credentials: 'include' });
        const data = await response.json();

        if (data.status === 'success') {
            shippingInput.value = data.data.shipping_cost || 99;
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
        alert('Failed to load settings');
    }

    // Save Settings
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const updates = {
            shipping_cost: shippingInput.value
        };

        try {
            // Fetch CSRF token
            let csrfToken = '';
            try {
                const csrfResponse = await fetch('/api/csrf-token', { credentials: 'include' });
                const csrfData = await csrfResponse.json();
                csrfToken = csrfData.csrfToken || '';
            } catch (e) { console.warn('CSRF token fetch failed:', e); }

            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify(updates)
            });

            const data = await response.json();

            if (data.status === 'success') {
                alert('Settings updated successfully!');
            } else {
                alert('Failed to update: ' + data.message);
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('An error occurred while updating settings');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    });
});
