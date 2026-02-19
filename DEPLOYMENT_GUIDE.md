# Deployment Guide for Maadhivs Boutique

This guide covers deploying to **VPS** (DigitalOcean, AWS) and **Shared Hosting** (GoDaddy, Hostinger).

# Option A: VPS Deployment (Recommended)
(Ubuntu 20.04/22.04 LTS)

## 1. Prerequisites
-   **Server**: VPS with at least 1GB RAM.
-   **OS**: Ubuntu 20.04 or 22.04 LTS.
-   **Domain**: A domain name pointing to your server's IP.

## 2. Initial Server Setup
Update system and install clear dependencies:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl git build-essential -y
```

## 3. Install Node.js (v18+)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

## 4. Install & Configure MySQL
```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation
```
*(Answer Y to all security questions, set a strong root password)*

Create the database and user:
```bash
sudo mysql -u root -p
```
```sql
CREATE DATABASE maadhivs_db;
CREATE USER 'maadhivs_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON maadhivs_db.* TO 'maadhivs_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 5. Application Setup
Clone your repository (or upload files via SFTP) to `/var/www/maadhivs`:
```bash
mkdir -p /var/www/maadhivs
# Upload your files here...
cd /var/www/maadhivs
```

Install dependencies:
```bash
npm install --production
```

## 6. Environment Configuration
Create the production `.env` file:
```bash
cp .env.example .env
nano .env
```
**Critical Settings for Production:**
```ini
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=maadhivs_user
DB_PASS=YOUR_STRONG_PASSWORD
DB_NAME=maadhivs_db
JWT_SECRET=use_a_very_long_random_string_here_at_least_32_chars
FRONTEND_URL=https://yourdomain.com
```

## 7. Database Migration
Run your schema scripts to set up the tables:
```bash
# Verify connection first
npm run db:test

# Import schema
node server/seed-categories.js
# ... run other seeders if needed
```

## 8. Process Management (PM2)
Use PM2 to keep the app running in the background.
```bash
sudo npm install -g pm2
pm2 start server/server.js --name "maadhivs-api"
pm2 save
pm2 startup
```

## 9. Nginx Reverse Proxy
Install Nginx and configure it:
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/maadhivs
```

Configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/maadhivs;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/maadhivs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 10. SSL (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

# Option B: Shared Hosting (GoDaddy / Hostinger)
Most shared hosting plans use **cPanel** or **hPanel**. This guide assumes your plan supports **Node.js**.

## 1. Prepare Your Application
1.  **Zip your project**: Select all files (except `node_modules` and `.git`) and zip them into `project.zip`.
2.  **Database Export**: If you have a local DB, export it to `maadhivs.sql`.

## 2. Database Setup (cPanel/hPanel)
1.  Go to **MySQL Databases**.
2.  Create a new database (e.g., `u12345_maadhivs`).
3.  Create a new user and password.
4.  **Add User to Database** with ALL PRIVILEGES.
5.  Go to **phpMyAdmin**, select the new database, and **Import** your `maadhivs.sql` (or run your schema queries).

## 3. Node.js Setup
1.  Find **Setup Node.js App** in your control panel.
2.  **Create Application**:
    *   **Node.js Version**: 18.x or higher.
    *   **App Mode**: Production.
    *   **App Root**: `maadhivs` (this will create a folder).
    *   **Application URL**: `yourdomain.com`.
    *   **Startup File**: `server/server.js` (Important: Check if your host requires `app.js` in root. If so, create an `app.js` that requires server/server.js).
3.  Click **Create**.

## 4. Upload Files
1.  Go to **File Manager**.
2.  Navigate to the folder created (e.g., `maadhivs`).
3.  **Upload** your `project.zip` and **Extract** it here.
4.  **Environment Variables**:
    *   In the Node.js App settings, usually there is a button "Environment Variables".
    *   Add keys from your `.env` file (`DB_HOST`, `DB_USER`, `DB_PASS`, `JWT_SECRET`, etc.).
    *   Note: `DB_HOST` is usually `localhost` even on shared hosting.

## 5. Install Dependencies
1.  In the Node.js App page, click **Run NPM Install**.
    *   *Troubleshooting*: If this fails, you might need to SSH into your shared hosting (if allowed) and run `npm install` manually in that folder.

## 6. Restart & Test
1.  Click **Restart Application**.
2.  Visit your site.
