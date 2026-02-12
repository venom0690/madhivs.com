const db = require('../db');
const fs = require('fs').promises;
const path = require('path');

// Safe JSON parse — prevents server crash from malformed DB data
function safeJsonParse(str, fallback = []) {
    if (!str) return fallback;
    try { return JSON.parse(str); } catch { return fallback; }
}

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
 * Get all products
 * GET /api/products
 */
exports.getAllProducts = async (req, res) => {
    try {
        const {
            category,
            subcategory,
            trending,
            popular,
            featured,
            men,
            women,
            search,
            limit,
            page
        } = req.query;

        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (category) {
            query += ' AND category_id = ?';
            params.push(category);
        }

        if (subcategory) {
            query += ' AND subcategory_id = ?';
            params.push(subcategory);
        }

        if (trending === 'true') {
            query += ' AND is_trending = 1';
        }

        if (popular === 'true') {
            query += ' AND is_popular = 1';
        }

        if (featured === 'true') {
            query += ' AND is_featured = 1';
        }

        if (men === 'true') {
            query += ' AND is_men_collection = 1';
        }

        if (women === 'true') {
            query += ' AND is_women_collection = 1';
        }

        if (search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC';

        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const [products] = await db.query(query, params);

        // Parse JSON fields
        const parsedProducts = products.map(product => ({
            ...product,
            images: safeJsonParse(product.images),
            sizes: safeJsonParse(product.sizes),
            colors: safeJsonParse(product.colors)
        }));

        res.status(200).json({
            status: 'success',
            results: parsedProducts.length,
            products: parsedProducts
        });

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching products'
        });
    }
};

/**
 * Get single product
 * GET /api/products/:idOrSlug
 */
exports.getProduct = async (req, res) => {
    try {
        const { idOrSlug } = req.params;

        let query = `
            SELECT p.*, 
                   c.name as category_name, 
                   c.type as category_type,
                   sc.name as subcategory_name
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            LEFT JOIN categories sc ON p.subcategory_id = sc.id
            WHERE `;
        let param;

        if (isNaN(idOrSlug)) {
            query += 'p.slug = ?';
            param = idOrSlug;
        } else {
            query += 'p.id = ?';
            param = parseInt(idOrSlug);
        }

        const [products] = await db.query(query, [param]);

        if (products.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
        }

        const product = products[0];

        // Parse JSON fields
        product.images = safeJsonParse(product.images);
        product.sizes = safeJsonParse(product.sizes);
        product.colors = safeJsonParse(product.colors);

        res.status(200).json({
            status: 'success',
            product
        });

    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred'
        });
    }
};

/**
 * Create product
 * POST /api/products
 */
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            discount_price,
            category_id,
            subcategory_id,
            stock,
            primary_image,
            images,
            sizes,
            colors,
            is_trending,
            is_popular,
            is_featured,
            is_men_collection,
            is_women_collection,
            seo_title,
            seo_description
        } = req.body;

        // Basic validation
        if (!name || !price || !category_id || !primary_image) {
            return res.status(400).json({
                status: 'error',
                message: 'Name, price, category, and primary image are required'
            });
        }

        // Validate subcategory belongs to category if provided
        if (subcategory_id) {
            const [subcategories] = await db.query(
                'SELECT id FROM categories WHERE id = ? AND parent_id = ?',
                [subcategory_id, category_id]
            );

            if (subcategories.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Subcategory does not belong to the selected category'
                });
            }
        }

        // Generate slug
        const slug = slugify(name);

        // Convert arrays to JSON
        const imagesJson = JSON.stringify(images || []);
        const sizesJson = JSON.stringify(sizes || []);
        const colorsJson = JSON.stringify(colors || []);

        // Insert product
        const [result] = await db.query(
            `INSERT INTO products (
                name, slug, description, price, discount_price, category_id, subcategory_id, stock,
                primary_image, images, sizes, colors,
                is_trending, is_popular, is_featured, is_men_collection, is_women_collection,
                seo_title, seo_description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, slug, description || null, price, discount_price || null, category_id, subcategory_id || null, stock || 0,
                primary_image, imagesJson, sizesJson, colorsJson,
                is_trending ? 1 : 0, is_popular ? 1 : 0, is_featured ? 1 : 0,
                is_men_collection ? 1 : 0, is_women_collection ? 1 : 0,
                seo_title || null, seo_description || null
            ]
        );

        // Get created product
        const [products] = await db.query(
            'SELECT * FROM products WHERE id = ?',
            [result.insertId]
        );

        const product = products[0];
        product.images = safeJsonParse(product.images);
        product.sizes = safeJsonParse(product.sizes);
        product.colors = safeJsonParse(product.colors);

        res.status(201).json({
            status: 'success',
            product
        });

    } catch (error) {
        console.error('Create product error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                status: 'error',
                message: 'A product with this name already exists'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'An error occurred while creating product'
        });
    }
};

/**
 * Update product
 * PUT /api/products/:id
 */
exports.updateProduct = async (req, res) => {
    try {
        const updates = [];
        const params = [];

        const allowedFields = [
            'name', 'description', 'price', 'discount_price', 'category_id', 'subcategory_id', 'stock',
            'primary_image', 'is_trending', 'is_popular', 'is_featured',
            'is_men_collection', 'is_women_collection', 'seo_title', 'seo_description'
        ];

        // Validate subcategory belongs to category if both are being updated
        if (req.body.subcategory_id !== undefined && req.body.subcategory_id !== null) {
            const categoryId = req.body.category_id;

            // If category_id is not in the update, fetch current category_id
            let targetCategoryId = categoryId;
            if (!categoryId) {
                const [currentProduct] = await db.query(
                    'SELECT category_id FROM products WHERE id = ?',
                    [req.params.id]
                );
                if (currentProduct.length > 0) {
                    targetCategoryId = currentProduct[0].category_id;
                }
            }

            if (targetCategoryId) {
                const [subcategories] = await db.query(
                    'SELECT id FROM categories WHERE id = ? AND parent_id = ?',
                    [req.body.subcategory_id, targetCategoryId]
                );

                if (subcategories.length === 0) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'Subcategory does not belong to the selected category'
                    });
                }
            }
        }

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                if (field === 'name') {
                    updates.push('name = ?', 'slug = ?');
                    params.push(req.body[field], slugify(req.body[field]));
                } else if (field.startsWith('is_')) {
                    updates.push(`${field} = ?`);
                    params.push(req.body[field] ? 1 : 0);
                } else {
                    updates.push(`${field} = ?`);
                    params.push(req.body[field]);
                }
            }
        }

        // Handle JSON fields
        if (req.body.images !== undefined) {
            updates.push('images = ?');
            params.push(JSON.stringify(req.body.images));
        }
        if (req.body.sizes !== undefined) {
            updates.push('sizes = ?');
            params.push(JSON.stringify(req.body.sizes));
        }
        if (req.body.colors !== undefined) {
            updates.push('colors = ?');
            params.push(JSON.stringify(req.body.colors));
        }

        if (updates.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No fields to update'
            });
        }

        params.push(req.params.id);

        await db.query(
            `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // Get updated product
        const [products] = await db.query(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
        }

        const product = products[0];
        product.images = JSON.parse(product.images);
        product.sizes = JSON.parse(product.sizes);
        product.colors = JSON.parse(product.colors);

        res.status(200).json({
            status: 'success',
            product
        });

    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while updating product'
        });
    }
};

/**
 * Delete product
 * DELETE /api/products/:id
 */
exports.deleteProduct = async (req, res) => {
    try {
        // Get product to find images
        const [products] = await db.query(
            'SELECT primary_image, images FROM products WHERE id = ?',
            [req.params.id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
        }

        const product = products[0];

        // Delete product from database
        await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);

        // Try to delete image files (don't fail if file deletion fails)
        try {
            const images = product.images ? JSON.parse(product.images) : [];
            for (const imagePath of images) {
                if (imagePath && imagePath.startsWith('/uploads/')) {
                    const filePath = path.join(__dirname, '..', imagePath);
                    await fs.unlink(filePath).catch(() => { });
                }
            }
        } catch (err) {
            console.log('Could not delete image files:', err.message);
        }

        res.status(200).json({
            status: 'success',
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while deleting product'
        });
    }
};
