/**
 * Data Models for Maadhivs Boutique Admin Panel
 * MongoDB-compatible schemas
 */

// Generate unique ID
const generateId = () => {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Category Model
class Category {
    constructor(data) {
        this.id = data.id || generateId();
        this.name = data.name;
        this.type = data.type; // "Men" | "Women" | "General"
        this.subCategories = data.subCategories || []; // Array of strings
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    validate() {
        if (!this.name || this.name.trim() === '') {
            throw new Error('Category name is required');
        }
        if (!['Men', 'Women', 'General'].includes(this.type)) {
            throw new Error('Invalid category type');
        }
        return true;
    }
}

// Product Model
class Product {
    constructor(data) {
        this.id = data.id || generateId();
        this.name = data.name;
        this.price = parseFloat(data.price);
        this.category = data.category; // Category ID
        this.subCategory = data.subCategory || ''; // Sub-category name
        this.sizes = data.sizes || []; // Array of strings
        this.colors = data.colors || []; // Array of strings
        this.stock = parseInt(data.stock) || 0;
        this.description = data.description || '';
        this.primaryImage = data.primaryImage;
        this.subImages = data.subImages || []; // Array of image URLs/base64
        this.isTrending = data.isTrending || false;
        this.isPopular = data.isPopular || false;
        this.isMenCollection = data.isMenCollection || false;
        this.isWomenCollection = data.isWomenCollection || false;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    validate() {
        if (!this.name || this.name.trim() === '') {
            throw new Error('Product name is required');
        }
        if (!this.price || this.price <= 0) {
            throw new Error('Valid price is required');
        }
        if (!this.category) {
            throw new Error('Category is required');
        }
        if ((!this.sizes || this.sizes.length === 0) && (!this.colors || this.colors.length === 0)) {
            throw new Error('At least one size or color must be selected');
        }
        if (!this.primaryImage) {
            throw new Error('Primary image is required');
        }
        if (!this.subImages || this.subImages.length < 3) {
            throw new Error('At least 3 sub images are required');
        }
        return true;
    }
}

// Order Model
class Order {
    constructor(data) {
        this.id = data.id || generateId();
        this.customerName = data.customerName;
        this.customerEmail = data.customerEmail;
        this.customerPhone = data.customerPhone;
        this.items = data.items || []; // Array of {productId, name, price, quantity, size}
        this.totalAmount = parseFloat(data.totalAmount);
        this.status = data.status || 'Pending'; // "Pending" | "Shipped" | "Delivered"
        this.shippingAddress = data.shippingAddress || {};
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    validate() {
        if (!this.customerName || this.customerName.trim() === '') {
            throw new Error('Customer name is required');
        }
        if (!this.items || this.items.length === 0) {
            throw new Error('Order must have at least one item');
        }
        if (!['Pending', 'Shipped', 'Delivered'].includes(this.status)) {
            throw new Error('Invalid order status');
        }
        return true;
    }
}

// Homepage Content Model
class HomepageContent {
    constructor(data) {
        this.sliderImages = data.sliderImages || []; // Array of {id, url, order, isActive}
        this.trendingProductIds = data.trendingProductIds || []; // Ordered array
        this.popularProductIds = data.popularProductIds || []; // Ordered array
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }
}

// Search Keyword Model
class SearchKeyword {
    constructor(data) {
        this.id = data.id || generateId();
        this.keyword = data.keyword;
        this.linkedProducts = data.linkedProducts || []; // Array of product IDs
        this.linkedCategories = data.linkedCategories || []; // Array of category IDs
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    validate() {
        if (!this.keyword || this.keyword.trim() === '') {
            throw new Error('Keyword is required');
        }
        return true;
    }
}
