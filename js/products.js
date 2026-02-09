/**
 * Centralized Product Data for Maadhivs Boutique
 * Single source of truth for all product information
 */

const productsData = {
    men: [
        // Kurta Sets
        {
            name: "Classic Beige Kurta Set",
            price: "2499",
            priceFormatted: "₹2,499",
            image: "https://images.unsplash.com/photo-1622261006217-67b9d7a82c88",
            category: "kurta",
            isPopular: true,
            isTrending: false
        },
        {
            name: "Navy Blue Embroidered Kurta",
            price: "3299",
            priceFormatted: "₹3,299",
            image: "https://images.unsplash.com/photo-1626799693817-ba7e2b17f8f3",
            category: "kurta",
            isPopular: false,
            isTrending: true
        },
        {
            name: "Maroon Festive Kurta",
            price: "2899",
            priceFormatted: "₹2,899",
            image: "https://images.unsplash.com/photo-1603252109360-909baaf261c7",
            category: "kurta",
            isPopular: true,
            isTrending: false
        },
        {
            name: "Ivory Thread Work Kurta",
            price: "3499",
            priceFormatted: "₹3,499",
            image: "https://images.unsplash.com/photo-1622260614927-1c5e5e9c9c4b",
            category: "kurta",
            isPopular: false,
            isTrending: true
        },
        // Sherwani
        {
            name: "Royal Blue Gold Sherwani",
            price: "8999",
            priceFormatted: "₹8,999",
            image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2",
            category: "sherwani",
            isPopular: true,
            isTrending: true
        },
        {
            name: "Cream Silk Sherwani",
            price: "7499",
            priceFormatted: "₹7,499",
            image: "https://images.unsplash.com/photo-1598439181185-e8c2e8c6e685",
            category: "sherwani",
            isPopular: false,
            isTrending: false
        },
        {
            name: "Black Embellished Sherwani",
            price: "9999",
            priceFormatted: "₹9,999",
            image: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0",
            category: "sherwani",
            isPopular: false,
            isTrending: false
        },
        {
            name: "Golden Zari Sherwani",
            price: "11999",
            priceFormatted: "₹11,999",
            image: "https://images.unsplash.com/photo-1593006460940-d53d370894b7",
            category: "sherwani",
            isPopular: true,
            isTrending: false
        },
        // Ethnic Jackets
        {
            name: "Navy Nehru Jacket",
            price: "3999",
            priceFormatted: "₹3,999",
            image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf",
            category: "jacket",
            isPopular: false,
            isTrending: true
        },
        {
            name: "Maroon Bandhgala Jacket",
            price: "4499",
            priceFormatted: "₹4,499",
            image: "https://images.unsplash.com/photo-1519058082700-08a0b56da9b4",
            category: "jacket",
            isPopular: false,
            isTrending: false
        },
        {
            name: "Black Velvet Jacket",
            price: "5299",
            priceFormatted: "₹5,299",
            image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59",
            category: "jacket",
            isPopular: false,
            isTrending: false
        },
        {
            name: "Gold Brocade Jacket",
            price: "6999",
            priceFormatted: "₹6,999",
            image: "https://images.unsplash.com/photo-1564135949-792408ff3075",
            category: "jacket",
            isPopular: true,
            isTrending: false
        }
    ],
    women: [
        // Sarees
        {
            name: "Red Banarasi Silk Saree",
            price: "6999",
            priceFormatted: "₹6,999",
            image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
            category: "saree",
            isPopular: true,
            isTrending: true
        },
        {
            name: "Royal Blue Kanjivaram Saree",
            price: "8499",
            priceFormatted: "₹8,499",
            image: "https://images.unsplash.com/photo-1583391733981-4704b0e9f2f1",
            category: "saree",
            isPopular: true,
            isTrending: false
        },
        {
            name: "Emerald Green Chanderi Saree",
            price: "5499",
            priceFormatted: "₹5,499",
            image: "https://images.unsplash.com/photo-1629358063825-de8e6b7e0ed9",
            category: "saree",
            isPopular: false,
            isTrending: false
        },
        {
            name: "Pink Georgette Saree",
            price: "4999",
            priceFormatted: "₹4,999",
            image: "https://images.unsplash.com/photo-1631044579459-8f40ec79fc98",
            category: "saree",
            isPopular: false,
            isTrending: true
        },
        // Suit Sets
        {
            name: "Maroon Anarkali Suit Set",
            price: "4299",
            priceFormatted: "₹4,299",
            image: "https://images.unsplash.com/photo-1612523635925-e6a99c8c4f3a",
            category: "suit",
            isPopular: false,
            isTrending: false
        },
        {
            name: "Pink Palazzo Suit Set",
            price: "3799",
            priceFormatted: "₹3,799",
            image: "https://images.unsplash.com/photo-1614527082746-14407094ae59",
            category: "suit",
            isPopular: true,
            isTrending: false
        },
        {
            name: "Blue Straight Cut Suit",
            price: "3499",
            priceFormatted: "₹3,499",
            image: "https://images.unsplash.com/photo-1583391733859-70ff3c2bf9ed",
            category: "suit",
            isPopular: false,
            isTrending: false
        },
        {
            name: "Cream Silk Suit Set",
            price: "4999",
            priceFormatted: "₹4,999",
            image: "https://images.unsplash.com/photo-1632239698171-532d71a4e6b4",
            category: "suit",
            isPopular: false,
            isTrending: true
        },
        // Lehengas
        {
            name: "Emerald Bridal Lehenga",
            price: "14999",
            priceFormatted: "₹14,999",
            image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb",
            category: "lehenga",
            isPopular: true,
            isTrending: true
        },
        {
            name: "Red Velvet Lehenga",
            price: "12999",
            priceFormatted: "₹12,999",
            image: "https://images.unsplash.com/photo-1595777216528-071e0127ccbf",
            category: "lehenga",
            isPopular: false,
            isTrending: false
        },
        {
            name: "Pink Floral Lehenga",
            price: "11499",
            priceFormatted: "₹11,499",
            image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc",
            category: "lehenga",
            isPopular: false,
            isTrending: true
        },
        {
            name: "Gold Zari Lehenga",
            price: "16999",
            priceFormatted: "₹16,999",
            image: "https://images.unsplash.com/photo-1606922656508-a2f6cfef6a56",
            category: "lehenga",
            isPopular: false,
            isTrending: false
        }
    ]
};

/**
 * Helper: Only append image query params to external URLs (Unsplash etc.)
 * Local /uploads/ paths break if you add ?w=600&q=80
 */
function getImageUrl(src, params) {
    if (!src) return src;
    if (src.startsWith('http://') || src.startsWith('https://')) {
        return src + (params || '');
    }
    return src; // local path — return as-is
}

// Helper functions - Now use Admin Data Bridge with fallback (ASYNC)
const getAllProducts = async () => {
    // Try to get products from admin panel first
    if (typeof AdminDataBridge !== 'undefined' && await AdminDataBridge.hasData()) {
        return await AdminDataBridge.getWebsiteProducts();
    }
    // Fallback to hardcoded data
    return [...productsData.men, ...productsData.women];
};

const getPopularProducts = async () => {
    // Try to get from admin panel first
    if (typeof AdminDataBridge !== 'undefined' && await AdminDataBridge.hasData()) {
        const adminPopular = await AdminDataBridge.getPopularProducts();
        return adminPopular.map(AdminDataBridge.transformProduct);
    }
    // Fallback to hardcoded data
    const all = await getAllProducts();
    return all.filter(product => product.isPopular);
};

const getTrendingProducts = async () => {
    // Try to get from admin panel first
    if (typeof AdminDataBridge !== 'undefined' && await AdminDataBridge.hasData()) {
        const adminTrending = await AdminDataBridge.getTrendingProducts();
        return adminTrending.map(AdminDataBridge.transformProduct);
    }
    // Fallback to hardcoded data
    const all = await getAllProducts();
    return all.filter(product => product.isTrending);
};

const getMenProducts = async () => {
    // Try to get from admin panel first
    if (typeof AdminDataBridge !== 'undefined' && await AdminDataBridge.hasData()) {
        const adminMen = await AdminDataBridge.getMenProducts();
        if (adminMen.length > 0) {
            return adminMen.map(AdminDataBridge.transformProduct);
        }
        // Fallback: get by category type
        const menByCategory = await AdminDataBridge.getProductsByCategoryType('Men');
        if (menByCategory.length > 0) {
            return menByCategory.map(AdminDataBridge.transformProduct);
        }
    }
    // Fallback to hardcoded data
    return productsData.men;
};

const getWomenProducts = async () => {
    // Try to get from admin panel first
    if (typeof AdminDataBridge !== 'undefined' && await AdminDataBridge.hasData()) {
        const adminWomen = await AdminDataBridge.getWomenProducts();
        if (adminWomen.length > 0) {
            return adminWomen.map(AdminDataBridge.transformProduct);
        }
        // Fallback: get by category type
        const womenByCategory = await AdminDataBridge.getProductsByCategoryType('Women');
        if (womenByCategory.length > 0) {
            return womenByCategory.map(AdminDataBridge.transformProduct);
        }
    }
    // Fallback to hardcoded data
    return productsData.women;
};

