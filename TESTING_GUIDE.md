# Testing Guide - Admin Panel Token Fix

## Prerequisites

Before testing, ensure you have:
1. ✅ Node.js installed
2. ✅ MySQL server running (XAMPP/WAMP)
3. ✅ Database created and configured
4. ✅ Environment variables set up

## Setup Steps

### 1. Configure Environment Variables

```bash
cd server
cp .env.example .env
```

Edit `.env` file and set:
```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=maadhivs_boutique

# IMPORTANT: Change this to a secure random string (min 32 chars)
JWT_SECRET=your_secure_random_32_character_string_here_change_me

JWT_EXPIRES_IN=7d

ADMIN_EMAIL=admin@maadhivs.com
ADMIN_PASSWORD=admin123

FRONTEND_URL=http://localhost:5000
```

### 2. Install Dependencies

```bash
cd server
npm install
```

### 3. Setup Database

```bash
# Create database and tables
mysql -u root -p < database_setup.sql

# Or manually in MySQL:
# CREATE DATABASE maadhivs_boutique;
# Then run the SQL from database_setup.sql
```

### 4. Seed Admin User

```bash
node seeds/seedAdmin.js
```

Expected output:
```
Admin user created successfully!
Email: admin@maadhivs.com
Password: admin123
```

### 5. Start Server

```bash
npm start
```

Expected output:
```
Server running on port 5000
API: http://localhost:5000/api
Uploads: http://localhost:5000/uploads
```

## Testing the Token Fix

### Test 1: Normal Login and Product Update

1. **Open Admin Panel**
   - Navigate to: `http://localhost:5000/admin/index.html`

2. **Login**
   - Email: `admin@maadhivs.com`
   - Password: `admin123`
   - Click "Login"

3. **Navigate to Products**
   - Click "Products" in sidebar
   - Should load products list

4. **Update a Product**
   - Click "Edit" on any product
   - Modify any field (name, price, etc.)
   - Click "Save Product"
   - **Expected**: Product updates successfully ✅

### Test 2: Expired Token Handling

1. **Login to Admin Panel**
   - Login with valid credentials

2. **Simulate Token Expiration**
   - Open Browser DevTools (F12)
   - Go to Console tab
   - Run:
   ```javascript
   // Corrupt the token to simulate expiration
   localStorage.setItem('adminToken', 'invalid.token.here');
   ```

3. **Try to Update Product**
   - Click "Edit" on any product
   - Try to save changes
   - **Expected**: Automatic redirect to login page ✅

### Test 3: Page Load Token Verification

1. **Login to Admin Panel**

2. **Corrupt Token**
   - Open DevTools Console
   - Run:
   ```javascript
   localStorage.setItem('adminToken', 'corrupted.token.value');
   ```

3. **Refresh Page or Navigate**
   - Press F5 or click any menu item
   - **Expected**: Automatic redirect to login page ✅

### Test 4: API 401 Error Handling

1. **Login to Admin Panel**

2. **Open Network Tab**
   - Open DevTools (F12)
   - Go to Network tab

3. **Corrupt Token and Make Request**
   - In Console, run:
   ```javascript
   localStorage.setItem('adminToken', 'bad.token');
   ```
   - Try to load products or update something

4. **Check Network Response**
   - Should see 401 status code
   - **Expected**: Automatic redirect to login ✅

### Test 5: Multiple Admin Pages

Test authentication on all admin pages:

1. **Dashboard** - `http://localhost:5000/admin/dashboard.html`
2. **Products** - `http://localhost:5000/admin/products.html`
3. **Categories** - `http://localhost:5000/admin/categories.html`
4. **Orders** - `http://localhost:5000/admin/orders.html`
5. **Homepage** - `http://localhost:5000/admin/homepage.html`
6. **Keywords** - `http://localhost:5000/admin/keywords.html`

For each page:
- Try accessing without login → Should redirect to login ✅
- Login and access → Should load normally ✅
- Corrupt token and refresh → Should redirect to login ✅

## Debugging Tips

### Check Server Logs

If you encounter issues, check the server console for errors:
```
Auth error: JsonWebTokenError
Auth error: TokenExpiredError
```

### Check Browser Console

Open DevTools Console (F12) to see:
- Authentication warnings
- API request/response details
- Token verification status

### Verify Token in DevTools

1. Open DevTools (F12)
2. Go to Application tab
3. Expand Local Storage
4. Check `adminToken` value
5. Decode JWT at https://jwt.io to verify expiration

### Common Issues

**Issue**: "Invalid token" immediately after login
- **Solution**: Check JWT_SECRET in .env matches between login and verification

**Issue**: CORS errors in console
- **Solution**: Verify FRONTEND_URL in .env includes your access URL

**Issue**: Database connection failed
- **Solution**: Check MySQL is running and credentials in .env are correct

**Issue**: "Admin not found" on login
- **Solution**: Run seed script: `node seeds/seedAdmin.js`

## API Endpoints Reference

### Authentication
- `POST /api/admin/login` - Login (returns JWT token)
- `GET /api/admin/me` - Verify token and get admin info

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (requires auth)
- `PUT /api/products/:id` - Update product (requires auth) ⭐
- `DELETE /api/products/:id` - Delete product (requires auth)

### Upload
- `POST /api/upload` - Upload image (requires auth)

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (requires auth)
- `PUT /api/categories/:id` - Update category (requires auth)
- `DELETE /api/categories/:id` - Delete category (requires auth)

### Orders
- `GET /api/orders` - List orders (requires auth)
- `GET /api/orders/:id` - Get order details (requires auth)
- `PATCH /api/orders/:id` - Update order status (requires auth)

## Success Criteria

All tests pass when:
- ✅ Can login successfully
- ✅ Can update products without token errors
- ✅ Expired tokens trigger automatic redirect
- ✅ Invalid tokens trigger automatic redirect
- ✅ All admin pages verify token on load
- ✅ 401 errors are handled gracefully
- ✅ No console errors during normal operation

## Next Steps After Testing

Once all tests pass:

1. **Change Default Credentials**
   - Update ADMIN_PASSWORD in .env
   - Run seed script again

2. **Generate Secure JWT_SECRET**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   - Copy output to JWT_SECRET in .env

3. **Configure Production Settings**
   - Set NODE_ENV=production
   - Update FRONTEND_URL to production domain
   - Enable HTTPS

4. **Test in Production Environment**
   - Verify all functionality works
   - Check security headers
   - Test rate limiting

## Support

If you encounter issues:
1. Check `ADMIN_PANEL_FIXES.md` for detailed fix information
2. Review server logs for error messages
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly
