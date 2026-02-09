/**
 * Orders Management Logic
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

// Modal elements
const modal = document.getElementById('orderModal');
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('closeDetailsBtn').addEventListener('click', closeModal);

// Filter handler
document.getElementById('statusFilter').addEventListener('change', loadOrders);

// Close modal
function closeModal() {
    modal.classList.remove('show');
}

// Update order status - FIXED with async/await
async function updateOrderStatus(orderId, newStatus) {
    try {
        await dataService.updateOrderStatus(orderId, newStatus);
        await loadOrders();
    } catch (error) {
        alert(error.message);
    }
}

// View order details
function viewOrderDetails(order) {
    const container = document.getElementById('orderDetailsContainer');
    const orderId = order.id;
    const orderStatus = order.orderStatus || order.order_status || 'Pending';

    container.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 0.5rem; color: var(--text-primary);">Order Information</h4>
            <div style="display: grid; grid-template-columns: 150px 1fr; gap: 0.5rem; font-size: 14px;">
                <div style="color: var(--text-secondary);">Order ID:</div>
                <div><strong>${order.orderNumber || orderId}</strong></div>
                
                <div style="color: var(--text-secondary);">Date:</div>
                <div>${new Date(order.createdAt).toLocaleString()}</div>
                
                <div style="color: var(--text-secondary);">Status:</div>
                <div>
                    <select class="form-select" style="max-width: 200px;" onchange="updateOrderStatus('${orderId}', this.value)">
                        <option value="Pending" ${orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Processing" ${orderStatus === 'Processing' ? 'selected' : ''}>Processing</option>
                        <option value="Shipped" ${orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 0.5rem; color: var(--text-primary);">Customer Information</h4>
            <div style="display: grid; grid-template-columns: 150px 1fr; gap: 0.5rem; font-size: 14px;">
                <div style="color: var(--text-secondary);">Name:</div>
                <div>${order.customerInfo?.name || order.customerName || 'N/A'}</div>
                
                <div style="color: var(--text-secondary);">Email:</div>
                <div>${order.customerInfo?.email || order.customerEmail || 'N/A'}</div>
                
                <div style="color: var(--text-secondary);">Phone:</div>
                <div>${order.customerInfo?.phone || order.customerPhone || 'N/A'}</div>
                
                <div style="color: var(--text-secondary);">Address:</div>
                <div>${formatAddress(order.shippingAddress)}</div>
            </div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 0.5rem; color: var(--text-primary);">Order Items</h4>
            <table style="width: 100%; font-size: 14px;">
                <thead>
                    <tr style="background-color: var(--bg-main);">
                        <th style="padding: 0.5rem; text-align: left;">Product</th>
                        <th style="padding: 0.5rem; text-align: center;">Size</th>
                        <th style="padding: 0.5rem; text-align: center;">Qty</th>
                        <th style="padding: 0.5rem; text-align: right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td style="padding: 0.5rem;">${item.name}</td>
                            <td style="padding: 0.5rem; text-align: center;">${item.size || 'N/A'}</td>
                            <td style="padding: 0.5rem; text-align: center;">${item.quantity}</td>
                            <td style="padding: 0.5rem; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr style="border-top: 2px solid var(--border); font-weight: 600;">
                        <td colspan="3" style="padding: 0.75rem; text-align: right;">Total:</td>
                        <td style="padding: 0.75rem; text-align: right;">₹${order.totalAmount.toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;

    modal.classList.add('show');
}

// Format address
function formatAddress(address) {
    if (!address || Object.keys(address).length === 0) {
        return 'N/A';
    }

    const parts = [
        address.street || address.addressLine1,
        address.city,
        address.state,
        address.zip || address.zipCode || address.pincode,
        address.country
    ].filter(part => part);

    return parts.join(', ') || 'N/A';
}

// Load orders table - FIXED with async/await
async function loadOrders() {
    const statusFilter = document.getElementById('statusFilter').value;
    const container = document.getElementById('ordersTableContainer');

    try {
        let orders = await dataService.getOrders();

        // Apply filter
        if (statusFilter !== 'All') {
            orders = orders.filter(order => (order.orderStatus || order.status) === statusFilter);
        }

        // Sort by date (newest first)
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🛒</div>
                    <div class="empty-state-text">No orders found</div>
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
                            <th>Email</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => {
            const orderId = order.id;
            const orderStatus = order.orderStatus || order.order_status || 'Pending';
            const customerName = order.customerInfo?.name || order.customer_name || 'N/A';
            const customerEmail = order.customerInfo?.email || order.customer_email || 'N/A';

            return `
                            <tr>
                                <td><strong>${order.orderNumber || orderId}</strong></td>
                                <td>${customerName}</td>
                                <td>${customerEmail}</td>
                                <td>${order.items.length} item(s)</td>
                                <td><strong>₹${order.totalAmount.toLocaleString()}</strong></td>
                                <td>
                                    <span class="badge ${orderStatus === 'Delivered' ? 'badge-success' :
                    orderStatus === 'Shipped' ? 'badge-warning' :
                        orderStatus === 'Cancelled' ? 'badge-danger' :
                            'badge-primary'
                }">
                                        ${orderStatus}
                                    </span>
                                </td>
                                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button class="btn btn-secondary btn-sm" onclick='viewOrderById("${orderId}")'>
                                        View Details
                                    </button>
                                </td>
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
                <div>${error.message}</div>
                <button class="btn btn-primary mt-1" onclick="loadOrders()">Retry</button>
            </div>
        `;
    }
}

// View order by ID (fetch fresh data)
async function viewOrderById(orderId) {
    try {
        const order = await dataService.getOrderById(orderId);
        if (order) {
            viewOrderDetails(order);
        } else {
            alert('Order not found');
        }
    } catch (error) {
        alert('Failed to load order: ' + error.message);
    }
}

// Make functions globally accessible
window.viewOrderDetails = viewOrderDetails;
window.viewOrderById = viewOrderById;
window.updateOrderStatus = updateOrderStatus;
window.loadOrders = loadOrders;

// Initialize
loadOrders();
