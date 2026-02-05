# Admin Panel - Maadhivs Boutique

## 🚀 Quick Start

### Access the Admin Panel

1. Open `admin/index.html` in your browser
2. Login with demo credentials:
   - **Email:** admin@maadhivs.com
   - **Password:** admin123

### Admin Panel Structure

```
admin/
├── index.html              # Login page
├── dashboard.html          # Main dashboard
├── products.html           # Product management
├── categories.html         # Category management
├── orders.html            # Orders management
├── homepage.html          # Homepage content control
├── keywords.html          # Search keywords management
├── css/
│   └── admin.css          # Admin panel styles
└── js/
    ├── auth.js            # Authentication
    ├── data-service.js    # Data layer (localStorage)
    ├── models.js          # Data models
    ├── dashboard.js       # Dashboard logic
    ├── products-admin.js  # Product CRUD
    ├── categories-admin.js # Category CRUD
    ├── orders-admin.js    # Orders management
    ├── homepage-admin.js  # Homepage control
    └── keywords-admin.js  # Keywords management
```

## 📋 Features

### ✅ Authentication
- Secure login system
- Session management
- Auto-logout on token expiration
- Protected admin routes

### ✅ Dashboard
- Total products, orders, categories count
- Pending orders tracking
- Recent orders display
- Quick action links

### ✅ Category Management
- Add/Edit/Delete categories
- Category types (Men/Women/General)
- Used-by-products validation

### ✅ Product Management
- Full CRUD operations
- **Image Handling:**
  - Primary image (URL or file upload)
  - Minimum 3 sub images
  - Real-time preview
  - Base64 encoding for local files
- **Product Details:**
  - Name, price, description
  - Category selection
  - Multiple sizes (S, M, L, XL, XXL, Free Size)
  - Stock quantity
- **Product Flags:**
  - Trending Product
  - Popular Product
  - Men Collection
  - Women Collection

### ✅ Orders Management
- View all orders
- Filter by status (Pending/Shipped/Delivered)
- View detailed order information
- Update order status
- Customer information display

### ✅ Homepage Control
- **Slider Management:**
  - Add/remove slider images
  - Reorder images (up/down)
  - Toggle visibility (active/inactive)
- **Trending Products:**
  - Select products marked as trending
  - Reorder products
  - Remove from section
- **Popular Products:**
  - Select products marked as popular
  - Reorder products
  - Remove from section

### ✅ Search Keywords
- Add custom search keywords
- Map keywords to products
- Map keywords to categories
- Edit/delete keywords
- Example: "wedding" → Sherwani category + specific products

## 💾 Data Storage

Currently using **localStorage** for data persistence:
- `admin_categories` - Categories
- `admin_products` - Products
- `admin_orders` - Orders
- `admin_homepage` - Homepage content
- `admin_keywords` - Search keywords
- `admin_auth_token` - Auth token
- `admin_user` - User info

## 🔄 Backend Migration

The admin panel is structured for easy backend integration:

### 1. Replace Data Service
Update `js/data-service.js` to use API calls instead of localStorage:

```javascript
// Example: Replace localStorage with API
async createProduct(productData) {
    const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(productData)
    });
    return response.json();
}
```

### 2. Update Authentication
Replace mock JWT in `js/auth.js` with real backend authentication:

```javascript
async login(email, password) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
    });
    const data = await response.json();
    localStorage.setItem(this.TOKEN_KEY, data.token);
    return data;
}
```

### 3. Image Upload
Replace base64 encoding with proper file uploads:

```javascript
async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authService.getToken()}`
        },
        body: formData
    });
    return response.json(); // Returns {url: 'https://...'}
}
```

### 4. API Endpoints Needed

All endpoints are documented in `js/data-service.js` with comments like:
```javascript
// API endpoint: GET /api/products
// API endpoint: POST /api/products
// API endpoint: PUT /api/products/:id
// API endpoint: DELETE /api/products/:id
```

## 🎨 Design Philosophy

- **Clean & Minimal:** No clutter, focus on functionality
- **Professional:** Inspired by Myntra/Ajio admin panels
- **Desktop-First:** Optimized for admin use on desktop
- **Consistent:** Uniform design across all pages
- **Accessible:** Clear labels, proper form validation

## 🔒 Security Notes

**Current Implementation (Frontend-Only):**
- Mock JWT tokens (not secure)
- localStorage for session (not production-safe)
- No server-side validation

**For Production:**
- Implement real JWT with backend
- Use httpOnly cookies
- Add server-side validation
- Implement rate limiting
- Add CSRF protection
- Use HTTPS only

## 📝 Usage Tips

1. **Start with Categories:** Add categories before adding products
2. **Product Images:** Use high-quality images (recommended: 800x800px minimum)
3. **Homepage Control:** Save changes after reordering slider/products
4. **Search Keywords:** Map keywords to both products AND categories for better results
5. **Orders:** Update order status as you process them

## 🐛 Troubleshooting

**Login not working?**
- Check browser console for errors
- Ensure you're using correct credentials
- Clear localStorage and try again

**Images not showing?**
- Verify image URLs are accessible
- Check if images are too large (base64 has limits)
- Use external URLs for large images

**Data not persisting?**
- Check if localStorage is enabled
- Verify you're not in incognito mode
- Check browser storage limits

## 🚀 Next Steps

1. **Test all features** in the admin panel
2. **Add sample data** (categories, products, orders)
3. **Configure homepage** (slider, trending, popular)
4. **Set up search keywords**
5. **Integrate with backend** when ready

## 📞 Support

For issues or questions about the admin panel, refer to:
- Implementation plan: `implementation_plan.md`
- Data models: `admin/js/models.js`
- API structure: `admin/js/data-service.js`
