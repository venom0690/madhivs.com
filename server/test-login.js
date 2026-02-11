const fetch = require('node-fetch');

async function testLogin() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@maadhivs.com',
                password: 'Admin@123'
            })
        });

        const data = await response.json();

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (response.ok && data.token) {
            console.log('\n✅ LOGIN SUCCESS!');
            console.log('Token received:', data.token.substring(0, 50) + '...');
            console.log('Admin:', data.admin);
            process.exit(0);
        } else {
            console.log('\n❌ LOGIN FAILED!');
            console.log('Error:', data.message);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ TEST ERROR:', error.message);
        process.exit(1);
    }
}

testLogin();
