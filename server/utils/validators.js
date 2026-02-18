/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
exports.isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate phone number format
 * Accepts international formats with proper validation
 * @param {string} phone 
 * @returns {boolean}
 */
exports.isValidPhone = (phone) => {
    if (!phone || typeof phone !== 'string') return false;
    
    // Remove spaces and dashes for validation
    const cleaned = phone.replace(/[\s\-]/g, '');
    
    // Must start with + or digit, 10-15 digits total
    // Allows international format: +1234567890 or local: 1234567890
    return /^\+?\d{10,15}$/.test(cleaned);
};

/**
 * Sanitize string input to prevent XSS
 * Removes HTML tags and dangerous characters
 * @param {string} input 
 * @returns {string}
 */
exports.sanitizeInput = (input) => {
    if (!input || typeof input !== 'string') return '';
    
    return input
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
        .trim();
};

/**
 * Validate and sanitize text input with length limits
 * @param {string} input 
 * @param {number} minLength 
 * @param {number} maxLength 
 * @returns {object} { valid: boolean, sanitized: string, error: string }
 */
exports.validateText = (input, minLength = 1, maxLength = 1000) => {
    if (!input || typeof input !== 'string') {
        return { valid: false, sanitized: '', error: 'Input is required' };
    }
    
    const sanitized = exports.sanitizeInput(input);
    
    if (sanitized.length < minLength) {
        return { valid: false, sanitized, error: `Minimum length is ${minLength} characters` };
    }
    
    if (sanitized.length > maxLength) {
        return { valid: false, sanitized, error: `Maximum length is ${maxLength} characters` };
    }
    
    return { valid: true, sanitized, error: null };
};
