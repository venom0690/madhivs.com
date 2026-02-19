const db = require('./db');

(async () => {
    try {
        console.log('Creating settings table...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(50) NOT NULL UNIQUE,
                setting_value VARCHAR(255) NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log('Seeding default shipping cost...');

        // Check if exists
        const [rows] = await db.query('SELECT * FROM settings WHERE setting_key = ?', ['shipping_cost']);
        if (rows.length === 0) {
            await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', ['shipping_cost', '99']);
            console.log('Inserted default shipping cost: 99');
        } else {
            console.log('Shipping cost already set:', rows[0].setting_value);
        }

        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
