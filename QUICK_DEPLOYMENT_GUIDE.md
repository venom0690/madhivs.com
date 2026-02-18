# Quick Deployment Guide

**5-Minute Setup for Production**

---

## 🚀 Step 1: Server Setup (2 min)

```bash
# Install Node.js (if not installed)
# Download from: https://nodejs.org/

# Install dependencies
cd server
npm install

# Create .env file
cp .env.example .env
```

---

## ⚙️ Step 2: Configure .env (1 min)

Edit `server/.env`:

```env
NODE_ENV=production
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=maadhivs_boutique

JWT_SECRET=CHANGE_TO_RANDOM_32_CHAR_STRING_HERE
JWT_EXPIRES_IN=7d

ADMIN_EMAIL=admin@maadhivs.com
ADMIN_PASSWORD=YourSecurePassword123!

FRONTEND_URL=https://yourdomain.com
```

---

## 🗄️ Step 3: Database Setup (1 min)

```bash
# Import database
mysql -u root -p < server/database_setup.sql

# Create admin user
cd server
npm run seed
```

---

## 🔒 Step 4: SSL Certificate (Optional)

```bash
# Install Let's Encrypt
sudo certbot --apache -d yourdomain.com

# Then uncomment HTTPS redirect in .htaccess
```

---

## ▶️ Step 5: Start Server (1 min)

```bash
cd server
npm start
```

Visit: `http://localhost:5000`

---

## ✅ Done!

**Admin Panel**: `http://localhost:5000/admin/`
**Login**: admin@maadhivs.com / YourSecurePassword123!

---

For detailed instructions, see `DEPLOYMENT_CHECKLIST.md`
