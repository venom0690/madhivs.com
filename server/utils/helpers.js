
/**
 * Create a URL-friendly slug from a string
 * @param {string} text 
 * @returns {string}
 */
exports.slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-');        // Replace multiple - with single -
};

/**
 * Safely parse JSON with a fallback
 * @param {string} str 
 * @param {any} fallback 
 * @returns {any}
 */
exports.safeJsonParse = (str, fallback = []) => {
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch {
        return fallback;
    }
};
