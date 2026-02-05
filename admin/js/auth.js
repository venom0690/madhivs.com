/**
 * Authentication & Session Management
 * Mock JWT implementation using localStorage
 * Ready for backend integration
 */

const authService = {
    // Storage keys
    TOKEN_KEY: 'admin_auth_token',
    USER_KEY: 'admin_user',

    // Mock admin credentials (replace with backend API)
    ADMIN_CREDENTIALS: {
        email: 'admin@maadhivs.com',
        password: 'admin123'
    },

    // Generate mock JWT token
    _generateToken(email) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            email: email,
            role: 'admin',
            iat: Date.now(),
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }));
        const signature = btoa('mock_signature_' + Date.now());

        return `${header}.${payload}.${signature}`;
    },

    // Decode token
    _decodeToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const payload = JSON.parse(atob(parts[1]));
            return payload;
        } catch (error) {
            return null;
        }
    },

    // Check if token is valid
    _isTokenValid(token) {
        const payload = this._decodeToken(token);
        if (!payload) return false;

        // Check expiration
        if (payload.exp < Date.now()) {
            return false;
        }

        return true;
    },

    /**
     * Login
     * API endpoint: POST /api/auth/login
     * Body: { email, password }
     * Response: { token, user: { email, role } }
     */
    login(email, password) {
        // Mock validation (replace with API call)
        if (email === this.ADMIN_CREDENTIALS.email &&
            password === this.ADMIN_CREDENTIALS.password) {

            const token = this._generateToken(email);
            const user = {
                email: email,
                role: 'admin'
            };

            // Store in localStorage
            localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));

            return { success: true, token, user };
        }

        return { success: false, error: 'Invalid credentials' };
    },

    /**
     * Logout
     * API endpoint: POST /api/auth/logout
     */
    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        window.location.href = 'index.html';
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        if (!token) return false;

        return this._isTokenValid(token);
    },

    /**
     * Get current user
     */
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem(this.USER_KEY);
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            return null;
        }
    },

    /**
     * Get auth token
     */
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    /**
     * Auth guard - redirect to login if not authenticated
     * Call this on every admin page except login page
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    /**
     * Redirect to dashboard if already authenticated
     * Call this on login page
     */
    redirectIfAuthenticated() {
        if (this.isAuthenticated()) {
            window.location.href = 'dashboard.html';
            return true;
        }
        return false;
    }
};

// Auto-logout on token expiration
setInterval(() => {
    if (!authService.isAuthenticated() &&
        localStorage.getItem(authService.TOKEN_KEY)) {
        authService.logout();
    }
}, 60000); // Check every minute
