# Maadhivs Boutique - E-commerce Backend

<div align="center">
  <h3>🛍️ Premium Indian Ethnic Wear E-commerce Platform</h3>
  <p>Production-ready Node.js backend with MongoDB, JWT authentication, and Cloudinary integration</p>
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Folder Structure](#folder-structure)
- [Deployment](#deployment)
- [Security](#security)
- [Testing](#testing)

---

## 🎯 Overview

Maadhivs Boutique is a full-stack e-commerce platform for luxury Indian ethnic wear. This backend provides:

- **Complete Admin Panel API** - Manage products, categories, orders, and homepage content
- **Customer Website API** - Browse products, search, and checkout
- **Secure Authentication** - JWT-based admin authentication
- **Cloud Image Storage** - Cloudinary integration for optimized images

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.18 |
| Database | MongoDB + Mongoose 8 |
| Authentication | JWT + bcrypt |
| Validation | Joi |
| Image Storage | Cloudinary |
| Security | Helmet, CORS, Rate Limiting |

---

## ✨ Features

### Admin Features
- ✅ Category management with hierarchy (Men/Women/General)
- ✅ Product CRUD with multiple images
- ✅ Order management and status tracking
- ✅ Homepage content control (slider, trending, popular)
- ✅ Image upload to Cloudinary
- ✅ Customer list

### Customer Features
- ✅ Browse products by category
- ✅ Search products
- ✅ View trending and popular products
- ✅ Checkout with guest support
- ✅ Order confirmation

### Security
- ✅ JWT token authentication
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ Rate limiting (100 req/15min)
- ✅ XSS protection
- ✅ NoSQL injection prevention
- ✅ HTTP security headers

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB (local or Atlas)
- Cloudinary account (free tier works)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd new-main

# Install backend dependencies
cd server
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Seed admin user
npm run seed

# Start development server
npm run dev
```

### Quick Start

1. **Start MongoDB** (if using local):
   ```bash
   mongod
   ```

2. **Start the server**:
   ```bash
   cd server
   npm run dev
   ```

3. **Access the application**:
   - Website: http://localhost:5000
   - Admin Panel: http://localhost:5000/admin
   - API Health: http://localhost:5000/api/health

4. **Login to Admin**:
   - Email: `admin@maadhivs.com`
   - Password: `Admin@123`

---

## 🔐 Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/maadhivs_boutique

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Admin (for seed script)
ADMIN_EMAIL=admin@maadhivs.com
ADMIN_PASSWORD=Admin@123

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5000
```

---

## 📚 API Documentation

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/admin/login` | Admin login | Public |
| GET | `/api/admin/me` | Get current user | Admin |

### Categories

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | List all | Public |
| GET | `/api/categories/:id` | Get one | Public |
| POST | `/api/categories` | Create | Admin |
| PUT | `/api/categories/:id` | Update | Admin |
| DELETE | `/api/categories/:id` | Delete | Admin |

### Products

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | List with filters | Public |
| GET | `/api/products/:slug` | Get by slug | Public |
| GET | `/api/products/trending` | Trending products | Public |
| GET | `/api/products/popular` | Popular products | Public |
| POST | `/api/products` | Create | Admin |
| PUT | `/api/products/:id` | Update | Admin |
| DELETE | `/api/products/:id` | Delete | Admin |

### Orders

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/orders` | List all | Admin |
| GET | `/api/orders/:id` | Get detail | Admin |
| POST | `/api/orders` | Create (checkout) | Public |
| PATCH | `/api/orders/:id/status` | Update status | Admin |

### Upload

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload` | Single image | Admin |
| POST | `/api/upload/multiple` | Multiple images | Admin |

### Homepage

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/homepage` | Get content | Public |
| PUT | `/api/homepage` | Update content | Admin |

---

## 📁 Folder Structure

```
server/
├── config/
│   └── db.js               # MongoDB connection
├── controllers/
│   ├── authController.js
│   ├── categoryController.js
│   ├── productController.js
│   ├── orderController.js
│   ├── uploadController.js
│   └── homepageController.js
├── middleware/
│   ├── auth.js             # JWT verification
│   ├── asyncHandler.js     # Error wrapper
│   ├── errorHandler.js     # Global error handler
│   └── validate.js         # Joi validation
├── models/
│   ├── Category.js
│   ├── Product.js
│   ├── User.js
│   ├── Order.js
│   └── HomepageContent.js
├── routes/
│   ├── authRoutes.js
│   ├── categoryRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   ├── uploadRoutes.js
│   └── homepageRoutes.js
├── utils/
│   ├── AppError.js
│   ├── cloudinary.js
│   └── slugify.js
├── validators/
│   ├── categoryValidator.js
│   ├── productValidator.js
│   └── orderValidator.js
├── seeds/
│   └── seedAdmin.js
├── .env.example
├── package.json
└── server.js
```

---

## 🚢 Deployment

### Deploy to Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
4. Add environment variables in Render dashboard
5. Deploy!

### Deploy to Railway

1. Create new project on [Railway](https://railway.app)
2. Add MongoDB plugin or use MongoDB Atlas
3. Connect GitHub repository
4. Set root directory to `server`
5. Add environment variables
6. Deploy!

### MongoDB Atlas Setup

1. Create free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create database user
3. Whitelist IP addresses (or allow all: `0.0.0.0/0`)
4. Get connection string
5. Update `MONGODB_URI` in environment

### Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Add to environment variables

---

## 🔒 Security

| Feature | Implementation |
|---------|----------------|
| Authentication | JWT tokens (7 day expiry) |
| Password Storage | bcrypt with 12 salt rounds |
| Rate Limiting | 100 requests per 15 minutes |
| XSS Protection | Express sanitization |
| NoSQL Injection | express-mongo-sanitize |
| Security Headers | Helmet |
| CORS | Configurable origins |

---

## 🧪 Testing

### API Testing Checklist

#### Authentication
- [ ] Login with valid credentials → 200 + token
- [ ] Login with invalid password → 401
- [ ] Access protected route without token → 401
- [ ] Access protected route with valid token → 200

#### Categories
- [ ] Create category → 201
- [ ] List categories → 200 + array
- [ ] Update category → 200
- [ ] Delete unused category → 200
- [ ] Delete category with products → 400

#### Products
- [ ] Create product → 201
- [ ] Get product by slug → 200
- [ ] Get trending products → 200
- [ ] Toggle product flags → 200
- [ ] Delete product → 200

#### Orders
- [ ] Create order (checkout) → 201
- [ ] Update order status → 200
- [ ] Get order statistics → 200

### Running Tests

```bash
# Start server
npm run dev

# Test health endpoint
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@maadhivs.com","password":"Admin@123"}'
```

---

## 📞 Support

For issues or questions:
- Check existing documentation
- Review API endpoints
- Ensure environment variables are set correctly

---

## 📄 License

ISC License - See LICENSE file for details.

---

<div align="center">
  <p>Built with ❤️ for Maadhivs Boutique</p>
</div>
