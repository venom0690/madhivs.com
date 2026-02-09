# Maadhivs Boutique - Simple Production Backend

A clean, minimal Node.js + Express + MySQL backend for a small e-commerce boutique website.

**Perfect for**: ₹20K freelance projects, XAMPP hosting, junior developer maintenance

---

## 🎯 What You Get

✅ **Simple Stack**: Node.js + Express + MySQL  
✅ **XAMPP Compatible**: Runs on any XAMPP/WAMP setup  
✅ **No Cloud Dependencies**: Everything local  
✅ **Easy to Understand**: ~500 lines of clean code  
✅ **Production Ready**: Error handling, transactions, security basics

---

## 📦 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 5.7+ or 8.0
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **File Upload**: Multer (local storage)
- **Environment**: dotenv

**That's it.** No over-engineering.

---

## 🚀 How to Run Locally (XAMPP)

### Step 1: Start XAMPP MySQL

1. Open XAMPP Control Panel
2. Click **Start** on MySQL
3. Open phpMyAdmin: `http://localhost/phpmyadmin`

### Step 2: Create Database

1. In phpMyAdmin, click **New**
2. Database name: `maadhivs_boutique`
3. Collation: `utf8mb4_unicode_ci`
4. Click **Create**

### Step 3: Import Schema

1. Select the `maadhivs_boutique` database
2. Click **Import** tab
3. Choose file: `server/schema.sql`
4. Click **Go**
5. You should see 6 tables created + 1 admin user inserted

### Step 4: Configure Environment

1. Open `server/.env`
2. Update if needed (default works for XAMPP):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=maadhivs_boutique
```

### Step 5: Install Dependencies

```bash
cd server
npm install
```

### Step 6: Start Server

```bash
npm start
```

Expected output:
```
MySQL Connected: localhost
Server running on port 5000
API: http://localhost:5000/api
Uploads: http://localhost:5000/uploads
```

### Step 7: Test

Open browser: `http://localhost:5000/`

You should see the website homepage.

---

## 🔐 Admin Login

Default credentials (created by schema.sql):

- **Email**: `admin@maadhivs.com`
- **Password**: `Admin@123`

**⚠️ Change these in production!**

To create a new admin manually:

1. Hash your password using bcrypt (12 rounds)
2. Insert into `admins` table in phpMyAdmin

---

## 📁 Project Structure

```
server/
├── db.js                  # MySQL connection
├── server.js              # Express app setup
├── schema.sql             # Database schema
├── .env                   # Environment config
├── package.json           # Dependencies
├── controllers/           # Business logic
│   ├── authController.js
│   ├── categoryController.js
│   ├── productController.js
│   ├── orderController.js
│   └── uploadController.js
├── routes/                # API endpoints
│   ├── authRoutes.js
│   ├── categoryRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   └── uploadRoutes.js
├── middleware/            # Auth middleware
│   └── auth.js
└── uploads/               # Product images
```

**No models folder.** SQL queries are directly in controllers.

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/admin/login` | Admin login | Public |
| GET | `/api/admin/me` | Get current admin | Admin |

### Categories
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | Get all categories | Public |
| GET | `/api/categories/:id` | Get single category | Public |
| POST | `/api/categories` | Create category | Admin |
| PUT | `/api/categories/:id` | Update category | Admin |
| DELETE | `/api/categories/:id` | Delete category | Admin |

### Products
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | Get all products | Public |
| GET | `/api/products/:idOrSlug` | Get single product | Public |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Delete product | Admin |

**Query filters (products):**
- `?trending=true` - Get trending products
- `?popular=true` - Get popular products
- `?men=true` - Get men's collection
- `?women=true` - Get women's collection
- `?category=1` - Filter by category ID
- `?search=saree` - Search in name/description

### Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders` | Create order (checkout) | Public |
| GET | `/api/orders` | Get all orders | Admin |
| GET | `/api/orders/:id` | Get single order | Admin |
| PATCH | `/api/orders/:id` | Update order status | Admin |

### Image Upload
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload` | Upload single image | Admin |
| POST | `/api/upload/multiple` | Upload multiple images | Admin |
| DELETE | `/api/upload/:filename` | Delete image | Admin |

---

## 🖼️ Image Handling

**Local storage only. No Cloudinary.**

### Upload

```bash
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

Response:
```json
{
  "status": "success",
  "data": {
    "url": "/uploads/1234567890-123456789.jpg",
    "filename": "1234567890-123456789.jpg",
    "size": 245612
  }
}
```

### Access

Images are served at: `http://localhost:5000/uploads/[filename]`

### Storage

All uploads saved to: `server/uploads/`

**Limits:**
- Max size: 5MB
- Allowed types: JPEG, PNG, GIF, WebP

---

## 🗄️ Database Tables

### admins
Stores admin users.

### categories
Product categories (Men, Women, General).

### products
All product details including:
- Pricing, stock, descriptions
- JSON fields: images, sizes, colors
- Boolean flags: trending, popular, featured, men_collection, women_collection

### orders
Customer orders with:
- Order number (auto-generated: MB + date + random)
- Customer info, total amount
- Payment method, status
- Order status tracking

### order_items
Line items for each order (product snapshot).

### shipping_addresses
Delivery addresses for orders.

---

## 🔒 Security

**Implemented:**
- ✅ JWT authentication
- ✅ bcrypt password hashing (12 rounds)
- ✅ SQL injection protection (parameterized queries)
- ✅ File type validation
- ✅ File size limits
- ✅ Basic CORS setup

**NOT implemented (not needed for ₹20K project):**
- ❌ Rate limiting
- ❌ Helmet security headers
- ❌ Request validation schemas
- ❌ OAuth
- ❌ Refresh tokens

---

## 📤 Deployment

### Cheap Hosting Options

1. **Shared Hosting (₹100-300/month)**
   - Hostinger, Namecheap, GoDaddy
   - cPanel + Node.js support
   - MySQL included

2. **VPS (₹300-500/month)**
   - DigitalOcean, Vultr, Linode
   - Full control
   - Install LAMP + Node.js

3. **Free Options (Testing)**
   - Render.com (free tier)
   - Railway.app (free tier)
   - Note: Use PlanetScale or Railway for free MySQL

### Deployment Steps

1. Upload files via FTP or Git
2. Create MySQL database on server
3. Import `schema.sql`
4. Update `.env` with production credentials
5. Run `npm install`
6. Start with `npm start` or PM2: `pm2 start server.js`

### PM2 Setup (Production)

```bash
npm install -g pm2
pm2 start server.js --name maadhivs-backend
pm2 save
pm2 startup
```

---

## 🧪 Testing

See `TESTING.md` for complete manual testing guide.

Quick test:

```bash
# Test server
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@maadhivs.com","password":"Admin@123"}'
```

---

## 🐛 Troubleshooting

### Server won't start

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution**: MySQL isn't running. Start it in XAMPP.

### Can't import schema.sql

**Solution**: Make sure database charset is `utf8mb4`.

### Images not loading

**Solution**: Check that `uploads/` folder exists and is writable.

### JWT token errors

**Solution**: Make sure `.env` has `JWT_SECRET` set.

### Admin login fails

**Solution**: Check that schema.sql was imported (includes default admin).

---

## 🔄 Future Enhancements (Optional)

If client wants to upgrade:

1. Add customer authentication
2. Add payment gateway (Razorpay/Stripe)
3. Add email notifications (Nodemailer)
4. Add inventory management
5. Add analytics dashboard

**Keep it simple until needed.**

---

## 📞 Support

For junior developers maintaining this:

1. Read the code - it's simple and commented
2. Check `TESTING.md` for testing procedures
3. All SQL queries are visible in controllers
4. No hidden magic, no complex patterns

---

## 📄 License

ISC - Use freely for your projects

---

**Built with simplicity in mind. No unnecessary complexity.**
