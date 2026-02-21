# 🚀 DEPLOYMENT CHECKLIST
## Maadhivs Boutique - PHP Deployment

Use this checklist to ensure a smooth deployment to shared hosting.

---

## 📋 PRE-DEPLOYMENT

### ✅ Local Testing

- [ ] All API endpoints working locally
- [ ] Admin panel login successful
- [ ] Products CRUD operations working
- [ ] Categories CRUD operations working
- [ ] Order creation working
- [ ] Image uploads working
- [ ] Frontend pages loading correctly

### ✅ Files Preparation

- [ ] Database credentials updated in `api/db.php`
- [ ] CORS origins updated in `api/helpers.php`
- [ ] Domain name updated in `.htaccess` (line ~300)
- [ ] All sensitive files excluded from upload (.env, .git)

---

## 🗄️ DATABASE SETUP

### Step 1: Create Database

**Via cPanel:**
- [ ] Login to cPanel
- [ ] Navigate to MySQL Databases
- [ ] Create database: `username_boutique` (or similar)
- [ ] Create database user
- [ ] Grant ALL PRIVILEGES to user
- [ ] Note down: DB_HOST, DB_NAME, DB_USER, DB_PASS

**Via Command Line:**
```bash
mysql -u root -p -e "CREATE DATABASE maadhivs_boutique CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "CREATE USER 'boutique_user'@'localhost' IDENTIFIED BY 'strong_password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON maadhivs_boutique.* TO 'boutique_user'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

### Step 2: Import Schema

**Via phpMyAdmin:**
- [ ] Select your database
- [ ] Click "Import" tab
- [ ] Upload `server/database_setup.sql`
- [ ] Click "Go"
- [ ] Upload `api/migrate.sql`
- [ ] Click "Go"

**Via Command Line:**
```bash
mysql -u boutique_user -p maadhivs_boutique < server/database_setup.sql
mysql -u boutique_user -p maadhivs_boutique < api/migrate.sql
```

### Step 3: Verify Tables

```sql
SHOW TABLES;
-- Should show: admins, categories, products, orders, order_items, 
--              shipping_addresses, settings, search_keywords
```

---

## 📤 FILE UPLOAD

### Files to Upload

```
✅ Upload these directories/files:
├── api/                    (all PHP files)
├── admin/                  (admin panel)
├── css/                    (styles)
├── js/                     (if exists)
├── server/uploads/         (existing images)
├── .htaccess               (Apache config)
├── index.html
├── about.html
├── accessories.html
├── cart.html
├── checkout.html
├── contact.html
└── favicon.ico             (if exists)

❌ DO NOT upload:
├── server/node_modules/
├── server/controllers/
├── server/middleware/
├── server/routes/
├── server/package.json
├── .git/
├── .env
└── *.md files (optional)
```

### Upload Methods

**Via cPanel File Manager:**
- [ ] Login to cPanel
- [ ] Open File Manager
- [ ] Navigate to `public_html/` (or your domain folder)
- [ ] Upload files (use ZIP for faster upload)
- [ ] Extract if uploaded as ZIP

**Via FTP:**
```bash
# Using FileZilla or similar FTP client
Host: ftp.yourdomain.com
Username: your_cpanel_username
Password: your_cpanel_password
Port: 21
```

**Via SSH/SCP:**
```bash
scp -r api/ user@yourdomain.com:/home/user/public_html/
scp -r admin/ user@yourdomain.com:/home/user/public_html/
scp .htaccess user@yourdomain.com:/home/user/public_html/
```

---

## ⚙️ CONFIGURATION

### Step 1: Update Database Connection

Edit `api/db.php` on server:

```php
$DB_HOST = 'localhost';              // Usually 'localhost'
$DB_NAME = 'username_boutique';      // Your actual DB name
$DB_USER = 'username_dbuser';        // Your actual DB user
$DB_PASS = 'your_secure_password';   // Your actual DB password
```

### Step 2: Set File Permissions

**Via cPanel File Manager:**
- [ ] Right-click `server/uploads/` → Change Permissions → 755
- [ ] Right-click `api/` → Change Permissions → 755
- [ ] Right-click `.htaccess` → Change Permissions → 644

**Via SSH:**
```bash
chmod 755 server/uploads/
chmod 755 api/
chmod 644 .htaccess
chmod 644 api/*.php
```

### Step 3: Create Admin User

**Via Browser:**
```
https://yourdomain.com/api/seed-admin.php
```

**Via SSH:**
```bash
cd /home/user/public_html
php api/seed-admin.php
```

**Default Credentials:**
- Email: `admin@maadhivs.com`
- Password: `Admin@123`

⚠️ **IMPORTANT:** Change password immediately after first login!

---

## 🧪 TESTING

### API Endpoints

Test each endpoint:

```bash
# Health check
curl https://yourdomain.com/api/health
# Expected: {"status":"success","message":"API is running"}

# Get products
curl https://yourdomain.com/api/products
# Expected: {"status":"success","results":0,"products":[]}

# Get categories
curl https://yourdomain.com/api/categories
# Expected: {"status":"success","results":0,"categories":[]}

# Admin login
curl -X POST https://yourdomain.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@maadhivs.com","password":"Admin@123"}'
# Expected: {"status":"success","token":"...","admin":{...}}
```

### Admin Panel

- [ ] Navigate to `https://yourdomain.com/admin/`
- [ ] Login with admin credentials
- [ ] Dashboard loads correctly
- [ ] Navigate to Categories page
- [ ] Create a test category
- [ ] Navigate to Products page
- [ ] Upload a test image
- [ ] Create a test product
- [ ] Edit the product
- [ ] Delete the product
- [ ] Navigate to Orders page (should be empty)
- [ ] Navigate to Settings page
- [ ] Update shipping cost
- [ ] Logout

### Frontend

- [ ] Homepage loads: `https://yourdomain.com/`
- [ ] About page loads: `https://yourdomain.com/about.html`
- [ ] Accessories page loads: `https://yourdomain.com/accessories.html`
- [ ] Cart page loads: `https://yourdomain.com/cart.html`
- [ ] Checkout page loads: `https://yourdomain.com/checkout.html`
- [ ] Contact page loads: `https://yourdomain.com/contact.html`
- [ ] Images load correctly
- [ ] CSS styles applied
- [ ] JavaScript working

### Browser Console

- [ ] No JavaScript errors
- [ ] No 404 errors
- [ ] No CORS errors
- [ ] API calls successful

---

## 🔒 SECURITY

### Immediate Actions

- [ ] Change default admin password
- [ ] Verify `.htaccess` is working (try accessing `api/db.php` directly - should be blocked)
- [ ] Test file upload restrictions (try uploading .php file - should fail)
- [ ] Verify directory listing is disabled (visit `/uploads/` - should show 403)
- [ ] Check sensitive files are protected:
  - [ ] `/.env` → 403 Forbidden
  - [ ] `/api/db.php` → Should not display source code
  - [ ] `/.git/` → 403 Forbidden

### SSL Certificate

**Via cPanel:**
- [ ] Navigate to SSL/TLS
- [ ] Install Let's Encrypt certificate (usually free)
- [ ] Force HTTPS redirect

**Via Certbot (SSH):**
```bash
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
```

**After SSL is installed:**
- [ ] Uncomment HTTPS redirect in `.htaccess` (line ~50)
- [ ] Uncomment HSTS header in `.htaccess` (line ~30)
- [ ] Update CORS origins to use `https://`

---

## 🎨 CUSTOMIZATION

### Branding

- [ ] Update site title in HTML files
- [ ] Replace logo/favicon
- [ ] Update contact information
- [ ] Update social media links
- [ ] Customize color scheme in CSS

### Settings

- [ ] Set shipping cost in admin panel
- [ ] Configure homepage slider images
- [ ] Set up payment methods
- [ ] Configure email notifications (if implemented)

---

## 📊 MONITORING

### Setup Monitoring

- [ ] Enable error logging in PHP
- [ ] Set up Google Analytics (optional)
- [ ] Configure uptime monitoring (e.g., UptimeRobot)
- [ ] Set up backup schedule

### Error Logs

**Via cPanel:**
- [ ] Navigate to Errors
- [ ] Check error logs regularly

**Via SSH:**
```bash
tail -f /var/log/apache2/error.log
tail -f /var/log/php/error.log
```

---

## 🔄 POST-DEPLOYMENT

### Immediate Tasks

- [ ] Test complete checkout flow
- [ ] Create sample products
- [ ] Test order management
- [ ] Verify email notifications (if configured)
- [ ] Test on mobile devices
- [ ] Test on different browsers

### Within 24 Hours

- [ ] Monitor error logs
- [ ] Check server resource usage
- [ ] Verify backup is working
- [ ] Test all forms
- [ ] Check SEO meta tags

### Within 1 Week

- [ ] Performance optimization
- [ ] SEO audit
- [ ] Security audit
- [ ] User feedback collection
- [ ] Analytics review

---

## 🆘 TROUBLESHOOTING

### Common Issues

**"Database connection failed"**
```bash
# Check credentials in api/db.php
# Test connection:
mysql -u your_user -p -h localhost your_database
```

**"404 Not Found" on API calls**
```bash
# Verify .htaccess is uploaded
# Check mod_rewrite is enabled
# Check Apache allows .htaccess overrides
```

**"Session not working"**
```bash
# Check session directory permissions
# Verify cookies are enabled in browser
# Check CORS headers allow credentials
```

**"Image upload fails"**
```bash
# Check directory permissions: chmod 755 server/uploads/
# Verify PHP upload limits in .htaccess
# Check disk space: df -h
```

---

## ✅ DEPLOYMENT COMPLETE

Once all items are checked:

- [ ] All tests passing
- [ ] Security measures in place
- [ ] SSL certificate installed
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Documentation updated

**🎉 Your eCommerce site is now live!**

---

## 📞 SUPPORT

If you encounter issues:

1. Check error logs first
2. Review troubleshooting section
3. Verify all checklist items
4. Test in incognito/private mode
5. Clear browser cache

---

**Deployment Date:** _________________  
**Deployed By:** _________________  
**Domain:** _________________  
**Hosting Provider:** _________________  

---

**Last Updated:** February 21, 2026  
**Version:** 1.0.0
