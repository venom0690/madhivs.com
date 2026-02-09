/**
 * API Test Suite for Maadhivs Boutique
 * Tests all critical endpoints
 * 
 * Run: node tests/api-tests.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@maadhivs.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

let authToken = null;
let testCategoryId = null;
let testProductId = null;
let testOrderId = null;
let uploadedFilename = null;

const results = [];
let passed = 0;
let failed = 0;

// Helper: Make HTTP request
function request(method, endpoint, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port || 5000,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Helper: Upload file
function uploadFile(filePath, token) {
    return new Promise((resolve, reject) => {
        const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
        const url = new URL('/api/upload', BASE_URL);

        const fileContent = fs.readFileSync(filePath);
        const filename = path.basename(filePath);

        const body = Buffer.concat([
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="image"; filename="${filename}"\r\n`),
            Buffer.from('Content-Type: image/jpeg\r\n\r\n'),
            fileContent,
            Buffer.from(`\r\n--${boundary}--\r\n`),
        ]);

        const options = {
            hostname: url.hostname,
            port: url.port || 5000,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length,
                'Authorization': `Bearer ${token}`,
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// Test helper
async function test(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
        results.push({ name, status: 'PASSED', error: null });
        passed++;
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        results.push({ name, status: 'FAILED', error: error.message });
        failed++;
    }
}

// Assert helper
function assert(condition, message) {
    if (!condition) throw new Error(message);
}

// ============ TEST SUITES ============

async function testHealth() {
    const res = await request('GET', '/api/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.status === 'success', 'Health check failed');
}

async function testAdminLogin() {
    const res = await request('POST', '/api/admin/login', {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
    });
    assert(res.status === 200, `Login failed with status ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.token, 'No token returned');
    authToken = res.data.token;
}

async function testCategoryCreate() {
    const res = await request('POST', '/api/categories', {
        name: 'Test Category',
        type: 'Men',
        subCategories: ['Shirts', 'Pants'],
    }, authToken);
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.data.category._id, 'No category ID returned');
    testCategoryId = res.data.data.category._id;
}

async function testCategoryList() {
    const res = await request('GET', '/api/categories');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data.categories), 'Categories not an array');
}

async function testCategoryUpdate() {
    const res = await request('PUT', `/api/categories/${testCategoryId}`, {
        name: 'Updated Test Category',
    }, authToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.category.name === 'Updated Test Category', 'Name not updated');
}

async function testProductCreate() {
    const res = await request('POST', '/api/products', {
        name: 'Test Product',
        price: 999,
        category: testCategoryId,
        subCategory: 'Shirts',
        stock: 10,
        description: 'Test description',
        sizes: ['S', 'M', 'L'],
        colors: ['Red', 'Blue'],
        primaryImage: '/uploads/test.jpg',
        images: ['/uploads/test1.jpg', '/uploads/test2.jpg', '/uploads/test3.jpg'],
    }, authToken);
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.data.product._id, 'No product ID returned');
    testProductId = res.data.data.product._id;
}

async function testProductList() {
    const res = await request('GET', '/api/products');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data.products), 'Products not an array');
}

async function testProductGetById() {
    const res = await request('GET', `/api/products/id/${testProductId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.product.name === 'Test Product', 'Product name mismatch');
}

async function testProductUpdate() {
    const res = await request('PUT', `/api/products/${testProductId}`, {
        name: 'Updated Test Product',
        price: 1299,
    }, authToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.product.price === 1299, 'Price not updated');
}

async function testProductToggle() {
    const res = await request('PATCH', `/api/products/${testProductId}/toggle`, {
        field: 'isTrending',
        value: true,
    }, authToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.product.isTrending === true, 'Toggle failed');
}

async function testOrderCreate() {
    const res = await request('POST', '/api/orders', {
        customerInfo: {
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '1234567890',
        },
        items: [{
            product: testProductId,
            name: 'Test Product',
            price: 1299,
            quantity: 2,
            size: 'M',
        }],
        shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            pincode: '12345',
            country: 'India',
        },
        totalAmount: 2598,
    });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.data.order._id, 'No order ID returned');
    testOrderId = res.data.data.order._id;
}

async function testOrderList() {
    const res = await request('GET', '/api/orders', null, authToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data.orders), 'Orders not an array');
}

async function testOrderStatusUpdate() {
    const res = await request('PATCH', `/api/orders/${testOrderId}/status`, {
        orderStatus: 'Shipped',
    }, authToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.order.orderStatus === 'Shipped', 'Status not updated');
}

// Cleanup tests
async function cleanupProduct() {
    if (testProductId) {
        const res = await request('DELETE', `/api/products/${testProductId}`, null, authToken);
        assert(res.status === 200, `Failed to delete product: ${res.status}`);
    }
}

async function cleanupCategory() {
    if (testCategoryId) {
        const res = await request('DELETE', `/api/categories/${testCategoryId}`, null, authToken);
        assert(res.status === 200, `Failed to delete category: ${res.status}`);
    }
}

// Generate report
function generateReport() {
    const timestamp = new Date().toISOString();
    let report = `# API Test Results\n\n`;
    report += `**Date:** ${timestamp}\n`;
    report += `**Base URL:** ${BASE_URL}\n\n`;
    report += `## Summary\n\n`;
    report += `- ✅ Passed: ${passed}\n`;
    report += `- ❌ Failed: ${failed}\n`;
    report += `- Total: ${passed + failed}\n\n`;
    report += `## Test Results\n\n`;
    report += `| Test | Status | Error |\n`;
    report += `|------|--------|-------|\n`;

    for (const r of results) {
        const status = r.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED';
        const error = r.error || '-';
        report += `| ${r.name} | ${status} | ${error} |\n`;
    }

    const reportPath = path.join(__dirname, '..', '..', 'docs', 'API_TEST_RESULTS.md');
    const docsDir = path.dirname(reportPath);

    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Report saved to: ${reportPath}`);
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting API Tests...\n');
    console.log(`Base URL: ${BASE_URL}\n`);

    // Health & Auth
    await test('Health Check', testHealth);
    await test('Admin Login', testAdminLogin);

    if (!authToken) {
        console.log('\n⚠️ Cannot continue without auth token');
        generateReport();
        return;
    }

    // Category Tests
    await test('Create Category', testCategoryCreate);
    await test('List Categories', testCategoryList);
    await test('Update Category', testCategoryUpdate);

    // Product Tests
    await test('Create Product', testProductCreate);
    await test('List Products', testProductList);
    await test('Get Product by ID', testProductGetById);
    await test('Update Product', testProductUpdate);
    await test('Toggle Product Flag', testProductToggle);

    // Order Tests
    await test('Create Order', testOrderCreate);
    await test('List Orders', testOrderList);
    await test('Update Order Status', testOrderStatusUpdate);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await test('Delete Test Product', cleanupProduct);
    await test('Delete Test Category', cleanupCategory);

    // Summary
    console.log('\n========================================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('========================================\n');

    generateReport();
}

// Run
runTests().catch(console.error);
