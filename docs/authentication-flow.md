# Authentication Flow - Admin Panel

## Overview

This document explains how authentication works in the admin panel after the token fix.

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      1. LOGIN PROCESS                            │
├─────────────────────────────────────────────────────────────────┤
│  User enters credentials                                         │
│         │                                                        │
│         ▼                                                        │
│  POST /api/admin/login                                          │
│         │                                                        │
│         ▼                                                        │
│  Server validates credentials                                    │
│         │                                                        │
│         ▼                                                        │
│  Generate JWT token (7 day expiration)                          │
│         │                                                        │
│         ▼                                                        │
│  Return token + admin info                                       │
│         │                                                        │
│         ▼                                                        │
│  Store in localStorage:                                          │
│    - adminToken                                                  │
│    - admin_user                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   2. PAGE LOAD VERIFICATION                      │
├─────────────────────────────────────────────────────────────────┤
│  Admin page loads                                                │
│         │                                                        │
│         ▼                                                        │
│  await authService.requireAuth()                                 │
│         │                                                        │
│         ├─────► Check token exists in localStorage               │
│         │                                                        │
│         ├─────► Decode JWT and check expiration (client-side)   │
│         │                                                        │
│         ├─────► Call GET /api/admin/me (server verification)    │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │ Token Valid?│                                                │
│  └─────────────┘                                                │
│         │                                                        │
│    ┌────┴────┐                                                  │
│    │         │                                                  │
│   YES       NO                                                   │
│    │         │                                                  │
│    │         └─────► Clear localStorage                         │
│    │                                                            │
│    │                 Redirect to login                          │
│    │                                                            │
│    └─────► Continue loading page                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    3. API REQUEST FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│  User action (e.g., Update Product)                             │
│         │                                                        │
│         ▼                                                        │
│  dataService.updateProduct(id, data)                            │
│         │                                                        │
│         ▼                                                        │
│  _request() adds Authorization header:                          │
│    "Bearer {token}"                                             │
│         │                                                        │
│         ▼                                                        │
│  PUT /api/products/:id                                          │
│         │                                                        │
│         ▼                                                        │
│  Server middleware validates token                              │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │ Token Valid?│                                                │
│  └─────────────┘                                                │
│         │                                                        │
│    ┌────┴────┐                                                  │
│    │         │                                                  │
│   YES       NO                                                   │
│    │         │                                                  │
│    │         └─────► Return 401 Unauthorized                    │
│    │                         │                                  │
│    │                         ▼                                  │
│    │                 _request() detects 401                     │
│    │                         │                                  │
│    │                         ▼                                  │
│    │                 Clear localStorage                         │
│    │                         │                                  │
│    │                         ▼                                  │
│    │                 Redirect to login                          │
│    │                         │                                  │
│    │                         ▼                                  │
│    │                 Show error message                         │
│    │                                                            │
│    └─────► Process request                                      │
│                    │                                            │
│                    ▼                                            │
│            Return success response                              │
│                    │                                            │
│                    ▼                                            │
│            Update UI with result                                │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Authentication Service (`admin/js/auth.js`)

**Responsibilities**:
- Login/logout functionality
- Token storage and retrieval
- Client-side token expiration check
- Server-side token verification
- Page access control

**Key Methods**:
```javascript
login(email, password)      // Authenticate user
logout()                    // Clear session
isAuthenticated()           // Check token expiration (client)
verifyToken()              // Verify with server
requireAuth()              // Guard page access
getToken()                 // Retrieve token
getCurrentUser()           // Get user info
```

### 2. Data Service (`admin/js/data-service.js`)

**Responsibilities**:
- Centralized API communication
- Automatic token attachment
- 401 error interception
- Response parsing

**Key Method**:
```javascript
async _request(endpoint, options) {
    // 1. Get token from localStorage
    // 2. Add Authorization header
    // 3. Make fetch request
    // 4. Check for 401 response
    // 5. If 401: clear token, redirect
    // 6. Parse and return response
}
```

### 3. Server Middleware (`server/middleware/auth.js`)

**Responsibilities**:
- JWT token verification
- Request authentication
- Error handling

**Flow**:
```javascript
exports.protect = async (req, res, next) => {
    // 1. Extract token from Authorization header
    // 2. Verify JWT signature
    // 3. Check expiration
    // 4. Add admin info to request
    // 5. Call next() or return 401
}
```

## Token Lifecycle

```
┌──────────────┐
│ Token Created│ (Login)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Token Stored  │ (localStorage)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Token Used   │ (API Requests)
└──────┬───────┘
       │
       ├─────► Valid: Request proceeds
       │
       └─────► Invalid/Expired:
                   │
                   ▼
               ┌──────────────┐
               │ 401 Response │
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │Clear Storage │
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │Redirect Login│
               └──────────────┘
```

## Error Handling

### Scenario 1: Token Expired During Session

```
User is working → Token expires → User clicks "Save"
                                        │
                                        ▼
                                  API returns 401
                                        │
                                        ▼
                              _request() intercepts
                                        │
                                        ▼
                              Clear localStorage
                                        │
                                        ▼
                              Redirect to login
                                        │
                                        ▼
                        Show "Session expired" message
```

### Scenario 2: Invalid Token on Page Load

```
User navigates to admin page
            │
            ▼
    requireAuth() called
            │
            ▼
    Check token in localStorage
            │
            ▼
    Decode and check expiration
            │
            ▼
    Call /api/admin/me
            │
            ▼
    Server returns 401
            │
            ▼
    verifyToken() returns false
            │
            ▼
    Clear localStorage
            │
            ▼
    Redirect to login
```

### Scenario 3: No Token Present

```
User tries to access admin page
            │
            ▼
    requireAuth() called
            │
            ▼
    Check token in localStorage
            │
            ▼
    Token not found
            │
            ▼
    Redirect to login immediately
```

## Security Features

### 1. Token Validation
- ✅ Client-side expiration check
- ✅ Server-side signature verification
- ✅ Automatic invalidation on error

### 2. Secure Storage
- ⚠️ Currently: localStorage (vulnerable to XSS)
- 🔮 Recommended: httpOnly cookies

### 3. Request Protection
- ✅ All protected routes require valid token
- ✅ Token sent in Authorization header
- ✅ Automatic 401 handling

### 4. Rate Limiting
- ✅ Login endpoint: 5 attempts per 15 minutes
- ✅ General API: 100 requests per minute

## Best Practices

### For Developers

1. **Always await requireAuth()**
   ```javascript
   await authService.requireAuth();
   ```

2. **Use dataService for API calls**
   ```javascript
   const result = await dataService.updateProduct(id, data);
   ```

3. **Handle errors gracefully**
   ```javascript
   try {
       await dataService.updateProduct(id, data);
   } catch (error) {
       // Error handling (401 auto-handled)
       console.error(error);
   }
   ```

### For Users

1. **Keep credentials secure**
2. **Logout when done**
3. **Don't share admin access**
4. **Report suspicious activity**

## Troubleshooting

### Issue: Immediate redirect after login
**Cause**: JWT_SECRET mismatch or invalid token generation
**Solution**: Verify JWT_SECRET in .env is consistent

### Issue: Token expires too quickly
**Cause**: JWT_EXPIRES_IN set too short
**Solution**: Check JWT_EXPIRES_IN in .env (default: 7d)

### Issue: 401 errors on all requests
**Cause**: Token not being sent or server can't verify
**Solution**: Check Authorization header in Network tab

### Issue: No redirect on 401
**Cause**: _request() interceptor not working
**Solution**: Verify data-service.js has the 401 check

## Monitoring

### Client-Side
- Check localStorage for token presence
- Monitor console for auth warnings
- Watch Network tab for 401 responses

### Server-Side
- Monitor auth middleware logs
- Track failed authentication attempts
- Review rate limiter blocks

## Conclusion

The authentication flow now provides:
- ✅ Robust token validation
- ✅ Automatic error handling
- ✅ Seamless user experience
- ✅ Strong security foundation
- ✅ Easy debugging and monitoring

All authentication issues, including the "Invalid Token" error, have been resolved.
