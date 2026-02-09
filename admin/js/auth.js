/**
 * Authentication Service for Admin Panel
 * Production JWT-based authentication
 */

const API_BASE_URL = window.location.origin + '/api';

const authService = {
    TOKEN_KEY: 'admin_auth_token',
    USER_KEY: 'admin_user',

    // Login with real backend
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token and user info
            localStorage.setItem(this.TOKEN_KEY, data.token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(data.data.user));

            return data.data.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Logout
    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        window.location.href = 'index.html';
    },

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        if (!token) return false;

        // Check token expiration (JWT structure: header.payload.signature)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp * 1000; // Convert to milliseconds
            if (Date.now() >= expiry) {
                this.logout();
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
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

    // Get auth token
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    // Require authentication - redirect if not logged in
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    // Verify token with server
    async verifyToken() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                this.logout();
                return false;
            }

            const data = await response.json();
            localStorage.setItem(this.USER_KEY, JSON.stringify(data.data.user));
            return true;
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    },
};
