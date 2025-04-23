
document.getElementById('mobile-menu-button').addEventListener('click', function() {
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenu.classList.toggle('hidden');
});

// Set today's date as default for date filter
document.getElementById('dateFilter').valueAsDate = new Date();

function loadOrders(status = 'all', date = null) {
  fetch('http://localhost/tabletop/backend/admin.php?action=get_all_orders')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('ordersContainer');
      let orders = [];
      if (data && data.success && Array.isArray(data.data)) {
        orders = data.data;
      } else if (Array.isArray(data)) {
        orders = data;
      } else {
        if (data && data.error) {
          container.innerHTML = `<p class="text-red-600">${data.error}</p>`;
        } else {
          container.innerHTML = '<p class="text-center py-12 text-gray-500">No orders found</p>';
        }
        return;
      }

      // Filter orders if needed
      let filteredOrders = orders;
      if (status !== 'all') {
        filteredOrders = orders.filter(order => order.status === status);
      }
      if (date) {
        const dateStr = new Date(date).toISOString().split('T')[0];
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.created_at).toISOString().split('T')[0] === dateStr
        );
      }

      if (!Array.isArray(filteredOrders) || filteredOrders.length === 0) {
        container.innerHTML = '<p class="text-center py-12 text-gray-500">No orders found</p>';
        return;
      }

      container.innerHTML = filteredOrders.map(order => {
        const statusColors = {
          'pending': 'bg-yellow-100 text-yellow-800',
          'preparing': 'bg-amber-100 text-amber-800',
          'on the way': 'bg-blue-100 text-blue-800',
          'delivered': 'bg-green-100 text-green-800'
        };
        const statusColor = statusColors[order.status] || 'bg-gray-100 text-gray-800';

        // Render items list
        const itemsList = Array.isArray(order.items) && order.items.length > 0
          ? `<ul class="list-disc ml-6 mt-1 text-sm">${order.items.map(item => `<li><b>${item.name}</b> x${item.quantity} <span class='text-gray-500'>(₹${item.price})</span></li>`).join('')}</ul>`
          : '<div class="text-gray-400 text-sm">No items</div>';

        return `
          <div class="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-xl font-bold text-gray-900">Order #${order.id}</h3>
                <p class="text-sm text-gray-500 mt-1">
                  Placed on: ${new Date(order.created_at).toLocaleString()}
                </p>
                <p class="text-sm text-gray-700 mt-1"><b>Address:</b> ${order.address || '<span class=\'text-gray-400\'>N/A</span>'}</p>
              </div>
              <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColor}">
                ${order.status}
              </span>
            </div>
            <div class="mb-2">
              <b>Items to cook:</b>
              ${itemsList}
            </div>
            <div class="flex justify-between items-center">
              <div class="flex gap-4">
                ${order.status !== 'delivered' ? `
                  <button onclick="updateOrderStatus(${order.id}, '${getNextStatus(order.status)}')"
                          class="text-sm bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">
                    ${getStatusButtonText(order.status)}
                  </button>
                ` : ''}
              </div>
              <p class="text-2xl font-bold text-amber-600">₹${order.total_price}</p>
            </div>
          </div>
        `;
      }).join('');
    });
}

function getNextStatus(currentStatus) {
  const statusFlow = {
    'pending': 'preparing',
    'preparing': 'on the way',
    'on the way': 'delivered'
  };
  return statusFlow[currentStatus] || currentStatus;
}

function getStatusButtonText(currentStatus) {
  const statusTexts = {
    'pending': 'Start Preparing',
    'preparing': 'Mark as On the Way',
    'on the way': 'Mark as Delivered'
  };
  return statusTexts[currentStatus] || 'Update Status';
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch('http://localhost/tabletop/backend/order.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'update_status',
        order_id: orderId,
        status: newStatus
      })
    });
    const data = await res.json();
    if (data.success) {
      alert('Order status updated!');
      loadOrders(
        document.getElementById('statusFilter').value,
        document.getElementById('dateFilter').value
      );
    } else {
      alert(data.error || 'Failed to update order status');
    }
  } catch (error) {
    alert('Failed to update order status');
  }
}

document.getElementById('statusFilter').addEventListener('change', function(e) {
  loadOrders(e.target.value, document.getElementById('dateFilter').value);
});

document.getElementById('dateFilter').addEventListener('change', function(e) {
  loadOrders(document.getElementById('statusFilter').value, e.target.value);
});

loadOrders();