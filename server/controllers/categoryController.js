const db = require('../db');
const { slugify } = require('../utils/helpers');

// Valid category types (matches ENUM in schema)
const VALID_TYPES = ['Men', 'Women', 'Accessories', 'General'];

/**
 * Get all categories
 * GET /api/categories
 * Query params:
 *   - type: filter by type (Men, Women, General)
 *   - nested: if 'true', return recursive tree structure
 */
exports.getAllCategories = async (req, res) => {
    try {
        const { type, nested } = req.query;

        let query = 'SELECT * FROM categories WHERE is_active = 1';
        const params = [];

        if (type) {
            // FIX #4: Validate type against ENUM
            if (!VALID_TYPES.includes(type)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Type must be one of: Men, Women, Accessories, General'
                });
            }
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY name';

        const [categories] = await db.query(query, params);

        // If nested format is requested, build recursive tree structure
        if (nested === 'true') {
            // FIX #3: Use optimized tree builder with Map index + depth limit
            const tree = buildCategoryTree(categories);

            res.status(200).json({
                status: 'success',
                results: tree.length,
                categories: tree
            });
        } else {
            // Return flat list (backward compatible)
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
 * FIX #3: Optimized recursive category tree builder
 * Uses Map index for O(n) performance instead of O(n²)
 * Includes depth limit to prevent stack overflow
 */
function buildCategoryTree(categories, maxDepth = 10) {
    // Pre-index children by parent_id for O(1) lookup
    const childrenMap = new Map();
    for (const cat of categories) {
        const pid = cat.parent_id;
        if (!childrenMap.has(pid)) {
            childrenMap.set(pid, []);
        }
        childrenMap.get(pid).push(cat);
    }

    function buildLevel(parentId, depth) {
        if (depth > maxDepth) {
            console.warn(`Category tree max depth ${maxDepth} exceeded`);
            return [];
        }

        const children = childrenMap.get(parentId) || [];
        const tree = [];

        for (const category of children) {
            const node = {
                id: category.id,
                name: category.name,
                slug: category.slug,
                type: category.type,
                description: category.description,
                image: category.image,
                is_active: category.is_active,
                parent_id: category.parent_id,
                created_at: category.created_at,
                updated_at: category.updated_at
            };

            const grandchildren = buildLevel(category.id, depth + 1);
            if (grandchildren.length > 0) {
                node.children = grandchildren;
            }

            tree.push(node);
        }

        return tree;
    }

    return buildLevel(null, 0);
}

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
 * FIX #4: Full input validation
 */
exports.createCategory = async (req, res) => {
    try {
        const { name, type, description, image, parent_id } = req.body;

        // Validate name
        if (!name || typeof name !== 'string') {
            return res.status(400).json({
                status: 'error',
                message: 'Name is required and must be a string'
            });
        }

        const trimmedName = name.trim();
        if (trimmedName.length < 2 || trimmedName.length > 100) {
            return res.status(400).json({
                status: 'error',
                message: 'Name must be between 2 and 100 characters'
            });
        }

        // Validate type against ENUM
        if (!type || !VALID_TYPES.includes(type)) {
            return res.status(400).json({
                status: 'error',
                message: 'Type must be one of: Men, Women, Accessories, General'
            });
        }

        // Validate description length
        if (description && description.length > 500) {
            return res.status(400).json({
                status: 'error',
                message: 'Description cannot exceed 500 characters'
            });
        }

        // Validate image path (prevent path traversal)
        if (image && (image.includes('..') || (!image.startsWith('/uploads/') && image !== ''))) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid image path'
            });
        }

        // Validate parent_id if provided
        if (parent_id !== undefined && parent_id !== null && parent_id !== '') {
            const parentIdNum = parseInt(parent_id);
            if (isNaN(parentIdNum) || parentIdNum < 1) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid parent category ID'
                });
            }

            const [parentCategories] = await db.query(
                'SELECT id, type FROM categories WHERE id = ?',
                [parentIdNum]
            );

            if (parentCategories.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Parent category not found'
                });
            }
        }

        // Generate slug
        const slug = slugify(trimmedName);

        // Insert category
        const [result] = await db.query(
            'INSERT INTO categories (name, slug, type, description, image, parent_id) VALUES (?, ?, ?, ?, ?, ?)',
            [trimmedName, slug, type, description || null, image || null, parent_id || null]
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
            const trimmedName = name.trim();
            if (trimmedName.length < 2 || trimmedName.length > 100) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Name must be between 2 and 100 characters'
                });
            }
            updates.push('name = ?');
            params.push(trimmedName);
            updates.push('slug = ?');
            params.push(slugify(trimmedName));
        }
        if (type) {
            if (!VALID_TYPES.includes(type)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Type must be one of: Men, Women, Accessories, General'
                });
            }
            updates.push('type = ?');
            params.push(type);
        }
        if (description !== undefined) {
            if (description && description.length > 500) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Description cannot exceed 500 characters'
                });
            }
            updates.push('description = ?');
            params.push(description);
        }
        if (image !== undefined) {
            if (image && image.includes('..')) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid image path'
                });
            }
            updates.push('image = ?');
            params.push(image);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active ? 1 : 0);
        }
        if (parent_id !== undefined) {
            // Convert empty string to null
            const parentIdValue = parent_id === '' || parent_id === null ? null : parent_id;

            // Prevent circular reference
            if (parentIdValue !== null) {
                // Prevent setting parent to self
                if (parseInt(parentIdValue) === parseInt(req.params.id)) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'Category cannot be its own parent'
                    });
                }

                // Prevent setting parent to own descendant (would create circular reference)
                const descendants = await getCategoryDescendants(req.params.id);
                if (descendants.includes(parseInt(parentIdValue))) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'Cannot set parent to a descendant category (circular reference)'
                    });
                }

                // Validate parent exists
                const [parentCategories] = await db.query(
                    'SELECT id FROM categories WHERE id = ?',
                    [parentIdValue]
                );
                if (parentCategories.length === 0) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'Parent category not found'
                    });
                }
            }
            updates.push('parent_id = ?');
            params.push(parentIdValue);
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
 * FIX #1: Get all descendant category IDs recursively
 * Now with depth limit + visited set to prevent infinite recursion
 */
async function getCategoryDescendants(categoryId, maxDepth = 20) {
    const descendants = [];
    const visited = new Set();

    async function findChildren(parentId, currentDepth) {
        // Prevent infinite recursion
        if (currentDepth > maxDepth) {
            console.warn(`Max depth ${maxDepth} reached for category ${categoryId}`);
            return;
        }

        // Prevent circular references
        if (visited.has(parentId)) {
            console.warn(`Circular reference detected at category ${parentId}`);
            return;
        }

        visited.add(parentId);

        const [children] = await db.query(
            'SELECT id FROM categories WHERE parent_id = ?',
            [parentId]
        );

        for (const child of children) {
            descendants.push(child.id);
            await findChildren(child.id, currentDepth + 1);
        }
    }

    await findChildren(categoryId, 0);
    return descendants;
}

// Export for use in productController
exports.getCategoryDescendants = getCategoryDescendants;

/**
 * Delete category
 * DELETE /api/categories/:id
 * FIX #12: Check for children and products before deleting
 */
exports.deleteCategory = async (req, res) => {
    try {
        // Check if category has children
        const [children] = await db.query(
            'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
            [req.params.id]
        );

        if (children[0].count > 0) {
            return res.status(400).json({
                status: 'error',
                message: `Cannot delete category with ${children[0].count} subcategories. Delete or reassign children first.`
            });
        }

        // Check if category has products
        const [products] = await db.query(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ? OR subcategory_id = ?',
            [req.params.id, req.params.id]
        );

        if (products[0].count > 0) {
            return res.status(400).json({
                status: 'error',
                message: `Cannot delete category with ${products[0].count} products. Reassign products first.`
            });
        }

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
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while deleting category'
        });
    }
};
