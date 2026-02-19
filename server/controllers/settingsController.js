const db = require('../db');

/**
 * Get all settings
 * GET /api/settings
 */
exports.getSettings = async (req, res) => {
    try {
        const [settings] = await db.query('SELECT setting_key, setting_value FROM settings');

        // Convert array to object
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.setting_key] = s.setting_value;
        });

        res.status(200).json({
            status: 'success',
            data: settingsObj
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch settings'
        });
    }
};

/**
 * Update settings (Admin only)
 * PUT /api/settings
 */
exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body; // { shipping_cost: "150", ... }

        const updatePromises = Object.keys(updates).map(async (key) => {
            // Check if key exists
            const [existing] = await db.query('SELECT id FROM settings WHERE setting_key = ?', [key]);

            if (existing.length > 0) {
                return db.query('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [updates[key], key]);
            } else {
                return db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, updates[key]]);
            }
        });

        await Promise.all(updatePromises);

        res.status(200).json({
            status: 'success',
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update settings'
        });
    }
};
