-- ============================================
-- Subcategory System Migration
-- ============================================
-- This migration adds proper subcategory support to the database
-- Run this AFTER the initial schema.sql

-- Step 1: Update categories foreign key to CASCADE delete
-- This ensures when a parent category is deleted, all subcategories are also deleted

ALTER TABLE categories
DROP FOREIGN KEY IF EXISTS categories_ibfk_1;

ALTER TABLE categories
ADD CONSTRAINT fk_parent_category
FOREIGN KEY (parent_id)
REFERENCES categories(id)
ON DELETE CASCADE;

-- Step 2: Add subcategory_id to products table
-- This allows products to be assigned to specific subcategories

ALTER TABLE products
ADD COLUMN subcategory_id INT NULL AFTER category_id;

-- Step 3: Add foreign key constraint for subcategory_id
-- ON DELETE SET NULL ensures products aren't deleted when subcategory is removed

ALTER TABLE products
ADD CONSTRAINT fk_product_subcategory
FOREIGN KEY (subcategory_id)
REFERENCES categories(id)
ON DELETE SET NULL;

-- Step 4: Add index for better query performance

CREATE INDEX idx_subcategory ON products(subcategory_id);

-- ============================================
-- Migration Complete
-- ============================================
-- You can now:
-- 1. Create parent categories (parent_id = NULL)
-- 2. Create subcategories (parent_id = parent category ID)
-- 3. Assign products to subcategories
-- 4. Filter products by subcategory
