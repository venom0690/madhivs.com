-- ============================================
-- MAADHIVS BOUTIQUE - COMPLETE DATABASE SETUP
-- ============================================
-- This unified script handles:
-- 1. New Installations (creates all tables from scratch)
-- 2. Updates/Migrations (adds missing tables/columns to existing databases)
-- 3. Security features (rate limiting table)
-- 4. Default data and settings
--
-- USAGE: 
-- - New Installation: Run this script in phpMyAdmin or via command line
-- - Existing Database: Safe to run - will only add missing components
--
-- Command Line: mysql -u username -p database_name < database_setup.sql
-- ============================================

-- Set character set for the session
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================
-- 1. CORE TABLES (Create if not exists)
-- ============================================

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories Table (with multi-level support)
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    type ENUM('Men', 'Women', 'Accessories', 'General') NOT NULL DEFAULT 'General',
    description VARCHAR(500),
    image VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    parent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_active (is_active),
    INDEX idx_slug (slug),
    INDEX idx_parent (parent_id),
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2) DEFAULT NULL,
    category_id INT NOT NULL,
    subcategory_id INT DEFAULT NULL,
    stock INT DEFAULT 0,
    primary_image VARCHAR(255) NOT NULL,
    images JSON,
    sizes JSON,
    colors JSON,
    is_trending TINYINT(1) DEFAULT 0,
    is_popular TINYINT(1) DEFAULT 0,
    is_featured TINYINT(1) DEFAULT 0,
    is_men_collection TINYINT(1) DEFAULT 0,
    is_women_collection TINYINT(1) DEFAULT 0,
    seo_title VARCHAR(70),
    seo_description VARCHAR(160),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_category (category_id),
    INDEX idx_subcategory (subcategory_id),
    INDEX idx_trending (is_trending),
    INDEX idx_popular (is_popular),
    INDEX idx_featured (is_featured),
    INDEX idx_men (is_men_collection),
    INDEX idx_women (is_women_collection),
    INDEX idx_price (price),
    INDEX idx_created (created_at),
    FULLTEXT idx_search (name, description),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (subcategory_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(15) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cod', 'online', 'upi') DEFAULT 'cod',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    order_status ENUM('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    notes TEXT,
    tracking_number VARCHAR(100),
    delivered_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_number (order_number),
    INDEX idx_email (customer_email),
    INDEX idx_status (order_status),
    INDEX idx_payment (payment_status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    size VARCHAR(50),
    color VARCHAR(50),
    image VARCHAR(255),
    INDEX idx_order (order_id),
    INDEX idx_product (product_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shipping Addresses Table
CREATE TABLE IF NOT EXISTS shipping_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(100) DEFAULT 'India',
    INDEX idx_order (order_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings Table (Key-Value Store)
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Search Keywords Table
CREATE TABLE IF NOT EXISTS search_keywords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL UNIQUE,
    linked_products JSON DEFAULT NULL,
    linked_categories JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_keyword (keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate Limits Table (Security Feature)
CREATE TABLE IF NOT EXISTS rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    attempts INT DEFAULT 1,
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    locked_until TIMESTAMP NULL,
    INDEX idx_identifier (identifier),
    INDEX idx_locked_until (locked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. SCHEMA MIGRATIONS (For existing databases)
-- ============================================

-- Add 'Accessories' to categories type ENUM if not present
-- This is safe to run multiple times
SET @dbname = DATABASE();

-- Check and update categories type ENUM
SET @check_enum = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname 
    AND TABLE_NAME = 'categories' 
    AND COLUMN_NAME = 'type' 
    AND COLUMN_TYPE LIKE '%Accessories%'
);

SET @alter_enum = IF(
    @check_enum = 0,
    "ALTER TABLE categories MODIFY COLUMN type ENUM('Men', 'Women', 'Accessories', 'General') NOT NULL DEFAULT 'General'",
    "SELECT 'Accessories already in ENUM' AS message"
);

PREPARE stmt FROM @alter_enum;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure Categories has parent_id (for multi-level categories)
SET @tablename = "categories";
SET @columnname = "parent_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'parent_id already exists' AS message",
  "ALTER TABLE categories ADD COLUMN parent_id INT DEFAULT NULL, ADD INDEX idx_parent (parent_id), ADD FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ensure Products has subcategory_id
SET @tablename = "products";
SET @columnname = "subcategory_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'subcategory_id already exists' AS message",
  "ALTER TABLE products ADD COLUMN subcategory_id INT DEFAULT NULL, ADD INDEX idx_subcategory (subcategory_id), ADD FOREIGN KEY (subcategory_id) REFERENCES categories(id) ON DELETE SET NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ensure shipping_addresses has nullable state and pincode (for flexibility)
SET @tablename = "shipping_addresses";
SET @columnname = "state";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
      AND (IS_NULLABLE = 'YES')
  ) > 0,
  "SELECT 'state already nullable' AS message",
  "ALTER TABLE shipping_addresses MODIFY COLUMN state VARCHAR(100) NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "pincode";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
      AND (IS_NULLABLE = 'YES')
  ) > 0,
  "SELECT 'pincode already nullable' AS message",
  "ALTER TABLE shipping_addresses MODIFY COLUMN pincode VARCHAR(10) NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- 3. DEFAULT DATA & SETTINGS
-- ============================================

-- Insert default homepage config if it doesn't exist
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES 
('homepage_config', '{"sliderImages": [], "trendingProductIds": [], "popularProductIds": []}');

-- Insert default shipping cost if not present
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES 
('shipping_cost', '99');

-- Insert default site settings if not present
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES 
('site_name', 'Maadhivs Boutique'),
('site_email', 'info@maadhivs.com'),
('site_phone', '+91 1234567890');

-- ============================================
-- 4. SAMPLE DATA (Optional - Comment out if not needed)
-- ============================================

-- Sample Categories (Uncomment to insert)
-- INSERT IGNORE INTO categories (id, name, slug, type, description) VALUES
-- (1, 'Men''s Clothing', 'mens-clothing', 'Men', 'Stylish clothing for men'),
-- (2, 'Women''s Clothing', 'womens-clothing', 'Women', 'Trendy clothing for women'),
-- (3, 'Accessories', 'accessories', 'Accessories', 'Fashion accessories for everyone');

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================

-- Show all tables
SELECT 'Database tables created successfully!' AS Status;
SHOW TABLES;

-- Show table row counts
SELECT 
    'admins' AS table_name, COUNT(*) AS row_count FROM admins
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'shipping_addresses', COUNT(*) FROM shipping_addresses
UNION ALL SELECT 'settings', COUNT(*) FROM settings
UNION ALL SELECT 'search_keywords', COUNT(*) FROM search_keywords
UNION ALL SELECT 'rate_limits', COUNT(*) FROM rate_limits;

-- ============================================
-- END OF SETUP
-- ============================================

-- NOTES:
-- 1. This script is safe to run multiple times
-- 2. It will only create missing tables and columns
-- 3. Existing data will not be affected
-- 4. For new installations, all tables will be created
-- 5. For existing databases, only missing components will be added
-- 6. Run api/seed-admin.php after this to create admin user
-- 7. Default shipping cost is set to ₹99 (modify in settings table if needed)

