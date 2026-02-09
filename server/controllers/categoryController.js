const db = require('../db');

// Simple slugify function
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

/**
 * Get all categories
 * GET /api/categories
 */
exports.getAllCategories = async (req, res) => {
    try {
        const { type } = req.query;

        let query = 'SELECT * FROM categories WHERE is_active = 1';
        const params = [];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY created_at DESC';

        const [categories] = await db.query(query, params);

        res.status(200).json({
            status: 'success',
            results: categories.length,
            categories
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching categories'
        });
    }
};

/**
 * Get single category
 * GET /api/categories/:id
 */
exports.getCategory = async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT * FROM categories WHERE id = ?',
            [req.params.id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Category not found'
            });
        }

        res.status(200).json({
            status: 'success',
            category: categories[0]
        });

    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred'
        });
    }
};

/**
 * Create category
 * POST /api/categories
 */
exports.createCategory = async (req, res) => {
    try {
        const { name, type, description, image } = req.body;

        // Basic validation
        if (!name || !type) {
            return res.status(400).json({
                status: 'error',
                message: 'Name and type are required'
            });
        }

        // Generate slug
        const slug = slugify(name);

        // Insert category
        const [result] = await db.query(
            'INSERT INTO categories (name, slug, type, description, image) VALUES (?, ?, ?, ?, ?)',
            [name, slug, type, description || null, image || null]
        );

        // Get created category
        const [categories] = await db.query(
            'SELECT * FROM categories WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            status: 'success',
            category: categories[0]
        });

    } catch (error) {
        console.error('Create category error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                status: 'error',
                message: 'A category with this name already exists'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'An error occurred while creating category'
        });
    }
};

/**
 * Update category
 * PUT /api/categories/:id
 */
exports.updateCategory = async (req, res) => {
    try {
        const { name, type, description, image, is_active } = req.body;

        const updates = [];
        const params = [];

        if (name) {
            updates.push('name = ?');
            params.push(name);
            updates.push('slug = ?');
            params.push(slugify(name));
        }
        if (type) {
            updates.push('type = ?');
            params.push(type);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        if (image !== undefined) {
            updates.push('image = ?');
            params.push(image);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No fields to update'
            });
        }

        params.push(req.params.id);

        await db.query(
            `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // Get updated category
        const [categories] = await db.query(
            'SELECT * FROM categories WHERE id = ?',
            [req.params.id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Category not found'
            });
        }

        res.status(200).json({
            status: 'success',
            category: categories[0]
        });

    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while updating category'
        });
    }
};

/**
 * Delete category
 * DELETE /api/categories/:id
 */
exports.deleteCategory = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM categories WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Category not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Category deleted successfully'
        });

    } catch (error) {
        console.error('Delete category error:', error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot delete category because it has products'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'An error occurred while deleting category'
        });
    }
};
