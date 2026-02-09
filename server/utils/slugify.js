const slugifyLib = require('slugify');

/**
 * Generate URL-friendly slug from text
 * @param {string} text - Text to slugify
 * @returns {string} - URL-friendly slug
 */
const slugify = (text) => {
    return slugifyLib(text, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g
    });
};

/**
 * Generate unique slug by appending random string if needed
 * @param {string} text - Text to slugify
 * @param {Function} checkExists - Async function to check if slug exists
 * @returns {Promise<string>} - Unique slug
 */
const generateUniqueSlug = async (text, checkExists) => {
    let slug = slugify(text);
    let exists = await checkExists(slug);

    if (!exists) {
        return slug;
    }

    // Append random string if slug exists
    let counter = 1;
    while (exists) {
        const newSlug = `${slug}-${counter}`;
        exists = await checkExists(newSlug);
        if (!exists) {
            return newSlug;
        }
        counter++;

        // Safety limit
        if (counter > 100) {
            return `${slug}-${Date.now()}`;
        }
    }

    return slug;
};

module.exports = {
    slugify,
    generateUniqueSlug
};
