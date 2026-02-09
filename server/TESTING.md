# Manual Testing Guide

Complete step-by-step testing procedures for the Maadhivs Boutique backend.

**Run all these tests before deploying to production.**

---

## Prerequisites

- XAMPP MySQL running
- Database created and schema imported
- Server running on http://localhost:5000
- Postman or curl for API testing (optional)

---

## ✅ Test 1: Database Setup

### Steps:
1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Select database `maadhivs_boutique`
3. Check that all tables exist

### Expected Tables:
- admins (should have 1 row - default admin)
- categories (empty)
- products (empty or 3 sample rows if you kept them)
- orders (empty)
- order_items (empty)
- shipping_addresses (empty)

### Verification:
```sql
SELECT * FROM admins;
```
Should show 1 admin with email: admin@maadhivs.com

**✅ PASS if all tables exist and admin row is present**

---

## ✅ Test 2: Server Startup

### Steps:
```bash
cd server
npm start
```

### Expected Output:
```
MySQL Connected: localhost
Server running on port 5000
API: http://localhost:5000/api
Uploads: http://localhost:5000/uploads
```

### Verification:
Open browser: http://localhost:5000/api/health

Expected response:
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2024-..."
}
```

**✅ PASS if server starts without errors and health check returns 200**

---

## ✅ Test 3: Admin Login

### Using Postman:

**Request:**
```
POST http://localhost:5000/api/admin/login
Content-Type: application/json

{
  "email": "admin@maadhivs.com",
  "password": "Admin@123"
}
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "name": "Admin",
    "email": "admin@maadhivs.com"
  }
}
```

### Using Browser:

1. Open admin panel: http://localhost:5000/admin/index.html
2. Enter credentials:
   - Email: admin@maadhivs.com
   - Password: Admin@123
3. Click Login

**✅ PASS if login succeeds and JWT token is returned**

**❌ FAIL Tests:**
- Wrong password → Should return 401 error
- Wrong email → Should return 401 error
- Empty fields → Should return 400 error

---

## ✅ Test 4: Category Management

**Save the JWT token from login test. Use it in Authorization header.**

### 4A: Create Category

**Request:**
```
POST http://localhost:5000/api/categories
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Sarees",
  "type": "Women",
  "description": "Traditional and designer sarees"
}
```

**Expected Response (201 Created):**
```json
{
  "status": "success",
  "category": {
    "id": 1,
    "name": "Sarees",
    "slug": "sarees",
    "type": "Women",
    "description": "Traditional and designer sarees",
    "is_active": 1,
    ...
  }
}
```

### 4B: Get All Categories

**Request:**
```
GET http://localhost:5000/api/categories
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "results": 1,
  "categories": [ ... ]
}
```

### 4C: Update Category

**Request:**
```
PUT http://localhost:5000/api/categories/1
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "description": "Updated description"
}
```

### 4D: Delete Category

Create a test category first, then:

**Request:**
```
DELETE http://localhost:5000/api/categories/2
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected (200 OK):**
```json
{
  "status": "success",
  "message": "Category deleted successfully"
}
```

**✅ PASS if all category CRUD operations work**

---

## ✅ Test 5: Product Management

### 5A: Upload Product Image First

**Request:**
```
POST http://localhost:5000/api/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

image: [select a JPG/PNG file]
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "url": "/uploads/1707567890-123456789.jpg",
    "filename": "1707567890-123456789.jpg",
    "size": 245612
  }
}
```

**Save the `url` value for next step!**

### 5B: Create Product

**Request:**
```
POST http://localhost:5000/api/products
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Silk Saree - Red",
  "description": "Beautiful red silk saree for weddings",
  "price": 8999,
  "discount_price": 7999,
  "category_id": 1,
  "stock": 5,
  "primary_image": "/uploads/1707567890-123456789.jpg",
  "images": ["/uploads/1707567890-123456789.jpg"],
  "sizes": ["One Size"],
  "colors": ["Red", "Maroon"],
  "is_trending": true,
  "is_popular": true,
  "is_women_collection": true
}
```

**Expected Response (201 Created):**
```json
{
  "status": "success",
  "product": {
    "id": 1,
    "name": "Silk Saree - Red",
    "slug": "silk-saree-red",
    "price": 8999,
    ...
  }
}
```

### 5C: Get All Products

**Request:**
```
GET http://localhost:5000/api/products
```

**Expected:** List of all products

**Test Filters:**
```
GET /api/products?trending=true
GET /api/products?popular=true
GET /api/products?women=true
GET /api/products?search=saree
```

### 5D: Get Single Product

**Request:**
```
GET http://localhost:5000/api/products/1
```
or
```
GET http://localhost:5000/api/products/silk-saree-red
```

**Expected:** Product details with category info

### 5E: Update Product

**Request:**
```
PUT http://localhost:5000/api/products/1
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "price": 9999,
  "stock": 3
}
```

### 5F: Delete Product

**Request:**
```
DELETE http://localhost:5000/api/products/1
Authorization: Bearer YOUR_JWT_TOKEN
```

**✅ PASS if all product CRUD operations work + image upload works**

---

## ✅ Test 6: Frontend Product Display

### Steps:
1. Make sure you have at least 2-3 products in database
2. Open http://localhost:5000/index.html
3. Check homepage

### Verify:
- Products load dynamically from API
- Images display correctly
- Product names, prices shown
- Click on a product → goes to product detail page
- Product detail page shows all info

**✅ PASS if products render correctly on frontend**

---

## ✅ Test 7: Customer Order (Checkout)

### Steps:

1. Open frontend: http://localhost:5000
2. Browse products
3. Add product to cart
4. Go to cart
5. Proceed to checkout
6. Fill form:
   - Name: Test Customer
   - Email: test@test.com
   - Phone: 9876543210
   - Address: 123 Test Street
   - City: Mumbai
   - State: Maharashtra
   - Pincode: 400001
7. Place Order

### Verify in Database:

```sql
SELECT * FROM orders;
SELECT * FROM order_items;
SELECT * FROM shipping_addresses;
```

**Expected:**
- 1 new order with auto-generated order_number
- Order items created
- Shipping address saved
- Order status = 'Pending'

### API Test:

**Request:**
```
POST http://localhost:5000/api/orders
Content-Type: application/json

{
  "customerInfo": {
    "name": "Test Customer",
    "email": "test@test.com",
    "phone": "9876543210"
  },
  "items": [
    {
      "product_id": 1,
      "name": "Silk Saree",
      "price": 8999,
      "quantity": 1,
      "image": "/uploads/..."
    }
  ],
  "totalAmount": 8999,
  "shippingAddress": {
    "street": "123 Test Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "paymentMethod": "cod"
}
```

**✅ PASS if order is created with all related data**

---

## ✅ Test 8: Admin - View Orders

### Steps:

1. Login to admin panel
2. Go to Orders page
3. Verify order appears in list

### API Test:

**Request:**
```
GET http://localhost:5000/api/orders
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected:**
- List of all orders
- Order details visible

### Get Single Order:

**Request:**
```
GET http://localhost:5000/api/orders/1
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected:**
- Complete order with items and shipping address

**✅ PASS if admin can view all orders and details**

---

## ✅ Test 9: Update Order Status

### API Test:

**Request:**
```
PATCH http://localhost:5000/api/orders/1
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "order_status": "Shipped",
  "tracking_number": "TRACK123456"
}
```

**Expected:**
- Order status updated
- Tracking number saved

### Verify:
```sql
SELECT * FROM orders WHERE id = 1;
```

**✅ PASS if order status updates correctly**

---

## ✅ Test 10: Image Serving

### Steps:

1. Upload an image via admin or API
2. Note the filename
3. Open in browser: http://localhost:5000/uploads/[filename].jpg

**Expected:** Image displays

### Verify:
```bash
ls server/uploads/
```

File should exist in uploads folder.

**✅ PASS if images are accessible via URL**

---

## ✅ Test 11: Error Handling

### Test Invalid Login:
```
POST /api/admin/login
{
  "email": "wrong@email.com",
  "password": "wrong"
}
```
**Expected:** 401 Unauthorized

### Test Missing Auth Token:
```
POST /api/categories
(no Authorization header)
{
  "name": "Test"
}
```
**Expected:** 401 error

### Test Invalid Product:
```
POST /api/products
Authorization: Bearer TOKEN
{
  "name": "Test Product"
  // missing required fields
}
```
**Expected:** 400 Bad Request

### Test Non-existent Product:
```
GET /api/products/99999
```
**Expected:** 404 Not Found

**✅ PASS if all errors return appropriate status codes and messages**

---

## ✅ Test 12: Production Mode

### Steps:

1. Edit `.env`:
   ```
   NODE_ENV=production
   ```

2. Restart server:
   ```bash
   npm start
   ```

3. Run all tests again

**Verify:**
- No debug logs in console
- All functionality works
- Errors don't expose sensitive info

**✅ PASS if production mode works without errors**

---

## 📊 Final Checklist

Before deploying:

- [ ] All 12 tests pass
- [ ] Database has correct schema
- [ ] Admin can login
- [ ] Categories CRUD works
- [ ] Products CRUD works
- [ ] Image upload works
- [ ] Orders can be created
- [ ] Orders appear in admin
- [ ] Order status can be updated
- [ ] Frontend loads products
- [ ] Checkout flow works
- [ ] Error handling works
- [ ] Production mode tested

---

## 🐛 Common Issues

### Issue: MySQL connection refused

**Solution:** Start MySQL in XAMPP

### Issue: JWT token expired

**Solution:** Login again to get new token

### Issue: Images not loading

**Solution:** 
1. Check `uploads/` folder exists
2. Check file permissions
3. Verify URL path starts with `/uploads/`

### Issue: Order creation fails

**Solution:** Check that category and product exist first

### Issue: Can't delete category

**Solution:** Delete all products in that category first

---

## 🎯 Performance Checklist

- [ ] Test with 50+ products → Page loads in < 2 seconds
- [ ] Test with 100+ orders → Admin panel responsive
- [ ] Image files are < 5MB each
- [ ] No memory leaks after 30 minutes running

---

**All tests should pass before going live!**
