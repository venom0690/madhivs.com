# Maadhivs Boutique — E-Commerce Platform

A full-stack luxury fashion e-commerce website with an admin panel, built with vanilla HTML/CSS/JS frontend and Node.js + MySQL backend.

---

## 🏗️ Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                             │
│                                                                      │
│  ┌─────────────────────┐         ┌──────────────────────────────┐   │
│  │   Customer Website   │         │       Admin Panel             │   │
│  │                     │         │                              │   │
│  │  index.html         │         │  admin/index.html  (Login)   │   │
│  │  shop.html          │         │  admin/dashboard.html        │   │
│  │  product.html       │         │  admin/products.html         │   │
│  │  cart.html          │         │  admin/categories.html       │   │
│  │  checkout.html      │         │  admin/orders.html           │   │
│  │  wishlist.html      │         │                              │   │
│  │                     │         │  JS: auth.js                 │   │
│  │  JS: main.js        │         │      data-service.js         │   │
│  │      admin-data-    │         │      products-admin.js       │   │
│  │      bridge.js      │         │      categories-admin.js     │   │
│  │      product.js     │         │      orders-admin.js         │   │
│  │      cart.js         │         │      dashboard.js            │   │
│  └────────┬────────────┘         └──────────────┬───────────────┘   │
│           │ fetch()                              │ fetch() + JWT     │
└───────────┼──────────────────────────────────────┼───────────────────┘
            │                                      │
            ▼                                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    NODE.JS SERVER (Express)                           │
│                    http://localhost:5000                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                      API Routes (/api/...)                     │  │
│  │                                                                │  │
│  │  POST /api/admin/login        ← Auth (public)                 │  │
│  │  GET  /api/admin/me           ← Auth (protected)              │  │
│  │                                                                │  │
│  │  GET  /api/categories         ← Categories (public)           │  │
│  │  POST /api/categories         ← Categories (protected)        │  │
│  │  PUT  /api/categories/:id     ← Categories (protected)        │  │
│  │  DELETE /api/categories/:id   ← Categories (protected)        │  │
│  │                                                                │  │
│  │  GET  /api/products           ← Products (public)             │  │
│  │  GET  /api/products/:id       ← Products (public)             │  │
│  │  POST /api/products           ← Products (protected)          │  │
│  │  PUT  /api/products/:id       ← Products (protected)          │  │
│  │  DELETE /api/products/:id     ← Products (protected)          │  │
│  │                                                                │  │
│  │  POST /api/orders             ← Orders (public - checkout)    │  │
│  │  GET  /api/orders             ← Orders (protected)            │  │
│  │  GET  /api/orders/:id         ← Orders (protected)            │  │
│  │  PATCH /api/orders/:id        ← Orders (protected)            │  │
│  │                                                                │  │
│  │  POST /api/upload             ← Image Upload (protected)      │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Middleware: JWT Auth │ CORS │ Body Parser │ Static File Serving     │
│  Storage:   /uploads/ (local images)                                 │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ mysql2
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      MySQL DATABASE                                  │
│                      (XAMPP / WAMP / standalone)                      │
│                                                                      │
│   ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────────┐  │
│   │  admins   │  │ categories │  │ products │  │     orders       │  │
│   │          │  │            │  │          │  │                  │  │
│   │ id       │  │ id         │  │ id       │  │ id               │  │
│   │ name     │  │ name       │  │ name     │  │ order_number     │  │
│   │ email    │  │ slug       │  │ slug     │  │ customer_name    │  │
│   │ password │  │ type       │  │ price    │  │ customer_email   │  │
│   └──────────┘  │ parent_id  │  │ category │  │ total_amount     │  │
│                 └────────────┘  │   _id    │  │ order_status     │  │
│                                 └──────────┘  └────────┬─────────┘  │
│                                                        │            │
│   ┌──────────────────┐    ┌────────────────────────────┘            │
│   │ shipping_        │    │                                         │
│   │ addresses        │    ▼                                         │
│   │                  │  ┌──────────────┐                            │
│   │ id               │  │ order_items  │                            │
│   │ order_id         │  │              │                            │
│   │ street, city,    │  │ id           │                            │
│   │ state, pincode   │  │ order_id     │                            │
│   └──────────────────┘  │ product_name │                            │
│                         │ price, qty   │                            │
│                         └──────────────┘                            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📦 All Dependencies

### System Requirements (must install separately)

| Dependency | Version | Purpose | Download |
|-----------|---------|---------|----------|
| **Node.js** | 18+ | JavaScript runtime | [nodejs.org](https://nodejs.org/) |
| **MySQL** | 5.7+ / 8.x | Database | Via XAMPP or standalone |
| **XAMPP** (recommended) | Any | Bundles MySQL + phpMyAdmin | [apachefriends.org](https://www.apachefriends.org/) |

### NPM Packages (auto-installed via `npm install`)

| Package | Version | Purpose |
|---------|---------|---------|
| **express** | ^4.18.2 | Web server & routing |
| **mysql2** | ^3.6.5 | MySQL database driver (with Promises) |
| **jsonwebtoken** | ^9.0.2 | JWT tokens for admin authentication |
| **bcryptjs** | ^2.4.3 | Password hashing |
| **multer** | ^1.4.5-lts.1 | Image file upload handling |
| **cors** | ^2.8.5 | Cross-origin resource sharing |
| **dotenv** | ^16.3.1 | Environment variable loading |
| **nodemon** | ^3.0.2 | *(dev only)* Auto-restart on file changes |

### Frontend (no install needed — loaded from browser)

| Technology | Purpose |
|-----------|---------|
| HTML5 | Page structure |
| CSS3 | Styling & responsive design |
| JavaScript (ES6+) | Interactivity, API calls |
| localStorage | Cart & wishlist persistence |
| Fetch API | HTTP requests to backend |

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Install Prerequisites

#### 1a. Install Node.js
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS** version (18 or newer)
3. Run the installer → click Next through all steps
4. Verify installation:
   ```bash
   node --version    # Should show v18.x.x or higher
   npm --version     # Should show 9.x.x or higher
   ```

#### 1b. Install XAMPP (for MySQL)
1. Go to [apachefriends.org](https://www.apachefriends.org/)
2. Download XAMPP for Windows
3. Run the installer → install with default settings
4. Open **XAMPP Control Panel**
5. Click **Start** next to **MySQL**
6. The status should turn green ✅

---

### Step 2: Create the Database

#### Option A: Using phpMyAdmin (recommended)
1. Open your browser → go to **http://localhost/phpmyadmin**
2. Click **"New"** in the left sidebar
3. Enter database name: `maadhivs_boutique`
4. Click **Create**
5. Click the **"Import"** tab at the top
6. Click **"Choose File"** → navigate to `server/schema.sql`
7. Click **"Go"** at the bottom

#### Option B: Using MySQL command line
```bash
mysql -u root -e "CREATE DATABASE maadhivs_boutique;"
mysql -u root maadhivs_boutique < server/schema.sql
```

After import, you should see 6 tables:
- `admins` (1 default admin user)
- `categories` (3 sample categories)
- `products` (empty — add via admin panel)
- `orders` (empty)
- `order_items` (empty)
- `shipping_addresses` (empty)

---

### Step 3: Configure Environment

```bash
cd server
copy .env.example .env
```

Open `.env` and verify these values match your MySQL setup:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=maadhivs_boutique
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

> **Note**: XAMPP's default MySQL has user `root` with no password. If you set a password, update `DB_PASSWORD`.

---

### Step 4: Install Node.js Dependencies

```bash
cd server
npm install
```

This installs the 7 packages listed in the dependency table above.

---

### Step 5: Start the Server

```bash
npm start
```

You should see:
```
MySQL Connected: localhost
Server running on port 5000
API: http://localhost:5000/api
Uploads: http://localhost:5000/uploads
```

> **For development** (auto-restart on code changes):
> ```bash
> npm run dev
> ```

---

### Step 6: Open the Website

| Page | URL |
|------|-----|
| 🏠 **Homepage** | http://localhost:5000 |
| 🛒 **Shop** | http://localhost:5000/shop.html |
| 👔 **Men** | http://localhost:5000/men.html |
| 👗 **Women** | http://localhost:5000/women.html |
| 🛍️ **Cart** | http://localhost:5000/cart.html |
| ❤️ **Wishlist** | http://localhost:5000/wishlist.html |
| ⚙️ **Admin Login** | http://localhost:5000/admin/ |
| 📊 **Admin Dashboard** | http://localhost:5000/admin/dashboard.html |

---

### Step 7: Log in to Admin Panel

1. Go to **http://localhost:5000/admin/**
2. Enter credentials:
   - **Email**: `admin@maadhivs.com`
   - **Password**: `Admin@123`
3. You'll be redirected to the dashboard

> ⚠️ **Change these credentials in production!**

---

## 📁 Project Structure

```
maadhivs-boutique/
│
├── 📄 index.html              ← Homepage
├── 📄 shop.html               ← All products
├── 📄 men.html                ← Men's collection
├── 📄 women.html              ← Women's collection
├── 📄 product.html            ← Product detail page
├── 📄 cart.html               ← Shopping cart
├── 📄 checkout.html           ← Checkout form
├── 📄 wishlist.html           ← Wishlist page
├── 📄 success.html            ← Order confirmation
├── 📄 about.html              ← About page
├── 📄 contact.html            ← Contact page
│
├── 📁 css/                    ← All stylesheets
├── 📁 images/                 ← Static images (logo, banners)
│
├── 📁 js/                     ← Frontend JavaScript
│   ├── main.js                ← Cart, checkout, notifications
│   ├── admin-data-bridge.js   ← Connects frontend to backend API
│   ├── product.js             ← Product listing logic
│   ├── product-detail.js      ← Product detail page logic
│   ├── home-products.js       ← Homepage product loader
│   ├── search.js              ← Search functionality
│   ├── wishlist.js            ← Wishlist logic
│   ├── cart.js                ← Cart utilities
│   └── ...                    ← Other page scripts
│
├── 📁 admin/                  ← Admin panel
│   ├── index.html             ← Login page
│   ├── dashboard.html         ← Dashboard
│   ├── products.html          ← Product management
│   ├── categories.html        ← Category management
│   ├── orders.html            ← Order management
│   └── 📁 js/                 ← Admin scripts
│       ├── auth.js            ← JWT authentication
│       ├── data-service.js    ← API communication layer
│       ├── products-admin.js  ← Product CRUD
│       ├── categories-admin.js← Category CRUD
│       ├── orders-admin.js    ← Order management
│       └── dashboard.js       ← Dashboard statistics
│
└── 📁 server/                 ← Backend (Node.js)
    ├── server.js              ← Express app entry point
    ├── db.js                  ← MySQL connection pool
    ├── schema.sql             ← Database schema
    ├── .env                   ← Environment variables
    ├── package.json           ← Dependencies
    │
    ├── 📁 controllers/        ← Business logic
    │   ├── authController.js
    │   ├── categoryController.js
    │   ├── productController.js
    │   ├── orderController.js
    │   └── uploadController.js
    │
    ├── 📁 routes/             ← API endpoint definitions
    │   ├── authRoutes.js
    │   ├── categoryRoutes.js
    │   ├── productRoutes.js
    │   ├── orderRoutes.js
    │   └── uploadRoutes.js
    │
    ├── 📁 middleware/         ← Express middleware
    │   └── auth.js            ← JWT verification
    │
    ├── 📁 seeds/              ← Database seeding
    │   └── seedAdmin.js       ← Create admin user
    │
    └── 📁 uploads/            ← Uploaded product images
```

---

## 🗄️ Database Tables

| Table | Rows (default) | Purpose |
|-------|----------------|---------|
| `admins` | 1 | Admin users (login credentials) |
| `categories` | 3 | Product categories (Sarees, Kurtas, Accessories) |
| `products` | 0 | Products (add via admin panel) |
| `orders` | 0 | Customer orders |
| `order_items` | 0 | Individual items in each order |
| `shipping_addresses` | 0 | Delivery addresses per order |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `MySQL Connection Error` | Start MySQL in XAMPP Control Panel |
| `EADDRINUSE: port 5000` | Another process uses port 5000 — kill it or change `PORT` in `.env` |
| `Cannot find module 'express'` | Run `npm install` in the `server/` directory |
| `Access denied for user 'root'` | Check `DB_PASSWORD` in `.env` matches your MySQL password |
| Images not loading | Ensure `server/uploads/` folder exists |
| Admin login fails | Re-import `schema.sql` or run `npm run seed` |
| Products not showing on website | Add products via admin panel first |

---

## 📚 NPM Scripts

```bash
cd server

npm start        # Start production server
npm run dev      # Start dev server (auto-restart on changes)
npm run seed     # Create default admin user
```

---

## 📄 License

ISC
# madhivs.com
