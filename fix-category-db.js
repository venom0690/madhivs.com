const db = require('./server/db');

async function fixDB() {
    try {
        console.log('Altering table...');
        await db.query(`ALTER TABLE categories MODIFY COLUMN type ENUM('Men','Women','Accessories','General') NOT NULL DEFAULT 'General'`);

        console.log('Updating existing accessories category...');
        await db.query(`UPDATE categories SET type = 'Accessories' WHERE name = 'accessories' OR name = 'Accessories'`);

        console.log('Done fixing DB');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

fixDB();
