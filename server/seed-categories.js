const db = require('./db');

(async () => {
    try {
        console.log('Seeding categories...');

        const categories = [
            { name: 'Men', type: 'men', slug: 'men' },
            { name: 'Women', type: 'women', slug: 'women' },
            { name: 'Accessories', type: 'accessories', slug: 'accessories' }
        ];

        for (const cat of categories) {
            // Check if exists
            const [rows] = await db.query('SELECT id FROM categories WHERE slug = ?', [cat.slug]);
            if (rows.length === 0) {
                await db.query('INSERT INTO categories (name, type, slug) VALUES (?, ?, ?)', [cat.name, cat.type, cat.slug]);
                console.log(`Created category: ${cat.name}`);
            } else {
                console.log(`Category exists: ${cat.name}`);
            }
        }

        console.log('Done!');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
