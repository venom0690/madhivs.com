const db = require('./db');

(async () => {
    try {
        console.log('Testing getProduct query...');
        const idOrSlug = 1; // Assuming product ID 1 exists
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

        console.log('Query:', query);
        console.log('Param:', param);

        const [products] = await db.query(query, [param]);
        console.log('Result:', products.length > 0 ? 'Found' : 'Not Found');
        if (products.length > 0) console.log(products[0]);

    } catch (error) {
        console.error('SQL Error:', error);
    } finally {
        process.exit();
    }
})();
