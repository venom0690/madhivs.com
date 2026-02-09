-- ============================================
-- Maadhivs Boutique - MySQL Database Schema
-- ============================================
-- Simple, production-ready schema for XAMPP/WAMP
-- No over-engineering, just what's needed

-- Drop existing tables (for clean setup)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS shipping_addresses;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS admins;

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    type ENUM('Men', 'Women', 'General') NOT NULL DEFAULT 'General',
    description VARCHAR(500),
    image VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    parent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_active (is_active),
    INDEX idx_slug (slug),
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2) DEFAULT NULL,
    category_id INT NOT NULL,
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
    INDEX idx_trending (is_trending),
    INDEX idx_popular (is_popular),
    INDEX idx_featured (is_featured),
    INDEX idx_men (is_men_collection),
    INDEX idx_women (is_women_collection),
    INDEX idx_price (price),
    INDEX idx_created (created_at),
    FULLTEXT idx_search (name, description),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
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

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
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

-- ============================================
-- SHIPPING ADDRESSES TABLE
-- ============================================
CREATE TABLE shipping_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    INDEX idx_order (order_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT DEFAULT ADMIN
-- ============================================
-- Password: Admin@123 (hashed with bcrypt)
-- Change this in production!
INSERT INTO admins (name, email, password) VALUES 
('Admin', 'admin@maadhivs.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5gyui3cqHFqEe');

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Sample Categories
INSERT INTO categories (name, slug, type, description) VALUES 
('Sarees', 'sarees', 'Women', 'Traditional and designer sarees'),
('Kurtas', 'kurtas', 'Men', 'Ethnic kurtas for men'),
('Accessories', 'accessories', 'General', 'Fashion accessories');

-- Sample Products (uncomment if you want test data)
-- INSERT INTO products (name, slug, description, price, category_id, stock, primary_image, images, is_trending, is_popular) VALUES 
-- ('Designer Silk Saree', 'designer-silk-saree', 'Beautiful silk saree for special occasions', 8999.00, 1, 10, '/uploads/sample1.jpg', '[\"/uploads/sample1.jpg\"]', 1, 1),
-- ('Cotton Kurta', 'cotton-kurta', 'Comfortable cotton kurta for daily wear', 1299.00, 2, 25, '/uploads/sample2.jpg', '[\"/uploads/sample2.jpg\"]', 0, 1);

-- ============================================
-- END OF SCHEMA
-- ============================================
