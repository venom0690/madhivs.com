/**
 * Security Utilities for Admin Panel
 */

/**
 * Escape HTML to prevent XSS attacks
 * Use this instead of innerHTML when displaying user-generated content
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Safely set text content (preferred over innerHTML)
 */
function setTextContent(element, text) {
    if (element) {
        element.textContent = text || '';
    }
}

/**
 * Create element with safe text content
 */
function createElementWithText(tag, text, className = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text || '';
    return el;
}

/**
 * CSRF Token Management
 */
let csrfToken = null;

async function getCsrfToken() {
    if (csrfToken) return csrfToken;
    
    try {
        const response = await fetch('/api/csrf-token');
        const data = await response.json();
        csrfToken = data.csrfToken;
        return csrfToken;
    } catch (error) {
        console.error('Failed to get CSRF token:', error);
        return null;
    }
}

/**
 * Fetch with CSRF token
 * Use this for all POST/PUT/DELETE requests
 */
async function fetchWithCsrf(url, options = {}) {
    const token = await getCsrfToken();
    
    const headers = {
        ...options.headers,
    };
    
    if (token && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE' || options.method === 'PATCH')) {
        headers['X-CSRF-Token'] = token;
    }
    
    return fetch(url, {
        ...options,
        headers,
    });
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
if (!document.getElementById('utils-styles')) {
    const style = document.createElement('style');
    style.id = 'utils-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}
