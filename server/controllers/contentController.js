const db = require('../db');
const { safeJsonParse } = require('../utils/helpers');

// ==========================================
// HOMEPAGE SETTINGS
// ==========================================

exports.getHomepageParams = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT setting_value FROM settings WHERE setting_key = ?', ['homepage_config']);

        if (rows.length === 0) {
            return res.status(200).json({
                status: 'success',
                data: { sliderImages: [], trendingProductIds: [], popularProductIds: [] }
            });
        }

        // setting_value is already JSON type in MySQL 8, or string in older versions
        // If it's a string, parse it. If it's an object, return as is.
        let config = rows[0].setting_value;
        if (typeof config === 'string') {
            config = safeJsonParse(config, {});
        }

        res.status(200).json({
            status: 'success',
            data: config
        });
    } catch (error) {
        console.error('Get homepage error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch homepage settings' });
    }
};

exports.updateHomepageParams = async (req, res) => {
    try {
        const config = req.body;
        // Validate basic structure
        if (!config || typeof config !== 'object') {
            return res.status(400).json({ status: 'error', message: 'Invalid configuration data' });
        }

        // Upsert settings
        await db.execute(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            ['homepage_config', JSON.stringify(config), JSON.stringify(config)]
        );

        res.status(200).json({
            status: 'success',
            message: 'Homepage settings updated',
            data: config
        });
    } catch (error) {
        console.error('Update homepage error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update homepage settings' });
    }
};

// ==========================================
// SEARCH KEYWORDS
// ==========================================

exports.getKeywords = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM search_keywords ORDER BY created_at DESC');

        // Parse JSON fields
        const keywords = rows.map(row => ({
            ...row,
            linkedProducts: typeof row.linked_products === 'string' ? safeJsonParse(row.linked_products) : (row.linked_products || []),
            linkedCategories: typeof row.linked_categories === 'string' ? safeJsonParse(row.linked_categories) : (row.linked_categories || [])
        }));

        res.status(200).json({
            status: 'success',
            data: keywords
        });
    } catch (error) {
        console.error('Get keywords error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch keywords' });
    }
};

exports.createKeyword = async (req, res) => {
    try {
        const { keyword, linkedProducts, linkedCategories } = req.body;

        if (!keyword) {
            return res.status(400).json({ status: 'error', message: 'Keyword is required' });
        }

        const [result] = await db.execute(
            'INSERT INTO search_keywords (keyword, linked_products, linked_categories) VALUES (?, ?, ?)',
            [keyword.toLowerCase(), JSON.stringify(linkedProducts || []), JSON.stringify(linkedCategories || [])]
        );

        res.status(201).json({
            status: 'success',
            data: {
                id: result.insertId,
                keyword,
                linkedProducts: linkedProducts || [],
                linkedCategories: linkedCategories || []
            }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'error', message: 'Keyword already exists' });
        }
        console.error('Create keyword error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create keyword' });
    }
};

exports.updateKeyword = async (req, res) => {
    try {
        const { id } = req.params;
        const { keyword, linkedProducts, linkedCategories } = req.body;

        if (!keyword) {
            return res.status(400).json({ status: 'error', message: 'Keyword is required' });
        }

        await db.execute(
            'UPDATE search_keywords SET keyword = ?, linked_products = ?, linked_categories = ? WHERE id = ?',
            [keyword.toLowerCase(), JSON.stringify(linkedProducts || []), JSON.stringify(linkedCategories || []), id]
        );

        res.status(200).json({
            status: 'success',
            data: { id, keyword, linkedProducts, linkedCategories }
        });
    } catch (error) {
        console.error('Update keyword error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update keyword' });
    }
};

exports.deleteKeyword = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM search_keywords WHERE id = ?', [id]);
        res.status(200).json({ status: 'success', message: 'Keyword deleted' });
    } catch (error) {
        console.error('Delete keyword error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete keyword' });
    }
};
