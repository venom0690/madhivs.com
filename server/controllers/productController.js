const db = require('../db');
const fs = require('fs').promises;
const path = require('path');
const { slugify, safeJsonParse } = require('../utils/helpers');
const { validateText, sanitizeInput } = require('../utils/validators');

/**
 * Get all products
 * GET /api/products
 * FIX #2: SQL injection prevention (validate integer category IDs)
 * FIX #11: Pagination support
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

        // FIX #17: Join with categories to get name/slug/type for frontend mapping
        let query = `
            SELECT p.*,
                   c.name as category_name,
                   c.slug as category_slug,
                   c.type as category_type
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE 1=1
        `;

        // Alias products as p for count query too, so SHARED WHERE clauses work
        let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE 1=1';

        const params = [];
        const countParams = [];

        // FIX #2: Validate category ID is numeric before using
        if (category) {
            let categoryIdNum = parseInt(category);

            // FIX #18: Resolve slug if category is not a number
            if (isNaN(categoryIdNum)) {
                const [catRows] = await db.query('SELECT id FROM categories WHERE slug = ?', [category]);
                if (catRows.length > 0) {
                    categoryIdNum = catRows[0].id;
                } else {
                    return res.status(404).json({
                        status: 'error',
                        message: 'Category not found'
                    });
                }
            }

            if (categoryIdNum < 1) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid category ID'
                });
            }

            const categoryIds = await getCategoryWithDescendants(categoryIdNum);

            // FIX #2: Validate all returned IDs are safe integers
            const validIds = categoryIds.filter(id => Number.isInteger(id) && id > 0);

            if (validIds.length > 0) {
                const placeholders = validIds.map(() => '?').join(',');
                // Qualify columns with p.
                const clause = ` AND (p.category_id IN (${placeholders}) OR p.subcategory_id IN (${placeholders}))`;
                query += clause;
                countQuery += clause;
                params.push(...validIds, ...validIds);
                countParams.push(...validIds, ...validIds);
            } else {
                query += ' AND 1=0';
                countQuery += ' AND 1=0';
            }
        }

        if (subcategory) {
            const subIdNum = parseInt(subcategory);
            if (isNaN(subIdNum) || subIdNum < 1) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid subcategory ID'
                });
            }
            query += ' AND p.subcategory_id = ?';
            countQuery += ' AND p.subcategory_id = ?';
            params.push(subIdNum);
            countParams.push(subIdNum);
        }

        if (trending === 'true') {
            query += ' AND p.is_trending = 1';
            countQuery += ' AND p.is_trending = 1';
        }

        if (popular === 'true') {
            query += ' AND p.is_popular = 1';
            countQuery += ' AND p.is_popular = 1';
        }

        if (featured === 'true') {
            query += ' AND p.is_featured = 1';
            countQuery += ' AND p.is_featured = 1';
        }

        if (men === 'true') {
            query += ' AND p.is_men_collection = 1';
            countQuery += ' AND p.is_men_collection = 1';
        }

        if (women === 'true') {
            query += ' AND p.is_women_collection = 1';
            countQuery += ' AND p.is_women_collection = 1';
        }

        if (search) {
            // Limit search term length
            const sanitizedSearch = search.toString().substring(0, 200);
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            const searchTerm = `%${sanitizedSearch}%`;
            params.push(searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY p.created_at DESC';

        // FIX #11: Pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const offset = (pageNum - 1) * limitNum;

        // Get total count
        const [countResult] = await db.query(countQuery, countParams);
        const total = countResult[0].total;

        query += ' LIMIT ? OFFSET ?';
        params.push(limitNum, offset);

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
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
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
 * Get category ID and all its descendant IDs
 * Used for hierarchical product filtering
 * FIX #1: Added depth limit + visited set to prevent infinite recursion
 */
async function getCategoryWithDescendants(categoryId, maxDepth = 20) {
    const ids = [parseInt(categoryId)];
    const visited = new Set();

    async function findChildren(parentId, currentDepth) {
        if (currentDepth > maxDepth) {
            console.warn(`Max depth ${maxDepth} reached in product filter`);
            return;
        }

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
            ids.push(child.id);
            await findChildren(child.id, currentDepth + 1);
        }
    }

    await findChildren(categoryId, 0);
    return ids;
}

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
                   c.slug as category_slug,
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

        // Input validation
        if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 200) {
            return res.status(400).json({
                status: 'error',
                message: 'Product name is required (2-200 characters)'
            });
        }

        // Validate and sanitize description
        if (description) {
            const descValidation = validateText(description, 0, 5000);
            if (!descValidation.valid) {
                return res.status(400).json({
                    status: 'error',
                    message: `Description: ${descValidation.error}`
                });
            }
        }

        // Sanitize text inputs
        const sanitizedName = sanitizeInput(name);
        const sanitizedDescription = description ? sanitizeInput(description) : null;

        const priceNum = parseFloat(price);
        if (!price || isNaN(priceNum) || priceNum <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid price is required'
            });
        }

        if (!category_id) {
            return res.status(400).json({
                status: 'error',
                message: 'Category is required'
            });
        }

        if (!primary_image) {
            return res.status(400).json({
                status: 'error',
                message: 'Primary image is required'
            });
        }

        // Validate discount price if provided
        if (discount_price !== undefined && discount_price !== null) {
            const discountNum = parseFloat(discount_price);
            if (isNaN(discountNum) || discountNum < 0 || discountNum >= priceNum) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Discount price must be less than original price'
                });
            }
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
        const slug = slugify(sanitizedName);

        // Convert arrays to JSON safely
        const imagesJson = JSON.stringify(Array.isArray(images) ? images : []);
        const sizesJson = JSON.stringify(Array.isArray(sizes) ? sizes : []);
        const colorsJson = JSON.stringify(Array.isArray(colors) ? colors : []);

        // Insert product
        const [result] = await db.query(
            `INSERT INTO products (
                name, slug, description, price, discount_price, category_id, subcategory_id, stock,
                primary_image, images, sizes, colors,
                is_trending, is_popular, is_featured, is_men_collection, is_women_collection,
                seo_title, seo_description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sanitizedName, slug, sanitizedDescription, priceNum, discount_price || null,
                category_id, subcategory_id || null, parseInt(stock) || 0,
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
                    const trimmedName = req.body[field].toString().trim();
                    if (trimmedName.length < 2 || trimmedName.length > 200) {
                        return res.status(400).json({
                            status: 'error',
                            message: 'Product name must be 2-200 characters'
                        });
                    }
                    updates.push('name = ?', 'slug = ?');
                    params.push(trimmedName, slugify(trimmedName));
                } else if (field === 'price') {
                    const priceNum = parseFloat(req.body[field]);
                    if (isNaN(priceNum) || priceNum <= 0) {
                        return res.status(400).json({
                            status: 'error',
                            message: 'Price must be a positive number'
                        });
                    }
                    updates.push('price = ?');
                    params.push(priceNum);
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
            params.push(JSON.stringify(Array.isArray(req.body.images) ? req.body.images : []));
        }
        if (req.body.sizes !== undefined) {
            updates.push('sizes = ?');
            params.push(JSON.stringify(Array.isArray(req.body.sizes) ? req.body.sizes : []));
        }
        if (req.body.colors !== undefined) {
            updates.push('colors = ?');
            params.push(JSON.stringify(Array.isArray(req.body.colors) ? req.body.colors : []));
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
        // FIX: Use safeJsonParse instead of raw JSON.parse (crash prevention)
        product.images = safeJsonParse(product.images);
        product.sizes = safeJsonParse(product.sizes);
        product.colors = safeJsonParse(product.colors);

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
            const images = safeJsonParse(product.images, []);
            for (const imagePath of images) {
                if (imagePath && typeof imagePath === 'string' && imagePath.startsWith('/uploads/') && !imagePath.includes('..')) {
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
