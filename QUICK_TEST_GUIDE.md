# Quick Test Guide - Admin Panel

## 🚀 Quick Start Testing

### 1. Test Login & Token (2 minutes)
```
1. Go to: /admin/index.html
2. Login with your credentials
3. ✅ Should redirect to dashboard
4. Open DevTools > Application > Local Storage
5. ✅ Should see 'adminToken' key
```

### 2. Test CSRF Token Operations (5 minutes)

#### Upload Image
```
1. Go to: Products page
2. Click "Add Product"
3. Upload an image
4. ✅ Image should upload successfully
```

#### Create Product
```
1. Fill in product details
2. Click "Save"
3. ✅ Product should be created
```

#### Edit Product
```
1. Click "Edit" on any product
2. Change name or price
3. Click "Save"
4. ✅ Changes should be saved
```

#### Delete Product
```
1. Click "Delete" on a product
2. Confirm deletion
3. ✅ Product should be deleted
```

### 3. Test Order Details (2 minutes)
```
1. Go to: Orders page
2. Click "View Details" on any order
3. ✅ Modal should open with loading indicator
4. ✅ Order details should display:
   - Order information
   - Customer details
   - Order items
   - Shipping address
   - Total amount
5. Change order status
6. ✅ Status should update
```

### 4. Test Accessories Page (1 minute)
```
1. Add products to "Accessories" category in admin
2. Go to: /accessories.html (frontend)
3. ✅ Products should load from admin panel
4. ✅ Filter buttons should work
```

---

## 🐛 If Something Doesn't Work

### Check Browser Console
```
Press F12 → Console tab
Look for red error messages
```

### Check Network Tab
```
Press F12 → Network tab
Look for failed requests (red)
Click on failed request to see details
```

### Check Token
```
Press F12 → Application → Local Storage
Find 'adminToken'
If missing or invalid → Login again
```

---

## ✅ Expected Results

All operations should work without errors:
- ✅ Login successful
- ✅ Token stored
- ✅ Images upload
- ✅ Products create/edit/delete
- ✅ Categories create/edit/delete
- ✅ Order details view
- ✅ Order status update
- ✅ Accessories page loads products

---

## 📞 Report Issues

If you find any issues, provide:
1. What you were trying to do
2. What happened (error message)
3. Browser console screenshot
4. Network tab screenshot (if API error)

---

## 📚 Detailed Documentation

For comprehensive testing and troubleshooting:
- `FINAL_ADMIN_PANEL_STATUS.md` - Complete status report
- `ADMIN_PANEL_TOKEN_TEST.md` - Detailed token testing
- `ORDER_DETAILS_FIX.md` - Order details enhancement
- `CSRF_AND_ACCESSORIES_FIXES.md` - Technical details
