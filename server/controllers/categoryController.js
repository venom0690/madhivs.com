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
        const { type, nested } = req.query;

        let query = 'SELECT * FROM categories WHERE is_active = 1';
        const params = [];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY parent_id, name';

        const [categories] = await db.query(query, params);

        // If nested format is requested, group subcategories under parents
        if (nested === 'true') {
            const parentCategories = categories.filter(cat => !cat.parent_id);
            const nestedCategories = parentCategories.map(parent => {
                const subcategories = categories.filter(cat => cat.parent_id === parent.id);
                return {
                    ...parent,
                    subcategories
                };
            });

            res.status(200).json({
                status: 'success',
                results: nestedCategories.length,
                categories: nestedCategories
            });
        } else {
            // Return flat list
            res.status(200).json({
                status: 'success',
                results: categories.length,
                categories
            });
        }

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
        const { name, type, description, image, parent_id } = req.body;

        // Basic validation
        if (!name || !type) {
            return res.status(400).json({
                status: 'error',
                message: 'Name and type are required'
            });
        }

        // If parent_id is provided, verify parent category exists
        if (parent_id) {
            const [parentCategories] = await db.query(
                'SELECT id FROM categories WHERE id = ?',
                [parent_id]
            );

            if (parentCategories.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Parent category not found'
                });
            }
        }

        // Generate slug
        const slug = slugify(name);

        // Insert category
        const [result] = await db.query(
            'INSERT INTO categories (name, slug, type, description, image, parent_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, slug, type, description || null, image || null, parent_id || null]
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
        const { name, type, description, image, is_active, parent_id } = req.body;

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
        if (parent_id !== undefined) {
            // Validate parent exists if not null
            if (parent_id !== null) {
                const [parentCategories] = await db.query(
                    'SELECT id FROM categories WHERE id = ?',
                    [parent_id]
                );
                if (parentCategories.length === 0) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'Parent category not found'
                    });
                }
            }
            updates.push('parent_id = ?');
            params.push(parent_id);
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
