const mysql = require('mysql2/promise');

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'maadhivs_boutique',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('MySQL Connected: ' + connection.config.host);
        connection.release();
    })
    .catch(err => {
        console.error('MySQL Connection Error:', err.message);
        process.exit(1);
    });

module.exports = pool;
