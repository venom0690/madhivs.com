/**
 * Dashboard Logic
 * Fixed with proper async/await for API calls
 */

// Auth guard
authService.requireAuth();

// Load user info
const user = authService.getCurrentUser();
if (user) {
    document.getElementById('userName').textContent = user.email.split('@')[0];
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', () => {
    authService.logout();
});

// Load statistics
async function loadStatistics() {
    try {
        const stats = await dataService.getStatistics();

        document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
        document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
        document.getElementById('totalCategories').textContent = stats.totalCategories || 0;
        document.getElementById('pendingOrders').textContent = stats.pendingOrders || 0;
    } catch (error) {
        console.error('Error loading statistics:', error);
        document.getElementById('totalProducts').textContent = '-';
        document.getElementById('totalOrders').textContent = '-';
        document.getElementById('totalCategories').textContent = '-';
        document.getElementById('pendingOrders').textContent = '-';
    }
}

// Load recent orders
async function loadRecentOrders() {
    const container = document.getElementById('recentOrdersContainer');

    try {
        const orders = await dataService.getOrders();
        const recentOrders = orders.slice(-5).reverse(); // Last 5 orders

        if (recentOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-text">No orders yet</div>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentOrders.map(order => {
            const orderId = order.id;
            const orderStatus = order.orderStatus || order.order_status || 'Pending';
            const customerName = order.customerInfo?.name || order.customer_name || 'N/A';

            return `
                            <tr>
                                <td>${order.orderNumber || orderId}</td>
                                <td>${customerName}</td>
                                <td>₹${order.totalAmount.toLocaleString()}</td>
                                <td>
                                    <span class="badge ${orderStatus === 'Delivered' ? 'badge-success' :
                    orderStatus === 'Shipped' ? 'badge-warning' :
                        'badge-primary'
                }">
                                        ${orderStatus}
                                    </span>
                                </td>
                                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                            </tr>
                        `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Failed to load orders</div>
            </div>
        `;
    }
}

// Initialize dashboard
loadStatistics();
loadRecentOrders();
