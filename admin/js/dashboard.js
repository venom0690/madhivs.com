/**
 * Dashboard Logic
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
function loadStatistics() {
    const stats = dataService.getStatistics();

    document.getElementById('totalProducts').textContent = stats.totalProducts;
    document.getElementById('totalOrders').textContent = stats.totalOrders;
    document.getElementById('totalCategories').textContent = stats.totalCategories;
    document.getElementById('pendingOrders').textContent = stats.pendingOrders;
}

// Load recent orders
function loadRecentOrders() {
    const orders = dataService.getOrders();
    const recentOrders = orders.slice(-5).reverse(); // Last 5 orders

    const container = document.getElementById('recentOrdersContainer');

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
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentOrders.map(order => `
                        <tr>
                            <td>${order.id.substring(0, 12)}...</td>
                            <td>${order.customerName}</td>
                            <td>₹${order.totalAmount.toLocaleString()}</td>
                            <td>
                                <span class="badge ${order.status === 'Delivered' ? 'badge-success' :
            order.status === 'Shipped' ? 'badge-warning' :
                'badge-danger'
        }">
                                    ${order.status}
                                </span>
                            </td>
                            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = tableHTML;
}

// Initialize dashboard
loadStatistics();
loadRecentOrders();
