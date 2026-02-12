# Dependencies and Run Guide

This document lists all required dependencies for this project and explains how to run it on other PCs in two scenarios:
- Modules not present (fresh machine)
- Modules already present (Node.js, MySQL, and NPM packages installed)

## System Requirements

- Node.js: 18+ (LTS recommended)
- MySQL: 5.7+ or 8.x
- Optional: XAMPP for easy MySQL + phpMyAdmin on Windows

## NPM Dependencies

From [package.json](file:///c:/Users/MSI/Desktop/website%201/new-main/server/package.json):
- express ^4.18.2
- mysql2 ^3.6.5
- jsonwebtoken ^9.0.2
- bcryptjs ^2.4.3
- multer ^1.4.5-lts.1
- cors ^2.8.5
- dotenv ^16.3.1
- dev only: nodemon ^3.0.2
- engines: node >=18.0.0

## Important Files

- Backend entry: [server.js](file:///c:/Users/MSI/Desktop/website%201/new-main/server/server.js)
- MySQL pool: [db.js](file:///c:/Users/MSI/Desktop/website%201/new-main/server/db.js)
- Schema: server/schema.sql
- Config: server/.env (copy from .env.example if available)
- Scripts: `npm start`, `npm run dev`, `npm run seed` (see [package.json](file:///c:/Users/MSI/Desktop/website%201/new-main/server/package.json#L6-L10))

## Environment Variables

Set these in `server/.env`:
- DB_HOST=localhost
- DB_USER=root
- DB_PASSWORD=
- DB_NAME=maadhivs_boutique
- JWT_SECRET=<required, any strong random string>
- Optional: PORT=5000, FRONTEND_URL=http://localhost:5000, JWT_EXPIRES_IN=7d

The server fails fast if JWT_SECRET is missing.

## Fresh Machine (modules not present)

1. Install Node.js 18+ (nodejs.org) and verify with:
   - node --version
   - npm --version
2. Install MySQL:
   - Recommended: Install XAMPP, then start MySQL from the Control Panel
   - Or install standalone MySQL and start the service
3. Create database and import schema:
   - phpMyAdmin: http://localhost/phpmyadmin → New → maadhivs_boutique → Import server/schema.sql
   - CLI (optional): 
     - mysql -u root -e "CREATE DATABASE maadhivs_boutique;"
     - mysql -u root maadhivs_boutique < server/schema.sql
4. Configure environment:
   - In `server/`, copy `.env.example` to `.env` if present
   - Set DB_* values and a strong JWT_SECRET
5. Install backend packages:
   - cd server
   - npm install
6. Run the server:
   - npm start
   - For development auto-reload: npm run dev
7. Verify:
   - Open http://localhost:5000
   - Health: http://localhost:5000/api/health

## Existing Setup (modules present)

1. Ensure MySQL is running and database `maadhivs_boutique` exists with schema imported.
2. Ensure `server/.env` exists and has a non-empty JWT_SECRET.
3. From `server/`:
   - npm start
   - Or `npm run dev` for auto-restart during development
4. Test endpoints:
   - Health: http://localhost:5000/api/health
   - Admin login: POST http://localhost:5000/api/admin/login

## Optional Commands

- Seed default admin user:
  - cd server
  - npm run seed
- Run API tests (manual script):
  - node server/tests/api-tests.js

## Common Issues

- MySQL Connection Error: start MySQL service (XAMPP Control Panel) and verify DB credentials
- Port 5000 in use: set PORT in `.env` to a free port
- Cannot find module 'express': run `npm install` inside `server/`
- Missing uploads: ensure `server/uploads/` exists for file serving

## Notes

- Frontend is static (HTML/CSS/JS) and served by the backend; no build step required.
- Backend serves API under `/api` and static files from project root.
