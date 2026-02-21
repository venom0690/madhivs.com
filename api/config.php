<?php
/**
 * Secure Configuration Management
 * Loads configuration from environment variables or defaults
 */

// Prevent direct access
if (!defined('CONFIG_LOADED')) {
    define('CONFIG_LOADED', true);
}

// Database Configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'maadhivs_boutique');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

// Security Configuration
define('SESSION_LIFETIME', getenv('SESSION_LIFETIME') ?: 86400); // 24 hours default
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 900); // 15 minutes
define('CSRF_TOKEN_EXPIRY', 3600); // 1 hour

// Upload Configuration
define('UPLOAD_MAX_SIZE', 5 * 1024 * 1024); // 5MB
define('UPLOAD_ALLOWED_TYPES', ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);

// Environment
define('IS_PRODUCTION', getenv('ENVIRONMENT') === 'production');
define('DEBUG_MODE', !IS_PRODUCTION && (getenv('DEBUG') === 'true'));

// Error Reporting
if (IS_PRODUCTION) {
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
} else {
    ini_set('display_errors', DEBUG_MODE ? '1' : '0');
    ini_set('log_errors', '1');
    error_reporting(E_ALL);
}

// Timezone
date_default_timezone_set('Asia/Kolkata');

