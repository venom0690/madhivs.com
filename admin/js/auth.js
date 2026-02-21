/**
 * Authentication Service for Admin Panel
 * PHP Session-based authentication
 */

const API_BASE_URL = window.location.origin + '/api';

const authService = {
    TOKEN_KEY: 'adminToken',
    USER_KEY: 'admin_user',

    // Login with PHP backend (session-based)
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Send/receive session cookies
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token (session ID) and user info for backward compatibility
            // Backend returns: { status, token (session_id), admin: { id, name, email } }
            localStorage.setItem(this.TOKEN_KEY, data.token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(data.admin));

            return data.admin;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Logout
    async logout() {
        try {
            await fetch(`${API_BASE_URL}/admin/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (e) {
            // Ignore logout API errors
        }
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        window.location.href = 'index.html';
    },

    // Check if user is authenticated (client-side check)
    isAuthenticated() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        const user = localStorage.getItem(this.USER_KEY);
        return !!(token && user);
    },

    // Get current user
    getCurrentUser() {
        try {
            const user = localStorage.getItem(this.USER_KEY);
            return user ? JSON.parse(user) : null;
        } catch (error) {
            return null;
        }
    },

    // Get auth token (session ID — kept for backward compat)
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    // Require authentication - redirect if not logged in
    async requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }

        // Verify session with server
        try {
            const isValid = await this.verifyToken();
            if (!isValid) {
                window.location.href = 'index.html';
                return false;
            }
            return true;
        } catch (error) {
            console.error('Session verification failed:', error);
            window.location.href = 'index.html';
            return false;
        }
    },

    // Verify session with server (PHP session cookie)
    async verifyToken() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/me`, {
                credentials: 'include', // Send session cookie
            });

            if (!response.ok) {
                this.logout();
                return false;
            }

            // Backend returns: { status, admin: { id, name, email, created_at } }
            const data = await response.json();
            localStorage.setItem(this.USER_KEY, JSON.stringify(data.admin));
            return true;
        } catch (error) {
            console.error('Session verification error:', error);
            return false;
        }
    },

    // Redirect to dashboard if already authenticated (for login page)
    redirectIfAuthenticated() {
        if (this.isAuthenticated()) {
            window.location.href = 'dashboard.html';
        }
    },
};
